import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useEffect, useState } from 'react'
import { useAppDispatch } from '../redux/store'
import { setAgent } from '../redux/slices/authSlice'

interface Agent {
  _id:string
  name: string
  user_id: string
}


const FIND_AGENT = gql`
  query FindAgents {
  findAgents {
    _id
    name
    user_id
  }
}

`


const AgentSection = () => {
  const {data:AgentsData} = useQuery<{findAgents:Agent[]}>(FIND_AGENT)
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [agentsNewObject, setAgentsNewObject] = useState<{[key:string]:string}>({})
  const dispatch = useAppDispatch()

  useEffect(()=> {
    const newObject:{[key:string]:string} = {}
    if(AgentsData) {
      AgentsData?.findAgents?.forEach((ad) => 
        newObject[ad.user_id] = ad._id
      )
    }
    setAgentsNewObject(newObject)
  },[AgentsData])


  useEffect(()=> {
    dispatch(setAgent(agentsNewObject[selectedAgent]))
  },[selectedAgent,dispatch, agentsNewObject])

  return (
    <div className="w-full flex justify-end items-center text-xs">
      <select 
      id="agent" 
      name="agent" 
      // ${groupRequired ? "border-red-500 bg-red-50" : "bg-gray-50 border-gray-300"}

      className={`bg-gray-50 border-gray-300 border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block lg:w-50 2xl:w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}   
      onChange={(e)=> setSelectedAgent(e.target.value)}    
      >
        <option value="">Select Agent</option>
        {
          AgentsData?.findAgents.map((a)=> (
            <option key={a._id} value={a.user_id} className='uppercase'>
              {a.user_id} - {a.name}
            </option>



          ))
        }
      </select>
    </div>
  )
}

export default AgentSection