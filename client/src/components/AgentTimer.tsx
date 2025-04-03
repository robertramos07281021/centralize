import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";


const AgentTimer = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    if(userLogged.type === "AGENT") {
      const timer = setInterval(() => {
        setTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [userLogged]);

  const formattedTime = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }); 

  return (
    <div className="w-full flex justify-between p-5 text-slate-600 text-xs font-medium ">
      <div>
        Bucket: {userLogged?.bucket?.toUpperCase()}
      </div>
      <div className="text-xs">
        Date & Time: <span >{time.toLocaleDateString()} - {formattedTime}</span>
      </div>
    </div>
  )
}

export default AgentTimer