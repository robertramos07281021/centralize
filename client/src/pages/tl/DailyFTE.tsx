import { useQuery } from "@apollo/client"
import gql from "graphql-tag"


type DailyFTE = {
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

type Bucket = {
  _id: string
  name: string
}
const ALL_BUCKETS = gql`
  query GetAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`

const DailyFTE = () => {
  const {data} = useQuery<{getDailyFTE:DailyFTE[]}>(DAILY_FTE)
  const {data:campaignAssignedData} = useQuery<{getCampaignAssigned:CampaignAssigned[]}>(CAMPAIGN_ASSIGNED)
  const {data:allBucket} = useQuery<{getAllBucket:Bucket[]}>(ALL_BUCKETS)

  return (
    <div className='border col-span-2 rounded-xl flex flex-col bg-white border-slate-400 p-2 overflow-hidden ' >
      <div className="w-full grid grid-cols-4 font-medium text-gray-500 bg-blue-100">
        <div className="pl-2">Buckets</div>
        <div>Assigned</div>
        <div>Present</div>
        <div>FTE %</div>
      </div>
      <div className="w-full flex flex-col h-full overflow-y-auto">
        {
          allBucket?.getAllBucket.map((x)=> {
            const findCampaignAssignedData = campaignAssignedData?.getCampaignAssigned.find(y => y.campaign === x._id)
            const findData = data?.getDailyFTE.find(b => b.campaign === x._id)
            const FTEPercent = (Number(findData?.online) / Number(findCampaignAssignedData?.assigned)) * 100
            return findCampaignAssignedData && (
              <div key={x._id} className="w-full grid grid-cols-4 font-base text-sm text-gray-500 py-0.5 even:bg-slate-100">
                <div className="pl-2">{x.name}</div>
                <div>{findCampaignAssignedData.assigned}</div>
                <div>{findData?.online}</div>
                <div>{isNaN(FTEPercent) ? 0 : FTEPercent.toFixed(2)}%</div>
              </div>
            )
          } )
        }
      </div>
    </div>
  )
}

export default DailyFTE