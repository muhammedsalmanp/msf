
import { ClipLoader } from "react-spinners";
import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";
import UnitCard from "./UnitCard";
import { ArrowLeft } from "lucide-react";

const InChargeTab = () => {
  const [data, setData] = useState(null);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [unitLoading, setUnitLoading] = useState(false);
  const [unitError, setUnitError] = useState(null);

  useEffect(() => {
    const fetchInChargeData = async () => {
      try {
        const res = await axiosInstance.get("/user/incharge-info");
        console.log("Received unit data:", res.data.data);
        setData(res.data.data);
        setType(res.data.type);
      } catch (err) {
        console.error("Failed to load incharge info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInChargeData();
  }, []);

  const handleUnitClick = async (unitId) => {
    setUnitLoading(true);
    setUnitError(null);
    try {
     const res = await axiosInstance.get(`/user/unit-details/${unitId}`);
      setSelectedUnit(res.data);
    } catch (err) {
      setUnitError("Could not load unit details. Please try again."); 
    } finally {
      setUnitLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedUnit(null);
    setUnitError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <ClipLoader color="#16a34a" size={50} />
      </div>
    );
  }

  if (type === "noUnit") {
    return (
      <div className="text-center text-gray-500 py-6">
        You are not assigned to any unit.
      </div>
    );
  }

  if (type === "inChargeUnits" && Array.isArray(data)) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-full">
        {selectedUnit ? (
          <div>
            <button
              onClick={handleBackToList}
              className="mb-6 flex items-center gap-2 bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm border hover:bg-gray-100 transition"
            >
              <ArrowLeft size={18} />
              Back to All Units
            </button>

            {unitLoading && (
              <div className="flex justify-center items-center py-10">
                <ClipLoader color="#16a34a" size={40} />
                <span className="ml-3 text-gray-600">Loading Unit Details...</span>
              </div>
            )}

            {/* ✅ NEW: Display error message if fetching fails */}
            {unitError && (
              <div className="text-center mt-6 text-red-500 bg-red-50 p-4 rounded-lg">
                {unitError}
              </div>
            )}

            {!unitLoading && !unitError && <UnitCard unitData={selectedUnit} />}
          </div>
        ) : (
          // --- LIST VIEW ---
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((unit) => (
              <div
                // ✅ This is correct because your data has `_id`
                key={unit._id}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-200 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"

                // ✅ This is also correct
                onClick={() => handleUnitClick(unit._id)}
              >
                <h3 className="text-xl font-semibold text-green-700 mb-2 text-center">
                  {unit.name}
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  Click to view full details
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default InChargeTab;