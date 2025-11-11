import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Edit } from "lucide-react";
import LeaderCard from './LeaderCard';
import VacantCard from './VacantCard';
import SubCommitteeList from './SubCommitteeList';

const CommitteeSection = ({ title, committee, showDetails, setShowDetails, variants, onEdit }) => (
  <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
    <div className="flex justify-center items-center text-center mb-8 relative">
      <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
      <button
        onClick={onEdit}
        className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm bg-blue-50 text-blue-600 font-semibold px-3 py-2 rounded-lg hover:bg-blue-100 transition"
      >
        <Edit size={16} />
        Edit
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {committee?.president ? <LeaderCard {...committee.president} position="President" /> : <VacantCard position="President" />}
      {committee?.secretary ? <LeaderCard {...committee.secretary} position="Secretary" /> : <VacantCard position="Secretary" />}
      {committee?.treasurer ? <LeaderCard {...committee.treasurer} position="Treasurer" /> : <VacantCard position="Treasurer" />}
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
          <div className="space-y-6">
            <SubCommitteeList title="Vice Presidents" members={committee.vicePresidents} />
            <SubCommitteeList title="Joint Secretaries" members={committee.jointSecretaries} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </section>
);

export default CommitteeSection;