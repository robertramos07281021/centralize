
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import { RiArrowDownSFill, RiArrowUpSFill   } from "react-icons/ri";

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

  const {data:DispositionTypes} = useQuery<{getDispositionTypes:DispositionTypes[]}>(GET_ALL_DISPOSITION_TYPE)



  const [selectedDisposition, setSelectedDisposition] = useState<string[]>([])

  const handleCheckBox= (value:string, e: React.ChangeEvent<HTMLInputElement>) => {
    const check = e.target.checked ? [...selectedDisposition, value] : selectedDisposition.filter((d) => d !== value )
    setSelectedDisposition(check)
  }

  const [showSelection, setShowSelection] = useState<boolean>(false)
  const onClick = ()=> {
    setShowSelection(!showSelection) 
  }

  console.log(selectedDisposition)
  return (
    <div className="h-full w-full p-5">
      <div className="w-full p-5 flex gap-10 text-sm text">
        <div className="w-96 border rounded-md h-10 border-slate-500 relative cursor-default" title={selectedDisposition.toString()} >
          {
            showSelection ?
            <RiArrowUpSFill  className="absolute right-2 top-2 text-2xl" onClick={onClick} />
            :
            <RiArrowDownSFill className="absolute right-2 top-2 text-2xl" onClick={onClick}/>
          }
          <div className="w-80 p-2.5 text-xs truncate font-bold text-slate-500">
            {selectedDisposition.length > 0 ? selectedDisposition.toString(): "Select Disposition"}
          </div>
          {
            showSelection &&
            <div className="w-full h-96  border overflow-y-auto absolute top-10 flex gap-5 p-5 text-xs flex-col border-slate-500">
            {
              DispositionTypes?.getDispositionTypes.filter((e)=> e.name !== "SETTLED").map((e) =>
                <label key={e.id} className="flex gap-2 text-slate-500">
                  <input   
                  type="checkbox" 
                  name={e.name} 
                  id={e.name} 
                  value={e.name}
                  checked={selectedDisposition.includes(e.name)}
                  onChange={(e)=> handleCheckBox(e.target.value, e)} />
                  <p>{e.name}{e.name === "PAID" ? " (Not Completely Settled)":""}</p>
                </label>
              )
            }
            </div>
          }
        </div>
        <label className="flex gap-2 text-slate-500 items-center">
          <input   
          disabled
          type="checkbox" 
          name="due_date" 
          id="due_date"
          value="due date"
          />
          <p>Due Date</p>
        </label>
      </div>
    </div>
  )
}

export default TaskManagerView