import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useEffect } from 'react'
import {  useAppDispatch } from '../../redux/store'
import { setServerError } from '../../redux/slices/authSlice'

type AomDept = {
  id: string
  name: string
  branch: string
}

const AOM_DEPT = gql`
  query getAomDept {
    getAomDept {
      id
      name
      branch
    }
  }
`

type DailyFTE = {
  campaign: string
  online:number
}

const DAILY_FTE = gql`
  query GetDailyFTE {
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
  query GetCampaignAssigned {
    getCampaignAssigned {
      campaign
      assigned
    }
  }
`

const DailyFTE = () => {
  const dispatch = useAppDispatch()
  const {data:aomDeptData, refetch:aomDeptRefetch} = useQuery<{getAomDept:AomDept[] }>(AOM_DEPT)
  const {data:dailyFTEData, refetch} = useQuery<{getDailyFTE:DailyFTE[]}>(DAILY_FTE)
  
  const {data:campaignedData, refetch:campaignedRefetch} = useQuery<{getCampaignAssigned:CampaignAssigned[]}>(CAMPAIGN_ASSIGNED)

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await campaignedRefetch()
        await refetch()
        await aomDeptRefetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })
    return () => clearTimeout(timer)
  },[campaignedRefetch,refetch, aomDeptRefetch])




  return (
    <div className=" row-span-2 bg-white h-full rounded-xl overflow-hidden border-slate-300 p-2 flex flex-col">
      <h1 className="font-medium text-slate-500 text-center lg:text-xs 2xl:text-sm">Daily FTE</h1>
      <div className="text-center font-medium text-slate-500 lg:text-xs 2xl:text-sm grid grid-cols-3">
        <div>Campaign</div>
        <div>Assigned</div>
        <div>Online</div>
      </div>
      <div className="h-full overflow-y-auto lg:text-[0.6em] 2xl:text-xs text-slate-400">
        {
          aomDeptData?.getAomDept.map(e=> {
            const findFTEOnline = dailyFTEData?.getDailyFTE?.find(cf => cf.campaign === e.id)
            const findFTEAssigned = campaignedData?.getCampaignAssigned.find(ca => ca.campaign === e.id)

            return (
              
              <div key={e.id} className="grid grid-cols-3 text-center hover:bg-blue-50 cursor-default py-0.5">
                <div>{e.name} - {e.branch}</div>
                <div className="flex justify-center items-center"><span>{findFTEAssigned?.assigned || 0}</span> </div>
                <div className="flex justify-center items-center"><span>{findFTEOnline?.online || 0}</span> </div>
              </div>
              
            )
          })  
        }
      </div>
    </div>
  )
}

export default DailyFTE



