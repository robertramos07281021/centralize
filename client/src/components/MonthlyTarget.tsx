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

const MonthlyTarget = () => {
  const {data:aomDeptData} = useQuery<{getAomDept:AomDept[] }>(AOM_DEPT)
  const {data:monthlyTargetData} = useQuery<{getMonthlyTarget:MonthlyTarget[]}>(MONTHLY_TARGET)

  return (
    <>
      <h1 className="font-medium text-slate-500 lg:text-xs 2xl:text-sm">Monthly Target</h1>
      <div className="lg:h-70 2xl:h-80 overflow-x-auto lg:text-[0.6em] 2xl:text-xs text-slate-500">
        {
          aomDeptData?.getAomDept.map(e=> {
            const findMonthlyTarget = monthlyTargetData?.getMonthlyTarget.find(t => e.id === t.campaign)
            
          return (
            <div key={e.id} className="flex flex-col gap-2 hover:bg-blue-50 cursor-default py-2 odd:bg-slate-100">
              <div className="text-center font-medium">{e.name}</div>
              <div className="flex justify-center items-center flex-col">
                <div className="w-8/9 relative">
                  <input type="range" name="shopee_m2_range" id="shopee_m2_range" className="w-full " height={30} max={100} min={1} value={(findMonthlyTarget?.collected || 1)/(findMonthlyTarget?.target || 1) * 100} onChange={()=> {}} />

                <p className="absolute -top-2 left-2 text-black bg-white rounded-full text-[0.8em]">{((findMonthlyTarget?.collected || 1)/(findMonthlyTarget?.target || 1) * 100).toFixed(2)}%</p>
                </div>
                <h1 className="text-center">{(findMonthlyTarget?.collected || 1).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })} / {(findMonthlyTarget?.target || 1).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</h1>
              </div>
            </div>
           )
          })
        }

      </div>
    </>
  )
}

export default MonthlyTarget