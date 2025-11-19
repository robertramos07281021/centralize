import { useEffect } from "react";
import { motion } from "framer-motion";

type Success = {
  success: boolean;
  message: string;
  isMessage: boolean;
};

type modalProps = {
  successObject: Success | null;
  close: () => void;
};

const SuccessToast: React.FC<modalProps> = ({ successObject, close }) => {
  const toastColor = {
    CREATED: {
      toast: `${
        successObject?.isMessage ? "bg-white" : "bg-green-400  border-green-800"
      }`,
      close: `${successObject?.isMessage ? "text-black" : "text-green-400"}`,
    },
    UPDATED: {
      toast: `bg-orange-400`,
      close: "text-orange-400",
    },
    DELETED: {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    EXISTS: {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    UPLOADED: {
      toast: "bg-green-400",
      close: "text-green-400",
    },
    "NOT INCLUDED": {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    REMOVED: {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    ADDED: {
      toast: "bg-green-400",
      close: "text-green-400",
    },
    DUPLICATE: {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    FINISHED: {
      toast: "bg-green-400",
      close: "text-green-400",
    },
    ABSENT: {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    DOWNLOADED: {
      toast: "bg-green-400",
      close: "text-green-400",
    },
    TRANSFER: {
      toast: "bg-green-400",
      close: "text-green-400",
    },
    UNLOCK: {
      toast: "bg-green-400",
      close: "text-green-400",
    },
    INCORRECT: {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    ACTIVATE: {
      toast: "bg-green-400",
      close: "text-green-400",
    },
    DEACTIVATE: {
      toast: "bg-green-400",
      close: "text-green-400",
    },
    "NOT FOUND": {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    "NOT READY": {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    "NO ACTIVE CALLFILE": {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    SET: {
      toast: "bg-orange-400",
      close: "text-orange-400",
    },
    MESSAGE: {
      toast: "bg-green-400",
      close: "text-green-400",
    },
    VICI: {
      toast: "bg-red-400",
      close: "text-red-400",
    },
    "END CALL": {
      toast: "bg-green-400 border-green-800",
      close: "text-green-400",
    },
  } as const;
  useEffect(() => {
    const timer = setTimeout(() => {
      if (successObject?.success) {
        close?.();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const messageText = successObject?.message?.toUpperCase() ?? "";
  let successType: keyof typeof toastColor = "CREATED";
  if (messageText.includes("UPDATED")) successType = "UPDATED";
  if (messageText.includes("DELETED")) successType = "DELETED";
  if (messageText.includes("EXISTS")) successType = "EXISTS";
  if (messageText.includes("UPLOADED")) successType = "UPLOADED";
  if (messageText.includes("REMOVED")) successType = "REMOVED";
  if (messageText.includes("ADDED")) successType = "ADDED";
  if (messageText.includes("DUPLICATE")) successType = "DUPLICATE";
  if (messageText.includes("FINISHED")) successType = "FINISHED";
  if (messageText.includes("ABSENT")) successType = "ABSENT";
  if (messageText.includes("DOWNLOADED")) successType = "DOWNLOADED";
  if (messageText.includes("TRANSFER")) successType = "TRANSFER";
  if (messageText.includes("UNLOCK")) successType = "UNLOCK";
  if (messageText.includes("INCORRECT")) successType = "INCORRECT";
  if (messageText.includes("ACTIVATE")) successType = "ACTIVATE";
  if (messageText.includes("DEACTIVATE")) successType = "DEACTIVATE";
  if (messageText.includes("NOT INCLUDED")) successType = "NOT INCLUDED";
  if (messageText.includes("NOT FOUND")) successType = "NOT FOUND";
  if (messageText.includes("NOT READY")) successType = "NOT READY";
  if (messageText.includes("NO ACTIVE CALLFILE"))
    successType = "NO ACTIVE CALLFILE";
  if (messageText.includes("SET")) successType = "SET";
  if (messageText.includes("MESSAGE")) successType = "MESSAGE";
  if (messageText.includes("VICI")) successType = "VICI";
  if (messageText.includes("VICI")) successType = "END CALL";

  return (
    <motion.div
      initial={{ x: 200, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring" }}
      className={`${
        toastColor[successType].toast
      } min-w-96 min-h-13 max-h-13 font-black uppercase shadow-md rounded-md shadow-black/20 border-2 fixed right-5 top-20 z-60 flex items-center px-4 text-shadow-md ${
        successObject?.isMessage ? "text-black" : "text-white"
      }  justify-between gap-10`}
    >
      <p>{successObject?.message}</p>

      <div
        className={`"  p-1 ${toastColor[successType].close} rounded-full cursor-pointer  " `}
        onClick={close}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
          className="size-6 text-white"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </div>

    </motion.div>
  );
};

export default SuccessToast;
