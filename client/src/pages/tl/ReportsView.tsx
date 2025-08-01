import { gql, useQuery } from "@apollo/client"
import { useCallback, useEffect, useState } from "react"
import { Doughnut } from 'react-chartjs-2';
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
        _id
        code
        name
        count
        amount
      }
      callfile {
        _id
        name
        totalPrincipal
        totalAccounts
      }
      RFD {
        _id
        count
      }
    }
  }
`

type Callfile = {
  _id: string
  name: string
  totalAccounts: number
  totalPrincipal: number
}

type RFD = {
  _id: string
  count: number
}

type Dispositions = {
  code: string
  count: number
  color: string
}

type DispositionType = {
  _id: string
  name: string
  code: string
  count: string
  amount: number
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
  callfile: Callfile
  RFD: RFD[]
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

type SearchFilter = {
  agent: string
  disposition : string[]
  from: string
  to: string
  callfile: String
}

type Props = {
  search: Search
}

const ReportsView:React.FC<Props> = ({search}) => {

  const [dispositionData, setDispositionData] = useState<Dispositions[]>([])
  const [newReportsDispo, setNewReportsDispo] = useState<Record<string,number>>({})
  const [searchFilter, setSearchFilter] = useState<SearchFilter>()

  useEffect(()=> {
    setSearchFilter({
      agent:search.searchAgent, 
      disposition: search.selectedDisposition, 
      from:search.dateDistance.from, 
      to:search.dateDistance.to, 
      callfile:search.callfile
    })
  },[search])

  const {data:reportsData, loading:reportLoading, refetch} = useQuery<{getDispositionReports:Reports}>(GET_DISPOSITION_REPORTS,{
    variables: { reports: searchFilter },
    fetchPolicy: 'network-only',
  })
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
  
  console.log(reportsData)
  useEffect(()=> {
    const reportsDispo:{[key: string]: number} = {};
    if(reportsData) {
      reportsData.getDispositionReports.disposition.forEach((element: DispositionType) => {
        reportsDispo[element.code] = element.count ? Number(element.count) : 0;
      });
      setNewReportsDispo(reportsDispo)
    }
  },[reportsData])
  const positive = ['PTP','FFUP','UNEG','RTP','PAID','DISP','LM','HUP','WN']

  useEffect(()=> {
    if (disposition?.getDispositionTypes) {
      const updatedData = disposition.getDispositionTypes.map((e) => ({
        code: e.code,
        count: Number(newReportsDispo[e.code]) ? Number(newReportsDispo[e.code]) : 0 ,
        color: positive.includes(e.code) ? `oklch(62.7% 0.194 149.214)` : `oklch(63.7% 0.237 25.331)`, 
      }));
      setDispositionData(updatedData);
    }
  },[disposition,newReportsDispo])

  const dispositionCount = useCallback((code:string) =>  {
    const newFilter = dispositionData?.filter((e)=> e.code === code)
    return newFilter[0]?.count
  },[dispositionData])

  const percentageOfDispo = useCallback((code:string)=> {
    const newFilter = dispositionData.filter(e=> e.code === code)
    return (newFilter[0]?.count / totalAccounts) * 100 
  },[dispositionData])
  const dispoData = reportsData?.getDispositionReports?.disposition || []
  const totalPositiveCalls = (dispoData && dispoData.length > 0) ? dispoData.map(x=> x.count)?.reduce((t,v)=>  t + v) : 0

  const positiveCalls = reportsData && reportsData?.getDispositionReports?.disposition.length > 0 ? reportsData?.getDispositionReports?.disposition?.filter(x=> positive.includes(x.code)) : []
  const negativeCalls = dispoData && dispoData?.length > 0 ? dispoData?.filter(x=> !positive.includes(x.code)) : []

  const filteredPositive = positiveCalls.length > 0 ? positiveCalls?.map(y=> y.count)?.reduce((t,v)=> t + v) : []
  const filteredNegative = negativeCalls.length > 0 ? negativeCalls?.map(y=> y.count)?.reduce((t,v)=> t + v) : []

  const totalAccounts = reportsData && reportsData?.getDispositionReports?.callfile?.totalAccounts || 0
  const dataLabels = ['Negative Calls','Positive Calls','Unconnected Calls']
  const dataCount = [isNaN(Number(filteredNegative)) ? 0: Number(filteredNegative) , isNaN(Number(filteredPositive)) ? 0 :Number(filteredPositive) , Number(totalAccounts - Number(totalPositiveCalls))] 
  const dataColor = [ `oklch(63.7% 0.237 25.331)`,`oklch(62.7% 0.194 149.214)`, `oklch(44.6% 0.043 257.281)`,]
 
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
          size: 14,
        },
        formatter: (value: number) => {
          const percentage = ((value / totalAccounts) * 100).toFixed(2);
          return value === 0 ? "" : `${percentage}%`
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const currentValue = context.raw as number;
            const percentage = ((currentValue / totalAccounts ) * 100).toFixed(2);
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
    <div className={` col-span-2 flex flex-col overflow-auto relative h-5/6 px-5`}>
      <div className="text-center sticky bg-white top-0 uppercase font-medium 2xl:text-lg lg:text-base text-slate-500 flex item-center justify-center gap-5 py-5 ">
        <>
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
        </>
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex justify-between w-full h-full pr-5">
          <div className="w-full flex justify-center item-center flex-col ">
            <div  className="flex flex-col justify-center min-h-5/6">
              {
                reportsData?.getDispositionReports.disposition.map(dd=> {
                  const findDispotype = disposition?.getDispositionTypes.find(x=> x.code === dd.code)
          
                  return (
                    <div key={dd._id} className="lg:text-xs 2xl:text-base text-slate-900 font-medium grid grid-cols-3 gap-2 py-0.5 hover:scale-105 cursor-default hover:font-bold">
                    <div style={{backgroundColor: `${positive.includes(dd?.code) ? `oklch(62.7% 0.194 149.214)` : `oklch(63.7% 0.237 25.331)`}`}} className="px-2">{dd.code} </div>
                    <div>{findDispotype?.name}</div>
                    <div className="text-center">{dispositionCount(dd.code)} - {percentageOfDispo(dd.code).toFixed(2)}%</div>
                  </div>
                  )
                })
              }
            </div>
           
          </div>
          <div className="w-5/10 flex justify-center min-h-96 max-h-120">
            <Doughnut data={data} options={options} />
          </div>
        </div>
        <div className="flex flex-col gap-5 py-5">
          <table className="border-collapse border border-black w-2/6">
            <tbody>
              <tr className="border border-black">
                <th className="w-1/2 py-0.5 bg-blue-600 text-white border-black border">Total Endorsement</th>
                <td className="w-1/2 text-center font-medium text-slate-900">{reportsData?.getDispositionReports.callfile.totalAccounts ?? 0}</td>
              </tr>
              <tr className="border-black border">
                <th className="w-1/2 py-0.5 bg-blue-600 text-white border-black border">Total Principal</th>
                <td className="w-1/2 text-center font-medium text-slate-900">{reportsData?.getDispositionReports.callfile.totalPrincipal.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) ?? (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</td>
              </tr>
              <tr className="border-black border">
                <th className="w-1/2 py-0.5 bg-blue-600 text-white border-black border">Contactable Rate</th>
                <td className="w-1/2 text-center font-medium text-slate-900">{(Number(filteredPositive) / Number(reportsData?.getDispositionReports.callfile.totalAccounts) * 100).toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>
          
          <table className="border border-collapse border-black w-2/6">
            <tbody className="text-center">
              <tr className="border-black border">
                <th className="w-1/3 py-0.5 bg-blue-600 text-white border-black border" rowSpan={2}>Calling Status</th>
                <td className="w-50 py-0.5 bg-blue-600 text-white border-black border font-medium ">Positive Call</td>
                <td className="w-50 border-black border bg-blue-600 text-white font-medium">Negative Calls</td>
              </tr>
              <tr className="border-black border">
                <td className="py-0.5 border text-slate-900 font-medium">{filteredPositive}</td>
                <td className="border text-slate-900 font-medium">{Number(reportsData?.getDispositionReports?.callfile?.totalAccounts) - Number(filteredPositive)}</td>
              </tr>
            </tbody>
          </table>

          <table>
            <thead className="border-collapse border border-black">
              <tr>
                <th colSpan={5} className="border border-black bg-blue-600 text-white">Positive Calls Status</th>
              </tr>
            </thead>
            <tbody className="text-center">
              <tr className="text-gray-700">
                <th className="border border-black">Disposition</th>
                <th className="border border-black">Count</th>
                <th className="border border-black">Count Percentage</th>
                <th className="border border-black">Total Principal</th>
                <th className="border border-black">Principal Percentage</th>
              </tr>    
                {
                positiveCalls?.map((x,index) => {
                  const reducerPositiveCallsAmount = positiveCalls.length > 0 ? positiveCalls.map(x=> x.amount).reduce((t,v)=> t + v) : 0
                  const reducerPositiveCallsCount = positiveCalls.length > 0 ? positiveCalls.map(y=> y.count).reduce((t,v)=> t + v) : 0
                  const principalPercent = (x.amount / reducerPositiveCallsAmount) * 100
                  const countPersent = (Number(x.count) / Number(reducerPositiveCallsCount)) * 100
                  return (
                    <tr key={index}>
                      <td className="border border-black">{x.name}</td>
                      <td className="border border-black">{x.count}</td>
                      <td className="border border-black">{countPersent.toFixed(2)}%</td>
                      <td className="border border-black">{x.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</td>
                      <td className="border border-black">{principalPercent.toFixed(2)}%</td>
                    </tr>
                  )
                })
              }
              <tr className="font-medium">
                <th className="border border-black bg-green-600 text-white">Total</th>
                <td className="border border-black">{filteredPositive}</td>
                <td className="border border-black">100%</td>
                <td className="border border-black">{positiveCalls?.map(x=> x.amount).reduce((t,v)=> t + v ).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) ?? 0}</td>
                <td className="border border-black">100%</td>
              </tr>
            </tbody>
          </table>

          <table>
            <thead className="border-collapse border border-black">
              <tr>
                <th colSpan={5} className="border border-black bg-blue-600 text-white">Negative Calls Status</th>
              </tr>
            </thead>
            <tbody className="text-center">
              <tr className="text-gray-700">
                <th className="border border-black">Disposition</th>
                <th className="border border-black">Count</th>
                <th className="border border-black">Count Percentage</th>
                <th className="border border-black">Total Principal</th>
                <th className="border border-black">Principal Percentage</th>
              </tr>    
                {
                negativeCalls?.map((x,index) => {
                  const reducerNegativeCallsAmount = negativeCalls.length > 0 ? negativeCalls.map(x=> x.amount).reduce((t,v)=> t + v) : 0
                  const reducerNegativeCallsCount = negativeCalls.length > 0 ? negativeCalls.map(y=> y.count).reduce((t,v)=> t + v) : 0
                  const principalPercent = (x.amount / reducerNegativeCallsAmount) * 100
                  const countPersent = (Number(x.count) / Number(reducerNegativeCallsCount)) * 100
                  return (
                    <tr key={index}>
                      <td className="border border-black">{x.name}</td>
                      <td className="border border-black">{x.count}</td>
                      <td className="border border-black">{countPersent.toFixed(2)}%</td>
                      <td className="border border-black">{x.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</td>
                      <td className="border border-black">{principalPercent.toFixed(2)}%</td>
                    </tr>
                  )
                })
              }
              <tr className="font-medium">
                <th className="border border-black bg-green-600 text-white">Total</th>
                <td className="border border-black">{filteredNegative}</td>
                <td className="border border-black">100%</td>
                <td className="border border-black">{negativeCalls?.map(x=> x.amount).reduce((t,v)=> t + v ).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) ?? 0}</td>
                <td className="border border-black">100%</td>
              </tr>
            </tbody>
          </table>

          <table className="w-1/2">
            <thead>
              <tr>
                <th colSpan={3} className="border border-black bg-blue-600 text-white">EOD</th>
              </tr>

            </thead>
            <tbody className="text-center">
              <tr className="text-gray-700">
                <th className="border border-black">Reason For Delay</th>
                <th className="border border-black">Count</th>
                <th className="border border-black">Percentage</th>
              </tr>
                {
                  reportsData?.getDispositionReports.RFD.map((x,index)=> {
                    const filter = reportsData?.getDispositionReports.RFD.filter(x=> x._id !== null)
                    const totals = filter.map(x=> x.count).reduce((t,v)=> t + v)
                    const percents = (x.count / totals) * 100
                    return x._id && (
                      <tr key={index} className="text-gray-700 text-center">
                        <td className="border border-black">{x._id}</td>
                        <td className="border border-black">{x.count}</td>
                        <td className="border border-black">{percents.toFixed(2)}%</td>
                      </tr> 
                    )
                  })
                }
                <tr className="font-medium">
                  <td className="border border-black bg-green-600 text-white">Total</td>
                  <td className="border border-black">{reportsData?.getDispositionReports.RFD.filter(x=> x._id !== null).map(x=> x.count).reduce((t,v)=> t + v)}</td>
                  <td className="border border-black">100%</td>
                </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>  
  )
}

export default ReportsView