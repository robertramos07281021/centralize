import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect } from "react"
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

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

          // <div className="flex justify-end w-full">
          //   <AiOutlineLoading3Quarters className="animate-spin" />
          // </div>

const PTPKeptTl = () => {

  const {intervalTypes, selectedBucket} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()
  const pathName = location.pathname.slice(1)
  const isTLDashboard = ['tl-dashboard','aom-dashboard'].includes(pathName)

  const {data:ptpKetpData, refetch, loading} = useQuery<{getTLPTPKeptTotals:PTPKept}>(PTP_KEPT_TOTAL,{variables: {input: {bucket: selectedBucket, interval: intervalTypes},skip: !isTLDashboard, notifyOnNetworkStatusChange: true}})

  useEffect(()=> {
    const timer = async () => {
      await refetch()
    }  
    if(selectedBucket) {
      timer()
    }
  },[intervalTypes, selectedBucket])

  const paidSelected = ptpKetpData?.getTLPTPKeptTotals || null

  return (
    <div className='border-green-400 border bg-green-200 text-green-500 rounded-xl p-2 flex flex-col'>
      <div className='lg:text-xs 2xl:text-lg font-black '>
        <h1>Kept <span className="text-[0.6rem] 2xl:text-xs font-medium capitalize">{`(${intervalTypes})`}</span> </h1>
      </div>
      <div className='h-full w-full flex justify-between items-center  text-base  2xl:text-xl'>
        {
          !loading ?
          <>
            <div className="font-bold text-center ">{paidSelected ? paidSelected?.count : 0}</div>
            <div className="font-medium flex justify-end items-center gap-2">
              <p>{paidSelected ? paidSelected?.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) : (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</p>
            </div>
          </> 
          :
          <div className="flex justify-end w-full">
            <AiOutlineLoading3Quarters className="animate-spin" />
          </div>
        }
      </div>
    </div>
  )
}

export default PTPKeptTl