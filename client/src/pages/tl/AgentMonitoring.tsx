import React, { useState } from "react";
import { motion } from "framer-motion";

const AgentMonitoring = () => {
  const [option, setOption] = useState(0);
  const [width, setWidth] = useState(50);
  return (
    <div className="px-5 h-screen w-full">
      <div className="flex justify-between items-center">
        <div className="font-black text-2xl py-4">AGENT MONITORING</div>

        <div className="flex flex-row items-center gap-2">
          <div>
            <motion.div
              className="bg-white  relative border-2 border-gray-500 overflow-hidden px-4 py-1.5 rounded-full flex gap-6 text-gray-400 font-black uppercase items-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div
                onClick={() => {
                  setOption(0);
                  setWidth(50);
                }}
                className={`" ${
                  option === 0 ? "text-gray-500" : " text-gray-400"
                } transition-all text-xs z-20  cursor-pointer "`}
              >
                ALL
              </div>
              <div
                onClick={() => {
                  setOption(50);
                  setWidth(40);
                }}
                className={`"  ${
                  option === 50 ? "text-green-600  -rotate-90" : " text-gray-400"
                } transition-all cursor-pointer z-20 duration-200 text-green-500 "`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M19.5 9.75a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 1 1.5 0v2.69l4.72-4.72a.75.75 0 1 1 1.06 1.06L16.06 9h2.69a.75.75 0 0 1 .75.75Z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div
                onClick={() => {
                  setOption(90);
                  setWidth(50);
                }}
                className={`" ${
                  option === 90 ? "text-red-600 -rotate-90 " : " text-red-500"
                } transition-all cursor-pointer z-20 duration-200 "`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.22 3.22a.75.75 0 0 1 1.06 0L18 4.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L19.06 6l1.72 1.72a.75.75 0 0 1-1.06 1.06L18 7.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L16.94 6l-1.72-1.72a.75.75 0 0 1 0-1.06ZM1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <motion.div
                className={`" ${
                  option === 50
                    ? "bg-green-200"
                    : option === 90
                    ? "bg-red-200"
                    : "bg-gray-200"
                } absolute z-10 top-0 overflow-hidden left-0 h-full flex items-center justify-center "`}
                initial={{ x: 0, width: 50 }}
                animate={{ x: option, width: width }}
                transition={{ duration: 0.6, type: "spring" }}
              ></motion.div>
            </motion.div>
          </div>

          <div className="bg-gray-100 border flex items-center pl-2 rounded-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>

            <input
              className=" focus:outline-none px-2 py-2"
              placeholder="Search..."
            />
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-col">
        <div className="grid grid-cols-5 bg-gray-300 px-3 gap-3 py-2 rounded-t-md font-black uppercase ">
          <div>Agent name</div>
          <div>on call</div>
          <div>d</div>
          <div>Total Calls</div>
          <div>actions</div>
        </div>

        <div className="grid grid-cols-5 text-sm items-center text-gray-500 bg-gray-100 px-3 gap-3 py-2 font-bold uppercase ">
          <div>Edr</div>
          <div className="pl-4">
            <div className="bg-red-500 w-6 h-6 rounded-full"></div>
          </div>
          <div className="pl-4">d</div>
          <div>47</div>
          <div>e</div>
        </div>
      </div>
    </div>
  );
};

export default AgentMonitoring;
