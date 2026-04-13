import { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number; // ms
}

const BALLS = ["🏓", "🎾", "🏸"];

const SplashScreen = ({ onFinish, duration = 2600 }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"visible" | "fade-out">("visible");

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setPhase("fade-out"), duration - 500);
    const doneTimer = window.setTimeout(onFinish, duration);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onFinish, duration]);

  return (
    <div
      className={[
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
        "bg-gradient-to-br from-sky-600 via-cyan-500 to-teal-400",
        "transition-opacity duration-500",
        phase === "fade-out" ? "opacity-0 pointer-events-none" : "opacity-100",
      ].join(" ")}
      aria-hidden="true"
    >
      {/* Decorative blurry blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-60 w-60 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Floating balls */}
      {BALLS.map((ball, i) => (
        <span
          key={ball}
          className="absolute text-4xl select-none pointer-events-none"
          style={{
            top: `${[18, 72, 42][i]}%`,
            left: `${[14, 78, 65][i]}%`,
            opacity: 0.25,
            animation: `splash-float ${2 + i * 0.5}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`,
          }}
        >
          {ball}
        </span>
      ))}

      {/* Main card */}
      <div
        className="relative flex flex-col items-center gap-5 px-10 py-10 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 shadow-2xl"
        style={{ animation: "splash-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
      >
        {/* Logo */}
        <div className="relative h-24 w-24">
          <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-white/70 shadow-lg">
            <img
              src="https://res.cloudinary.com/di7d0xja0/image/upload/v1775878449/image_xczpsy.jpg"
              alt="Pickleball logo"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>
          {/* Spinning ring */}
          <span
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-white/70"
            style={{ animation: "splash-spin 1.1s linear infinite" }}
          />
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1
            className="text-4xl font-black tracking-tight text-white drop-shadow-md"
            style={{ animation: "splash-rise 0.6s 0.2s both" }}
          >
            Sân Pickleball
          </h1>
          <p
            className="mt-2 text-base font-medium text-white/80"
            style={{ animation: "splash-rise 0.6s 0.35s both" }}
          >
            Đặt sân nhanh · Chơi vui · Kết nối cộng đồng
          </p>
        </div>

        {/* Loading dots */}
        <div
          className="flex gap-2"
          style={{ animation: "splash-rise 0.6s 0.5s both" }}
          aria-label="Đang tải..."
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-white"
              style={{
                animation: "splash-bounce 1s ease-in-out infinite",
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom tagline */}
      <p
        className="absolute bottom-10 text-sm text-white/60 font-medium tracking-wide"
        style={{ animation: "splash-rise 0.7s 0.7s both" }}
      >
        © 2026 Pickleball Vietnam
      </p>
    </div>
  );
};

export default SplashScreen;
