import React from 'react';
// 1. Import the GIF at the top
import flagGif from '../assets/flag-animation1.gif'; // Adjust this path if needed!

const LoadingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center  bg-opacity-50 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        
        {/* === REPLACED SPINNER WITH GIF === */}
        <img 
          src={flagGif} // 2. Use the imported variable here
          alt="Loading flag" 
          className="w-90 h-auto" // Adjust size as needed
        />
        {/* === END REPLACEMENT === */}

        <p className="text-green-700 text-xl font-semibold">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingPage;