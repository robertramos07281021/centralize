import { gql, useQuery } from "@apollo/client"
import { useEffect, useState } from "react"
import { Doughnut } from "react-chartjs-2"

interface User {
  name: string
  user_id: string
}

interface DispoReport {
  disposition: string
  users: User[]
  count: number
}

interface Buckets  { 
  bucket: string
  totalAmount: number
  dispositions: DispoReport[]
}

type HighDispositionReport = {
  dept: string
  buckets : Buckets[]
}




interface DispoType {
  id:string
  name: string
  code: string
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
interface User {
  name: string
  user_id: string
}

const colorDispo: { [key: string]: string } = {
  DISP: "oklch(0.704 0.191 22.216)",
  FFUP: "oklch(0.75 0.183 55.934)",
  FV: "oklch(0.828 0.189 84.429)",
  HUP: "oklch(0.852 0.199 91.936)",
  ITP: "oklch(0.841 0.238 128.85)",
  LM: "oklch(0.792 0.209 151.711)",
  PAID:"oklch(0.765 0.177 163.223)",
  PTP: "oklch(0.777 0.152 181.912)",
  RPCCB:"oklch(0.789 0.154 211.53)",
  RTP: "oklch(0.746 0.16 232.661)",
  UNEG: "oklch(0.707 0.165 254.624)",
  ANSM:"oklch(0.673 0.182 276.935)",
  WN: "oklch(0.702 0.183 293.541)",
  NOA: "oklch(0.714 0.203 305.504)",
  KOR: "oklch(0.74 0.238 322.16)",
  OCA: "oklch(0.73 0.195 45.0)",
  NIS: "oklch(0.7 0.2 340.0)",
  BUSY: "oklch(0.73 0.19 10.0)",
  DEC: "oklch(0.76 0.185 30.0)",
  UNK: "oklch(0.78 0.18 350.0)",
  SET: "oklch(0.76 0.19 20.0)"
}

const colorBucket : {[key:number]:string} = {
  0: "oklch(0.704 0.191 22.216)",
  1: "oklch(0.75 0.183 55.934)",
  2: "oklch(0.828 0.189 84.429)",
  3: "oklch(0.852 0.199 91.936)",
  4: "oklch(0.841 0.238 128.85)",
  5: "oklch(0.792 0.209 151.711)",
  6:"oklch(0.765 0.177 163.223)",
  7: "oklch(0.777 0.152 181.912)",
  8:"oklch(0.789 0.154 211.53)",
  9: "oklch(0.746 0.16 232.661)",
  10: "oklch(0.707 0.165 254.624)",
  11:"oklch(0.673 0.182 276.935)",
  12: "oklch(0.702 0.183 293.541)",
  13: "oklch(0.714 0.203 305.504)",
  14: "oklch(0.74 0.238 322.16)",
  15: "oklch(0.73 0.195 45.0)",
  16: "oklch(0.7 0.2 340.0)",
  17: "oklch(0.73 0.19 10.0)",
  18: "oklch(0.76 0.185 30.0)",
  19: "oklch(0.78 0.18 350.0)",
  20: "oklch(0.76 0.19 20.0)"
}


interface modalProps {
  reportHighData:HighDispositionReport[] 
  campaign: string
  bucket: string
  from: string,
  to: string
}

const HighReports:React.FC<modalProps> = ({reportHighData, campaign, from, to}) => {

  console.log(reportHighData)
  const {data:dispoTypes} = useQuery<{getDispositionTypes:DispoType[]}>(GET_DISPOSITION_TYPES) 
  const [total, setTotal] = useState<number >(0)
  const [dataSetData, setDataSetData] = useState<number[]>([])
  const [dataSetBackGroundColor, setDataSetBackGroundColor] = useState<string[]>([])
  const [dataSetLabels, setDataSetLabes] = useState<string[]>([])
  const [newDispoTypeObject, setNewDispoTypeObject] = useState<{[key:string]:string}>({})

  useEffect(()=> {
    if(dispoTypes) {
      const object:{[key: string]:string} = {}
      dispoTypes.getDispositionTypes.forEach((e)=> 
        object[e.name] = e.code
      )
      setNewDispoTypeObject(object)
    }
  },[dispoTypes])

  useEffect(()=> {
    if(reportHighData) {
      if(reportHighData[0]?.buckets?.length > 1){
        const countArray = new Array<number>()
        const bucketNewArray = new Array<number>(reportHighData[0]?.buckets?.length).fill(0)
        const bucketNewArrayColor = new Array<string>(reportHighData[0]?.buckets?.length).fill("")
        const labelArray = new Array<string>(reportHighData[0]?.buckets?.length).fill("")
        reportHighData[0]?.buckets?.map((e,index)=> 
        {
          
          const bucketCountArray = new Array<number>()
          labelArray[index] = e.bucket
          bucketNewArray[index] = bucketCountArray.reduce((t,v) => {return t + v} )
          bucketNewArrayColor[index] = colorBucket[index]
          e.dispositions.forEach(e => {
            countArray.push(e.count)
            bucketCountArray.push(e.count)
          })
        })
        setDataSetLabes(labelArray)
        setDataSetBackGroundColor(bucketNewArrayColor)
        setDataSetData(bucketNewArray)
        setTotal(countArray.reduce((t,v)=> {return t + v}))
      } else {
        const countArray = new Array<number>()
        const newDispoArray = new Array<string>(reportHighData[0]?.buckets[0]?.dispositions.length).fill("")
        const newCountDispo = new Array<number>(reportHighData[0]?.buckets[0]?.dispositions.length).fill(0)
        const newColorDispo = new Array<string>(reportHighData[0]?.buckets[0]?.dispositions.length).fill("")
        reportHighData[0]?.buckets[0]?.dispositions.forEach((e,index)=> {
          
          newDispoArray[index] = newDispoTypeObject[e.disposition]
          newCountDispo[index] = e.count
          newColorDispo[index] = colorDispo[newDispoTypeObject[e.disposition]]
          countArray.push(e.count)
          setDataSetBackGroundColor(newColorDispo)
          setDataSetData(newCountDispo)
          setDataSetLabes(newDispoArray)
          setTotal(countArray.reduce((t,v)=> {return t + v}))
        })
      }
    }
  },[reportHighData,newDispoTypeObject])


  const data = {
    labels: ['1'],
    datasets: [{
      label: 'Percentage',
      data: [1],
      backgroundColor: ['oklch(0.76 0.19 20.0)'],
      hoverOffset: 4
    }]
  };

  const data2 = {
    labels: dataSetLabels.length > 0 ? dataSetLabels : [],
    datasets: [{
      label: 'Percentage',
      data: dataSetData.map(d => parseInt(Math.floor((Number(d)/total) * 100).toPrecision(2)) === 100 ? 1 : parseInt(Math.floor((Number(d)/total) * 100).toPrecision(2))) ?? [],
      backgroundColor: dataSetBackGroundColor.length > 0 ? dataSetBackGroundColor : [] ,
      hoverOffset: 4
    }]
  };
 
  const options = {
    plugins: {
      datalabels: {
        color: 'oklch(0 0 0)',
        font: {
          weight: "bold", 
          size: 12,
        } as const,
        formatter: (value: number) => {return value === 0 ? "" : Math.ceil(value/100 * total)},
      },
      legend: {
        position: 'bottom' as const,
        display: false
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const [date, setDate] = useState<string>("")
  
  useEffect(()=> {
    if(from && to){
      setDate(`FROM: ${from} - TO: ${to}`)
    } else if(from && !to) {
      setDate(`From: ${from} - To: Present`)
    } else if(!from && to) {
      setDate(to)
    }
  },[from, to])


  return (
    <div className="w-10/12 h-full overflow-y-auto py-10">
      <h1 className="text-center mb-5 text-2xl text-slate-500 font-medium">
      {
        (!campaign ) ?
          "Please Select Campaign to Preview" : campaign
        }
      </h1>
      {
        date &&
        <h1 className="lg:text-xs 2xl:text-sm text-end px-10 text-slate-500"><span className="font-bold text-slate-500">DATE:</span> {date}</h1>
      }
      <div className="h-80">
        <Doughnut data={campaign ? data2 : data} options={options}/>
      </div>
      {
        (campaign) && 
        <div className="px-20 pt-5">
        {
          reportHighData.map((e,index)=> {
            return (
              <div key={index}>
                {
                  e.buckets.map((b, index)=> {
                    const newMap = new Map<string, User>() 
                    
                    b.dispositions.map((d)=> {
                      d.users.forEach(u => {
                        if(u.user_id && !newMap.has(u.user_id)){
                          newMap.set(u.user_id, u)
                        }
                      })
                    })
                    return (
                      <table key={index} className="w-full mt-5 lg:text-xs 2xl:text-sm">
                        <caption className="font-bold lg:text-sm 2xl:text-base text-slate-600 bg-blue-100">{b.bucket}</caption>
                        <thead>
                          <tr>
                            {
                              dispoTypes?.getDispositionTypes.map((dt)=> {
                                const checkDispo = b.dispositions.find((d) => d.disposition === dt.name)

                                return checkDispo && (
                                  <th key={dt.id} className="py-2" > {dt.code}</th>
                                )
                              })
                            }
                            <th>Collected</th>
                            <th>FTE</th>
                          </tr>
                          
                        </thead>
                        <tbody>
                          <tr>
                            {
                              dispoTypes?.getDispositionTypes.map((dt)=> {
                                const checkDispo = b.dispositions.find((d) => d.disposition === dt.name)
                                return checkDispo && (
                                  <td key={checkDispo.disposition} className="py-2 text-center"> {checkDispo.count}</td>
                                )
                              })
                            }
                            <td className="text-center">{b.totalAmount.toFixed(2)}</td>
                            <td className="text-center">{newMap.size}</td>
                          </tr>
                        </tbody>
                      </table>

                    )
                  })
                }
              </div>
            )
          })
        }
        
        </div>
      }
    </div>
  )
}

export default HighReports