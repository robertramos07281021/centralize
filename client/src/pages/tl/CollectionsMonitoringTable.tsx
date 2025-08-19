import gql from "graphql-tag"
import { IntervalsTypes } from "./TlDashboard"
import { useQuery } from "@apollo/client"
import { useEffect } from "react"
import { useAppDispatch } from "../../redux/store"
import { setServerError } from "../../redux/slices/authSlice"

const COLLECTION_MONITORING = gql`
  query getCollectionMonitoring($bucket: ID!, $interval: String!) {
    getCollectionMonitoring(bucket: $bucket, interval: $interval) {
      target
      collected
    }
  }
`
type CollectionMonitoringData = {
  target: number
  collected: number
}

type ComponentProp = {
  bucket: string | null | undefined
  interval: IntervalsTypes 
}

const CollectionsMonitoringTable:React.FC<ComponentProp> = ({bucket, interval}) => {
  const dispatch = useAppDispatch()

  const {data, refetch} = useQuery<{getCollectionMonitoring:CollectionMonitoringData}>(COLLECTION_MONITORING,{variables: {bucket: bucket, interval: interval}})

  useEffect(()=> {
    const refetching = async() => {
      try {
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    }
    refetching()
  },[bucket,interval])

  const theVariance = data ? data?.getCollectionMonitoring?.target - data?.getCollectionMonitoring?.collected : 0
  const collectionPercent = data ? (data?.getCollectionMonitoring.collected / data?.getCollectionMonitoring.target) * 100 : 0

  return (
    <div>
      <h1 className="font-medium text-lg text-gray-800 bg-blue-200 px-2 py-1.5 text-center">Collections Monitoring</h1>
      <table className="w-full text-gray-600 text-center table-fixed">
        <thead>
          <tr >
            <th>Target</th>
            <th>Collection</th>
            <th>Variance</th>
            <th>Collection %</th>
          </tr>
        </thead>
        <tbody> 
          <tr>
            <td className="py-1.5">{data?.getCollectionMonitoring?.target.toLocaleString('en-PH',{style: 'currency',currency: "PHP"}) || (0).toLocaleString('en-PH',{style: 'currency',currency: "PHP"})}</td>
            <td>{data?.getCollectionMonitoring.collected.toLocaleString('en-PH',{style: 'currency',currency: "PHP"}) || (0).toLocaleString('en-PH',{style: 'currency',currency: "PHP"})}</td>
            <td>{theVariance.toLocaleString('en-PH',{style: 'currency',currency: "PHP"})}</td>
            <td>{collectionPercent.toFixed(2)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default CollectionsMonitoringTable