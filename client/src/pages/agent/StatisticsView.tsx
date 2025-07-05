import AgentTimer from "./AgentTimer"
import DailyCollections from "./DailyCollections"
import MixedChartView from "./MixedChartView"
import MixedChartMonthView from "./MixedChartMonthView"
import OverallPerformance from "./OverallPerformance"
import AgentTotalProduction from "./AgentTotalProduction"

const StatisticsView = () => {

  return (
    <div className="flex flex-col p-2 h-full gap-2 bg-slate-200 overflow-hidden">
      <div className="p-3">
        <AgentTimer/>
      </div>
      <div className=" h-full w-full grid grid-cols-9 grid-rows-4 gap-2 overflow-hidden">
        <div className="row-span-2 col-span-3 grid grid-rows-2 gap-2">
          <DailyCollections/>
          <AgentTotalProduction/>
        </div>
    
        <MixedChartView/>
   
 
        <MixedChartMonthView/>
  
 
        <OverallPerformance/>
  
      </div>
    </div>
  )
}

export default StatisticsView