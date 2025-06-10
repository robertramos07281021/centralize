import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import HighReports from "./HighReports";

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
  const [campaign, setCampaign] = useState<string>("")
  const [bucket, setBucket] = useState<string>("")
  const {data:aomDeptData} = useQuery<{getAomDept:AomDept[]}>(GET_AOM_DEPT)
  const [reportsVariables, setReportsVariables] = useState<{campaign:string, bucket:string, from:string, to:string}>({
    campaign: "", bucket: "", from: "", to: ""
  })

  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")

  const [deptId, setDeptId] = useState<{[key: string]: string}>({})
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

  const [bucketObject, setBucketObject] = useState<{[key:string]:string}>({})
  useEffect(()=> {
    if(deptBucketData) {
      const newObject:{[key:string]:string} = {}
      deptBucketData.findDeptBucket.map(e=> {
        newObject[e.name] = e.id
      })
      setBucketObject(newObject)
    }
  },[deptBucketData])

  const onClickPreview = ()=> {
    setReportsVariables({
      campaign: deptId[campaign], bucket: bucketObject[bucket],  from: from, to: to
    })
  }
  
  useEffect(()=> {
    if(!campaign) {
      setBucket("")
    }
  },[campaign])

  return (
    <div  className="h-full flex relative justify-end bg-slate-200 overflow-hidden">
      <div className="w-2/12 fixed left-0 flex flex-col p-5 gap-5 h-full bg-white">
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
              value={campaign}
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
              value={bucket}
              onChange={(e)=>setBucket(e.target.value) }
              className={`${!campaign && "bg-slate-200"} border-slate-300 border  text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 uppercase`}>
              <option value="">Select Bucket</option>
              {
                deptBucketData?.findDeptBucket?.map((db)=> 
                  <option key={db.id} value={db.name} className="uppercase">{db.name}</option>
                )
              }
            </select>
          </label>
          <label className="">
            <p className="font-medium text-slate-500">Date From:</p>
            <input 
              type="date" 
              name="from" 
              id="from"
              value={from}
              onChange={(e)=> setFrom(e.target.value)} 
              className="w-full border border-slate-300 rounded-md py-2 px-2 text-xs" />
          </label>
          <label className="">
            <p className="font-medium text-slate-500">Date To:</p>
            <input 
              type="date" 
              name="to" 
              id="to"
              value={to}
              onChange={(e)=> setTo(e.target.value)} 
              className="w-full border border-slate-300 rounded-md py-2 px-2 text-xs" />
          </label>
          {
            bucket && 
            <fieldset className="p-2 border rounded-xl flex flex-col gap-2 border-slate-300">
              <legend className="px-2 text-sm font-medium text-gray-500">Compare</legend>
              <label >
                <p className="font-medium text-slate-500">1st Callfile</p>
                <select 
                  name="bucket" 
                  id="bucket" 

                  className={` border-slate-300 border  text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 uppercase`}>
                  <option value="">Select Callfile</option>
        
                </select>
              </label>
              <label >
                <p className="font-medium text-slate-500">2nd Callfile</p>
                <select 
                  name="bucket" 
                  id="bucket" 
                  className={` border-slate-300 border  text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 uppercase`}>
                  <option value="">Select Callfile</option>
                </select>
              </label>
              <label >
                <p className="font-medium text-slate-500">3rd Callfile</p>
                <select 
                  name="bucket" 
                  id="bucket" 
                  className={` border-slate-300 border text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 uppercase`}>
                  <option value="">Select CallFile</option>
                </select>
              </label>

            </fieldset>
          }
          <div className="flex items-center justify-center">
            <button className="bg-blue-500  hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-xs px-4 py-2  cursor-pointer" onClick={onClickPreview}>Preview</button>

          </div>
          
        </div>
      </div>
      <HighReports setCampaign={(e:string) => {setCampaign(e.toUpperCase())}}  reportsVariables={reportsVariables} setReportVariables={(e:string)=> setReportsVariables({...reportsVariables,campaign: e})}/>
    </div>
  )
}

export default Reports