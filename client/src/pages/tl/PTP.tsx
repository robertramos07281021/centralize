import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useMemo } from "react"
import { IoMdArrowDown,IoMdArrowUp  } from "react-icons/io";

type PTP = {
  bucket: string
  count: number
  amount: number
  yesterday: number
}

const PTP_DAILY = gql`
  query GetTLPTPTotals {
    getTLPTPTotals {
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


const PTP = () => {
  const {data:tlBucketData} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET)
  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const tlBuckets = tlBucketData?.getDeptBucket || []
    return Object.fromEntries(tlBuckets.map(e=> [e.id, e.name]))
  },[tlBucketData])
  const {data:ptpData} = useQuery<{getTLPTPTotals:PTP[]}>(PTP_DAILY)

  return (
    <div className='border-orange-400 border bg-orange-200 rounded-xl p-2 flex flex-col'>
      <h1 className='lg:text-base 2xl:text-xl font-black text-orange-500'>PTP <span className="text-sm font-medium">(Daily)</span></h1>
      <div className='h-full w-full flex flex-col justify-center '>
        {
          ptpData?.getTLPTPTotals.map((tpt,index)=> {
            const arrow = tpt.amount - tpt.yesterday > 0 ? <IoMdArrowUp className="text-green-500"/> : <IoMdArrowDown className="text-red-500"/>
            return tpt.amount > 0 && (
              <div key={index} className='grid grid-cols-3 lg:text-[0.6em] 2xl:text-xs text-orange-500'>
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

export default PTP