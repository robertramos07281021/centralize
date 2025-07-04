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
}

const MONTHLY_TARGET = gql`
  query GetMonthlyTarget {
    getMonthlyTarget {
      campaign
      collected
      target
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
    <>
      <h1 className="font-medium text-slate-500 lg:text-xs 2xl:text-sm">Campaign Daily Statistics</h1>
      <div className="h-full overflow-y-auto lg:text-[0.6em] 2xl:text-xs text-slate-500">
        <div className="grid grid-cols-8">
          <h1>Campaign</h1>
          <h1>PTP Rate</h1>
          <h1>PKR</h1>
          <h1>ACR</h1>
          <h1>CR</h1>
          <h1>asd</h1>
          <h1>asd</h1>
          <h1>asd</h1>
        </div>
      </div>
    </>
  )
}

export default CampaignStats




