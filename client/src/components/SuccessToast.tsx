import { useEffect } from "react";
import { IoMdClose } from "react-icons/io";

interface Success {
  success: boolean
  message: string
}

interface modalProps {
  successObject:Success | null;
  close: () => void;
}

const SuccessToast:React.FC<modalProps> = ({successObject, close}) => {
  const toastColor = {
    CREATED: {
      toast: "bg-green-400",
      close: "text-green-400"
    },
    UPDATED: {
      toast: "bg-orange-400",
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
    }
  } as const;
  console.log(successObject)
  useEffect(()=> {
    const timer = setTimeout(()=> {
      if(successObject?.success) {
        close()
      }
    },5000)
    return () => clearTimeout(timer)
  },[successObject,close])
  
  const messageText = successObject?.message.toUpperCase() ?? "";
  let successType: keyof typeof toastColor = "CREATED";

  if (messageText.includes("UPDATED")) successType = "UPDATED";
  if (messageText.includes("DELETED")) successType = "DELETED";
  if (messageText.includes("EXISTS")) successType = "EXISTS";
  if (messageText.includes("UPLOADED")) successType = "UPLOADED";

  return (
    <div className={`${toastColor[successType].toast} w-96 h-13 rounded-xl border-slate-100 shadow shadow-black/20 border fixed right-5 top-20 z-50 flex items-center px-4 font-medium text-white justify-between`}>
      <p>
        {successObject?.message}
      </p>
      <IoMdClose 
        className={`${toastColor[successType].close} bg-white rounded  text-2xl cursor-pointer`}
        onClick={close}
        />
    </div>
  )
}

export default SuccessToast
