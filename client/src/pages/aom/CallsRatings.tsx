import { useQuery } from "@apollo/client";
import { ChartData, ChartOptions } from "chart.js";
import gql from "graphql-tag";
import { useEffect } from "react";
import { Bar } from "react-chartjs-2"
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";


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
  const dispatch = useAppDispatch()
  const {data:callfilesData,refetch} = useQuery<{monthlyDetails:Callfile[]}>(CALLFILE) 

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })
    return () => clearTimeout(timer)
  },[])

  const totals = callfilesData?.monthlyDetails.map(e =>
  e.success + e.positive + e.unconnected
) ?? []

  const toPercent = (value: number, total: number) =>
  total ? parseFloat(((value / total) * 100).toFixed(2)) : 0
  

  const options: ChartOptions<'bar'> = {
    plugins: {
      title: {
        display: true,
        text: 'Active Callfile Summary',
      },
      datalabels: {
        color: '#000',
        font: {
          size: 10,
          weight: 'bold'
        },
        formatter: (value: number,context) => {
          const dataIndex = context.dataIndex;
          const datasets = context.chart.data.datasets;
          const total = 
            (datasets[0].data?.[dataIndex] as number || 0) +
            (datasets[1].data?.[dataIndex] as number || 0) +
            Math.abs(datasets[3].data?.[dataIndex] as number || 0);

          const percent = total ? (value / total) * 100 : 0;

          return `${percent.toFixed(2)}%`;
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const dataset = context.dataset
            const index = context.dataIndex
            const label = dataset.label || ''
            const percent = context.raw as number
            const rawValue = toPercent(dataset?.data[index] as number,totals[index]) ?? 'N/A'
            return `${label}: ${percent} (${rawValue.toFixed(2)}%)`
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



const rawCounts = callfilesData?.monthlyDetails ?? []

const positive = rawCounts.map((e) => e.positive)
const successful = rawCounts.map((e) => e.success)
const rpc = rawCounts.map((e) => e.rpc)
const unconnected = rawCounts.map((e) => -e.unconnected)

  const datasets= [
  {
    label: 'Positive Rate',
    data: positive,
    backgroundColor: color[3],
    stack: 'Stack 1',
  },
  {
    label: 'Success Rate',
    data: successful,
    backgroundColor: color[1],
    stack: 'Stack 1',

  },
  {
    label: 'RPC Rate',
    data: rpc,
    backgroundColor: color[4],
    stack: 'Stack 2',
    raw: rawCounts.map(e => e.rpc),
  },
  {
    label: 'Unconnected Rate',
    data: unconnected,
    backgroundColor: color[0],
    stack: 'Stack 3',
  },
];


  const data:ChartData<'bar'> = {
    labels,
    datasets
  }

  return (
    <div className="row-start-3  col-start-3 bg-white col-span-full row-span-2 rounded-xl border-slate-200 shadow-sm shadow-black/20 p-2">
      <Bar options={options} data={data} />
    </div>
  )
}

export default CallsRatings