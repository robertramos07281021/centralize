import PTP from './PTP';
import PTPKeptTl from './PTPKeptTl';
import Paid from './Paid';
import TLDailyCollected from './TLDailyCollected';
import TLAgentProduction from './TLAgentProduction';
import Targets from './Targets';
import DailyFTE from './DailyFTE';
import { HiMiniPlusCircle } from "react-icons/hi2";
import { useMemo, useRef, useState } from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import VarianceView from './VarianceView';

const DEPT_BUCKET = gql`
  query getDeptBucket {
    getDeptBucket {
      id
      name
    }
  }
`

type Bucket = {
  id: string
  name: string
}

const TlDashboard  = () => {

  const [showSelector, setShowSelector] = useState(false)
  const {data} = useQuery<{getDeptBucket:Bucket[]}>(DEPT_BUCKET)
  const {userLogged} = useSelector((state:RootState)=> state.auth)

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const bucketData = data?.getDeptBucket || []
    return Object.fromEntries(bucketData.map(bd=> [bd.id, bd.name]))
  },[data])
  
  const [selectedBucket, setSelectedBucket] = useState<string | null | undefined>(userLogged?.buckets[0])

  const bucketSelectorRef = useRef<HTMLDivElement | null>(null)

  return (
    <div className="h-full overflow-hidden p-2 grid grid-rows-8 grid-cols-8 bg-slate-600/10 gap-2 relative" onMouseDown={(e)=> {
      if(!bucketSelectorRef.current?.contains(e.target as Node)) {
        setShowSelector(false)
      }
    }}>
      <div className='grid grid-cols-6 gap-2 col-span-8 row-span-2'>
        <DailyFTE/>
        <PTP/>
        <PTPKeptTl/>
        <Paid/>
        <TLDailyCollected/>
      </div>

      <div className='col-span-full grid grid-cols-8 row-span-6 gap-2'>
        <VarianceView/>
        <TLAgentProduction bucket={selectedBucket}/>
        <Targets bucket={selectedBucket}/>
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
      <HiMiniPlusCircle className={` text-6xl absolute bottom-5 right-5 duration-200 ${showSelector ? "rotate-45" : ""}`} onClick={()=> setShowSelector(prev=> !prev)}/>
    </div>
  )
}

export default TlDashboard
