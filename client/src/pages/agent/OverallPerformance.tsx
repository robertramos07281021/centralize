import { gql, useQuery } from "@apollo/client"
import { useEffect } from "react"
import { month } from "../../middleware/exports"
import { useLocation } from "react-router-dom"

type AgentTotalDispo = {
  count: number
  dispotype: string
}

const AGENT_TOTAL_DISPO = gql`
  query getAgentTotalDispositions {
    getAgentTotalDispositions {
      count
      dispotype
    }
  }
`

type DispositionType = {
  id: string
  code: string
  name: string
}

const DISPO_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

export default function OverallPerformance () {
  const location = useLocation()
  const isAgentDashboard = location.pathname.includes('agent-dashboard')
  const {data:agentTotalDispoData, refetch:TotalDispoRefetch} = useQuery<{getAgentTotalDispositions:AgentTotalDispo[]}>(AGENT_TOTAL_DISPO,{skip: !isAgentDashboard, notifyOnNetworkStatusChange: true})
  const {data:dispotypeData, refetch:DispoTypeRefetch} = useQuery<{getDispositionTypes:DispositionType[]}>(DISPO_TYPES,{skip: !isAgentDashboard, notifyOnNetworkStatusChange: true})

  const Month = new Date().getMonth()

  useEffect(()=> {
    const timer = async()=> {
      await TotalDispoRefetch()
      await DispoTypeRefetch()
    }
    timer()
  },[])

  return (
    <div className="border rounded-lg border-slate-200 lg:col-span-2 lg:row-span-2 shadow-md shadow-black/20 p-2 bg-white flex flex-col">
      <h1 className="text-slate-500 font-bold text-[0.8em] py-1">Overall Performance Month of {month[Month]}</h1>
      <div className="grid grid-cols-4 text-xs font-bold px-2 text-gray-500 bg-blue-50 py-2">
        <div className="col-span-2">Name</div>
        <div className="pl-3">Code</div>
        <div className="text-end">Count</div>
      </div>
      <div className="h-full overflow-y-auto">
        {
          agentTotalDispoData?.getAgentTotalDispositions.map((e) => {
            const findDispo = dispotypeData?.getDispositionTypes.find(y=> y.id === e.dispotype)
            
            return (
              <div className="grid grid-cols-4 py-0.5 px-2 text-xs font-medium text-gray-500 cursor-default" key={e.dispotype}>
                <div className="truncate pr-1 col-span-2" title={findDispo?.name}>
                  {findDispo?.name}
                </div>
                <div className="pl-3">
                  {findDispo?.code}
                </div>
                <div className="text-end">
                  {e.count}
                </div>
              </div>
            )
          } )
        }

      </div>  
    </div>
  )
}

