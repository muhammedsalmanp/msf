import React, { useState, useEffect } from 'react';
import axios from '../../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../store/slices/notificationSlice';
import { setLoading } from '../../../store/slices/loadingSlice';
import { FaCamera } from 'react-icons/fa';
import CropperModal from '../../../components/ImageCropper'; // Import the CropperModal component

const AddMemberPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [units, setUnits] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    name: '',
    gender: '',
    username: '', // <-- CHANGED from 'phone'
    profileImage: null,
    roles: [{ role: '', scope: 'unit' }],
    unit: '',
  });
  const [showCropperModal, setShowCropperModal] = useState(false); // State to manage crop modal visibility
  const [imageSrc, setImageSrc] = useState(null); // State to hold the selected image source for cropping

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [unitRes, roleRes] = await Promise.all([
          axios.get('/admin/getUnits'),
          axios.get('/admin/getRole'),
        ]);
        setUnits(unitRes.data || []);
        setRoles(roleRes.data || []);
      } catch (err) {
        dispatch(
          showNotification({
            type: 'error',
            message: 'Failed to fetch roles or units',
          })
        );
      }
    };
    fetchOptions();
  }, [dispatch]); // Added dispatch to dependency array

  const handleAddRole = () => {
    setForm((prev) => ({
      ...prev,
      roles: [...prev.roles, { role: '', scope: 'unit' }],
    }));
  };

  const handleRoleChange = (index, key, value) => {
    const updated = [...form.roles];
    updated[index][key] = value;
    setForm({ ...form, roles: updated });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageSrc(URL.createObjectURL(file)); // Set the image source to preview in the crop modal
      setShowCropperModal(true); // Open the cropper modal
    }
  };

  const handleImageCrop = (croppedImage) => {
    setForm((prev) => ({ ...prev, profileImage: croppedImage })); // Save the cropped image in the form state
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));

    // Retrieve the current form values
    const { name, gender, username, unit, profileImage, roles } = form; // <-- CHANGED from 'phone'

    // Validate the user input values before proceeding with the submission
    if (!name || !gender || !username || !unit || !profileImage) { // <-- CHANGED from 'phone'
      dispatch(
        showNotification({
          type: 'error',
          message:
            'Please fill out all required fields and upload a profile image.',
        })
      );
      dispatch(setLoading(false));
      return;
    }

    // --- REMOVED Phone Validation ---

    // --- ADDED Username Validation ---
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/; // 3-20 chars, letters, numbers, underscore
    if (!usernameRegex.test(username)) {
      dispatch(
        showNotification({
          type: 'error',
          message:
            'Username must be 3-20 characters and contain only letters, numbers, and underscores (_).',
        })
      );
      dispatch(setLoading(false));
      return;
    }
    // -------------------------------

    // Log the form values to check if they're correct
    console.log('Form Values:', { name, gender, username, unit, roles, profileImage }); // <-- CHANGED

    try {
      // Create a FormData object and append the form data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('gender', gender);
      formData.append('username', username); // <-- CHANGED
      formData.append('unit', unit);
      formData.append('roles', JSON.stringify(roles));

      // Append the profile image (if exists)
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      // Send the request to the backend
      const response = await axios.post('/admin/members', formData);

      // Handle successful response
      if (response.status === 201) {
        dispatch(
          showNotification({ type: 'success', message: 'Member added successfully' })
        );
        if (response.data.gender === 'female') {
          navigate('/admin/HarithaMemberManagement');
        } else {
          navigate('/admin/MsfMemberManagement');
        }
      } else {
        dispatch(
          showNotification({ type: 'error', message: 'Failed to add member' })
        );
      }
    } catch (err) {
      // Log and display any errors
      console.error('Error submitting form:', err);
      const errorMessage = err?.response?.data?.message || 'Server error';
      dispatch(showNotification({ type: 'error', message: errorMessage }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">
        Add New Member
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 mb-2">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              {form.profileImage ? (
                <img
                  src={URL.createObjectURL(form.profileImage)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                  No Image
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white cursor-pointer">
              <FaCamera />
              <input
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="border p-2 rounded w-full"
        />

        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          required
          className="border p-2 rounded w-full"
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        {/* --- THIS IS THE UPDATED USERNAME FIELD --- */}
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => {
            // This regex replaces any character that is NOT a letter, number, or underscore
            const sanitizedValue = e.target.value.replace(
              /[^a-zA-Z0-9_]/g,
              ''
            );
            setForm({ ...form, username: sanitizedValue });
          }}
          required
          className="border p-2 rounded w-full"
        />
        {/* ------------------------------------------ */}

        <select
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          required
          className="border p-2 rounded w-full"
        >
          <option value="">Select Member's Home Unit</option>
          {units.map((unit) => (
            <option key={unit._id} value={unit._id}>
              {unit.name}
            </option>
          ))}
        </select>

        <div>
          <label className="block font-medium text-gray-700 mb-2">Roles</label>
          {form.roles.map((r, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 mb-2">
              <select
                value={r.role}
                onChange={(e) => handleRoleChange(i, 'role', e.target.value)}
                required
                className="border p-2 rounded w-full"
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.title}
                  </option>
                ))}
              </select>
              <select
                value={r.scope}
                onChange={(e) => handleRoleChange(i, 'scope', e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="unit">Unit</option>
                <option value="main">Panchayath</option>
                <option value="haritha">Haritha</option>
              </select>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddRole}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add another role
          </button>
        </div>

        <div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Submit
          </button>
        </div>
      </form>

      {showCropperModal && (
        <CropperModal
          imageSrc={imageSrc}
          onClose={() => setShowCropperModal(false)}
          onCropDone={handleImageCrop}
        />
      )}
    </div>
  );
};

export default AddMemberPage;