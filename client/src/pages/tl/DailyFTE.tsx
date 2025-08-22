import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect } from "react"
import { useAppDispatch } from "../../redux/store"
import { setServerError } from "../../redux/slices/authSlice"
import { Bucket } from "./TlDashboard"


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

type ComponentProp = {
  bucket: Bucket | null | undefined
}

const DailyFTE:React.FC<ComponentProp> = ({bucket}) => {
  const {data, refetch} = useQuery<{getDailyFTE:DailyFTEType[]}>(DAILY_FTE)
  const {data:campaignAssignedData, refetch:campaignAssignedRefetch} = useQuery<{getCampaignAssigned:CampaignAssigned[]}>(CAMPAIGN_ASSIGNED)
  const dispatch = useAppDispatch()

  useEffect(()=> {
    const fetchData = async () => {
      try {
        await refetch()
        await campaignAssignedRefetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    }
    fetchData()
  },[])

  const findCampaignAssignedData = campaignAssignedData?.getCampaignAssigned.find(y => y.campaign === bucket?._id)
  const findData = data?.getDailyFTE.find(b => b.campaign === bucket?._id)
  const FTEPercent = (Number(findData?.online) / Number(findCampaignAssignedData?.assigned)) * 100
  return (  
    <div className=' col-span-2 rounded-xl grid grid-cols-3 gap-2' >
      <div className="border border-slate-400 rounded-xl p-2 bg-white flex flex-col justify-between">
        <h1 className="text-sm 2xl:text-lg font-medium text-gray-600">Assigned</h1>
        <p className="text-3xl 2xl:text-5xl text-end font-bold text-gray-600">{findCampaignAssignedData?.assigned}</p>
      </div>
      <div className="border border-slate-400 rounded-xl p-2 bg-white flex flex-col justify-between">
        <h1 className="text-sm 2xl:text-lg font-medium text-gray-600">Present Today</h1>
        <p className="text-3xl 2xl:text-5xl text-end font-bold text-gray-600">{findData?.online}</p>
      </div>
      <div className="border border-slate-400 rounded-xl p-2 bg-white flex flex-col justify-between">
        <h1 className="text-sm 2xl:text-lg font-medium text-gray-600">FTE Daily % </h1>
        <p className="text-3xl 2xl:text-5xl text-end font-bold text-gray-600">{isNaN(FTEPercent) ? 0 :FTEPercent.toFixed(2)}%</p>
      </div>
    </div>
  )
}

export default DailyFTE