import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect } from "react"
import { RootState, useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

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




const PTP = () => {
  const {intervalTypes, selectedBucket} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()
  const pathName = location.pathname.slice(1)
  const isTLDashboard = ['tl-dashboard','aom-dashboard'].includes(pathName)

  const {data:ptpData, refetch, loading} = useQuery<{getTLPTPTotals:PTPType}>(PTP_DAILY,{variables: {input: {bucket: selectedBucket, interval: intervalTypes },skip: !isTLDashboard}, notifyOnNetworkStatusChange: true})
  const dispatch = useAppDispatch()

  useEffect(()=> {
    const timer = async () => {
      try {
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    }
    if(selectedBucket) {
      timer()
    }
  },[selectedBucket,intervalTypes])

  const paidSelected = ptpData?.getTLPTPTotals || null
  


  return (
    <div className='border-orange-400 border bg-orange-200 text-orange-500 rounded-xl p-2 flex flex-col'>
      <div className='lg:text-xs 2xl:text-lg font-black '>
        <h1>PTP <span className="text-[0.6rem] 2xl:text-xs font-medium capitalize">{`(${intervalTypes})`}</span> </h1>
      </div>
      <div className='h-full w-full flex justify-between items-center  text-lg  2xl:text-xl'>
        {
          !loading ? 
          <>
            <div className="font-bold text-center ">
              {paidSelected ? paidSelected.count : 0}
            </div>
            <div className="font-medium flex justify-end items-center gap-2">
              <p>{paidSelected ? paidSelected?.amount?.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) : (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</p>
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

export default PTP