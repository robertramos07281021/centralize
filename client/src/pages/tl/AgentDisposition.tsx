import gql from "graphql-tag"
import { Users } from "../../middleware/types"
import { useQuery } from "@apollo/client"
import { RootState } from "../../redux/store"
import { useSelector } from "react-redux"


interface DispositionType  {
  id: string
  name: string
  code: string,
  count: string
}


const GET_DISPOSITION_TYPES = gql`
  query Query {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

const GET_DEPARTMENT_AGENT = gql`
query Query($department: String!) {
  findAgents(department: $department) {
    _id
    name
    username
    type
    department
    branch
    change_password
    buckets
    isOnline
    active
    createdAt
    user_id
  }
}
`

const AgentDisposition = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const {data:agentSelector} = useQuery<{findAgents:Users[]}>(GET_DEPARTMENT_AGENT, {variables: {department:userLogged.department}})

  const {data:disposition} = useQuery<{getDispositionTypes:DispositionType[]}>(GET_DISPOSITION_TYPES)


  return (
    <div className="border border-slate-300 bg-white row-span-3 col-span-5 rounded-lg flex overflow-y-auto flex-col max-h-[400px] overflow-x-auto px-2 pb-2">
    <table className='w-full border-collapse'>
      <thead className='sticky top-0 bg-white'>
        <tr className='text-slate-500'>
          <th className='w-24'>AGENT ID</th>
          <th className='w-auto'>NAME</th>
          {
            disposition?.getDispositionTypes.map((dispo) => 
              <th className="text-xs">{dispo.code}</th>
            )
          }
        </tr>
      </thead>
      <tbody>
      {
        agentSelector?.findAgents.map((agent)=> 
          <tr key={agent._id}  className='odd:bg-gray-100 even:bg-white text-center text-sm text-slate-500'>
            <th className="w-24">{agent.user_id}</th>
            <th className="w-auto">{agent.name}</th>
            <td>5</td>
            <td>6</td>
            <td>10</td>
            <td>20</td>
            <td>30</td>
            <td>40</td>
            <td>50</td>
            <td>80</td>
            <td>70</td>
            <td>40</td>
            <td>32</td>
            <td>75</td>
            <td>80</td>
            <td>90</td>
            <td>7</td>
          </tr>

        )
      }

        
        
      </tbody>
    </table>
  </div>
  )
}

export default AgentDisposition
