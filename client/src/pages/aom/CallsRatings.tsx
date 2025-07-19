import { useQuery } from "@apollo/client";
import { ChartOptions } from "chart.js";
import gql from "graphql-tag";
import { Bar } from "react-chartjs-2"
import { ChartDataset } from 'chart.js';

interface ExtendedChartDataset extends ChartDataset<'bar', number[]> {
  raw: number[];
}

const color = [
  "oklch(63.7% 0.237 25.331)",    
  "oklch(70.7% 0.165 254.624)",     
  "oklch(84.1% 0.238 128.85)",     
  "oklch(90.5% 0.182 98.111)",
  "oklch(79.2% 0.209 151.711)",
  "oklch(71.8% 0.202 349.761)"     
]

const CALLFILE = gql`
  query MonthlyDetails {
    monthlyDetails {
      department
      success
      positive
      unconnected
      rpc
    }
  }
`
type Callfile = {
  department: string
  success:number
  positive:number
  unconnected:number
  rpc:number
}


const CallsRatings = () => {

  const {data:callfilesData} = useQuery<{monthlyDetails:Callfile[]}>(CALLFILE) 


  

  const options: ChartOptions<'bar'> = {
    plugins: {
      title: {
        display: true,
        text: 'Monthly Summary',
      },
      datalabels: {
        color: '#000',
        font: {
          size: 7,
          weight: 'bold'
        },
        formatter: (value: number) => `${value.toFixed(2)}%`
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const dataset = context.dataset
            const index = context.dataIndex
            const label = dataset.label || ''
            const percent = context.raw as number
            const rawValue = dataset?.raw[index] ?? 'N/A'
            return `${label}: ${rawValue} (${percent.toFixed(2)}%)`
          }
        }
      },
      legend: {
        display: true,
        labels: {
          font: {
            size: 8,
            family: 'Arial',
            weight: 'bold',
          },
          boxWidth: 20,
          boxHeight: 8,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  }
  
const labels = callfilesData?.monthlyDetails.map(e => e.department) ?? []

const totals = callfilesData?.monthlyDetails.map(e =>
  e.success + e.positive + e.unconnected + e.rpc
) ?? []

const toPercent = (value: number, total: number) =>
  total ? parseFloat(((value / total) * 100).toFixed(2)) : 0

const rawCounts = callfilesData?.monthlyDetails ?? []

const positive = rawCounts.map((e, i) => toPercent(e.positive, totals[i]))
const successful = rawCounts.map((e, i) => toPercent(e.success, totals[i]))
const rpc = rawCounts.map((e, i) => toPercent(e.rpc, totals[i]))
const unconnected = rawCounts.map((e, i) => -toPercent(e.unconnected, totals[i]))


  const datasets: ExtendedChartDataset[] = [
  {
    label: 'Positive Rate',
    data: positive,
    backgroundColor: color[3],
    stack: 'Stack 1',
    raw: rawCounts.map(e => e.positive),
  },
  {
    label: 'Success Rate',
    data: successful,
    backgroundColor: color[1],
    stack: 'Stack 1',
    raw: rawCounts.map(e => e.success),
  },
  {
    label: 'RPC Rate',
    data: rpc,
    backgroundColor: color[1],
    stack: 'Stack 2',
    raw: rawCounts.map(e => e.rpc),
  },
  {
    label: 'Unconnected Rate',
    data: unconnected,
    backgroundColor: color[0],
    stack: 'Stack 3',
    raw: rawCounts.map(e => e.unconnected),
  },
];


  const data = {
    labels,
    datasets
  }

  return (
    <div className="row-start-3 col-start-4 bg-white col-span-full row-span-2 rounded-xl border border-slate-200 shadow-sm shadow-black/20 p-2">
      <Bar options={options} data={data} />
    </div>
  )
}

export default CallsRatings