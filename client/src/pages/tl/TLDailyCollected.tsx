import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { IoMdArrowDown,IoMdArrowUp  } from "react-icons/io";

interface Collected {
  bucket: string
  amount: number
  yesterday: number
}


const DAILY_COLLECTION = gql`
  query GetTLDailyCollected {
    getTLDailyCollected {
      bucket
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



const TLDailyCollected = () => {
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
    const {data:dailyCollected} = useQuery<{getTLDailyCollected:Collected[]}>(DAILY_COLLECTION)


  return (
    <div className='border-yellow-400 border bg-yellow-200 rounded-xl p-2 flex flex-col'>
      <h1 className='lg:text-base 2xl:text-xl font-black text-yellow-500'>Daily Collected</h1>
      <div className='h-full w-full flex flex-col justify-center '>
        {
          dailyCollected?.getTLDailyCollected.map((daily,index) => {
            const arrow = daily.amount - daily.yesterday > 0 ? <IoMdArrowUp className="text-green-500"/> : <IoMdArrowDown className="text-red-500"/>
            return daily.amount > 0 && (
              <div key={index} className='flex justify-between lg:text-[0.6em] 2xl:text-xs text-yellow-500'>
                <div className="font-bold">{bucketObject[daily.bucket]}</div>
                <div className="font-medium col-span-2 flex items-center gap-2 ">{arrow} {daily.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
              </div>
            )
          })
        }
      
      </div>  
    </div>
  )
}

export default TLDailyCollected