
import { useEffect, useRef, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import axios from '../../../api/axiosInstance';
import { showNotification } from '../../../Store/slices/notificationSlice';
import { setLoading } from '../../../Store/slices/loadingSlice';
import CropperModal from '../../../components/ImageCropper';

const SlidePage = () => {
  const [slides, setSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  const triggerUpload = () => {
    fileInputRef.current.click();
  };

  // ✅ Fetch slides from backend
  useEffect(() => {
    const fetchSlides = async () => {
      setLoadingSlides(true);
      try {
        const response = await axios.get('/admin/slide'); // API route
        console.log(response.data);

        setSlides(response.data);
      } catch (err) {
        dispatch(showNotification({ type: 'error', message: 'Failed to fetch slides' }));
      } finally {
        setLoadingSlides(false);
      }
    };

    fetchSlides();
  }, [dispatch]);

  // ✅ Handle file input and show cropper
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    } else {
      dispatch(showNotification({ type: 'error', message: 'Only image files are allowed!' }));
    }
  };

  // ✅ Handle cropped image upload
  const handleCroppedImage = async (blob) => {
    const file = new File([blob], `slide-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    const formData = new FormData();
    formData.append('image', file); // ✅ send a real file

    try {
      dispatch(setLoading(true));
      const response = await axios.post('/admin/slide/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSlides((prev) => [...prev, response.data]);
      dispatch(showNotification({ type: 'success', message: 'Slide uploaded successfully!' }));
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Upload failed!' }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ✅ Delete slide from backend
  const confirmDelete = async () => {
    const slide = slides[deleteIndex];
    try {
      await axios.delete(`/admin/slide/${slide._id}`);
      setSlides((prev) => prev.filter((_, i) => i !== deleteIndex));
      dispatch(showNotification({ type: 'info', message: 'Slide deleted' }));
    } catch (err) {
      dispatch(showNotification({ type: 'error', message: 'Failed to delete slide' }));
    } finally {
      setDeleteIndex(null);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-[#f0fbf4] min-h-screen relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Manage Slides</h1>
        <button
          onClick={triggerUpload}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          <FaPlus className="inline mr-2" /> Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
      </div>

      {/* Cropper Modal */}
      {showCropper && selectedImage && (
        <CropperModal
          imageSrc={selectedImage}
          onCropDone={(blob) => {
            handleCroppedImage(blob);
            setShowCropper(false);
            setSelectedImage(null);
          }}
          onClose={() => {
            setShowCropper(false);
            setSelectedImage(null);
          }}
        />
      )}

      {/* Slide Grid */}
      {loadingSlides ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-300 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-4">
          {slides.map((slide, idx) => (


            <div
              key={idx}
              className="relative bg-white rounded shadow hover:scale-[1.02] transition-transform"
              onClick={() => setActiveIndex(idx)}
            >
              <img
                src={slide.imageUrl}
                alt={`slide-${idx}`}
                className="w-full h-40 sm:h-48 md:h-64 lg:h-72 xl:h-60 object-cover rounded"
              />

              {(activeIndex === idx) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent bubbling up
                    setDeleteIndex(idx);
                  }}
                  className="absolute top-2 right-2 text-white bg-red-600 p-2 rounded-full text-xl shadow transition-all duration-300 ease-in-out"
                  title="Delete Slide"
                >
                  <FaTrash />
                </button>
              )}
            </div>

          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 bg-opacity-40 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 shadow-lg w-[90%] max-w-sm text-center">
            <p className="text-gray-800 mb-4">Are you sure you want to delete this slide?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteIndex(null)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlidePage;
