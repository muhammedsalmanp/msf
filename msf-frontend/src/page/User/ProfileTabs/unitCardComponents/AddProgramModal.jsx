// import React, { useState, useEffect } from 'react';
// import { motion } from "framer-motion";
// import { X, Trash2, Crop, FileImage } from "lucide-react";
// import ImageCropperModal from './ImageCropperModal';

// const AddProgramModal = ({
//   mode = 'add',
//   initialData = null,
//   onClose,
//   onSubmit,
//   data,
//   onFormChange,
//   onFilesUpdate
// }) => {
//   const [selectedImages, setSelectedImages] = useState([]);
//   const [croppingImage, setCroppingImage] = useState(null);
//   const [imageError, setImageError] = useState('');
//   const [imagesToDelete, setImagesToDelete] = useState([]);

// useEffect(() => {
//   // Check if we are in edit mode and the 'image' array exists
//   if (mode === 'edit' && initialData && Array.isArray(initialData.image)) {
    
//     // Map over the array of URL strings
//     const existingImages = initialData.image.map(imageUrl => ({
//       // For each string, create an object that the rest of your component expects
//       url: imageUrl,      // The URL string is the url
//       key: imageUrl,      // We can use the URL as a unique key for deletion
//       preview: imageUrl,  // The URL string is also the source for the preview
//       status: 'existing', // Mark it as an existing image
//     }));

//     // Set the state with the newly created array of objects
//     setSelectedImages(existingImages);
//   }
// }, [mode, initialData]);

//   useEffect(() => {
//     const newFiles = selectedImages
//       .filter(img => img.status === 'new')
//       .map(img => img.file);

//     const existingImagesToKeep = selectedImages
//       .filter(img => img.status === 'existing');

//     onFilesUpdate({
//       newFiles,
//       existingImagesToKeep,
//       imagesToDelete
//     });
//   }, [selectedImages, imagesToDelete, onFilesUpdate]);

//   const handleFileChange = (e) => {
//     setImageError('');
//     const newFiles = Array.from(e.target.files);
//     const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

//     if (selectedImages.length + newFiles.length > 10) {
//       setImageError('You can only have a maximum of 10 images.');
//       return;
//     }

//     const validFiles = [];
//     for (const file of newFiles) {
//       if (!allowedTypes.includes(file.type)) {
//         setImageError(`File type not supported: ${file.name}.`);
//         return;
//       }
//       const isDuplicate = selectedImages.some(img =>
//         img.file && (img.file.name === file.name && img.file.size === file.size)
//       );
//       if (isDuplicate) {
//         setImageError(`Image already selected: ${file.name}.`);
//         return;
//       }
//       validFiles.push(file);
//     }

//     if (validFiles.length > 0) {
//       const newImages = validFiles.map(file => ({
//         file: file,
//         preview: URL.createObjectURL(file),
//         status: 'new',
//       }));
//       setSelectedImages(prev => [...prev, ...newImages]);
//     }
//     e.target.value = null; // Reset file input
//   };

//   const handleRemoveImage = (indexToRemove) => {
//     setImageError('');
//     const imageToRemove = selectedImages[indexToRemove];


//     if (imageToRemove.status === 'existing') {
//       setImagesToDelete(prev => [...prev, imageToRemove.key]);
//     }


//     if (imageToRemove.preview.startsWith('blob:')) {
//       URL.revokeObjectURL(imageToRemove.preview);
//     }

//     // Remove the image from the display
//     setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
//   };
  
//   const handleCropSave = (index, croppedImageBlob) => {
//     const imageToUpdate = selectedImages[index];

//     // If we crop an existing image, the original is marked for deletion
//     if (imageToUpdate.status === 'existing') {      
//       setImagesToDelete(prev => [...prev, imageToUpdate.key]);
//     }

//     const fileName = imageToUpdate.file ? imageToUpdate.file.name : 'cropped-image.jpg';
//     const newFile = new File([croppedImageBlob], fileName, { type: croppedImageBlob.type });
//     const newPreview = URL.createObjectURL(croppedImageBlob);

//     setSelectedImages(prev => {
//       const updatedImages = [...prev];
//       if (updatedImages[index].preview.startsWith('blob:')) {
//         URL.revokeObjectURL(updatedImages[index].preview);
//       }
//       // The cropped image is always treated as a 'new' file to be uploaded
//       updatedImages[index] = { file: newFile, preview: newPreview, status: 'new' };
//       return updatedImages;
//     });

//     setCroppingImage(null);
//   };

//   const isSubmitDisabled = selectedImages.length < 1 || selectedImages.length > 10 || !data.name || !data.date || !data.description;

//   return (
//     <>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           exit={{ y: 20, opacity: 0 }}
//           transition={{ duration: 0.3, ease: "easeInOut" }}
//           className="bg-white rounded-2xl max-w-2xl w-full relative shadow-2xl flex flex-col max-h-[90vh]"
//           onClick={(e) => e.stopPropagation()}
//         >
//           {/* Header */}
//           <div className="p-6 sm:p-8 border-b">
//             <div className="flex justify-between items-center">
//               <h2 className="text-2xl font-bold text-slate-800">
//                 {mode === 'edit' ? 'Edit Program' : 'Add a New Program'}
//               </h2>
//               <button onClick={onClose} className="text-slate-500 hover:text-red-500"><X size={24} /></button>
//             </div>
//           </div>

//           {/* Form Content */}
//           <div className="p-6 sm:p-8 flex-grow overflow-y-auto">
//             <form id="program-form" onSubmit={onSubmit}>
//               <div className="space-y-4">
//                 {/* Text Inputs */}
//                 <div>
//                   <label className="block text-sm font-semibold text-slate-600 mb-1">Program Name</label>
//                   <input type="text" name="name" value={data.name} onChange={onFormChange} className="w-full p-2 border rounded-md" required />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold text-slate-600 mb-1">Date</label>
//                   <input type="date" name="date" value={data.date} onChange={onFormChange} className="w-full p-2 border rounded-md" required />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold text-slate-600 mb-1">Description</label>
//                   <textarea name="description" value={data.description} onChange={onFormChange} rows="4" className="w-full p-2 border rounded-md" required></textarea>
//                 </div>
                
//                 {/* Image Uploader */}
//                 <div>
//                   <label className="block text-sm font-semibold text-slate-600 mb-1">Images (1-10)</label>
//                   <div className="flex items-center gap-4">
//                     <label className="cursor-pointer flex items-center gap-2 text-sm bg-green-50 text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-green-100 transition">
//                       <FileImage size={16} /> Choose Images
//                       <input type="file" onChange={handleFileChange} multiple accept="image/*" className="hidden" />
//                     </label>
//                     <span className="text-sm text-slate-500">
//                       {selectedImages.length} image(s) selected
//                     </span>
//                   </div>
//                   {imageError && <p className="text-red-600 text-sm mt-2">{imageError}</p>}
//                 </div>

//                 {/* Image Previews */}
//                 {selectedImages.length > 0 && (
//                   <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-4">
//                     {selectedImages.map((image, index) => (
//                       <div key={image.key || image.preview} className="relative group aspect-square">
//                         <img
//                           src={image.preview}
//                           alt={`preview ${index}`}
//                           className="w-full h-full object-cover rounded-md"
//                         />
//                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                           <button
//                             type="button"
//                             onClick={() => setCroppingImage({ index, src: image.preview })}
//                             className="p-2 bg-white/80 rounded-full text-blue-600 hover:bg-white"
//                             title="Crop">
//                             <Crop size={16} />
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => handleRemoveImage(index)}
//                             className="p-2 bg-white/80 rounded-full text-red-500 hover:bg-white"
//                             title="Remove">
//                             <Trash2 size={16} />
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </form>
//           </div>

//           {/* Footer with Actions */}
//           <div className="p-6 sm:p-8 border-t">
//             <div className="flex justify-end gap-4">
//               <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancel</button>
//               <button
//                 type="submit"
//                 form="program-form"
//                 className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
//                 disabled={isSubmitDisabled}
//               >
//                 {mode === 'edit' ? 'Update Program' : 'Submit Program'}
//               </button>
//             </div>
//           </div>
//         </motion.div>
//       </motion.div>

//       {croppingImage && <ImageCropperModal src={croppingImage.src} onClose={() => setCroppingImage(null)} onSave={(blob) => handleCropSave(croppingImage.index, blob)} />}
//     </>
//   );
// };

// export default AddProgramModal;

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { X, Trash2, Crop, FileImage } from "lucide-react";
import imageCompression from 'browser-image-compression';
import ImageCropperModal from './ImageCropperModal';

const AddProgramModal = ({
  mode = 'add',
  initialData = null,
  onClose,
  onSubmit,
  data,
  onFormChange,
  onFilesUpdate
}) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [croppingImage, setCroppingImage] = useState(null);
  const [imageError, setImageError] = useState('');
  const [imagesToDelete, setImagesToDelete] = useState([]);

  useEffect(() => {
    if (mode === 'edit' && initialData && Array.isArray(initialData.image)) {
      const existingImages = initialData.image.map(imageUrl => ({
        url: imageUrl,
        key: imageUrl,
        preview: imageUrl,
        status: 'existing',
      }));
      setSelectedImages(existingImages);
    }
  }, [mode, initialData]);

  useEffect(() => {
    const newFiles = selectedImages
      .filter(img => img.status === 'new')
      .map(img => img.file);

    const existingImagesToKeep = selectedImages
      .filter(img => img.status === 'existing');

    onFilesUpdate({
      newFiles,
      existingImagesToKeep,
      imagesToDelete
    });
  }, [selectedImages, imagesToDelete, onFilesUpdate]);

  const handleFileChange = async (e) => { // Make function async
    setImageError('');
    const files = Array.from(e.target.files);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (selectedImages.length + files.length > 10) {
      setImageError('You can only have a maximum of 10 images.');
      return;
    }
    
    // --- START: Image Compression Logic for New Files ---
    const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
    };
    
    const newImages = [];
    for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
            setImageError(`File type not supported: ${file.name}. Skipping this file.`);
            continue; // Skip unsupported files
        }

        const isDuplicate = selectedImages.some(img =>
            img.file && (img.file.name === file.name && img.file.size === file.size)
        );
        if (isDuplicate) {
            setImageError(`Image already selected: ${file.name}. Skipping this file.`);
            continue;
        }
        
        try {
            console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            const compressedFile = await imageCompression(file, compressionOptions);
            console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
            
            newImages.push({
                file: compressedFile,
                preview: URL.createObjectURL(compressedFile),
                status: 'new',
            });
        } catch (error) {
            console.error('Compression failed for file:', file.name, error);
            setImageError(`Could not process image: ${file.name}.`);
        }
    }
    // --- END: Image Compression Logic ---

    if (newImages.length > 0) {
        setSelectedImages(prev => [...prev, ...newImages]);
    }
    
    e.target.value = null; // Reset file input
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageError('');
    const imageToRemove = selectedImages[indexToRemove];

    if (imageToRemove.status === 'existing') {
      setImagesToDelete(prev => [...prev, imageToRemove.key]);
    }

    if (imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleCropSave = async (index, croppedImageBlob) => { // Make function async
    const imageToUpdate = selectedImages[index];

    if (imageToUpdate.status === 'existing') {      
      setImagesToDelete(prev => [...prev, imageToUpdate.key]);
    }

    // --- START: Image Compression Logic for Cropped File ---
    console.log(`Original cropped blob size: ${(croppedImageBlob.size / 1024 / 1024).toFixed(2)} MB`);
    
    const compressionOptions = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
    };

    try {
      const compressedBlob = await imageCompression(croppedImageBlob, compressionOptions);
      console.log(`Compressed blob size: ${(compressedBlob.size / 1024 / 1024).toFixed(2)} MB`);
      // --- END: Image Compression Logic ---

      const originalName = imageToUpdate.file ? imageToUpdate.file.name : 'cropped-image';
      const fileName = originalName.split('.')[0] + '.webp';
      const newFile = new File([compressedBlob], fileName, { type: 'image/webp' });
      const newPreview = URL.createObjectURL(compressedBlob);

      setSelectedImages(prev => {
        const updatedImages = [...prev];
        if (updatedImages[index].preview.startsWith('blob:')) {
          URL.revokeObjectURL(updatedImages[index].preview);
        }
        updatedImages[index] = { file: newFile, preview: newPreview, status: 'new' };
        return updatedImages;
      });

    } catch (error) {
      console.error('Image compression failed:', error);
      setImageError('Failed to save cropped image.');
    }
    
    setCroppingImage(null);
  };

  const isSubmitDisabled = selectedImages.length < 1 || selectedImages.length > 10 || !data.name || !data.date || !data.description;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-white rounded-2xl max-w-2xl w-full relative shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">
                {mode === 'edit' ? 'Edit Program' : 'Add a New Program'}
              </h2>
              <button onClick={onClose} className="text-slate-500 hover:text-red-500"><X size={24} /></button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 flex-grow overflow-y-auto">
            <form id="program-form" onSubmit={onSubmit}>
              <div className="space-y-4">
                {/* Text Inputs */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Program Name</label>
                  <input type="text" name="name" value={data.name} onChange={onFormChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Date</label>
                  <input type="date" name="date" value={data.date} onChange={onFormChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Description</label>
                  <textarea name="description" value={data.description} onChange={onFormChange} rows="4" className="w-full p-2 border rounded-md" required></textarea>
                </div>
                
                {/* Image Uploader */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Images (1-10)</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex items-center gap-2 text-sm bg-green-50 text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-green-100 transition">
                      <FileImage size={16} /> Choose Images
                      <input type="file" onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                    </label>
                    <span className="text-sm text-slate-500">
                      {selectedImages.length} image(s) selected
                    </span>
                  </div>
                  {imageError && <p className="text-red-600 text-sm mt-2">{imageError}</p>}
                </div>

                {/* Image Previews */}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-4">
                    {selectedImages.map((image, index) => (
                      <div key={image.key || image.preview} className="relative group aspect-square">
                        <img
                          src={image.preview}
                          alt={`preview ${index}`}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setCroppingImage({ index, src: image.preview })}
                            className="p-2 bg-white/80 rounded-full text-blue-600 hover:bg-white"
                            title="Crop">
                            <Crop size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-2 bg-white/80 rounded-full text-red-500 hover:bg-white"
                            title="Remove">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer with Actions */}
          <div className="p-6 sm:p-8 border-t">
            <div className="flex justify-end gap-4">
              <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancel</button>
              <button
                type="submit"
                form="program-form"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                disabled={isSubmitDisabled}
              >
                {mode === 'edit' ? 'Update Program' : 'Submit Program'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {croppingImage && <ImageCropperModal src={croppingImage.src} onClose={() => setCroppingImage(null)} onSave={(blob) => handleCropSave(croppingImage.index, blob)} />}
    </>
  );
};

export default AddProgramModal;