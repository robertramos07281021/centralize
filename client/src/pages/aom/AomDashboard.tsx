
import MonthlyTarget from "./MonthlyTarget"
import PaidBar from "./PaidBar"
import PTPBar from "./PTPBar"
import PTPKept from "./PTPKept"



const AomDashboard = () => {


  return (
    <div className="h-full p-2 grid grid-rows-4 grid-cols-5 bg-slate-200 gap-2">
      
{/* 
      <div className="row-start-3 row-span-2 bg-white rounded-xl border border-slate-300 p-2">
        <DailyFTE/>
      </div> */}

      <div className="row-span-4 col-span-3 grid grid-rows-3 gap-2">
        <div className="border bg-white rounded-xl border-slate-300 p-2">
          <PTPBar/>
        </div>
        <div className="border bg-white rounded-xl border-slate-300 p-2">
          <PTPKept/>
        </div>
        <div className="border bg-white rounded-xl border-slate-300 p-2">
          <PaidBar/>
        </div>
      </div>

      <div className="col-start-5 border row-span-2 border-slate-300 bg-white rounded-xl text-center">
        Campaign Statistic
      </div>

      <div className="bg-white row-span-2 rounded-xl border border-slate-300 p-2">
        <MonthlyTarget/>
      </div>
    </div>
  )
}

export default AomDashboard
