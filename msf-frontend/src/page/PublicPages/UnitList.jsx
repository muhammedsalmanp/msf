

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from '../../api/axiosInstance';
import { useDispatch } from 'react-redux';
import { setLoading } from '../../Store/slices/loadingSlice';
import { Loader2 } from 'lucide-react';
import UnitCard from './Componenets/UnitCard';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const UnitList = () => {
  const [units, setUnits] = useState([]);
  const dispatch = useDispatch();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const observer = useRef();
  const lastUnitRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && page < totalPages) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, page, totalPages]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (page === 1) {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await axios.get('/user/units', {
          params: { page: page, limit: 9 } 
        });
        
        const { units: newUnits, totalPages: newTotalPages } = response.data;

        setUnits(prevUnits => [...prevUnits, ...newUnits]);
        setTotalPages(newTotalPages);

      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    };

    fetchUnits();
  }, [page]); 


  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen pt-20 lg:pt-30">
      
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Our Units
        </h1>
        <p className="text-base md:text-lg text-gray-600">
          Explore all the active units in our organization.
        </p>
      </div>

      <motion.div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {units.map((unit, index) => {
          if (units.length === index + 1) {
            return (
              <div ref={lastUnitRef} key={unit._id}>
                <UnitCard unit={unit} />
              </div>
            );
          } else {
            return <UnitCard unit={unit} key={unit._id} />;
          }
        })}
      </motion.div>
      <div className="pb-20 text-center">
        {loadingMore && (
          <div className="flex justify-center items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading more units...</span>
          </div>
        )}
        {!loadingMore && page >= totalPages && units.length > 0 && (
          <p className="text-gray-500">You've seen all the units.</p>
        )}
      </div>
    </div>
  );
};

export default UnitList;