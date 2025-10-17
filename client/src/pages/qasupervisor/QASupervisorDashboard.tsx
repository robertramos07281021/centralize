import { motion } from "framer-motion";
import { useState } from "react";
import GaugeChart from "react-gauge-chart";

const QASupervisorDashboard = () => {
  const [value, setValue] = useState(1);
  const [hehe, setHehe] = useState(40);

  return (
    <div className="w-full h-full overflow-hidden relative flex flex-col">
      <div className="bg-blue-500 shadow-md py-3 px-4">
        <div className="flex items-center">
          <div className="bg-blue-300 cursor-pointer rounded-md shadow-md hover:shadow-none transition-all hover:bg-blue-400 mr-3 py-2 px-3 h-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="size-6 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </div>
          <div className="bg-blue-300 cursor-pointer rounded-md shadow-md hover:shadow-none transition-all hover:bg-blue-400 mr-3 py-2 px-3 h-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="size-6 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <div className="underline font-black text-white uppercase text-2xl">
            Week # 12
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="grid grid-cols-4 relative mt-3 gap-3 px-3 ">
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border-4 rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
          >
            <div>Total Calls</div>
            <div className=" text-5xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border-4 rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <div>Total Calls</div>
            <div className=" text-5xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border-4 rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <div>Total Calls</div>
            <div className=" text-5xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border-4 rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", delay: 0.3 }}
          >
            <div>Total Calls</div>
            <div className=" text-5xl text-red-800">100</div>
          </motion.div>
        </div>
      </div>
      <div className="pt-4 px-16">
        <motion.div
          className="flex gap-48"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <input type="radio" />
          <input type="radio" />
          <input type="radio" />
          <input type="radio" />
        </motion.div>
      </div>
      <div className="grid grid-cols-2 px-3 py-3 gap-3 grid-rows-2 h-full">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" }}
        >
          <div className="grid  rounded-md shadow border-4 border-gray-500 grid-rows-5 h-full bg-gray-200">
            <div className="grid-cols-6 text-center grid items-center px-4 shadow-md rounded-t-sm font-black text-sm text-gray-500 bg-gray-300">
              <div>QA Name</div>
              <div>Campaign</div>
              <div>Bucket(s)</div>
              <div>Avg. Speed of Ans</div>
              <div>Call Resolution</div>
              <div>CR Trend</div>
            </div>
            <div></div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.4 }}
        >
          <div className=" rounded-md flex flex-col shadow border-4 border-gray-500 h-full bg-gray-200">
            <div className="bg-gray-300 rounded-t-sm flex flex-col w-full">
              <div className="font-black uppercase text-center py-3 text-gray-500 text-2xl shadow-md ">
                Call Abandon Rate - By Department
              </div>
            </div>
            <div className="h-full grid grid-cols-5 grid-rows-1 px-10  items-end content-center justify-center">
              <div className="w-full h-full flex flex-col justify-end items-center">
                <div className="mb-2 font-black text-gray-500">40%</div>
                <div
                  className={`w-16 h-[40%] duration-500 rounded-t-md bg-green-700 text-center transition-all`}
                ></div>
              </div>

              <div className="w-full h-full flex flex-col justify-end items-center">
                <div className="mb-2 font-black text-gray-500">25%</div>
                <div className="w-16 h-[25%] rounded-t-md bg-green-700 text-center"></div>
              </div>

              <div className="w-full h-full flex flex-col justify-end items-center">
                <div className="mb-2 font-black text-gray-500">70%</div>
                <div className="w-16 h-[70%] rounded-t-md bg-green-700 text-center"></div>
              </div>

              <div className="w-full h-full flex flex-col justify-end items-center">
                <div className="mb-2 font-black text-gray-500">55%</div>
                <div className="w-16 h-[55%] rounded-t-md bg-green-700 text-center"></div>
              </div>

              <div className="w-full h-full flex flex-col justify-end items-center">
                <div className="mb-2 font-black text-gray-500">85%</div>
                <div className="w-16 h-[85%] rounded-t-md bg-red-700 text-center"></div>
              </div>
            </div>
            <div className="px-10 border-t-2 border-gray-500 grid grid-cols-5 text-sm gap-3 truncate text-center font-black uppercase text-gray-500 justify-evenly py-2">
              <div className="truncate" title="Washing Machine" >Washing Machine</div>
              <div>Toaster</div>
              <div>Fridge</div>
              <div className="truncate" title="Air Conditioner">Air Conditioner</div>
              <div>Television</div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.5 }}
        >
          <div className=" rounded-md shadow  border-4 relative flex flex-col border-gray-500 h-full bg-gray-200">
            <div className="bg-gray-300  rounded-t-sm justify-evenly py-2 shadow-md w-full flex text-sm ">
              <div className="font-black uppercase text-center py-3 text-gray-500 ">
                Overall Satisfaction Score
              </div>
              <div className="font-black uppercase text-center py-3 text-gray-500 ">
                Satisfaction Score - By QA
              </div>
            </div>
            <div className="flex h-full">
              <div className="flex items-center justify-center h-full flex-col w-full relative">
                <GaugeChart
                  id="gauge-chart"
                  nrOfLevels={100}
                  colors={["#fff"]}
                  percent={value}
                  arcWidth={0.3}
                  needleColor="#333"
                  arcsLength={[1]}
                  hideText
                />
                <div className="font-black uppercase text-gray-500">
                  Satisfaction Score: 3.33
                </div>
              </div>
              <div className="flex flex-col w-full h-full py-3 px-3 items-end font-black text-gray-500">
                <div className="h-full flex w-full">
                  <div className="h-full flex pr-5 border-r-2 flex-col text-end justify-evenly">
                    <div>Jim</div>
                    <div>Stewart</div>
                    <div>Manuel</div>
                    <div>Joshua</div>
                    <div>Daniel</div>
                  </div>
                  <div className="h-full w-full flex pr-5 flex-col text-start justify-evenly">
                    <div>d</div>
                    <div>d</div>
                    <div>d</div>
                    <div>d</div>
                    <div>d</div>
                  </div>
                </div>
                <div className="flex flex-row border-t-2 pl-20 pt-3 justify-evenly w-full">
                  <div>0</div>
                  <div>1</div>
                  <div>2</div>
                  <div>3</div>
                  <div>4</div>
                  <div>5</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.6 }}
        >
          <div className=" rounded-md shadow border-4 relative flex flex-col border-gray-500 h-full bg-gray-200">
            <div className="bg-gray-300 rounded-t-md w-full">
              <div className="font-black uppercase text-center py-3 text-gray-500 text-2xl shadow-md ">
                SLA Limits
              </div>
            </div>

            <div className="h-full flex text-gray-500 relative flex-col items-center">
              <div className="h-full px-10 font-black items-center justify-center content-center flex relative w-full">
                <div className="text-2xl w-full uppercase ">
                  Call answered in less than 180 seconds:
                </div>
                <div className="text-5xl">40.8%</div>
              </div>

              <div className="h-full px-10 font-black items-center justify-center content-center flex relative w-full">
                <div className="text-2xl w-full uppercase ">
                  Calls with satisfaction score less than %:
                </div>
                <div className="text-5xl ">125</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QASupervisorDashboard;
