// import React, { useState, useEffect, useCallback } from "react";
// import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

// // CHANGED: Added `isAnimatingOut` for smooth closing
// const JourneyModal = ({ journey, onClose }) => {
//   if (!journey) return null;

//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
//   const [isAnimatingOut, setIsAnimatingOut] = useState(false); // CHANGED

//   const images = journey.images || [];

//   // CHANGED: Wrapped in useCallback for performance
//   const nextImage = useCallback(() => {
//     setCurrentImageIndex((prev) =>
//       prev === images.length - 1 ? 0 : prev + 1
//     );
//   }, [images.length]);

//   const prevImage = useCallback(() => {
//     setCurrentImageIndex((prev) =>
//       prev === 0 ? images.length - 1 : prev - 1
//     );
//   }, [images.length]);

//   // CHANGED: Created a new close handler for animation
//   const closeModal = useCallback(() => {
//     setIsAnimatingOut(true);
//     setTimeout(() => {
//       onClose();
//     }, 300); // Animation duration
//   }, [onClose]);

//   const formattedDate = new Date(journey.date).toLocaleDateString("ml-IN", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });

//   // CHANGED: Added 'Escape' key handler
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === "Escape") {
//         if (isImageViewerOpen) setIsImageViewerOpen(false);
//         else closeModal();
//       }
//       if (images.length > 1) {
//         if (e.key === "ArrowRight" && isImageViewerOpen) nextImage();
//         if (e.key === "ArrowLeft" && isImageViewerOpen) prevImage();
//       }
//     };

//     document.addEventListener("keydown", handleKeyDown);
//     return () => document.removeEventListener("keydown", handleKeyDown);
//   }, [isImageViewerOpen, images.length, closeModal, nextImage, prevImage]);

//   return (
//     <>
//       {/* CHANGED: Combined Background Blur and Centering Container.
//         Added onClick={closeModal} to the overlay.
//       */}
//       <div
//         className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
//           isAnimatingOut ? "opacity-0" : "opacity-100"
//         }`}
//         onClick={closeModal}
//       >
//         {/* Background Blur */}
//         <div className="absolute inset-0 backdrop-blur-sm bg-black/40"></div>

//         {/* Main Modal
//           - CHANGED: Removed h-[99%]
//           - Added max-h-[90vh] to make it responsive.
//           - Added flex flex-col to structure the image and text.
//           - Added overflow-hidden to clip the image's corners.
//           - Added onClick stopPropagation.
//           - Added animation classes.
//         */}
//         <div
//           onClick={(e) => e.stopPropagation()}
//           className={`relative z-10 bg-white rounded-2xl max-w-3xl w-full flex flex-col shadow-xl overflow-hidden max-h-[90vh] transition-all duration-300 ${
//             isAnimatingOut ? "opacity-0 scale-95" : "opacity-100 scale-100"
//           }`}
//         >
//           {/* CHANGED: Prettier close button */}
//           <button
//             onClick={closeModal}
//             className="absolute top-3 right-3 z-10 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
//           >
//             ✕
//           </button>

//           {/* Image Section
//             - CHANGED: Added flex-shrink-0 so it doesn't get squished.
//             - Removed mb-6, spacing is handled by the content box.
//           */}
//           <div className="aspect-video bg-gray-100 relative flex-shrink-0">
//             {images.length > 0 ? (
//               <>
//                 <img
//                   src={images[currentImageIndex]}
//                   alt={journey.title}
//                   className="w-full h-full object-cover cursor-pointer"
//                   onClick={() => setIsImageViewerOpen(true)}
//                 />

//                 {/* Navigation Buttons */}
//                 {images.length > 1 && (
//                   <>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation(); // Prevent modal click
//                         prevImage();
//                       }}
//                       className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
//                     >
//                       <FaChevronLeft />
//                     </button>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation(); // Prevent modal click
//                         nextImage();
//                       }}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full"
//                     >
//                       <FaChevronRight />
//                     </button>
//                   </>
//                 )}
//               </>
//             ) : (
//               <span className="text-gray-400 text-sm flex items-center justify-center h-full">
//                 No Image
//               </span>
//             )}
//           </div>

//           {/* Text Content
//             - CHANGED: This is now the scrolling container.
//             - Added overflow-y-auto to scroll *only* this section.
//             - Added flex-1 to fill the remaining space.
//             - Added p-6 for padding.
//             - Changed text-1xl to text-2xl (more standard).
//             - Used space-y-3 for consistent vertical spacing.
//           */}
//           <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-3">
//             <h2 className="text-2xl font-bold text-gray-900">
//               {journey.title}
//             </h2>
//             <p className="text-sm text-gray-500">{formattedDate}</p>
//             <p className="text-gray-700 leading-relaxed">{journey.description}</p>
//           </div>
//         </div>
//       </div>

//       {/* Fullscreen Image Viewer (No logic changes) */}
//       {isImageViewerOpen && (
//         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90">
//           <img
//             src={images[currentImageIndex]}
//             alt="Full View"
//             className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
//           />

//           {/* Close viewer */}
//           <button
//             onClick={() => setIsImageViewerOpen(false)}
//             className="absolute top-6 right-8 text-white text-3xl hover:text-gray-300"
//           >
//             ✕
//           </button>

//           {/* Navigation */}
//           {images.length > 1 && (
//             <>
//               <button
//                 onClick={prevImage}
//                 className="absolute left-10 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full"
//               >
//                 <FaChevronLeft />
//               </button>
//               <button
//                 onClick={nextImage}
//                 className="absolute right-10 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full"
//               >
//                 <FaChevronRight />
//               </button>
//             </>
//           )}
//         </div>
//       )}
//     </>
//   );
// };

// export default JourneyModal;


import React, { useState, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const JourneyModal = ({ journey, onClose }) => {
  if (!journey) return null;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const images = journey.images || [];

  const nextImage = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const prevImage = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const closeModal = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => onClose(), 250);
  }, [onClose]);

  const formattedDate = new Date(journey.date).toLocaleDateString("ml-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isImageViewerOpen) setIsImageViewerOpen(false);
        else closeModal();
      }

      if (!isImageViewerOpen) return;

      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isImageViewerOpen, closeModal, nextImage, prevImage]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 transition-opacity duration-300 ${
          isAnimatingOut ? "opacity-0" : "opacity-100"
        }`}
        onClick={closeModal}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ${
            isAnimatingOut ? "scale-95 opacity-0" : "scale-100 opacity-100"
          }`}
          style={{ maxHeight: "90vh" }}
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white hover:text-black"
          >
            ✕
          </button>

          {/* Layout: Image TOP + Text BOTTOM */}
          <div className="flex h-full flex-col">
            {/* Image Section */}
            <div className="relative bg-gray-100">
              {/* IMPORTANT:
                - min height for small screens
                - max height so text is always visible
              */}
              <div className="h-[220px] sm:h-[280px] md:h-[340px] max-h-[45vh] w-full">
                {images.length > 0 ? (
                  <img
                    src={images[currentImageIndex]}
                    alt={journey.title}
                    className="h-full w-full object-cover cursor-pointer"
                    onClick={() => setIsImageViewerOpen(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Slider Buttons */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
                  >
                    <FaChevronLeft />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
            </div>

            {/* Text Section */}
            <div className="flex-1 overflow-hidden">
              {/* Title + Date (always visible) */}
              <div className="border-b px-5 py-4 sm:px-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {journey.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{formattedDate}</p>
              </div>

              {/* Description (scroll only this) */}
              <div className="max-h-[35vh] overflow-y-auto px-5 py-4 sm:px-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {journey.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Viewer */}
      {isImageViewerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90">
          <img
            src={images[currentImageIndex]}
            alt="Full View"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
          />

          <button
            onClick={() => setIsImageViewerOpen(false)}
            className="absolute top-6 right-8 text-white text-3xl hover:text-gray-300"
          >
            ✕
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full"
              >
                <FaChevronRight />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default JourneyModal;
