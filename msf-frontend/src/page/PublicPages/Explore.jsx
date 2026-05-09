import { useState, useEffect, useRef, useCallback } from "react";
import axios from "../../api/axiosInstance";
import { Calendar, Loader2 } from "lucide-react";
import JourneyModal from "../Admin/AdminComponents/JourneyModal";

export default function ExploreTimeline() {
  const [timelineData, setTimelineData] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const [hoveredStack, setHoveredStack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState(null);


  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const observer = useRef();
  const lastItemRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && page < totalPages) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, page, totalPages]);


  useEffect(() => {
    const fetchTimelineData = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const response = await axios.get(`/user/journey?page=${page}&limit=5`);
        const { journeys, totalPages } = response.data;

        setTimelineData(prev => [...prev, ...journeys]);
        setTotalPages(totalPages);

      } catch (err) {
        setError("Failed to load timeline data.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchTimelineData();
  }, [page]);


  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const itemId = entry.target.getAttribute("data-id") || "0";
            setVisibleItems((prev) => [...new Set([...prev, itemId])]);
          }
        });
      },
      { threshold: 0.2 }
    );

    const timelineItems = document.querySelectorAll(".timeline-item");
    timelineItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [timelineData]);

  const openModal = (journey) => setSelectedJourney(journey);
  const closeModal = () => setSelectedJourney(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading && page === 1) {
    return <div className="text-center py-12 text-xl text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-xl text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100  lg:py-8 lg:px-4 pt-20 lg:pt-30 overflow-x-hidden">
      <div className="lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Journey Timeline
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Follow our progress through key milestones and achievements
          </p>
        </div>

        {/* Timeline */}
        <div className="timeline relative">
          {/* Vertical Line */}
          <div className="absolute left-5 sm:left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600"></div>

          {timelineData.map((item, index) => {
            const isLeft = index % 2 === 0;
            const isLastItem = timelineData.length === index + 1;
            return (
              <div
                ref={isLastItem ? lastItemRef : null}
                key={item._id}
                data-id={item._id}
                className="timeline-item relative mb-16 md:mb-24"
              >
                {/* Timeline Dot */}
                <div
                  className={`absolute left-5 sm:left-1/2 transform -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-4 border-white shadow-lg transition-all duration-700 z-10 ${visibleItems.includes(item._id)
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 scale-100"
                      : "bg-gray-300 scale-75"
                    }`}
                ></div>

                {/* Content */}
                <div
                  className={`flex flex-col sm:flex-row items-start sm:items-center ${isLeft ? "" : "sm:flex-row-reverse"
                    }`}
                >
                  <div
                    className={`w-full sm:w-5/12 ml-12 sm:ml-0 ${isLeft ? "sm:pr-0" : "sm:pl-8"
                      }`}
                  >
                    <div
                      className={`transition-all duration-700 transform ${visibleItems.includes(item._id)
                          ? "translate-x-0 opacity-100"
                          : `${isLeft ? "-translate-x-8" : "translate-x-8"} opacity-0`
                        }`}
                      style={{ transitionDelay: `${index * 200}ms` }}
                    >
                      {/* Title + Date */}
                      <div className={`mb-6 ${isLeft ? "sm:text-right" : "sm:text-left"}`}>
                        <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">
                          {item.title}
                        </h2>
                        <div
                          className={`flex items-center gap-2 text-gray-600 ${isLeft ? "sm:justify-end" : "sm:justify-start"
                            }`}
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm sm:text-base md:text-lg">
                            {formatDate(item.date)}
                          </span>
                        </div>
                      </div>

                      {/* Image Stack */}
                      <div
                        className={`relative ${isLeft ? "sm:flex sm:justify-end" : "sm:flex sm:justify-start"
                          }`}
                      >
                        <div
                          className="relative polaroid-stack"
                          onMouseEnter={() => setHoveredStack(item._id)}
                          onMouseLeave={() => setHoveredStack(null)}
                        >
                          {item.images.map((image, imageIndex) => {
                            const isHovered = hoveredStack === item._id;

                            return (
                              <div
                                key={`${item._id}-${imageIndex}`}
                                className={`absolute rounded-xl shadow-xl overflow-hidden cursor-pointer transition-all duration-500 ease-out transform-gpu ${isHovered ? "shadow-2xl z-30" : ""
                                  }`}
                                style={{
                                  width: "clamp(240px, 70vw, 320px)",
                                  height: "clamp(160px, 50vw, 220px)",
                                  transform: `
                                    translateX(${imageIndex * (isHovered ? 10 : 6)}px)
                                    translateY(${imageIndex * (isHovered ? 10 : 6)}px)
                                    rotate(${imageIndex * 2 - 2}deg)
                                  `,
                                  zIndex:
                                    item.images.length - imageIndex + (isHovered ? 30 : 0),
                                  transformOrigin: "center center",
                                  transitionDelay: isHovered
                                    ? `${imageIndex * 100}ms`
                                    : "0ms",
                                }}
                                onClick={() => openModal(item)}
                              >
                                <img
                                  src={image || "/placeholder.svg"}
                                  alt={`${item.title} image ${imageIndex + 1}`}
                                  className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? "brightness-110 contrast-105" : ""
                                    }`}
                                />
                              </div>
                            );
                          })}
                          {/* Spacer */}
                          <div
                            className="opacity-0"
                            style={{
                              width: "clamp(240px, 70vw, 320px)",
                              height: "clamp(160px, 50vw, 220px)",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block sm:w-5/12"></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center mb-20 lg:mb-10">
          {loadingMore && (
            <div className="inline-flex items-center gap-2 text-gray-700">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
          {!loadingMore && page >= totalPages && (
            <div className="inline-flex items-center gap-2 text-gray-700">
              <span>You've reached the end of the journey.</span>
            </div>
          )}
        </div>

      </div>
      {/* Modal */}
      {selectedJourney && <JourneyModal journey={selectedJourney} onClose={closeModal} />}
    </div>
  );
}
