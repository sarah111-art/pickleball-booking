import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ChatConversation } from '../../entities/chat-conversation.entity';
import { ChatMessage } from '../../entities/chat-message.entity';
import { Venue } from '../../entities/venue.entity';
import { Court } from '../../entities/court.entity';

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  conversationId?: string;
}

interface SearchParams {
  district?: string;
  maxPrice?: number;
  timeSlot?: 'morning' | 'afternoon' | 'evening';
}

@Injectable()
export class ChatService {
  private readonly openaiApiKey: string;
  private readonly geminiApiKey: string;
  private readonly aiProvider: 'openai' | 'gemini' | 'rule-based';

  constructor(
    @InjectRepository(ChatConversation)
    private conversationRepo: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private messageRepo: Repository<ChatMessage>,
    @InjectRepository(Venue)
    private venueRepo: Repository<Venue>,
    @InjectRepository(Court)
    private courtRepo: Repository<Court>,
    private configService: ConfigService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    
    // Determine which AI provider to use
    if (this.openaiApiKey) {
      this.aiProvider = 'openai';
    } else if (this.geminiApiKey) {
      this.aiProvider = 'gemini';
    } else {
      this.aiProvider = 'rule-based';
    }
  }

  async createConversation(userId?: string) {
    const conversation = this.conversationRepo.create({ userId });
    return this.conversationRepo.save(conversation);
  }

  async getConversation(id: string) {
    const conversation = await this.conversationRepo.findOne({
      where: { id },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async sendMessage(userId: string | undefined, request: ChatRequest) {
    let conversation: ChatConversation;

    // Get or create conversation
    if (request.conversationId) {
      conversation = await this.getConversation(request.conversationId);
    } else {
      conversation = await this.createConversation(userId);
    }

    // Save user message
    const userMessage = this.messageRepo.create({
      conversationId: conversation.id,
      role: 'user',
      content: request.messages[request.messages.length - 1].content,
    });
    await this.messageRepo.save(userMessage);

    // System prompt
    const systemPrompt = `Bạn là trợ lý AI thông minh của hệ thống đặt sân Pickleball tại TP.HCM. Nhiệm vụ của bạn:

1. THÔNG TIN CẦN THU THẬP:
   - Khu vực ưa thích (Quận 1, Quận 7, Quận 3...)
   - Thời gian muốn chơi (ngày, giờ cụ thể hoặc khung giờ: sáng/chiều/tối)
   - Ngân sách (dưới 200k, 200-300k, trên 300k/giờ)
   - Số người chơi (để đề xuất sân phù hợp)

2. CÁCH TƯƠNG TÁC:
   - Hỏi từng thông tin một cách tự nhiên, thân thiện
   - Nếu khách hàng đưa nhiều thông tin cùng lúc, xác nhận lại
   - Đưa ra gợi ý dựa trên thông tin đã có

3. SAU KHI CÓ ĐỦ THÔNG TIN:
   - Gọi function search_courts để tìm sân phù hợp
   - Giới thiệu các sân phù hợp với giá, địa chỉ
   - Hướng dẫn khách đặt sân

4. PHONG CÁCH:
   - Nhiệt tình, chuyên nghiệp
   - Trả lời ngắn gọn, súc tích (2-3 câu mỗi lần)
   - Dùng emoji phù hợp
   - Luôn kêu gọi hành động tiếp theo

Ví dụ câu hỏi đầu tiên: "Chào bạn! 👋 Mình có thể giúp bạn tìm sân Pickleball phù hợp. Bạn muốn chơi ở khu vực nào ạ?"`;

    // Use rule-based chatbot if no API keys
    if (this.aiProvider === 'rule-based') {
      return this.handleRuleBasedChat(conversation, request);
    }

    // Prepare messages for AI
    const aiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...request.messages,
    ];

    try {
      let aiResponse: any;
      let toolCalls: any[] = [];

      if (this.aiProvider === 'openai') {
        // Use OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: aiMessages,
            tools: [
              {
                type: 'function',
                function: {
                  name: 'search_courts',
                  description: 'Tìm kiếm sân Pickleball phù hợp dựa trên tiêu chí của khách hàng. Chỉ gọi khi đã có ít nhất khu vực hoặc thời gian.',
                  parameters: {
                    type: 'object',
                    properties: {
                      district: {
                        type: 'string',
                        description: 'Quận/khu vực (ví dụ: "Quận 1", "Quận 7", "Q1")',
                      },
                      maxPrice: {
                        type: 'number',
                        description: 'Giá tối đa mỗi giờ (VND)',
                      },
                      timeSlot: {
                        type: 'string',
                        enum: ['morning', 'afternoon', 'evening'],
                        description: 'Khung giờ: morning (6h-12h), afternoon (12h-18h), evening (18h-22h)',
                      },
                    },
                    required: [],
                  },
                },
              },
            ],
            tool_choice: 'auto',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error:', response.status, errorText);
          // Fallback to rule-based
          return this.handleRuleBasedChat(conversation, request);
        }

        const data = await response.json();
        aiResponse = data.choices[0].message;
        toolCalls = aiResponse.tool_calls || [];
      } else if (this.aiProvider === 'gemini') {
        // Use Google Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: aiMessages.map(msg => ({
              role: msg.role === 'system' ? 'user' : msg.role,
              parts: [{ text: msg.content }],
            })),
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini API error:', response.status, errorText);
          // Fallback to rule-based
          return this.handleRuleBasedChat(conversation, request);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        aiResponse = { content: text };
        toolCalls = [];
      }

      // Handle tool calls
      if (toolCalls.length > 0) {
        const toolCall = toolCalls[0];

        if (toolCall.function.name === 'search_courts') {
          const params: SearchParams = JSON.parse(toolCall.function.arguments);
          const searchResults = await this.searchCourts(params);

          // Generate response with search results
          const finalMessage = this.formatSearchResults(searchResults);

          // Save assistant message with search results
          const assistantMessage = this.messageRepo.create({
            conversationId: conversation.id,
            role: 'assistant',
            content: finalMessage,
            metadata: { searchResults: searchResults.slice(0, 5) },
          });
          await this.messageRepo.save(assistantMessage);

          return {
            message: finalMessage,
            searchResults: searchResults.slice(0, 5),
            conversationId: conversation.id,
          };
        }
      }

      // Save regular assistant message
      const assistantMessage = this.messageRepo.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
      });
      await this.messageRepo.save(assistantMessage);

      return {
        message: aiResponse.content,
        conversationId: conversation.id,
      };
    } catch (error) {
      console.error('Error in chat service:', error);
      // Fallback to rule-based
      return this.handleRuleBasedChat(conversation, request);
    }
  }

  private async searchCourts(params: SearchParams) {
    // Build query for venues with courts
    let query = this.venueRepo
      .createQueryBuilder('venue')
      .leftJoinAndSelect('venue.courts', 'court', 'court.isActive = :isActive', { isActive: true });

    if (params.district) {
      const districtSearch = params.district.toLowerCase().replace(/[^0-9]/g, '');
      query = query.where('venue.district LIKE :district', { district: `%${districtSearch}%` });
    }

    const venues = await query.getMany();

    // Format results
    const results = venues
      .filter((v) => v.courts && v.courts.length > 0)
      .map((venue) => {
        // Calculate average price from courts
        const activeCourts = venue.courts.filter((c: any) => c.isActive);
        const avgPrice = activeCourts.length > 0
          ? Math.round(activeCourts.reduce((sum: number, c: any) => sum + (Number(c.pricePerHour) || 250000), 0) / activeCourts.length)
          : 250000; // Default price

        return {
          name: venue.name,
          address: `${venue.address || ''}, ${venue.district || ''}, ${venue.city || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
          district: venue.district,
          courtCount: activeCourts.length,
          price: avgPrice,
          venueId: venue.id,
        };
      });

    // Filter by price if specified
    if (params.maxPrice !== undefined && params.maxPrice !== null) {
      return results.filter((r) => r.price <= params.maxPrice!);
    }

    return results;
  }

  private async handleRuleBasedChat(conversation: ChatConversation, request: ChatRequest) {
    const userMessage = request.messages[request.messages.length - 1].content.toLowerCase();
    const allMessages = request.messages.map(m => m.content.toLowerCase()).join(' ');

    // Extract information from conversation
    const districtMatch = allMessages.match(/(?:quận|q|district)\s*(\d+)/i);
    const priceMatch = allMessages.match(/(\d+)\s*(?:k|nghìn|triệu)/i);
    const timeMatch = allMessages.match(/(sáng|chiều|tối|morning|afternoon|evening)/i);

    let response = '';
    let searchResults: any[] = [];

    // Check if user wants to search
    if (districtMatch || priceMatch || timeMatch || userMessage.includes('tìm') || userMessage.includes('sân')) {
      const params: SearchParams = {};
      
      if (districtMatch) {
        params.district = `Quận ${districtMatch[1]}`;
      }
      
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        params.maxPrice = price < 1000 ? price * 1000 : price; // Convert k to full amount
      }

      if (timeMatch) {
        const time = timeMatch[1].toLowerCase();
        if (time.includes('sáng') || time === 'morning') params.timeSlot = 'morning';
        else if (time.includes('chiều') || time === 'afternoon') params.timeSlot = 'afternoon';
        else if (time.includes('tối') || time === 'evening') params.timeSlot = 'evening';
      }

      searchResults = await this.searchCourts(params);

      if (searchResults.length > 0) {
        response = this.formatSearchResults(searchResults);
      } else {
        response = 'Xin lỗi, mình không tìm thấy sân phù hợp với tiêu chí của bạn. Bạn có thể thử tìm kiếm với tiêu chí khác không? 😊';
      }
    } else if (userMessage.includes('chào') || userMessage.includes('hello') || userMessage.includes('xin chào')) {
      response = 'Chào bạn! 👋 Mình có thể giúp bạn tìm sân Pickleball phù hợp. Bạn muốn chơi ở khu vực nào ạ?';
    } else if (userMessage.includes('giá') || userMessage.includes('price') || userMessage.includes('cost')) {
      response = 'Giá sân Pickleball thường từ 200k - 500k/giờ tùy theo địa điểm và thời gian. Bạn có ngân sách bao nhiêu ạ? 💰';
    } else if (userMessage.includes('giờ') || userMessage.includes('time') || userMessage.includes('khi nào')) {
      response = 'Các sân thường mở từ 6h sáng đến 22h tối. Bạn muốn chơi vào khung giờ nào? (sáng/chiều/tối) ⏰';
    } else {
      response = 'Mình có thể giúp bạn tìm sân Pickleball. Bạn có thể cho mình biết:\n- Khu vực muốn chơi (ví dụ: Quận 1, Quận 7...)\n- Thời gian (sáng/chiều/tối)\n- Ngân sách (ví dụ: 300k/giờ)\n\nHoặc bạn có thể nói "tìm sân" để mình tìm giúp bạn! 😊';
    }

    // Save assistant message
    const assistantMessage = this.messageRepo.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: response,
      metadata: searchResults.length > 0 ? { searchResults: searchResults.slice(0, 5) } : undefined,
    });
    await this.messageRepo.save(assistantMessage);

    return {
      message: response,
      searchResults: searchResults.length > 0 ? searchResults.slice(0, 5) : undefined,
      conversationId: conversation.id,
    };
  }

  private formatSearchResults(results: any[]): string {
    if (results.length === 0) {
      return 'Xin lỗi, mình không tìm thấy sân phù hợp. Bạn có thể thử tìm kiếm với tiêu chí khác không? 😊';
    }

    let message = `Mình tìm thấy ${results.length} sân phù hợp:\n\n`;
    
    results.slice(0, 5).forEach((result, index) => {
      message += `${index + 1}. **${result.name}**\n`;
      message += `   📍 ${result.address}\n`;
      message += `   🏟️ ${result.courtCount} sân | 💰 ${result.price.toLocaleString('vi-VN')}đ/giờ\n\n`;
    });

    message += 'Bạn có thể click "Đặt ngay" để đặt sân ngay nhé! 🎾';
    
    return message;
  }
}

