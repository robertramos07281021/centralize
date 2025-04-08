
import { Chart, registerables } from 'chart.js';
import PerDayDispositionSection from './PerDayDispositionSection';
import DoughnutSection from './DoughnutSection';
import DispositionSection from './DispositionSection';
import AgentDisposition from './AgentDisposition';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);


const TlDashboard  = () => {

  const Disposition = [
    { code: "BS", count: 4},
    { code: "ITP", count: 6},
    { code: "RC", count: 7},
    { code: "AM", count: 7},
    { code: "FUP", count: 8},
    { code: "LM", count: 3},
    { code: "RHU", count: 5},
    { code: "WN", count: 9},
    { code: "FV", count: 5},
    { code: "P", count: 9},
    { code: "RTP", count: 10},
    { code: "NA", count: 8},
    { code: "HU", count: 6},
    { code: "PTP", count: 12},
    { code: "U", count: 6},
  ]

  const count = Disposition.map((d)=> d.count).reduce((total, value)=> {return total+value })
 
  return (
    <div className="p-5 grid grid-rows-7 bg-slate-600/4 grid-cols-8 gap-5 h-full">
      <AgentDisposition/>
      <PerDayDispositionSection/>
      <div className="row-span-3 text-xs">
        {
          Disposition?.map((d,index)=> 
            <div key={index} className='grid grid-cols-5 py-0.5 text-slate-500'>
              <div className='font-medium'>{d.code}</div>
              <div>-</div>
              <div>{d.count}</div>
              <div>-</div>
              <div>{((d.count / count)* 100).toPrecision(3)}%</div>
            </div>
          )
        }
      </div>
      <DoughnutSection/>
      <DispositionSection/>
    </div>
  )
}

export default TlDashboard
