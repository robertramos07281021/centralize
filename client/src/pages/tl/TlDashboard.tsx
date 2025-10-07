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
import { setIntervalTypes, setSelectedBucket } from '../../redux/slices/authSlice';
import { SiGooglemessages } from "react-icons/si";
import MessageModal, { MessageChildren } from './MessageModal';
import { IntervalsTypes } from '../../middleware/types.ts';
import { useLocation } from 'react-router-dom';
import NoPTPPayment from './NoPTPPayment.tsx';

const DEPT_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      _id
      name
      principal
      isActive
    }
  }
`

export type Bucket = {
  _id: string
  name: string
  principal: boolean
  isActive: boolean
}

const AOM_BUCKET = gql`
  query findAomBucket {
    findAomBucket {
      buckets {
        _id
        name
      }
    }
  }
`

type AomBucket = {
  buckets: Bucket[]
}


const TlDashboard  = () => {
  const {userLogged, selectedBucket, intervalTypes} = useSelector((state:RootState)=> state.auth)

  const [showSelector, setShowSelector] = useState<boolean>(false)
  const [showIntervals,setShowIntervals] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const location = useLocation()
  const pathName = location.pathname.slice(1)
  const isTLDashboard = ['tl-dashboard','aom-dashboard'].includes(pathName)
  
  const {data,refetch} = useQuery<{getAllBucket:Bucket[]}>(DEPT_BUCKET,{notifyOnNetworkStatusChange: true, skip: !isTLDashboard})

  const {data:aomBucketData, refetch:bucketDateRefetch} = useQuery<{findAomBucket:AomBucket[]}>(AOM_BUCKET,{notifyOnNetworkStatusChange: true, skip: !isTLDashboard})

  const newAomBucketsData = aomBucketData?.findAomBucket.flatMap(ab => ab.buckets) || []

  const buckets = userLogged?.type === "AOM" ? newAomBucketsData.map(abd=> abd._id) : userLogged?.buckets

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const bucketData = data?.getAllBucket || []
    return Object.fromEntries(bucketData.map(bd=> [bd._id, bd.name]))
  },[data])
  const [isOpenMessage, setIsopenMessage] = useState<boolean>(false)

  const bucketSelectorRef = useRef<HTMLDivElement | null>(null)
  const intervalSelectorRef = useRef<HTMLDivElement | null>(null)

  const findBucket = data?.getAllBucket.find(bucket => bucket._id === selectedBucket)

  useEffect(()=> {
    const refetching = async() => {
      await refetch()
      await bucketDateRefetch()
    }
    refetching()
  },[])

  useEffect(()=> {
    if(isTLDashboard && userLogged && !selectedBucket){
      if(userLogged.type === "AOM") {
        dispatch(setSelectedBucket(newAomBucketsData[0]?._id))
      } else {
        dispatch(setSelectedBucket(userLogged?.buckets[0]))
      }
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
            buckets?.map(x=> {
              const findBucket = data?.getAllBucket.find(y=> x === y._id)
              return findBucket?.isActive && (
                <label key={x} className={`w-full border border-slate-400 text-gray-700 hover:bg-slate-200 cursor-pointer px-2 py-1 rounded ${selectedBucket === x ? "bg-blue-200" : ""}`}>
                <input type="radio" name='bucketSelector' id={bucketObject[x]} value={x} onChange={()=> dispatch(setSelectedBucket(x))} hidden/>
                {bucketObject[x]}
              </label>

              )
            }
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
        <SiGooglemessages  className='cursor-pointer bg-white rounded-full' onClick={()=> setIsopenMessage(prev => !prev)}/>
        {
          !findBucket?.principal &&
          <BsFilterCircleFill className='cursor-pointer bg-white rounded-full' onClick={()=> setShowIntervals(prev=> !prev)}/>
        }
        {
          (userLogged && (buckets && buckets?.length > 1)) &&
          <BsFillPlusCircleFill className={`cursor-pointer duration-200 bg-white rounded-full ${showSelector ? "rotate-45" : ""}`} onClick={()=> setShowSelector(prev=> !prev)}/>
        }
      </div>
    </div>
  )
}

export default TlDashboard
