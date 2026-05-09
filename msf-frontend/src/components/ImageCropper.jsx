

// export default CropperModal;
import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const CropperModal = ({ imageSrc, onClose, onCropDone, maxSizeKB = 500, maxResolution = 1920 }) => {
  const [crop, setCrop] = useState(null); // Start with no crop
  const [completedCrop, setCompletedCrop] = useState(null);
  const [error, setError] = useState(null);
  const imgRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Optimize image by resizing and compressing
  const optimizeImage = (canvas, targetWidth, targetHeight, quality = 0.8) => {
    return new Promise((resolve) => {
      // Create a temporary canvas for resizing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const ctx = tempCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

      let currentQuality = quality;
      const attemptCompression = () => {
        tempCanvas.toBlob(
          (blob) => {
            if (blob && blob.size / 1024 <= maxSizeKB) {
              resolve(blob);
            } else if (currentQuality > 0.1) {
              currentQuality -= 0.1;
              attemptCompression();
            } else {
              setError('Unable to compress image to desired size');
              resolve(null);
            }
          },
          'image/jpeg',
          currentQuality
        );
      };
      attemptCompression();
    });
  };

  const getCroppedBlob = useCallback(async () => {
    if (!imgRef.current) {
      setError('Image not loaded');
      return null;
    }

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      let targetWidth, targetHeight;

      // Calculate scaling factor to fit within maxResolution
      const aspectRatio = image.naturalWidth / image.naturalHeight;
      if (image.naturalWidth > image.naturalHeight) {
        targetWidth = Math.min(image.naturalWidth, maxResolution);
        targetHeight = Math.round(targetWidth / aspectRatio);
      } else {
        targetHeight = Math.min(image.naturalHeight, maxResolution);
        targetWidth = Math.round(targetHeight * aspectRatio);
      }

      // Handle cropped image
      if (completedCrop && completedCrop.width && completedCrop.height) {
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Calculate cropped dimensions
        const cropWidth = Math.round(completedCrop.width * scaleX);
        const cropHeight = Math.round(completedCrop.height * scaleY);

        // Adjust target dimensions to maintain aspect ratio of crop
        const cropAspectRatio = cropWidth / cropHeight;
        if (cropWidth > cropHeight) {
          targetWidth = Math.min(cropWidth, maxResolution);
          targetHeight = Math.round(targetWidth / cropAspectRatio);
        } else {
          targetHeight = Math.min(cropHeight, maxResolution);
          targetWidth = Math.round(targetHeight * cropAspectRatio);
        }

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          image,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );
      } else {
        // Handle full image
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          image,
          0,
          0,
          image.naturalWidth,
          image.naturalHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      // Optimize and resize
      return await optimizeImage(canvas, targetWidth, targetHeight);
    } catch (err) {
      setError('Error processing image');
      return null;
    }
  }, [completedCrop, maxSizeKB, maxResolution]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    const imageBlob = await getCroppedBlob();
    if (imageBlob) {
      onCropDone(imageBlob);
      onClose();
    }
    setIsLoading(false);
  };

  // Handle single-click crop initiation
  const handleImageClick = useCallback(
    (e) => {
      if (!imgRef.current) return;

      const rect = imgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Initialize crop on first click if none exists
      setCrop((prev) => {
        if (prev) return prev; // Don't update if crop already exists
        return {
          unit: '%',
          width: 50,
          height: 50 * (16 / 9), // Maintain 16:9 aspect ratio
          x: Math.max(0, (x / rect.width) * 100 - 25),
          y: Math.max(0, (y / rect.height) * 100 - (25 * 16) / 9),
          aspect: 16 / 9,
        };
      });
    },
    []
  );

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <h2 className="text-lg font-semibold mb-4">Image Editor</h2>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <ReactCrop
          crop={crop}
          onChange={(newCrop) => setCrop(newCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={crop ? 16 / 9 : undefined} // Only enforce aspect ratio if crop exists
          className="relative"
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="To edit"
            className="max-h-[60vh] mx-auto object-contain"
            crossOrigin="anonymous"
            onLoad={() => setError(null)}
            onClick={handleImageClick}
            onError={() => setError('Failed to load image')}
          />
        </ReactCrop>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Save Image'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropperModal;