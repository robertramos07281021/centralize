import { useLocation } from "react-router-dom"
import UpdateUserForm from "./UpdateUserForm"
import { gql, useQuery } from "@apollo/client"
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

type ModifyRecords = {
  id: string
  name: string
  createdAt: string
}

const UserView = () => {
  const {state} = useLocation()
  const {data, refetch} = useQuery<{getModifyReport:ModifyRecords[]}>(MODIFY_RECORD_QUERY,{variables: {id: state?._id}, skip: !state._id})

  useEffect(()=> {
    refetch()
  },[state, refetch])
  return (
    <>
      <div className="p-5 h-screen flex flex-col overflow-hidden">
        <h1 className="text-2xl font-medium text-slate-500 capitalize">{state.name}</h1>
        <div className="h-full flex items-center overflow-hidden">
          <div className="h-full w-full flex ">
            <UpdateUserForm state={state}/>
            <div className="rounded-lg border h-full w-5/8 border-slate-300 py-2 px-2 flex flex-col overflow-y-auto">
              <div className="grid grid-cols-2 py-1.5 px-2 odd:bg-slate-100">
                <div>Name</div>
                <div>Date</div>
              </div>
              {
                data?.getModifyReport?.map( mr => 
                  <div key={mr.id} className="grid grid-cols-2 py-1.5 px-2 odd:bg-slate-100">
                    <div className="text-slate-700 font-medium text-base">{mr.name}</div>
                    <div className="text-slate-600 text-sm">{new Date(mr.createdAt).toLocaleDateString()} - {new Date(mr.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</div>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserView
