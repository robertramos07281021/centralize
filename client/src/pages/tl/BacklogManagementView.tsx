import Uploader from "../../components/Uploader"
import { IoMdArrowDropdown } from "react-icons/io";
import { IoMdArrowDropup } from "react-icons/io";
import { Doughnut } from 'react-chartjs-2';
import {gql} from "@apollo/client"
import { useQuery } from "@apollo/client";
import {  Users } from "../../middleware/types";
import {  useEffect, useState } from "react";


interface DispositionType  {
  id: string
  name: string
  code: string
  count: string
}

interface Bucket {
  id: string,
  name: string,
  dept: string
}


interface Dispositions {
  code: string
  count: number
  color: string
}




interface Agent {
  id: string
  name: string
  branch: string
  department: string
  user_id: string
  buckets: string[]
}


interface Reports {
  agent: Agent
  bucket: string
  disposition: DispositionType[]
}

const DEPT_BUCKET_QUERY = gql`
  query Query($dept: String) {
    getDeptBucket(dept: $dept) {
      id
      name
      dept
    }
  }
`
const GET_DEPARTMENT_AGENT = gql`
  query Query {
    findAgents {
      _id
      name
      username
      type
      department
      branch
      change_password
      buckets
      isOnline
      active
      createdAt
      user_id
    }
  }
`
const GET_DISPOSITION_TYPES = gql`
  query Query {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

const GET_DISPOSITION_REPORTS = gql`
  query GetDispositionReports($agent: String, $bucket: String, $disposition: [String], $from: String, $to: String) {
    getDispositionReports(agent: $agent, bucket: $bucket, disposition: $disposition, from: $from, to: $to) {
      agent {
        id
        name
        branch
        department
        user_id
        buckets
      }
      bucket
      disposition {
        code
        name
        count
      }
    }
  }
`



const colorDispo: { [key: string]: string } = {
  DISP: "oklch(0.704 0.191 22.216)",
  FFUP: "oklch(0.75 0.183 55.934)",
  FV: "oklch(0.828 0.189 84.429)",
  HUP: "oklch(0.852 0.199 91.936)",
  ITP: "oklch(0.841 0.238 128.85)",
  LM: "oklch(0.792 0.209 151.711)",
  PAID:"oklch(0.765 0.177 163.223)",
  PTP: "oklch(0.777 0.152 181.912)",
  RPCCB:"oklch(0.789 0.154 211.53)",
  RTP: "oklch(0.746 0.16 232.661)",
  UNEG: "oklch(0.707 0.165 254.624)",
  ANSM:"oklch(0.673 0.182 276.935)",
  WN: "oklch(0.702 0.183 293.541)",
  NOA: "oklch(0.714 0.203 305.504)",
  KOR: "oklch(0.74 0.238 322.16)",
  OCA: "oklch(0.73 0.195 45.0)",
  NIS: "oklch(0.7 0.2 340.0)",
  BUSY: "oklch(0.73 0.19 10.0)",
  DEC: "oklch(0.76 0.185 30.0)",
  UNK: "oklch(0.78 0.18 350.0)",
  SET: "oklch(0.76 0.19 20.0)"
}

const BacklogManagementView = () => {
  const {data:agentSelector} = useQuery<{findAgents:Users[]}>(GET_DEPARTMENT_AGENT)
  const {data:departmentBucket} = useQuery<{getDeptBucket:Bucket[]}>(DEPT_BUCKET_QUERY)
  const [buckets, setBuckets] = useState<Bucket[] | null>(null)
  const [searchBucket, setSearchBucket] = useState<string>("")
  const [bucketDropdown, setBucketDropdown] = useState<boolean>(false)
  const [selectedDisposition, setSelectedDisposition] = useState<string[]>([])
  const [agentDropdown, setAgentDropdown] = useState<boolean>(false)
  const [agents, setAgents] = useState<Users[] | null>(null)
  const [searchAgent, setSearchAgent] = useState<string>("")  
  const {data:disposition} = useQuery<{getDispositionTypes:DispositionType[]}>(GET_DISPOSITION_TYPES)
  const [dateDistance, setDateDistance] = useState({
    from: "",
    to: ""
  })
  const [dispositionData, setDispositionData] = useState<Dispositions[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const {data:reportsData } = useQuery<{getDispositionReports:Reports}>(GET_DISPOSITION_REPORTS,{variables: {agent: searchAgent, bucket: searchBucket, disposition: selectedDisposition, from: dateDistance.from, to: dateDistance.to}})
  const [newReportsDispo, setNewReportsDispo] = useState<Record<string,number>>({})
  
  useEffect(()=> {
    const reportsDispo:{[key: string]: number} = {};
    if(reportsData) {
      reportsData.getDispositionReports.disposition.forEach((element: DispositionType) => {
        reportsDispo[element.code] = element.count ? Number(element.count) : 0;
      });
      setNewReportsDispo(reportsDispo)
    }
  },[reportsData])



  useEffect(()=> {
    const filteredAgent = searchAgent?.trim() != "" ? agentSelector?.findAgents?.filter((e) => e.name.toLowerCase()?.includes(searchAgent?.toLowerCase()) || e.user_id?.includes(searchAgent ? searchAgent: "")) : agentSelector?.findAgents
    setAgents(filteredAgent || null)

    const dropdownAgent = filteredAgent?.length.valueOf() && searchAgent?.trim() !== "" ? true : false
    setAgentDropdown(dropdownAgent)
    if(dropdownAgent) {
      setBucketDropdown(!dropdownAgent)
    }
  },[searchAgent,agentSelector])

  useEffect(()=> {
    const filteredBucket = searchBucket.trim() !== "" ? departmentBucket?.getDeptBucket.filter((e)=> e.name.includes(searchBucket)) : departmentBucket?.getDeptBucket
    setBuckets(filteredBucket || null)

    const dropdownBucket = filteredBucket?.length.valueOf() && searchBucket.trim() !== "" ? true : false

    setBucketDropdown(dropdownBucket)
    if(dropdownBucket) {
      setAgentDropdown(!dropdownBucket)
    }
  },[departmentBucket, searchBucket])




  useEffect(()=> {
    if (disposition?.getDispositionTypes) {
      const updatedData = disposition.getDispositionTypes.map((e) => ({
        code: e.code,
        count: Number(newReportsDispo[e.code]) ? Number(newReportsDispo[e.code]) : 0 ,
        color: colorDispo[e.code] || '#ccc', 
      }));
       
      setTotalCount(updatedData.map((e)=> e.count).reduce((total, value)=> 
        total + value, 0))

      setDispositionData(updatedData);
    }
  },[disposition,newReportsDispo])

 

  const dataLabels = dispositionData.map(d=> d.code)
  const dataCount = dispositionData.map(d => { 
    const count = d.count;
    if (!totalCount || totalCount === 0) return 0; 
    const percent = Math.floor((count / totalCount) * 100);
    const parsed = parseInt(percent.toPrecision(2));
    return parsed === 1 ? 100 : parsed;
  } 
  
  )
  const dataColor = dispositionData.map(d=> d.color)
  const data = {
    labels: dataLabels,
    datasets: [{
      label: 'Percentage',
      data: dataCount,
      backgroundColor: dataColor,
      hoverOffset: 30,
    }],
  };


  const options = {
    plugins: {
      datalabels: {
        color: 'oklch(0 0 0)',
        font: {
          weight: "bold", 
          size: 12,
        } as const,
        formatter: (value: number) => {return value === 0 ? "" : Math.ceil(value/100 * totalCount)}
      },
      legend: {
        position: 'bottom' as const,
        display: false
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const handleCheckBox= (value:string, e: React.ChangeEvent<HTMLInputElement>) => {
    const check = e.target.checked ? [...selectedDisposition, value] : selectedDisposition.filter((d) => d !== value )
    setSelectedDisposition(check)
  }

  const handleAgentDropdown = ()=> {
    setAgentDropdown(!agentDropdown)
    setBucketDropdown(false)
  }
  const handleBucketDropdown = ()=> {
    setBucketDropdown(!bucketDropdown)
    setAgentDropdown(false)
  }

  const dispositionCount = (code:string) =>  {
    const newFilter = dispositionData?.filter((e)=> e.code === code)
    return newFilter[0]?.count
  }

  const [chartFull, setChartFull] = useState(false)
  const handleChartFullScreen = ()=> {
    setChartFull(!chartFull)
  }

  return (
    <div className="grid grid-cols-3 grid-rows-1 h-full items-center">
      <div className="h-full  flex flex-col justify-center">
        <h1 className="text-lg font-bold text-slate-700 text-center py-2">Select Report</h1>
        <div className="p-5 flex flex-col gap-2 justify-center">
          <div className="grid grid-cols-4 relative">
            <div className="flex items-center lg:text-xs 2xl:text-sm font-medium text-slate-500">Agent </div>
            <div className="col-span-3 relative border flex items-center border-slate-600 rounded-lg">
              <input 
                type="text"
                name="search_agent"
                id="search_agent"
                autoComplete="false"
                value={searchAgent} 
                onChange={(e)=> setSearchAgent(e.target.value)}
                placeholder="Select Agent"
                className="  w-10/11 outline-0 p-2 text-sm uppercase"/>
                {
                  !agentDropdown ? 
                  <IoMdArrowDropdown className="text-2xl" onClick={handleAgentDropdown}/>
                    :
                  <IoMdArrowDropup className="text-2xl" onClick={handleAgentDropdown}/>
                }
                {
                  agentDropdown &&
                <div className={`${agents?.length === 0 ? "h-10" : "max-h-96"} border w-full absolute top-10  overflow-y-auto z-50 border-slate-500 bg-white  rounded`}>
                  {
                  agents?.map((agent) => 
                    <div key={agent._id} className="flex flex-col font-medium text-slate-600 p-2" onClick={()=> {setSearchAgent(agent.user_id); setAgentDropdown(false)} }>
                      <div className=" text-sm">
                        {agent.name.toUpperCase()}
                      </div>
                      <div className="text-xs font-light">
                        {agent.user_id}
                      </div>
                    </div>
                  )
                  }
                </div>
                }
            </div>
          </div>
          <div className="grid grid-cols-4">
            <div className="flex items-center lg:text-xs 2xl:text-sm font-medium text-slate-500">Bucket </div>
            <div className="col-span-3 relative border flex items-center border-slate-600 rounded-lg">
              <input 
                type="text"
                name="search_bucket"
                id="search_bucket"
                autoComplete="false"
                value={searchBucket} 
                onChange={(e)=> setSearchBucket(e.target.value)}
                placeholder="Select Bucket"
                className="w-10/11 outline-0 p-2 text-sm uppercase"/>
                {
                  !bucketDropdown ? 
                  <IoMdArrowDropdown className="text-2xl" onClick={handleBucketDropdown}/>
                    :
                  <IoMdArrowDropup className="text-2xl" onClick={handleBucketDropdown}/>
                }
                {
                  bucketDropdown &&
                <div className={`${agents?.length === 0 ? "h-10" : "max-h-96"} border w-full absolute top-10  overflow-y-auto bg-white border-slate-500 rounded`}>
                  {
                  buckets?.map((bucket) => 
                    <div key={bucket.id} className="flex bg-white flex-col font-medium text-slate-600 p-2" onClick={()=> {setSearchBucket(bucket.name); setBucketDropdown(false)} }>
                      <div className=" text-sm">
                        {bucket.name.toUpperCase()}
                      </div>
                    </div>
                  )
                  }
                </div>
                }
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-center my-2  text-sm font-medium text-slate-500">Disposition</div>
            <div className="flex flex-wrap max-h-50 gap-5 border-slate-600 rounded-lg p-2 justify-center border overflow-y-auto">
              {
                disposition?.getDispositionTypes?.map((dispoTypes) => 
                  <label key={dispoTypes.id} className="w-2/10 2xl:text-xs lg:text-[.45rem] items-center flex gap-2">
                    <input type="checkbox" onChange={(e)=> handleCheckBox(e.target.value, e)} name={dispoTypes.name} id={dispoTypes.name} value={dispoTypes.name} />
                    <span className="uppercase">{dispoTypes.name}</span>
                  </label>
                )
              }
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <label className="grid grid-cols-4">
              <div className="flex items-center lg:text-xs 2xl:text-sm font-medium text-slate-500">
                Date From : 
              </div>
              <div className="col-span-3 w-full flex border items-center border-slate-600 rounded-lg p-2">
                <input 
                  type="date"
                  name="from"
                  id="from"
                  value={dateDistance.from}
                  onChange={(e) => setDateDistance({...dateDistance, from: e.target.value})}
                  className="w-full outline-0"/>
              </div>
            </label>
            <label className="grid grid-cols-4">
              <div className="flex items-center lg:text-xs 2xl:text-sm font-medium text-slate-500">
                Date To : 
              </div>
              <div className="col-span-3 w-full flex border items-center border-slate-600 rounded-lg p-2">
                <input 
                  type="date"
                  name="to"
                  id="to"
                  value={dateDistance.to}
                  onChange={(e)=> setDateDistance({...dateDistance, to: e.target.value})}
                  className="w-full outline-0"/>
              </div>
            </label>
          </div>
          <h1 className="text-sm text-slate-600"><span className=" font-medium">Note: </span>Report can be generated by Daily, Weekly and Monthly</h1>
          <div className="flex gap-5">
            <button type="button" className='bg-blue-400 hover:bg-blue-500 focus:outline-none text-white  focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 cursor-pointer'>Export</button>
          </div>
        </div>
        <Uploader/>
      </div>
        <div className={`print:hidden col-span-2 flex flex-col ${chartFull ? "fixed top-0 bg-white z-50 items-center justify-center w-full h-full px-10" : "h-5/6"}`}>
          <div className="text-center uppercase font-medium 2xl:text-lg lg:text-base text-slate-500 flex item-center justify-center gap-5 py-5">
            <div>
              { reportsData?.getDispositionReports?.bucket &&
              <span>Bucket: </span>
              }
            {reportsData?.getDispositionReports?.bucket ? reportsData?.getDispositionReports?.bucket: "" }
            </div>
            <div>
              {
                reportsData?.getDispositionReports?.agent.name &&
              <span>Agent Name: </span>
              }
            {reportsData?.getDispositionReports?.agent ? reportsData?.getDispositionReports?.agent.name: "" }</div>
            {
              dateDistance.from && dateDistance.to && dateDistance.from !== dateDistance.to &&
            <div>From: {dateDistance.from } to {dateDistance.to}</div>
            }
            {
              ((dateDistance.from && !dateDistance.to) || (!dateDistance.from && dateDistance.to) || ((dateDistance.from === dateDistance.to) && dateDistance.from && dateDistance.to))  &&
              <div>Date: {dateDistance.from ? dateDistance.from : dateDistance.to } </div>
            }
          </div>

          <div className="flex justify-between w-full h-full pr-5">
            <div className="w-full flex justify-center item-center flex-col ">
              <div  className="flex flex-col justify-center h-5/6 ">
                {disposition?.getDispositionTypes.map((d)=> 
                  <div key={d.id}>
                  {
                    dispositionCount(d.code) !== 0 &&
                    <div className="lg:text-xs 2xl:text-base text-slate-900 font-medium grid grid-cols-3 gap-2 py-0.5 hover:scale-105 cursor-default hover:font-bold">
                      <div style={{backgroundColor: `${colorDispo[d.code]}`}} className="px-2">{d.code} </div>
                      <div>{d.name}</div>
                      <div className="text-center">{dispositionCount(d.code)}</div>
                    </div>
                  }
                  </div>
                )}
                
              </div>
              <div className="flex justify-center">
                <button type="button" className="bg-blue-500 hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-sm px-5 py-2.5  cursor-pointer" 
                onClick={handleChartFullScreen}
                >{chartFull ? "Minimize" : "Maximize"}</button>
              </div>
            </div>
            <div className="w-8/10 flex justify-center h-full">
              <Doughnut data={data} options={options} />
            </div>
          </div>
        </div>
    

    </div>
  )
}

export default BacklogManagementView