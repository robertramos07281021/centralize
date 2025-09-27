import PTP from './PTP';
import PTPKeptTl from './PTPKeptTl';
import Paid from './Paid';
import TLDailyCollected from './TLDailyCollected';
import TLAgentProduction from './TLAgentProduction';
import Targets from './Targets';
import DailyFTE from './DailyFTE';
import { useEffect, useMemo, useRef, useState } from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../redux/store';
import { BsFilterCircleFill ,BsFillPlusCircleFill  } from "react-icons/bs";
import { setIntervalTypes, setSelectedBucket, setServerError } from '../../redux/slices/authSlice';
import { SiGooglemessages } from "react-icons/si";
import MessageModal, { MessageChildren } from './MessageModal';
import { IntervalsTypes } from '../../middleware/types.ts';
import { useLocation } from 'react-router-dom';
import NoPTPPayment from './NoPTPPayment.tsx';

const DEPT_BUCKET = gql`
  query getDeptBucket {
    getDeptBucket {
      _id
      name
      principal
    }
  }
`

export type Bucket = {
  _id: string
  name: string
  principal: boolean
}



const TlDashboard  = () => {

  const [showSelector, setShowSelector] = useState<boolean>(false)
  const [showIntervals,setShowIntervals] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const location = useLocation()
  const {data,refetch} = useQuery<{getDeptBucket:Bucket[]}>(DEPT_BUCKET)
  const {userLogged, selectedBucket, intervalTypes} = useSelector((state:RootState)=> state.auth)

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const bucketData = data?.getDeptBucket || []
    return Object.fromEntries(bucketData.map(bd=> [bd._id, bd.name]))
  },[data])
  const [isOpenMessage, setIsopenMessage] = useState<boolean>(false)

  const bucketSelectorRef = useRef<HTMLDivElement | null>(null)
  const intervalSelectorRef = useRef<HTMLDivElement | null>(null)

  const findBucket = data?.getDeptBucket.find(bucket => bucket._id === selectedBucket)

  useEffect(()=> {
    const refetching = async() => {
      try {
        await  refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    }
    refetching()
  },[])

  useEffect(()=> {
    if(location.pathname.includes('tl-dashboard') && userLogged && !selectedBucket){
      dispatch(setSelectedBucket(userLogged?.buckets[0]))
    }
  },[location.pathname,userLogged])


  useEffect(()=> {
    if(findBucket && findBucket.principal ) {
      dispatch(setIntervalTypes(IntervalsTypes.MONTHLY))
    }
  },[findBucket])

  const messageRef = useRef<MessageChildren | null>(null)

  return (
    <div className="h-full overflow-hidden p-2 grid grid-rows-13 grid-cols-8 bg-slate-600/10 gap-2 relative" onMouseDown={(e)=> {
      if(!bucketSelectorRef.current?.contains(e.target as Node)) {
        setShowSelector(false)
      }
      if(!intervalSelectorRef.current?.contains(e.target as Node)) {
        setShowIntervals(false)
      }
      if(!messageRef.current?.divElement?.contains(e.target as Node)) {
        setIsopenMessage(false)
      }
    }}>
      <div className='grid grid-cols-6 gap-2 col-span-8 row-span-2'>
        <DailyFTE />
        <div className='grid grid-cols-5 col-span-4 gap-2 '>
          <TLDailyCollected />
          <PTP/>
          <PTPKeptTl/>
          <NoPTPPayment/>
          <Paid />
        </div>
      </div>

      <div className='col-span-full grid grid-cols-8 row-span-11 gap-2'>
        <TLAgentProduction />
        <Targets />
      </div>
      {
        showSelector &&
        <div className='absolute bottom-10 right-20 w-2/20 border bg-white rounded-md border-slate-500 p-2 flex flex-col gap-2' ref={bucketSelectorRef}>
          {
            userLogged?.buckets.map(x=> 
              <label key={x} className={`w-full border border-slate-400 text-gray-700 hover:bg-slate-200 cursor-pointer px-2 py-1 rounded ${selectedBucket === x ? "bg-blue-200" : ""}`}>
                <input type="radio" name='bucketSelector' id={bucketObject[x]} value={x} onChange={()=> dispatch(setSelectedBucket(x))} hidden/>
                {bucketObject[x]}
              </label>
            )
          }
        </div>
      }
      { showIntervals &&
        <div className='absolute bottom-10 right-20 w-2/20 border bg-white rounded-md border-slate-500 p-2 flex flex-col gap-2' ref={intervalSelectorRef}>
          {
            Object.entries(IntervalsTypes).map(([key,value]) => 
            <label key={key} className={`w-full border border-slate-400 text-gray-700 hover:bg-slate-200 cursor-pointer px-2 py-1 rounded ${value === intervalTypes ? "bg-blue-200" : ""}`}>
              <input type="radio" name='bucketSelector' id={value} value={value} onChange={(e)=> dispatch(setIntervalTypes(e.target.value as IntervalsTypes))} hidden/>
              <span className='uppercase'>
                {value}
              </span>
            </label>
            
            )
          }
        </div>
      }
      {
        isOpenMessage &&
        <MessageModal bucket={findBucket} ref={messageRef} closeModal={()=> setIsopenMessage(false)}/>
      }

      <div className='text-5xl absolute bottom-5 right-5 flex flex-col gap-5'>
        <SiGooglemessages  className='cursor-pointer' onClick={()=> setIsopenMessage(prev => !prev)}/>
        {
          !findBucket?.principal &&
          <BsFilterCircleFill className='cursor-pointer' onClick={()=> setShowIntervals(prev=> !prev)}/>
        }
        {
          userLogged && userLogged?.buckets?.length > 1 &&
          <BsFillPlusCircleFill className={`cursor-pointer duration-200 bg-white rounded-full ${showSelector ? "rotate-45" : ""}`} onClick={()=> setShowSelector(prev=> !prev)}/>
        }
      </div>
    </div>
  )
}

export default TlDashboard
