import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useMemo } from "react"
import { Bucket } from "./TlDashboard";
import CollectionsMonitoringTable from "./CollectionsMonitoringTable";
import ToolsProductionMonitoringTable from "./ToolsProductionMonitoringTable";
import AgentProductionMonitoringTable from "./AgentProductionMonitoringTable";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store.ts";




const TL_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`

  
const TLAgentProduction = () => {
  const { intervalTypes, selectedBucket } = useSelector((state:RootState)=> state.auth)
  const {data:tlBucketData, refetch:getDeptBucketRefetch} = useQuery<{getAllBucket:Bucket[]}>(TL_BUCKET,{notifyOnNetworkStatusChange: true})

  useEffect(()=> {
    const timer = async () => {
      await getDeptBucketRefetch()
    }
    if(selectedBucket) {
      timer()
    }
  },[selectedBucket,intervalTypes])

  const findBucket = tlBucketData?.getAllBucket.find(bucket => bucket._id === selectedBucket)

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const tlBuckets = tlBucketData?.getAllBucket || []
    return Object.fromEntries(tlBuckets.map(e=> [e._id, e.name]))
  },[tlBucketData])

  return (
    <div className='col-span-6 border border-slate-400 flex flex-col bg-white rounded-xl p-2 overflow-hidden'>
      <div className=' bg-white  text-slate-700 flex items-end gap-2 justify-between'>
        <h1 className="font-bold lg:text-lg 2xl:text-3xl">
          {bucketObject[selectedBucket as keyof typeof bucketObject]}
          {
            !findBucket?.principal &&
            <span className="uppercase"> - {intervalTypes}</span>
          }
        </h1>
      </div>
      <CollectionsMonitoringTable/> 
      <ToolsProductionMonitoringTable />
      <AgentProductionMonitoringTable/>
      
    </div>
  )
}

export default TLAgentProduction