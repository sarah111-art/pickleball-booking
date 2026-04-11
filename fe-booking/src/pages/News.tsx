import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  createdAt: string;
}

const News = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['news-public'],
    queryFn: async () => {
      const { data, error } = await api.get<BlogPost[]>('/blog-posts?published=true');
      if (error) throw new Error(error);
      return data || [];
    },
  });

  useEffect(() => {
    document.title = 'Tin tức Pickleball | Sân Pickleball';
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Tin tức Pickleball, kinh nghiệm chơi và cập nhật mới nhất từ hệ thống sân.');
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <section className="container px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Tin Tức Pickleball</h1>
          <p className="text-muted-foreground mb-8">Cập nhật bài viết mới nhất, mẹo chơi và thông tin hệ thống</p>

          {isLoading ? (
            <p className="text-muted-foreground">Đang tải bài viết...</p>
          ) : posts && posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <article key={post.id} className="border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow">
                  {post.coverImage && (
                    <img src={post.coverImage} alt={post.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <h2 className="text-xl font-semibold line-clamp-2 mb-2">{post.title}</h2>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{post.excerpt || 'Xem chi tiết bài viết...'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                      <Link to={`/news/${post.slug}`} className="text-primary text-sm font-semibold hover:underline">Đọc tiếp</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Chưa có bài viết nào.</p>
          )}
        </section>
        <Footer />
      </div>
    </div>
  );
};

export default News;
