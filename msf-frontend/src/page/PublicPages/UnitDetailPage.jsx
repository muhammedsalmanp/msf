import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "../../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";


import CommitteeSection from "./Componenets/CommitteeSection";
import ProgramCard from "./Componenets/ProgramCard";
import ProgramModal from "./Componenets/ProgramModal";
import { setLoading } from "../../Store/slices/loadingSlice";

const UnitDetailPage = () => {
  const { unitId } = useParams();
  const [unit, setUnit] = useState(null); 
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUnitDetails = async () => {
      if (!unitId) return;
      
      dispatch(setLoading(true));
      setError(null);
      
      try {
        const response = await axios.get(`/user/unit-details/${unitId}`);
        setUnit(response.data);
      } catch (err) {
        setError("Error fetching unit details.");
      } finally {
        dispatch(setLoading(false));
      }
    };

    if (unitId) {
      fetchUnitDetails();
    } else {
      setError("No Unit ID provided.");
    }
  }, [unitId, dispatch]);

  const handleCardClick = (program) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!unit) return <div className="text-center py-10">Loading ward data...</div>;


  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  };

  const listVariants = {
    visible: { transition: { staggerChildren: 0.1 } },
    hidden: {},
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="bg-slate-50 font-sans p-4 sm:p-6 lg:mb-0 mb-20 min-h-screen ">
      <motion.main
        className="max-w-6xl mx-auto"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* === 1. HEADER === */}
        <header className="text-center mt-10 lg:mt-25 mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">
            {unit.name}
          </h1>
          <div className="mt-4 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-slate-600">
            <span>
              Grade:{" "}
              <strong className="text-green-600">{unit.grade || "N/A"}</strong>
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span>
              Rank: <strong className="text-green-600">{unit.rank || "N/A"}</strong>
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span>
              Score:{" "}
              <strong className="text-green-600">{unit.totalScore || 0}</strong>
            </span>
          </div>
        </header>

        {/* === 2. COMMITTEE SECTIONS === */}
        <div className="space-y-10">
          <CommitteeSection
            unitId={unitId}
            title="MSF Committee"
            type="msf"
          />
          <CommitteeSection
            unitId={unitId}
            title="Haritha Committee"
            type="haritha"
          />
        </div>

        {/* === 3. PROGRAMS SECTION === */}
        <section className="mt-12 pt-10 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-center text-center mb-8 relative px-4">
            <h2 className="text-3xl font-bold text-slate-800 mb-4 sm:mb-0">
              Conducted Programs
            </h2>
          </div>

          {unit.programs && unit.programs.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {unit.programs.map((program) => (
                <motion.div key={program._id} variants={itemVariants}>
                  <ProgramCard
                    program={program}
                    onClick={() => handleCardClick(program)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-300 rounded-xl bg-white mt-8">
              <p className="text-slate-500">No programs have been conducted yet.</p>
            </div>
          )}
        </section>
      </motion.main>

      {/* === MODAL === */}
      <AnimatePresence>
        {isModalOpen && (
          <ProgramModal
            selectedProgram={selectedProgram}
            setIsModalOpen={setIsModalOpen}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnitDetailPage;