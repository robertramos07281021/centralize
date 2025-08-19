import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useMemo } from "react"
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";
import { IntervalsTypes } from "./TlDashboard";
import CollectionsMonitoringTable from "./CollectionsMonitoringTable";
import ToolsProductionMonitoringTable from "./ToolsProductionMonitoringTable";
import AgentProductionMonitoringTable from "./AgentProductionMonitoringTable";



type Bucket = {
  id:string
  name: string
}

const TL_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      id
      name
    }
  }
`
type ComponentProp = {
  bucket: string | null | undefined
  interval: IntervalsTypes 
}

  
const TLAgentProduction:React.FC<ComponentProp> = ({bucket,interval}) => {
  const dispatch = useAppDispatch()
  const {data:tlBucketData, refetch:getDeptBucketRefetch} = useQuery<{getAllBucket:Bucket[]}>(TL_BUCKET)

  useEffect(()=> {
    const timer = async () => {
      try {
        await getDeptBucketRefetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    }
    timer()
  },[bucket,interval])

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const tlBuckets = tlBucketData?.getAllBucket || []
    return Object.fromEntries(tlBuckets.map(e=> [e.id, e.name]))
  },[tlBucketData])

  return (
    <div className='col-span-6 border border-slate-400 flex flex-col bg-white rounded-xl p-2 overflow-hidden'>
      <div className=' bg-white  text-slate-700 flex items-end gap-2 justify-between'>
        <h1 className="font-bold text-3xl">
          {bucketObject[bucket as keyof typeof bucketObject]} - <span className="uppercase">{interval}</span>
        </h1>
      </div>
      <CollectionsMonitoringTable bucket={bucket} interval={interval}/> 
      <ToolsProductionMonitoringTable bucket={bucket} interval={interval}/>
      <AgentProductionMonitoringTable bucket={bucket} interval={interval}/>
      
    </div>
  )
}

export default TLAgentProduction