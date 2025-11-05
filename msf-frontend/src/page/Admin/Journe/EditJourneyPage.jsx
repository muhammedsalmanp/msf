import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../../api/axiosInstance';
import { useDispatch } from 'react-redux';
import { setLoading } from '../../../store/slices/loadingSlice';  // Import the setLoading action
import { showNotification } from '../../../store/slices/notificationSlice';

const EditJourneyPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams(); // Get the journey id from the URL
  const [journey, setJourney] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    images: [],
  });
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        dispatch(setLoading(true)); // Set loading to true
        const response = await axios.get(`/admin/journey/${id}`);
        setJourney(response.data);
        setFormData({
          title: response.data.title,
          description: response.data.description,
          date: response.data.date,
          images: [],
        });
        setImagePreviews(response.data.images);
      } catch (error) {
        console.error('Failed to fetch journey:', error);
      } finally {
        dispatch(setLoading(false)); // Set loading to false once done
      }
    };

    if (id) fetchJourney();
  }, [id, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      images: files,
    }));

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const journeyData = new FormData();
    journeyData.append('title', formData.title);
    journeyData.append('description', formData.description);
    journeyData.append('date', formData.date);

    formData.images.forEach((image) => {
      journeyData.append('images', image);
    });

    try {
      dispatch(setLoading(true)); // Set loading to true before making the update request
      await axios.put(`/admin/journey/${id}`, journeyData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch(showNotification({ type: 'success', message: 'Journey updated successfully!' }));
      navigate('/admin/journey');
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Failed to update journey!' }));
    } finally {
      dispatch(setLoading(false)); // Set loading to false once the request is complete
    }
  };

  if (!journey) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Edit Journey</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">Journey Title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md resize-none"
              rows={4}
              required
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">Journey Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-gray-500"
            />

            {/* Image Previews */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Update Journey
            </button>
            <button
              type="button"
              className="w-full px-6 py-3 border-2 border-gray-300 rounded-md hover:bg-gray-100"
              onClick={() => navigate('/admin/journey')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJourneyPage;
