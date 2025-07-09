import {  RootState, useAppDispatch } from "../redux/store"
import { useEffect, useMemo, useRef, useState } from "react"
import {  useNavigate } from "react-router-dom"
import { FaEye, FaEyeSlash  } from "react-icons/fa";
import { gql, useMutation } from "@apollo/client";
import {  setBreakValue, setDeselectCustomer, setMyToken, setServerError, setStart, setUserLogged } from "../redux/slices/authSlice";
import Loading from "./Loading";
import { useSelector } from "react-redux";
import { BreakEnum } from "../middleware/exports";



const LOGIN = gql `
  mutation login($username: String!, $password: String!) { 
    login(username: $username, password: $password) { 
      prodStatus
      start
      token
      user { 
        _id
        change_password
        name
        type
        username
        branch
        departments
        buckets
        account_type
        group
        targets {
          daily
          weekly
          monthly
        }
      }
    }
  }
`;

const LOGOUT = gql`
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

type Targets = {
  daily: number,
  weekly: number,
  monthly: number
}

type User = {
  _id: string
  change_password : boolean
  name: string
  type: string
  username: string
  branch: string
  departments:string[]
  buckets:string[]
  account_type: string
  group: string
  targets: Targets
}

type Login = {
  user: User
  prodStatus: keyof typeof BreakEnum
  start: string
  token: string
}



const Login = () => {
  const {userLogged,selectedCustomer} = useSelector((state:RootState)=> state.auth)
  const navigate = useNavigate() 
  const dispatch = useAppDispatch()

  const userRoutes = useMemo(() => ({
    AGENT: "/agent-dashboard",
    ADMIN: "/admin-dashboard",
    AOM: "/aom-dashboard",
    TL: "/tl-dashboard",
    CEO: "/ceo-dashboard",
    OPERATION: "/operation-dashboard",
    MIS: "/mis-dashboard",
  }), []);

  const [eye, setEye] = useState<boolean>(false)
  const [required, setRequired] = useState<boolean>(false)
  const loginForm = useRef<HTMLFormElement | null>(null)
  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("") 
  const [already, setAlready] = useState<boolean>(false)
  const [lock, setLock] = useState<boolean>(false)
  const [invalid, setInvalid] = useState<boolean>(false)
  
  const [deselectTask] = useMutation(DESELECT_TASK,{
    onCompleted: () => {
      dispatch(setDeselectCustomer())
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

  const [logout] = useMutation(LOGOUT,{
    onCompleted: ()=> {
      dispatch(setUserLogged({
        _id: "",
        change_password: false,
        name: "",
        type: "",
        username: "",
        branch: "",
        departments: [],
        buckets: [],
        account_type: "",
        group: "",
        targets: {
          daily: 0,
          monthly: 0,
          weekly: 0
        }
      }))
    }, 
    onError: ()=> {
      dispatch(setServerError(true))  
    }
  })

  const [login, {loading}] = useMutation<{login:Login}>(LOGIN, {
    onCompleted: (res) => {
      dispatch(setUserLogged(res.login.user))
      dispatch(setMyToken(res.login.token))
      if(!res.login.user.change_password) {
        navigate('/change-password', {state: res.login.user})
      } else {
        if(res.login.user.type === "AGENT") {
          dispatch(setBreakValue(res.login.prodStatus))
          dispatch(setStart(res.login.start))
          const navigateString = res.login.prodStatus === BreakEnum.PROD ? userRoutes[res.login.user.type  as keyof typeof userRoutes] : "/break-view"
          navigate(navigateString)
        } else {
          navigate(userRoutes[res.login.user.type  as keyof typeof userRoutes])
        }
      }
    },
    onError: (error) => {
      const errorMessage = ['Invalid','Already','Lock']
      if(!errorMessage.includes(error.message)) {
        dispatch(setServerError(true))
      } else {
        const message = error.message
        if(message === 'Invalid') {
          setRequired(false)
          setInvalid(true)
          setAlready(false)
          setLock(false)
          setUsername("")
          setPassword("")
        } else if(message === 'Already') {
          setRequired(false)
          setInvalid(false)
          setAlready(true)
          setLock(false)
          setUsername("")
          setPassword("")
        } else if(message === 'Lock') {
          setRequired(false)
          setInvalid(false)
          setAlready(false)
          setLock(true)
          setUsername("")
          setPassword("")
        } else {
          dispatch(setServerError(true))
        }
      }
    }
  })  

  const handleEyeClick =() => {
    setEye(!eye)
  }
  
  const handleSubmitLogin = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if(!loginForm?.current?.checkValidity()){
      setRequired(true)
      setInvalid(false)
      setAlready(false)
      setLock(false)
      return
    }
    await login({ variables: { username, password } })
  }

  useEffect(()=> {
    if(userLogged._id && userLogged.change_password) {
      const userType = userLogged.type as keyof typeof userRoutes;
      if(userRoutes[userType]) navigate(userRoutes[userType])
    }
  },[userLogged,userRoutes,navigate])

  useEffect(()=> {
    if(userLogged?._id && !userLogged.change_password) {
      const timer = setTimeout(async() =>  {
        await logout()
        if(selectedCustomer._id) {
          await deselectTask({variables: {id: selectedCustomer._id}})
        }
      })
      return () => clearTimeout(timer) 
    }
  },[dispatch, userLogged, logout, selectedCustomer,deselectTask])


  if(loading) return <Loading/>

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[url(/login_bg.jpg)] bg-fixed bg-no-repeat bg-cover relative ">
      <div className="w-full h-full absolute bg-blue-500/50 backdrop-blur-[4px]">
      </div>
    
      <form 
        ref={loginForm} 
        onSubmit={handleSubmitLogin}
        className="bg-white/50 backdrop-blur-lg w-96 min-h-96 py-10 rounded-xl z-50 flex items-center justify-center flex-col gap-10 shadow-2xl shadow-black/80" 
        noValidate>
        <div className="flex flex-col gap-5 text-center text-blue-500">
          <h1 className="text-xl font-black italic">Bernales & Associates</h1>
          <h1 className="text-2xl font-medium dark:text-white ">Collection System</h1>
        </div>
        <div className="flex gap-5 w-full flex-col px-10">
          { invalid &&
            <h1 className="text-xs text-center text-red-500 font-medium">Incorrect username or password.</h1>
          }
          { already &&
            <h1 className="text-xs text-center text-red-500 font-medium">Account already logged in.</h1>
          }
          {
            lock &&
            <h1 className="text-xs text-center text-red-500 font-medium">Account has been lock.</h1>
          }
          {
            required &&
            <h1 className="text-xs text-center text-red-500 font-medium">All fields are required</h1>
          }
          <div className="w-full">
            <label>
              <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</span>
              <input 
                type="text" 
                id="username"
                name="username"
                autoComplete="off"
                value={username}
                onChange={(e)=> setUsername(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required />
            </label>
          </div>
          <div className="relative"> 
            <label >
              <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</span>
              <input 
                type={`${eye? "text" : "password"}`}
                id="password" 
                name="password"
                autoComplete="off"
                value={password} 
                onChange={(e)=> setPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                required/>
                {
                  eye ? (
                    <FaEyeSlash className="absolute top-9.5 text-2xl right-4" onClick={handleEyeClick} />
                  ) :
                  (
                    <FaEye  className="absolute top-9.5 text-2xl right-4" onClick={handleEyeClick}/>
                  )
                }
            </label>
          </div>
          <div className="flex justify-center">
          <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-md text-xl px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Login</button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Login