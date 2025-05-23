import gql from "graphql-tag"
import { Users } from "../../middleware/types"
import { useQuery } from "@apollo/client"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

interface DispositionType  {
  id: string
  name: string
  code: string,
  count: string
}


interface AgentDisposition {
  agent: string
  user_id: string
  dispositions: DispositionType[]
}


const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

const AGENT_DISPOSITION = gql`
  query getAgentDispositions {
    getAgentDispositions {
      agent
      user_id
      dispositions {
        code
        name
        count
      }
    }
  }
`
const GET_DEPARTMENT_AGENT = gql`
  query findAgents {
    findAgents{
      _id
      name
      buckets
      user_id
    }
  }
`

interface Bucket {
  id: string
  name:string
}
const DEPT_BUCKET_QUERY = gql`
  query getDeptBucket {
    getDeptBucket {
      id
      name
    }
  }
`

const AgentDisposition = () => {
  const navigate = useNavigate()
  const {data:agentSelector, refetch:agentRefetch} = useQuery<{findAgents:Users[]}>(GET_DEPARTMENT_AGENT)

  const {data:dataDispo, refetch:agentDispoRefetch} = useQuery<{getAgentDispositions:AgentDisposition[]}>(AGENT_DISPOSITION)

  const [existsDispo, setExistsDispo] = useState<string[]>([])

  useEffect(()=> {
    const newArray = dataDispo?.getAgentDispositions.map((ad) => ad.dispositions.map((d) => d.code))
    const flatArray = newArray?.flat()
    setExistsDispo([...new Set(flatArray)])
  },[dataDispo])

  const {data:disposition, refetch:dispoRefetch} = useQuery<{getDispositionTypes:DispositionType[]}>(GET_DISPOSITION_TYPES)
  
  useEffect(()=> {
    agentRefetch()
    agentDispoRefetch()
    dispoRefetch()
  },[navigate, dispoRefetch, agentDispoRefetch, agentRefetch])

  const [bucketObject, setBucketObject] = useState<{[key:string]:string}>({})
  const {data:bucketData} = useQuery<{getDeptBucket:Bucket[]}>(DEPT_BUCKET_QUERY)
  
  useEffect(()=> {
    if(bucketData) {
      const newObject:{[key:string]:string} = {}
      bucketData.getDeptBucket.map((e)=> newObject[e.id] = e.name)
      setBucketObject(newObject)
    }
  },[bucketData])

  return (
    <div className="border border-slate-400 bg-white row-span-3 col-span-5 rounded-lg flex overflow-y-auto flex-col max-h-[400px]  overflow-x-auto px-2 pb-2">
    <table className='w-full border-collapse'>
      <thead className='sticky top-0 bg-white'>
        <tr className='text-slate-500'>
          <th className='w-24 2xl:text-sm lg:text-[0.7rem] py-1.5'>AGENT ID</th>
          <th className='w-auto 2xl:text-sm lg:text-[0.7rem]'>NAME</th>
          {
            disposition?.getDispositionTypes.map((dispo) => 
            {
              return existsDispo.includes(dispo.code) && ( 
                 <th key={dispo.id} className="2xl:text-xs lg:text-[0.6rem] font-medium">{dispo.code}</th>
               )
            })
          }
        </tr>
      </thead>
      <tbody>
      {
        agentSelector?.findAgents.map((agent) => {
          const matchedAgent = dataDispo?.getAgentDispositions.find(
            (a) => (a.user_id === agent.user_id) 
          );

          
          return (
            <tr key={agent._id} className="odd:bg-gray-100 even:bg-white text-center 2xl:text-sm lg:text-xs text-slate-500  hover:bg-slate-200" title={agent.buckets.map(e=> bucketObject[e]).join(', ')}>
              <td className="w-24 font-medium py-1.5 2xl:text-sm lg:text-xs" >{agent.user_id || "TL"}</td>
              <td className="w-50 font-medium uppercase">{agent.name}</td>
              {
                disposition?.getDispositionTypes.map((dispo) => {
                  const found = matchedAgent?.dispositions.find((d) => d.code === dispo.code);

                  return existsDispo.includes(dispo.code) && (
                    <td key={dispo.code} className="2xl:text-xs lg:text-[0.6rem]">
                      {found && found.count}
                    </td>
                  );
                })
              }
            </tr>
          )
        })
      }
      </tbody>
    </table>
  </div>
  )
}

export default AgentDisposition
