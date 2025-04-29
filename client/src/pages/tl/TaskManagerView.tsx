import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { RiArrowDownSFill, RiArrowUpSFill   } from "react-icons/ri";
import GroupSection from "../../components/GroupSection";
import TaskDispoSection from "../../components/TaskDispoSection";
import AgentSection from "../../components/AgentSection";
import { RootState, useAppDispatch } from "../../redux/store";
import { setAgent, setSelectedDisposition, setSelectedGroup, setTasker, setTaskFilter } from "../../redux/slices/authSlice";
import { useSelector } from "react-redux";

interface DispositionTypes {
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
const TaskManagerView = () => {
  const dispatch = useAppDispatch()
  const {tasker, taskFilter, selectedDisposition} = useSelector((state:RootState)=> state.auth)
  const {data:DispositionTypes} = useQuery<{getDispositionTypes:DispositionTypes[]}>(GET_ALL_DISPOSITION_TYPE)
 
  
  useEffect(()=> {
    dispatch(setSelectedGroup(""))
    dispatch(setAgent(""))
  },[tasker,dispatch])

  const handleCheckBox= (value:string, e: React.ChangeEvent<HTMLInputElement>) => {
    const dispositions = selectedDisposition || [];
    if (e.target.checked) {
      dispatch(setSelectedDisposition([...dispositions, value]));
    } else {
      dispatch(setSelectedDisposition(dispositions.filter((d) => d !== value)));
    }
  }

  const [showSelection, setShowSelection] = useState<boolean>(false)
  const onClick = ()=> {
    setShowSelection(!showSelection) 
  }

  return (
    <div className="h-full w-full flex flex-col relative">
      <div className="flex gap-10 p-5 mt-5 items-start">
        <div className=" flex gap-5 lg:text-[0.6em] 2xl:text-xs w-full flex-col">
         
          <div className="flex gap-5">
            <fieldset className="flex p-1.5 gap-4 px-4 border rounded-md border-slate-300">
              <legend className="font-medium text-slate-600 px-2">Tasker</legend>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input 
                  id="default-radio-1" 
                  type="radio" 
                  value="group" 
                  name="default-radio"
                  checked={tasker === "group"}
                  onChange={(e)=>  dispatch(setTasker(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"/>
                <span >Group</span>
              </label>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input 
                  id="default-radio-2" 
                  type="radio" 
                  value="individual" 
                  name="default-radio"
                  checked={tasker === "individual"}
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
                  value="assigned" 
                  name="default-radio-1"
                  checked={taskFilter === "assigned"}
                  onChange={(e)=> dispatch(setTaskFilter(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"/>
                <span >Assigned</span>
              </label>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input 
                  id="default-radio-4" 
                  type="radio" 
                  value="unassigned" 
                  name="default-radio-1"
                  checked={taskFilter === "unassigned"}
                  onChange={(e)=> dispatch(setTaskFilter(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 "/>
                <span>Unassigned</span>
              </label>
            </fieldset>
          </div>
          <div className="lg:w-70 2xl:w-96 border rounded-md h-10 border-slate-300 relative cursor-default " title={selectedDisposition?.toString()} >
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
                DispositionTypes?.getDispositionTypes.filter((e)=> e.name !== "SETTLED").map((e) =>
                  <label key={e.id} className="flex gap-2 text-slate-500">
                    <input   
                    type="checkbox" 
                    name={e.name} 
                    id={e.name} 
                    value={e.name}
                    checked={selectedDisposition?.includes(e.name)}
                    onChange={(e)=> handleCheckBox(e.target.value, e)} />
                    <p>{e.name}{e.name === "PAID" ? " (Not Completely Settled)":""}</p>
                  </label>
                )
              }
              </div>
            }
          </div>
        </div>
        {
          tasker === "group" ? <GroupSection/> : 
          <AgentSection/>
        }
      </div>
      <TaskDispoSection/>
    </div>
  )
}

export default TaskManagerView