import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { motion } from "framer-motion";

type MasterFileViewProps = {
  close: () => void;
};

const MasterFileView: React.FC<MasterFileViewProps> = ({ close }) => {
  const { selectedCustomer, userLogged } = useSelector((state: RootState) => state.auth);
  console.log("selectedCustomer", selectedCustomer);
  return (
    <div className="w-full h-full z-50 gap-5 absolute top-0 left-0 bg-black/50 backdrop-blur-[2px] p-5">
      <motion.div
        className="w-full h-full border rounded-md border-slate-500 bg-white p-5 flex flex-col"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-start">
          <h1 className="text-[0.7rem] md:text-base 2xl:text-xl pb-5  font-black text-black uppercase">
            MASTER FILE
          </h1>
          <div className="flex items-center gap-2" >
            <div>
                <input placeholder="Search..." className="border px-3 py-1 outline-none rounded-sm shadow-md" />
            </div>
            <div
              className="p-1 bg-red-500 hover:bg-red-600 transition-all shadow-md cursor-pointer rounded-full border-2 border-red-800 text-white  "
              onClick={() => close()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="h-full overflow-y-auto">
          <div className="w-full table-fixed">
            <div className=" text-black py-2 font-black uppercase items-center gap-2 px-2 border grid grid-cols-8 rounded-t-md text-sm text-left select-none bg-gray-300">
              <div className="">Name</div>
              <div className="truncate" >Contact Number</div>
              <div>Gender</div>
              <div className="truncate" >Outstanding Balance</div>
              <div>Balance</div>
              <div>principal</div>
              <div>Payment</div>
              <div className="truncate" >Payment Date</div>
            </div>
            <div></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MasterFileView;
