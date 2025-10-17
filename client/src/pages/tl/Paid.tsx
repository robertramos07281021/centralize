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
    <div className='border-blue-500 border shadow-md bg-white rounded-sm text-blue-800 flex flex-col'>
      <div className='text-xs items-center bg-blue-400 border-b  border-blue-500 flex-col  2xl:text-lg font-black  text-center justify-center flex h-[50%]'>
        <h1>Total Amount Collected  </h1>
        <p className="text-[0.6rem] 2xl:text-xs font-medium capitalize ">{`(${intervalTypes})`}</p>
      </div>
      <div className='h-[50%] w-full flex justify-between items-center relative text-lg  2xl:text-xl'>
        {
          !loading ?
          <>
            <div className="font-bold text-center absolute -top-4 bg-blue-100  px-2.5 border rounded-full shadow-md right-2">{paidSelected ? paidSelected?.count : 0}</div>
            <div className="font-black flex justify-center w-full items-center gap-2">
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