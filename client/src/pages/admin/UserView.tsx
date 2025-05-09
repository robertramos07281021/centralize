import { useLocation } from "react-router-dom"
import UpdateUserForm from "../../components/UpdateUserForm"
import { gql, useQuery } from "@apollo/client"
import { ModifyRecords } from "../../middleware/types"
import { useEffect } from "react"

 const MODIFY_RECORD_QUERY = gql`
  query Query($id: ID!) {
    getModifyReport(id: $id) {
      id
      name
      createdAt
    }
  }
`

const UserView = () => {
  const {state} = useLocation()
  // const {data, refetch} = useQuery<{getModifyReport:ModifyRecords[]}>(MODIFY_RECORD_QUERY,{variables: {id: state?._id}, skip: !state._id})

  // useEffect(()=> {
  //   refetch()
  // },[state, refetch])

  return (
    <div className="p-5 h-screen flex flex-col">
      <h1 className="text-2xl font-medium text-slate-500">User Account</h1>
      <div className="min-h-140 flex items-center">
        <div className="h-full w-full grid grid-cols-3 ">
          <UpdateUserForm state={state}/>
          <div className="rounded-xl border h-full border-slate-300 py-5 px-2 flex flex-col overflow-y-auto">
            <div className="">
              
            </div>
            <div className="flex flex-col h-125 overflow-y-auto">
              {/* {
                data?.getModifyReport?.map( mr => 
                  <div key={mr.id} className="grid grid-cols-2 py-1.5 px-2 odd:bg-slate-100">
                    <div className="text-slate-700 font-medium text-base">{mr.name}</div>
                    <div className="text-slate-600 text-sm">{new Date(mr.createdAt).toLocaleDateString()} - {new Date(mr.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</div>
                  </div>
                )
              } */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserView
