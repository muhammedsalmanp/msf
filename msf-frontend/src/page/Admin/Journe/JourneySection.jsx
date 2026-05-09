import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useDispatch, useSelector } from 'react-redux'; 
import axios from '../../../api/axiosInstance'; 
import { showNotification } from '../../../Store/slices/notificationSlice'; 
import { setLoading } from '../../../Store/slices/loadingSlice'; 
import JourneyModal from '../AdminComponents/JourneyModal';
import LazyLoad from 'react-lazyload'; // Import lazy load

const JourneySection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  const loading = useSelector((state) => state.loading);
  const [journeys, setJourneys] = useState([]);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);  // Adjust the number of items per page
  const [hasMore, setHasMore] = useState(true);

  // Fetch journeys based on pagination
  const fetchJourneys = async () => {
    try {
      dispatch(setLoading(true));
      const response = await axios.get(`/admin/journey?page=${page}&limit=${perPage}`);
      if (response.data.length === 0) {
        setHasMore(false);  
      } else {
        setJourneys((prevJourneys) => [...prevJourneys, ...response.data]); 
      }
    } catch (error) {
      setJourneys([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, [page]);

  const openModal = (journey) => {
    setSelectedJourney(journey); 
  };

  const closeModal = () => {
    setSelectedJourney(null);
  };
  const journeyId = journeys._id;
  const handleDelete = async (journeyId) => {
    try {
      dispatch(setLoading(true)); 
      await axios.delete(`/admin/journey/${journeyId}`);
      dispatch(showNotification({ type: 'success', message: 'Journey deleted successfully!' }));
      fetchJourneys();  
    } catch (error) {
      dispatch(showNotification({ type: 'error', message: 'Failed to delete journey!' }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleEdit = (journeyId) => {
    navigate(`/admin/journey/edit/${journeyId}`); 
  };

  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Current Journeys</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={() => navigate('/admin/journey/add')}
        >
          + Add New Journey
        </button>
      </div>

      {journeys.length === 0 ? (
        <div className="text-gray-500 italic">No journey data available.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {journeys.map((journey) => (
            <div
              key={journey._id}
              className="cursor-pointer bg-white shadow rounded overflow-hidden hover:shadow-lg transition-all"
              onClick={() => openModal(journey)}  // Open the modal with the full journey object
            >
              <div className="w-full h-48 overflow-hidden">
                <LazyLoad height={200} offset={100} once>
                  {journey.images && journey.images.length > 0 ? (
                    <img
                      src={journey.images[0]} // Display first image of the journey
                      alt={journey.title}
                      className="w-full h-full object-cover"
                      loading="lazy"  // Lazy load images
                    />
                  ) : (
                    <div>No images available</div>
                  )}
                </LazyLoad>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold">{journey.title}</h3>
                <p className="text-sm text-gray-600">{new Date(journey.date).toLocaleDateString()}</p>

                {/* Edit and Delete buttons */}
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();  // Prevent modal from opening when deleting
                      handleDelete(journey._id);  // Delete button
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show Journey Modal */}
      {selectedJourney && (
        <JourneyModal
          journey={selectedJourney}  // Pass the full journey object to the modal
          onClose={closeModal}
        />
      )}

      {/* Pagination controls */}
    </div>
  );
};

export default JourneySection;
