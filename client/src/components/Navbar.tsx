import { gql, useMutation, useQuery, useSubscription } from "@apollo/client"
import { BsFillPersonVcardFill } from "react-icons/bs";
import { IoMdLogOut } from "react-icons/io";
import { useEffect, useState } from "react";
import Confirmation from "./Confirmation";
import Loading from "../pages/Loading";
import { Link, useNavigate } from "react-router-dom";
import { RootState, useAppDispatch } from "../redux/store";
import { setBreakValue, setDeselectCustomer, setLogout, setServerError } from "../redux/slices/authSlice";
import NavbarExtn from "./NavbarExtn";
import { useSelector } from "react-redux";
import IdleAutoLogout from "./IdleAutoLogout";
import { accountsNavbar } from "../middleware/exports";
import ServerError from "../pages/ServerError";

type UserInfo = {
  _id: string;
  type: "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION" | "MIS";
  branch: string;
  username: string;
  name: string;
  change_password: boolean
  department: string[]
  bucket: string[]
  user_id:string
};

          // enum: ['LUNCH','COFFEE','MEETING','TECHSUPP','CRBREAK','COACHING','HRMEETING','HANDSETNEGO','SKIPTRACING','CLINIC','PROD']

enum BreakEnum {
  LUNCH ="LUNCH",
  COFFEE = "COFFEE",
  MEETING = "MEETING", 
  TECHSUPP = "TECHSUPP",
  CRBREAK = "CRBREAK",
  COACHING = "COACHING",
  HRMEETING = "HRMEETING",
  HANDSETNEGO = "HANDSETNEGO",
  SKIPTRACING = "SKIPTRACING",
  CLINIC = "CLINIC",
  PROD = "PROD"
}


interface Breaks {
  name: string
  value: keyof typeof BreakEnum
}

const myUserInfos = gql` 
  query GetMe { 
    getMe {
      _id
      name
      username
      type
      departments
      branch
      change_password
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
`;

const DESELECT_TASK = gql`
  mutation DeselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`

const LOGOUT_USING_PERSIST = gql`
  mutation LogoutUsingPersist($id:ID!) {
    logoutToPersist(id: $id) {
      message
      success
    }
  }
`

const DUMMY_SUB = gql`
  subscription DummyPing {
    ping
  }
`

const Navbar = () => {
  const navigate = useNavigate()
  const {userLogged,selectedCustomer,breakValue, serverError} = useSelector((state:RootState)=> state.auth)
  const dispatch = useAppDispatch()
  const {error} = useQuery<{ getMe: UserInfo }>(myUserInfos,{pollInterval: 10000})
  const [poPupUser, setPopUpUser] = useState<boolean>(false) 
  const [deselectTask] = useMutation(DESELECT_TASK,{
    onCompleted: ()=> {
      dispatch(setDeselectCustomer())
    }
  })
  const [popUpBreak, setPopUpBreak] = useState<boolean>(false)

  useSubscription(DUMMY_SUB)

  const [logout, {loading}] = useMutation(LOGOUT,{
    onCompleted: () => {
      dispatch(setLogout())
      navigate('/')
    },

  })
  const [confirmation, setConfirmation] = useState<boolean>(false)

  const confirmationFunction: Record<string, () => Promise<void>> = {
    LOGOUT: async() => {
      try {
        await logout();
        if(selectedCustomer._id) {
          await deselectTask({variables: {id:selectedCustomer._id}});
        }
      } catch (error) {
        console.log("An unknown error occurred",error);
        dispatch(setServerError(true))
      }
    }
  };
  
  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT" | "IDLE",
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

  const [logoutToPersist, {loading:logoutToPEristsLoading}] = useMutation(LOGOUT_USING_PERSIST,{
    onCompleted: ()=> {
      dispatch(setLogout())
      navigate("/")
    },
  })

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      if (error instanceof Error) {
        if(error?.message === "Not authenticated" || error?.message === "Unauthorized") {
          setConfirmation(true)
          setModalProps({
            no:async()=> {
              setConfirmation(false)
              try {
                if(selectedCustomer._id){
                  await deselectTask({variables: {id:selectedCustomer._id,user_id: userLogged._id}})
                }
                await logoutToPersist({variables: {id: userLogged._id}})
              } catch (error) {
                console.log("An unknown error occurred",error);
                dispatch(setServerError(true))
              }
            },
            yes:async() => { 
              setConfirmation(false)
              try {
                if(selectedCustomer._id){
                  await deselectTask({variables: {id:selectedCustomer._id,user_id: userLogged._id}})
                }
                await logoutToPersist({variables: {id: userLogged._id}})
              } catch (error) {
                console.log("An unknown error occurred",error);
                dispatch(setServerError(true))
              }

            },
            message: "You have been force to logout!",
            toggle: "IDLE"
          })
        }
      }
    })
    return ()=> clearTimeout(timer)
  },[error,navigate,dispatch, logoutToPersist, userLogged, deselectTask,selectedCustomer])




  const breaks:Breaks[] = [
    {
      name: 'Production',
      value: BreakEnum.PROD
    },
    {
      name: 'Lunch Break',
      value: BreakEnum.LUNCH
    },
    {
      name: 'Coffee',
      value: BreakEnum.COFFEE
    },
    {
      name: 'Meeting',
      value: BreakEnum.MEETING
    },
    {
      name: 'Technical Support',
      value: BreakEnum.TECHSUPP
    },
    {
      name: 'Cr Break',
      value: BreakEnum.CRBREAK
    },
    {
      name: 'Coaching',
      value: BreakEnum.COACHING
    },
    {
      name: 'HR Meeting',
      value: BreakEnum.HRMEETING
    },
    {
      name: 'Handset Nego',
      value: BreakEnum.HANDSETNEGO
    },
    {
      name: 'Skip tracing',
      value: BreakEnum.SKIPTRACING
    },
    {
      name: 'Clinic',
      value: BreakEnum.CLINIC
    },

  ]

  if(loading || logoutToPEristsLoading) return <Loading/>


  return (
    <>
      {
        serverError &&
        <ServerError/>
      }
      <div className="sticky top-0 z-40 print:hidden">
        <div className="p-2 bg-blue-500 flex justify-between items-center ">
          <div className="flex text-2xl gap-2 font-medium items-center text-white italic">
            <img src="/singlelogo.jpg" alt="Bernales Logo" className="w-10" />
            Bernales & Associates Centralize Collection System
            {/* {
              (userLogged.type === "AGENT") && 
              <IdleAutoLogout/> 
            } */}
           
          </div>
          <div className="p-1 flex gap-2 text-xs z-50">
            <p className="font-medium text-white italic flex items-center">Hello&nbsp;<span className="uppercase">{userLogged.name}</span></p>
            <BsFillPersonVcardFill className="text-4xl cursor-pointer " onClick={()=> {setPopUpUser(!poPupUser); setPopUpBreak(false)}}/>
            { poPupUser &&
              <div className="w-40 h-auto border border-slate-200 shadow-xl shadow-black/8 rounded-xl top-13 end-5 bg-white absolute flex flex-col p-2 text-slate-500 font-medium">
                {
                  accountsNavbar[userLogged.type].map((e,index)=> 
                  <Link key={index} to={e.link} className={`${index === 0 && 'rounded-t-lg'} grow px-2 border-b border-slate-200 flex items-center hover:text-white hover:bg-slate-500 duration-200 ease-in-out cursor-pointer py-2`} onClick={()=> setPopUpUser(false) }>
                    {e.name === "Customer Interaction Panel" ? "CIP" : e.name}
                  </Link>
                  )
                }
                {
                  userLogged.type === "AGENT" &&
                  <div className="grow border-b border-slate-200 flex items-center cursor-pointer relative ">
                    <h1 className="p-2 h-full w-full hover:bg-slate-500 hover:text-white   duration-200 ease-in-out" onClick={()=> setPopUpBreak(!popUpBreak)}>Breaks</h1>
                    {
                      popUpBreak &&
                      <div className="absolute -left-7/6 border-slate-300 border rounded-xl w-auto bg-white h-auto flex flex-col top-0 p-2">
                        {
                          breaks.map((e,index) => 
                            <label className={`p-2 hover:bg-slate-500 hover:text-white duration-200 ease-in-out ${index === 0 ? 'rounded-t-lg' : ""} ${index === (breaks.length - 1) ? "rounded-b-lg" : ""} flex items-center gap-2`} key={index}>
                            
                              <input type="radio" name='break' id={e.value} value={BreakEnum[e.value as keyof typeof BreakEnum]} onChange={(e)=> {
                                if(e.target.checked) {
                                  dispatch(setBreakValue(BreakEnum[e.target.value as keyof typeof BreakEnum]))
                                }
                              }}

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
                <div className="grow px-2 flex items-center justify-between hover:text-white hover:bg-slate-500 duration-200 ease-in-out cursor-pointer rounded-b-lg py-2" onClick={()=> handleSubmit("LOGOUT")}>
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
    </>
  )
}

export default Navbar
