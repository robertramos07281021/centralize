import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect } from "react"
import { RootState } from "../../redux/store"
import { motion } from "framer-motion"
import { useSelector } from "react-redux"

type DailyFTEType = {
  campaign: string
  online:number
}


const DAILY_FTE = gql`
  query getDailyFTE {
    getDailyFTE {
      campaign
      online
    }
  }
`

type CampaignAssigned = {
  campaign: string
  assigned: number
}

const CAMPAIGN_ASSIGNED = gql`
  query getCampaignAssigned {
    getCampaignAssigned {
      campaign
      assigned
    }
  }
`

const DivFTEs = ({label, value}:{label:string,value:string | number | null | undefined}) => {
  return (
    <div className="border border-slate-400 rounded-xl p-2 bg-white flex flex-col justify-between">
      <h1 className="text-[0.6rem] 2xl:text-base font-medium text-gray-600">{label}</h1>
      <p className="text-4xl 2xl:text-5xl text-end font-bold text-gray-600">{value}</p>
    </div>
  )
}

const DailyFTE = () => {
  const {selectedBucket} = useSelector((state:RootState)=> state.auth)
  const {data, refetch} = useQuery<{getDailyFTE:DailyFTEType[]}>(DAILY_FTE)
  const {data:campaignAssignedData, refetch:campaignAssignedRefetch} = useQuery<{getCampaignAssigned:CampaignAssigned[]}>(CAMPAIGN_ASSIGNED,{notifyOnNetworkStatusChange: true})

  useEffect(()=> {
    const fetchData = async() => {
      await refetch()
      await campaignAssignedRefetch()
    }
    fetchData()
  },[])

  const findCampaignAssignedData = campaignAssignedData?.getCampaignAssigned.find(y => y.campaign === selectedBucket)
  const findData = data?.getDailyFTE.find(b => b.campaign === selectedBucket)
  const FTEPercent = (Number(findData?.online) / Number(findCampaignAssignedData?.assigned)) * 100

  return (  
    <motion.div className=' col-span-2 rounded-xl grid grid-cols-3 gap-2' 
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      transition={{type: 'spring', duration: 1}}
    >
      <DivFTEs label="Expected Calling Agents" value={findCampaignAssignedData?.assigned || 0}/>
      <DivFTEs label="Actual" value={findData?.online || 0}/>
      <DivFTEs label="Attendance %" value={`${isNaN(FTEPercent) ? 0 : FTEPercent.toFixed(2)}%`}/>
    </motion.div>
  )
}

export default DailyFTE