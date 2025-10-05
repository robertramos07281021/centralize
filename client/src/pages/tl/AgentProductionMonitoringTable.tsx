import gql from "graphql-tag"
import { useQuery } from "@apollo/client"
import { useEffect } from "react"
import { RootState } from "../../redux/store"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { AiOutlineLoading3Quarters } from "react-icons/ai";

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


type AgentDailies = {
  user: string
  ptp: number
  kept: number
  RPC: number

}

const AGENT_DAILY_PROD = gql`
  query agentDispoDaily($bucket:ID, $interval:String) {
    agentDispoDaily(bucket: $bucket, interval:$interval) {
      user
      ptp
      kept
      RPC
    }
  }
`




const AgentProductionMonitoringTable = () => {
  const  {intervalTypes, selectedBucket} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()
  const isTLDashboard = location.pathname.includes('tl-dashboard')
  const {data:agentBucketData, refetch:findAgentRefetch} = useQuery<{findAgents:Agent[]}>(GET_DEPARTMENT_AGENT, {notifyOnNetworkStatusChange: true})
  const {data:agentDailyProd, refetch, loading} = useQuery<{agentDispoDaily:AgentDailies[]}>(AGENT_DAILY_PROD, {variables: {bucket:selectedBucket, interval:intervalTypes},skip:!isTLDashboard, notifyOnNetworkStatusChange: true})
  
  useEffect(()=> {
    const refetching = async() => {
      await findAgentRefetch()
      await refetch()
    }
    refetching()
  },[selectedBucket, intervalTypes])

  const bucketAgents = selectedBucket ? agentBucketData?.findAgents.filter(x=> x.buckets.includes(selectedBucket) && x.type === "AGENT") : []
  
  return (
    <div className="h-full flex flex-col lg:text-xs 2xl:text-base overflow-hidden">
      <h1 className="font-medium lg:text-sm 2xl:text-lg text-gray-800 bg-blue-200 px-2 py-1.5 text-center">Agent Production Monitoring</h1>
        {
          loading ? 
          <div className="flex h-full w-full items-center justify-center">
            <AiOutlineLoading3Quarters className="animate-spin text-4xl" />
          </div>
          :
        <div className="w-full h-full overflow-auto">
          <table className="w-full text-gray-600 table-fixed">
            <thead className="bg-slate-200 sticky top-0 left-0 border-4 border-white">
              <tr className="border-t border-white">
                <th></th>
                <th className="py-1.5">RPC</th>
                <th>PTP</th>
                <th>Kept</th>
                <th>Collection %</th>
                <th>Target</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {
                bucketAgents?.map((x)=> {
                  const findAgent = agentDailyProd?.agentDispoDaily ? agentDailyProd?.agentDispoDaily.find(agent => agent.user === x._id) : null
                  const collectionPercent = findAgent ? ((findAgent?.kept) / x.targets[intervalTypes]) * 100 : null
                  const theVariance = findAgent ? x.targets[intervalTypes] - (findAgent?.kept) : null
                  return (
                    <tr className="text-center text-gray-600" key={x._id}>
                      <th className="py-2 lg:text-xs 2xl:text-sm text-left pl-2 capitalize text-nowrap">{x.name}</th>
                      <td>{findAgent?.RPC || '-'}</td>
                      <td>{findAgent?.ptp.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || '-'}</td>
                      <td>{findAgent?.kept.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || '-'}</td>
                      <td className={`${collectionPercent && collectionPercent < 100 ? "text-red-500" : "text-green-500"} `} >{isNaN(Number(collectionPercent)) || !collectionPercent ? '-' : `${collectionPercent?.toFixed(2)}%`}</td>
                      <td>{x.targets[intervalTypes]?.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || '-'}</td>
                      <td className={`${theVariance && theVariance < 0 ? "text-green-500": "text-red-500" }  `}>{theVariance?.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || '-'}</td>
                    </tr>
                  )
                }
                )
              }
            </tbody>
          </table>
         </div>
        }

    </div>
  )
}

export default AgentProductionMonitoringTable