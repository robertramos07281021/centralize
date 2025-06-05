import { gql, useQuery } from "@apollo/client"

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
interface MonthlyTarget {
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

  const {data:aomDeptData} = useQuery<{getAomDept:AomDept[] }>(AOM_DEPT)
  const {data:monthlyTargetData} = useQuery<{getMonthlyTarget:MonthlyTarget[]}>(MONTHLY_TARGET)

  console.log(aomDeptData)
  console.log(monthlyTargetData)
  return (
    <>
      <h1 className="font-medium text-slate-500 lg:text-xs 2xl:text-sm">Campaign Daily Statistics</h1>
      <div className="lg:h-70 2xl:h-80 overflow-y-auto lg:text-[0.6em] 2xl:text-xs text-slate-500 ">
        <div className="flex">
          <h1>Campaign</h1>
          <h1>PTP Rate</h1>
          <h1>PKR</h1>
          <h1>ACR</h1>
          <h1>CR</h1>
          <h1></h1>
        </div>

      </div>
    </>
  )
}

export default CampaignStats




