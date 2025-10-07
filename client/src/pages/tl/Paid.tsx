import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect } from "react"
import { useSelector } from "react-redux"
import { RootState } from "../../redux/store.ts"
import { useLocation } from "react-router-dom"
import { AiOutlineLoading3Quarters } from "react-icons/ai";

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



const Paid = () => {
  const {intervalTypes, selectedBucket} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()
  const pathName = location.pathname.slice(1)
  const isTLDashboard = ['tl-dashboard','aom-dashboard'].includes(pathName)
  const {data:paidData, refetch, loading} = useQuery<{getTLPaidTotals:PaidType}>(PAID_DAILY,{variables: {input: {bucket: selectedBucket, interval: intervalTypes},skip: !isTLDashboard},notifyOnNetworkStatusChange: true})

  useEffect(()=> {
    const timer = async()=> {
      await refetch()
    }
    if(selectedBucket) {
      timer()
    }
  },[selectedBucket,intervalTypes])
  const paidSelected = paidData?.getTLPaidTotals || null

  return (
    <div className='border-blue-400 border bg-blue-200 rounded-xl p-2 text-blue-500 flex flex-col'>
      <div className='text-xs 2xl:text-lg font-black '>
        <h1>Total Amount Collected  </h1>
        <p className="text-[0.6rem] 2xl:text-xs font-medium capitalize ">{`(${intervalTypes})`}</p>
      </div>
      <div className='h-full w-full flex justify-between items-center  text-base  2xl:text-xl'>
        {
          !loading ?
          <>
            <div className="font-bold text-center ">{paidSelected ? paidSelected?.count : 0}</div>
            <div className="font-medium flex justify-end items-center gap-2">
              <p>{paidSelected ? paidSelected?.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) : (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</p>
            </div>
          </> :
          <div className="flex justify-end w-full">
            <AiOutlineLoading3Quarters className="animate-spin" />
          </div>
        }
      </div>  
    </div>
  )
}

export default Paid