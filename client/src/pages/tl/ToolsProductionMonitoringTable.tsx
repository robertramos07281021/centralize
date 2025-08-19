import gql from "graphql-tag"
import { IntervalsTypes } from "./TlDashboard"
import { useQuery } from "@apollo/client"
import { useEffect } from "react"
import { useAppDispatch } from "../../redux/store"
import { setServerError } from "../../redux/slices/authSlice"



 type ToolsProduction = {
    contact_method: string
    rpc: number
    ptp: number
    kept: number
    paid: number
  }



const TOOLS_PRODUCTION = gql`
  query getToolsProduction($bucket: ID!, $interval: String!) {
    getToolsProduction(bucket: $bucket, interval: $interval) {
      contact_method
      rpc
      ptp
      kept
      paid
    }
  }
`


type ComponentProp = {
  bucket: string | null | undefined
  interval: IntervalsTypes 
}

const ToolsProductionMonitoringTable:React.FC<ComponentProp> = ({bucket, interval}) => {
  const dispatch = useAppDispatch()

  const {data,refetch} = useQuery<{getToolsProduction:ToolsProduction[]}>(TOOLS_PRODUCTION,{variables: {bucket: bucket, interval: interval}})
  const toolsData = data?.getToolsProduction || []

  useEffect(()=> {
    const refetching = async() => {
      try {
        await refetch({bucket:bucket, interval:interval})
      } catch (error) {
        dispatch(setServerError(true))
      }
    }

    refetching()
  },[bucket, interval])

  const tools = ['calls','sms','email','skip','field']

  const totalRPC = toolsData.length > 0 ? toolsData.map(rpc => rpc.rpc).reduce((t,v)=> t + v) : 0
  const totalPtp = toolsData.length > 0 ? toolsData.map(rpc => rpc.ptp).reduce((t,v)=> t + v) : 0
  const totalKept = toolsData.length > 0 ? toolsData.map(rpc => rpc.kept).reduce((t,v)=> t + v) : 0
  const totalPaid = toolsData.length > 0 ? toolsData.map(rpc => rpc.paid).reduce((t,v)=> t + v) : 0

  return (
    <div className="w-full h-full flex flex-col">
      <h1 className="font-medium text-lg text-gray-800 bg-blue-200 px-2 py-1.5 text-center mt-2">Tools Production Monitoring</h1>
      <table className="w-full h-full text-gray-600 table-fixed">
        <thead className="bg-slate-200 sticky top-0 left-0 border-4 border-white">
          <tr className="border-t border-white">
            <th></th>
            <th className="py-1.5">RPC</th>
            <th>PTP</th>
            <th>PTP Kept</th>
            <th>Amount Collected</th>
          </tr>
        </thead>
        <tbody className="text-center">
          {
            tools.map((tool,index) => {
              const findTools = data?.getToolsProduction?.find(t=> t.contact_method === tool) || null
              return (
                <tr key={index} className="border-t border-white odd:bg-blue-50">
                  <td className="text-left px-5 capitalize">{tool}</td>
                  <td>{findTools?.rpc || 0}</td>
                  <td>{findTools?.ptp.toLocaleString('en-PH',{style: "currency", currency: "PHP"}) || '-'}</td>
                  <td>{findTools?.kept.toLocaleString('en-PH',{style: "currency", currency: "PHP"}) || '-'}</td>
                  <td>{findTools?.paid.toLocaleString('en-PH',{style: "currency", currency: "PHP"}) || '-'}</td>
                </tr>
              )
            })
          }
          <tr className="border-t border-white">
            <th className="text-left px-5">Total</th>
            <th>{totalRPC}</th>
            <th>{totalPtp?.toLocaleString('en-PH',{style: "currency", currency: "PHP"})}</th>
            <th>{totalKept?.toLocaleString('en-PH',{style: "currency", currency: "PHP"})}</th>
            <th>{totalPaid.toLocaleString('en-PH',{style: "currency", currency: "PHP"})}</th>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default ToolsProductionMonitoringTable