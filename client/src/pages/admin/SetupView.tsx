import BranchSection from "./BranchSection";
import BucketSection from "./BucketSection";
import DepartmentSection from "./DepartmentSection";
import { useState } from "react";
import { motion } from "framer-motion";

const SetupView = () => {
  const [branch, setBranch] = useState<boolean>(false);
  const [campaign, setCampaign] = useState<boolean>(false);
  const [buckets, setBuckets] = useState<boolean>(false);

  return (
    <div className="w-full flex relative flex-col h-full overflow-auto p-5">
      <div className="flex py-2 justify-between items-center">
        <h1 className="text-2xl text-slate-500 font-black uppercase">
          Branch & Department
        </h1>
        <div className="uppercase flex gap-3 font-black mr-10">
          <motion.div
            onClick={() => setBranch(true)}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className=" cursor-pointer hover:bg-purple-700 transition-all shadow-md hover:shadow-none bg-purple-600 px-4 py-1 text-white border-2 border-purple-700 rounded-md">
              create Branch
            </div>
          </motion.div>
          <motion.div
            onClick={() => setCampaign(true)}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className=" cursor-pointer hover:bg-yellow-700 transition-all shadow-md hover:shadow-none bg-yellow-600 px-4 py-1 text-white border-2 border-yellow-700 rounded-md">
              create campaign
            </div>
          </motion.div>
          <motion.div
            onClick={() => setBuckets(true)}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className=" cursor-pointer hover:bg-green-700 transition-all shadow-md hover:shadow-none bg-green-600 px-4 py-1 text-white border-2 border-green-700 rounded-md">
              create Bucket
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-3 h-full overflow-hidden">
        <BranchSection branch={branch} setBranch={setBranch} />
        <DepartmentSection campaign={campaign} setCampaign={setCampaign} />
        <BucketSection buckets={buckets} setBuckets={setBuckets} />
      </div>
    </div>
  );
};

export default SetupView;
