import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { ChartOptions } from 'chart.js';

interface Dispotypes {
  code: string
  id:string

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

const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      code
    }
  }
`

interface Dispotype {
  dispotype: string
  count:number
}

interface DeptDispoCount {
  bucket:string
  dispositions: Dispotype[]
}

const GET_ALL_DISPOSITION_COUNT = gql`
  query GetDeptDispositionCount {
    getDeptDispositionCount {
      bucket
      dispositions {
        dispotype
        count
      }
    }
  }
`
interface Datasets {
  label: string
  data: number[],
  backgroundColor: string[]
  hoverOffset: number
}

interface Data {
  labels: string[],
  datasets: Datasets[]
}


interface Bucket {
  id: string
  name: string
}
const DEPT_BUCKET_QUERY = gql`
  query getDeptBucket {
    getDeptBucket {
      id
      name
    }
  }
`


// const oklchColors = [
//   'oklch(60% 0.15 216)',
//   'oklch(60% 0.15 288)',
//   'oklch(60% 0.15 0)',
//   'oklch(60% 0.15 36)',
//   'oklch(60% 0.15 72)',
//   'oklch(60% 0.15 108)',
//   'oklch(60% 0.15 144)',
//   'oklch(60% 0.15 180)',
//   'oklch(60% 0.15 252)',
//   'oklch(60% 0.15 324)'
// ];


const DoughnutSection = () => {
  const navigate = useNavigate()
  const {data:dispotypesData, refetch:dispoTypeRefetch} = useQuery<{getDispositionTypes:Dispotypes[]}>(GET_DISPOSITION_TYPES)
  const {data:dispositionCount, refetch:deptDispoCountRefetch} = useQuery<{getDeptDispositionCount:DeptDispoCount[]}>(GET_ALL_DISPOSITION_COUNT)
  const [dispotypeObject, setDispotypeObject] = useState<{[key:string]:string}>({})
  useEffect(()=> {
    if(dispotypesData) {
      const newObject:{[key:string]:string} = {}
      dispotypesData.getDispositionTypes.map((e) => {
        newObject[e.id] = e.code
      })
      setDispotypeObject(newObject)
    }
  },[dispotypesData])

  const {data:bucketData} = useQuery<{getDeptBucket:Bucket[]}>(DEPT_BUCKET_QUERY)

  const [bucketObject, setObjectObject] = useState<{[key:string]:string}>({})

  useEffect(()=> {
    if(bucketData) {
      const newObject:{[key:string]:string} = {}
      bucketData.getDeptBucket.map((e)=> {
        newObject[e.id] = e.name
      })
      setObjectObject(newObject)
    }
  },[bucketData])

  const [barData, setBarData] = useState<Data[]>([])
  
  useEffect(()=> {
    dispoTypeRefetch()
    deptDispoCountRefetch()
  },[navigate, dispoTypeRefetch, deptDispoCountRefetch])

  useEffect(()=> {
    if(dispositionCount) {
      const newArrays:Data[] = []
      dispositionCount.getDeptDispositionCount.map(e => {
        const newData:Data = {
          labels:[], //2
          datasets: [{
            label: "", // 1
            data: [], //3
            backgroundColor: [], //4
            hoverOffset: 4
          }]
        }
        newData["datasets"][0]["label"] = bucketObject[e.bucket] //1
        const newArray = new Array(e.dispositions.length).fill("")
        const newArrayData = new Array(e.dispositions.length + 2).fill(null)
        const newArrayColor = new Array(e.dispositions.length).fill("")


        e.dispositions.map((e,index) => {
          newArray[index] = dispotypeObject[e.dispotype]
          newArrayData[index] = e.count
          newArrayColor[index] = colorDispo[dispotypeObject[e.dispotype]]
        })
        newData["labels"] = newArray //2
        newData['datasets'][0]['data'] = newArrayData //3
        newData['datasets'][0]['backgroundColor'] = newArrayColor //4
        newArrays.push(newData)
      })
      setBarData(newArrays)
    }
  },[dispositionCount,dispotypeObject,bucketObject])

  const options:ChartOptions<'bar'> = {
    indexAxis: 'y',
    plugins: {
      datalabels:{
        display:false
      },
      legend: {
        labels: {
          usePointStyle: true,
          pointStyle: 'line', // This makes it look like just a line, not a colored box
          boxWidth: 0,        // Optionally set boxWidth to 0 to hide it
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className={`col-span-3 row-span-3 grid grid-cols-${barData.length} gap-5`}>
      {
        barData.map(e => {
          const newBarDatas = {
            labels: e.labels,
            datasets: e.datasets
          }
          return <div className='bg-white rounded-xl border border-slate-400 p-2'>
          <Bar data={newBarDatas} options={options}/>
        </div>
      }
        )
      }
  </div>
  )
}

export default DoughnutSection
