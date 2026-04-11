import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Clock, Save, ToggleLeft, ToggleRight, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImageToCloudinary } from "@/lib/upload-image";
import { useAuth } from "@/hooks/use-auth";

interface BusinessHourDay {
  day: number;
  label: string;
  open: string;
  close: string;
  enabled: boolean;
}

interface SettingsData {
  fee: number;
  policy: string;
  cancelTimeLimit: number;
  businessHours: BusinessHourDay[];
  heroTitle?: string;
  heroHighlight?: string;
  heroDescription?: string;
  heroImageUrl?: string;
  footerBrandName?: string;
  footerDescription?: string;
  footerPhone?: string;
  footerEmail?: string;
  footerAddress?: string;
  footerCopyright?: string;
}

const DEFAULT_HOURS: BusinessHourDay[] = [
  { day: 0, label: "Chủ nhật", open: "06:00", close: "22:00", enabled: true },
  { day: 1, label: "Thứ 2", open: "06:00", close: "22:00", enabled: true },
  { day: 2, label: "Thứ 3", open: "06:00", close: "22:00", enabled: true },
  { day: 3, label: "Thứ 4", open: "06:00", close: "22:00", enabled: true },
  { day: 4, label: "Thứ 5", open: "06:00", close: "22:00", enabled: true },
  { day: 5, label: "Thứ 6", open: "06:00", close: "22:00", enabled: true },
  { day: 6, label: "Thứ 7", open: "06:00", close: "22:00", enabled: true },
];

const Settings = () => {
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState<SettingsData>({
    fee: 0,
    policy: "",
    cancelTimeLimit: 60,
    businessHours: DEFAULT_HOURS,
    heroTitle: "Đặt Sân Pickleball",
    heroHighlight: "Nhanh Chóng & Dễ Dàng",
    heroDescription:
      "Pickleball hiện đại nhất Việt Nam. Đặt sân online 24/7, giá cả minh bạch, dịch vụ chuyên nghiệp.",
    heroImageUrl: "",
    footerBrandName: "Pickleball Việt",
    footerDescription: "Hệ thống đặt sân Pickleball hàng đầu Việt Nam",
    footerPhone: "0901 234 567",
    footerEmail: "contact@pickleballviet.com",
    footerAddress: "123 Đường ABC, Quận 1, TP.HCM",
    footerCopyright: "© 2024 Pickleball Việt. All rights reserved.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);

  const canEdit = hasPermission("settings", "edit");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const res = await api.get<SettingsData>("/settings");
    if (res.data) {
      setSettings({
        ...res.data,
        businessHours:
          res.data.businessHours?.length === 7
            ? res.data.businessHours
            : DEFAULT_HOURS,
      });
    }
    setLoading(false);
  };

  const updateDay = (day: number, field: keyof BusinessHourDay, value: any) => {
    setSettings((prev) => ({
      ...prev,
      businessHours: prev.businessHours.map((d) =>
        d.day === day ? { ...d, [field]: value } : d
      ),
    }));
  };

  const handleSave = async () => {
    if (!canEdit) {
      alert("Bạn không có quyền cập nhật cài đặt hệ thống");
      return;
    }
    setSaving(true);
    const res = await api.put("/settings", settings);
    if (res.data) {
      alert("Đã lưu cài đặt thành công!");
    } else {
      alert("Lỗi: " + res.error);
    }
    setSaving(false);
  };

  const handleHeroImageUpload = async (file?: File) => {
    if (!canEdit) {
      alert("Bạn không có quyền cập nhật cài đặt hệ thống");
      return;
    }
    if (!file) return;
    setUploadingHeroImage(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setSettings((prev) => ({ ...prev, heroImageUrl: url }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload ảnh hero thất bại";
      alert(message);
    } finally {
      setUploadingHeroImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-primary" />
            Cài Đặt Hệ Thống
          </h1>
          <p className="text-gray-500 mt-1">Quản lý giờ hoạt động và các thông số chung</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !canEdit}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Giờ Hoạt Động</h2>
            <p className="text-xs text-gray-500">Cài đặt giờ mở cửa / đóng cửa cho từng ngày trong tuần</p>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {settings.businessHours.map((dayRow) => (
            <div
              key={dayRow.day}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 transition-colors",
                !dayRow.enabled && "bg-gray-50/60 opacity-60"
              )}
            >
              {/* Toggle + Day label */}
              <div className="flex items-center gap-3 w-40 shrink-0">
                <button
                  onClick={() => updateDay(dayRow.day, "enabled", !dayRow.enabled)}
                  className="transition-colors"
                  title={dayRow.enabled ? "Đang mở - click để đóng" : "Đang đóng - click để mở"}
                >
                  {dayRow.enabled ? (
                    <ToggleRight className="w-8 h-8 text-primary" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
                <span
                  className={cn(
                    "font-bold text-sm",
                    dayRow.day === 0 || dayRow.day === 6
                      ? "text-red-500"
                      : "text-gray-800"
                  )}
                >
                  {dayRow.label}
                </span>
              </div>

              {/* Time inputs */}
              {dayRow.enabled ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                      Giờ mở cửa
                    </label>
                    <input
                      type="time"
                      value={dayRow.open}
                      onChange={(e) => updateDay(dayRow.day, "open", e.target.value)}
                      className="w-full p-3 bg-green-50 border border-green-200 rounded-xl text-sm font-bold text-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div className="text-gray-300 font-bold text-lg mt-5">→</div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                      Giờ đóng cửa
                    </label>
                    <input
                      type="time"
                      value={dayRow.close}
                      onChange={(e) => updateDay(dayRow.day, "close", e.target.value)}
                      className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                  <div className="mt-5 px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold text-gray-500 whitespace-nowrap">
                    {(() => {
                      const [h1, m1] = dayRow.open.split(":").map(Number);
                      const [h2, m2] = dayRow.close.split(":").map(Number);
                      const diff = (h2 * 60 + m2 - (h1 * 60 + m1));
                      if (diff <= 0) return "⚠️ Sai giờ";
                      return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? diff % 60 + "m" : ""}`;
                    })()}
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <span className="text-sm text-gray-400 italic">Đóng cửa cả ngày</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3">
          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                businessHours: prev.businessHours.map((d) => ({ ...d, enabled: true })),
              }))
            }
            className="text-xs font-bold text-primary hover:underline"
          >
            Mở tất cả ngày
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                businessHours: prev.businessHours.map((d) =>
                  d.day === 0 || d.day === 6 ? { ...d, enabled: false } : d
                ),
              }))
            }
            className="text-xs font-bold text-gray-500 hover:underline"
          >
            Đóng cuối tuần
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => {
              const first = settings.businessHours[1];
              setSettings((prev) => ({
                ...prev,
                businessHours: prev.businessHours.map((d) => ({
                  ...d,
                  open: first.open,
                  close: first.close,
                })),
              }));
            }}
            className="text-xs font-bold text-gray-500 hover:underline"
          >
            Áp dụng giờ Thứ 2 cho tất cả
          </button>
        </div>
      </div>

      {/* Hero Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Nội Dung Hero Trang Chủ</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Tiêu đề chính
            </label>
            <input
              type="text"
              value={settings.heroTitle || ""}
              onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Tiêu đề phụ nổi bật
            </label>
            <input
              type="text"
              value={settings.heroHighlight || ""}
              onChange={(e) => setSettings({ ...settings, heroHighlight: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Mô tả hero
            </label>
            <textarea
              rows={3}
              value={settings.heroDescription || ""}
              onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Hình nền hero (Cloudinary)
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full p-3 mb-2 bg-white rounded-xl border border-gray-200"
              onChange={(e) => handleHeroImageUpload(e.target.files?.[0])}
            />
            <input
              type="text"
              value={settings.heroImageUrl || ""}
              readOnly
              placeholder={uploadingHeroImage ? "Đang upload ảnh hero..." : "URL ảnh sau khi upload sẽ hiện ở đây"}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            {settings.heroImageUrl && (
              <img
                src={settings.heroImageUrl}
                alt="Hero preview"
                className="mt-3 w-full h-40 object-cover rounded-xl border"
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Nội Dung Footer</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Tên thương hiệu
            </label>
            <input
              type="text"
              value={settings.footerBrandName || ""}
              onChange={(e) => setSettings({ ...settings, footerBrandName: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Số điện thoại
            </label>
            <input
              type="text"
              value={settings.footerPhone || ""}
              onChange={(e) => setSettings({ ...settings, footerPhone: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Email liên hệ
            </label>
            <input
              type="email"
              value={settings.footerEmail || ""}
              onChange={(e) => setSettings({ ...settings, footerEmail: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Copyright
            </label>
            <input
              type="text"
              value={settings.footerCopyright || ""}
              onChange={(e) => setSettings({ ...settings, footerCopyright: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Mô tả thương hiệu
            </label>
            <textarea
              rows={3}
              value={settings.footerDescription || ""}
              onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Địa chỉ
            </label>
            <textarea
              rows={2}
              value={settings.footerAddress || ""}
              onChange={(e) => setSettings({ ...settings, footerAddress: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Cài Đặt Chung</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Phí dịch vụ (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.fee}
              onChange={(e) => setSettings({ ...settings, fee: Number(e.target.value) })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Thời gian huỷ đặt (phút)
            </label>
            <input
              type="number"
              min={0}
              value={settings.cancelTimeLimit}
              onChange={(e) =>
                setSettings({ ...settings, cancelTimeLimit: Number(e.target.value) })
              }
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
              Chính sách đặt sân
            </label>
            <textarea
              rows={4}
              value={settings.policy || ""}
              onChange={(e) => setSettings({ ...settings, policy: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
              placeholder="Nhập nội dung chính sách..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
