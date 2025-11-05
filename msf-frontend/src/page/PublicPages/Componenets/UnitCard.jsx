import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Trophy, Award, Medal } from 'lucide-react';

// --- Helper Functions for Styling (moved from UnitGrid) ---

const getRankIcon = (rank) => {
  if (!rank || typeof rank !== 'string') {
    return <Star className="w-6 h-6 text-gray-400" />;
  }
  const normalizedRank = rank.toLowerCase();

  switch (normalizedRank) {
    case 'colonel':
      return <Trophy className="w-6 h-6 text-yellow-500" />;
    case 'major':
      return <Award className="w-6 h-6 text-orange-500" />;
    case 'captain':
      return <Medal className="w-6 h-6 text-blue-500" />;
    case 'lieutenant':
      return <Star className="w-6 h-6 text-green-500" />;
    default:
      return <Star className="w-6 h-6 text-gray-400" />;
  }
};

const getGradeColor = (grade) => {
  if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
  if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
  if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

const getScoreColor = (totalScore) => {
  if (totalScore >= 95) return 'text-green-600 font-bold';
  if (totalScore >= 85) return 'text-blue-600 font-semibold';
  if (totalScore >= 75) return 'text-yellow-600 font-medium';
  return 'text-red-600 font-medium';
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// --- The Card Component ---

const UnitCard = ({ unit }) => {
  return (
    <motion.div variants={itemVariants}>
      <Link to={`/unit-details/${unit._id}`} className="block h-full">
        <motion.div
          // ---
          // 👈 FIX: "Always White"
          // All 'dark:' classes have been REMOVED from this component
          // ---
          className="bg-white rounded-xl shadow-lg h-full overflow-hidden border border-gray-200 flex flex-col justify-between p-6"
          whileHover={{ scale: 1.03, y: -5 }}
          transition={{ type: 'spring', stiffness: 300, mass: 0.5 }}
        >
          {/* Card Header */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-4">
                {getRankIcon(unit.rank)}
                <div>
                  <h3 className="font-bold text-xl text-gray-900">
                    {unit.name}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {unit.rank}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${getGradeColor(unit.grade)}`}
              >
                Grade {unit.grade}
              </span>
            </div>
          </div>

          {/* Card Footer (Stats) */}
          <div className="mt-4">
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm font-medium text-gray-600">
                Overall Score
              </span>
              <span className={`text-3xl ${getScoreColor(unit.totalScore)}`}>
                {unit.totalScore}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${unit.totalScore}%` }}
              ></div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default UnitCard;