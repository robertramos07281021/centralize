import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect } from "react"
import { useAppDispatch } from "../../redux/store";
import { IntervalsTypes } from "./TlDashboard";
import { setServerError } from "../../redux/slices/authSlice";

type PTPKept = {
  count: number
  amount: number
}

const PTP_KEPT_TOTAL = gql`
  query getTLPTPKeptTotals($input: Input) {
    getTLPTPKeptTotals(input:$input) {
      count
      amount
    }
  }
`


type ComponentProp = {
  bucket: string | null | undefined
  interval: IntervalsTypes
}

const PTPKeptTl:React.FC<ComponentProp> = ({bucket, interval}) => {
  const dispatch = useAppDispatch()
  const {data:ptpKetpData, refetch} = useQuery<{getTLPTPKeptTotals:PTPKept}>(PTP_KEPT_TOTAL,{variables: {input: {bucket: bucket, interval: interval}}})

  useEffect(()=> {
    const timer = async () => {
      try {
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    }  
    timer()
  },[bucket, interval])

  const paidSelected = ptpKetpData?.getTLPTPKeptTotals || null

  return (
    <div className='border-green-400 border bg-green-200 text-green-500 rounded-xl p-2 flex flex-col'>
      <div className='lg:text-base 2xl:text-lg font-black '>
        <h1>PTP Kept <span className="text-xs font-medium capitalize">{`(${interval})`}</span> </h1>
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

export default PTPKeptTl