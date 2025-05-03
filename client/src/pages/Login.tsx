import {  RootState, useAppDispatch } from "../redux/store"
import { useEffect, useMemo, useRef, useState } from "react"
import {  useNavigate } from "react-router-dom"
import { FaEye, FaEyeSlash  } from "react-icons/fa";
import { gql, useMutation } from "@apollo/client";
import {  setError, setSelectedCustomer, setUserLogged } from "../redux/slices/authSlice";
import Loading from "./Loading";
import { useSelector } from "react-redux";

const LOGIN = gql `
  mutation login($username: String!, $password: String!) { 
    login(username: $username, password: $password) { 
      message success user { 
        _id
        name
        username
        type
        department
        branch
        change_password
        buckets
        isOnline
        active
        createdAt
        user_id
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

  const [deselectTask] = useMutation(DESELECT_TASK,{
    onCompleted: () => {
      dispatch(setSelectedCustomer({
        _id: "",
        case_id: "",
        account_id: "",
        endorsement_date: "",
        credit_customer_id: "",
        bill_due_day: 0,
        max_dpd: 0,
        balance: 0,
        paid_amount: 0,
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
        department: "",
        bucket: ""
      }))
    }
  })

  const [login, {loading}] = useMutation(LOGIN, {
    onCompleted: (res) => {
      dispatch(setUserLogged(res.login.user))
      if(!res.login.user.change_password) {
        navigate('/change-password', {state: res.login.user})
      } else {
        navigate(userRoutes[res.login.user.type  as keyof typeof userRoutes])
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
      return
    }
    try {
      await login({ variables: { username, password } })
    } catch (error) {
      if (error instanceof Error) {
        if(error?.message === "Invalid") {
          setRequired(true)
          setUsername("")
          setPassword("")
        }
      } else {        
        console.log("An unknown error occurred",error);
        dispatch(setError(true))

      }
    }
  }

  useEffect(()=> {
    if(userLogged._id && userLogged.change_password) {
      const userType = userLogged.type as keyof typeof userRoutes;
      if(userRoutes[userType]) navigate(userRoutes[userType])
    }
  },[userLogged,userRoutes,navigate])

  useEffect(()=> {
      const timer = setTimeout(async() =>  {
        if(userLogged?._id && !userLogged.change_password)
        try {
          await logout()
          if(selectedCustomer._id) {
            await deselectTask({variables: {id: selectedCustomer._id}})
          }
          
        } catch (error) {
          console.log(error)
          dispatch(setError(true))
        }
      })
      return () => clearTimeout(timer) 
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
          <h1 className="text-2xl font-medium dark:text-white ">Centralize Collection System</h1>
        </div>
        <div className="flex gap-5 w-full flex-col px-10">
          { required &&
            <h1 className="text-xs text-center text-red-500 font-medium">Incorrect username or password</h1>
          }
          <div className="w-full">
            <label>
              <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</span>
              <input 
                type="text" 
                id="username"
                name="username"
                autoComplete="username"
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