import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useEffect, useState } from 'react'
import { useAppDispatch } from '../redux/store'
import { setAgent } from '../redux/slices/authSlice'



interface Agent {
  _id:string
  name: string
  user_id: string
  buckets: string[]
}


const FIND_AGENT = gql`
  query FindAgents {
    findAgents {
      _id
      name
      user_id
      buckets 
    }
  }

`

interface Bucket {
  id:string
  name: string
  dept: string
}

const GET_DEPT_BUCKETS = gql`
  query Query {
    getDeptBucket {
      id
      name
      dept
    }
  }
`

const AgentSection = () => {
  const {data:AgentsData} = useQuery<{findAgents:Agent[]}>(FIND_AGENT)
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [agentsNewObject, setAgentsNewObject] = useState<{[key:string]:string}>({})
  const dispatch = useAppDispatch()
  const [bucketObject, setBucketObject] = useState<{[key:string]:string}>({})
  const {data:deptBucketData} = useQuery<{getDeptBucket:Bucket[]}>(GET_DEPT_BUCKETS)

  useEffect(()=> {
    if(AgentsData) {
      const newObject:{[key:string]:string} = {}
      AgentsData?.findAgents?.map((ad) => 
        newObject[ad.user_id] = ad._id
      )
      setAgentsNewObject(newObject)
    }
    if(deptBucketData) {
      const newObject:{[key:string]:string} = {}
      deptBucketData?.getDeptBucket?.map((b) => 
        newObject[b.id] = b.name
      )
      setBucketObject(newObject)
    }
  },[AgentsData, deptBucketData])

  useEffect(()=> {
    dispatch(setAgent(agentsNewObject[selectedAgent]))
  },[selectedAgent,dispatch, agentsNewObject])

  return (
    <div className="w-full flex justify-end items-center text-xs">
      <select 
      id="agent" 
      name="agent" 
      className={`bg-gray-50 border-gray-300 border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block lg:w-50 2xl:w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}   
      onChange={(e)=> setSelectedAgent(e.target.value)}    
      >
        <option value="">Select Agent</option>
        {
          AgentsData?.findAgents.map((a)=> (
            <option key={a._id} value={a.user_id} className='uppercase'>
              {a.user_id} - {a.name.toUpperCase()} - {a.buckets.map((b)=> bucketObject[b]).join(", ")}
            </option>
          ))
        }
      </select>
    </div>
  )
}

export default AgentSection