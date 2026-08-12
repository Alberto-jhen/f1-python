import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PencilIcon } from 'lucide-react';
import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';
import { ImageCropModal } from './ImageCropModal';

export const ProfileAvatar = forwardRef(function ProfileAvatar({ src, fallback, size = 'xl', editable = false, onImageChange }, ref) {
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [cropImage, setCropImage] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    openFilePicker: () => {
      console.log('[ProfileAvatar] openFilePicker llamado', fileInputRef.current);
      fileInputRef.current?.click();
    },
  }));

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    console.log('[ProfileAvatar] handleFileChange', event.target.files);
    const file = event.target.files[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Selecciona un archivo de imagen válido.');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setCropImage(objectUrl);
      setCropModalOpen(true);
      event.target.value = '';
    }
  };

  const handleCropConfirm = ({ url, file }) => {
    setPreviewImage(url);
    if (onImageChange) {
      onImageChange({ url, file });
    }
  };

  const handleCloseModal = () => {
    setCropModalOpen(false);
    if (cropImage) {
      URL.revokeObjectURL(cropImage);
      setCropImage(null);
    }
  };

  const sizeClasses = {
    sm: 'size-10',
    md: 'size-16',
    lg: 'size-24',
    xl: 'size-32',
  };

  return (
    <div className='relative inline-block'>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={previewImage || src} alt='Avatar de perfil' />
        <AvatarFallback className='text-2xl bg-zinc-800 text-white'>
          {fallback}
        </AvatarFallback>
      </Avatar>

      <input
        type='file'
        accept='image/*'
        ref={fileInputRef}
        onChange={handleFileChange}
        className='hidden'
        aria-label='Cambiar foto de perfil'
      />
      {editable && (
        <button
          type='button'
          onClick={handleAvatarClick}
          className='absolute cursor-pointer bottom-0 right-0 rounded-full bg-red-600 p-2 text-white shadow-lg hover:bg-red-500 transition-colors'
        >
          <PencilIcon className='size-4' />
        </button>
      )}

      <ImageCropModal
        image={cropImage}
        open={cropModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
});
