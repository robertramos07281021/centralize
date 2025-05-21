import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { IoMdArrowDown, IoMdArrowUp  } from "react-icons/io";

interface AomDept {
  id: string
  name: string
}

const AOM_DEPT = gql`
  query getAomDept {
    getAomDept {
      id
      name
    }
  }
`

interface DailyCollection {
  campaign: string
  ptp: number
  ptp_kept: number
  paid: number
  yesterday_ptp : number 
  yesterday_ptp_kept: number
  yesterday_paid: number

}

const AOM_DAILY_COLLECTION = gql`
  query GetAomDailyCollection {
    getAomDailyCollection {
      campaign
      ptp
      ptp_kept
      paid
      yesterday_ptp
      yesterday_ptp_kept
      yesterday_paid
    }
  }

`


const DailyCollection = () => {
  const {data:aomDeptData} = useQuery<{getAomDept:AomDept[] }>(AOM_DEPT)
  const {data:aomDailyCollections} = useQuery<{getAomDailyCollection:DailyCollection[] }>(AOM_DAILY_COLLECTION)

  return (
    <>
      <div className="text-center font-medium text-slate-500 lg:text-xs 2xl:text-sm">
        Daily Collection
      </div>
      <div className="text-center font-medium text-slate-500 lg:text-xs 2xl:text-sm grid grid-cols-4">
        <div>Campaign</div>
        <div>PTP</div>
        <div>PTP Kept</div>
        <div>Paid</div>
      </div>
      <div className="lg:h-70 2xl:h-80 overflow-x-auto lg:text-[0.6em] 2xl:text-xs text-slate-400">
        {
          aomDeptData?.getAomDept.map(ad=> {
            const findCampaignDispo = aomDailyCollections?.getAomDailyCollection.find(e => e.campaign === ad.id)
            
            const diffPTP = (findCampaignDispo?.ptp || 0) - (findCampaignDispo?.yesterday_ptp || 0)
            const diffPTPKept = (findCampaignDispo?.ptp_kept || 0) - (findCampaignDispo?.yesterday_ptp_kept || 0)
            const diffPaid = (findCampaignDispo?.ptp_kept || 0) - (findCampaignDispo?.yesterday_ptp_kept || 0)
            const arrowPTP = diffPTP > 0 ? <IoMdArrowUp className="text-green-500" /> : <IoMdArrowDown className="text-red-500" />
            const arrowPTPKept = diffPTPKept > 0 ? <IoMdArrowUp className="text-green-500" /> : <IoMdArrowDown className="text-red-500" />
            const arrowPaid = diffPaid > 0 ? <IoMdArrowUp className="text-green-500" /> : <IoMdArrowDown className="text-red-500" />
            return (
              <div key={ad.id} className="grid grid-cols-4 text-center hover:bg-blue-50 cursor-default py-0.5">
                <div>{ad.name}</div>
                <div className="flex justify-center items-center"><span>{findCampaignDispo?.ptp.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) || (0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span> {arrowPTP} </div>
                <div className="flex justify-center items-center"><span>{findCampaignDispo?.ptp_kept.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) || (0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span> {arrowPTPKept} </div>
                <div className="flex justify-center items-center"><span>{findCampaignDispo?.paid.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) || (0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</span>{arrowPaid} </div>
              </div>
            )
          })
        }


      </div>
    
    </>
  )
}

export default DailyCollection