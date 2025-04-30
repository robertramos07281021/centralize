import { useSelector } from "react-redux"
import { RootState } from "../../redux/store"
import { useEffect, useState } from "react";


const AgentDashboard = () => {

  const {userLogged} = useSelector((state:RootState)=> state.auth)

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
 
  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full flex justify-between p-5 text-slate-600 text-xs font-medium ">
        <div>
          Bucket: {userLogged?.bucket?.toUpperCase()}
        </div>
        <div className="text-xs">
          Date & Time: <span className=""> {time.toLocaleDateString()} - {formattedTime}</span>
        </div>
      </div>
      <div className="h-full ">
      </div>
  </div>
  )
}

export default AgentDashboard
