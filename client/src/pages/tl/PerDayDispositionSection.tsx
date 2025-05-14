import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { Bar } from 'react-chartjs-2';
import { date, month } from '../../middleware/exports';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface PerDayBuckets {
  day: string
  amount: number
}

interface PerDay  {
  bucket: string
  buckets: PerDayBuckets[]
}

interface DispositionPerDay  {
  month: string
  dispositionsCount: PerDay[]
}


const PER_DAY_DISPOSITION = gql`
  query getDispositionPerDay {
    getDispositionPerDay {
      month
      dispositionsCount {
        bucket
        buckets {
          day
          amount
        }
      }
    }
  }
`
interface MonthDayBuckets {
  month: string
  amount: number
}

interface PerMonth  {
  buckets: MonthDayBuckets[]
  bucket: string
}

interface DispositionPerMonth  {
  year: string
  dispositionsCount: PerMonth[]
}


const PER_MONTH_DISPOSITION = gql`
  query getDispositionPerMonth {
    getDispositionPerMonth {
      year
      dispositionsCount {
        bucket
        buckets {
          month
          amount
        }
      }
    }
  }

`

const oklchColors = [
  'oklch(60% 0.15 216)',
  'oklch(60% 0.15 288)',
  'oklch(60% 0.15 0)',
  'oklch(60% 0.15 36)',
  'oklch(60% 0.15 72)',
  'oklch(60% 0.15 108)',
  'oklch(60% 0.15 144)',
  'oklch(60% 0.15 180)',
  'oklch(60% 0.15 252)',
  'oklch(60% 0.15 324)'
];



interface Bucket {
  name: string
  dept: string
  id: string
}


const DEPT_BUCKET_QUERY = gql`
  query getDeptBucket {
    getDeptBucket {
      id
      name
      dept
    }
  }
`

const PerDayDispositionSection = () => {
 
  const navigate = useNavigate()
  const {data:perDayDispostiion, refetch:dispoPerDayRefetch} = useQuery<{getDispositionPerDay:DispositionPerDay}>(PER_DAY_DISPOSITION)
  const {data:perMonthDisposition, refetch:dispoPerMonthRefetch} = useQuery<{getDispositionPerMonth:DispositionPerMonth}>(PER_MONTH_DISPOSITION)
  const {data:deptBucket} = useQuery<{getDeptBucket:Bucket[]}>(DEPT_BUCKET_QUERY)    
  const [bucketObject, setBucketObject] = useState<{[key:string]:string}>({})
  const [bucketColorObject, setBucketColorObject] = useState<{[key:string]:string}>({})

  useEffect(()=> {
    if(deptBucket) {
      const newObject:{[key:string]:string} = {}
      const bucketsOklchColors:{[key:string]:string} = {}
      deptBucket.getDeptBucket.map((e,index) => {
        newObject[e.id] = e.name
        bucketsOklchColors[e.id] = oklchColors[index || 0]
      })
      setBucketObject(newObject)
      setBucketColorObject(bucketsOklchColors)
    }
  },[deptBucket])
  
  const todayMonth = new Date().getMonth()


  const options = { 
    plugins: {
      datalabels:{
        display:false
      }
    },
    responsive: true, 
    maintainAspectRatio: false
  }


  useEffect(()=> {
    dispoPerDayRefetch()
    dispoPerMonthRefetch()
  },[navigate, dispoPerDayRefetch, dispoPerMonthRefetch])


  const [datasetMonth, setDatasetMonth] = useState<{
    label: string,
    data: string[],
    backgroundColor: string
  }[]>([])

  useEffect(()=> {
    if(perMonthDisposition){
      const newArrayPerMonth:{ 
        label: string,
        data: string[],
        backgroundColor: string
      }[] = []
      perMonthDisposition.getDispositionPerMonth.dispositionsCount.map((e)=> {
        const newObject:{
          label: string,
          data: string[],
          backgroundColor: string
        } = {label: "", data: [], backgroundColor: ""}
        newObject["label"] = bucketObject[e.bucket]
        newObject['backgroundColor'] = bucketColorObject[e.bucket]
        const newArray = new Array(12).fill("")
        e.buckets.map(b => {
          newArray[parseInt(b.month) - 1] = b.amount.toString()
          newObject["data"] = newArray
        })
        newArrayPerMonth.push(newObject)
      } )
      setDatasetMonth(newArrayPerMonth)
    }
  },[perMonthDisposition,bucketObject,bucketColorObject])

  const dataPerMonth = {
    labels: month.map((element)=> {return element.slice(0,3)}),
    datasets: datasetMonth
  }

  const monthlyDate = (month:string) => {
    const days = [];
    for (let x = 1; x <= date[month as keyof typeof date]; x++) {
      days.push(x);
    }
    return days;
  };

  const [datasetPerDay, setDatasetPerDay] = useState<{
    label: string,
    data: string[],
    backgroundColor: string
  }[]>([])
  
  useEffect(()=> {
    if(perDayDispostiion) {
      
      const newArrayPerDay:{ label: string,
        data: string[],
        backgroundColor: string}[] = []

      perDayDispostiion.getDispositionPerDay.dispositionsCount.map((e)=> {
        
        const newObject:{
          label: string,
          data: string[],
          backgroundColor: string
        } = {label: "", data: [], backgroundColor: ""}
        newObject["label"] = bucketObject[e.bucket]
        newObject["backgroundColor"] = bucketColorObject[e.bucket]

        const newArray = new Array(date[month[new Date().getMonth()]]).fill("")
        e.buckets.map((b) => {
          newArray[(parseInt(b.day) - 1)] = b.amount.toString()
          newObject['data'] = newArray
        })
        newArrayPerDay.push(newObject)
      })
      setDatasetPerDay(newArrayPerDay)
    }
  },[perDayDispostiion,bucketObject,bucketColorObject])
  
  const dataPerDay = {
    labels: monthlyDate(month[todayMonth]),
    datasets: datasetPerDay
  }

  return (
      <div className="row-start-4 row-span-3 col-span-4 grid grid-rows-2 gap-5 ">
      
        <div className=' bg-white rounded-md border border-slate-400 p-2'>
          <Bar options={options}
            data={dataPerDay}
          />
        </div>

        <div className='bg-white rounded-md border border-slate-400 p-2'>
        <Bar 
        options={options}
            data={dataPerMonth}
          />
        </div>
      </div>
  )
}

export default PerDayDispositionSection
