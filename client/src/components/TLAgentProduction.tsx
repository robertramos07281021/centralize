import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useState } from "react"
import { IoMdArrowDown,IoMdArrowUp  } from "react-icons/io";
import { HiOutlineMinusSm } from "react-icons/hi";

interface AgentDailies {
  user: string
  count: number
  amount: number
  yesterday: number
}

const AGENT_DAILY_PROD = gql`
  query AgentDispoDaily {
    agentDispoDaily {
      user
      count
      amount
      yesterday
    }
  }
`

interface Agent {
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

interface Bucket {
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
  const {data:agentDailyProd } = useQuery<{agentDispoDaily:AgentDailies[]}>(AGENT_DAILY_PROD)
  
  const {data:agentBucketData} = useQuery<{findAgents:Agent[]}>(GET_DEPARTMENT_AGENT)

  const [bucketObject, setBucketObject]= useState<{[key:string]:string}>({})

  const {data:tlBucketData} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET)
  useEffect(()=> {
    if(tlBucketData) {
      const newObject:{[key: string]:string} = {}
      tlBucketData.getDeptBucket.map(e=> {
        newObject[e.id] = e.name
      })
      setBucketObject(newObject)
    }
  },[tlBucketData])

  return (
    <div className='col-span-3 border border-slate-400 bg-white rounded-xl overflow-auto p-2'>
      <div className='flex flex-col lg:h-115 2xl:h-130 overflow-auto relative'>
        <div className='sticky top-0 bg-white font-bold text-base text-slate-700'>Agent Production <span className="text-sm font-medium">(Daily)</span></div>
        <div className='sticky top-6 grid grid-cols-7 bg-white text-sm font-medium text-slate-600'>
          <div className='col-span-2'>Name</div>
          <div className="col-span-2">Bucket</div>
          <div>ID</div>
          <div>Dispo</div>
          <div>Collected</div>
        </div>
        {
          agentBucketData?.findAgents.map((agent) => {
            const getDailyProd = agentDailyProd?.agentDispoDaily.find(e=> e.user === agent._id)
            const arrow = getDailyProd?.amount === 0 ? <HiOutlineMinusSm className="text-blue-500"/> : ((((getDailyProd?.amount || 0) - (getDailyProd?.yesterday || 0)) > 0) ? <IoMdArrowUp className="text-green-500"/> : (((getDailyProd?.amount || 0) - (getDailyProd?.yesterday || 0)) === 0) ? <HiOutlineMinusSm className="text-blue-500"/> : <IoMdArrowDown className="text-red-500"/>) 

            return  (
              <div key={agent._id} className='grid grid-cols-7 bg-white text-xs text-slate-500 py-0.5'>
                <div className='col-span-2 uppercase'>{agent.name}</div>
                <div className='col-span-2'>{agent.buckets.map(e=> bucketObject[e]).join(', ')}</div>
                <div>{agent.user_id}</div>
                <div>{getDailyProd?.count || 0}</div>
                <div className="flex  items-center">{arrow} {getDailyProd && getDailyProd?.amount > 0 ? getDailyProd?.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) : ""}</div>
              </div>
            )
          })
        }
        
      </div>
    </div>
  )
}

export default TLAgentProduction