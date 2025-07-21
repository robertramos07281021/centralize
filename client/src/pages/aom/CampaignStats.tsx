import { gql, useQuery } from "@apollo/client"
import { useEffect } from "react"
import { useAppDispatch } from "../../redux/store"
import { setServerError } from "../../redux/slices/authSlice"

type AomDept = {
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
type MonthlyTarget = {
  campaign: string
  collected: number
  target: number
  ptpCount: number
  pCount: number
  pkCount: number
  ptp: number
  pk: number
  paid: number
}

const MONTHLY_TARGET = gql`
  query GetMonthlyTarget {
    getMonthlyTarget {
      campaign
      collected
      target
      ptpCount
      pkCount
      pCount
      ptp
      pk
      paid
    }
  }
`

const CampaignStats = () => {
  const dispatch = useAppDispatch()
  const {data:aomDeptData, error:aomDeptError} = useQuery<{getAomDept:AomDept[] }>(AOM_DEPT)
  const {data:monthlyTargetData, error:monthlyTargetError} = useQuery<{getMonthlyTarget:MonthlyTarget[]}>(MONTHLY_TARGET)


  useEffect(()=> {
    if(aomDeptError || monthlyTargetError){
      dispatch(setServerError(true))
    }
  },[monthlyTargetError,aomDeptError,dispatch])


  return (
    <div className="bg-white row-span-2 col-span-4 rounded-xl border border-slate-300 p-2 flex flex-col">
      <h1 className="font-medium text-slate-500 lg:text-xs 2xl:text-sm">Campaign Active Callfile Statistics</h1>
      <div className="h-full overflow-y-auto lg:text-[0.6em] 2xl:text-xs text-slate-500">
        <div className="grid grid-cols-9 cursor-default font-medium text-sm lg:text-base">
          <h1>Campaign</h1>
          <h1>PTPCount</h1>
          <h1>PKCount</h1>
          <h1>PCount</h1>
          <h1>PTP</h1>
          <h1>PK</h1>
          <h1>Paid</h1>
          <h1>Collected</h1>
          <h1>Target</h1>
        </div>
        {
          monthlyTargetData?.getMonthlyTarget.map(x=> {

            const findDept = aomDeptData?.getAomDept.find(y=> y.id === x.campaign)

            return (

              <div className="grid grid-cols-9 cursor-default lg:text-xs text-[0.6rem]" key={x.campaign}>
                <h1 className="truncate pr-2" title={findDept?.name}>{findDept?.name}</h1>
                <h1>{x.ptpCount}</h1>
                <h1>{x.pkCount}</h1>
                <h1>{x.pCount}</h1>
                <h1>{(x.ptp || 0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</h1>
                <h1>{(x.pk || 0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</h1>
                <h1>{(x.paid || 0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</h1>
                <h1>{(x.collected || 0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</h1>
                <h1>{(x.target || 0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</h1>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export default CampaignStats




