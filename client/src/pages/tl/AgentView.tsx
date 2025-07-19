import { useApolloClient, useMutation, useQuery, useSubscription } from "@apollo/client"
import gql from "graphql-tag"
import { useCallback, useEffect, useState } from "react"
import { GoDotFill } from "react-icons/go";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { MdRecordVoiceOver } from "react-icons/md";
import { Link } from "react-router-dom";
import { BsFillUnlockFill, BsFillLockFill, BsFillKeyFill } from "react-icons/bs";
import AuthenticationPass from "../../components/AuthenticationPass";
import { RootState } from "../../redux/store";
import { LuSettings } from "react-icons/lu";
import SetTargetsModal from "./SetTargetsModal";
import SetBucketTargetsModal from "./SetBucketTargetsModal";

const TL_AGENT = gql`
  query findDeptAgents {
    findDeptAgents {
      _id
      name
      user_id
      type
      isOnline
      isLock
      attempt_login
      buckets {
        name
      }
      departments {
        name
      }
      targets {
        daily
        weekly
        monthly
      }
    }
  }
`

type Bucket = {
  name: string
}

type Department = {
  name: string
}

type Target = {
  daily: number
  weekly: number
  monthly: number
}


type TLAgent = {
  _id: string
  name: string
  user_id: string
  type: string
  isOnline: boolean
  isLock: boolean
  attempt_login: number
  buckets: Bucket[]
  departments: Department[]
  targets?: Target
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
    }
  }
`

type ProdHistory = {
  type: string
  existing: boolean
  start :string
}

type AgentProductions = {
  _id: string
  user: string
  createdAt: string
  prod_history: ProdHistory[]
}

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
  const {data:tlAgentData, refetch} = useQuery<{findDeptAgents:TLAgent[]}>(TL_AGENT)

  const {data: agentProdData, refetch:agentProdDataRefetch} = useQuery<{getAgentProductions:AgentProductions[]}>(AGENT_PRODUCTION)
  const [agentProduction,setAgentProduction] = useState<TLAgent[]>([])
  
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
    const filteredData = tlAgentData?.findDeptAgents?.filter(e=> e.user_id.includes(search) || e.name.toLowerCase().includes(search.toLowerCase()) || e.buckets.some(bucket => bucket.name.toLowerCase().includes(search.toLowerCase())) || e.departments.some(dept => dept.name.toLowerCase().includes(search.toLowerCase())) )
    if(filteredData){
      setAgentProduction(filteredData)
    }
  },[search,tlAgentData])
  
  const [unlockUser] = useMutation<{unlockUser:{success: boolean,message: string}}>(UNLOCK_USER, {
    onCompleted: (res) => {
      setIsAuthorize(false)
      dispatch(setSuccess({
        success: res.unlockUser.success,
        message: res.unlockUser.message 
      }))
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
    no: () => {}
  })

  const [isAuthorize, setIsAuthorize] = useState<boolean>(false)

  enum ButtonType {
    SET = "SET",
    UNLOCK = "UNLOCK",
    SET_TARGETS = "SET_TARGETS"
  }

  const [userToUpdateTargets, setUserToUpdateTargets] = useState<string | null>(null)
  const [updateSetTargets, setUpdateSetTarget] = useState<boolean>(false)
  const [bucketTargetModal, setBucketTargetModal] = useState<boolean>(false) 

  const unlockingUser = useCallback(async(userId: string | null)=> {
    await unlockUser({variables: {id:userId}})
  },[unlockUser])

  const eventType:Record<keyof typeof ButtonType, (userId: string | null)=> Promise<void>> = {
    SET : async(userId) => {
      setUserToUpdateTargets(userId)
      setUpdateSetTarget(true)
      setIsAuthorize(false)
    },
    UNLOCK : unlockingUser,
    SET_TARGETS : async() => {
      setBucketTargetModal(true)
      setIsAuthorize(false)
    }
  }

  const onClickAction = (userId:string | null,lock: boolean,  eventMethod:keyof typeof ButtonType, attempt: number) => {
    const message = eventMethod.toLowerCase()
    if((lock && eventMethod === ButtonType.UNLOCK && attempt === 0) || eventMethod === ButtonType.SET || eventMethod === ButtonType.SET_TARGETS) {
      setIsAuthorize(true)
      setAuthentication({
        yesMessage: message,
        event: () => { eventType[eventMethod]?.(userId)},
        no: ()=> {setIsAuthorize(false)}
      })
    } 
  }

  return (
    <>
      {
        updateSetTargets &&
        <SetTargetsModal agentToUpdate={userToUpdateTargets || null} cancel={()=> {setUpdateSetTarget(false); setUserToUpdateTargets(null)}} success={(message, success)=> {
          dispatch(setSuccess({
            success,
            message
          }))
          refetch()
          agentProdDataRefetch()
          setUserToUpdateTargets(null)
          setUpdateSetTarget(false)
        }}/>
      }
      {
        bucketTargetModal && 
        <SetBucketTargetsModal cancel={()=> setBucketTargetModal(false)} refetch={()=> {setBucketTargetModal(false); refetch(); agentProdDataRefetch()}}/>
      }
      <div className="h-full w-full flex flex-col overflow-hidden p-2">
        <h1 className="p-2 text-xl font-medium text-gray-500">Agent Production</h1>
        <div className="flex justify-center gap-20 relative">
          <input 
            type="search" 
            name="search" 
            id="search" 
            value={search}
            onChange={(e)=> setSearch(e.target.value)}
            className="border px-2 rounded-md text-gray-500 py-1.5 w-1/5 text-sm"
            placeholder="Enter Agent ID here..." 
            autoComplete="off"/>
          <button className="right-5 absolute px-5 py-2 text-sm bg-orange-500 rounded-md text-white border hover:bg-orange-600" onClick={()=> onClickAction( null, false, ButtonType.SET_TARGETS, 0)}>Set Targets</button>
        </div>

        <div className="h-full overflow-hidden m-5 lg:text-xs 2xl:text-sm">
          <div className="grid grid-cols-10 font-medium text-slate-500 bg-slate-100 ">
            <div className="px-2 py-1 flex items-center">Name</div>
            <div className="py-1 truncate flex items-center">Agent ID</div>
            <div className="py-1 truncate flex items-center">Bucket</div>
            <div className="py-1 truncate flex items-center">Campaign</div>
            <div className="py-1 truncate flex items-center">Online</div>
            <div className="py-1 truncate flex items-center">Lock</div>
            <div className="py-1 truncate flex items-center">Status</div>
            <div className="py-1 col-span-2 flex flex-col">
              <div className="text-center">Targets</div>
              <div className="grid grid-cols-3 text-[0.8em]">
                <div>Daily</div>
                <div>Weekly</div>
                <div>Montly</div>
              </div>
            </div>
            <div className="py-1 truncate flex items-center">Action</div>
          </div>
          <div className="h-full overflow-y-auto">
            {
              agentProduction.map((e) => {
                const findAgentProd = agentProdData?.getAgentProductions.find(y=> y.user === e._id)
                const findExsitingStatus = findAgentProd?.prod_history.find(x=> x.existing === true)
                return e.type === "AGENT" && (
                  <div key={e._id} className="px-2 py-1 grid grid-cols-10 lg:text-xs 2xl:text-sm text-gray-500 font-normal even:bg-slate-50 hover:bg-blue-50 last:pb-4">
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
                    <div className="flex items-center "> 
                      { findExsitingStatus ? findExsitingStatus?.type : "-" }
                    </div>
                    <div className="col-span-2 "> 
                      <div className="w-full grid grid-cols-3">
                        <div>
                          {e.targets?.daily.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}
                        </div>
                        <div>
                          {e.targets?.weekly.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}
                        </div>
                        <div>
                          {e.targets?.monthly.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}
                        </div>

                      </div>
                    </div>
                    <div className="pl-2 flex gap-5">
                      <div className="relative">
                        <button className="bg-blue-500 rounded-full py-1 px-1 text-white hover:scale-110 duration-100 ease-in-out cursor-pointer peer"
                        onClick={()=> onClickAction(e._id,e.isLock, ButtonType.UNLOCK, e.attempt_login)}
                        ><BsFillKeyFill  /></button>
                        <div className="absolute text-nowrap px-1 bg-white z-50 left-full top-0 ml-2 peer-hover:block hidden border">Unlock Agent</div>
                      </div>

                      <div className="relative">
                        <button className="bg-orange-500 rounded-full py-1 px-1 text-white hover:scale-110 duration-100 ease-in-out cursor-pointer peer"
                        onClick={()=> onClickAction( e._id, e.isLock, ButtonType.SET, e.attempt_login)}
                        ><LuSettings /></button>
                        <div className="absolute text-nowrap px-1 bg-white z-50 left-full top-0 ml-2 peer-hover:block hidden border">Set Targets</div>
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