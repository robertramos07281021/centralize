import { gql, useMutation, useQuery } from "@apollo/client"
import { BsFillPersonVcardFill } from "react-icons/bs";
import { IoMdLogOut } from "react-icons/io";
import { useEffect, useState } from "react";
import Confirmation from "./Confirmation";
import Loading from "../pages/Loading";
import { useNavigate } from "react-router-dom";
import { RootState, useAppDispatch } from "../redux/store";
import { setNeedLogin, setPage, setSelectedCustomer, setSelectedDispoReport, setSelectedDisposition, setTasker, setTaskFilter, setUserLogged } from "../redux/slices/authSlice";
import NavbarExtn from "./NavbarExtn";
import { useSelector } from "react-redux";
import IdleAutoLogout from "./IdleAutoLogout";

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


const Navbar = () => {
  const navigate = useNavigate()
  const {userLogged,selectedCustomer} = useSelector((state:RootState)=> state.auth)
  const dispatch = useAppDispatch()
  const {error} = useQuery<{ getMe: UserInfo }>(myUserInfos,{pollInterval: 10000})
  const [poPupUser, setPopUpUser] = useState<boolean>(false) 
  const [deselectTask] = useMutation(DESELECT_TASK,{
    onCompleted: ()=> {
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
  
  


  const [logout, {loading}] = useMutation(LOGOUT,{
    onCompleted: async() => {
      dispatch(setNeedLogin(true))
      dispatch(setUserLogged(
        {
          _id: "",
          change_password: false,
          name: "",
          type: "",
          username: "",
          branch: "",
          departments: [],
          buckets: []
        }
      ))
      dispatch(setPage(1))
      dispatch(setTasker('group'))
      dispatch(setTaskFilter('assigned'))
      dispatch(setSelectedDisposition([]))
      dispatch(setSelectedDispoReport([]))
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
      navigate('/')

    },
  })
  const [confirmation, setConfirmation] = useState<boolean>(false)

  const confirmationFunction: Record<string, () => Promise<void>> = {
    LOGOUT: async () => {
      try {
        await logout();
        if(selectedCustomer._id) {
          await deselectTask({variables: {id:selectedCustomer._id}})
        }
      } catch (error) {
        console.log(error)
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
      dispatch(setNeedLogin(true))
      dispatch(setUserLogged({
        _id: "",
        change_password: false,
        name: "",
        type: "",
        username: "",
        branch: "",
        departments: [],
        buckets: []
      }))
      dispatch(setNeedLogin(true))
      dispatch(setUserLogged(
        {
          _id: "",
          change_password: false,
          name: "",
          type: "",
          username: "",
          branch: "",
          departments: [],
          buckets: []
        }
      ))
      dispatch(setPage(1))
      dispatch(setTasker('group'))
      dispatch(setTaskFilter('assigned'))
      dispatch(setSelectedDisposition([]))
      dispatch(setSelectedDispoReport([]))
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
      navigate("/")
    }
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
                console.log(error)
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
                console.log(error)
              }

            },
            message: "You idle for 5 minutes!",
            toggle: "IDLE"
          })
        }
      }
    })
    return ()=> clearTimeout(timer)
  },[error,navigate,dispatch, logoutToPersist, userLogged, deselectTask,selectedCustomer])


  if(loading || logoutToPEristsLoading) return <Loading/>

  return (
    
    <div className="sticky top-0 z-40 print:hidden">

      <div className="p-2 bg-blue-500 flex justify-between items-center ">
        <div className="flex text-2xl gap-2 font-medium items-center text-white italic">
          <img src="/singlelogo.jpg" alt="Bernales Logo" className="w-10" />
          Bernales & Associates
          {
            (userLogged.type === "AGENT") && 
        
            <IdleAutoLogout/> 
           
          }
        </div>
        <div className="p-1 flex gap-2 text-xs z-50">
          <p className="font-medium text-white italic flex items-center">Hello&nbsp;<span className="uppercase">{userLogged.name}</span></p>
          <BsFillPersonVcardFill className="text-4xl cursor-pointer " onClick={()=> setPopUpUser(!poPupUser)}/>
          { poPupUser &&
            <div className="w-40 h-40 border border-slate-200 shadow-xl shadow-black/8 rounded-xl top-13 end-5 bg-white absolute flex flex-col p-2 text-slate-500 font-medium">
              <div className="grow px-2 border-b border-slate-200 flex items-center hover:text-white hover:bg-slate-500 duration-200 ease-in-out cursor-pointer rounded-t-lg ">
                {userLogged.name.toLocaleUpperCase()}
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
