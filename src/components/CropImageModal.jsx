import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

export default function CropImageModal({ imageSrc, aspect, maxSize, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels, maxSize);
      onCropComplete(croppedImageBase64);
    } catch (e) {
      console.error(e);
      alert('画像のトリミングに失敗しました');
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <h2>画像を調整</h2>
        <div style={{ position: 'relative', flex: 1, width: '100%', background: '#333', borderRadius: 8, overflow: 'hidden' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        <div style={{ padding: '16px 0' }}>
          <label className="label">ズーム</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>キャンセル</button>
          <button className="btn btn-admin" style={{ flex: 1 }} onClick={handleSave}>切り抜く</button>
        </div>
      </div>
    </div>
  );
}
