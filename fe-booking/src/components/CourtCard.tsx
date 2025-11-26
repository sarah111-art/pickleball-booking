import { MapPin, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CourtCardProps {
  name: string;
  image: string;
  location: string;
  capacity: string;
  price: string;
  available: boolean;
}

const CourtCard = ({ name, image, location, capacity, price, available }: CourtCardProps) => {
  return (
    <Card className="overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group">
      <div className="relative h-64 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {available && (
          <Badge className="absolute top-4 right-4 bg-accent">
            Còn trống
          </Badge>
        )}
      </div>
      <CardContent className="p-6">
        <h3 className="text-2xl font-bold mb-3">{name}</h3>
        <div className="space-y-2 text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>{capacity}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-2xl font-bold text-primary">{price}</span>
            <span className="text-sm">/giờ</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button className="w-full" size="lg" variant={available ? "default" : "secondary"}>
          {available ? "Đặt Sân Ngay" : "Xem Lịch Trống"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourtCard;
