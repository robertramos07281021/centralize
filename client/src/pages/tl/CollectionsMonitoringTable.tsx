import gql from "graphql-tag"
import { useQuery } from "@apollo/client"
import { useEffect } from "react"
import { RootState } from "../../redux/store"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const COLLECTION_MONITORING = gql`
  query getCollectionMonitoring($bucket: ID, $interval: String) {
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


const CollectionsMonitoringTable = () => {
  const {intervalTypes, selectedBucket} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()
  const isTLDashboard = location.pathname.includes('tl-dashboard')
  const {data, refetch, loading} = useQuery<{getCollectionMonitoring:CollectionMonitoringData}>(COLLECTION_MONITORING,{variables: {bucket: selectedBucket, interval: intervalTypes}, skip:!isTLDashboard,notifyOnNetworkStatusChange: true })

  useEffect(()=> {
    const refetching = async() => {
      await refetch()
    }
    refetching()
  },[intervalTypes,selectedBucket])

  const newData = data?.getCollectionMonitoring ? data?.getCollectionMonitoring : null

  const theVariance = newData ? newData?.target - newData?.collected : 0
  const collectionPercent = newData ? (newData.collected / newData.target) * 100 : 0

  return (
    <div className="lg:text-xs 2xl:text-base flex flex-col">
      <h1 className="font-medium lg:text-sm 2xl:text-lg text-gray-800 bg-blue-200 px-2 py-1.5 text-center">Collections Monitoring</h1>
      {
        loading ? 
        <div className="flex h-full w-full items-center justify-center py-2">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl" />
        </div> :
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

      }
    </div>
  )
}

export default CollectionsMonitoringTable