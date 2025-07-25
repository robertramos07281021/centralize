import AgentTimer from "./AgentTimer"
import DailyCollections from "./DailyCollections"
import MixedChartView from "./MixedChartView"
import MixedChartMonthView from "./MixedChartMonthView"
import OverallPerformance from "./OverallPerformance"
import AgentTotalProduction from "./AgentTotalProduction"

const StatisticsView = () => {

  return (
    <div className="flex flex-col p-2 lg:h-full gap-2 bg-slate-200 lg:overflow-hidden">
      <div className="p-3">
        <AgentTimer/>
      </div>
      <div className=" h-full w-full grid grid-cols-1 pb-5 lg:pb-0 lg:grid-cols-9 lg:grid-rows-4 lg:gap-2 overflow-hidden grid-rows-3 gap-y-2">
        <div className="lg:row-span-2 lg:col-span-3 grid grid-rows-2 gap-2">
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