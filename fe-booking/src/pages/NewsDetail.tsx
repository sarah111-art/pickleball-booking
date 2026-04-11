import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/lib/api';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
}

const NewsDetail = () => {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ['news-detail', slug],
    queryFn: async () => {
      const { data, error } = await api.get<BlogPost>(`/blog-posts/slug/${slug}`);
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!post) return;
    document.title = post.metaTitle || `${post.title} | Tin tức Pickleball`;
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', post.metaDescription || post.excerpt || 'Tin tức Pickleball');
    if (!meta.parentNode) document.head.appendChild(meta);
  }, [post]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <section className="container px-4 py-10 max-w-4xl">
          <Link to="/news" className="text-primary hover:underline text-sm">← Quay lại Tin tức</Link>

          {isLoading ? (
            <p className="text-muted-foreground mt-6">Đang tải bài viết...</p>
          ) : !post ? (
            <p className="text-muted-foreground mt-6">Không tìm thấy bài viết.</p>
          ) : (
            <article className="mt-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{post.title}</h1>
              <p className="text-sm text-muted-foreground mb-6">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</p>
              {post.coverImage && <img src={post.coverImage} alt={post.title} className="w-full max-h-[420px] object-cover rounded-xl mb-6" />}
              {post.excerpt && <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>}
              <div className="prose prose-neutral max-w-none whitespace-pre-wrap leading-7">{post.content}</div>
            </article>
          )}
        </section>
        <Footer />
      </div>
    </div>
  );
};

export default NewsDetail;
