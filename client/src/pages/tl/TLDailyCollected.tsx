import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useMemo } from "react";
import { IoMdArrowDown,IoMdArrowUp  } from "react-icons/io";
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";

type Collected = {
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

type Bucket = {
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
  const dispatch = useAppDispatch()
  const {data:tlBucketData,error} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET)

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const tlBuckets = tlBucketData?.getDeptBucket || []
    return Object.fromEntries(tlBuckets.map(e=> [e.id, e.name]))
  },[tlBucketData])

  const {data:dailyCollected,error:tlDailyCollectedError} = useQuery<{getTLDailyCollected:Collected[]}>(DAILY_COLLECTION)

  useEffect(()=> {
    if(error || tlDailyCollectedError) {
      dispatch(setServerError(true))
    }
  },[error, tlDailyCollectedError, dispatch])

  return (
    <div className='border-yellow-400 border bg-yellow-200 rounded-xl p-2 flex flex-col'>
      <div className='lg:text-base 2xl:text-lg font-black text-yellow-500'>
        <h1>Daily Collected </h1>
        <p className="text-xs font-medium">(Daily per Campaign)</p>
      </div>
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