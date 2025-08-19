import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect } from "react"
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";
import { IntervalsTypes } from "./TlDashboard";


type PaidType = {
  count: number
  amount: number
}

const PAID_DAILY = gql`
  query getTLPaidTotals($input:Input) {
    getTLPaidTotals(input:$input) {
      count
      amount
    }
  }
`

type ComponentProp = {
  bucket: string | null | undefined
  interval: IntervalsTypes 
}

const Paid:React.FC<ComponentProp> = ({bucket,interval}) => {
  const {data:paidData, refetch} = useQuery<{getTLPaidTotals:PaidType}>(PAID_DAILY,{variables: {input: {bucket: bucket, interval: interval}}})
  const dispatch = useAppDispatch()

  useEffect(()=> {
    const timer = async()=> {
      try {
        await refetch()
      } catch (error) { 
        dispatch(setServerError(true))
      }
    }
    timer()
  },[bucket,interval])
  const paidSelected = paidData?.getTLPaidTotals || null

  return (
    <div className='border-blue-400 border bg-blue-200 rounded-xl p-2 text-blue-500 flex flex-col'>
      <div className='lg:text-base 2xl:text-lg font-black '>
        <h1>Paid Collection <span className="text-xs font-medium capitalize">{`(${interval})`}</span> </h1>
      </div>
      <div className='h-full w-full flex justify-between items-center  text-lg  2xl:text-3xl'>
        <div className="font-bold text-center ">{paidSelected ? paidSelected?.count : 0}</div>
        <div className="font-medium flex justify-end items-center gap-2">
          <p>{paidSelected ? paidSelected?.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) : (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</p>
        </div>
      </div>  
    </div>
  )
}

export default Paid