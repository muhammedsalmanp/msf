import React from 'react';

const SomethingWentWrongPage = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-5 text-center">
      <h1 className="relative m-0 text-[10rem] font-bold text-green-600 animate-bounce">
        500
      </h1>
      <h2 className="mt-0 mb-4 text-4xl font-semibold text-gray-900">
        Oops! Something Went Wrong
      </h2>
      <p className="mb-8 text-lg text-gray-600">
        We're having some technical issues. Please try reloading the page.
      </p>
      <button
        onClick={handleReload}
        className="rounded-md bg-green-600 py-2.5 px-6 text-base text-white transition-colors duration-300 ease-in-out hover:bg-green-700"
      >
        Reload Page
      </button>
    </div>
  );
};

export default SomethingWentWrongPage;