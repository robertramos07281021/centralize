import PTP from './PTP';
import PTPKeptTl from './PTPKeptTl';
import Paid from './Paid';
import TLDailyCollected from './TLDailyCollected';
import TLAgentProduction from './TLAgentProduction';
import Targets from './Targets';
import DailyFTE from './DailyFTE';
import { useMemo, useRef, useState } from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { BsFilterCircleFill ,BsFillPlusCircleFill  } from "react-icons/bs";


const DEPT_BUCKET = gql`
  query getDeptBucket {
    getDeptBucket {
      id
      name
      principal
    }
  }
`

type Bucket = {
  id: string
  name: string
  principal: boolean
}

export enum IntervalsTypes {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

const TlDashboard  = () => {

  const [showSelector, setShowSelector] = useState<boolean>(false)
  const [showIntervals,setShowIntervals] = useState<boolean>(false)

  const {data} = useQuery<{getDeptBucket:Bucket[]}>(DEPT_BUCKET)
  const {userLogged} = useSelector((state:RootState)=> state.auth)

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const bucketData = data?.getDeptBucket || []
    return Object.fromEntries(bucketData.map(bd=> [bd.id, bd.name]))
  },[data])
  
  const [selectedBucket, setSelectedBucket] = useState<string | null | undefined>(userLogged?.buckets[0])
  const [selectedIntervals, setSelectedIntervals] = useState<IntervalsTypes>(IntervalsTypes.DAILY) 

  const bucketSelectorRef = useRef<HTMLDivElement | null>(null)
  const intervalSelectorRef = useRef<HTMLDivElement | null>(null)

  const findBucket = data?.getDeptBucket.find(x=> x.id === selectedBucket)

  return (
    <div className="h-full overflow-hidden p-2 grid grid-rows-13 grid-cols-8 bg-slate-600/10 gap-2 relative" onMouseDown={(e)=> {
      if(!bucketSelectorRef.current?.contains(e.target as Node)) {
        setShowSelector(false)
      }
      if(!intervalSelectorRef.current?.contains(e.target as Node)) {
        setShowIntervals(false)
      }

    }}>
      <div className='grid grid-cols-6 gap-2 col-span-8 row-span-2'>
        <DailyFTE bucket={selectedBucket}/>
        <PTP bucket={selectedBucket} interval={selectedIntervals}/>
        <PTPKeptTl bucket={selectedBucket} interval={selectedIntervals}/>
        <Paid bucket={selectedBucket} interval={selectedIntervals}/>
        <TLDailyCollected bucket={selectedBucket} interval={selectedIntervals}/>
      </div>

      <div className='col-span-full grid grid-cols-8 row-span-11 gap-2'>
        <TLAgentProduction bucket={selectedBucket} interval={selectedIntervals}/>
        <Targets bucket={selectedBucket} interval={selectedIntervals}/>
      </div>
      {
        showSelector &&
        <div className='absolute bottom-10 right-20 w-2/20 border bg-white rounded-md border-slate-500 p-2 flex flex-col gap-2' ref={bucketSelectorRef}>
          {
            userLogged?.buckets.map(x=> 
              <label key={x} className={`w-full border border-slate-400 text-gray-700 hover:bg-slate-200 cursor-pointer px-2 py-1 rounded ${selectedBucket === x ? "bg-blue-200" : ""}`}>
                <input type="radio" name='bucketSelector' id={bucketObject[x]} value={bucketObject[x]} onChange={()=> setSelectedBucket(x)} hidden/>
                {bucketObject[x]}
              </label>
            )
          }
        </div>
      }
      { showIntervals &&
        <div className='absolute bottom-10 right-20 w-2/20 border bg-white rounded-md border-slate-500 p-2 flex flex-col gap-2' ref={intervalSelectorRef}>
          <label className={`w-full border border-slate-400 text-gray-700 hover:bg-slate-200 cursor-pointer px-2 py-1 rounded ${selectedIntervals === IntervalsTypes.DAILY ? "bg-blue-200" : ""}`}>
            <input type="radio" name='bucketSelector' id={IntervalsTypes.DAILY} value={IntervalsTypes.DAILY} onChange={(e)=> setSelectedIntervals(e.target.value as IntervalsTypes)} hidden/>
            <span className='uppercase'>
              {IntervalsTypes.DAILY}
            </span>
          </label>
          <label className={`w-full border border-slate-400 text-gray-700 hover:bg-slate-200 cursor-pointer px-2 py-1 rounded ${selectedIntervals === IntervalsTypes.WEEKLY ? "bg-blue-200" : ""}`}>
            <input type="radio" name='bucketSelector' id={IntervalsTypes.WEEKLY} value={IntervalsTypes.WEEKLY} onChange={(e)=> setSelectedIntervals(e.target.value as IntervalsTypes)} hidden/>
            <span className='uppercase'>
              {IntervalsTypes.WEEKLY}
            </span>
          </label>
          <label className={`w-full border border-slate-400 text-gray-700 hover:bg-slate-200 cursor-pointer px-2 py-1 rounded ${selectedIntervals === IntervalsTypes.MONTHLY ? "bg-blue-200" : ""}`}>
            <input type="radio" name='bucketSelector' id={IntervalsTypes.MONTHLY} value={IntervalsTypes.MONTHLY} onChange={(e)=> setSelectedIntervals(e.target.value as IntervalsTypes)} hidden/>
            <span className='uppercase'>
              {IntervalsTypes.MONTHLY}
            </span>
          </label>
        </div>
      }

      <div className='text-5xl absolute bottom-5 right-5 flex flex-col gap-5'>
        {
          !findBucket?.principal &&
          <BsFilterCircleFill className='' onClick={()=> setShowIntervals(prev=> !prev)}/>
        }
        {
          userLogged && userLogged?.buckets?.length > 1 &&
          <BsFillPlusCircleFill className={` duration-200 ${showSelector ? "rotate-45" : ""}`} onClick={()=> setShowSelector(prev=> !prev)}/>
        }
      </div>
    </div>
  )
}

export default TlDashboard
