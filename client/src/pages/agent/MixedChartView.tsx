import { color, date, month } from "../../middleware/exports"
import { ChartData, ChartDataset, ChartOptions } from "chart.js"
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';
import { useEffect } from 'react';
import { Chart } from "react-chartjs-2";


type AgentProdPerDay = {
  skip: number
  sms: number
  email: number
  calls: number
  field: number
  total: number
  date: number
  ptp: number
  ptp_kept: number
  paid: number
}

const AGENT_PER_DAY_PROD = gql`
  query getAgentProductionPerDay {
    getAgentProductionPerDay {
      skip
      sms
      email
      calls
      field
      total
      date
      ptp
      ptp_kept
      paid
    }
  }
`

// const oklchColors = [
//   'oklch(60% 0.15 216)',
//   'oklch(60% 0.15 288)',
//   'oklch(60% 0.15 0)',
//   'oklch(60% 0.15 144)',
//   'oklch(60% 0.15 72)',
// ];


const MixedChartView = () => {
  const {data:agentProdPerDayData, refetch:PerDayRefetch} = useQuery<{getAgentProductionPerDay:AgentProdPerDay[]}>(AGENT_PER_DAY_PROD)

  useEffect(()=> {
  PerDayRefetch()
  },[PerDayRefetch])

  function getDaysInMonth(): number {
    const currentMonth = new Date().getMonth();
    return date[month[currentMonth]];
  }

  function getDayLabels(): number[] {
    return Array.from({ length: getDaysInMonth() }, (_, i) => i + 1);
  }

  const daysInMonth = getDaysInMonth();
  const prodData = agentProdPerDayData?.getAgentProductionPerDay || [];

  const fields: {
    label: string;
    key: keyof AgentProdPerDay;
    color: string;
    type: "bar" | "line";
  }[]= [
    // { label: "Calls", key: "calls", color: oklchColors[0], type: "bar" },
    // { label: "SMS", key: "sms", color: oklchColors[1], type: "bar" },
    // { label: "Email", key: "email", color: oklchColors[2], type: "bar" },
    // { label: "Skip", key: "skip", color: oklchColors[3], type: "bar" },
    // { label: "Field", key: "field", color: oklchColors[4], type: "bar" },
    { label: "PTP", key: "ptp", color: color[2], type: "bar" },
    { label: "PTP Kept", key: "ptp_kept", color: color[7], type: "bar" },
    { label: "Amount Collected", key: "paid", color: color[15], type: "bar" },
    { label: "Total", key: "total", color: "#000", type: "line" },
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

  const optionPerDay:ChartOptions<'bar'| 'line'> = { 
    plugins: {
      datalabels:{
        display:false
      },
      legend: {
        display: true,
        labels: {
          font: {
            size: 8,
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
        ticks: {
          font: {
            size: 10,
          },
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
    responsive: true, 
    maintainAspectRatio: false
  }

  return (
    <div className="border flex rounded-lg border-slate-200 col-span-6 row-span-2 p-2 shadow-md shadow-black/20 bg-white">
      <Chart type="bar" data={dataPerDay} options={optionPerDay} />
    </div>
  
  )
}

export default MixedChartView


