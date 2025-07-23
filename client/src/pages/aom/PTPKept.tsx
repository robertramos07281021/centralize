import { Chart } from 'react-chartjs-2'
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';
import { ChartData, ChartDataset, ChartOptions } from 'chart.js';
import { useEffect } from 'react';



type AomDept = {
  id: string
  name: string
}

const AOM_DEPT = gql`
  query getAomDept {
    getAomDept {
      id
      name
    }
  }
`

type PTPKeptPerDay = {
  campaign: string
  calls: number
  sms: number
  email: number
  field: number
  skip: number
  total: number
}


const PTP_KEPT_PER_DAY = gql`
  query getAOMPTPKeptPerDay {
    getAOMPTPKeptPerDay {
      campaign
      calls
      sms
      email
      field
      skip
      total
    }
  }
`

const oklchColors = [
  'oklch(60% 0.15 216)',
  'oklch(60% 0.15 288)',
  'oklch(60% 0.15 0)',
  'oklch(60% 0.15 144)',
  'oklch(60% 0.15 72)',
];

const PTPKept = () => {
  const {data:ptpKeptData, refetch:ptpKeptRefetch} = useQuery<{getAOMPTPKeptPerDay:PTPKeptPerDay[]}>(PTP_KEPT_PER_DAY)
  const {data:aomDeptData, refetch:aomDeptRefetch} = useQuery<{getAomDept:AomDept[] }>(AOM_DEPT)

  useEffect(()=> {
    ptpKeptRefetch()
    aomDeptRefetch()
  },[])

  
  const fields: {
        label: string;
        key: keyof PTPKeptPerDay;
        color: string;
        type: "bar" | "line";
      }[]= [
        { label: "Calls", key: "calls", color: oklchColors[0], type: "bar" },
        { label: "SMS", key: "sms", color: oklchColors[1], type: "bar" },
        { label: "Email", key: "email", color: oklchColors[2], type: "bar" },
        { label: "Skip", key: "skip", color: oklchColors[3], type: "bar" },
        { label: "Field", key: "field", color: oklchColors[4], type: "bar" },
        { label: "Total", key: "total", color: "#000", type: "line" },
      ];
  
    const datasets:ChartDataset<'bar' | 'line',number[]>[] = fields.map(({label, key, color, type})=> {
      const datasets = {
        type,
        label,
        data: aomDeptData?.getAomDept.map((e) => {
          const findDept = ptpKeptData?.getAOMPTPKeptPerDay.find(y => y.campaign === e.id)
          return findDept ? findDept[key] : 0
        }),
        ...(type === "line"
          ? {
              borderColor: color,
              borderWidth: 0.8,
              fill: false,
              tension: 0.4,
              yAxisID: "y1",
            }: {
          backgroundColor: color,
        })
      // ...( {
      //     backgroundColor: color,
      //   }),
      }
      return datasets as ChartDataset<'bar' | 'line', number[]>
    })
  
    const dataPerDay: ChartData<"bar" | 'line', number[], unknown> = {
      labels: aomDeptData?.getAomDept.map(e=> e.name),
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
            text: `Daily PTP Kept`,
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
    <Chart type='bar' data={dataPerDay} options={optionPerDay}/>
  )
}

export default PTPKept