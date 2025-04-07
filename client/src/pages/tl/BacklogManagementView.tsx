import Uploader from "../../components/Uploader"

import { IoMdArrowDropdown } from "react-icons/io";
import { IoMdArrowDropup } from "react-icons/io";
import { Doughnut } from 'react-chartjs-2';
import { Chart } from 'chart.js';
import {gql} from "@apollo/client"
import { useQuery } from "@apollo/client";
import {  GET_DISPOSITION_TYPES } from "../../apollo/query";
import {  Users } from "../../middleware/types";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useEffect, useRef, useState } from "react";

interface DispositionType  {
  id: string
  name: string
  code: string
}

interface Bucket {
  id: string,
  name: string,
  dept: string
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
  query Query($department: String!) {
    findAgents(department: $department) {
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

const BacklogManagementView = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const {data:agentSelector} = useQuery<{findAgents:Users[]}>(GET_DEPARTMENT_AGENT, {variables: {department:userLogged.department}})
  const {data:departmentBucket} = useQuery<{getBuckets:Bucket[]}>(DEPT_BUCKET_QUERY,{variables: {dept: userLogged.department}, skip: !userLogged.department})
  console.log(departmentBucket)

  const [agentDropdown, setAgentDropdown] = useState<boolean>(false)
  const [agents, setAgents] = useState<Users[]>([])
  const [searchAgent, setSearchAgent] = useState<string>("")

  const {data:disposition} = useQuery<{getDispositionTypes:DispositionType[]}>(GET_DISPOSITION_TYPES)

  useEffect(()=> {
    if(agentSelector && searchAgent.trim() === "") {
      setAgents(agentSelector?.findAgents)
    }
  },[agentSelector,searchAgent])
  
  useEffect(()=> {
    if(searchAgent.trim() != "" && agentSelector) {
      setAgents(agentSelector?.findAgents?.filter((e) => e.name.toLowerCase().includes(searchAgent.toLowerCase()) || e.user_id.includes(searchAgent)))
    } else if(searchAgent.trim() === "" && agentSelector) {
      setAgents(agentSelector?.findAgents) 
    }
  },[searchAgent,agentSelector,agents])

  const Disposition = [
    { code: "BS", count: 4, color: "oklch(0.704 0.191 22.216)"},
    { code: "ITP", count: 6, color: "oklch(0.75 0.183 55.934)"},
    { code: "RC", count: 7, color: "oklch(0.828 0.189 84.429)"},
    { code: "AM", count: 7, color: "oklch(0.852 0.199 91.936)"},
    { code: "FUP", count: 8, color: "oklch(0.841 0.238 128.85)"},
    { code: "LM", count: 3, color: "oklch(0.792 0.209 151.711)"},
    { code: "RHU", count: 5, color: "oklch(0.765 0.177 163.223)"},
    { code: "WN", count: 9, color: "oklch(0.777 0.152 181.912)"},
    { code: "FV", count: 5, color: "oklch(0.789 0.154 211.53)"},
    { code: "P", count: 9, color: "oklch(0.746 0.16 232.661)"},
    { code: "RTP", count: 10, color: "oklch(0.707 0.165 254.624)"},
    { code: "NA", count: 8, color: "oklch(0.673 0.182 276.935)"},
    { code: "HU", count: 6, color: "oklch(0.702 0.183 293.541)"},
    { code: "PTP", count: 12, color: "oklch(0.714 0.203 305.504)"},
    { code: "U", count: 6, color: "oklch(0.74 0.238 322.16)"},
  ]
  
  const dataLabels = Disposition.map(d=> d.code)
  const dataCount = Disposition.map(d => d.count)
  const dataColor = Disposition.map(d=> d.color)
  const data = {
    labels: dataLabels,
    datasets: [{
      label: 'My First Dataset',
      data: dataCount,
      backgroundColor: dataColor,
      hoverOffset: 50,
    }],
  };
  const chartRef = useRef<Chart<"doughnut"> | null>(null);

  const onClickChart = () => {
    // console.log(`${chartRef?.current?.tooltip?.title}`)
  }

  const handleAgentDropdown = ()=> {
    setAgentDropdown(!agentDropdown)
  }

  return (
    <div className="grid grid-cols-3 grid-rows-2">
      <div className="p-5">
        <div>
          <h1 className="text-lg font-bold text-slate-700 text-center">Select Report</h1>
          <div className="p-5 flex flex-col gap-2">
            <label className="grid grid-cols-4 relative">
              <div className="flex items-center lg:text-xs 2xl:text-sm font-medium text-slate-500">Agent </div>
              <div className="col-span-3 relative border flex items-center border-slate-600 rounded-lg">
                <input 
                  type="text"
                  name="search_agent"
                  id="search_agent"
                  value={searchAgent} 
                  onChange={(e)=> setSearchAgent(e.target.value)}
                  placeholder="Select Agent"
                  className="  w-10/11 outline-0 p-2 text-sm"/>
                  {
                    !agentDropdown ? 
                    <IoMdArrowDropdown className="text-2xl" onClick={handleAgentDropdown}/>
                      :
                    <IoMdArrowDropup className="text-2xl" onClick={handleAgentDropdown}/>
                  }
                  {
                    agentDropdown &&
                  <div className="border w-full absolute top-10 max-h-96 overflow-y-auto bg-white border-slate-500 rounded">
                    {
                    agents.map((agent) => 
                      <div key={agent._id} className="flex flex-col font-medium text-slate-600 p-2" onClick={()=> {setSearchAgent(agent.name); setAgentDropdown(!agentDropdown) } }>
                        <div className=" text-sm">
                          {agent.name}
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
            </label>
            <label className="grid grid-cols-4">
              <div className="flex items-center lg:text-xs 2xl:text-sm font-medium text-slate-500">Bucket </div>
              <div className="col-span-3 flex border items-center border-slate-600 rounded-lg">
                <input 
                  type="text" 
                  name="search_bucket" 
                  id="search_bucket" 
                  placeholder="Select Bucket"
                  className=" w-10/11 outline-0 p-2 text-sm" />
                <IoMdArrowDropdown className="text-2xl"/>
                <IoMdArrowDropup className="text-2xl"/>
              </div>
            </label>
            <div className="flex flex-col">
              <div className="flex justify-center my-2  text-sm font-medium text-slate-500">Disposition</div>
              <div className="flex flex-wrap gap-5 border-slate-600 rounded-lg p-2 justify-center border">
                {
                  disposition?.getDispositionTypes?.map((dispoTypes) => 
                    <label key={dispoTypes.id} className="w-2/10 2xl:text-xs lg:text-[.45rem] items-center flex gap-2">
                      <input type="checkbox" name={dispoTypes.name} id={dispoTypes.name} />
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
                  <input type="date" name="from" id="from"  className="w-full outline-0"/>
                </div>
              </label>
              <label className="grid grid-cols-4">
                <div className="flex items-center lg:text-xs 2xl:text-sm font-medium text-slate-500">
                  Date To : 
                </div>
                <div className="col-span-3 w-full flex border items-center border-slate-600 rounded-lg p-2">
                  <input type="date" name="to" id="to"  className="w-full outline-0"/>
                </div>
              </label>
            </div>
            <h1 className="text-sm text-slate-600"><span className=" font-medium">Note: </span>Report can be generated by Daily, Weekly and Monthly</h1>
            <div className="flex gap-5">
              <button type="button" className='bg-blue-400 hover:bg-blue-500 focus:outline-none text-white  focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 cursor-pointer'>Export</button>
              <button type="button" className='bg-blue-400 hover:bg-blue-500 focus:outline-none text-white  focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 cursor-pointer'>Preview</button>
            </div>
          </div>

        </div>
      
        <Uploader/>

      </div>
      <div className="print:hidden col-span-2 border p-2">
        <div></div>
        <div className="w-150 border">
           <Doughnut ref={chartRef} data={data} onClick={onClickChart}/>
        </div>
      </div>


      <div className="col-span-3 border">
            
      </div>


    </div>
  )
}

export default BacklogManagementView