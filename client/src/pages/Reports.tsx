import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { setSelectedDispoReport } from "../redux/slices/authSlice";

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

interface AomDept {
  branch: string
  id: string
  name: string

}
const GET_AOM_DEPT = gql`
  query Query {
    getAomDept {
      branch
      id
      name
    }
  }

`

interface DeptBucket {
  id: string
  name: string
}

const GET_DEPT_BUCKET = gql`
  query findDeptBucket($dept: ID) {
    findDeptBucket(dept: $dept) {
      id
      name
    }
  }
`


const Reports = () => {
  const dispatch = useAppDispatch()
  const [campaign, setCampaign] = useState<string>("")
  const [bucket, setBucket] = useState<string>("")
  const {selectedDispoReport} = useSelector((state:RootState)=> state.auth)
  const [dispoPop, setDispoPop] = useState<boolean>(false)
  const {data:dispotypesData } = useQuery<{getDispositionTypes:DispoData[]}>(GET_DISPOSITION_TYPES)
  const {data:aomDeptData} = useQuery<{getAomDept:AomDept[]}>(GET_AOM_DEPT)

  const [deptId, setDeptId] = useState<{[key: string]: string}>({})
  console.log(bucket)
  useEffect(()=> {
    if(aomDeptData){
      const newObject:{[key: string]:string} = {}
      aomDeptData?.getAomDept?.map((e)=> {
        newObject[e.name] = e.id
      })
      setDeptId(newObject)
    } 

  },[aomDeptData])

  const {data:deptBucketData} = useQuery<{findDeptBucket:DeptBucket[]}>(GET_DEPT_BUCKET,{variables: {dept: deptId[campaign]} })

  const handleCheckDispo = (value:string, e:React.ChangeEvent<HTMLInputElement>) => {
    const dispoChecked = selectedDispoReport || []
    if(e.target.checked) {
      dispatch(setSelectedDispoReport([...selectedDispoReport, value]))
    } else {
      dispatch(setSelectedDispoReport(dispoChecked.filter((dc)=> dc !== value)))
    } 
  }

  useEffect(()=> {
    if(!campaign) {
      dispatch(setSelectedDispoReport([]))
    }
  },[campaign, dispatch])

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
              onChange={(e)=> setCampaign(e.target.value)}
              className="border-slate-300 border  text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 uppercase">
              <option value="">Select Campaign</option>
              {
                aomDeptData?.getAomDept?.map((ad)=> 
                  <option key={ad.id} value={ad.name} className="uppercase">{ad.name}</option>
                )
              }
            </select>
          </label>
          <label >
            <p className="font-medium text-slate-500">Bucket</p>
            <select 
              name="bucket" 
              id="bucket" 
              disabled={!campaign}
              onChange={(e)=>setBucket(e.target.value) }
              className={`${!campaign && "bg-slate-200"} border-slate-300 border  text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 uppercase`}>
              <option value="">Select Bucket</option>
              {
                deptBucketData?.findDeptBucket?.map((db)=> 
                  <option value={db.name} className="uppercase">{db.name}</option>
                )
              }
            </select>
          </label>
          <div className="">
            <p className="font-medium text-slate-500 cursor-default" onClick={()=> setDispoPop(!dispoPop)}>Disposition</p>
            <div className={`${dispoPop && campaign ? "border-blue-500" : "border-slate-300"}  border  text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 flex  w-full pl-1.5 py-1.5 relative`}>
              <div className="w-full truncate cursor-default" title={selectedDispoReport.toString()} onClick={()=> setDispoPop(!dispoPop)}>
                {selectedDispoReport.toString()}
              </div>
              <MdKeyboardArrowDown className="text-lg" onClick={()=> setDispoPop(!dispoPop)}/>
              {
                dispoPop && campaign &&
                <div className="bg-white absolute w-full border border-slate-300 rounded-md left-0 h-auto top-9 px-2 flex flex-col">
                  {
                    dispotypesData?.getDispositionTypes.map((dt)=> 
                      <label key={dt.id} className='py-1 flex gap-2'>
                        <input 
                          type="checkbox" 
                          name={dt.name} 
                          id={dt.name} 
                          value={dt.name} 
                          checked={selectedDispoReport.includes(dt.name)}
                          onChange={(e)=> handleCheckDispo(e.target.value,e )}/>
                        <span>{dt.name}</span>
                      </label>
                    )
                  }
                </div>
              }
            </div>
          </div>
          <label>
            <p className="font-medium text-slate-500">Date From:</p>
            <input type="date" name="" id="" />
          </label>
        </div>
      </div>
      <div className="w-10/12 border h-full overflow-y-auto">
              

      </div>
    </div>
  )
}

export default Reports