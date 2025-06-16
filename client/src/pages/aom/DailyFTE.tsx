import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useEffect } from 'react'
import {  useAppDispatch } from '../../redux/store'
import { setServerError } from '../../redux/slices/authSlice'




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

interface DailyFTE {
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

interface CampaignAssigned {
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
  const {data:aomDeptData, error} = useQuery<{getAomDept:AomDept[] }>(AOM_DEPT)
  const {data:dailyFTEData, error:dailyFTEError} = useQuery<{getDailyFTE:DailyFTE[]}>(DAILY_FTE)
  
  const {data:campagnedData, error:campaignAssignedError} = useQuery<{getCampaignAssigned:CampaignAssigned[]}>(CAMPAIGN_ASSIGNED)
  console.log(error)

  useEffect(()=> {
    if(error || dailyFTEError || campaignAssignedError) {
      dispatch(setServerError(true))
    }
  },[error, dailyFTEError, campaignAssignedError,dispatch])

  return (
    <>
      
      <h1 className="font-medium text-slate-500 text-center lg:text-xs 2xl:text-sm">Daily FTE</h1>
      <div className="text-center font-medium text-slate-500 lg:text-xs 2xl:text-sm grid grid-cols-3">
        <div>Campaign</div>
        <div>Assigned</div>
        <div>Online</div>
      </div>
      <div className="lg:h-65 2xl:h-75 overflow-x-auto lg:text-[0.6em] 2xl:text-xs text-slate-400">
          {
            aomDeptData?.getAomDept.map(e=> {
              const findFTEOnline = dailyFTEData?.getDailyFTE?.find(cf => cf.campaign === e.id)
              const findFTEAssigned = campagnedData?.getCampaignAssigned.find(ca => ca.campaign === e.id)

              return (
                
                <div key={e.id} className="grid grid-cols-3 text-center hover:bg-blue-50 cursor-default py-0.5">
                  <div>{e.name}</div>
                  <div className="flex justify-center items-center"><span>{findFTEAssigned?.assigned || 0}</span> </div>
                  <div className="flex justify-center items-center"><span>{findFTEOnline?.online || 0}</span> </div>
                </div>
                
              )
            })  
          }
      </div>
    </>
  )
}

export default DailyFTE