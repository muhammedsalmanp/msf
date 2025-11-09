import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import axios from "../../../../api/axiosInstance";
import { setLoading } from "../../../../Store/slices/loadingSlice";
import { showNotification } from "../../../../Store/slices/notificationSlice";
import { useDispatch } from "react-redux";
import imageCompression from 'browser-image-compression'; 

// // Local avatars
// import avthar1 from "public/assets/avthar-1.AVIF";
// import avthar2 from "public/assets/avthar-2.JPG";
// import avthar3 from "public/assets/avthar-3.JPG";
// import avthar4 from "public/assets/avthar-4.JPEG";
// import avthar5 from "public/assets/avthar-5.PNG";
// import avthar6 from "public/assets/avthar-6.JPEG";

const AddUserModal = ({ unitId, committeeType, onClose, onSubmit }) => {
  const [profilePic, setProfilePic] = useState(null); // Preview URL
  const [croppedImageFile, setCroppedImageFile] = useState(null); // File to be uploaded
  const [originalMimeType, setOriginalMimeType] = useState('image/jpeg');
  const [selectedAvatarPath, setSelectedAvatarPath] = useState(null); 
  const [showCropper, setShowCropper] = useState(false);
  const [imageForCrop, setImageForCrop] = useState(null);
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

  // const avatars = [avthar1, avthar2, avthar3, avthar4, avthar5, avthar6];

  const avatars = [
  "/assets/avthar-1.AVIF",
  "/assets/avthar-2.JPG",
  "/assets/avthar-3.JPG",
  "/assets/avthar-4.JPEG",
  "/assets/avthar-5.PNG",
  "/assets/avthar-6.JPEG",
];
  // File upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'image/png' || file.type === 'image/gif') {
        setOriginalMimeType(file.type);
      } else {
        setOriginalMimeType('image/jpeg');
      }
      setImageForCrop(URL.createObjectURL(file));
      setShowCropper(true);
    }
  };

  // Save cropped image
  const handleCropSave = async () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const blob = await new Promise((resolve) => {
        cropper.getCroppedCanvas({ width: 300, height: 300 })
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
        
        dispatch(setLoading(false));

        const croppedUrl = URL.createObjectURL(compressedFile);
        setProfilePic(croppedUrl); 
        setCroppedImageFile(compressedFile); 
        setShowCropper(false);
        setSelectedAvatarPath(null); // Clear avatar path
        
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        
      } catch (error) {
        dispatch(setLoading(false));
        dispatch(showNotification({
          type: 'error',
          message: 'Failed to compress image.',
        }));
        console.error("Compression error:", error);
      }
    }
  };

  // Handle avatar selection
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
      const imageFile = new File([blob], "avatar.jpg", { type: blob.type });
      const compressedFile = await imageCompression(imageFile, options);
      const previewUrl = URL.createObjectURL(compressedFile);
      setProfilePic(previewUrl);
      setCroppedImageFile(compressedFile);
      setSelectedAvatarPath(avatarUrl);
      
    } catch (error) {
      console.error("Error processing avatar:", error);
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to select avatar.',
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Name validation
  const validateName = (value) => {
    if (!value.trim()) return "Name cannot be empty.";
    if (!/^[A-Za-z\s]+$/.test(value)) return "Only letters are allowed.";
    return "";
  };

  const handleBlur = (field) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  // Submit handler
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
      formData.append("profileImage", croppedImageFile, croppedImageFile.name || "profile.jpg");
    } 

    dispatch(setLoading(true));

    try {
      onClose();
      const res = await axios.post("/admin/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ User added:", res.data.user);
      onSubmit(res.data.user);

      dispatch(showNotification({
        type: 'success',
        message: 'User added successfully!',
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add user!';
      dispatch(showNotification({
        type: 'error',
        message: errorMessage,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getFilteredAvatars = () => {
    if (gender === "Male") return avatars.slice(3, 6);
    if (gender === "Female") return avatars.slice(0, 3);
    return [];
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        {/* --- Header --- */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X size={22} />
        </button>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4 text-center">
          Add New Member
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* --- Profile Section --- */}
          <div className="flex flex-col items-center gap-4">
            
            {/* Profile Pic Preview */}
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

            {/* --- Conditional Upload/Avatar Section --- */}
            {/* If a file is uploaded (pic exists but it's not an avatar), show "Change" button */}
            {profilePic && !selectedAvatarPath ? (
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
              >
                Change your image
              </button>
            ) : (
              // Otherwise, show the full avatar and upload selection
              <>
                <p className="text-gray-700 text-sm font-medium text-center">
                  Upload your photo or choose any of the avatars
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {getFilteredAvatars().map((avatar, idx) => (
                    <img
                      key={idx}
                      src={avatar}
                      alt="Avatar option"
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
                  Upload your photo
                </button>
              </>
            )}

            <input
              ref={fileInputRef}
              id="profileUploadInput"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* --- Name Field --- */}
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
            {touched.name && !errors.name && (
              <p className="text-green-600 text-sm mt-1">Looks good!</p>
            )}
          </div>

          {/* --- Gender Dropdown --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                // Only reset pic if it wasn't a file upload (i.e., it was an avatar or nothing)
                if (selectedAvatarPath || !profilePic) {
                  setProfilePic(null);
                  setCroppedImageFile(null); 
                  setSelectedAvatarPath(null);
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              // ✅ REMOVED the 'disabled' prop here
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
              Submit
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

export default AddUserModal;