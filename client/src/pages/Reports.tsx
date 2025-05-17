import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { setSelectedDispoReport } from "../redux/slices/authSlice";
import HighReports from "../components/HighReports";
import { useNavigate } from "react-router-dom";

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
interface User {
  name: string
  user_id: string
}

interface DispoReport {
  disposition: string
  users: User[]
  count: number
}

interface Buckets  { 
  bucket: string
  totalAmount: number
  dispositions: DispoReport[]
}

type HighDispositionReport = {
  dept: string
  buckets : Buckets[]
}

const GET_REPORTS = gql`
  query getDispositionReportsHigh($campaign: String, $bucket: String, $dispositions: [String], $from: String, $to: String) {
    getDispositionReportsHigh(campaign: $campaign, bucket: $bucket, dispositions: $dispositions, from: $from, to: $to) {
      dept
      buckets {
        bucket
        totalAmount
        dispositions {
          disposition
          count
          users {
            name
            user_id
          }
        }
      }
    }
  }
`

const Reports = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<string>("")
  const [bucket, setBucket] = useState<string>("")
  const {selectedDispoReport} = useSelector((state:RootState)=> state.auth)
  const [dispoPop, setDispoPop] = useState<boolean>(false)
  const {data:dispotypesData } = useQuery<{getDispositionTypes:DispoData[]}>(GET_DISPOSITION_TYPES)
  const {data:aomDeptData} = useQuery<{getAomDept:AomDept[]}>(GET_AOM_DEPT)
  const [reportsVariables, setReportsVariables] = useState<{campaign:string, bucket:string, dispositions:string[], from:string, to:string}>({
    campaign: "", bucket: "", dispositions: [], from: "", to: ""
  })
  const [FTE, setFTE] = useState<number>(0)  
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const {data:reportHighData} = useQuery<{getDispositionReportsHigh:HighDispositionReport[]}>(GET_REPORTS,{variables: reportsVariables }) 
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

  const onClickPreview = ()=> {
    setReportsVariables({
      campaign: campaign, bucket: bucket, dispositions: selectedDispoReport, from: from, to: to
    })

  }
  
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
      setBucket("")
    }
  },[campaign, dispatch])

  useEffect(()=> {
    
  },[navigate])


  useEffect(()=> {
    if(reportHighData){
      const userMap = new Map<string, User>();
      const totalAmounts = new Array<number>()
      reportHighData?.getDispositionReportsHigh?.map((e)=> {
        e.buckets?.map((b)=> {
          b.dispositions?.map((d)=> {
            d.users?.forEach((u)=> {
              if (u.user_id && !userMap.has(u.user_id)) {
                userMap.set(u.user_id, u);
              }
            })
          })
          totalAmounts?.push(b.totalAmount)
        })
      })
      setTotalAmount(totalAmounts?.length > 0 ? totalAmounts?.reduce((t,v)=> {
        return t + v
      }) : 0 )
      setFTE(userMap.size);
    }
  },[reportHighData])


  return (
    <div  className="h-full flex relative justify-end overflow-y-hidden">
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
          <div className="">
            <p className="font-medium text-slate-500 cursor-default" onClick={()=> setDispoPop(!dispoPop)}>Disposition</p>
            <div className={`${dispoPop && campaign ? "border-blue-500" : "border-slate-300"} ${!campaign && "bg-slate-200"} border text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 flex  w-full pl-1.5 py-1.5 relative`}>
              <div className="w-full truncate cursor-default" title={selectedDispoReport.toString()} onClick={()=> setDispoPop(!dispoPop)}>
                { selectedDispoReport.length > 0 ? selectedDispoReport.toString() : "Select Disposition"}
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
          <div className="flex items-center justify-center">
            <button className="bg-blue-500  hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-xs px-4 py-2  cursor-pointer" onClick={onClickPreview}>Preview</button>

          </div>
          <p className="text-[0.7em] text-center">Note: Report can be generated by Daily, Weekly and Monthly</p>
          <div className="w-full flex flex-col gap-2">
            <div className="w-full">
              <p>No. of FTE</p>
              <div className="text-xs py-1.5 border border-slate-300 w-full rounded-md text-end px-5 bg-slate-100">{FTE}</div>
            </div>
            <div className="w-full">
              <p>Total Collected</p>
              <div className="text-xs py-1.5 border border-slate-300 w-full rounded-md text-end px-5 bg-slate-100">{totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
      <HighReports reportHighData={reportHighData?.getDispositionReportsHigh ?? []}  campaign={reportsVariables.campaign} bucket={reportsVariables.bucket} from={reportsVariables.from} to={reportsVariables.to}/>
    </div>
  )
}

export default Reports