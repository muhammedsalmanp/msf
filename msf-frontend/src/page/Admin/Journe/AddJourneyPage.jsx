import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import axios from '../../../api/axiosInstance'; // Axios instance for API calls
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../Store/slices/notificationSlice'; // For showing notifications
import { setLoading } from '../../../Store/slices/loadingSlice'; // For setting loading state
import CropperModal from '../../../components/ImageCropper'; // Cropper Modal Component

const AddJourneyPage = () => {
  const navigate = useNavigate(); // For redirecting after form submission
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    description: "",
  });
  const [images, setImages] = useState([]); 
  const [imagePreviews, setImagePreviews] = useState([]); 
  const [error, setError] = useState(""); 
  const [showCropperModal, setShowCropperModal] = useState(false); 
  const [imageSrc, setImageSrc] = useState(""); 

  const fileInputRef = useRef(null); 

  // Handle Input Changes (name, date, description)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open the file input dialog
  const handleAddImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle Image Selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result); // Set the selected image as the source for cropping
        setShowCropperModal(true); // Open the cropping modal
      };
      reader.readAsDataURL(files[0]); // Read the selected file as a data URL
    }
  };

  // Add cropped image to state
  const handleCropDone = (imageBlob) => {
    const imageFile = new File([imageBlob], "cropped-image.jpg", { type: "image/jpeg" });

    setImages((prev) => [...prev, imageFile]);
    setImagePreviews((prev) => [
      ...prev,
      URL.createObjectURL(imageFile),
    ]);
  };

  const handleDeleteImage = (index) => {
    const updatedImages = [...images];
    const updatedPreviews = [...imagePreviews];

    updatedImages.splice(index, 1); // Remove the image at the given index
    updatedPreviews.splice(index, 1); // Remove the preview at the same index

    setImages(updatedImages);
    setImagePreviews(updatedPreviews);
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.description || images.length === 0) {
      setError("Please fill all fields and upload at least one image.");
      return;
    }

    dispatch(setLoading(true));
    setError(""); // Clear previous errors
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("date", formData.date);
      formDataToSend.append("description", formData.description);

      // Append images to formData
      images.forEach((image) => {
        formDataToSend.append("journeyImages", image);
      });

      // Submit the form to the backend
      await axios.post('/admin/journey', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      dispatch(showNotification({ type: 'success', message: 'Journey added successfully!' }));
      dispatch(setLoading(false));
      navigate('/admin/journey');
    } catch (error) {
      dispatch(setLoading(false)); // Hide loading spinner on error
      dispatch(showNotification({ type: 'error', message: 'Failed to add journey!' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Add New Journey</h1>
          <p className="mt-2 text-gray-600">Share your travel experience with others</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">Journey Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your journey name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Date Field */}
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium text-gray-700">Journey Date</label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your journey experience..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md resize-none"
              required
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">Journey Images</label>
            {images.length === 0 ? (
              <button
                type="button"
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={handleAddImageClick} // Trigger the file input on button click
              >
                Add Image
              </button>
            ) : (
              <div>
                <button
                  type="button"
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={handleAddImageClick} // Trigger the file input on button click
                >
                  Add More Images
                </button>
                {/* Image Previews with Delete Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(index)}  // Delete button for each image
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Journey
            </button>
            <button
              type="button"
              className="w-full px-6 py-3 border-2 border-gray-300 rounded-md hover:bg-gray-100"
              onClick={() => {
                setFormData({ name: "", date: "", description: "" });
                setImages([]);
                setImagePreviews([]);
                setError("");
              }}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: "none" }} // Hide the file input element
      />

      {/* Show Cropper Modal */}
      {showCropperModal && (
        <CropperModal
          imageSrc={imageSrc}
          onClose={() => setShowCropperModal(false)}
          onCropDone={handleCropDone}
        />
      )}
    </div>
  );
};

export default AddJourneyPage;
