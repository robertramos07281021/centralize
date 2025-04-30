import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";

interface DispoData {
  id: string
  code: string
  name: string

}

const GET_DISPOSITION_TYPES = gql`
  query Query {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

const Reports = () => {
  const [dispoPop, setDispoPop] = useState<boolean>(false)
  const {data:dispotypesData } = useQuery<{getDispositionTypes:DispoData[]}>(GET_DISPOSITION_TYPES)
  
  return (
    <div  className="h-full flex relative justify-end">
      <div className="w-2/12 fixed left-0 flex flex-col p-5 gap-5">
        <div className="flex gap-5 justify-center">
          <h1 className="flex items-center font-bold text-slate-500">SELECT REPORT</h1>
          <button className="bg-blue-500  hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-xs px-4 py-2  cursor-pointer">Export Report</button>
        </div>
        <div className="w-full text-sm flex flex-col gap-2">
          <label >
            <p className="font-medium text-slate-500">Campaign</p>
            <select 
              name="campaign" 
              id="campaign" 
              className="border-slate-300 border  text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5">
              <option value="">Select Campaign</option>
            </select>
          </label>
          <label >
            <p className="font-medium text-slate-500">Bucket</p>
            <select 
              name="campaign" 
              id="campaign" 
              className="border-slate-300 border  text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5">
              <option value="">Select Bucket</option>
            </select>
          </label>
          <div className="">
            <p className="font-medium text-slate-500 cursor-default" onClick={()=> setDispoPop(!dispoPop)}>Disposition</p>
            <div className="border-slate-300 border  text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 flex  w-full pl-1.5 py-1.5 relative">
              <div className="w-full" onClick={()=> setDispoPop(!dispoPop)}>
              </div>
              <MdKeyboardArrowDown className="text-lg" onClick={()=> setDispoPop(!dispoPop)}/>
              {
                dispoPop &&
                <div className="bg-white absolute w-full border border-slate-300 rounded-md left-0 h-auto top-9 px-2 flex flex-col">
                  {
                    dispotypesData?.getDispositionTypes.map((dt)=> 
                      <label key={dt.id} className='py-1 flex gap-2'>
                        <input type="checkbox" name={dt.name} id={dt.name} value={dt.code} />
                        <span>{dt.name}</span>
                      </label>

                    )
                  }

                </div>
              }
            </div>
          </div>
        </div>
      </div>
      <div className="w-10/12 border h-full overflow-y-auto">
              

      </div>
    </div>
  )
}

export default Reports