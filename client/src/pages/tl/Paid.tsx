import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useMemo } from "react"
import { IoMdArrowDown,IoMdArrowUp  } from "react-icons/io";
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";


type Paid = {
  bucket: string
  count: number
  amount: number
  yesterday: number
}

const PAID_DAILY = gql`
  query getTLPaidTotals {
    getTLPaidTotals {
      bucket
      count
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

const Paid = () => {
  const {data:tlBucketData, refetch:deptBucketRefetch} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET)

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const tlBuckets = tlBucketData?.getDeptBucket || []
    return Object.fromEntries(tlBuckets.map(e=> [e.id, e.name]))
  },[tlBucketData])

  const {data:paidData, refetch} = useQuery<{getTLPaidTotals:Paid[]}>(PAID_DAILY)
  const dispatch = useAppDispatch()

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await refetch()
        await deptBucketRefetch()
      } catch (error) { 
        dispatch(setServerError(true))
      }
    })
    return ()=> clearTimeout(timer)
  },[refetch,deptBucketRefetch])

  return (
    <div className='border-blue-400 border bg-blue-200 rounded-xl p-2 flex flex-col'>
      <div className='lg:text-base 2xl:text-lg font-black text-blue-500'>
        <h1>Paid Collected </h1>
        <p className="text-xs font-medium">(Daily per Bucket)</p>
      </div>
      <div className='h-full w-full flex flex-col justify-center '>

        {
          paidData?.getTLPaidTotals.map((tpt,index) => {
            const arrow = tpt.amount - tpt.yesterday > 0 ? <IoMdArrowUp className="text-green-500"/> : <IoMdArrowDown className="text-red-500"/>
            return tpt.amount !== 0 && (
              <div key={index} className='grid grid-cols-3 lg:text-[0.6em] 2xl:text-xs text-blue-500'>
                <div className="font-bold">{bucketObject[tpt.bucket]}</div>
                <div className="font-medium flex justify-between px-2 items-center "><div>{tpt.count}</div> {arrow}</div>
                <div className="font-medium ">{tpt.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
              </div>
            )
          })
        }
      </div>  
    </div>
  )
}

export default Paid