import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "../../../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle } from "lucide-react";
import EditCommittee from "./EditCommittee";
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../Store/slices/notificationSlice';
import { setLoading } from '../../../Store/slices/loadingSlice';
import CommitteeSection from "./unitCardComponents/CommitteeSection";
import ProgramCard from "./unitCardComponents/ProgramCard";
import ProgramModal from "./unitCardComponents/ProgramModal";
import AddProgramModal from "./unitCardComponents/AddProgramModal";
import ConfirmationModal from "./unitCardComponents/ConfirmationModal";

const UnitCard = ({ unitData }) => {
  const { unitId } = useParams();
  const [unit, setUnit] = useState(unitData || null);
  const [loading, setLoadingState] = useState(!unitData);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('details');
  const [showMsfDetails, setShowMsfDetails] = useState(false);
  const [showHarithaDetails, setShowHarithaDetails] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [committeeMembers, setCommitteeMembers] = useState([]); 
  const [loadingCommittee, setLoadingCommittee] = useState(false);

  // ✨ NEW: State for committee data
  const [msfCommittee, setMsfCommittee] = useState(null);
  const [harithaCommittee, setHarithaCommittee] = useState(null);
  const [loadingCommittees, setLoadingCommittees] = useState(true);

  // Modal and Form State
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [newProgramData, setNewProgramData] = useState({
    name: '', date: '', description: '', newFiles: [], existingImagesToKeep: [], imagesToDelete: [],
  });

  // State for the confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);

  const dispatch = useDispatch();

  const handleOpenAddModal = () => {
    setEditingProgram(null);
    setNewProgramData({ name: '', date: '', description: '', newFiles: [], existingImagesToKeep: [], imagesToDelete: [] });
    setIsAddingProgram(true);
  };

  const handleOpenEditModal = (program) => {
    setEditingProgram(program);
    setNewProgramData({
      name: program.name,
      date: new Date(program.date).toISOString().split('T')[0],
      description: program.description,
      newFiles: [], existingImagesToKeep: [], imagesToDelete: [],
    });
    setIsAddingProgram(true);
  };

  const handleCloseModal = () => {
    setIsAddingProgram(false);
    setEditingProgram(null);
  };

  // --- Data Handlers ---
  const handleOpenCommitteeEdit = async (committeeType) => {
    try {
      setLoadingCommittee(true);

      // Fetch available members when user clicks edit
      const res = await axios.get(`/user/committee/${committeeType}/unit/${unit._id}`);
      setCommitteeMembers(res.data);

      // Switch the view to edit mode
      setActiveView(`edit-${committeeType}`);
    } catch (err) {
      dispatch(showNotification({ type: "error", message: "Failed to load committee members." }));
    } finally {
      setLoadingCommittee(false);
    }
  };

  const handleDeleteRequest = (programId) => {
    setProgramToDelete(programId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!programToDelete) return;

    dispatch(setLoading(true));
    setIsConfirmModalOpen(false);

    try {
      // Optimistically update UI
      setUnit(prevUnit => ({
        ...prevUnit,
        programs: prevUnit.programs.filter(p => p._id !== programToDelete)
      }));

      await axios.delete(`/user/units/${unit._id}/programs/${programToDelete}`);

      dispatch(showNotification({ type: 'success', message: 'Program has been deleted.' }));
    } catch (err) {
      // Revert UI change on error (Note: unitData might be stale if page wasn't reloaded)
      // A better revert might be to re-fetch the unit, but this is simpler
      setUnit(prev => ({ ...prev })); // Force re-render, but ideally re-fetch unit details
      const message = err.response?.data?.message || 'Could not delete the program.';
      dispatch(showNotification({ type: 'error', message }));
    } finally {
      dispatch(setLoading(false));
      setProgramToDelete(null);
    }
  };

  const handleNewProgramChange = (e) => {
    const { name, value } = e.target;
    setNewProgramData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilesUpdate = ({ newFiles, existingImagesToKeep, imagesToDelete }) => {
    setNewProgramData(prev => ({ ...prev, newFiles, existingImagesToKeep, imagesToDelete }));
  };

  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newProgramData.name);
    formData.append('date', newProgramData.date);
    formData.append('description', newProgramData.description);

    for (const file of newProgramData.newFiles) {
      formData.append('images', file);
    }

    formData.append('existingImages', JSON.stringify(newProgramData.existingImagesToKeep));
    formData.append('imagesToDelete', JSON.stringify(newProgramData.imagesToDelete));

    dispatch(setLoading(true));
    handleCloseModal();

    try {
      let response;
      if (editingProgram) {
        response = await axios.put(`/user/units/${unit._id}/programs/${editingProgram._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUnit(prev => ({
          ...prev,
          programs: prev.programs.map(p => p._id === editingProgram._id ? response.data.program : p)
        }));
      } else {
        response = await axios.post(`/user/units/${unit._id}/programs`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setUnit(prev => ({ ...prev, programs: [response.data.program, ...prev.programs] }));
      }

      dispatch(showNotification({ type: 'success', message: response.data.message }));

    } catch (err) {
      const message = err.response?.data?.message || 'Operation failed.';
      dispatch(showNotification({ type: 'error', message }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ✨ --- UPDATED useEffect ---
  // ✨ --- UPDATED useEffect ---
  useEffect(() => {
    // Determine the correct ID to use, either from URL param or from prop
    const effectiveUnitId = unitId || unitData?._id;

    if (unitData) {
      setUnit(unitData);
    }

    // --- Unit Details Fetching ---
    const fetchUnitDetails = async () => {
      // Only fetch if 'unitData' prop wasn't provided AND we have a URL param
      if (!unitData && unitId) {
        setLoadingState(true);
        try {
          const response = await axios.get(`/user/units/${unitId}`);
          setUnit(response.data);
        } catch (err) {
          setError("Error fetching unit details.");
        } finally {
          setLoadingState(false);
        }
      } else {
        // We either have data from props, or no ID at all. In either case, main loading is done.
        setLoadingState(false);
      }
    };

    // --- Committee Fetching ---
    const fetchCommittees = async () => {
      setLoadingCommittees(true);
      try {
        const [msfRes, harithaRes] = await Promise.all([
          axios.get(`/user/unit-committee/${effectiveUnitId}/msf`),
          axios.get(`/user/unit-committee/${effectiveUnitId}/haritha`)
        ]);
        setMsfCommittee(msfRes.data);
        setHarithaCommittee(harithaRes.data);
      } catch (err) {
        console.error("Failed to load committees", err);
        dispatch(showNotification({ type: "error", message: "Failed to load committee data." }));
      } finally {
        setLoadingCommittees(false);
      }
    };

    // --- Execution Logic ---
    fetchUnitDetails(); // This will correctly set the main loading state

    if (effectiveUnitId) {
      // If we have an ID from any source, fetch the committees
      fetchCommittees();
    } else {
      // If we have no ID at all, we can't fetch, so stop the committee loading state
      setLoadingCommittees(false);
    }

  }, [unitId, unitData, dispatch]); // Dependencies are correct
  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!unit) return <div className="text-center py-10">No unit found.</div>;

  if (activeView.startsWith('edit-')) {
    const committeeType = activeView.split('-')[1];
    return (
      loadingCommittee ? (
        <div className="text-center py-10">Loading committee members...</div>
      ) : (
        <EditCommittee
          unitId={unit._id}
          committeeType={committeeType}
          members={committeeMembers} // ✅ pass fetched data
          onBack={() => setActiveView('details')}
        />
      )
    );
  }

  // ✨ UPDATED: Use the new 'harithaCommittee' state variable
  const hasHarithaCommittee = harithaCommittee && Object.values(harithaCommittee).some(
    (value) => (Array.isArray(value) && value.length > 0) || (typeof value === 'object' && value !== null)
  );

  const committeeVariants = {
    hidden: { height: 0, opacity: 0, marginTop: 0 },
    visible: { height: "auto", opacity: 1, marginTop: "1.5rem", transition: { duration: 0.4, ease: "easeInOut" } },
  };

  return (
    <div className="bg-slate-50 font-sans p-4 sm:p-6 ">
      <main className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">{unit.name}</h1>
          <div className="mt-4 flex justify-center items-center gap-4 sm:gap-6 text-slate-600">
            <span>Grade: <strong className="text-green-600">{unit.grade}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Rank: <strong className="text-green-600">{unit.rank || "N/A"}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Score: <strong className="text-green-600">{unit.totalScore}</strong></span>
          </div>
        </header>

        {/* ✨ UPDATED: Committee rendering */}
        <div className="space-y-10">
          {loadingCommittees ? (
            <div className="text-center py-5">Loading committees...</div>
          ) : (
            <>
              <CommitteeSection
                title="MSF Committee"
                committee={msfCommittee}
                showDetails={showMsfDetails}
                setShowDetails={setShowMsfDetails}
                variants={committeeVariants}
                onEdit={() => handleOpenCommitteeEdit('msf')}
              />
              {hasHarithaCommittee && (
                <CommitteeSection
                  title="Haritha Committee"
                  committee={harithaCommittee}
                  showDetails={showHarithaDetails}
                  setShowDetails={setShowHarithaDetails}
                  variants={committeeVariants}
                  onEdit={() => handleOpenCommitteeEdit('haritha')}
                />
              )}
            </>
          )}
        </div>

        <section className="mt-16">
          <div className="flex justify-center items-center text-center mb-8 relative">
            <h2 className="text-3xl font-bold text-slate-800">Conducted Programs</h2>
            <button
              onClick={handleOpenAddModal}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm bg-green-50 text-green-700 font-semibold px-3 py-2 rounded-lg hover:bg-green-100 transition"
              button>
              <PlusCircle size={16} /> Add Program
            </button>
          </div>

          {unit.programs && unit.programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {unit.programs.map((program) => (
                <ProgramCard
                  key={program._id}
                  program={program}
                  onSelect={setSelectedProgram}
                  onEdit={() => handleOpenEditModal(program)}
                  onDelete={() => handleDeleteRequest(program._id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-xl bg-white">
              <p className="text-slate-500">No programs conducted yet.</p>
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {isAddingProgram && (
          <AddProgramModal
            key={editingProgram ? editingProgram._id : 'add'}
            mode={editingProgram ? 'edit' : 'add'}
            initialData={editingProgram}
            onClose={handleCloseModal}
            onSubmit={handleProgramSubmit}
            data={newProgramData}
            onFormChange={handleNewProgramChange}
            onFilesUpdate={handleFilesUpdate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProgram && <ProgramModal program={selectedProgram} onClose={() => setSelectedProgram(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {isConfirmModalOpen && (
          <ConfirmationModal
            isOpen={isConfirmModalOpen}
            title="Confirm Deletion"
            message="Are you sure you want to delete this program? This action cannot be undone."
            onClose={() => {
              setIsConfirmModalOpen(false);
              setProgramToDelete(null);
            }}
            onConfirm={handleConfirmDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnitCard;