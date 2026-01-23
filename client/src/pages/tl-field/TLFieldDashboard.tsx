import { motion } from "framer-motion";

const TLFieldDashboard = () => {
  return (
    <div className="p-4 overflow-auto  flex flex-col gap-4 bg-blue-50 h-full">
      <div className="flex relative justify-end">
        <motion.div 
        initial={{ scale: 0.6, opacity: 0}}
        animate={{ scale: 1, opacity: 1}}
        className="bg-green-600 absolute top-0 left-0 text-white p-2 border-2 border-green-900 rounded-full" >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
        <div className="bg-gray-100 min-w-40 flex  items-center justify-between px-3 py-1 border rounded-sm">
          <div>Select Bucket</div>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          className="bg-blue-300 shadow-md border border-blue-600 flex flex-col rounded-sm overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{}}
        >
          <div className="w-full  bg-blue-600 py-1 text-white font-semibold uppercase text-center ">
            all amount Collected
          </div>
          <div className="h-full ">dsads</div>
        </motion.div>
        <motion.div
          className="bg-blue-300 shadow-md border border-blue-600 flex flex-col rounded-sm overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-full  bg-blue-600 py-1 text-white font-semibold uppercase text-center ">
            All tasks completed
          </div>
          <div className="h-full ">dsa</div>
        </motion.div>
        <motion.div
          className="bg-blue-300 shadow-md border border-blue-600 flex flex-col rounded-sm overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-full  bg-blue-600 py-1 text-white font-semibold uppercase text-center ">
            overall task
          </div>
          <div className="h-full ">das</div>
        </motion.div>
        <motion.div
          className="bg-blue-300 shadow-md border border-blue-600 flex flex-col rounded-sm overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-full  bg-blue-600 py-1 text-white font-semibold uppercase text-center ">
            Collected
          </div>
          <div className="h-full "></div>
        </motion.div>
        <motion.div
          className="bg-blue-300 shadow-md border border-blue-600 flex flex-col rounded-sm overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="w-full  bg-blue-600 py-1 text-white font-semibold uppercase text-center ">
            bucket
          </div>
          <div className="h-full py-4 text-4xl font-black flex items-center justify-center">
            CIGNAL
          </div>
        </motion.div>
      </div>
      <div className="">
        <div className="flex flex-col md:grid grid-cols-1 md:grid-cols-6 grid-rows-4 h-full gap-4">
          <motion.div
            className="bg-blue-300 border border-blue-600 rounded-sm shadow-md col-span-4 row-span-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-blue-600 w-[100%] uppercase py-2 text-center text-white font-semibold">
              AGENT FIELD status
            </div>
            <div className="grid border-b border-blue-600 shadow-md grid-cols-6 bg-blue-500 w-[100%] uppercase py-1 text-center text-white font-semibold text-xs">
              <div>Name</div>
              <div>campaign</div>
              <div>bucket</div>
              <div>online</div>
              <div>lock</div>
              <div>task</div>
            </div>
          </motion.div>
          <motion.div
            className="row-span-4 col-span-2 bg-blue-300 rounded-sm border shadow-md border-blue-600 p-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          ></motion.div>
          <motion.div
            className="row-span-2 col-span-4 bg-blue-300 rounded-sm border shadow-md border-blue-600"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="bg-blue-600 w-[100%] uppercase py-2 text-center text-white font-semibold">
              AGENT FIELD production monitoring
            </div>
            <div className="grid border-b border-blue-600 shadow-md grid-cols-6 bg-blue-500 w-[100%] uppercase py-1 text-center text-white font-semibold text-xs">
              <div>Name</div>
              <div>paid</div>
              <div>target</div>
              <div>collection</div>
              <div>target</div>
              <div>variance</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TLFieldDashboard;
