import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trash2, Star } from "lucide-react";

interface Review {
  id: string;
  user?: {
    email: string;
    fullName?: string;
  };
  court?: {
    courtName: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<number | "all">("all");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error: err } = await api.get<Review[]>("/reviews");
    if (err) {
      setError(err);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xác nhận xóa đánh giá?")) return;
    const { error: err } = await api.delete(`/reviews/${id}`);
    if (err) {
      setError(err);
    } else {
      setReviews(reviews.filter(r => r.id !== id));
    }
  };

  const filteredReviews = filter === "all" 
    ? reviews 
    : reviews.filter(r => r.rating === filter);

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={16}
            className={i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Đánh Giá</h1>
          <p className="text-gray-600 mt-2">Tổng: {reviews.length} đánh giá | Điểm TB: {avgRating}/5</p>
        </div>
        <button onClick={fetchReviews} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          ↻ Làm Mới
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Tất Cả ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviews.filter(r => r.rating === rating).length;
          return (
            <button
              key={rating}
              onClick={() => setFilter(rating)}
              className={`px-4 py-2 rounded ${
                filter === rating
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {rating}⭐ ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="border rounded-lg p-4 bg-white shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <p className="font-semibold">{review.user?.fullName || review.user?.email || "Ẩn danh"}</p>
                      <p className="text-sm text-gray-600">{review.court?.courtName || "-"}</p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                  <p className="text-gray-700 mt-2">{review.comment}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(review.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {filter === "all" ? "Không có đánh giá nào" : "Không có đánh giá với bộ lọc này"}
        </div>
      )}
    </div>
  );
};

export default Reviews;
