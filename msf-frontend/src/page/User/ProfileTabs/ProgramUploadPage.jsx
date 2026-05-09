"use client";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLoading } from "../../../Store/slices/loadingSlice";
import { showNotification } from "../../../Store/slices/notificationSlice";
import axiosInstance from "../../../api/axiosInstance";
import FreeCropModal from "./FreeCropModal";

// ✅ Utility: compress to <1MB without losing quality
function processImage(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.9 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compress = (q) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Compression failed"));
              if (blob.size > 1024 * 1024 && q > 0.2) {
                return compress(q - 0.1);
              }
              const processedFile = new File([blob], file.name, { type: "image/jpeg" });
              resolve(processedFile);
            },
            "image/jpeg",
            q
          );
        };

        compress(quality);
      };

      img.onerror = (err) => reject(err);
    };
  });
}

function ProgramUploadPage() {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    programName: "",
    date: "",
    description: "",
  });

  const [photos, setPhotos] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCropList, setImageToCropList] = useState([]);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [photos]);

  // ----------------- form inputs -----------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ----------------- drag & drop -----------------
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    console.log("Dropped files:", files);

    if (files.length > 0) {
      if (photos.length + files.length > 10) {
        dispatch(showNotification({ type: "error", message: "Maximum 10 photos allowed" }));
        return;
      }
      openCropModal(files);
    }
  };

  // ----------------- file input -----------------
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (photos.length + e.target.files.length > 10) {
        dispatch(showNotification({ type: "error", message: "Maximum 10 photos allowed" }));
        e.target.value = "";
        return;
      }

      const files = Array.from(e.target.files);
      openCropModal(files);

      e.target.value = "";
    }
  };

  // ----------------- crop modal -----------------
  const openCropModal = (files) => {
    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((images) => {
      setImageToCropList(images);
      setCropModalOpen(true);
    });
  };

  const handleSaveCropped = async (file) => {
    try {
      const processed = await processImage(file);
      console.log("Processed file:", processed, "Size:", processed.size);
      const preview = URL.createObjectURL(processed);
      setPhotos((prev) => [...prev, { file: processed, preview }]);
    } catch (err) {
      console.error("Error processing cropped image", err);
    }
  };

  const handleSkipCrop = async (remainingImages) => {
    for (let base64 of remainingImages) {
      try {
        const res = await fetch(base64);
        const blob = await res.blob();
        const file = new File([blob], `image_${Date.now()}.jpg`, { type: blob.type });
        const processed = await processImage(file);
        console.log("Processed skipped file:", processed, "Size:", processed.size);
        const preview = URL.createObjectURL(processed);
        setPhotos((prev) => [...prev, { file: processed, preview }]);
      } catch (err) {
        console.error("Error skipping crop", err);
      }
    }
    setCropModalOpen(false);
    setImageToCropList([]);
  };

  // ----------------- remove photo -----------------
  const removePhoto = (index) => {
    setPhotos((prev) => {
      const newPhotos = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].preview);
      return newPhotos;
    });
  };

  // ----------------- validation -----------------
  const validateForm = () => {
    if (!formData.programName.trim()) {
      dispatch(showNotification({ type: "error", message: "Program name is required" }));
      return false;
    }
    if (!formData.date) {
      dispatch(showNotification({ type: "error", message: "Event date is required" }));
      return false;
    }
    if (!formData.description.trim()) {
      dispatch(showNotification({ type: "error", message: "Description is required" }));
      return false;
    }
    if (photos.length === 0) {
      dispatch(showNotification({ type: "error", message: "At least one photo is required" }));
      return false;
    }
    if (photos.length > 10) {
      dispatch(showNotification({ type: "error", message: "Maximum 10 photos allowed" }));
      return false;
    }
    return true;
  };

  // ----------------- submit -----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      dispatch(setLoading(true));

      const form = new FormData();
      form.append("programName", formData.programName);
      form.append("date", formData.date);
      form.append("description", formData.description);
      photos.forEach((p) => form.append("photos", p.file));

      const response = await axiosInstance.post("/user/program/add", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      dispatch(showNotification({ type: "success", message: response.data.message }));

      setFormData({ programName: "", date: "", description: "" });
      setPhotos([]);
    } catch (error) {
      dispatch(
        showNotification({
          type: "error",
          message: error.response?.data?.message || "Upload failed!",
        })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-2 mb-15 lg:p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Program Details</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Program Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Program Name</label>
          <input
            type="text"
            name="programName"
            value={formData.programName}
            onChange={handleInputChange}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Enter program name"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Event Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full border rounded-lg px-3 py-2 h-28 resize-none"
            placeholder="Describe your program..."
            required
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium mb-2">Photos</label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <p className="text-sm text-gray-600">
              Drag & drop photos here, or{" "}
              <label htmlFor="photo-upload" className="text-blue-600 underline cursor-pointer">
                browse
              </label>
            </p>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 max-w-full">
              {photos.map((p, index) => (
                <div
                  key={index}
                  className="relative group w-full bg-gray-200 rounded-lg overflow-hidden border"
                  style={{ minHeight: "100px" }}
                >
                  <img
                    src={p.preview}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-contain"
                    onError={() => console.error(`Failed to load image ${index}: ${p.preview}`)}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute bottom-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Submit Program
        </button>
      </form>

      {/* Crop Modal */}
      {cropModalOpen && (
        <FreeCropModal
          isOpen={cropModalOpen}
          imageSrcList={imageToCropList}
          onClose={() => {
            setCropModalOpen(false);
            setImageToCropList([]);
          }}
          onSave={handleSaveCropped}
          onSkip={handleSkipCrop}
        />
      )}
    </div>
  );
}

export default ProgramUploadPage;