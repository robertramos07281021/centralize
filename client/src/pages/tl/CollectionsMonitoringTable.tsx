import gql from "graphql-tag"
import { Bucket, IntervalsTypes } from "./TlDashboard"
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
  bucket: Bucket | null | undefined
  interval: IntervalsTypes 
}

const CollectionsMonitoringTable:React.FC<ComponentProp> = ({bucket, interval}) => {
  const dispatch = useAppDispatch()
  const {data, refetch} = useQuery<{getCollectionMonitoring:CollectionMonitoringData}>(COLLECTION_MONITORING,{variables: {bucket: bucket?.id, interval: interval}, skip:!bucket?.id})
  useEffect(()=> {
    const refetching = async() => {
      try {
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    }
    if(bucket?.id) {
      refetching()
    }
  },[bucket?.id,interval])

  const newData = data?.getCollectionMonitoring ? data?.getCollectionMonitoring : null

  const theVariance = newData ? newData?.target - newData?.collected : 0
  const collectionPercent = newData ? (newData.collected / newData.target) * 100 : 0

  return (
    <div className="lg:text-xs 2xl:text-base">
      <h1 className="font-medium lg:text-sm 2xl:text-lg text-gray-800 bg-blue-200 px-2 py-1.5 text-center">Collections Monitoring</h1>
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
            <td className="py-1.5">{newData ? newData?.target.toLocaleString('en-PH',{style: 'currency',currency: "PHP"}) : (0).toLocaleString('en-PH',{style: 'currency',currency: "PHP"})}</td>
            <td>{newData ? newData.collected.toLocaleString('en-PH',{style: 'currency',currency: "PHP"}) : (0).toLocaleString('en-PH',{style: 'currency',currency: "PHP"})}</td>
            <td>{theVariance.toLocaleString('en-PH',{style: 'currency',currency: "PHP"})}</td>
            <td>{collectionPercent.toFixed(2)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default CollectionsMonitoringTable