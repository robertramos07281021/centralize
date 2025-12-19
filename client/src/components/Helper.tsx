import viciImage from "../images/vicidial_on_dial.png";
import ccsSearch from "../images/search.png";
import dispositionPanel from "../images/dispositionPanel.png";
import { motion } from "framer-motion";

type Props = {
  close: () => void;
};

const Helper: React.FC<Props> = ({ close }) => {
  return (
    <motion.div
      className="absolute top-0 left-0 h-full w-full bg-black/40 backdrop-blur-sm p-5 border z-50 flex overflow-hidden"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <div className="h-full w-full rounded-md bg-white border relative flex flex-col overflow-hidden ">
        <h1 className="text-5xl h-[10%] justify-center font-black flex items-center uppercase bg-blue-600 text-white text-center border-b border-black p-5">
          Knowledge Base
          <button
            className="absolute right-5 border-2 border-red-800 rounded-full p-1 text-xl flex items-center justify-center cursor-pointer bg-red-600 hover:bg-red-700 transition-all text-white"
            onClick={() => close()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-5"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </h1>
        <div className=" h-[90%] w-full p-5 overflow-auto">
          <div className="flex flex-col">
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="font-black text-xl text-shadow-2xs uppercase">
                How to use Search Button
              </p>
              <p className="">
                1. Make sure there is an active call in{" "}
                <strong>Vicidial</strong>, either via <strong>Manual</strong>,
                or <strong>Auto</strong>.
              </p>
            </motion.div>
            <motion.div
              className="flex text-sm flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="items-center  justify-center flex">
                <img
                  src={viciImage}
                  alt="Vicidial Image"
                  className="ms-5 mt-5 border border-gray-400 rounded-md shadow-md"
                />
              </div>
            </motion.div>
          </div>
          <div className="mt-5 flex flex-col">
            <motion.div
              className=" mt-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              viewport={{ once: true }}
            >
              2. Click <strong>Search</strong>. If the customer account isn’t
              found, ask your TL to check if another agent has already claimed
              it or their is an error to your account need to fixed, your
              vicidial id registered on CCS.
            </motion.div>
            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              viewport={{ once: true }}
            >
              <img
                src={ccsSearch}
                alt="CCS search Image"
                className="ms-5 mt-5"
              />
            </motion.div>
          </div>

          <div className="mt-5 flex flex-col">
            <motion.div
              className=" mt-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: false }}
            >
              <p className="mt-5 text-xl font-black uppercase">
                How To Use Customer Disposition
              </p>
              <p className="">
                {/* &#9679; */}
                1. First, select the <strong>Contact Method</strong> and{" "}
                <strong>Disposition</strong> before the <strong>Submit</strong>{" "}
                button becomes available.
              </p>
            </motion.div>
            <motion.div
              className=" flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: false }}
            >
              <img
                src={dispositionPanel}
                alt="Disposition Panel Image"
                className="ms-5 mt-5"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Helper;
