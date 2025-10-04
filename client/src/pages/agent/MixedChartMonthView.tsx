import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useMemo } from "react"
import { color, month } from "../../middleware/exports"
import { ChartData, ChartDataset, ChartOptions, Plugin } from "chart.js"
import { Chart } from "react-chartjs-2"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../../redux/store"
import { setServerError } from "../../redux/slices/authSlice"
import { useLocation } from "react-router-dom"

type AgentProdPerMonth = {
    total: number
    month: number
    ptp: number
    ptp_kept: number
    paid: number
    variance: number
}
const AGENT_PER_MONTH_PROD = gql`
  query getAgentProductionPerMonth {
    getAgentProductionPerMonth {
      total
      month
      ptp
      ptp_kept
      paid
    }
  }
`

export default function MixedChartMonthView() {
  const location = useLocation()
  const isAgentDashboard = location.pathname.includes('agent-dashboard')
  const {data:agentProdPerMonthData, refetch:PerMonthRefetch} = useQuery<{getAgentProductionPerMonth:AgentProdPerMonth[]}>(AGENT_PER_MONTH_PROD,{ notifyOnNetworkStatusChange: true , skip: !isAgentDashboard })
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const labelsPermonth =  month.map((m)=> {return m.slice(0,3)})
  const totals = agentProdPerMonthData?.getAgentProductionPerMonth.map((e)=> e.total) || []
  const monthlyTarget = userLogged?.targets.monthly || 0
  const rounded = Math.round(Math.max(...totals)/10000)*10000
  const Max = rounded > monthlyTarget ? rounded : monthlyTarget

  const fields: {
    label: string;
    key: keyof AgentProdPerMonth;
    color: string;
    type: "bar" | "line";
  }[]= [
    { label: "PTP", key: "ptp", color: color[2], type: "bar" },
    { label: "Kept", key: "ptp_kept", color: color[7], type: "bar" },
    // { label: "Paid Collected", key: "paid", color: color[15], type: "bar" },
    // { label: "Collected", key: "total", color: "#000", type: "line" },
    { label: "Variance", key: "variance", color: "red", type: "line" },
  ];

  const newProdData = useMemo(()=> {
    return agentProdPerMonthData?.getAgentProductionPerMonth.map(x=> {
      const theVariance = monthlyTarget - x.ptp_kept

      return {
        ...x,
        variance: theVariance
      }
    })
  },[agentProdPerMonthData,monthlyTarget])

  const prodData = newProdData || []

  const datasets:ChartDataset<'bar' | 'line', number[]>[] = fields.map(({ label, key, color, type }) => ({
    type,
    label,
    data: Array.from({ length: 12 }, (_, i) => {
      const entry:{[key:string]:number} = prodData.find(e => e.month -1 === i ) || {};
      return entry[key] || 0;
    }),
    ...(type === "line"
      ? {
          borderColor: color,
          borderWidth: 0.8,
          fill: false,
          tension: 0.4,
          yAxisID: "y1",
        }
      : {
          backgroundColor: color,
        }),
  }));

  const dataPerMonth:ChartData<'bar' | 'line', number[], unknown> = {
    labels: labelsPermonth,
    datasets
  }

  const customGridLinePlugi:Plugin<'bar' | 'line'> = {
    id: 'customGridLine',
    beforeDraw: (chart) => {
      const { ctx, chartArea: { left, right }, scales: { y } } = chart;
      const yValue =  monthlyTarget;
      const yPixel = y.getPixelForValue(yValue);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(left, yPixel);
      ctx.lineTo(right, yPixel);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'red';
      ctx.stroke();
      ctx.fillStyle = 'red';
      ctx.font = '12px sans-serif';
      ctx.fillText(``, left + 4, yPixel - 4);
      ctx.restore();
    }
  };


  const optionPerMonth:ChartOptions<'bar'| 'line'> = { 
    plugins: {
      datalabels:{
        display:false,
      },
      legend: {
        display: true,
        labels: {
          font: {
            size: 14,
            family: 'Arial',
            weight: 'bold',
          },
        },
      },
      title: {
        display: true,
        text: `Year of ${new Date().getFullYear()}`,
      },     
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        min: 0,
        max: Max + 20000,
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: Max + 20000,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
    responsive: true, 
    maintainAspectRatio: false
  }

  const dispatch = useAppDispatch()

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await PerMonthRefetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })
    return () => clearTimeout(timer)
  },[])

  return (
    <div className="border rounded-lg col-span-1 border-slate-200 lg:col-span-7 lg:row-span-2 p-2 shadow-md shadow-black/20 bg-white">
      <Chart type="bar" data={dataPerMonth} options={optionPerMonth} plugins={[customGridLinePlugi]}/>
    </div>
  )
}


