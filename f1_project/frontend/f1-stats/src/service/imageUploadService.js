import { supabase } from '@/lib/supabase';

const getUploadEndpoint = () => {
  const baseUrl = import.meta.env.VITE_IMAGE_UPLOAD_API_URL?.trim();
  if (!baseUrl) {
    throw new Error('Falta configurar VITE_IMAGE_UPLOAD_API_URL.');
  }
  return `${baseUrl.replace(/\/+$/, '')}/upload/images`;
};

// Uploads one image through the authenticated image service and returns its
// Supabase bucket path. The service converts the input to WebP before storage.
export const uploadImageToService = async (file, { bucketName, objectPath }) => {
  if (!file || !bucketName || !objectPath) {
    throw new Error('Se necesita una imagen, un bucket y una ruta de destino.');
  }

  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const accessToken = data?.session?.access_token;
  if (!accessToken) {
    throw new Error('Inicia sesión para subir imágenes.');
  }

  const formData = new FormData();
  formData.append('image', file, file.name || 'image');
  formData.append('bucket_name', bucketName);
  formData.append('object_path', objectPath);

  const response = await fetch(getUploadEndpoint(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Error al subir la imagen (${response.status}).`);
  }
  if (
    result.bucket_name !== bucketName ||
    result.object_path !== objectPath ||
    result.content_type !== 'image/webp'
  ) {
    throw new Error('El servicio devolvió una ruta o formato inesperado.');
  }

  return result;
};
