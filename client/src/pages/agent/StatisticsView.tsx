import AgentTimer from "./AgentTimer"
import DailyCollections from "./DailyCollections"
import MixedChartView from "./MixedChartView"
import MixedChartMonthView from "./MixedChartMonthView"
import DailyOutput from "./DailyOutput"
import OverallPerformance from "./OverallPerformance"

const StatisticsView = () => {

  return (
    <div className="flex flex-col p-2 h-full gap-2 bg-slate-200">
      <div className="p-3">
        <AgentTimer/>
      </div>
      <div className=" h-full w-full grid grid-cols-9 grid-rows-4 gap-2">
        <div className="row-span-4 col-span-3 grid grid-rows-4 gap-2">
          <DailyCollections/>
          <div className="border border-slate-100 row-span-3 bg-white rounded-xl shadow shadow-black/20 p-2 flex flex-col overflow-hidden">
            <DailyOutput/>
          </div>
        </div>

        <div className="border flex rounded-lg border-slate-200 col-span-6 row-span-2 p-2 shadow-md shadow-black/20 bg-white">
          <MixedChartView/>
        </div>
        <div className="border rounded-lg border-slate-200 col-span-4 row-span-2 p-2 shadow-md shadow-black/20 bg-white">
          <MixedChartMonthView/>
        </div>
        <div className="border rounded-lg border-slate-200 col-span-2 row-span-2 shadow-md shadow-black/20 p-2 bg-white flex flex-col">
          <OverallPerformance/>
        </div>
      </div>
    </div>
  )
}

export default StatisticsView