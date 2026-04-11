import { useNavigate } from "react-router-dom";
import { MapPin, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CourtCardProps {
  id?: string;
  name: string;
  image: string;
  location: string;
  venueName?: string;
  venueId?: string;
  capacity: string;
  price: string;
  available: boolean;
}

const CourtCard = ({ id, name, image, location, venueName, venueId, capacity, price, available }: CourtCardProps) => {
  const navigate = useNavigate();

  const handleViewDetail = () => {
    if (!id) {
      return;
    }

    navigate(`/courts/${id}`);
  };

  const handleBooking = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (available && id && venueId) {
      // Navigate to booking with court data pre-filled
      navigate("/booking", {
        state: {
          courtId: id,
          courtName: name,
          venueId: venueId,
          venueName: venueName || location,
        }
      });
    } else {
      // Navigate to schedule to view availability
      navigate("/schedule");
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover group",
        id ? "cursor-pointer" : "cursor-default",
      )}
      onClick={handleViewDetail}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && id) {
          event.preventDefault();
          handleViewDetail();
        }
      }}
      role={id ? "button" : undefined}
      tabIndex={id ? 0 : -1}
    >
      <div className="relative h-48 sm:h-64 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-court.jpg";
          }}
        />
        {available && (
          <Badge className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-accent text-xs sm:text-sm">
            Còn trống
          </Badge>
        )}
      </div>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 line-clamp-1">{name}</h3>
        {venueName && (
          <p className="text-sm text-primary font-medium mb-2 line-clamp-1">{venueName}</p>
        )}
        <div className="space-y-1.5 sm:space-y-2 text-muted-foreground text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="line-clamp-1">{capacity}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="text-xl sm:text-2xl font-bold text-primary">{price}</span>
            <span className="text-xs sm:text-sm">/giờ</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 sm:p-6 pt-0">
        <Button 
          className="w-full" 
          size="lg" 
          variant={available ? "default" : "secondary"}
          onClick={handleBooking}
        >
          {available ? "Đặt Sân Ngay" : "Xem Lịch Trống"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourtCard;
