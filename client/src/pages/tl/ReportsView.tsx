import { gql, useQuery } from "@apollo/client"
import { useEffect, useState } from "react"
import { Doughnut } from 'react-chartjs-2';
import { colorDispo } from "../../middleware/exports";
import {  ChartData, ChartOptions } from "chart.js";
import Loading from "../Loading";
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";

const GET_DISPOSITION_REPORTS = gql`
  query GetDispositionReports($reports:SearchDispoReports) {
    getDispositionReports(reports: $reports) {
      agent {
        _id
        name
        branch
        department
        user_id
        buckets
      }
      bucket
      disposition {
        code
        name
        count
      }
    }
  }
`

type Dispositions = {
  code: string
  count: number
  color: string
}

type DispositionType = {
  id: string
  name: string
  code: string
  count: string
}

type Agent = {
  _id: string
  name: string
  branch: string
  department: string
  user_id: string
  buckets: string[]
}

type Reports = {
  agent: Agent
  bucket: string
  disposition: DispositionType[]
}

const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`
type Distance = {
  from: string
  to: string
}

export type Search = {
  searchAgent: string
  searchBucket: string
  selectedDisposition : string[]
  dateDistance: Distance
  callfile: String
}

type Props = {
  search: Search
}

const ReportsView:React.FC<Props> = ({search}) => {
  const [chartFull, setChartFull] = useState(false)
  const handleChartFullScreen = ()=> {
    setChartFull(!chartFull)
  }

  const [dispositionData, setDispositionData] = useState<Dispositions[]>([])
  const [newReportsDispo, setNewReportsDispo] = useState<Record<string,number>>({})

  const reports = {
    agent:search.searchAgent, 
    bucket:search.searchBucket, 
    disposition: search.selectedDisposition, 
    from:search.dateDistance.from, 
    to:search.dateDistance.to, 
    callfile:search.callfile
  }

  const {data:reportsData, loading:reportLoading, refetch} = useQuery<{getDispositionReports:Reports}>(GET_DISPOSITION_REPORTS,{variables: {reports},fetchPolicy: 'network-only'})
  const {data:disposition, refetch:dispoTypesRefetch} = useQuery<{getDispositionTypes:DispositionType[]}>(GET_DISPOSITION_TYPES)
  const dispatch = useAppDispatch()

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await dispoTypesRefetch()
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })
    return () => clearTimeout(timer)
  },[dispoTypesRefetch, refetch])

  useEffect(()=> {
    const reportsDispo:{[key: string]: number} = {};
    if(reportsData) {
      reportsData.getDispositionReports.disposition.forEach((element: DispositionType) => {
        reportsDispo[element.code] = element.count ? Number(element.count) : 0;
      });
      setNewReportsDispo(reportsDispo)
    }
  },[reportsData])

  useEffect(()=> {
    if (disposition?.getDispositionTypes) {
      const updatedData = disposition.getDispositionTypes.map((e) => ({
        code: e.code,
        count: Number(newReportsDispo[e.code]) ? Number(newReportsDispo[e.code]) : 0 ,
        color: colorDispo[e.code] || '#ccc', 
      }));
      setDispositionData(updatedData);
    }
  },[disposition,newReportsDispo])

  const dispositionCount = (code:string) =>  {
    const newFilter = dispositionData?.filter((e)=> e.code === code)
    return newFilter[0]?.count
  }

  const dataLabels = dispositionData.map(d=> d.code)
  const dataCount = dispositionData.map(d => d.count)
  const dataColor = dispositionData.map(d=> d.color)

  const data:ChartData<'doughnut'> = {
    labels: dataLabels,
    datasets: [{
      label: 'Percentage',
      data: dataCount,
      backgroundColor: dataColor,
      hoverOffset: 30,
    }],
  };
  
  const options:ChartOptions<'doughnut'> = {
    plugins: {
      datalabels: {
        color: 'oklch(0 0 0)',
        font: {
          weight: "bold", 
          size: 15,
        },
        formatter: (value: number,context) => {
          const data = context.dataset.data
          const total = data.reduce((sum: number, val: any) => sum + val, 0);
          const percentage = ((value / total) * 100).toFixed(2);
          return value === 0 ? "" : `${percentage}%`
        }
      },
      legend: {
        position: 'bottom',
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const dataset = context.dataset;
            const total = dataset.data.reduce((sum: number, val: any) => sum + val, 0);
            const currentValue = context.raw as number;
            const percentage = ((currentValue / total) * 100).toFixed(2);
            return `Value: ${percentage}% - ${currentValue}`;
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  if(reportLoading) return <Loading/>

  return (
    <div className={`print:hidden col-span-2 flex flex-col ${chartFull ? "fixed top-0 bg-white z-50 items-center justify-center w-full h-full px-10" : "h-5/6"}`}>
      <div className="text-center uppercase font-medium 2xl:text-lg lg:text-base text-slate-500 flex item-center justify-center gap-5 py-5">
      <div>
        {reportsData?.getDispositionReports?.bucket && (
          <span>Bucket: {reportsData.getDispositionReports.bucket}</span>
        )}

        {reportsData?.getDispositionReports?.agent?.name && (
          <h1 className="flex gap-2">Agent Name: {reportsData.getDispositionReports.agent.name}</h1>
        )}

        {search.dateDistance.from && search.dateDistance.to && search.dateDistance.from !== search.dateDistance.to && (
          <div>
            From: {search.dateDistance.from} to {search.dateDistance.to}
          </div>
        )}

        {(
          (!search.dateDistance.from && search.dateDistance.to) ||
          (search.dateDistance.from && !search.dateDistance.to) ||
          (search.dateDistance.from === search.dateDistance.to)
        ) && (search.dateDistance.from || search.dateDistance.to) && (
          <div>
            Date: {search.dateDistance.from || search.dateDistance.to}
          </div>
        )}
      </div>
      </div>

      <div className="flex justify-between w-full h-full pr-5">
        <div className="w-full flex justify-center item-center flex-col ">
          <div  className="flex flex-col justify-center min-h-5/6">
            {disposition?.getDispositionTypes.map((d)=> 
              <div key={d.id}>
              {
                dispositionCount(d.code) !== 0 &&
                <div className="lg:text-xs 2xl:text-base text-slate-900 font-medium grid grid-cols-3 gap-2 py-0.5 hover:scale-105 cursor-default hover:font-bold">
                  <div style={{backgroundColor: `${colorDispo[d.code]}`}} className="px-2">{d.code} </div>
                  <div>{d.name}</div>
                  <div className="text-center">{dispositionCount(d.code)}</div>
                </div>
              }
              </div>
            )}
          </div>
          <div className="flex justify-center mt-10">
            <button type="button" className="bg-blue-500 hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-sm px-5 py-2.5 cursor-pointer" 
            onClick={handleChartFullScreen}
            >{chartFull ? "Minimize" : "Maximize"}</button>
          </div>
        </div>
        <div className="w-5/10 flex justify-center h-full">
          <Doughnut data={data} options={options} />
        </div>
      </div>
    </div>  
  )
}

export default ReportsView