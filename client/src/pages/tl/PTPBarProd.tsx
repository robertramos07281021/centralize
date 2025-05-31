import { useQuery } from "@apollo/client"
import { ChartOptions } from "chart.js"
import gql from "graphql-tag"
import { useEffect, useState } from "react"
import { Bar } from "react-chartjs-2"

interface PtpProd {
  bucket: string
  calls: number
  sms: number
  email: number
  field: number
  skip: number
}


const PTP_PROD = gql`
  query GetTLPTPToday {
    getTLPTPToday {
      bucket
      calls
      sms
      email
      field
      skip
    }
  }
`
interface Bucket {
  id:string
  name: string
}
const TL_BUCKET = gql`
  query GetDeptBucket {
    getDeptBucket {
      id
      name
    }
  }
`
const oklchColors = [
  'oklch(60% 0.15 216)',
  'oklch(60% 0.15 288)',
  'oklch(60% 0.15 0)',
  'oklch(60% 0.15 144)',
  'oklch(60% 0.15 72)',
];


const PTPBarProd = () => {
  const [bucketObject, setBucketObject]= useState<{[key:string]:string}>({})
    const {data:tlBucketData} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET)
    useEffect(()=> {
      if(tlBucketData) {
        const newObject:{[key: string]:string} = {}
        tlBucketData.getDeptBucket.map(e=> {
          newObject[e.id] = e.name
        })
        setBucketObject(newObject)
      }
    },[tlBucketData])
  const {data:ptpData} = useQuery<{getTLPTPToday:PtpProd[]}>(PTP_PROD)
  const [labels, setLabels] = useState<string[]>([])
  const [callsData, setCallsData] = useState<number[]>([])
  const [smsData, setSmsData] = useState<number[]>([])
  const [emailData, setEmailData] = useState<number[]>([])
  const [skipData, setSkipData] = useState<number[]>([])
  const [fieldData, setFieldData] = useState<number[]>([])

  useEffect(()=> {
    if(ptpData) {
      const labelsArray = new Array(ptpData.getTLPTPToday.length).fill("")
      const callsArray = new Array(ptpData.getTLPTPToday.length).fill(0)
      const smsArray = new Array(ptpData.getTLPTPToday.length).fill(0)
      const emailArray = new Array(ptpData.getTLPTPToday.length).fill(0)
      const skipArray = new Array(ptpData.getTLPTPToday.length).fill(0)
      const fieldArray = new Array(ptpData.getTLPTPToday.length).fill(0)
      ptpData.getTLPTPToday.map((e,index) => {
        labelsArray[index] = e.bucket
        callsArray[index] = e.calls
        smsArray[index] = e.sms
        emailArray[index] = e.email
        skipArray[index] = e.skip
        fieldArray[index] = e.field
      })
      setLabels(labelsArray)
      setCallsData(callsArray)
      setSmsData(smsArray)
      setEmailData(emailArray)
      setSkipData(skipArray)
      setFieldData(fieldArray)
    }
  },[ptpData,bucketObject])

   const option:ChartOptions<'bar'> = { 
     plugins: {
      datalabels:{
        display:false
      },
      legend: {
        display: true,
        labels: {
          font: {
            size: 8,
            family: 'Arial',
            weight: 'bold',
          },
        },
      },
      title: {
        display: true,
        text: `PTP Today`,
      },
       
     },
      scales: {
        x: {
          ticks: {
            font: {
              size: 8,
            },
          },
        },
        y: {
          ticks: {
            font: {
              size: 10,
            },
          },
        },
      },
     responsive: true, 
     maintainAspectRatio: false
   }

  const data = {
    labels: labels.map(e=> bucketObject[e]),
    datasets: [
      {
        label: 'Calls',
        data: callsData,
        backgroundColor: oklchColors[0],
      },
      {
        label: 'SMS',
        data: smsData,
        backgroundColor: oklchColors[1],
      },
      {
        label: 'Emails',
        data: emailData,
        backgroundColor: oklchColors[2],
      },
      {
        label: 'Skip',
        data: skipData,
        backgroundColor: oklchColors[3],
      },
      {
        label: 'Field',
        data: fieldData,
        backgroundColor: oklchColors[4],
      },
    ],
  };


  return (
    <div className='bg-white border border-slate-400 rounded-xl p-2'>
      <Bar data={data} options={option}/>
    </div>
  )
}

export default PTPBarProd