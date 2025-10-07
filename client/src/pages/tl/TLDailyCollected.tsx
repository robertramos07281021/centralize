import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect } from "react";
import { RootState } from "../../redux/store";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Bucket } from "./TlDashboard.tsx";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type Collected = {
  isRPC: number
}

const DAILY_COLLECTION = gql`
  query getTLDailyCollected($input:Input) {
    getTLDailyCollected(input:$input) {
      isRPC
    }
  }
`

const SELECTED_BUCKET = gql`
  query selectedBucket($id: ID) {
    selectedBucket(id: $id) {
      principal
    }
  }
`

const TLDailyCollected= () => {
  const location = useLocation()
  const pathName = location.pathname.slice(1)
  const isTLDashboard = ['tl-dashboard','aom-dashboard']?.includes(pathName)
  const {intervalTypes, selectedBucket} = useSelector((state:RootState)=> state.auth)

  const {data:dailyCollected, refetch, loading } = useQuery<{getTLDailyCollected:Collected}>(DAILY_COLLECTION,{variables: {input: {bucket:selectedBucket, interval: intervalTypes},skip: !isTLDashboard}, notifyOnNetworkStatusChange: true})
  
  const {data:bucketData} = useQuery<{selectedBucket:Bucket}>(SELECTED_BUCKET,{variables: {id: selectedBucket}, skip: !isTLDashboard, notifyOnNetworkStatusChange: true})

  useEffect(()=> {
    const timer = async()=> {
      await refetch()
    } 
    if(selectedBucket) {
      timer()
    }
  },[selectedBucket,intervalTypes])

  const paidSelected = dailyCollected?.getTLDailyCollected || null

  return (
    <div className='border-yellow-400 border bg-yellow-200 rounded-xl p-2 text-yellow-500 flex flex-col'>
      <div className='lg:text-xs 2xl:text-lg font-black '>
        <h1>
          RPC {
            !bucketData?.selectedBucket?.principal &&
            <span className="text-[0.6rem] 2xl:text-xs font-medium capitalize">{`(${intervalTypes})`}</span> 
          }
        </h1>
      </div>
      <div className='h-full w-full flex font-medium justify-between gap-2 items-center text-base 2xl:text-xl'>
        {
          !loading ? 
          <>
            <p>Total</p>
            <p>{paidSelected ? paidSelected?.isRPC : 0}</p>
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

export default TLDailyCollected