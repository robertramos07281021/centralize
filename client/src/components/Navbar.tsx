import { gql, useMutation, useQuery, useSubscription } from "@apollo/client"
import { BsFillPersonVcardFill } from "react-icons/bs";
import { IoMdLogOut } from "react-icons/io";
import {  useCallback, useEffect, useRef, useState } from "react";
import Confirmation from "./Confirmation";
import Loading from "../pages/Loading";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { RootState, useAppDispatch } from "../redux/store";
import {  setBreakValue, setDeselectCustomer, setLogout, setServerError, setStart, setSuccess, setUserLogged } from "../redux/slices/authSlice";
import NavbarExtn from "./NavbarExtn";
import { useSelector } from "react-redux";
import IdleAutoLogout from "./IdleAutoLogout";
import { accountsNavbar, BreakEnum, breaks } from "../middleware/exports";
import ServerError from "../pages/ServerError";
import SuccessToast from "./SuccessToast";
import { persistor } from "../redux/store";

type Targets = {
  daily: number,
  weekly: number,
  monthly: number
}

type UserInfo = {
  _id: string;
  type: "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION" | "MIS";
  branch: string;
  username: string;
  name: string;
  change_password: boolean
  department: string[]
  bucket: string[]
  user_id:string,
  isOnline: boolean
  targets: Targets
};

const myUserInfos = gql` 
  query getMe { 
    getMe {
      _id
      name
      username
      type
      departments
      branch
      change_password
      isOnline
      targets {
        daily
        weekly
        monthly
      }
    }
  } 
`

const LOGOUT = gql `
  mutation logout { 
    logout { 
      message 
      success 
    } 
  }
`

const DESELECT_TASK = gql`
  mutation DeselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`

const LOGOUT_USING_PERSIST = gql`
  mutation logoutToPersist($id:ID!) {
    logoutToPersist(id: $id) {
      message
      success
    }
  }
`

type UpdateProduction = {
  message: string
  success: boolean
  start: string
}

const UPDATE_PRODUCTION = gql`
  mutation UpdateProduction($type: String!) {
    updateProduction(type: $type) {
      message
      success
      start
    }
  }
`

type AgentLock = {
  message: string
  agentId: string
}

const LOCK_AGENT = gql`
  subscription AgentLocked {
    agentLocked {
      message
      agentId
    }
  }
`

const Navbar = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const location = useLocation()
  const {userLogged,selectedCustomer,breakValue, serverError, success} = useSelector((state:RootState)=> state.auth)
  const modalRef = useRef<HTMLDivElement>(null)
  const {error, data, refetch} = useQuery<{ getMe: UserInfo }>(myUserInfos,{pollInterval: 5000,notifyOnNetworkStatusChange: true,})
  const [poPupUser, setPopUpUser] = useState<boolean>(false) 
  const [deselectTask] = useMutation(DESELECT_TASK,{
    onCompleted: ()=> {
      dispatch(setDeselectCustomer())
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })


  const [popUpBreak, setPopUpBreak] = useState<boolean>(false)

  useSubscription<{agentLocked:AgentLock}>(LOCK_AGENT, {
    onData: ({data}) => {
      if(data) {
        if(data.data?.agentLocked.message === "AGENT_LOCK" && data.data?.agentLocked.agentId === userLogged?._id ){
          setTimeout(async()=> {
            await refetch()
          },50)
        }
      }
    }
  })

  useEffect(()=> {
    dispatch(setSuccess({success: false, message: "", isMessage:false}))
  },[location.pathname])

  const [logout, {loading}] = useMutation(LOGOUT,{
    onCompleted: async() => {
      dispatch(setLogout())
      await persistor.purge()
      navigate('/')
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

  const [confirmation, setConfirmation] = useState<boolean>(false)

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "LOGOUT" as "LOGOUT" | "IDLE" ,
    yes: () => {},
    no: () => {}
  })

  const handleSubmit = useCallback(() => {
    setConfirmation(true)
    setModalProps({
      no:()=> setConfirmation(false),
      yes: async() => {
        await logout();
        if(selectedCustomer) {
          await deselectTask({variables: {id:selectedCustomer?._id}});
        }
      },
      message: "Are you sure you want to logout?",
      toggle: "LOGOUT"
    })
  },[selectedCustomer,setConfirmation, deselectTask, dispatch, logout,setModalProps])

  const [logoutToPersist, {loading:logoutToPEristsLoading}] = useMutation<{logoutToPersist: {success: boolean, message: string}}>(LOGOUT_USING_PERSIST,{
    onCompleted: async()=> {
      dispatch(setLogout())
      await persistor.purge()
      navigate("/")
    },
    onError: () => {
      dispatch(setServerError(true));
    }
  })

  const [updateProduction] = useMutation<{updateProduction:UpdateProduction}>(UPDATE_PRODUCTION,{
    onCompleted: () => {
      dispatch(setStart(new Date().toString()))
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })

  const forceLogout = useCallback(async()=> {
    await logoutToPersist({ variables: { id: userLogged?._id } });
    if(selectedCustomer) {
      await deselectTask({ variables: { id: selectedCustomer?._id, user_id: userLogged?._id } });
    }
  },[deselectTask, logoutToPersist, selectedCustomer, userLogged])

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      if (error) {
        if(error?.message === "Not authenticated" || error?.message === "Unauthorized") {
          setConfirmation(true)
          setModalProps({
            no: ()=> {
              setConfirmation(false); 
              forceLogout()
            },
            yes: () => { 
              setConfirmation(false);
              forceLogout()
            },
            message: "You have been force to logout!",
            toggle: "IDLE"
          })
        }
      }
    },1000)
    return ()=> clearTimeout(timer)
  },[error,navigate,dispatch, logoutToPersist, userLogged, deselectTask,selectedCustomer])


  useEffect(()=> {
    if(breakValue !== BreakEnum.PROD && userLogged?.type === "AGENT") {
      navigate('/break-view')
    }
  },[breakValue, navigate])

  const onClickBreakSelection = async(value:string,e:React.ChangeEvent<HTMLInputElement>)=> {
    if(e.target.checked) {
      setPopUpBreak(false)
      setPopUpUser(false)
      dispatch(setBreakValue(BreakEnum[value as keyof typeof BreakEnum]))
      await updateProduction({variables: {type: value }})
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setPopUpUser(false);
    }
  };

  useEffect(() => {
    if (poPupUser) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [poPupUser]);
  
  useEffect(()=> {
    const timer = setTimeout(async()=> {
      if(data && userLogged) {
        dispatch(setUserLogged({...userLogged,isOnline: data?.getMe?.isOnline, targets: data?.getMe?.targets || {daily: 0, weekly: 0, monthly: 0}}))
        console.log(data?.getMe?.isOnline)
        if(!data?.getMe?.isOnline) {
          setConfirmation(true)
          setModalProps({
            no: ()=> {
              setConfirmation(false); 
              forceLogout()
            },
            yes: () => { 
              setConfirmation(false);
              forceLogout()
            },
            message: "You have been force to logout!",
            toggle: "IDLE"
          })
        }
      }
    })
    return () => clearTimeout(timer)
  },[data])

  if(loading || logoutToPEristsLoading) return <Loading/>

  return userLogged && (
    <>
      {
        serverError &&
        <ServerError/>
      }
      {
        success.success &&
        <SuccessToast successObject={success || null} close={()=> dispatch(setSuccess({success:false, message:"",isMessage: false}))}/>
      }
      <div className="sticky top-0 z-40 print:hidden">
        <div className="p-2 bg-blue-500 flex justify-between items-center ">
          <div className="flex text-2xl gap-2 font-medium items-center text-white italic">
            <img src="/singlelogo.jpg" alt="Bernales Logo" className="w-10" />
            Collections System
            {
              (userLogged?.type === "AGENT") && breakValue !== BreakEnum.WELCOME && !selectedCustomer && 
              <IdleAutoLogout/> 
            }
          </div>
          <div className="p-1 flex gap-2 text-xs z-50">
            <p className="font-medium text-white italic flex items-center">Hello&nbsp;<span className="uppercase">{userLogged?.name}</span></p>
            <BsFillPersonVcardFill className="text-4xl cursor-pointer " onClick={()=> {setPopUpUser(!poPupUser); setPopUpBreak(false)}}/>
            { poPupUser &&
              <div ref={modalRef} className="w-40 h-auto border border-slate-200 shadow-xl shadow-black/8 rounded-xl top-13 end-5 bg-white absolute flex flex-col p-2 text-slate-500 font-medium">
                {
                  accountsNavbar[userLogged?.type]?.map((e,index)=> {
                    const navTo = (userLogged?.type === "AGENT" && breakValue !== BreakEnum.PROD) ? '/break-view' : e.link
                    return (
                    <Link key={index} to={navTo} className={`${index === 0 && 'rounded-t-lg'} grow px-2 border-b border-slate-200 flex items-center hover:text-white hover:bg-slate-500 duration-200 ease-in-out cursor-pointer py-2`} onClick={()=> setPopUpUser(false) }>
                      {e.name === "Customer Interaction Panel" ? "CIP" : e.name}
                    </Link>
                    )
                  }
                  )
                }
                {
                  userLogged?.type === "AGENT" && breakValue !== BreakEnum.WELCOME &&
                  <div className="grow border-b border-slate-200 flex items-center cursor-pointer relative ">
                    <h1 className="p-2 h-full w-full hover:bg-slate-500 hover:text-white   duration-200 ease-in-out" onClick={()=> setPopUpBreak(!popUpBreak)}>Breaks</h1>
                    {
                      popUpBreak &&
                      <div className="absolute -left-7/6 border-slate-300 border rounded-xl w-auto bg-white h-auto flex flex-col top-0 p-2">
                        {
                          breaks.map((e,index) => 
                            <label className={`p-2 hover:bg-slate-500 hover:text-white duration-200 ease-in-out ${index === 0 ? 'rounded-t-lg' : ""} ${index === (breaks.length - 1) ? "rounded-b-lg" : ""} flex items-center gap-2`} key={index}>
                              <input type="radio" name='break' id={e.value} value={BreakEnum[e.value as keyof typeof BreakEnum]} onChange={(e)=> onClickBreakSelection(e.target.value, e)}
                              checked={breakValue === BreakEnum[e.value]}
                              />
                              <span>{e.name}</span>
                            </label>
                          )
                        }  
                      </div>
                    }
                  </div>  
                }
                <div className="grow px-2 flex items-center justify-between hover:text-white hover:bg-slate-500 duration-200 ease-in-out cursor-pointer rounded-b-lg py-2" onClick={handleSubmit}>
                  Logout
                  <IoMdLogOut />
                </div>
              </div>
            }
          </div>
        </div>
        {
          ((breakValue === BreakEnum.PROD && userLogged?.type === 'AGENT') || (userLogged?.type !== 'AGENT')) &&
          <NavbarExtn/>
        }
      </div>
      {
        confirmation &&
        <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default Navbar
