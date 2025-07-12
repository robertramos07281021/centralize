import { useLocation, useNavigate } from "react-router-dom"
import { setServerError } from "../redux/slices/authSlice"
import { useAppDispatch } from "../redux/store"


const ServerError = () => {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()


  const handleClickOk = () => {
    if(location.pathname === "/agent-recordings") {
      navigate('/agent-production')
    } else {
      navigate(location.pathname)
    }
    dispatch(setServerError(false))
  }
  
  return (
    <div className="z-50 flex items-center justify-center absolute top-0 left-0 bg-white/5 backdrop-blur-[1px] h-full w-full ">
      <div className="h-2/3 w-2/5 border bg-white rounded-2xl border-slate-300 shadow-md shadow-black/30 flex flex-col items-center justify-center gap-20">
        <div className="flex flex-col items-center gap-10"> 
        <img src="/devIcon.png" alt="Developer Icon" className="h-40 animate-[bounce_3s_ease-in_infinite] "/>
        <p className="2xl:text-md lg:text-xs font-medium text-gray-600 text-center">There is an error on server side. Please waiting for a couple of time.</p>
        </div>
        <button 
          className="text-white 2xl:text-md lg:text-xs bg-red-600 rounded-xl h-10 w-20 font-bold"
          onClick={handleClickOk}
        >OK</button>
      </div>
    </div>
  )
}

export default ServerError