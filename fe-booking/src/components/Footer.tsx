import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
          <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#4f46e5] to-[#22d3ee] bg-clip-text text-transparent">
            Pickleball Việt
          </h3>
            <p className="text-muted-foreground mb-4">
              Hệ thống đặt sân Pickleball hàng đầu Việt Nam
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Liên Kết</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Về Chúng Tôi</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Danh Sách Sân</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Bảng Giá</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tin Tức</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Hỗ Trợ</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Hướng Dẫn Đặt Sân</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Chính Sách Huỷ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Điều Khoản</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Liên Hệ</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>0901 234 567</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>contact@pickleballviet.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>123 Đường ABC, Quận 1, TP.HCM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 Pickleball Việt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
