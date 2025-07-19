
import CallsRatings from "./CallsRatings"
import CampaignStats from "./CampaignStats"
import DailyFTE from "./DailyFTE"

import PaidBar from "./PaidBar"
import PTPBar from "./PTPBar"
import PTPKept from "./PTPKept"



const AomDashboard = () => {


  return (
    <div className="h-full p-2 grid grid-rows-4 grid-cols-7 bg-slate-200 gap-2 overflow-hidden">
  

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


      <div className="bg-white row-span-2 col-span-3 rounded-xl border border-slate-300 p-2 flex flex-col">
        <CampaignStats/>
      </div>
    
      <DailyFTE/>

      <CallsRatings/>
 

    </div>
  )
}

export default AomDashboard
