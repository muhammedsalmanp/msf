import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import LeaderCard from './LeaderCard';
import VacantCard from './VacantCard';
import SubCommitteeList from './SubCommitteeList';
import axios from "../../../api/axiosInstance"; 


const CommitteeSection = ({ unitId, title, type }) => {

  const [committee, setCommittee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchCommittee = async () => {
      if (!unitId || !type) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`/user/unit-committee/${unitId}/${type}`);
        setCommittee(response.data);
      } catch (err) {
        console.error(`Error fetching ${type} committee:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommittee();
  }, [unitId, type]);

  const variants = {
    hidden: { height: 0, opacity: 0, marginTop: 0, overflow: "hidden" },
    visible: {
      height: "auto",
      opacity: 1,
      marginTop: "1.5rem",
      transition: { duration: 0.4, ease: "easeInOut" },
    },
  };

  if (loading) {
    return (
      <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg text-center text-slate-500">
        Loading {title}...
      </section>
    );
  }

  if (!committee) {
    return null; 
  }

  const hasMembers = 
    committee.president || 
    committee.secretary || 
    committee.treasurer || 
    (committee.vicePresidents && committee.vicePresidents.length > 0) || 
    (committee.jointSecretaries && committee.jointSecretaries.length > 0);

  if (!hasMembers) {
    return null;
  }

  return (
    <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
      <div className="flex justify-center items-center text-center mb-8 relative">
        <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="grid grid-cols-1 lg:ml-20 sm:grid-cols-3 gap-6">
        {committee.president ? <LeaderCard {...committee.president} position="President" /> : <VacantCard position="President" />}
        {committee.secretary ? <LeaderCard {...committee.secretary} position="Secretary" /> : <VacantCard position="Secretary" />}
        {committee.treasurer ? <LeaderCard {...committee.treasurer} position="Treasurer" /> : <VacantCard position="Treasurer" />}
      </div>
      <div className="text-center mt-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 mx-auto text-green-600 font-medium hover:text-green-800 transition"
        >
          {showDetails ? "Hide Details" : "See More"}
          {showDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      <AnimatePresence>
        {showDetails && (
          <motion.div variants={variants} initial="hidden" animate="visible" exit="hidden" className="overflow-hidden">
            <div className="grid grid-cols-1 space-y-6">
              <SubCommitteeList title="Vice Presidents" members={committee.vicePresidents} />
              <SubCommitteeList title="Joint Secretaries" members={committee.jointSecretaries} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CommitteeSection;