
import { Chart, registerables } from 'chart.js';
import PerDayDispositionSection from './PerDayDispositionSection';
import DoughnutSection from './DoughnutSection';
import DispositionSection from './DispositionSection';
import AgentDisposition from './AgentDisposition';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables, ChartDataLabels);


const TlDashboard  = () => {

  return (
    <div className="h-full p-5 grid grid-rows-6 grid-cols-8 bg-slate-600/10  gap-5">
      <AgentDisposition/>
      <PerDayDispositionSection/>
      
      <DoughnutSection/>
      <DispositionSection/>
    </div>
  )
}

export default TlDashboard
