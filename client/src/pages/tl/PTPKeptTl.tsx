import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useState } from "react"
import { IoMdArrowDown,IoMdArrowUp  } from "react-icons/io";

interface PTPKept {
  bucket: string
  count: number
  amount: number
  yesterday: number
}

const PTP_KEPT_TOTAL = gql`
  query GetTLPTPKeptTotals {
    getTLPTPKeptTotals {
      bucket
      count
      amount
      yesterday
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




const PTPKeptTl = () => {

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

  const {data:ptpKetpData} = useQuery<{getTLPTPKeptTotals:PTPKept[]}>(PTP_KEPT_TOTAL)
  return (
    <div className='border-green-400 border bg-green-200 rounded-xl p-2 flex flex-col'>
      <h1 className='lg:text-base 2xl:text-xl font-black text-green-500'>PTP Kept <span className="text-sm font-medium">(Daily)</span></h1>
      <div className='h-full w-full flex flex-col justify-center '>
        {
          ptpKetpData?.getTLPTPKeptTotals.map((tpt,index) => {
            const arrow = tpt.amount - tpt.yesterday > 0 ? <IoMdArrowUp className="text-green-500"/> : <IoMdArrowDown className="text-red-500"/>
                    
            return tpt.amount > 0 && (
              <div key={index} className='grid grid-cols-3 lg:text-[0.6em] 2xl:text-xs text-green-500'>
                <div className="font-bold">{bucketObject[tpt.bucket]}</div>
                <div className="font-medium flex justify-between px-2 items-center "><div>{tpt.count}</div> {arrow}</div>
                <div className="font-medium ">{tpt.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</div>
              </div>
            )
          }) 
        }


      </div>  
    </div>
  )
}

export default PTPKeptTl