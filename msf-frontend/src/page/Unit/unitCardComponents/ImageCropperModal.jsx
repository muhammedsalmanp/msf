import React, { useState, useRef } from 'react';
import { motion } from "framer-motion";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // Don't forget to import the styles

const ImageCropperModal = ({ src, onClose, onSave }) => {
  const [crop, setCrop] = useState(); // This will be an object { x, y, width, height, unit }
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);

  // Function to get the cropped image data as a Blob
  const getCroppedImg = () => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      throw new Error('Crop details not available');
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(blob => {
        resolve(blob);
      }, 'image/jpeg'); // You can change the format here
    });
  };

  const handleSaveCrop = async () => {
    onClose();
    const croppedImageBlob = await getCroppedImg();
    onSave(croppedImageBlob);
  };
  
  // This helps center the initial crop selection
  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, 16 / 9, width, height),
        width,
        height
    );
    setCrop(initialCrop);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <div className="bg-slate-800 text-white rounded-2xl max-w-4xl w-full p-6 shadow-xl">
        <h3 className="text-xl font-bold mb-4">Crop Image</h3>
        <div className="bg-black mb-4">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={c => setCompletedCrop(c)}
          >
            <img ref={imgRef} src={src} onLoad={onImageLoad} style={{ maxHeight: '70vh' }} />
          </ReactCrop>
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 bg-slate-600 rounded-lg hover:bg-slate-500">
            Cancel
          </button>
          <button onClick={handleSaveCrop} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
             Save Crop (or Skip)
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageCropperModal;