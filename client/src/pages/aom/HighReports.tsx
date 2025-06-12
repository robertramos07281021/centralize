import { gql, useQuery } from "@apollo/client"
import { ChartOptions } from "chart.js"
import { useEffect, useState } from "react"
import { Doughnut } from "react-chartjs-2"
import ReportsView from "./ReportsView"
import { useAppDispatch } from "../../redux/store"
import { setServerError } from "../../redux/slices/authSlice"

// interface DispoType {
//   id:string
//   name: string
//   code: string
// }

// const GET_DISPOSITION_TYPES = gql`
//   query getDispositionTypes {
//     getDispositionTypes {
//       id
//       name
//       code
//     }
//   }
// `

interface AomDept {
  branch: string
  id: string
  name: string
}

const GET_AOM_DEPT = gql`
  query Query {
    getAomDept {
      branch
      id
      name
    }
  }
`

// interface DeptBucket {
//   id: string
//   name: string
// }

// const GET_DEPT_BUCKET = gql`
//   query findDeptBucket($dept: ID) {
//     findDeptBucket(dept: $dept) {
//       id
//       name
//     }
//   }
// `

interface Variables  {
  campaign: string
  bucket: string
  from: string
  to: string
}

interface modalProps {
  setCampaign: (e:string)=> void
  reportsVariables: Variables
  setReportVariables: (e:string) => void
}

  interface PerformanceStatistic {
    campaign: string
    totalAccounts: number
    connectedAccounts: number
    targetAmount: number
    collectedAmount: number
    ptpKeptAccount: number
    paidAccount: number
    attendanceRate: number
  }


const MONTHLY_PERFORMANCE = gql`
  query GetMonthlyPerformance {
    getMonthlyPerformance {
      campaign
      totalAccounts
      connectedAccounts
      targetAmount
      collectedAmount
      ptpKeptAccount
      paidAccount
      attendanceRate
    }
  }
`


const HighReports:React.FC<modalProps> = ({setCampaign, reportsVariables, setReportVariables}) => {
  const dispatch = useAppDispatch()
  const {data:aomDeptData, error:aomDeptError} = useQuery<{getAomDept:AomDept[]}>(GET_AOM_DEPT)
  // const {data:dispoTypes} = useQuery<{getDispositionTypes:DispoType[]}>(GET_DISPOSITION_TYPES) 
  const {data:monthlyPerformance, error:monthlyPerError} = useQuery<{getMonthlyPerformance: PerformanceStatistic[]}>(MONTHLY_PERFORMANCE)
  const [searchAnimation, setSearchAnimation] = useState<boolean>(false)
  const [animation, setAnimation] = useState(false)

  useEffect(()=> {
    if(aomDeptError || monthlyPerError){
      const isError = [
        monthlyPerError,
        aomDeptError
      ]
      dispatch(setServerError(true))
      console.log("Error in HighReports: ", isError.filter(e=> e !== undefined))
    }
  },[dispatch,monthlyPerError,aomDeptError])


  const [deptId, setDeptId] = useState<{[key: string]: string}>({})
  useEffect(()=> {
    if(aomDeptData){
      const newObject:{[key: string]:string} = {}
      aomDeptData?.getAomDept?.map((e)=> {
        newObject[e.id] = e.name
      })
      setDeptId(newObject)
    } 
  },[aomDeptData])

  useEffect(()=> {
    if(!animation) {
      setTimeout(()=> {
        setAnimation(true)
      })
    }
  },[animation])

  const onClickPanel = (e:string)=> {
    setSearchAnimation(true)

    setTimeout(()=> {
      setCampaign(deptId[e]); 
      setReportVariables(e)
    },1000)
  }

  
  return (
    <div className="w-10/12 h-full overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-2">
      {
        reportsVariables.campaign ? 
        <ReportsView variables={reportsVariables}/>
        : 
        <>
        {
          monthlyPerformance?.getMonthlyPerformance.map((e)=> {
            const data = {
              labels: ['Collected', 'Missing Target'],
              datasets: [
                {
                  label: 'Amount',
                  data: [e.collectedAmount,e.targetAmount - e.collectedAmount],
                  backgroundColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                  ],
                  borderWidth: 1,
                },
              ],
            };
            
            const options:ChartOptions<'doughnut'> = {
              plugins: {
                datalabels: {
                  color: 'oklch(0 0 0)',
                  font: {
                    weight: "bold", 
                    size: 8,
                  } as const,
                  formatter: (value: number) => {
                    return (
                      (value/e.targetAmount * 100).toFixed(2) + '%'
                  )}
                },
                legend: {
                  position: 'bottom' as const,
                  display: false
                },
                title: {
                  display: true,
                    font: {
                    size: 10,
                    family: 'Arial',
                    weight: 'bold',
                  
                  },
                  color: '#000',
                  text: `${deptId[e.campaign]}`,
                },
              },
              responsive: true,
              maintainAspectRatio: false,
            };
  
            const colorMapBar:{[key:string]:string}  = {
              red: "bg-red-400",
              orange: 'bg-orange-400',
              blue: 'bg-blue-400',
              green: 'bg-green-400',
            }

            const colorMap:{[key:string]:string} ={
              red: "border-red-400 shadow-red-500 text-red-400",
              orange: 'border-orange-400 shadow-orange-500 text-orange-400',
              blue: 'border-blue-400 shadow-blue-500 border-blue-800 text-blue-400',
              green: 'border-green-400 shadow-green-500 text-green-400',
            }

            const PerformanceStats:{
              title: string;
              key1: keyof PerformanceStatistic;
              key2: keyof PerformanceStatistic;
              color: string
            }[] = [
              {
                title: "Connection Rate:", key1: "connectedAccounts", key2: "totalAccounts", color: "red" 
              },
              {
                title: "Attendance Rate:", key1: "attendanceRate", key2: "totalAccounts", color: "orange"
              },
              {
                title: "PTP Kept Rate:" , key1: "ptpKeptAccount", key2: "totalAccounts", color: "blue"
              },
              {
                title: "Amount Collected Rate:" , key1: "paidAccount", key2: "totalAccounts", color: "green"
              },
            ]
            return  (  
              <div key={e.campaign}  className={`border flex h-50 w-full rounded-xl border-slate-200 shadow shadow-black/20 bg-white hover:scale-105 duration-1000 ease-in-out hover:left-5 hover:-top-2/2 hover:ml-10 cursor-pointer ${searchAnimation ? "opacity-0" : "opacity-100"}`} onClick={()=> onClickPanel(e.campaign)}>
                <div className=" h-full grid w-full grid-cols-6">
                  <div className=" p-5 h-full w-full pt-0">
                    <Doughnut data={data} options={options}/>
                  </div>
                  <div className=" col-span-5 p-2 flex flex-col">
                    <h1 className="text-xs font-bold text-gray-600 w-full ">Performance Statistics</h1>
                    <div className="h-full w-full pt-2 grid grid-cols-2 grid-rows-2">
                      {
                        PerformanceStats.map((ps,index) => 
                        {
                          const value1 = e[ps.key1] as number  ;
                          const value2 = ps.key2 ? (e[ps.key2] as number) : 0
                          const ratings = (value1 / value2) * 100 
                          const minimumDisplay = 9;
                          const checkKey = ps.key1 != "attendanceRate" ?  Math.max(ratings, minimumDisplay) : value1

                          return (
                            <div key={index} className="flex flex-col gap-1 ">
                              <h1 className="text-xs font-bold text-slate-500">{ps.title}</h1>
                              <div className={`w-4/6 border ${colorMap[ps.color]} rounded-full h-5 shadow-xl/30 relative`}>
                                <div style={{width: `${animation ? checkKey : 0 }%`}} className={`h-full ${colorMap[ps.color]} w-3/4 rounded-full border flex justify-end cursor-default peer duration-700 ease-in ${colorMapBar[ps.color]}`}>
                                  <p className="text-[0.5em]  font-medium text-slate-800 px-2 rounded-full bg-white  flex items-center justify-center">{ ps.key1 !== "attendanceRate" ? ratings.toFixed(2): value1.toFixed(2)}%</p>
                                </div>
                                {
                                  ps.key1 !== "attendanceRate" &&
                                  <div className={`peer-hover:flex hidden absolute bg-white rounded-xl text-xs py-1 px-3 -translate-y-1/2 -top-full -translate-x-1/2 left-1/2 border border-slate text-${ps.color}-400 font-bold `}>{value1} / {value2}</div>
                                }
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        }
        </>
      } 
    </div>
  )
}

export default HighReports