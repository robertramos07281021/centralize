import { gql, useMutation, useQuery } from "@apollo/client"
import { UserInfo } from "../middleware/types"

import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { FaEye, FaEyeSlash  } from "react-icons/fa";
import { RootState, useAppDispatch } from "../redux/store";
import { useEffect, useRef, useState } from "react";
import Loading from "./Loading";
import { setNeedLogin, setError, setUserLogged } from "../redux/slices/authSlice";
import { useSelector } from "react-redux";

 const UPDATEPASSWORD = gql `
  mutation changePassword($password: String!, $confirmPassword:String!) {
    updatePassword(password: $password, confirmPass: $confirmPassword) {
      branch 
      username 
      type 
      name 
      department 
      id 
      change_password 
    }
  }
`;


const myUserInfos = gql` 
  query GetMe { 
    getMe {
      id
      name
      username
      type
      department
      branch
      change_password
    }
  } 
`
const LOGOUT = gql`
  mutation logout { 
    logout { 
      message 
      success 
    } 
  }
`;


const ChangePassword = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const {data,loading, refetch} = useQuery<{ getMe: UserInfo }>(myUserInfos)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const changePassForm = useRef<HTMLFormElement | null>(null)
  const [eye, setEye] = useState<boolean>(false)
  const [eyeConfirm, setEyeConfirm] = useState<boolean>(false)
  const [required, setRequired] = useState<boolean>(false)
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [notMatch, setNotMatch] = useState<boolean>(false)

  const [logout] = useMutation(LOGOUT,{
    onCompleted: ()=> {
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
    }
  })

  const [changePassword, {loading:changePassLoading}] = useMutation<{updatePassword: UserInfo}>(UPDATEPASSWORD, {
      onCompleted: async(res) => {
      refetch();
      navigate("/")
      dispatch(setNeedLogin(res.updatePassword.change_password))
      try {
        await logout()
      } catch (error) {
        console.log(error)
      }
    },
  })


  useEffect(()=> {
    refetch()
  },[navigate, refetch, data])

  const submitForm = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if(!changePassForm?.current?.checkValidity()) {
      setRequired(true)
      setNotMatch(false)
    } else if(confirmPassword !== password && changePassForm?.current?.checkValidity() ) {
      setNotMatch(true)
      setRequired(false)
    } else {
      try {
        await changePassword({variables: { password, confirmPassword}})
      } catch (error) {
        if (error instanceof Error) {
          if(error?.message === "Invalid") {
            setRequired(true)
            setPassword("")
            setConfirmPassword("")
          }
        } else {
          console.log("An unknown error occurred", error);
          dispatch(setError(true))
        }
      }
    }
  }

  const userRoutes = {
    AGENT: "/agent-dashboard",
    ADMIN: "/admin-dashboard",
    AOM: "/aom-dashboard",
    TL: "/tl-dashboard",
    CEO: "/ceo-dashboard",
    OPERATION: "/operation-dashboard",
    MIS: "/mis-dashboard"
  }
  const userType = userLogged.type as keyof typeof userRoutes ?? "ADMIN";
  const navigator = location.state !== null ? userRoutes[userType] : "/"

 if(loading || changePassLoading) return (
    <Loading/>
  )

  return (!userLogged.change_password && userLogged._id) ? (
    <div className="h-screen w-screen flex flex-col">
      <div>
        <img src="/bernalesLogo.png" alt="Bernales Logo" className="w-56" />
      </div>
      <div className="flex items-center justify-center h-full bg-[url(/BGBernLogo.jpg)] bg-fixed bg-no-repeat bg-cover">
        <div className="w-96 min-h-96 py-10 border bg-white/85 border-slate-100 rounded shadow-xl shadow-black/50 flex items-center justify-center flex-col gap-10 px-10">
          <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
          { required &&
            <h1 className="text-xs text-red-500 font-medium">All fields are required.</h1>
          }
          { notMatch &&
            <h1 className="text-xs text-red-500 font-medium">Confirm password not match.</h1>
          }
          <form 
            ref={changePassForm} 
            className="flex flex-col w-full gap-5"
            onSubmit={submitForm}
            noValidate
          >
            <label className="relative w-full">
              <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New Password</span>
              <input 
                type={`${eye? "text" : "password"}`} 
                name="password" 
                id="password" 
                value={password}
                required
                onChange={(e)=> setPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
              {
                eye ? (
                  <FaEyeSlash className="absolute top-9.5 text-2xl right-4" onClick={() => setEye(!eye)} />
                ) :
                (
                  <FaEye  className="absolute top-9.5 text-2xl right-4" onClick={() => setEye(!eye)}/>
                )
              }
            </label>
            <label className="relative w-full">
              <span className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm Password</span>
              <input 
                type={`${eyeConfirm? "text" : "password"}`} 
                name="confirm_password" 
                id="confirm_password" 
                value={confirmPassword}
                required
                onChange={(e)=> setConfirmPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
              {
                eyeConfirm ? (
                  <FaEyeSlash className="absolute top-9.5 text-2xl right-4" onClick={() => setEyeConfirm(!eyeConfirm)} />
                ) :
                (
                  <FaEye  className="absolute top-9.5 text-2xl right-4" onClick={() => setEyeConfirm(!eyeConfirm)}/>
                )
              }
            </label>
            <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xl px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Change Password</button>
          </form>
        </div>
      </div>

    </div>
  ) : (
    <Navigate to={navigator}/>
  )
}

export default ChangePassword