import { useApolloClient, useMutation, useQuery, useSubscription } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useState } from "react"
import { GoDotFill } from "react-icons/go";
import { RxReset } from "react-icons/rx";
import { setServerError } from "../../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import SuccessToast from "../../components/SuccessToast";
import { MdRecordVoiceOver } from "react-icons/md";
import { Link } from "react-router-dom";
import { BsFillUnlockFill, BsFillLockFill, BsFillKeyFill } from "react-icons/bs";
import AuthenticationPass from "../../components/AuthenticationPass";
import { RootState } from "../../redux/store";

const TL_AGENT = gql`
  query findDeptAgents {
    findDeptAgents {
      _id
      name
      user_id
      group
      default_target
      type
      isOnline
      isLock
      buckets {
        name
      }
      departments {
        name
      }
    }
  }
`

interface Bucket {
  name: string
}

interface Department {
  name: string
}

interface TLAgent {
  _id: string
  name: string
  user_id: string
  type: string
  group: string
  default_target: number
  isOnline: boolean
  isLock: boolean
  buckets: Bucket[]
  departments: Department[]
}

const AGENT_PRODUCTION = gql`
  query getAgentProductions {
    getAgentProductions {
      _id
      user
      prod_history {
        type
        existing
        start
      }
      createdAt
      target_today
    }
  }
`

interface ProdHistory {
  type: string
  existing: boolean
  start :string
  target_today: number
}

interface AgentProductions {
  _id: string
  user: string
  createdAt: string
  target_today: number
  prod_history: ProdHistory[]
}

const RESET_TARGET = gql`
  mutation resetTarget($id: ID, $userId: ID) {
    resetTarget(id: $id, userId: $userId) {
      success
      message
    }
  }
`

const UNLOCK_USER = gql`
  mutation unlockUser($id: ID!) {
    unlockUser(id: $id) {
      success
      message
    }
  }
`

const SOMETHING_LOCK = gql`
  subscription SomethingOnAgentAccount {
    somethingOnAgentAccount {
      buckets
      message
    }
  }
`

const AgentView = () => {
  const {userLogged} = useSelector((state:RootState) => state.auth)
  const client = useApolloClient()
  const dispatch = useDispatch()
  const {data:tlAgentData} = useQuery<{findDeptAgents:TLAgent[]}>(TL_AGENT)
  const {data: agentProdData} = useQuery<{getAgentProductions:AgentProductions[]}>(AGENT_PRODUCTION)
  const [agentProduction,setAgentProduction] = useState<TLAgent[]>([])
  const [success, setSuccess] = useState<{success:boolean, message:string}>({
    success: false,
    message: ""
  })

  useSubscription<{somethingOnAgentAccount:{buckets:string[],message: string}}>(SOMETHING_LOCK,{
    onData: ({data}) => {
      if(data) {
        if(data.data?.somethingOnAgentAccount.message === "SOMETHING_ON_AGENT_ACCOUNT" && data.data?.somethingOnAgentAccount.buckets.some(bucket =>  userLogged.buckets.includes(bucket))) {
          client.refetchQueries({
            include: ['findDeptAgents','getAgentProductions']
          })
        }
      }
    }
  })

  useEffect(()=> {
    if(tlAgentData) {
      setAgentProduction(tlAgentData.findDeptAgents)
    }
  },[tlAgentData])

  const [search,setSearch] = useState<string>("")

  useEffect(()=> {
    const filteredData = tlAgentData?.findDeptAgents?.filter(e=> e.user_id.includes(search))
    if(filteredData){
      setAgentProduction(filteredData)
    }
  },[search,tlAgentData])
  
  const [resetTarget] = useMutation<{resetTarget:{success:boolean, message: string}}>(RESET_TARGET,{
    onCompleted: (res) => {
      setIsAuthorize(false)
      setSuccess({
        success: res.resetTarget.success,
        message: res.resetTarget.message
      })
      client.refetchQueries({
        include: ['findDeptAgents','getAgentProductions']
      })
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

  
  const [unlockUser] = useMutation<{unlockUser:{success: boolean,message: string}}>(UNLOCK_USER, {
    onCompleted: (res) => {
      setIsAuthorize(false)
      setSuccess({
        success: res.unlockUser.success,
        message: res.unlockUser.message 
      })
      client.refetchQueries({
        include: ['findDeptAgents','getAgentProductions']
      })
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })


  const [authentication, setAuthentication] = useState({
    yesMessage: "",
    event: () => {},
    no: () => {},
    invalid: ()=> {}
  })

  const [isAuthorize, setIsAuthorize] = useState<boolean>(false)

  enum ButtonType {
    RESET = "RESET",
    UNLOCK = "UNLOCK"
  }

  const eventType:Record<keyof typeof ButtonType, (id:string | null ,userId: string | null)=> Promise<void>> = {
    RESET : async(id, userId) => {
      await resetTarget({variables: {id, userId}})
    },
    UNLOCK : async(_,userId) => {
      await unlockUser({variables: {id:userId}})
    }
  }

  const onClickAction = (id:string | null, userId:string | null,lock: boolean,  eventMethod:keyof typeof ButtonType) => {
    const isTrue = eventMethod === ButtonType.RESET
    const message = isTrue ? "reset" : "unlock"

    if((lock && !isTrue) || isTrue) {
      setIsAuthorize(true)
    } else {
      return
    }
 
    setAuthentication({
      yesMessage: message,
      event: () => { eventType[eventMethod]?.(id,userId)},
      no: ()=> {setIsAuthorize(false)},
      invalid: ()=> {
        setSuccess({
          success: true,
          message: "Password is incorrect"
        })
      }
    })

  }

  return (
    <>
      {
        success?.success &&
        <SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>
      }
      <div className="h-full w-full flex flex-col overflow-hidden p-2">
        <h1 className="p-2 text-xl font-medium text-gray-500">Agent Production</h1>
        <div className="flex justify-center">
          <input 
            type="search" 
            name="search" 
            id="search" 
            value={search}
            onChange={(e)=> setSearch(e.target.value)}
            className="border px-2 rounded-md text-gray-500 py-1.5 w-1/5 text-sm"
            placeholder="Enter Agent ID here..." 
            autoComplete="off"/>
        </div>
        <div className="h-full overflow-hidden m-5">
          <div className="grid grid-cols-9 font-medium text-slate-500 bg-slate-100">
            <div className="px-2 py-1">Name</div>
            <div className="px-2 py-1 truncate">Agent ID</div>
            <div className="px-2 py-1 truncate">Bucket</div>
            <div className="px-2 py-1 truncate">Campaign</div>
            <div className="px-2 py-1 truncate">Online</div>
            <div className="px-2 py-1 truncate">Lock</div>
            <div className="px-2 py-1 truncate">Status</div>
            <div className="px-2 py-1 truncate">Target</div>
            <div className="px-2 py-1 truncate">Action</div>
          </div>
          <div className="h-full overflow-y-auto">
            {
              agentProduction.map((e) => {
                const findAgentProd = agentProdData?.getAgentProductions.find(y=> y.user === e._id)
                const findExsitingStatus = findAgentProd?.prod_history.find(x=> x.existing === true)
                 
                return e.type === "AGENT" && (
                  
                  <div key={e._id} className="px-2 py-1 grid grid-cols-9 text-sm text-gray-500 font-normal even:bg-slate-50 hover:bg-blue-50">
                    <div className="flex items-center capitalize truncate">{e.name}</div>
                    <div className="flex items-center">{e.user_id}</div>
                    <div className="flex items-center truncate">{e.buckets.map(e=> e.name).join(', ')}</div>
                    <div className="flex items-center truncate">{e.departments.map(e=> e.name).join(', ')}</div>
                    <div className=" flex items-center"> 
                      <GoDotFill className={`${e.isOnline ? "text-green-400" : "text-slate-600"} text-2xl`} />
                    </div>
                    <div className=" flex items-center"> 
                      {
                        e.isLock ?
                        <BsFillLockFill  className="text-red-600 text-xl" /> :
                        <BsFillUnlockFill className="text-slate-600 text-xl" /> 
                      }
                    </div>
                    <div className="flex items-center"> 
                      {findExsitingStatus ? findExsitingStatus?.type : "-"}
                    </div>
                    <div> 
                      {findAgentProd ? (findAgentProd?.target_today).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) : e.default_target.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}
                    </div>
                    <div className="pl-2 flex gap-5">
                      <div className="relative">
                        <button className="bg-blue-500 rounded-full py-1 px-1 text-white hover:scale-110 duration-100 ease-in-out cursor-pointer peer"
                        onClick={()=> onClickAction(null, e._id,e.isLock, ButtonType.UNLOCK)}
                        ><BsFillKeyFill  /></button>
                        <div className="absolute text-nowrap px-1 bg-white z-50 left-full top-0 ml-2 peer-hover:block hidden border">Unlock Agent</div>
                      </div>

                      <div className="relative">
                        <button className="bg-orange-500 rounded-full py-1 px-1 text-white hover:scale-110 duration-100 ease-in-out cursor-pointer peer"
                        onClick={()=> onClickAction(findAgentProd?._id || null, e._id, e.isLock, ButtonType.RESET)}
                        ><RxReset /></button>
                        <div className="absolute text-nowrap px-1 bg-white z-50 left-full top-0 ml-2 peer-hover:block hidden border">Reset Target</div>
                      </div>

                   

                      <Link to="/agent-recordings" state={e._id} className="relative">
                        <button className="bg-green-500 w-auto rounded-full py-1 px-1 text-white hover:scale-110 duration-100 ease-in-out cursor-pointer peer"
                        ><MdRecordVoiceOver /></button>
                        <div className="absolute text-nowrap bg-white z-50 left-full top-0 ml-2 peer-hover:block hidden border px-1">Recordings</div>
                      </Link>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
      {
        isAuthorize &&
        <AuthenticationPass {...authentication}/>
      }
    </>
  )
}

export default AgentView