import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { uploadImageToCloudinary } from '@/lib/upload-image';
import { useAuth } from '@/hooks/use-auth';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  isFeatured: false,
  isPublished: false,
};

const News = () => {
  const { hasPermission } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState(emptyForm);

  const canAdd = hasPermission('news', 'add');
  const canEdit = hasPermission('news', 'edit');
  const canDelete = hasPermission('news', 'delete');

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error: err } = await api.get<BlogPost[]>('/blog-posts/admin/all');
    if (err) setError(err);
    else setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(t);
  }, [notice]);

  const filtered = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return posts;
    return posts.filter((p) =>
      [p.title, p.slug, p.excerpt || ''].join(' ').toLowerCase().includes(key),
    );
  }, [posts, search]);

  const openCreate = () => {
    if (!canAdd) {
      setError('Bạn không có quyền tạo bài viết');
      return;
    }
    setEditingId(null);
    setFormData(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (post: BlogPost) => {
    if (!canEdit) {
      setError('Bạn không có quyền chỉnh sửa bài viết');
      return;
    }
    setEditingId(post.id);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      coverImage: post.coverImage || '',
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      metaKeywords: post.metaKeywords || '',
      isFeatured: post.isFeatured,
      isPublished: post.isPublished,
    });
    setError(null);
    setShowModal(true);
  };

  const handleUploadImage = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setFormData((prev) => ({ ...prev, coverImage: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload ảnh thất bại');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((editingId && !canEdit) || (!editingId && !canAdd)) {
      setError('Bạn không có quyền thực hiện thao tác này');
      return;
    }
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Tiêu đề và nội dung là bắt buộc');
      return;
    }

    const endpoint = editingId ? `/blog-posts/${editingId}` : '/blog-posts';
    const action = editingId ? api.put : api.post;
    const { data, error: err } = await action<BlogPost>(endpoint, formData);

    if (err || !data) {
      setError(err || 'Không lưu được bài viết');
      return;
    }

    if (editingId) {
      setPosts((prev) => prev.map((p) => (p.id === editingId ? data : p)));
      setNotice('Cập nhật bài viết thành công');
    } else {
      setPosts((prev) => [data, ...prev]);
      setNotice('Tạo bài viết thành công');
    }

    setShowModal(false);
    setFormData(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      setError('Bạn không có quyền xóa bài viết');
      return;
    }
    if (!confirm('Bạn chắc chắn muốn xóa bài viết này?')) return;
    const { error: err } = await api.delete(`/blog-posts/${id}`);
    if (err) {
      setError(err);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setNotice('Xóa bài viết thành công');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Tin Tức SEO</h1>
          <p className="text-muted-foreground">Tạo bài viết chuẩn SEO và đánh dấu bài nổi bật cho trang chủ</p>
        </div>
        {canAdd && (
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Tạo Bài Viết
          </button>
        )}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm theo tiêu đề, slug..."
        className="w-full border p-2 rounded bg-white"
      />

      {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">{error}</div>}
      {notice && <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded">{notice}</div>}

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Tiêu đề</th>
                <th className="text-left px-3 py-2">Slug</th>
                <th className="text-left px-3 py-2">Trạng thái</th>
                <th className="text-left px-3 py-2">Nổi bật</th>
                <th className="text-left px-3 py-2">Ngày tạo</th>
                <th className="text-right px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-4 text-center" colSpan={6}>Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-3 py-4 text-center text-gray-500" colSpan={6}>Chưa có bài viết</td></tr>
              ) : (
                filtered.map((post) => (
                  <tr key={post.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{post.title}</td>
                    <td className="px-3 py-2 text-gray-600">{post.slug}</td>
                    <td className="px-3 py-2">{post.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</td>
                    <td className="px-3 py-2">{post.isFeatured ? 'Có' : 'Không'}</td>
                    <td className="px-3 py-2">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      {canEdit && <button onClick={() => openEdit(post)} className="px-3 py-1 rounded border hover:bg-gray-50">Sửa</button>}
                      {canDelete && <button onClick={() => handleDelete(post.id)} className="px-3 py-1 rounded border text-red-600 hover:bg-red-50">Xóa</button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Cập nhật bài viết' : 'Tạo bài viết mới'}</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <input className="w-full border p-2 rounded" placeholder="Tiêu đề" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              <input className="w-full border p-2 rounded" placeholder="Slug (để trống tự sinh)" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} />
              <textarea className="w-full border p-2 rounded" rows={2} placeholder="Mô tả ngắn" value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} />
              <textarea className="w-full border p-2 rounded" rows={8} placeholder="Nội dung bài viết" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} />

              <div className="space-y-2">
                <label className="text-sm font-medium">Ảnh đại diện bài viết (Cloudinary)</label>
                <input type="file" accept="image/*" className="w-full border p-2 rounded" onChange={(e) => handleUploadImage(e.target.files?.[0])} />
                <input type="text" className="w-full border p-2 rounded bg-gray-50" readOnly value={formData.coverImage} placeholder={uploadingImage ? 'Đang upload ảnh...' : 'URL ảnh sau khi upload'} />
                {formData.coverImage && <img src={formData.coverImage} alt="preview" className="w-full h-40 object-cover rounded border" />}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input className="w-full border p-2 rounded" placeholder="Meta title" value={formData.metaTitle} onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })} />
                <input className="w-full border p-2 rounded" placeholder="Meta keywords (cách nhau bằng dấu phẩy)" value={formData.metaKeywords} onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })} />
              </div>
              <textarea className="w-full border p-2 rounded" rows={2} placeholder="Meta description" value={formData.metaDescription} onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} />

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} />
                  <span>Xuất bản</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} />
                  <span>Bài nổi bật trang chủ</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded border">Hủy</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">{editingId ? 'Cập nhật' : 'Tạo bài viết'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
