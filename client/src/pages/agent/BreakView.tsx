import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../../redux/store"
import { accountsNavbar, BreakEnum, breaks } from "../../middleware/exports"
import { Navigate, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { increamentBreakTimer, setBreakTimer, setBreakValue, setServerError, setStart } from "../../redux/slices/authSlice"
import gql from "graphql-tag"
import { useMutation } from "@apollo/client"
import AgentTimer from "../../components/AgentTimer"
import { FaEye, FaEyeSlash  } from "react-icons/fa";


interface UpdateProduction {
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

const LOGIN_PRODUCTION = gql`
  mutation loginToProd($password: String) {
    loginToProd(password: $password) {
      message
      success
    }
  }
`
interface LoginProd {
  message: string
  success: boolean
}



const BreakView = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const {breakValue,userLogged,breakTimer,start} = useSelector((state:RootState)=> state.auth)
  
  const [updateProduction] = useMutation<{updateProduction:UpdateProduction}>(UPDATE_PRODUCTION,{
    onCompleted: (res) => {
      dispatch(setBreakValue(BreakEnum.PROD))
      navigate('/agent-dashboard')
      dispatch(setStart(res.updateProduction.start))
    }
  })

  const [password, setPassword] = useState<string>('')

  const [loginToProd] = useMutation<{loginToProd:LoginProd}>(LOGIN_PRODUCTION,{
    onCompleted: async()=> {
      dispatch(setBreakValue(BreakEnum.PROD))
      try {
        await updateProduction({variables: {type: BreakEnum.PROD}})
      } catch (error) {
        dispatch(setServerError(true))
      }
    }
  })
  
  const OnSubmit = async() => {
    if(password) {
      try {
        await loginToProd({variables: {password: password}})
      } catch (error) {
        dispatch(setServerError(true))
      }
    } else {

    }
  }


  const [eye, setEye] = useState<boolean>(false)

  useEffect(()=> {
    if(start.length > 0) {
      const startTime = Math.floor(new Date(start).getTime() / 1000)
      const existingTime = Math.floor(new Date().getTime() /1000)
      
      const setBreak = existingTime - startTime  
      dispatch(setBreakTimer(setBreak))
    } else {
      dispatch(setBreakTimer(0))
    }
  },[start]) 

  const content = breaks.find(e=> e.value === breakValue)
 
  const images:{[key:string]: string} = {
    LUNCH :"/lunchIcon.png",
    COFFEE : "/coffeeIcon.png",
    MEETING : "/meetingIcon.png", 
    TECHSUPP : "/techSuppIcon.png",
    CRBREAK : "/crBreakIcon.png",
    COACHING : "/coachingIcon.png",
    HRMEETING : "/hrMeetingIcon.png",
    HANDSETNEGO : "/handsetNegoIcon.png",
    SKIPTRACING : "skipTracingIcon.png",
    CLINIC : "/clinicIcon.png",
    WELCOME : "/welcomeIcon.png"
  }

  useEffect(()=> {
    const timer = setInterval(() => {
      dispatch(increamentBreakTimer()) 
    }, 1000);
    return () => clearInterval(timer)
  },[dispatch])
  
  if(breakValue === BreakEnum.PROD || userLogged.type !== "AGENT") {
    return <Navigate to={accountsNavbar[userLogged.type][0].link}/>
  }

  const onClickStart = async() => {
    try {
      await updateProduction({variables: {type: BreakEnum.PROD}})
    } catch (error) {
      dispatch(setServerError(true))
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
      return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-5">
      <div>
        <AgentTimer/>
      </div>
      <div className="flex h-full w-full flex-col items-center justify-center">

        {
          breakValue !== BreakEnum.WELCOME &&
          <> 
            <img src={images[breakValue]} alt={`${content?.name} icon`} className="w-80 animate-[bounce_20s_ease-in-out_infinite]" />
            <h1 className="text-2xl font-bold text-gray-500 ">{formatTime(breakTimer)}</h1>
            <h1 className="text-5xl font-bold text-gray-600 text-shadow-sm text-shadow-black">{content?.name}</h1>
            <div className="border-2 mt-10 flex items-center rounded-md border-slate-500">
              <input type={`${eye ? 'text': "password"}`} name="password" id="password" className="text-sm py-1 outline-0 px-2 w-65" placeholder="Enter your password" onChange={(e)=> setPassword(e.target.value)}/>
              {
                eye ? (
                  <div className="px-2" onClick={()=> setEye(false)}>
                    <FaEyeSlash className=" top-9.5 text-xl"  />
                  </div>
                ) :
                (
                  <div className="px-2" onClick={()=> setEye(true)}>
                      <FaEye  className=" top-9.5 text-xl " />
                  </div>
                )
              }
            </div>
            <button onClick={OnSubmit} className="py-2 mt-5 bg-blue-700 rounded px-10 text-white font-bold active:ring-8 hover:scale-110 ring-blue-200">Login</button>
          </>
        }
        {
          breakValue === BreakEnum.WELCOME &&
          <div className="flex flex-col gap-20 items-center">
            <div className="text-center text-shadow-2xs text-shadow-black">
              <h1 className="text-5xl font-medium text-blue-700">Shine bright today,</h1>
              <h1 className="capitalize text-5xl font-bold text-blue-700">{userLogged.name}!</h1>
              <h1 className="text-2xl font-medium text-blue-500">Let's hit those goals!</h1>
            </div>
            <div className=" flex flex-col items-center">
              <img src={images[breakValue]} alt="Welcome Icon" className="w-80 animate-[bounce_20s_ease-in-out_infinite]" />
            
              <button className="border px-10 py-2 rounded-xl bg-blue-700 text-white font-bold hover:scale-115 duration-300 ease-in-out cursor-pointer" onClick={onClickStart}>Start</button>

            </div>
          </div>
        }
      </div>

    </div>
  )
}

export default BreakView
