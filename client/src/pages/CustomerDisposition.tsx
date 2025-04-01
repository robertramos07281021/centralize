import { useState } from "react"
import CustomerUpdateForm from "../components/CustomerUpdateForm"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import { Navigate, useLocation } from "react-router-dom"

export type LocationState = {
  fullName:string
  dob:string
  gender:string
  contact_no:string[]
  emails:string[]
  addresses:string[]
  _id:string
}

const CustomerDisposition = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()

  const state = location.state as LocationState || {}
  const [isUpdate, setIsUpdate] = useState<boolean>(false)


  return userLogged._id ? (
    <>
      <div className="w-full grid grid-cols-2 ">
        <div className="flex flex-col p-2 gap-3"> 
          <h1 className="text-center font-bold text-slate-600 text-lg">Customer Information</h1>
          <div className="ms-5 mt-5">
            <div className="text-sm font-bold text-slate-500 uppercase">Full Name</div>
            <div className="w-96 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
            {state.fullName}
            </div>
          </div>
          <div className="ms-5">
            <div className="text-sm font-bold text-slate-500">Date Of Birth (yyyy-mm-dd)</div>
            <div className="w-96 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
              {state.dob}
            </div>
          </div>
          <div className="ms-5 ">
            <div className="text-sm font-bold text-slate-500">Gender</div>
            <div className="w-96 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
              {state.gender === "f" ? "Female" : "Male"}
            </div>
          </div>
          <div className="ms-5 ">
            <div className="text-sm font-bold text-slate-500">Mobile No.</div>
            <div className="flex flex-col gap-2">
              {state.contact_no.map((cn,index)=> (
                <div key={index} className="w-96 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
                  {cn}
                </div>
              ))}
            </div>
          </div>
          <div className="ms-5">
            <div className="text-sm font-bold text-slate-500">Email</div>
            <div className="flex flex-col gap-2"> 
              {
                state.emails.map((e,index)=> (
                  <div key={index} className="w-96 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
                    {e}
                  </div>
                ))
              }
            </div>
          </div>
          <div className="ms-5">
            <div className="text-sm font-bold text-slate-500">Address</div>
            <div className="flex flex-cols gap-2">
              {
                state.addresses.map((a, index)=> (
                  <div key={index} className="w-96 h-32 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500 text-justify">
                    {a}
                  </div>
                ))
              }

            </div>
          </div>
          {
            !isUpdate &&
          <div className="ms-5">
            <button 
              type="button" 
              onClick={()=> setIsUpdate(true)}
              className={`bg-orange-400 hover:bg-orange-500 focus:outline-none text-white  focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 cursor-pointer`}>Update</button>
          </div>
          }
        </div>
        {
          isUpdate &&
          <CustomerUpdateForm cancel={()=> setIsUpdate(false)} state={state}/>
        }
      </div>
      <div className="p-5">

      </div>
    </>
  ) : (<Navigate to="/"/>)
}

export default CustomerDisposition