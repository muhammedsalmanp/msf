import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../../api/axiosInstance';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../Store/slices/notificationSlice';
import { setLoading } from '../../../Store/slices/loadingSlice';
import {
    FaMapMarkedAlt,
    FaTools,
    FaUpload,
    FaTimes,
} from 'react-icons/fa';

const AdminActions = () => {
    const dispatch = useDispatch();
    const [modal, setModal] = useState(null); 
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = async (type) => {
        if (!inputValue.trim()) return;
        dispatch(setLoading(true));

        try {
            if (type === 'unit') {
                await axios.post('/admin/add-units', { name: inputValue });
                dispatch(showNotification({ type: 'success', message: 'Unit added successfully' }));
            } else if (type === 'role') {
                await axios.post('/admin/add-roles', { title: inputValue });
                dispatch(showNotification({ type: 'success', message: 'Role added successfully' }));
            } else if (type === 'program') {
                await axios.post('/admin/add-programs', { title: inputValue });
                dispatch(showNotification({ type: 'success', message: 'Program added successfully' }));
            }

            // ✅ Clear input and close modal
            setInputValue('');
            setModal(null);

        } catch (err) {
            const message = err?.response?.data?.message || 'Something went wrong!';
            dispatch(showNotification({ type: 'error', message }));
        } finally {
            setInputValue('');
            setModal(null);
            dispatch(setLoading(false));
        }
    };

    const actions = [
        {
            title: 'Add Unit',
            description: 'Create a new MSF Unit',
            icon: <FaMapMarkedAlt className="text-3xl text-green-600" />,
            color: 'bg-green-100',
            type: 'unit',
        },
        {
            title: 'Add Role',
            description: 'Define a new role (e.g., President)',
            icon: <FaTools className="text-3xl text-blue-600" />,
            color: 'bg-blue-100',
            type: 'role',
        },
        {
            title: 'Add Program',
            description: 'Upload a global MSF program',
            icon: <FaUpload className="text-3xl text-emerald-600" />,
            color: 'bg-emerald-100',
            type: 'program',
        },
    ];

    const labelMap = {
        unit: 'Enter unit name',
        role: 'Enter role title',
        program: 'Enter program title',
    };

    return (
        <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {actions.map((item, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-6 rounded-xl shadow cursor-pointer ${item.color} transition-all duration-300`}
                        onClick={() => {
                            setModal(item.type);
                            setInputValue('');
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-full shadow">{item.icon}</div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                                <p className="text-sm text-gray-600">{item.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {modal && (
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
                            <h3 className="text-xl font-semibold mb-4 text-gray-800 capitalize">
                                Add New {modal}
                            </h3>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSubmit(modal);
                                }}
                                className="space-y-4"
                            >
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={labelMap[modal]}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                >
                                    Add {modal}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminActions;
