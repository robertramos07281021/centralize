import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import { RiArrowDownSFill, RiArrowUpSFill   } from "react-icons/ri";
import GroupSection from "../../components/GroupSection";
import TaskDispoSection from "../../components/TaskDispoSection";


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
  // const [page, setPage] = useState<number>(1)
  // const {data:CustomerAccountsData} = useQuery<{findCustomerAccount:CustomerAccount[]}>(FIND_CUSTOMER_ACCOUNTS,{variables: {disposition: selectedDisposition, dept: userLogged.department, page:page }})

  const handleCheckBox= (value:string, e: React.ChangeEvent<HTMLInputElement>) => {
    const check = e.target.checked ? [...selectedDisposition, value] : selectedDisposition.filter((d) => d !== value )
    setSelectedDisposition(check)
  }

  const [showSelection, setShowSelection] = useState<boolean>(false)
  const onClick = ()=> {
    setShowSelection(!showSelection) 
  }

  return (
    <div className="h-full w-full flex flex-col ">
      <div className="flex gap-10 p-5 mt-5">
        <div className=" flex lg:gap-5 2xl:gap-10 lg:text-[0.6em] 2xl:text-xs items-end w-full">
          <div className="lg:w-70 2xl:w-96 border rounded-md h-10 border-slate-500 relative cursor-default " title={selectedDisposition.toString()} >
            {
              showSelection ?
              <RiArrowUpSFill  className="absolute right-2 top-2 text-2xl" onClick={onClick} />
              :
              <RiArrowDownSFill className="absolute right-2 top-2 text-2xl" onClick={onClick}/>
            }
            <div className="lg:w-60 2xl:w-80 h-full px-2 truncate font-bold text-slate-500 flex items-center">
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
        <GroupSection/>
      </div>
      <TaskDispoSection selectedDisposition={selectedDisposition}/>
    </div>
  )
}

export default TaskManagerView