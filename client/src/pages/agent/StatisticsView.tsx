import AgentTimer from "./AgentTimer";
import MixedChartView from "./MixedChartView";
import MixedChartMonthView from "./MixedChartMonthView";
import OverallPerformance from "./OverallPerformance";
import DashboardMinis from "./DashboardMinis.tsx";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store.ts";
import { CgDanger } from "react-icons/cg";
import { useState } from "react";
import { AnimatePresence, motion, scale } from "framer-motion";

const StatisticsView = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col lg:h-full bg-slate-200 relative lg:overflow-hidden ">
      {
        !userLogged?.vici_id &&
        <CgDanger
          onClick={() => setOpen(true)}
          className={`" absolute top-12 right-4 w-6 h-6 p-[2px] shadow-md cursor-pointer animate-pulse rounded-full  bg-red-800 "`}
          color="white"
        />
      }
      <div className="p-2">
        <AgentTimer />
      </div>
      <div className=" h-full w-full grid grid-cols-1 lg:grid-cols-9 lg:grid-rows-4 lg:gap-2 overflow-hidden grid-rows-3 gap-2 p-2">
        <DashboardMinis />
        <MixedChartView />
        <MixedChartMonthView />
        <OverallPerformance />
      </div>
      <AnimatePresence>
        {open && (
          <div className="absolute top-0 justify-center z-50 items-center flex left-0 w-full h-full">
            <motion.div
              onClick={() => setOpen(false)}
              className="bg-[#00000073] cursor-pointer h-full w-full backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>
            <div className="absolute">
              <motion.div
                className="bg-white   p-5 rounded-md shadow-md"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{scale: 0.5, opacity: 0}}
                transition={{}}
              >
                <div className="mb-3 text-center font-black uppercase text-3xl">
                  input the vcI id
                </div>
                <input
                  className="bg-gray-200 w-full px-4 py-1 rounded-md shadow-md"
                  placeholder="ha?"
                />

                <div className="flex mt-5 font-black text-white  uppercase gap-3">
                  <div
                    onClick={() => setOpen(false)}
                    className="py-2 px-3 bg-red-600 border-2 border-red-800 hover:bg-red-800 cursor-pointer transition-all rounded-md shadow-md "
                  >
                    No
                  </div>
                  <div className="py-2 w-full text-center border-2 border-green-800 hover:bg-green-800 transition-all cursor-pointer bg-green-600 rounded-md shadow0-md">
                    yes
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatisticsView;
