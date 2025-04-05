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
import { setNeedLogin, setSelectedCustomer, setUserLogged } from "../redux/slices/authSlice";
import NavbarExtn from "./NavbarExtn";


const Navbar = () => {
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
      dispatch(setSelectedCustomer({
        _id: "",
        case_id: "",
        account_id: "",
        endorsement_date: "",
        credit_customer_id: "",
        bill_due_day: 0,
        max_dpd: 0,
        out_standing_details: {
          principal_os: 0,
          interest_os: 0,
          admin_fee_os: 0,
          txn_fee_os: 0,
          late_charge_os: 0,
          dst_fee_os: 0,
          total_os: 0
        },
        grass_details: {
          grass_region: "",
          vendor_endorsement: "",
          grass_date: ""
        },
        account_bucket: {
          name: "",
          dept: ""
        },
        customer_info: {
          fullName:"",
          dob:"",
          gender:"",
          contact_no:[],
          emails:[],
          addresses:[],
          _id:""
        }
      }))
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
    <div className="sticky top-0 z-40 print:hidden">
      <div className="p-2 bg-blue-500 flex justify-between items-center ">
        <div className="flex text-2xl gap-2 font-medium items-center text-white italic">
          <img src="/singlelogo.jpg" alt="Bernales Logo" className="w-10" />
          Bernales & Associates
        </div>
        <div className="p-1 flex gap-2">
          <p className="font-medium text-white italic flex items-center">Hello&nbsp;<span className="uppercase">{data?.getMe.name}</span></p>
          <BsFillPersonVcardFill className="text-4xl cursor-pointer border " onClick={()=> setPopUpUser(!poPupUser)}/>
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
