import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useMemo } from "react"
import { IoMdArrowDown,IoMdArrowUp  } from "react-icons/io";
import { HiOutlineMinusSm } from "react-icons/hi";
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";

type AgentDailies = {
  user: string
  count: number
  ptp: number
  pk: number
  ac: number
  rpc: number
  y_ptp: number
  y_pk: number
  y_ac: number
}

const AGENT_DAILY_PROD = gql`
  query AgentDispoDaily {
    agentDispoDaily {
      user
      count
      ptp
      pk
      ac
      rpc
      y_ptp
      y_pk
      y_ac
    }
  }
`

type Agent = {
  _id: string
  name: string
  user_id: string
  buckets: string[]
  type: string
}

const GET_DEPARTMENT_AGENT = gql`
  query findAgents {
    findAgents {
      _id
      name
      user_id
      buckets
      type
    }
  }
`

type Bucket = {
  id:string
  name: string
}

const TL_BUCKET = gql`
  query GetDeptBucket {
    getDeptBucket {
      id
      name
    }
  }
`


const TLAgentProduction = () => {
  const {data:agentDailyProd, error:addError} = useQuery<{agentDispoDaily:AgentDailies[]}>(AGENT_DAILY_PROD)
  const dispatch = useAppDispatch()
  const {data:agentBucketData, error:abdError} = useQuery<{findAgents:Agent[]}>(GET_DEPARTMENT_AGENT)

  const {data:tlBucketData, error:tlbdError} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET)

  console.log(agentDailyProd)

  useEffect(()=> {
    if(addError || abdError || tlbdError) {
      dispatch(setServerError(true))
    }
  },[addError,abdError,tlbdError])

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const tlBuckets = tlBucketData?.getDeptBucket || []
    return Object.fromEntries(tlBuckets.map(e=> [e.id, e.name]))
  },[tlBucketData])

  return (
    <div className='col-span-3 border border-slate-400 bg-white rounded-xl overflow-auto p-2'>
      <div className='flex flex-col lg:h-115 2xl:h-130 overflow-auto relative'>
        <div className='sticky top-0 bg-white font-bold text-base text-slate-700'>Agent Production <span className="text-sm font-medium">(Daily)</span></div>
        <div className='sticky top-6 grid grid-cols-11 bg-white text-sm font-medium text-slate-600'>
          <div className='col-span-2'>Name</div>
          <div >Bucket</div>
          <div>ID</div>
          <div>RPC</div>
          <div>Dispo</div>
          <div>PTP</div>
          <div>PK</div>
          <div>AC</div>
          <div className="col-span-2 text-end pr-2">Production</div>
        </div>
        {
          agentBucketData?.findAgents.map((agent) => {
            const getDailyProd = agentDailyProd?.agentDispoDaily.find(e=> e.user === agent._id)
            const sumOfDaily = getDailyProd && (getDailyProd?.ac + getDailyProd?.pk + getDailyProd?.ptp)
            const sumOfYesterday = getDailyProd && (getDailyProd.y_ac + getDailyProd.y_pk + getDailyProd.y_ptp)
            const arrow = sumOfDaily === 0 ? <HiOutlineMinusSm className="text-blue-500"/> : ((((sumOfDaily || 0) - (sumOfYesterday || 0)) > 0) ? <IoMdArrowUp className="text-green-500"/> : (((sumOfYesterday || 0) - (sumOfYesterday || 0)) === 0) ? <HiOutlineMinusSm className="text-blue-500"/> : <IoMdArrowDown className="text-red-500"/>) 

            return  (
              <div key={agent._id} className='grid grid-cols-11 bg-white lg:text-[0.6rem] 2xl:text-xs text-slate-500 py-0.5'>
                <div className='col-span-2 uppercase truncate'>{agent.name}</div>
                <div className='truncate'>{agent.buckets.map(e=> bucketObject[e]).join(', ')}</div>
                <div className="truncate pr-2">{agent.user_id}</div>
                <div>{getDailyProd?.rpc || 0}</div>
                <div>{getDailyProd?.count || 0}</div>
                <div className="lg:text-[0.75em] 2xl:text-[0.8em]">{getDailyProd?.ptp.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
                <div className="lg:text-[0.75em] 2xl:text-[0.8em]">{getDailyProd?.pk.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
                <div className="lg:text-[0.75em] 2xl:text-[0.8em] flex items-center">{getDailyProd?.ac.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
                <div className="flex col-span-2 items-center lg:text-[0.75em] 2xl:text-[0.8em] justify-end pr-2">{arrow} {sumOfDaily && sumOfDaily > 0 ? sumOfDaily.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) : ""}</div>
              </div>
            )
          })
        }
        
      </div>
    </div>
  )
}

export default TLAgentProduction