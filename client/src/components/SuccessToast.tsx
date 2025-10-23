import { useEffect } from "react";
import { IoMdClose } from "react-icons/io";

type Success = {
  success: boolean
  message: string
  isMessage: boolean
}

type modalProps = {
  successObject:Success | null;
  close: () => void;
}

const SuccessToast:React.FC<modalProps> = ({successObject, close}) => {
  const toastColor = {
    CREATED: {
      toast: `${successObject?.isMessage ? "bg-white" : "bg-green-400"}`,
      close: `${successObject?.isMessage ? "text-black" : "text-green-400"}`
    },
    UPDATED: {
      toast: `bg-orange-400`,
      close: "text-orange-400"
    },
    DELETED: {
      toast: "bg-red-400",
      close: "text-red-400"
    },
    EXISTS: {
      toast: "bg-red-400",
      close: "text-red-400"
    },
    UPLOADED: {
      toast: "bg-green-400",
      close: "text-green-400"
    },
    "NOT INCLUDED" : {
      toast: "bg-red-400",
      close: "text-red-400"
    },
    REMOVED: {
      toast: "bg-red-400",
      close: "text-red-400"
    },
    ADDED: {
      toast: "bg-green-400",
      close: "text-green-400"
    },
    DUPLICATE: {
      toast: "bg-red-400",
      close: "text-red-400"
    },
    FINISHED: {
      toast: "bg-green-400",
      close: "text-green-400"
    },
    ABSENT: {
      toast: "bg-red-400",
      close: "text-red-400"
    },
    DOWNLOADED: {
      toast: "bg-green-400",
      close: "text-green-400"
    },
    TRANSFER: {
      toast: "bg-green-400",
      close: "text-green-400"
    },
    UNLOCK: {
      toast: "bg-green-400",
      close: "text-green-400"
    },
    INCORRECT: {
      toast: "bg-red-400",
      close: "text-red-400"
    },
    ACTIVATE: {
      toast: "bg-green-400",
      close: "text-green-400"
    },
    DEACTIVATE: {
      toast: "bg-green-400",
      close: "text-green-400"
    },
    "NOT FOUND": {
      toast: "bg-red-400",
      close: "text-red-400"
    },
    "NOT READY": {
      toast: "bg-red-400",
      close: "text-red-400"
    },
    'NO ACTIVE CALLFILE': {
      toast: "bg-red-400",
      close: "text-red-400"
    },
    SET: {
      toast: "bg-orange-400",
      close: "text-orange-400"
    },
    MESSAGE: {
      toast: "bg-green-400",
      close: "text-green-400"
    },
    VICI: {
      toast: "bg-red-400",
      close: "text-red-400"
    }
  } as const;
  useEffect(()=> {
    const timer = setTimeout(()=> {
      if(successObject?.success) {
        close()
      }
    },5000)
    return () => clearTimeout(timer)
  },[successObject,close])
  
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
  if (messageText.includes("NO ACTIVE CALLFILE")) successType = "NO ACTIVE CALLFILE";
  if (messageText.includes("SET")) successType = "SET";
  if (messageText.includes("MESSAGE")) successType = "MESSAGE";
  if (messageText.includes("VICI")) successType = "VICI";

  return (
    <div className={`${toastColor[successType].toast} min-w-96 min-h-13 max-h-13 rounded-xl border-slate-100 shadow shadow-black/20 border fixed right-5 top-20 z-60 flex items-center px-4 font-medium ${successObject?.isMessage ? "text-black" : "text-white"}  justify-between gap-10`} >
      <p>
        {successObject?.message}
      </p>
      <IoMdClose 
        className={`${toastColor[successType].close} ${successObject?.isMessage ? "text-black" : "text-white"} rounded text-2xl cursor-pointer`}
        onClick={close}
        />
    </div>
  )
}


export default SuccessToast
