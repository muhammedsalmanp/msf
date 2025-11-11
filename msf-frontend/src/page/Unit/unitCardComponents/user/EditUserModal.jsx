import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import axios from "../../../../api/axiosInstance";
import { setLoading } from "../../../../Store/slices/loadingSlice";
import { showNotification } from "../../../../Store/slices/notificationSlice";
import { useDispatch } from "react-redux";
import imageCompression from "browser-image-compression";

// ✅ Local avatars (from /public/assets/avthar)
const AVATAR_URLS = {
  FEMALE: [
    "/assets/avthar/avthar-1.avif",
    "/assets/avthar/avthar-2.jpg",
    "/assets/avthar/avthar-3.jpg",
  ],
  MALE: [
    "/assets/avthar/avthar-4.jpeg",
    "/assets/avthar/avthar-5.png",
    "/assets/avthar/avthar-6.jpeg",
  ],
};

const EditUserModal = ({ memberToEdit, unitId, committeeType, onClose, onSubmit }) => {
  const [profilePic, setProfilePic] = useState(null);
  const [croppedImageFile, setCroppedImageFile] = useState(null);
  const [originalMimeType, setOriginalMimeType] = useState("image/jpeg");
  const [selectedAvatarPath, setSelectedAvatarPath] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageForCrop, setImageForCrop] = useState(null);
  const [hasExistingImage, setHasExistingImage] = useState(false);

  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("Male");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const roles = [
    "President",
    "Secretary",
    "Treasurer",
    "Vice President",
    "Joint Secretary",
    "Member",
  ];

  // ✅ Initialize modal with existing data
  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name || "");
      const formattedGender = memberToEdit.gender
        ? memberToEdit.gender.charAt(0).toUpperCase() + memberToEdit.gender.slice(1)
        : "Male";
      setGender(formattedGender);
      setRole(
        memberToEdit.roles?.length > 0 && memberToEdit.roles[0]?.role
          ? memberToEdit.roles[0].role.title
          : ""
      );
      setProfilePic(memberToEdit.profileImage || null);
      setHasExistingImage(!!memberToEdit.profileImage);
    }
  }, [memberToEdit]);

  // ✅ Handle file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOriginalMimeType(file.type === "image/png" ? file.type : "image/jpeg");
      setImageForCrop(URL.createObjectURL(file));
      setShowCropper(true);
    }
  };

  // ✅ Save cropped image
  const handleCropSave = async () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const blob = await new Promise((resolve) => {
        cropper
          .getCroppedCanvas({ width: 300, height: 300 })
          .toBlob(resolve, originalMimeType, 1.0);
      });

      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      try {
        dispatch(setLoading(true));
        const imageFile = new File([blob], "profile.jpg", { type: blob.type });
        const compressedFile = await imageCompression(imageFile, options);
        const croppedUrl = URL.createObjectURL(compressedFile);

        setProfilePic(croppedUrl);
        setCroppedImageFile(compressedFile);
        setShowCropper(false);
        setSelectedAvatarPath(null);
        setHasExistingImage(true);

        if (fileInputRef.current) fileInputRef.current.value = null;
      } catch (error) {
        dispatch(setLoading(false));
        dispatch(showNotification({
          type: "error",
          message: "Failed to compress image.",
        }));
        console.error("Compression error:", error);
      } finally {
        dispatch(setLoading(false));
      }
    }
  };

  // ✅ Handle avatar selection (convert avatar to real file)
  const handleAvatarSelect = async (avatarUrl) => {
    dispatch(setLoading(true));
    try {
      const response = await fetch(avatarUrl);
      const blob = await response.blob();

      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const avatarFile = new File([blob], "avatar.jpg", { type: blob.type });
      const compressedFile = await imageCompression(avatarFile, options);
      const previewUrl = URL.createObjectURL(compressedFile);

      setProfilePic(previewUrl);
      setCroppedImageFile(compressedFile);
      setSelectedAvatarPath(avatarUrl);
      setHasExistingImage(true);
    } catch (error) {
      console.error("Error selecting avatar:", error);
      dispatch(showNotification({
        type: "error",
        message: "Failed to select avatar.",
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ✅ Name validation
  const validateName = (value) => {
    if (!value.trim()) return "Name cannot be empty.";
    if (!/^[A-Za-z\s]+$/.test(value)) return "Only letters are allowed.";
    return "";
  };

  const handleBlur = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // ✅ Submit (update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameError = validateName(name);
    if (nameError) {
      setErrors({ name: nameError });
      setTouched({ name: true });
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("gender", gender.toLowerCase());
    formData.append("role", role);
    formData.append("unitId", unitId);
    formData.append("committeeType", committeeType);

    if (croppedImageFile) {
      formData.append("profileImage", croppedImageFile, "profile.jpg");
    }

    dispatch(setLoading(true));

    try {
      onClose();
      const res = await axios.put(`/admin/update/${memberToEdit._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSubmit(res.data.user);
      dispatch(showNotification({
        type: "success",
        message: "User updated successfully!",
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update user!";
      dispatch(showNotification({
        type: "error",
        message: errorMessage,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // ✅ Get avatars by gender
  const getFilteredAvatars = () => {
    return gender === "Female" ? AVATAR_URLS.FEMALE : AVATAR_URLS.MALE;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
          <X size={22} />
        </button>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4 text-center">
          Edit Member
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* --- Profile Section --- */}
          <div className="flex flex-col items-center gap-4">
            {profilePic ? (
              <img
                src={profilePic}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover border-2 border-green-500"
              />
            ) : (
              <div className="h-24 w-24 flex items-center justify-center bg-gray-200 rounded-full text-gray-500 text-sm">
                No Image
              </div>
            )}

            {/* --- Image / Avatar Options --- */}
            <p className="text-gray-700 text-sm font-medium text-center">
              Upload your photo or choose any of the avatars
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {getFilteredAvatars().map((avatar, idx) => (
                <img
                  key={idx}
                  src={avatar}
                  alt="Avatar"
                  className={`h-12 w-12 rounded-full cursor-pointer border-2 transition ${
                    selectedAvatarPath === avatar
                      ? "border-blue-500 scale-105"
                      : "border-transparent hover:scale-105"
                  }`}
                  onClick={() => handleAvatarSelect(avatar)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {hasExistingImage ? "Change your image" : "Upload your photo"}
            </button>

            <input
              ref={fileInputRef}
              id="profileUploadInput"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* --- Name --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none ${
                errors.name && touched.name
                  ? "border-red-500"
                  : !errors.name && touched.name
                  ? "border-green-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter full name"
            />
            {touched.name && errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* --- Gender --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                if (!hasExistingImage) {
                  setProfilePic(null);
                  setCroppedImageFile(null);
                  setSelectedAvatarPath(null);
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* --- Role --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a role</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* --- Buttons --- */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              Update Member
            </button>
          </div>
        </form>
      </div>

      {/* --- Crop Modal --- */}
      {showCropper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-3">Crop your photo</h3>
            <Cropper
              ref={cropperRef}
              src={imageForCrop}
              style={{ height: 300, width: "100%" }}
              aspectRatio={1}
              viewMode={1}
              guides={false}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCropper(false)}
                className="px-3 py-1 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditUserModal;
