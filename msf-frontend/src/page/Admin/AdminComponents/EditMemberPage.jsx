import React, { useState, useEffect } from 'react';
import axios from '../../../api/axiosInstance';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../Store/slices/notificationSlice';
import { setLoading } from '../../../Store/slices/loadingSlice';
import { FaCamera } from 'react-icons/fa';
import CropperModal from '../../../components/ImageCropper';

// Changed name
const EditMemberPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams(); // Get the member ID from the URL
  const [units, setUnits] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    name: '',
    gender: '',
    username: '',
    profileImage: null, // This will hold a URL string or a File object
    roles: [{ role: '', scope: 'unit' }],
    unit: '',
  });
  const [showCropperModal, setShowCropperModal] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // For showing the existing or new image

  useEffect(() => {
    const fetchOptionsAndMember = async () => {
      dispatch(setLoading(true));
      try {
        // Fetch units, roles, and member data all at once
        const [unitRes, roleRes, memberRes] = await Promise.all([
          axios.get('/admin/getUnits'),
          axios.get('/admin/getRole'),
          axios.get(`/admin/members/${id}`), // Fetch the member's data
        ]);

        setUnits(unitRes.data || []);
        setRoles(roleRes.data || []);

        // Pre-populate the form with member's data
        const memberData = memberRes.data;
        setForm({
          name: memberData.name,
          gender: memberData.gender,
          username: memberData.username || '',
          profileImage: memberData.profileImage, // This is the existing URL
          unit: memberData.unit,
          // Format roles correctly for the form
          roles: memberData.roles.map(r => ({
             role: r.role._id, // We get the populated role object
             scope: r.scope 
            })),
        });
        setImagePreview(memberData.profileImage); // Set initial image preview

      } catch (err) {
        dispatch(
          showNotification({
            type: 'error',
            message: 'Failed to fetch data',
          })
        );
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchOptionsAndMember();
  }, [dispatch, id]);

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
      setImageSrc(URL.createObjectURL(file));
      setShowCropperModal(true);
    }
  };

  const handleImageCrop = (croppedImage) => {
    setForm(prev => ({ ...prev, profileImage: croppedImage })); // Save cropped image File
    setImagePreview(URL.createObjectURL(croppedImage)); // Update preview
  };

  // --- UPDATED handleSubmit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));

    const { name, gender, username, unit, profileImage, roles } = form;

    if (!name || !gender || !username || !unit) {
      dispatch(
        showNotification({
          type: 'error',
          message: 'Please fill out all required fields.',
        })
      );
      dispatch(setLoading(false));
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
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

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('gender', gender);
      formData.append('username', username);
      formData.append('unit', unit);
      formData.append('roles', JSON.stringify(roles));

      // IMPORTANT: Only append profileImage if it's a new File (blob)
      // If it's still the URL string, we don't send it.
      if (profileImage instanceof File) {
        formData.append('profileImage', profileImage);
      }

      // --- Use PUT request and include ID ---
      const response = await axios.put(`/admin/members/${id}`, formData);

      if (response.status === 200) {
        dispatch(
          showNotification({ type: 'success', message: 'Member updated successfully' })
        );
        // Navigate back to the management page
        navigate('/admin/MsfMemberManagement');
      } else {
        dispatch(
          showNotification({ type: 'error', message: 'Failed to update member' })
        );
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      const errorMessage = err?.response?.data?.message || 'Server error';
      dispatch(showNotification({ type: 'error', message: errorMessage }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Changed Title */}
      <h3 className="text-xl font-semibold mb-4 text-gray-800 text-center">
        Edit Member
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 mb-2">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              
              {/* Updated Preview Logic */}
              {imagePreview ? (
                <img
                  src={imagePreview}
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

        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => {
            const sanitizedValue = e.target.value.replace(
              /[^a-zA-Z0-9_]/g,
              ''
            );
            setForm({ ...form, username: sanitizedValue });
          }}
          required
          className="border p-2 rounded w-full"
        />

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
            Update Member
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

export default EditMemberPage;