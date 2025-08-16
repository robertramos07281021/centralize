import { color, date, month } from "../../middleware/exports"
import { ChartData, ChartDataset, ChartOptions, Plugin } from "chart.js"
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';
import { useEffect, useMemo } from 'react';
import { Chart } from "react-chartjs-2";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";


type AgentProdPerDay = {
  total: number
  date: number
  ptp: number
  ptp_kept: number
  paid: number
  variance: number
}

const AGENT_PER_DAY_PROD = gql`
  query getAgentProductionPerDay {
    getAgentProductionPerDay {
      total
      date
      ptp
      ptp_kept
      paid
    }
  }
`

const MixedChartView = () => {
  const dispatch = useAppDispatch()
  const {data:agentProdPerDayData, refetch:PerDayRefetch} = useQuery<{getAgentProductionPerDay:AgentProdPerDay[]}>(AGENT_PER_DAY_PROD)
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await PerDayRefetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })
    return () => clearTimeout(timer)
  },[])

  const dailyTargets = userLogged?.targets?.daily || 0

  function getDaysInMonth(): number {
    const currentMonth = new Date().getMonth();
    return date[month[currentMonth]];
  }

  function getDayLabels(): number[] {
    return Array.from({ length: getDaysInMonth() }, (_, i) => i + 1);
  }

  const newProdData = useMemo(()=> {
    return agentProdPerDayData?.getAgentProductionPerDay.map(x=> {
      const theVariance = dailyTargets - (x.total)
      return {
        ...x,
        variance: theVariance
      }
    })
  },[agentProdPerDayData, dailyTargets])

  const daysInMonth = getDaysInMonth();
  const prodData = newProdData || [];
  const totals = prodData.map(e=> e.total)
  const rounded = Math.round(Math.max(...totals)/10000)*10000
  const Max = rounded > dailyTargets ? rounded : dailyTargets
  
  const fields: {
    label: string;
    key: keyof AgentProdPerDay;
    color: string;
    type: "bar" | "line";
  }[]= [
    { label: "PTP", key: "ptp", color: color[2], type: "bar" },
    { label: "PTP Kept", key: "ptp_kept", color: color[7], type: "bar" },
    { label: "Paid Collected", key: "paid", color: color[15], type: "bar" },
    { label: "Collected", key: "total", color: "#000", type: "line" },
    { label: "Variance", key: "variance", color: "red", type: "line" },
  ];

  const datasets:ChartDataset<'bar' | 'line', number[]>[] = fields.map(({ label, key, color, type }) => ({
    type,
    label,
    data: Array.from({ length: daysInMonth }, (_, i) => {
      const entry:{[key:string]:number} = prodData.find(e => e.date - 1 === i) || {};

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

  const dataPerDay: ChartData<"bar" | 'line', number[], unknown> = {
    labels: getDayLabels(),
    datasets,
  };

  const customGridLinePlugi:Plugin<'bar' | 'line'> = {
    id: 'customGridLine',
    beforeDraw: (chart) => {
      const { ctx, chartArea: { left, right }, scales: { y } } = chart;
      const yValue = dailyTargets;
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


  const optionPerDay:ChartOptions<'bar'| 'line'> = { 
    plugins: {
      datalabels:{
        display:false
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
        text: `Month of ${month[new Date().getMonth()]}`,
      },     
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 8,
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

  return (
    <div className="border flex rounded-lg border-slate-200 lg:col-span-6 lg:row-span-2 p-2 shadow-md shadow-black/20 bg-white">
      <Chart type="bar" data={dataPerDay} options={optionPerDay} plugins={[customGridLinePlugi]}  />
    </div>
  
  )
}

export default MixedChartView


