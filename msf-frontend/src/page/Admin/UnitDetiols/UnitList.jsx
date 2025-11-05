import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import axios from '../../../api/axiosInstance'; // Axios instance
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../Store/slices/notificationSlice';
import { setLoading } from '../../../Store/slices/loadingSlice';
import { Star, Trophy, Award, Medal } from 'lucide-react'; // Icons for ranks
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const UnitGrid = () => {
  const [units, setUnits] = useState([]);
  const [modal, setModal] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const dispatch = useDispatch();

  const fetchUnits = async () => {
    try {
      dispatch(setLoading(true)); 
      const response = await axios.get('/admin/units'); 
      setUnits(response.data);
      dispatch(setLoading(false)); 
    } catch (error) {
      dispatch(setLoading(false)); 
      dispatch(showNotification({ type: 'error', message: 'Error fetching units.' }));
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);
console.log(units);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    dispatch(setLoading(true));

    try {
      await axios.post('/admin/add-units', { name: inputValue });
      dispatch(showNotification({ type: 'success', message: 'Unit added successfully' }));
      fetchUnits(); 
      setInputValue('');
      setModal(null);
    } catch (err) {
      const message = err?.response?.data?.message || 'Something went wrong!';
      dispatch(showNotification({ type: 'error', message }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Helper functions for rank, grade, and score styling
  const getRankIcon = (rank) => {
    if (!rank || typeof rank !== 'string') {
      console.warn('Invalid rank:', rank); // Log for debugging
      return <Star className="w-5 h-5 text-gray-500" />; // Default icon if rank is invalid
    }

    const normalizedRank = rank.toLowerCase(); // Safe to call after checking

    switch (normalizedRank) {
      case 'colonel':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'major':
        return <Award className="w-5 h-5 text-orange-500" />;
      case 'captain':
        return <Medal className="w-5 h-5 text-blue-500" />;
      case 'lieutenant':
        return <Star className="w-5 h-5 text-green-500" />;
      default:
        return <Star className="w-5 h-5 text-gray-500" />;
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800 border-green-200';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getScoreColor = (score) => {
    if (score >= 95) return 'text-green-600 font-bold';
    if (score >= 85) return 'text-blue-600 font-semibold';
    if (score >= 75) return 'text-yellow-600 font-medium';
    return 'text-red-600 font-medium';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Top Section (Button and Title) */}
      <div className="flex justify-between items-center mb-6">

        <div className="w-3/4 text-left">
          <h2 className="text-2xl font-semibold text-gray-800">Units Performance List</h2>
        </div>

         <div className="w-1/4">
          <button
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
            onClick={() => setModal('unit')}
          >
            Add Unit
          </button>  
        </div>
        
      </div>

      {/* Unit Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {units.map((unit) => (
          <Link
            key={unit._id}
            to={`/admin/unit-details/${unit._id}`} // Navigate to the unit details page
            className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getRankIcon(unit.rank)}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{unit.name}</h3>
                  <p className="text-sm text-gray-600">{unit.rank}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border ${getGradeColor(unit.grade)}`}
              >
                {unit.grade}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Score:</span>
              <span className={`text-xl ${getScoreColor(unit.score)}`}>{unit.score}</span>
            </div>

            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${unit.score}%` }}
              ></div>
            </div>
          </Link>
        ))}
      </div>

      {/* Modal for Adding Unit */}
      <AnimatePresence>
        {modal === 'unit' && (
          <motion.div
            className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
          >
            <motion.div
              className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-md relative"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
                onClick={() => setModal(null)}
              >
                <FaTimes />
              </button>
              <h3 className="text-xl font-semibold mb-4 text-gray-800 capitalize">Add New Unit</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter unit name"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add Unit
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnitGrid;
