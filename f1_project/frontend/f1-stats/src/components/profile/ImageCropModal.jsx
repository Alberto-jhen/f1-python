import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCroppedImg } from '@/service/cropImage';
import { toast } from 'sonner';

export function ImageCropModal({ image, open, onClose, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const { url, file } = await getCroppedImg(image, croppedAreaPixels);
      onConfirm({ url, file });
      onClose();
    } catch (error) {
      console.error('Error al recortar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md bg-zinc-950 border-zinc-800 text-white'>
        <DialogHeader>
          <DialogTitle className='text-white'>Ajustar foto de perfil</DialogTitle>
        </DialogHeader>
        <div className='relative w-full h-64 rounded-lg overflow-hidden bg-zinc-900'>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        <div className='flex items-center gap-3'>
          <span className='text-xs text-zinc-400'>Zoom</span>
          <input
            type='range'
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className='flex-1 accent-green-500'
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} className='text-black font-sans bg-gray-300 hover:bg-gray-400 cursor-pointer'>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading} className='bg-green-500 hover:bg-green-600 text-white font-sans cursor-pointer'>
            {loading ? 'Recortando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
