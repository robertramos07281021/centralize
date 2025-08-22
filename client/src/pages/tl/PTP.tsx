import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect } from "react"
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";
import { Bucket, IntervalsTypes } from "./TlDashboard";

type PTPType = {
  count: number
  amount: number
}

const PTP_DAILY = gql`
  query getTLPTPTotals($input: Input) {
    getTLPTPTotals(input:$input) {
      count
      amount
    }
  }
`

type ComponentProp = {
  bucket: Bucket | null | undefined
  interval: IntervalsTypes 
}


const PTP:React.FC<ComponentProp> = ({bucket, interval}) => {
  const {data:ptpData, refetch} = useQuery<{getTLPTPTotals:PTPType}>(PTP_DAILY,{variables: {input: {bucket: bucket?._id, interval },skip: !bucket?._id}})
  const dispatch = useAppDispatch()

  useEffect(()=> {
    const timer = async () => {
      try {
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    }
    if(bucket?._id) {
      timer()
    }
  },[bucket?._id, interval])

  const paidSelected = ptpData?.getTLPTPTotals || null
  


  return (
    <div className='border-orange-400 border bg-orange-200 text-orange-500 rounded-xl p-2 flex flex-col'>
      <div className='lg:text-base 2xl:text-lg font-black '>
        <h1>PTP <span className="text-xs font-medium capitalize">{`(${interval})`}</span> </h1>
      </div>
      <div className='h-full w-full flex justify-between items-center  text-lg  2xl:text-3xl'>
        <div className="font-bold text-center ">{paidSelected ? paidSelected.count : 0}</div>
        <div className="font-medium flex justify-end items-center gap-2">
          <p>{paidSelected ? paidSelected?.amount?.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) : (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</p>
        </div>
      </div> 
    </div>
  )
}

export default PTP