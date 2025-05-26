
import { Chart,
  registerables, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend 
} from 'chart.js';

import ChartDataLabels from 'chartjs-plugin-datalabels';
import ProductionToday from '../../components/ProductionToday';


Chart.register(...registerables,
  ChartDataLabels,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


const TlDashboard  = () => {
  const samplebucket = 3
  return (
    <div className="h-full p-2 grid grid-rows-6 grid-cols-8 bg-slate-600/10  gap-2">
      <ProductionToday/>
      <div className={`${samplebucket > 2 ? "row-start-2" : ""} col-start-4 border col-span-3 row-span-full `}>
        asd
      </div>
      <div>asd</div>



    </div>
  )
}

export default TlDashboard
