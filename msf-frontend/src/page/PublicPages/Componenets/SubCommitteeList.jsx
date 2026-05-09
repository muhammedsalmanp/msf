import React from 'react';
import { FaCircle } from "react-icons/fa";

const SubCommitteeList = ({ title, members }) => {
  if (!members || members.length === 0) return null;
  
  return (
    <div>
      <div className="flex items-center text-center my-6">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="px-4 text-slate-500 font-semibold">{title}</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>
      <div className="grid grid-cols-1 ml-[19%] md:ml-13 lg-[1%] md:grid-cols-3 lg:grid-cols-4 gap-4">
        {members.map((member, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <FaCircle className="w-3 h-3 text-green-500" />
            <span className="text-slate-700 font-medium">{member.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubCommitteeList;