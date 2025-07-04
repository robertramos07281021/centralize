import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { Doughnut } from "react-chartjs-2"
import { colorDispo } from "../../middleware/exports"
import { useEffect, useState } from "react"
import { ChartData, ChartOptions } from "chart.js"


const REPORT = gql`
  query ProductionReport($dispositions: [ID], $from: String, $to: String) {
    ProductionReport(dispositions: $dispositions, from: $from, to: $to) {
      totalDisposition
      dispotypes {
        dispotype {
          _id
          code
          name
        }
        count
      }
    }
  }
`

type Dispotype = {
  _id: string
  code: string
  name: string
}

type Dispotypes = {
  dispotype: Dispotype
  count: number
}
type ProductionReport = {
  totalDisposition: number
  dispotypes: Dispotypes[]
}

type ReportsComponents = {
  dispositions: string[]
  from: string
  to: string
}

type DoughnutData = {
  datas: number[]
  colors: string[]
  labels: string[]
}

const ReportsComponents:React.FC<ReportsComponents> = ({dispositions, from, to}) => {
  const {data:productionReportData, refetch} = useQuery<{ProductionReport:ProductionReport}>(REPORT,{variables: {dispositions, from, to}})
  const [doughnutData,setDoughnutData] = useState<DoughnutData>({datas: [], colors: [], labels: []})

  useEffect(()=> {
    if(productionReportData) {

      const dispotypes = productionReportData?.ProductionReport?.dispotypes

      const totalDispo = productionReportData?.ProductionReport?.totalDisposition

      if(dispotypes.length > 0) {

        const dataLabels:string[] = productionReportData?.ProductionReport?.dispotypes.map( e => e.dispotype.code)

        const dataData:number[] = productionReportData?.ProductionReport?.dispotypes.map(e => e.count)

        const dataColor:string[] = productionReportData?.ProductionReport?.dispotypes.map(e => colorDispo[e.dispotype.code])

        const dataCounts = dispotypes.map(e => e.count).reduce((t,v) => {
          return t + v
        })

        const total = totalDispo - dataCounts

        if(total > 0) {
          dataData.push(total)
          dataLabels.push('Other Dispo')
          dataColor.push('oklch(70.9% 0.01 56.259)')
        }

        setDoughnutData({datas: dataData, colors: dataColor, labels: dataLabels})
      } else {
        setDoughnutData({datas: [totalDispo],colors: ['oklch(70.9% 0.01 56.259)'], labels: ['Other Dispo']})
      }
    }
  },[productionReportData])

  useEffect(()=> {
    refetch()
  },[dispositions.length,from,to])

  const data:ChartData<'doughnut'> = {
    labels:doughnutData.labels,
    datasets: [{
      label: 'Percentage',
      data: doughnutData.datas,
      backgroundColor:doughnutData.colors,
      hoverOffset: 30,
    }],
  };

  const options:ChartOptions<'doughnut'> = {
    plugins: {
      datalabels: {
        color: 'oklch(0 0 0)',
        font: {
          weight: "bold", 
          size: 10,
        } as const,
      },
      legend: {
        position: 'bottom' as const,
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const dataset = context.dataset;
            const total = dataset.data.reduce((sum: number, val: any) => sum + val, 0);
            const currentValue = context.raw as number;
            const percentage = ((currentValue / total) * 100).toFixed(1);
            return `Percentage: ${percentage}%`;
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const labels = ['Name','Code','Count']


  return (
    <div className="h-full flex overflow-hidden mt-2 gap-5"> 
      <div className="p-5 h-full flex flex-col w-1/2">
        <h1 className="text-center text-xl font-medium text-gray-500 mb-10">Dispositions</h1>
        <div className="grid grid-cols-3 lg:text-sm 2xl:text-lg">
          {labels.map((e,index)=> 
            <div key={index} className="text-slate-500 font-medium ">{e}</div>
          )}
        </div>
        <div className="h-full overflow-y-auto">
          {
            productionReportData?.ProductionReport.dispotypes.map((e)=> {

              return (
                <div key={e.dispotype._id} className="grid grid-cols-3 lg:text-xs 2xl:text-sm text-gray-500 py-0.5">
                  <div className="flex gap-5 justify-between pr-3">
                    <div>{e.dispotype.name}</div>
                    <div style={{backgroundColor: colorDispo[e.dispotype.code]}} className={`w-1/2`}></div> 
                  </div>
                  <div>{e.dispotype.code}</div>
                  <div>{e.count}</div>
                </div>
              )
            })
          }
        </div>
      </div>
      <div className="p-20 w-1/2 h-full">
        <Doughnut data={data} options={options}/>
      </div>
    </div>
  )
}

export default ReportsComponents