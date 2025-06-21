
const color = {
  CREATE: {
    title: "bg-blue-500",
    button: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300"
  },
  UPDATE: {
    title: "bg-orange-500",
    button: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-300"
  },
  DELETE: {
    title: "bg-red-500",
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300"
  },
  LOGOUT: {
    title: "bg-red-500",
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300"
  },
  UPLOADED: {
    title: "bg-green-500",
    button: "bg-green-500 hover:bg-green-600 focus:ring-green-300"
  },
  ADDED: {
    title: "bg-green-500",
    button: "bg-green-500 hover:bg-green-600 focus:ring-green-300"
  },
  IDLE: {
    title: "bg-red-500",
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300"
  },
  FINISHED: {
    title: "bg-green-500",
    button: "bg-green-500 hover:bg-green-600 focus:ring-green-300"
  },
  DOWNLOAD: {
    title: "bg-blue-500",
    button: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-300"
  },
  ESCALATE: {
    title: "bg-red-500",
    button: "bg-red-500 hover:bg-red-600 focus:ring-red-300"
  },
}

type toggleType = keyof typeof color

interface modalProps {
  yes: () => void;
  no: () => void;
  message: string;
  toggle: toggleType
}

const Confirmation:React.FC<modalProps> = ({yes, no, message, toggle}) => {
  return (
    <div className="fixed w-screen h-screen bg-black/20 top-0 left-0 z-50 backdrop-blur-[1.5px] flex items-center justify-center">
    <div className="w-96 h-72 bg-white rounded-lg overflow-hidden flex flex-col shadow-xl shadow-black/60">
      <div className={`${color[toggle]?.title} p-2 text-2xl text-white font-medium`}>Confirmation</div>
      <div className="h-full flex flex-col items-center justify-center gap-10">
        <p className="text-xl font-medium text-slate-700 px-10 text-center">{message}</p>
        <div className="flex gap-10">
        <button 
          type="button" 
          className={`${color[toggle]?.button} text-white focus:ring-4  font-medium rounded-lg text-lg w-24 py-2.5 cursor-pointer`} onClick={yes}>{message.includes('idle') ? "OK":"Yes"}</button>
        {
          toggle !== "IDLE" &&
          <button 
            type="button" 
            className="text-white bg-slate-700 hover:bg-slate-800 focus:ring-4 focus:ring-slate-300 font-medium rounded-lg text-lg w-24 py-2.5 cursor-pointer" onClick={no}>No</button>
        }
        </div>
      </div>
    </div>
  </div>
  )
}

export default Confirmation