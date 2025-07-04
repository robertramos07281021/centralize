import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import {  useMemo } from "react"

type Variables = {
  campaign: string
  bucket: string
  from: string
  to: string
}

type modalProps = {
  variables: Variables
}

type AomDept = {
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

const ReportsView:React.FC<modalProps> = ({variables}) => {
  const {data:aomDeptData} = useQuery<{getAomDept:AomDept[]}>(GET_AOM_DEPT)
  const deptId = useMemo(()=> {
    const add = aomDeptData?.getAomDept || []
    return Object.fromEntries(add.map(e=> [e.id,e.name]))
  },[aomDeptData])

  return (
    <div className="gap-2 flex min-h-full flex-col">
    
      <h1 className="text-center bg-white py-2 font-medium text-2xl text-gray-500">{deptId[variables.campaign]}</h1>

      
      
      <div className="flex gap-2 pb-2 min-h-full">
        <div className="w-full bg-white rounded-xl flex flex-col">
          <h1 className="text-lg text-center font-medium text-gray-500 py-2">C1 M2</h1>
          <div className="flex flex-col p-10 gap-5">
            <div className="flex flex-col gap-1">
              <h1 className="font-medium text-sm text-gray-500">Connection Rate: </h1>
              <div className="border h-5 border-slate-300 overflow-hidden">
                <div className="h-full w-1/2 bg-green-500 duration-1000 ease-in"></div>
              </div>
              <div className="text-center flex justify-between text-xs font-medium text-gray-500">
                <div>50/100</div>
                <div>50%</div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="font-medium text-sm text-gray-500">Collection: </h1>
              <div className="border h-5 border-slate-300 overflow-hidden">
                <div className="h-full w-[30%] bg-blue-500 duration-1000 ease-in"></div>
              </div>
              <div className="text-center flex justify-between text-xs font-medium text-gray-500">
                <div>P325,497/ P1,000,000</div>
                <div>30%</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-medium text-sm text-gray-500">Collection: </h1>
            <div className="border h-5 border-slate-300 overflow-hidden">
              <div className="h-full w-[30%] bg-blue-500 duration-1000 ease-in">

              </div>
            </div>
            <div className="text-center flex justify-between text-xs font-medium text-gray-500">
              <div>P325,497/ P1,000,000</div>
              <div>30%</div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full bg-white rounded-xl flex flex-col">
        <h1 className="text-lg text-center font-medium text-gray-500 py-2">C2 M2</h1>
        
      </div>
    </div>


  )
}

export default ReportsView