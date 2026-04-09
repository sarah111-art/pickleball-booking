import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const LoadingSpinner = ({ size = "md", text }: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: { icon: 20, container: "py-4" },
    md: { icon: 32, container: "py-8" },
    lg: { icon: 48, container: "py-12" },
  };

  const config = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${config.container}`}>
      <Loader2
        size={config.icon}
        className="animate-spin text-primary"
      />
      {text && <p className="text-muted-foreground text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
