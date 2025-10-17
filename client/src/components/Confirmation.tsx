import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const color = {
  CREATE: {
    title: "bg-blue-500",
    button: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300",
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
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300",
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
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300",
  },
  FINISHED: {
    title: "bg-green-500",
    button: "bg-green-500 hover:bg-green-600 focus:ring-green-300",
  },
  DOWNLOAD: {
    title: "bg-blue-500",
    button: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300",
  },
  ESCALATE: {
    title: "bg-red-500",
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300",
  },
  UNLOCK: {
    title: "bg-red-500",
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300",
  },
  ACTIVATE: {
    title: "bg-blue-500",
    button: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300",
  },
  DEACTIVATE: {
    title: "bg-red-500",
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300",
  },
  RPCTODAY: {
    title: "bg-red-500",
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300",
  },
  SELECT: {
    title: "bg-orange-500",
    button: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300",
  },
  SET: {
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        no();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => e}
      className="fixed w-screen h-screen top-0 left-0 z-50 flex items-center justify-center"
    >
      <motion.div
        div
        onClick={no}
        className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-sm cursor-pointer z-10"
        initial={{opacity: 0}}
        animate={{opacity: 1}}
      ></motion.div>
      <motion.div
        className="min-w-96 max-h-96 max-w-120 bg-white rounded-lg z-20 shadow-xl overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div
          className={`${color[toggle]?.title} p-2 text-2xl text-white font-black uppercase text-center `}
        >
          Confirmation
        </div>
        <div className="h-full p-10 flex flex-col items-center justify-center gap-10">
          <p className="text-xl font-medium text-slate-700 px-10 text-center">
            {message}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              accessKey="w"
              className={`${color[toggle]?.button} transition-all text-white focus:ring-4  font-medium rounded-lg text-lg w-24 py-2.5 cursor-pointer`}
              onClick={yes}
            >
              {noButtonHide.includes(toggle) ? "OK" : "Yes"}
            </button>
            {!noButtonHide.includes(toggle) && (
              <button
                type="button"
                className="text-white bg-slate-700 hover:bg-slate-800 focus:ring-4 focus:ring-slate-300 font-medium rounded-lg text-lg w-24 py-2.5 cursor-pointer"
                onClick={no}
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
