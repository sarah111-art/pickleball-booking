import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PricingSection = () => {
  const timeSlots = [
    {
      time: "06:00 - 09:00",
      label: "Giờ Sáng Sớm",
      price: "150.000đ",
      features: ["Không khí mát mẻ", "Ít người", "Phù hợp tập luyện"],
    },
    {
      time: "09:00 - 16:00",
      label: "Giờ Hành Chính",
      price: "200.000đ",
      features: ["Thời gian linh hoạt", "Phù hợp freelancer", "Có nhiều slot"],
      popular: true,
    },
    {
      time: "16:00 - 22:00",
      label: "Giờ Cao Điểm",
      price: "250.000đ",
      features: ["Sau giờ làm việc", "Ánh sáng tốt nhất", "Sôi động nhất"],
    },
  ];

  return (
    <section className="py-12 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <div className="container px-4 ">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Bảng Giá & Khung Giờ</h2>
          <p className="text-lg text-muted-foreground">Giá cả minh bạch, phù hợp mọi nhu cầu</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {timeSlots.map((slot, index) => (
            <Card 
              key={index}
              className={`relative shadow-card hover:shadow-card-hover transition-all duration-300 ${
                slot.popular ? 'border-2 border-primary scale-105' : ''
              }`}
            >
              {slot.popular && (
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2
                          bg-gradient-to-r from-[#4f46e5] to-[#22d3ee]
                          px-4 py-1 rounded-full text-sm font-semibold
                          text-white"
              >
                Phổ biến nhất
              </div>
              )}
              <CardHeader className="text-center pb-4">
                <div className="text-sm font-semibold text-primary mb-2">{slot.time}</div>
                <CardTitle className="text-xl mb-2">{slot.label}</CardTitle>
                <div className="text-4xl font-bold text-primary">{slot.price}</div>
                <div className="text-sm text-muted-foreground">mỗi giờ</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {slot.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            * Giá trên chưa bao gồm VAT. Giảm 20% cho khách hàng đặt sân cố định hàng tuần.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
