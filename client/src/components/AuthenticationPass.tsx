import { useState } from "react"
import { FaEye, FaEyeSlash  } from "react-icons/fa";
import { CgDanger } from "react-icons/cg";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { useAppDispatch } from "../redux/store";
import { setServerError, setSuccess } from "../redux/slices/authSlice";

type modalComponents = {
  yesMessage: string;
  no: ()=> void;
  event: () => void;
}

const AUTHORIZATION = gql`
  mutation authorization($password: String!) {
    authorization(password: $password) {
      success
      message
    }
  }
`

const AuthenticationPass:React.FC<modalComponents> = ({yesMessage, event, no}) => {
  const [eye,setEye] = useState<boolean>(false)
  const handleEyeClick = () => {
    setEye(!eye)
  }
  const dispatch = useAppDispatch()
  const [password, setPassword] = useState<string>("")

  const [authorization] = useMutation(AUTHORIZATION,{
    onCompleted: ()=> {
      event()
    },
    onError: (data)=> {
      if(data.message === "Invalid") {
        dispatch(setSuccess({
          success: true,
          message: "Password is incorrect",
          isMessage: false
        }))
        no()
      } else {
        dispatch(setServerError(true))
      }
    }
  })

  const handleAuthSubmit = async() => {
    await authorization({variables: {password}})
  }

  return (
    <div className="absolute z-50 h-full w-full top-0 bg-white/10 backdrop-blur-[1.5px] flex items-center justify-center">
      <div className="w-3/8 h-4/9 xl:w-2/8  xl:h-3/9 border rounded border-slate-300 bg-white flex items-center justify-center flex-col gap-7 shadow-md shadow-black/60">
        <CgDanger className="text-red-500 text-5xl mb-4" />
        <h1 className="lg:text-sm 2xl:text-lg font-medium text-gray-500"> Enter your password for confirmation!</h1>
        <label className="flex items-center gap-2 border border-slate-500 rounded-md px-2 py-1 w-6/10">
          <input 
            type={eye ? "text" : "password"} 
            name="password" 
            id="password" 
            autoComplete="off"
            value={password}
            className="outline-none text-sm w-full"
            onChange={(e)=> setPassword(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await authorization({ variables: { password } });
              }
            }}
          />
          {
            eye ? (
              <FaEyeSlash className=" text-2xl right-4" onClick={handleEyeClick} />
            ) :
            (
              <FaEye  className=" text-2xl right-4" onClick={handleEyeClick}/>
            )
          }
        </label>

        <div className="flex gap-5 lg:text-xs 2xl:text-sm">
          <button className="border py-2 px-5 bg-red-500 rounded text-white hover:bg-red-700"   
          onClick={handleAuthSubmit}>
            Yes, I want to {yesMessage}
          </button>

          <button className="border py-1 px-5 bg-gray-500 rounded text-white hover:bg-gray-700" onClick={no}>
            No, Thanks
          </button>

        </div>
      </div>
    </div>
  )
}

export default AuthenticationPass