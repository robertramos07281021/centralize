import gql from "graphql-tag"
import { Bucket, IntervalsTypes } from "./TlDashboard"
import { useQuery } from "@apollo/client"
import { useEffect } from "react"
import { useAppDispatch } from "../../redux/store"
import { setServerError } from "../../redux/slices/authSlice"

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
  collected: number
  RPC: number

}

const AGENT_DAILY_PROD = gql`
  query agentDispoDaily($bucket:ID!, $interval:String!) {
    agentDispoDaily(bucket: $bucket, interval:$interval) {
      user
      ptp
      kept
      collected
      RPC
    }
  }
`



type ComponentProp = {
  bucket: Bucket | null | undefined
  interval: IntervalsTypes 
}

const AgentProductionMonitoringTable:React.FC<ComponentProp> = ({bucket, interval}) => {
  const {data:agentBucketData, refetch:findAgentRefetch} = useQuery<{findAgents:Agent[]}>(GET_DEPARTMENT_AGENT)
  const dispatch = useAppDispatch()
  const {data:agentDailyProd, refetch} = useQuery<{agentDispoDaily:AgentDailies[]}>(AGENT_DAILY_PROD, {variables: {bucket:bucket?.id, interval:interval},skip:!bucket})
  useEffect(()=> {
    const refetching = async() => {
      try {
        await findAgentRefetch()
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    }
    refetching()
  },[bucket, interval])

  const bucketAgents = bucket ? agentBucketData?.findAgents.filter(x=> x.buckets.includes(bucket.id) && x.type === "AGENT") : []

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <h1 className="font-medium text-lg text-gray-800 bg-blue-200 px-2 py-1.5 text-center">Agent Production Monitoring</h1>
      <div className="w-full h-full overflow-auto">
        <table className="w-full text-gray-600 table-fixed">
          <thead className="bg-slate-200 sticky top-0 left-0 border-4 border-white">
            <tr className="border-t border-white">
              <th></th>
              <th className="py-1.5">RPC</th>
              <th>PTP</th>
              <th>PTP Kept</th>
              <th>Collected</th>
              <th>Collection %</th>
              <th>Target</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            {
              bucketAgents?.map((x)=> {
                const findAgent = agentDailyProd?.agentDispoDaily ? agentDailyProd?.agentDispoDaily.find(agent => agent.user === x._id) : null
                const collectionPercent = findAgent ? ((findAgent?.kept + findAgent?.collected) / x.targets[interval]) * 100 : null
                const theVariance = findAgent ? x.targets[interval] - (findAgent?.kept + findAgent?.collected) : null
                return (
                  <tr className="text-center text-gray-600" key={x._id}>
                    <th className="py-2 text-sm text-left pl-2 capitalize">{x.name}</th>
                    <td>{findAgent?.RPC || '-'}</td>
                    <td>{findAgent?.ptp.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || '-'}</td>
                    <td>{findAgent?.kept.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || '-'}</td>
                    <td>{findAgent?.collected.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || '-'}</td>
                    <td>{isNaN(Number(collectionPercent)) || !collectionPercent ? '-' : `${collectionPercent?.toFixed(2)}%`}</td>
                    <td>{x.targets[interval].toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || '-'}</td>
                    <td>{theVariance?.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || '-'}</td>
                  </tr>
                )
              }
              )
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AgentProductionMonitoringTable