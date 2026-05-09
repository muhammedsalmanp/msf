
import { useState, useRef } from "react";
import Modal from "react-modal";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

Modal.setAppElement("#root");

function FreeCropModal({ isOpen, imageSrcList, onClose, onSave, onSkip }) {
  const [crop, setCrop] = useState({
    unit: "%",
    width: 30,
    height: 30,
    x: 10,
    y: 10,
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const imgRef = useRef(null);

  const imageSrc = imageSrcList[currentIndex];

  const getCroppedImage = () => {
    const image = imgRef.current;
    if (!image || !crop.width || !crop.height) return;

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: "image/jpeg" });
      onSave(file);

      if (currentIndex < imageSrcList.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    }, "image/jpeg");
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-2xl mx-auto mt-10"
      overlayClassName="fixed inset-0 bg-black/70 flex items-center justify-center"
    >
      <h2 className="text-lg font-semibold mb-4">
        Crop Image {currentIndex + 1} / {imageSrcList.length}
      </h2>

      <div className="w-full flex justify-center max-h-[70vh] overflow-auto">
        {imageSrc && (
          <ReactCrop crop={crop} onChange={(c) => setCrop(c)} keepSelection>
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop target"
              style={{
                maxWidth: "100%",
                maxHeight: "60vh",
                objectFit: "contain",
              }}
            />
          </ReactCrop>
        )}
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={() => onSkip(imageSrcList.slice(currentIndex))}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
        >
          Upload Without Crop
        </button>
        <button
          onClick={getCroppedImage}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {currentIndex === imageSrcList.length - 1 ? "Save & Finish" : "Save & Next"}
        </button>
      </div>
    </Modal>
  );
}

export default FreeCropModal;
