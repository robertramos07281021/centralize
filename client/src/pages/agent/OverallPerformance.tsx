import { gql, useQuery } from "@apollo/client"
import { useEffect, useState } from "react"
import { month } from "../../middleware/exports"
import { Radar } from "react-chartjs-2"
import { ChartData } from "chart.js"
import { ChartOptions } from "chart.js"

type AgentTotalDispo = {
  count: number
  dispotype: string
}

const AGENT_TOTAL_DISPO = gql`
  query getAgentTotalDispositions {
    getAgentTotalDispositions {
      count
      dispotype
    }
  }
`

type DispositionType = {
  id: string
  code: string
  name: string
}
const DISPO_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

export default function OverallPerformance () {
  const {data:agentTotalDispoData, refetch:TotalDispoRefetch} = useQuery<{getAgentTotalDispositions:AgentTotalDispo[]}>(AGENT_TOTAL_DISPO)
  const {data:dispotypeData, refetch:DispoTypeRefetch} = useQuery<{getDispositionTypes:DispositionType[]}>(DISPO_TYPES)
  const [datasetsData, setDatasetsData] = useState<number[]>([])


  useEffect(()=> {
    if(dispotypeData) {
      if(agentTotalDispoData) {
        const newArray = dispotypeData.getDispositionTypes.map( e => {
          const count =  agentTotalDispoData.getAgentTotalDispositions.find(y => y.dispotype === e.id) 
          return count ? count?.count : 0 
        })

        setDatasetsData(newArray)
      }


    }
  },[dispotypeData, agentTotalDispoData])


  const data: ChartData<'radar'> = {
    labels: dispotypeData?.getDispositionTypes.map(e=> e.code),
    datasets: [
      {
        label: `Month of ${month[new Date().getMonth()]}`,
        data: datasetsData,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointRadius: (ctx) => {
        const value = ctx.raw;
        return value === 0 ? 0 : 3; // 🔥 hide dot if 0
      },
      },
    ],
  };

  const options:ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false,
      },
    },
    scales: {
      r: {
        angleLines: { display: true },
      },
      
    },
  };


  useEffect(()=> {
    TotalDispoRefetch()
    DispoTypeRefetch()
  },[TotalDispoRefetch,DispoTypeRefetch])

  return (
    <>
      <h1 className="text-slate-500 font-bold text-[0.8em]">Overall Performance</h1>
      <div className="h-73">
        <Radar data={data} options={options}/>
      </div>  
    </>
  )
}

