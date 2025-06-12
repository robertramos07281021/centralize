
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
import ProductionToday from './ProductionToday';
import TLRightDashboard from './TLRightDashboard';

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
 
  return (
    <div className="h-full overflow-hidden p-2 grid grid-rows-6 grid-cols-8 bg-slate-600/10 gap-2">
      <ProductionToday/>
      <TLRightDashboard/>
    </div>
  )
}

export default TlDashboard
