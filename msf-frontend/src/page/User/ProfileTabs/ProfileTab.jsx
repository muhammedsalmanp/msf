import { useState, useRef, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setLoading } from "../../../Store/slices/loadingSlice";
import { showNotification } from "../../../Store/slices/notificationSlice";
import FreeCropModal from "./FreeCropModal";
import ChangePasswordModal from "./unitCardComponents/ChangePasswordModal";
import { FaEdit } from "react-icons/fa";
import Swal from "sweetalert2";

function ProfileTab({ user, setUser }) {
  const [preview, setPreview] = useState(
    user.profileImage || "https://i.pravatar.cc/150"
  );
  const [imageSrc, setImageSrc] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [tempProfileImage, setTempProfileImage] = useState(null);
  const [formData, setFormData] = useState({ ...user });
  const [units, setUnits] = useState([]); // State to store the units
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await axiosInstance.get("/user/units?page=1&limit=25");
        setUnits(response.data.units);
      } catch (error) {
        console.log("Error fetching units:", error);
        dispatch(
          showNotification({
            type: "error",
            message: "Failed to load units",
          })
        );
      }
    };

    fetchUnits();
  }, [dispatch]);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setIsModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile) => {
    if (!croppedFile) return;
    setIsModalOpen(false);

    try {
      dispatch(setLoading(true));
      const previewUrl = URL.createObjectURL(croppedFile);
      setPreview(previewUrl);
      setTempProfileImage(croppedFile);

      dispatch(
        showNotification({
          type: "success",
          message: "Profile picture ready to save",
        })
      );
    } catch {
      dispatch(
        showNotification({ type: "error", message: "Failed to process image" })
      );
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Handle Input Change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  // Confirm unit change
  const handleUnitClick = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "If you update your unit, your roles will be removed. Please contact your unit in-charge.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update unit",
    }).then((result) => {
      if (result.isConfirmed) {
        setShowUnitDropdown(true);
      }
    });
  };

  // Validation
  const validateForm = () => {
    if (!formData.name?.trim()) {
      dispatch(
        showNotification({ type: "error", message: "Name is required" })
      );
      return false;
    }
    
    // 👈 USERNAME VALIDATION
    if (!formData.username?.trim()) {
      dispatch(
        showNotification({ type: "error", message: "Username is required" })
      );
      return false;
    }


    if (!formData.gender || !["male", "female"].includes(formData.gender)) {
      dispatch(
        showNotification({
          type: "error",
          message: "Please select Male or Female",
        })
      );
      return false;
    }

    return true;
  };

  // Save profile
  const handleSave = async () => {
    if (!validateForm()) return;

    dispatch(setLoading(true));
    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        // Handle 'unit' object properly
        if (key === 'unit' && typeof value === 'object' && value !== null) {
          formDataToSend.append(key, value._id);
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      // Append image if changed
      if (tempProfileImage) {
        formDataToSend.append("profileImage", tempProfileImage);
      }

      // Single API call (POST with multipart/form-data)
      const res = await axiosInstance.post("/user/profile", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Profile update response:", res.data);

      // Update state with backend response
      setUser(res.data.user);
      setTempProfileImage(null);

      dispatch(
        showNotification({
          type: "success",
          message: res.data.message || "Profile updated successfully",
        })
      );
    } catch (error) {
      console.error("❌ Save error:", error);

      if (error.response?.status === 401) {
        dispatch(
          showNotification({
            type: "error",
            message: "Unauthorized. Please log in again.",
          })
        );
      } else {
        dispatch(
          showNotification({
            type: "error",
            message:
              error.response?.data?.message || "Failed to update profile",
          })
        );
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h3 className="text-lg font-semibold mb-6 text-center md:text-center">
        Profile Information
      </h3>

      <div className="flex flex-col md:flex-row md:gap-8 ">
        {/* Left Column */}
        <div className="flex flex-col items-center md:items-start md:w-2/4 gap-4">
          {/* Profile Image */}
          <div className="lg:left-25 relative w-40 h-40">
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border border-gray-300 cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            />
            <div
              className="absolute bottom-0 right-0 bg-gray-200 rounded-full p-2 cursor-pointer hover:bg-gray-300"
              onClick={() => fileInputRef.current.click()}
            >
              <FaEdit className="text-gray-600" />
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Name */}
          <div className="w-full">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* 👈 USERNAME FIELD */}
          <div className="w-full">
            <label className="block text-sm font-medium">Username</label>
            <input
              type="text"
              value={formData.username || ""}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 mt-6 md:mt-0 md:w-2/4">
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium">Gender</label>
            <select
              value={formData.gender || ""}
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium">Unit</label>
            {!showUnitDropdown ? (
              <input
                type="text"
                value={formData.unit?.name || ""}
                readOnly
                onClick={handleUnitClick}
                className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-100 cursor-pointer"
              />
            ) : (
              <select
                name="unit"
                value={formData.unit?._id || ""}
                onChange={(e) =>
                  handleInputChange(
                    "unit",
                    units.find((u) => u._id === e.target.value)
                  )
                }
                className="w-full border rounded-lg px-3 py-2 mt-1"
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-medium">Roles</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.roles && formData.roles.length > 0 ? (
                formData.roles.map((r, i) => {
                  let label = r.roleTitle || r.role?.name || "Role";
                  if (r.scope === "unit") {
                    label = `${label} – ${formData.unit?.name || ""}`;
                  } else if (r.scope === "main") {
                    label = `${label} – Panchayath`;
                  } else if (r.scope === "haritha") {
                    label = `${label} – Haritha`;
                  }
                  return (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full"
                    >
                      {label}
                    </span>
                  );
                })
              ) : (
                <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                  Member
                </span>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium">Password</label>
            <button
              onClick={() => setIsPasswordModalOpen(true)} // 👈 UPDATED ONCLICK
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 mt-1"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Save & Cancel */}
      <div className="flex justify-center mt-8 md:justify-center space-x-4 pb-15">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save
        </button>

        <button
          onClick={() => setFormData({ ...user })}
          className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>

      {/* Free Crop Modal */}
      <FreeCropModal
        isOpen={isModalOpen}
        imageSrcList={imageSrc ? [imageSrc] : []}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCropComplete}
        onSkip={(remainingImages) => {
          if (remainingImages.length > 0) {
            const skippedImage = remainingImages[0];
            fetch(skippedImage)
              .then((res) => res.blob())
              .then((blob) => {
                const file = new File([blob], `profile_${Date.now()}.jpg`, {
                  type: "image/jpeg",
                });

                const previewUrl = URL.createObjectURL(file);
                setPreview(previewUrl);
                setTempProfileImage(file);

                dispatch(
                  showNotification({
                    type: "success",
                    message: "Profile picture uploaded without cropping",
                  })
                );
              });
          }
          setIsModalOpen(false);
        }}
      />
      
      {/* 👈 RENDER PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}

export default ProfileTab;