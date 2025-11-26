import { Shield, Zap, Users, Award } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Zap,
      title: "Đặt Sân Nhanh Chóng",
      description: "Chỉ 30 giây để hoàn tất đặt sân online, xác nhận ngay lập tức"
    },
    {
      icon: Shield,
      title: "An Toàn & Bảo Mật",
      description: "Thanh toán an toàn, thông tin được bảo mật tuyệt đối"
    },
    {
      icon: Users,
      title: "Cộng Đồng Năng Động",
      description: "Kết nối với hàng nghìn người chơi Pickleball trên toàn quốc"
    },
    {
      icon: Award,
      title: "Sân Chất Lượng Cao",
      description: "Sân đạt chuẩn quốc tế, trang thiết bị hiện đại, sạch sẽ"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Tại Sao Chọn Chúng Tôi?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Chúng tôi cam kết mang đến trải nghiệm đặt sân tốt nhất cho người chơi Pickleball
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="text-center p-6 rounded-xl hover:bg-gray-100 transition-colors duration-300 group"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
