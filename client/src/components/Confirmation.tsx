import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const color = {
  CREATE: {
    title: "bg-blue-500",
    button:
      "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300 ",
  },
  UPDATE: {
    title: "bg-orange-500",
    button: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300",
  },
  DELETE: {
    title: "bg-red-500",
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300",
  },
  LOGOUT: {
    title: "bg-red-500",
    button:
      "bg-red-500 hover:bg-red-600 focus:ring-red-300 ",
  },
  UPLOADED: {
    title: "bg-green-500",
    button: "bg-green-500 hover:bg-green-600 focus:ring-green-300",
  },
  ADDED: {
    title: "bg-green-500",
    button: "bg-green-500 hover:bg-green-600 focus:ring-green-300",
  },
  IDLE: {
    title: "bg-red-500",
    button:
      "bg-red-500 hover:bg-red-600 focus:ring-red-300 ",
  },
  FINISHED: {
    title: "bg-green-500",
    button: "bg-green-500 hover:bg-green-600 focus:ring-green-300",
  },
  DOWNLOAD: {
    title: "bg-blue-500",
    button: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300 ",
  },
  ESCALATE: {
    title: "bg-red-500",
    button:
      "bg-red-500 hover:bg-red-600  focus:ring-red-300 ",
  },
  UNLOCK: {
    title: "bg-red-500",
    button:
      "bg-red-500 hover:bg-red-600 focus:ring-red-300  ",
  },
  ACTIVATE: {
    title: "bg-blue-500",
    button: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300 ",
  },
  DEACTIVATE: {
    title: "bg-red-500",
    button:
      "bg-red-500 hover:bg-red-600 focus:ring-red-300",
  },
  RPCTODAY: {
    title: "bg-red-500",
    button:
      "bg-red-500 hover:bg-red-600 focus:ring-red-300 ",
  },
  SELECT: {
    title: "bg-orange-500",
    button: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300",
  },
  SET: {
    title: "bg-orange-500",
    button: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300",
  },
  AUTO: {
    title: "bg-yellow-800",
    button: "bg-yellow-800 hover:bg-yellow-800 focus:ring-yellow-800",
  },
  DIAL: {
    title: "bg-orange-500",
    button: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300",
  },
};

type toggleType = keyof typeof color;

type modalProps = {
  yes: () => void;
  no: () => void;
  message: string;
  toggle: toggleType;
};

const noButtonHide = ["IDLE", "RPCTODAY"];


const Confirmation: React.FC<modalProps> = ({ yes, no, message, toggle }) => {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    try {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !loading) {
          no();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    } catch (error) {
      console.log(error);
    }
  }, [loading]);

  const handleYes = async () => {
    setLoading(true);
    try {
      await yes();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => e}
      className="fixed w-screen h-screen top-0 left-0 z-60 flex items-center justify-center"
    >
      <motion.div
        onClick={() => !loading && no()}
        key={"confirmModal-bg"}
        className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-sm cursor-pointer z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      ></motion.div>
      <motion.div
        key={"confirmModal-div"}
        className={` ${color[toggle]?.title}  min-w-96  max-h-96 max-w-120 bg-white rounded-lg z-20 shadow-xl overflow-hidden flex flex-col `}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        layout
      >
        <div
          className={`${color[toggle]?.title} p-2  text-2xl text-white py-4 font-black uppercase text-center `}
        >
          Confirmation
        </div>
        <div className="h-full p-10 flex flex-col bg-white items-center justify-center gap-10">
          <p className="text-xl font-medium text-slate-700 px-10 text-center">
            {loading
              ? noButtonHide.includes(toggle)
                ? "Processing..."
                : toggle === "CREATE" ||
                  toggle === "UPLOADED" ||
                  toggle === "ADDED" ||
                  toggle === "FINISHED"
                ? "Submitting..."
                : "Confirming..."
              : message}
          </p>
          <div className="flex gap-2">
            <motion.button
              type="button"
              accessKey="w"
              className={
                `transition-all focus:ring-4 font-black uppercase rounded-md shadow-md text-lg px-6 py-2  ` +
                (loading
                  ? "opacity-60 cursor-not-allowed bg-gray-300 text-gray-400"
                  : `  text-white cursor-pointer ${color[toggle]?.button} ` ||
                    " ")
              }
              onClick={handleYes}
              disabled={loading}
              layout
            >
              {loading
                ? noButtonHide.includes(toggle)
                  ? "..."
                  : toggle === "CREATE" ||
                    toggle === "UPLOADED" ||
                    toggle === "ADDED" ||
                    toggle === "FINISHED"
                  ? "Submitting..."
                  : "Confirming..."
                : noButtonHide.includes(toggle)
                ? "OK"
                : "Yes"}
            </motion.button>
            {!noButtonHide.includes(toggle) && (
              <button
                type="button"
                className={`text-white bg-gray-400 border-gray-500 transition-all hover:bg-gray-500 shadow-md font-black uppercase rounded-md text-lg px-6 py-2 cursor-pointer ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
                onClick={no}
                disabled={loading}
              >
                No
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Confirmation;
