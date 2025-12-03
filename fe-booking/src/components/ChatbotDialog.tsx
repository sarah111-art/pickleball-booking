import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  searchResults?: Array<{
    name: string;
    address: string;
    district: string;
    courtCount: number;
    price: number;
    venueId: string;
  }>;
}

interface ChatbotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChatbotDialog = ({ open, onOpenChange }: ChatbotDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      initializeChat();
    }
  }, [open]);

  const initializeChat = async () => {
    try {
      // Create new conversation via API
      const res = await api.post<{ id: string }>('/chat/conversation', {});
      
      if (res.error) throw new Error(res.error);
      
      if (res.data) {
        setConversationId(res.data.id);
      }
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: 'Chào bạn! 👋 Mình có thể giúp bạn tìm sân Pickleball phù hợp. Bạn muốn chơi ở khu vực nào ạ?'
      }]);
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể khởi tạo chat. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post<{
        message: string;
        searchResults?: Array<{
          name: string;
          address: string;
          district: string;
          courtCount: number;
          price: number;
          venueId: string;
        }>;
        conversationId?: string;
      }>('/chat/message', {
        messages: [...messages, { role: 'user' as const, content: userMessage }],
        conversationId
      });

      if (response.error) throw new Error(response.error);

      if (response.data) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.message,
          searchResults: response.data.searchResults
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update conversation ID if returned
        if (response.data.conversationId) {
          setConversationId(response.data.conversationId);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi tin nhắn. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleBookCourt = (venueId: string) => {
    onOpenChange(false);
    navigate(`/booking?venue=${venueId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl">Trợ lý đặt sân AI 🤖</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {message.searchResults && message.searchResults.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.searchResults.map((result, idx) => (
                      <Card key={idx} className="p-3 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{result.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{result.address}</p>
                            <div className="flex gap-3 mt-2 text-xs">
                              <span>🏟️ {result.courtCount} sân</span>
                              <span>💰 {result.price?.toLocaleString()}đ/giờ</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleBookCourt(result.venueId)}
                            className="shrink-0"
                          >
                            Đặt ngay
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotDialog;