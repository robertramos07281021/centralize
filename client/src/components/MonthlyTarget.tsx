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



const MonthlyTarget = () => {
  const {data:aomDeptData} = useQuery<{getAomDept:AomDept[] }>(AOM_DEPT)
  

  return (
    <>
      <h1 className="font-medium text-slate-500 lg:text-xs 2xl:text-sm">Monthly Target</h1>
      <div className="lg:h-70 2xl:h-80 overflow-x-auto lg:text-[0.6em] 2xl:text-xs text-slate-500">
        {
          aomDeptData?.getAomDept.map(e=> {
           
          return (
            <div key={e.id} className="flex flex-col gap-2 hover:bg-blue-50 cursor-default py-2 odd:bg-slate-100">
              <div className="text-center font-medium">{e.name}</div>
              <div className="flex justify-center items-center flex-col">
                <div className="w-8/9 relative">
                  <input type="range" name="shopee_m2_range" id="shopee_m2_range" className="w-full " height={30} max={100} min={1} value={30} onChange={()=> {}} />

                <p className="absolute -top-2 left-2 text-black bg-white rounded-full text-[0.8em]">30%</p>
                </div>
                <h1 className="text-center">18000/60000</h1>
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