import gql from "graphql-tag";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { RootState } from "../../redux/store.ts";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useEffect } from "react";

type NoPTPCollection = {
  count: number
  amount: number
}

const NO_PTP_COLLECTION = gql`
  query noPTPCollection($bucket: ID, $interval: String) {
    noPTPCollection(bucket: $bucket, interval: $interval) {
      count
      amount
    }
  }
`
const NoPTPPayment = () => {
  const {intervalTypes, selectedBucket, userLogged} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()
  const isTLDashboard = location.pathname.includes('tl-dashboard')
  const {data:noPTPCollection, refetch, loading} = useQuery<{noPTPCollection:NoPTPCollection}>(NO_PTP_COLLECTION,{variables: {bucket: selectedBucket, interval: intervalTypes},skip: !isTLDashboard && !userLogged,notifyOnNetworkStatusChange: true})
  
  useEffect(()=> {
    const timer = async()=> {
      await refetch()
    }
    if(selectedBucket) {
      timer()
    }
  },[selectedBucket,intervalTypes])
  const paidSelected = noPTPCollection?.noPTPCollection || null

  return (
    <div className='border-indigo-400 border bg-indigo-200 text-indigo-500 rounded-xl p-2 flex flex-col'>
      <div className='lg:text-xs 2xl:text-lg font-black '>
        <h1>
          No PTP Payment <span className="text-[0.6rem] 2xl:text-xs font-medium capitalize">{`(${intervalTypes})`}</span> 
        </h1>
      </div>
      <div className='h-full w-full flex justify-between items-center  text-base  2xl:text-xl'>
        {
          !loading ? 
          <>
            <div className="font-bold text-center ">
              {paidSelected ? paidSelected.count : 0}
            </div>
            <div className="font-medium flex justify-end items-center gap-2">
              <p>{paidSelected ? paidSelected.amount?.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) : (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</p>
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

export default NoPTPPayment