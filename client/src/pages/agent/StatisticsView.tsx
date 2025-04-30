import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useState } from "react"
import { date, month, options } from "../../middleware/exports"
import { Bar } from "react-chartjs-2"


type User = {
  _id: string
  name: string
  user_id: string
}

type Disposition = {
  _id: string
  dispotype: string
  count : number
  collection: number
}

type Production = {
  _id: string
  user: User
  dispositions: Disposition[]
}

const TODAY_DISPOSITION = gql`
  query GetProductions {
    getProductions {
      _id
      user {
        _id
        name
        user_id
      }
      dispositions {
        _id
        dispotype
        count
        collection
      }
    }
  }
`

type DispositionType = {
  id: string
  code: string
  name: string
}
const DISPO_TYPES = gql`
  query Query {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

type AgentProdPerDay = {
  total:number
  date:number
}
const AGENT_PER_DAY_PROD = gql`
  query Query {
    getAgentProductionPerDay {
      total
      date
    }
  }
`

type AgentProdPerMonth = {
  total:number
  month:number
}
const AGENT_PER_MONTH_PROD = gql`
  query Query {
    getAgentProductionPerMonth {
      month
      total
    }
  }

`

type AgentTotalDispo = {
  count: number
  dispotype: string
}

const AGENT_TOTAL_DISPO = gql`
  query Query {
    getAgentTotalDispositions {
      count
      dispotype
    }
  }
`

const StatisticsView = () => {
  const {data:productionData} = useQuery<{getProductions:Production}>(TODAY_DISPOSITION)
  const {data:dispotypeData} = useQuery<{getDispositionTypes:DispositionType[]}>(DISPO_TYPES)
  const {data:agentProdPerDayData} = useQuery<{getAgentProductionPerDay:AgentProdPerDay[]}>(AGENT_PER_DAY_PROD)
  const {data:agentProdPerMonthData} = useQuery<{getAgentProductionPerMonth:AgentProdPerMonth[]}>(AGENT_PER_MONTH_PROD)
  const {data:agentTotalDispoData} = useQuery<{getAgentTotalDispositions:AgentTotalDispo[]}>(AGENT_TOTAL_DISPO)
  
  const [totalCollection,setTotalCollection] = useState<number|null>(null)

  function label() {
    const label = []
    for(let x = 1; x <= date[month[new Date().getMonth()]]; x++ ) {
      label.push(x)
    }
    return label
  } 

  const dataPerDay = {
    labels: label(),
    datasets: [
      {
        label: `${month[new Date().getMonth()]}`,
        data: (()=> {
          const newArray = new Array(date[month[new Date().getMonth()]]).fill("")
          agentProdPerDayData?.getAgentProductionPerDay.forEach((e)=> {
            const dayIndex = e.date - 1
            if(dayIndex >= 0 && dayIndex < date[month[new Date().getMonth()]]) {
              newArray[dayIndex] = e.total.toFixed(2)
            }
          })
          return newArray
        })(),
        backgroundColor: 'rgba(255, 99, 132, 1)',
      },
    ],
  };
 



  const dataPerMonth = {
    labels: month.map((m)=> {return m.slice(0,3)}),
    datasets: [
      {
        label: `${new Date().getFullYear()}`,
        data: (()=> {
          const newArray = new Array(month.length).fill("")
          agentProdPerMonthData?.getAgentProductionPerMonth.forEach((e)=> {
            const monthIndex = e.month - 1

            if(monthIndex >= 0 && monthIndex < 12) {
              newArray[monthIndex] = e.total.toFixed(2)
            }
          })
          return newArray
        })(),
        backgroundColor: 'oklch(0.792 0.209 151.711)',
      },
    ],
  }
  useEffect(()=> {
    if(productionData?.getProductions){
      const newArray = productionData.getProductions.dispositions.map((d)=> d.collection)
      setTotalCollection(newArray.reduce((t,v) => {
        return t + v
      }))
    }
  },[productionData])

  

  return (
    <div className="flex flex-col m-5 h-full gap-5">
      <h1 className="text-2xl font-medium text-slate-500">Agent Statistics</h1>
      <div className=" h-full w-full grid grid-cols-9 grid-rows-4 gap-5">
        <div className="row-span-4 col-span-3 border flex flex-col rounded-lg border-slate-200 shadow-md shadow-black/20 p-3">
          <h1 className="text-sm font-medium text-slate-500">Daily Production</h1>
          <div className="h-full overflow-y-auto">
            <table className="w-full h-full text-sm text-left rtl:text-right text-gray-700 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">
                      Disposition
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                      Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-end">
                      Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {
                  dispotypeData?.getDispositionTypes?.map((dt)=> {
                    const findDispo = productionData?.getProductions?.dispositions.find((d)=> d.dispotype === dt.code)
                    return findDispo && (
                    <tr key={dt.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 h-10">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap dark:text-white">
                        {dt.name}
                      </th>
                      <td className="px-6 py-4 text-center ">
                        {findDispo.dispotype}
                      </td>
                      <td className="px-6 py-4 text-end">
                        {findDispo.count}
                      </td>
                    </tr>
                    )
                  })
                }
              </tbody>
              <tfoot className="w-full">
                <tr className="bg-slate-200/80   ">
                  <th scope="row" className="px-6 py-2 font-medium text-gray-800 whitespace-nowrap dark:text-white">
                    Collection
                  </th>
                  <td></td>
                  <td className="px-6 font-medium">
                    {totalCollection ? totalCollection.toFixed(2) : 0}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div className="border flex rounded-lg border-slate-200 col-span-6 row-span-2 p-2 shadow-md shadow-black/20">
          <Bar data={dataPerDay} options={options} />
        </div>
        <div className="border rounded-lg border-slate-200 col-span-4 row-span-2 p-2 shadow-md shadow-black/20">
        <Bar data={dataPerMonth} options={options} />
        </div>
        <div className="border rounded-lg border-slate-200 col-span-2 row-span-2 shadow-md shadow-black/20 text-[0.8em] p-3">
          <div className="text-slate-500 font-bold ">Overall</div>
          {
            dispotypeData?.getDispositionTypes?.map((dt) => {
              const findDispo = agentTotalDispoData?.getAgentTotalDispositions?.find((d)=> d.dispotype === dt.code)

              return findDispo && (
                <div key={dt.id} className="text-slate-500 font-medium grid grid-cols-3 py-0.5">
                  <div>{findDispo.dispotype}</div>
                  <div>-</div>
                  <div>{findDispo.count}</div>
                </div>
              )
            })
          }
                
        </div>
      </div>

    </div>
  )
}

export default StatisticsView