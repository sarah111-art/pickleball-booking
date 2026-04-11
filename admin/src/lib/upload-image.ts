import { api } from '@/lib/api';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.readAsDataURL(file);
  });
};

export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const base64 = await fileToBase64(file);
  const { data, error } = await api.post<{ url: string }>('/upload/image', { data: base64 });

  if (error || !data?.url) {
    throw new Error(error || 'Upload ảnh thất bại');
  }

  return data.url;
};
