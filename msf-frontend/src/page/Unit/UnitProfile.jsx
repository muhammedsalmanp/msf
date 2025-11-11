import React, { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Users, LayoutGrid, Settings } from "lucide-react";
import EditCommittee from "./unitCardComponents/user/EditCommittee";
import { useDispatch } from 'react-redux';
import { showNotification } from "../../Store/slices/notificationSlice";
import { setLoading } from "../../Store/slices/loadingSlice";
import CommitteeSection from "./unitCardComponents/committe/CommitteeSection";
import ProgramCard from "./unitCardComponents/program/ProgramCard";
import ProgramModal from "./unitCardComponents/program/ProgramModal";
import AddProgramModal from "./unitCardComponents/program/AddProgramModal";
import ConfirmationModal from "./unitCardComponents/ConfirmationModal";
import UnitSettingsTab from "./unitCardComponents/setings/UnitSettingsTab";

const UnitProfile = () => {
    const [unit, setUnit] = useState(null);
    const [loading, setLoadingState] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('details');
    const [showMsfDetails, setShowMsfDetails] = useState(false);
    const [showHarithaDetails, setShowHarithaDetails] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [committeeMembers, setCommitteeMembers] = useState([]);
    const [loadingCommittee, setLoadingCommittee] = useState(false);

    // Modal and Form State
    const [isAddingProgram, setIsAddingProgram] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null); // Used to pass initialData to modal

    // --- State ONLY for the text inputs ---
    const [programFormData, setProgramFormData] = useState({
        name: '', date: '', description: ''
    });

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [programToDelete, setProgramToDelete] = useState(null);

    // --- UI STATE ---
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'programs', or 'settings'

    const dispatch = useDispatch();

    // --- Modal Open/Close Handlers ---
    const handleOpenAddModal = () => {
        setEditingProgram(null);
        // Reset only the text form data
        setProgramFormData({ name: '', date: '', description: '' });
        setIsAddingProgram(true);
    };

    const handleOpenEditModal = (program) => {
        // 1. Set the data for the text inputs (passed as 'data' prop)
        setProgramFormData({
            name: program.name,
            date: new Date(program.date).toISOString().split('T')[0],
            description: program.description,
        });

        // 2. Set the data for the modal's 'initialData' prop
        // This is what the modal uses to find the images.
        setEditingProgram({
            ...program,
            image: program.image
        });

        // 3. Open the modal
        setIsAddingProgram(true);
    };

    const handleCloseModal = () => {
        setIsAddingProgram(false);
        setEditingProgram(null);
    };


    const fetchUnitDetails = async () => {
        setLoadingState(true);
        setError(null);
        try {
            const response = await axios.get(`/unit/profile`);
            setUnit(response.data);
        } catch (err) {
            setError("Error fetching your profile details.");
            dispatch(showNotification({ type: 'error', message: err.response?.data?.message || "Could not fetch profile." }));
        } finally {
            setLoadingState(false);
        }
    };

    const handleOpenCommitteeEdit = async (committeeType) => {
        try {
            setLoadingCommittee(true);
            setError(null);
            const res = await axios.get(`/unit/committee/${committeeType}`);
            setCommitteeMembers(res.data || []);
            setActiveView(`edit-${committeeType}`);
        } catch (err) {
            dispatch(showNotification({ type: "error", message: "Failed to load committee members." }));
            setError("Could not load committee members.");
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
        const originalPrograms = unit.programs;

        try {
            setUnit(prevUnit => ({
                ...prevUnit,
                programs: prevUnit.programs.filter(p => p._id !== programToDelete)
            }));

            await axios.delete(`/unit/programs/${programToDelete}`);

            dispatch(showNotification({ type: 'success', message: 'Program deleted successfully.' }));
        } catch (err) {
            setUnit(prevUnit => ({ ...prevUnit, programs: originalPrograms }));
            const message = err.response?.data?.message || 'Could not delete the program.';
            dispatch(showNotification({ type: 'error', message }));
        } finally {
            dispatch(setLoading(false));
            setProgramToDelete(null);
        }
    };

    // --- Renamed handler for text inputs ---
    const handleProgramFormChange = (e) => {
        const { name, value } = e.target;
        setProgramFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- handleFilesUpdate REMOVED ---

    /**
     * --- Rewritten Submit Handler ---
     * Receives ALL data from the modal.
     */
    const handleProgramSubmit = async (submissionData) => {
        // Destructure data received from the modal
        const { name, date, description, newFiles, existingImagesToKeep, imagesToDelete } = submissionData;

        if (!name || !date) {
            dispatch(showNotification({ type: 'error', message: 'Program name and date are required.' }));
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('date', date);
        formData.append('description', description);

        newFiles.forEach(file => formData.append('images', file));

        // Use the editingProgram state (set when opening modal) to know if we are editing
        if (editingProgram) {
            // existingImagesToKeep and imagesToDelete come directly from submissionData
            // existingImagesToKeep should already be an array of strings (keys/URLs)
            formData.append('existingImages', JSON.stringify(existingImagesToKeep));
            formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
        }

        dispatch(setLoading(true));
        handleCloseModal(); // Close modal after getting data

        try {
            let response;
            // Use editingProgram state again to determine route
            if (editingProgram) {
                response = await axios.put(`/unit/programs/${editingProgram._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                // Update unit state based on response
                setUnit(prev => ({
                    ...prev,
                    programs: prev.programs.map(p => p._id === editingProgram._id ? response.data.program : p)
                }));
            } else {
                response = await axios.post(`/unit/programs`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                // Update unit state based on response
                setUnit(prev => ({ ...prev, programs: [response.data.program, ...(prev.programs || [])] }));
            }

            dispatch(showNotification({ type: 'success', message: response.data.message || 'Operation successful!' }));

        } catch (err) {
            const message = err.response?.data?.message || 'Operation failed.';
            dispatch(showNotification({ type: 'error', message }));
        } finally {
            dispatch(setLoading(false));
        }
    };

    // --- Effects ---
    useEffect(() => {
        fetchUnitDetails();
    }, []);

    // --- Render Logic ---
    if (loading) return <div className="text-center py-10">Loading Your Profile...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
    if (!unit) return <div className="text-center py-10">No profile data found.</div>;

    if (activeView.startsWith('edit-')) {
        const committeeType = activeView.split('-')[1];
        return (
            loadingCommittee ? (
                <div className="text-center py-10">Loading committee members...</div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <EditCommittee
                        unitId={unit._id}
                        committeeType={committeeType}
                        members={committeeMembers}
                        onBack={() => {
                            setActiveView('details');
                            fetchUnitDetails();
                        }}
                    />
                </motion.div>
            )
        );
    }

    const hasHarithaCommittee = unit.harithaCommittee && (
        unit.harithaCommittee.president ||
        unit.harithaCommittee.secretary ||
        unit.harithaCommittee.treasurer ||
        (unit.harithaCommittee.vicePresidents && unit.harithaCommittee.vicePresidents.length > 0) ||
        (unit.harithaCommittee.jointSecretaries && unit.harithaCommittee.jointSecretaries.length > 0)
    );

    // --- Animation Variants ---
    const pageVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
    };

    const tabContentVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, x: 10, transition: { duration: 0.2, ease: "easeIn" } },
    };

    const listVariants = {
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    };

    // --- TABS ARRAY ---
    const TABS = [
        { id: 'overview', label: 'Overview', icon: Users },
        { id: 'programs', label: 'Programs', icon: LayoutGrid },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    // --- Main Render ---
    return (
        <div className="bg-slate-50 font-sans p-4 sm:p-6  min-h-screen overflow-x-hidden">
            <motion.main
                className="max-w-6xl mx-auto mb-30"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Section */}
                <header className="text-center mb-8 lg:mt-24">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">{unit.name}</h1>
                    <div className="mt-4 flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-slate-600">
                        <span>Grade: <strong className="text-green-600">{unit.grade || 'N/A'}</strong></span>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <span>Rank: <strong className="text-green-600">{unit.rank || "N/A"}</strong></span>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <span>Score: <strong className="text-green-600">{unit.totalScore || 0}</strong></span>
                    </div>
                </header>

                {/* --- Tab Navigation --- */}
                <nav className="mb-10 flex justify-center">
                    <div className="flex space-x-2 p-1.5 bg-slate-200/60 rounded-xl">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2 lg:w-32 justify-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === tab.id ? 'text-green-800' : 'text-slate-600 hover:text-slate-800'}`}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                            >
                                {activeTab === tab.id && (
                                    <motion.span
                                        layoutId="tabIndicator"
                                        className="absolute inset-0 z-10 bg-white shadow-md rounded-lg"
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-20"><tab.icon size={16} /></span>
                                <span className="relative z-20">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </nav>

                {/* --- Tab Content --- */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div key="overview" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-10">
                            <CommitteeSection
                                title="MSF Committee"
                                committee={unit.msfCommittee}
                                showDetails={showMsfDetails}
                                setShowDetails={setShowMsfDetails}
                                variants={{
                                    hidden: { height: 0, opacity: 0, marginTop: 0, overflow: 'hidden' },
                                    visible: { height: "auto", opacity: 1, marginTop: "1.5rem", transition: { duration: 0.4, ease: "easeInOut" } },
                                }}
                                onEdit={() => handleOpenCommitteeEdit('msf')}
                            />
                                <CommitteeSection
                                    title="Haritha Committee"
                                    committee={unit.harithaCommittee}
                                    showDetails={showHarithaDetails}
                                    setShowDetails={setShowHarithaDetails}
                                    variants={{
                                        hidden: { height: 0, opacity: 0, marginTop: 0, overflow: 'hidden' },
                                        visible: { height: "auto", opacity: 1, marginTop: "1.5rem", transition: { duration: 0.4, ease: "easeInOut" } },
                                    }}
                                    onEdit={() => handleOpenCommitteeEdit('haritha')}
                                />
                        </motion.div>
                    )}

                    {activeTab === 'programs' && (
                        <motion.div key="programs" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                            <section>
                                <div className="flex flex-col sm:flex-row justify-between items-center text-center mb-8 relative px-4">
                                    <h2 className="text-3xl font-bold text-slate-800 mb-4 sm:mb-0">Conducted Programs</h2>
                                    <button
                                        onClick={handleOpenAddModal}
                                        className="flex items-center gap-2 text-sm bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-green-200 transition shadow-sm"
                                    >
                                        <PlusCircle size={16} /> Add Program
                                    </button>
                                </div>
                                {unit.programs && unit.programs.length > 0 ? (
                                    <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" variants={listVariants} initial="hidden" animate="visible">
                                        {unit.programs.map((program) => (
                                            <motion.div key={program._id} variants={itemVariants}>
                                                <ProgramCard
                                                    program={program}
                                                    onSelect={setSelectedProgram}
                                                    onEdit={() => handleOpenEditModal(program)}
                                                    onDelete={() => handleDeleteRequest(program._id)}
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
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div key="settings" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                            <UnitSettingsTab
                                unitId={unit._id}
                                unitName={unit.name}
                                unitUsername={unit.username}
                                dispatch={dispatch}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.main>

            {/* --- Modals --- */}
            <AnimatePresence>
                {isAddingProgram && (
                    <AddProgramModal
                        key={editingProgram ? editingProgram._id : 'add'}
                        mode={editingProgram ? 'edit' : 'add'}
                        initialData={editingProgram} // Used to load images in edit mode
                        onClose={handleCloseModal}
                        onSubmit={handleProgramSubmit} // The NEW submit handler
                        // onFilesUpdate prop removed
                        data={programFormData} // The NEW state for text inputs
                        onFormChange={handleProgramFormChange} // The NEW handler for text inputs
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

export default UnitProfile;