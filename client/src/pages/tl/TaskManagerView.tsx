import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RiArrowDownSFill, RiArrowUpSFill   } from "react-icons/ri";
import GroupSection from "./GroupSection";
import TaskDispoSection from "./TaskDispoSection";
import AgentSection from "./AgentSection";
import { RootState, useAppDispatch } from "../../redux/store";
import { setAgent, setSelectedDisposition, setSelectedGroup, setServerError, setTasker, setTaskFilter, Tasker, TaskFilter } from "../../redux/slices/authSlice";
import { useSelector } from "react-redux";

type DispositionTypes = {
  id:string
  name: string
  code: string
}

const GET_ALL_DISPOSITION_TYPE = gql`
  query GetDispositionTypes {
  getDispositionTypes {
    id
    name
    code
  }
}
`
type Bucket = {
  id: string
  name: string
}

const BUCKETS = gql`
  query GetTLBucket {
    getTLBucket {
      id
      name
    }
  }

`

const TaskManagerView = () => {
  const dispatch = useAppDispatch()
  const {tasker, taskFilter, selectedDisposition} = useSelector((state:RootState)=> state.auth)
  const {data:DispositionTypes, refetch} = useQuery<{getDispositionTypes:DispositionTypes[]}>(GET_ALL_DISPOSITION_TYPE)
  const {data:bucketData, refetch:tlBucketRefetch} = useQuery<{getTLBucket:Bucket[]}>(BUCKETS)
  const [bucketSelect, setBucketSelect] = useState<keyof typeof bucketObject | "">("")

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await refetch()
        await tlBucketRefetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })
    return () => clearTimeout(timer)
  },[refetch, tlBucketRefetch])

  
  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const tlBuckets = bucketData?.getTLBucket || []
    return Object.fromEntries(tlBuckets.map(e=> [e.name, e.id]))
  },[bucketData])

  useEffect(()=> {
    if(bucketData) {
      setBucketSelect(bucketData.getTLBucket[0].name)
    }
  },[bucketData])
  useEffect(()=> {
    dispatch(setSelectedGroup(""))
    dispatch(setAgent(""))
  },[tasker,dispatch])

  const handleCheckBox = useCallback((value:string, e: React.ChangeEvent<HTMLInputElement>) => {
    const dispositions = selectedDisposition || [];
    if (e.target.checked) {
      dispatch(setSelectedDisposition([...dispositions, value]));
    } else {
      dispatch(setSelectedDisposition(dispositions.filter((d) => d !== value)));
    }
  },[selectedDisposition,dispatch])

  const [showSelection, setShowSelection] = useState<boolean>(false)

  const onClick = useCallback(()=> {
    setShowSelection(!showSelection) 
  },[setShowSelection,showSelection])


  const [dpd, setDpd] = useState<number | null>(null)

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">

      <div className="flex gap-10 p-5 items-start">
        <div className=" flex gap-5 lg:text-[0.6em] 2xl:text-xs w-full flex-col">
          <div className="flex gap-5">
            <fieldset className="flex p-1.5 gap-4 px-4 border rounded-md border-slate-300">
              <legend className="font-medium text-slate-600 px-2">Tasker</legend>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input 
                  id="default-radio-1" 
                  type="radio" 
                  value={Tasker.group}
                  name="default-radio"
                  checked={tasker === Tasker.group}
                  onChange={(e)=>  dispatch(setTasker(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"/>
                <span >Group</span>
              </label>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input 
                  id="default-radio-2" 
                  type="radio" 
                  value={Tasker.individual}
                  name="default-radio"
                  checked={tasker === Tasker.individual}
                  onChange={(e)=> dispatch(setTasker(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 "/>
                <span>Individual</span>
              </label>
            </fieldset>

            <fieldset className="flex p-1.5 gap-4 px-4 border rounded-md border-slate-300">
              <legend className="font-medium text-slate-600 px-2">Tasks Filter</legend>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input 
                  id="default-radio-3" 
                  type="radio" 
                  value={TaskFilter.assigned}
                  name="default-radio-1"
                  checked={taskFilter === TaskFilter.assigned}
                  onChange={(e)=> dispatch(setTaskFilter(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"/>
                <span >Assigned</span>
              </label>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input 
                  id="default-radio-4" 
                  type="radio" 
                  value={TaskFilter.unassigned} 
                  name="default-radio-1"
                  checked={taskFilter === TaskFilter.unassigned}
                  onChange={(e)=> dispatch(setTaskFilter(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 "/>
                <span>Unassigned</span>
              </label>
            </fieldset>
          </div>
          <div className="flex gap-5">
            <div className="w-1/2 border rounded-md h-10 border-slate-300 relative cursor-default z-50" title={selectedDisposition?.toString()} >
              {
                showSelection ?
                <RiArrowUpSFill  className="absolute right-2 top-2 text-2xl"  onClick={onClick}/>
                :
                <RiArrowDownSFill className="absolute right-2 top-2 text-2xl" onClick={onClick}/>
              }
              <div className="lg:w-60 2xl:w-80 h-full px-2 truncate font-bold text-slate-500 flex items-center" onClick={onClick}>
                {selectedDisposition?.length > 0 ? selectedDisposition?.toString(): "Select Disposition"}
              </div>
              {
                showSelection &&
                <div className="w-full h-96  border overflow-y-auto absolute top-10 flex gap-5 p-5 text-xs flex-col border-slate-300 bg-white">
                {
                  DispositionTypes?.getDispositionTypes.filter((e)=> e.name !== "PAID").map((e) =>
                    <label key={e.id} className="flex gap-2 text-slate-500">
                      <input   
                      type="checkbox" 
                      name={e.name} 
                      id={e.name} 
                      value={e.name}
                      checked={selectedDisposition?.includes(e.name)}
                      onChange={(e)=> handleCheckBox(e.target.value, e)} />
                      <p>{e.name}</p>
                    </label>
                  )
                }
                </div>
              }
            </div>
            <select 
              className="w-1/2 border border-slate-300 rounded-md font-bold text-slate-500 px-1"
              name="bucket"
              id="bucket"
              value={bucketSelect}
              onChange={(e)=> setBucketSelect(e.target.value)}
            >
        
              {
                bucketData?.getTLBucket.map(e=> 
                  <option key={e.id} value={e.name}>{e.name}</option>
                )
              }
            </select>
            <label>
             <input type="number"
               className="w-15 h-10 border border-slate-300 rounded-md font-bold text-slate-500 px-1"
              name="dpd"
              id="dpd"
              min={0}
              value={dpd ?? ""}
              onChange={(e)=> {
                 const val = e.target.value;
                  setDpd(val === "" ? null : Number(val));
              }}
             />
            </label>
          </div>
        </div>
        {
          tasker === "group" ? <GroupSection/> : <AgentSection/>
        }
      </div>
      <TaskDispoSection selectedBucket={bucketObject[bucketSelect] || null} dpd={dpd}/>
    </div>
  )
}

export default TaskManagerView