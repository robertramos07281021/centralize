import { useMutation, useQuery } from "@apollo/client"
import { myUserInfos } from "../apollo/query"
import { UserInfo } from "../middleware/types"
import { BsFillPersonVcardFill } from "react-icons/bs";
import { IoMdLogOut } from "react-icons/io";
import { useEffect, useState } from "react";
import { LOGOUT } from "../apollo/mutations";
import Confirmation from "./Confirmation";
import Loading from "../pages/Loading";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../redux/store";
import { setNeedLogin, setUserLogged } from "../redux/slices/authSlice";
import NavbarExtn from "./NavbarExtn";


const Navbar:React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const {data, refetch, error} = useQuery<{ getMe: UserInfo }>(myUserInfos)
  const [poPupUser, setPopUpUser] = useState<boolean>(false)  
  const [logout, {loading}] = useMutation(LOGOUT)
  const [confirmation, setConfirmation] = useState<boolean>(false)

  const confirmationFunction: Record<string, () => Promise<void>> = {
    LOGOUT: async () => {
      await logout();
      dispatch(setNeedLogin(true))
      dispatch(setUserLogged(
        {
          _id: "",
          change_password: false,
          name: "",
          type: "",
          username: "",
          branch: "",
          department: "",
          bucket: ""
        }
      ))
      navigate('/')
    }
  };
  
  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
    yes: () => {},
    no: () => {}
  })

  const handleSubmit =(action: "CREATE" | "UPDATE" | "DELETE" | "LOGOUT") => {
    setConfirmation(true)
    setModalProps({
      no:()=> setConfirmation(false),
      yes:() => { confirmationFunction[action]?.();},
      message: "Are you sure you want to logout?",
      toggle: action
    })
  }

  useEffect(()=> {
    refetch()
    const refetchInterval = setInterval(refetch,2000)
    return () => clearInterval(refetchInterval)
  },[refetch,data])

  useEffect(()=> {
    if (error instanceof Error) {
      if(error?.message === "Not authenticated") {
        dispatch(setNeedLogin(true))
        dispatch(setUserLogged({
          _id: "",
          change_password: false,
          name: "",
          type: "",
          username: "",
          branch: "",
          department: "",
          bucket: ""
        }))
        navigate("/")
      }
    }
  },[error,navigate,dispatch])


  if(loading) return <Loading/>

  return (
    <div className="sticky top-0 z-40">
      <div className="p-2 bg-blue-500 flex justify-between items-center ">
        <img src="/bernalesLogo.png" alt="Bernales Logo" className="w-1/12" />
        <div className="p-1 flex gap-2">
          <p className="font-medium text-white">Hello {data?.getMe.name.toUpperCase()}!</p>
          <BsFillPersonVcardFill className="text-4xl cursor-pointer" onClick={()=> setPopUpUser(!poPupUser)}/>
          { poPupUser &&
            <div className="w-40 h-40 border border-slate-200 shadow-xl shadow-black/8 rounded-xl top-13 end-5 bg-white absolute flex flex-col p-2 text-slate-500 font-medium">
              <div className="grow px-2 border-b border-slate-200 flex items-center hover:text-white hover:bg-slate-500 duration-200 ease-in-out cursor-pointer rounded-t-lg">
                {data?.getMe.name.toLocaleUpperCase()}
              </div>
              <div className="grow px-2 border-b border-slate-200 flex items-center hover:text-white hover:bg-slate-500 duration-200 ease-in-out cursor-pointer">
                Dashboard
              </div>
              <div className="grow px-2 border-b border-slate-200 flex items-center hover:text-white hover:bg-slate-500 duration-200 ease-in-out cursor-pointer">
                Statistics
              </div>
              <div className="grow px-2 flex items-center justify-between hover:text-white hover:bg-slate-500 duration-200 ease-in-out cursor-pointer rounded-b-lg" onClick={()=> handleSubmit("LOGOUT")}>
                Logout
                <IoMdLogOut />
              </div>
            </div>
          }
        </div>
        {
          confirmation &&
          <Confirmation {...modalProps}/>
        }
      </div>
      <NavbarExtn/>
    </div>
  )
}

export default Navbar
