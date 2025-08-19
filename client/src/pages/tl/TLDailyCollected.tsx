import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect } from "react";
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";
import { Bucket, IntervalsTypes } from "./TlDashboard";

type Collected = {
  amount: number
}

const DAILY_COLLECTION = gql`
  query getTLDailyCollected($input:Input) {
    getTLDailyCollected(input:$input) {
      amount
    }
  }
`

type ComponentProp = {
  bucket: Bucket | null | undefined
  interval: IntervalsTypes
}



const TLDailyCollected:React.FC<ComponentProp> = ({bucket,interval}) => {
  const dispatch = useAppDispatch()
  const {data:dailyCollected, refetch } = useQuery<{getTLDailyCollected:Collected}>(DAILY_COLLECTION,{variables: {input: {bucket:bucket?.id, interval: interval},skip: !bucket?.id}})

  useEffect(()=> {
    const timer = async()=> {
      try {
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    } 
    if(bucket?.id) {
      timer()
    }
  },[bucket,interval])

  
  const paidSelected = dailyCollected?.getTLDailyCollected || null

  return (
    <div className='border-yellow-400 border bg-yellow-200 rounded-xl p-2 text-yellow-500 flex flex-col'>
      <div className='lg:text-base 2xl:text-lg font-black '>
        <h1>
          Daily Collected
          {
            !bucket?.principal &&
            <span className="text-xs font-medium capitalize">{`(${interval})`}</span> 
          }
        </h1>
      </div>
      <div className='h-full w-full flex font-medium justify-end gap-2 items-center  text-lg  2xl:text-3xl'>
        <p>{paidSelected ? paidSelected?.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}): (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</p>
     
      </div>
    </div>
  )
}

export default TLDailyCollected