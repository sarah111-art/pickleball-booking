import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Booking from "./pages/Booking";
import CourtDetail from "./pages/CourtDetail";
import Schedule from "./pages/Schedule";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCallback from "./pages/PaymentCallback";
import MyBookings from "./pages/MyBookings";
import Rackets from "./pages/Rackets";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import NotFound from "./pages/NotFound";
import ChatbotButton from "./components/ChatbotButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/courts/:id" element={<CourtDetail />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/rackets" element={<Rackets />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<NewsDetail />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />
          <Route path="/payment/success" element={<PaymentCallback />} />
          <Route path="/payment/failed" element={<PaymentCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatbotButton />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
