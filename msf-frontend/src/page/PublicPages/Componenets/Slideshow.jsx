import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from '../../../api/axiosInstance';
import { setLoading } from '../../../Store/slices/loadingSlice';
import './Slideshow.css';
import noImagePlaceholder from '../../../assets/flag-animation1.gif';
function Slideshow() {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSlides = async () => {
      dispatch(setLoading(true));
      try {
        const res = await axios.get('/user/slides');
        setImages(res.data.map(slide => slide.imageUrl));
        dispatch(setLoading(false));
      } catch (err) {
        dispatch(setLoading(false));
      }
    };
    fetchSlides();
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (images.length ? (prev + 1) % images.length : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, [images]);

  const nextSlide = () => setIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + images.length) % images.length);

 if (!images.length) {
    return (
      <div className="relative w-full overflow-hidden h-[60vh] sm:h-[60vh] md:h-[99vh]">
        <div className="relative w-full h-full">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden" style={{ transform: 'translateX(0%)' }}>
            <img
              src={noImagePlaceholder}
              alt="No images available"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="slideshow">
      <div className="slideshow-inner">
        {images.map((src, i) => (
          <div
            key={src} 
            className="slide"
            style={{ transform: `translateX(${100 * (i - index)}%)` }}
          >
            <img
              src={src}
              alt={`Slide ${i + 1}`}
              className={`slide-image ${i === index ? 'active' : ''}`}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <div className="slide-controls">
        <button onClick={prevSlide} className="nav-btn">⟵</button>
        <button onClick={nextSlide} className="nav-btn">⟶</button>
      </div>

      <div className="dots">
        {images.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === index ? 'active' : ''}`}
            onClick={() => setIndex(i)}
          ></span>
        ))}
      </div>
    </div>
  );
}

export default Slideshow;