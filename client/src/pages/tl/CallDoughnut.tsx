import { useQuery } from "@apollo/client"
import { ChartData, ChartOptions } from "chart.js"
import gql from "graphql-tag"
import { useCallback, useEffect, useState } from "react"
import { Doughnut } from "react-chartjs-2"
import { motion } from "framer-motion"


const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

type Dispositions = {
  code: string
  count: number
  color: string
}

type DispositionType = {
  name: string
  code: string
  count: string
  amount: number
}

type ComponentsProps = {
  totalAccounts : number
  dispoData:DispositionType[]
}

const CallDoughnut:React.FC<ComponentsProps> = ({totalAccounts,dispoData}) => {
 const {data:disposition} = useQuery<{getDispositionTypes:DispositionType[]}>(GET_DISPOSITION_TYPES)
  const [newReportsDispo, setNewReportsDispo] = useState<Record<string,number>>({})

  useEffect(()=> {
    const reportsDispo:{[key: string]: number} = {};
    if(dispoData) {
      dispoData?.forEach((element: DispositionType) => {
        reportsDispo[element.code] = element.count ? Number(element.count) : 0;
      });
      setNewReportsDispo(reportsDispo)
    }
  },[dispoData])


  useEffect(()=> {
    if (disposition?.getDispositionTypes) {
      const updatedData = disposition.getDispositionTypes.map((e) => ({
        code: e.code,
        count: Number(newReportsDispo[e.code]) ? Number(newReportsDispo[e.code]) : 0 ,
        color: positive.includes(e.code) ? `oklch(62.7% 0.194 149.214)` : `oklch(63.7% 0.237 25.331)`
      }));
      setDispositionData(updatedData);
    }
  },[disposition,newReportsDispo])

  const positive = ['PTP','FFUP','UNEG','RTP','PAID','DISP','LM','HUP','WN','RPCCB']
  const [dispositionData, setDispositionData] = useState<Dispositions[]>([])

  const positiveCalls = dispoData && dispoData.length > 0 ? dispoData?.filter(x=> positive.includes(x.code)) : []
  const negativeCalls = dispoData && dispoData?.length > 0 ? dispoData?.filter(x=> !positive.includes(x.code)) : []
  
  const filteredPositive = positiveCalls.length > 0 ? positiveCalls?.map(y=> y.count)?.reduce((t,v)=> t + v) : []
  const filteredNegative = negativeCalls.length > 0 ? negativeCalls?.map(y=> y.count)?.reduce((t,v)=> t + v) : []

  const totalPositiveCalls = (dispoData && dispoData.length > 0) ? dispoData.map(x=> x.count)?.reduce((t,v)=>  t + v) : 0

  const dataLabels = ['Negative Calls','Positive Calls','Unconnected Calls']
    const dataCount = [isNaN(Number(filteredNegative)) ? 0: Number(filteredNegative) , isNaN(Number(filteredPositive)) ? 0 :Number(filteredPositive) , Number(totalAccounts - Number(totalPositiveCalls))] 
    const dataColor = [ `oklch(63.7% 0.237 25.331)`,`oklch(62.7% 0.194 149.214)`, `oklch(44.6% 0.043 257.281)`]

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

    const dispositionCount = useCallback((code:string) =>  {
    const newFilter = dispositionData?.filter((e)=> e.code === code)
    return newFilter[0]?.count
  },[dispositionData])

  const percentageOfDispo = useCallback((code:string)=> {
    const newFilter = dispositionData.filter(e=> e.code === code)
    return (newFilter[0]?.count / totalAccounts) * 100 
  },[dispositionData])

  return (
    <div className="flex justify-between w-full h-full pr-5">
      <div className="w-full flex justify-center item-center flex-col ">
        <div  className="flex flex-col justify-center min-h-5/6">
          {
            dispoData.map((dd,index)=> {
              const findDispotype = disposition?.getDispositionTypes.find(x=> x.code === dd.code)
              return (
                <motion.div key={index} className="lg:text-xs 2xl:text-base text-slate-900 font-medium grid grid-cols-3 gap-2 py-0.5 hover:scale-105 transition-all cursor-pointer hover:font-bold"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{delay: index * 0.05}}
                >
                <div style={{backgroundColor: `${positive.includes(dd?.code) ? `oklch(62.7% 0.194 149.214)` : `oklch(63.7% 0.237 25.331)`}`}} className="px-2 font-black py-1 rounded-sm shadow-sm">{dd.code}  </div>
                <div>{findDispotype?.name}</div>
                <div className="text-center">{dispositionCount(dd.code)} - {percentageOfDispo(dd.code).toFixed(2)}%</div>
              </motion.div>
              )
            })
          }
        </div>
        
      </div>
      <div className="w-5/10 flex justify-center min-h-96 max-h-120">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  )
}


export default CallDoughnut