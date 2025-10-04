import AgentTimer from "./AgentTimer"
import MixedChartView from "./MixedChartView"
import MixedChartMonthView from "./MixedChartMonthView"
import OverallPerformance from "./OverallPerformance"
import DashboardMinis from "./DashboardMinis.tsx"

const StatisticsView = () => {

  return (
    <div className="flex flex-col lg:h-full bg-slate-200 lg:overflow-hidden">
      <div className="p-2">
        <AgentTimer/>
      </div>
      <div className=" h-full w-full grid grid-cols-1 lg:grid-cols-9 lg:grid-rows-4 lg:gap-2 overflow-hidden grid-rows-3 gap-2 p-2">
        <DashboardMinis/>
        <MixedChartView/>
        <MixedChartMonthView/>
        <OverallPerformance/>
      </div>
    </div>
  )
}

export default StatisticsView