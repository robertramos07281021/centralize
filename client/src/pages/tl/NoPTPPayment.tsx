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
    <div className='border-purple-500 relative shadow-md border bg-white text-purple-800 rounded-sm flex flex-col'>
      <div
        className="absolute top-2 right-2 text-purple-800"
        title={"PTP will start to calculate once you uploaded a selectives.\n No Selectives means no PTP."}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <div className='lg:text-xs bg-purple-400 2xl:text-lg font-black h-[50%] flex items-center justify-center border-b border-purple-500 '>
        <h1>
          No PTP Payment <span className="text-[0.6rem] 2xl:text-xs font- capitalize">{`(${intervalTypes})`}</span> 
        </h1>
      </div>
      <div className='h-[50%] w-full flex relative justify-between items-center  text-lg  2xl:text-xl'>
        {
          !loading ? 
          <>
            <div className="font-bold text-center px-2.5  absolute -top-3 right-2 bg-purple-100 border-purple-600 shadow-md border rounded-full">
              {paidSelected ? paidSelected.count : 0}
            </div>
            <div className="font-black flex w-full justify-center items-center gap-2 ">
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