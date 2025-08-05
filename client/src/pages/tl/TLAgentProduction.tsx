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

type Targets = {
  daily: number
  weekly: number
  monthly: number
}

type Agent = {
  _id: string
  name: string
  user_id: string
  buckets: string[]
  type: string
  targets: Targets
}

const GET_DEPARTMENT_AGENT = gql`
  query findAgents {
    findAgents {
      _id
      name
      user_id
      buckets
      type
      targets {
        daily
        weekly
        monthly
      }
    }
  }
`

type Bucket = {
  id:string
  name: string
}

const TL_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      id
      name
    }
  }
`


const TLAgentProduction = () => {

  const dispatch = useAppDispatch()
  const {data:agentDailyProd, refetch} = useQuery<{agentDispoDaily:AgentDailies[]}>(AGENT_DAILY_PROD)
  const {data:agentBucketData, refetch:findAgentRefetch} = useQuery<{findAgents:Agent[]}>(GET_DEPARTMENT_AGENT)
  const {data:tlBucketData, refetch:getDeptBucketRefetch} = useQuery<{getAllBucket:Bucket[]}>(TL_BUCKET)

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await refetch()
        await findAgentRefetch()
        await getDeptBucketRefetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })
    return () => clearTimeout(timer)
  },[refetch,findAgentRefetch,getDeptBucketRefetch])

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const tlBuckets = tlBucketData?.getAllBucket || []
    return Object.fromEntries(tlBuckets.map(e=> [e.id, e.name]))
  },[tlBucketData])

  return (
    <div className='col-span-6 border border-slate-400 flex flex-col bg-white rounded-xl p-2 overflow-hidden'>
      <div className=' bg-white font-bold text-base text-slate-700'>Agent Production <span className="text-sm font-medium">(Daily)</span></div>
      <div className="w-full h-full overflow-auto relative">
          <div className='sticky w-10/8 top-0 grid grid-cols-14 text-base font-medium text-slate-600 bg-blue-100 py-1 items-center z-30'>
            <div className='col-span-2 pl-2 sticky left-0 bg-blue-100'>Name</div>
            <div >Bucket</div>
            <div>ID</div>
            <div>RPC</div>
            <div>Dispo</div>
            <div>PTP</div>
            <div>K</div>
            <div>AMOUNT COLLECTED</div>
            <div className="col-span-2">Production</div>
            <div className="flex flex-col col-span-3">
              <div className="text-center">Targets</div>
              <div className="grid grid-cols-3">
                <div>Daily</div>
                <div>Weekly</div>
                <div>Monthly</div>
              </div>
            </div>
          </div>
          {
            agentBucketData?.findAgents.map((agent, index) => {
              const getDailyProd = agentDailyProd?.agentDispoDaily.find(e=> e.user === agent._id)
              const sumOfDaily = getDailyProd && (getDailyProd?.ac + getDailyProd?.pk )
              const sumOfYesterday = getDailyProd && (getDailyProd.y_ac + getDailyProd.y_pk )
              const arrow = sumOfDaily === 0 ? <HiOutlineMinusSm className="text-blue-500"/> : ((((sumOfDaily || 0) - (sumOfYesterday || 0)) > 0) ? <IoMdArrowUp className="text-green-500"/> : (((sumOfYesterday || 0) - (sumOfYesterday || 0)) === 0) ? <HiOutlineMinusSm className="text-blue-500"/> : <IoMdArrowDown className="text-red-500"/>)
              return  (
                <div key={agent._id} className='grid grid-cols-14 bg-white lg:text-base text-slate-500 py-1 cursor-default odd:bg-slate-100 w-10/8 relative'>
                  <div className={`col-span-2 uppercase truncate pr-2 pl-2 sticky left-0 ${index % 2 === 0 ?  "bg-white": "bg-slate-100"}`} title={agent.name.toUpperCase()}>{agent.name}</div>
                  <div className='truncate' title={agent.buckets.map(e=> bucketObject[e]).join(', ')}>{agent.buckets.map(e=> bucketObject[e]).join(', ')}</div>
                  <div className="truncate pr-2">{agent.user_id}</div>
                  <div>{getDailyProd?.rpc || 0}</div>
                  <div>{getDailyProd?.count || 0}</div>
                  <div>{getDailyProd?.ptp.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
                  <div>{getDailyProd?.pk.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
                  <div className="flex items-center">{getDailyProd?.ac.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
                  <div className="flex col-span-2 items-center pr-2">{arrow} {sumOfDaily && sumOfDaily > 0 ? sumOfDaily.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) : ""}</div>
                  <div className="col-span-3 grid grid-cols-3">

                    <div>{agent.targets?.daily.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
                    <div>{agent.targets?.weekly.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
                    <div>{agent.targets?.monthly.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) || (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
                  </div>
                </div>
              )
            })
          }
        </div>
      
    </div>
  )
}

export default TLAgentProduction