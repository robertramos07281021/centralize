import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import { useQuery } from "@apollo/client"
import { DISPOSITION_RECORDS } from "../apollo/query"
import { useEffect, useState } from "react"
import { ImSpinner9 } from "react-icons/im";

type Disposition =  {
  _id:string
  amount: number
  disposition: string
  payment_date: string
  ref_no: string
  comment: string
  existing: boolean
  payment: string
  payment_method: string,
  createdAt: string
  created_by: {
    user_id: string
  }
}


const DispositionRecords = () => {
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth )
  const [limit, setLimit] = useState(3)


  const {data:dispositions,refetch, loading} = useQuery<{getAccountDispositions:Disposition[]}>(DISPOSITION_RECORDS,{variables: {id: selectedCustomer._id, limit: limit} })

  const date = (date:string) => {
    const createdDate = new Date(date).toLocaleDateString()
    const time = new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    return `${createdDate} - ${time}`
  }
  const handleLoadMore = () => {
    if(limit === 3) {
      setLimit(1)
    } else {
      setLimit(3)
    }
  }

  useEffect(()=> {
    refetch()
  },[selectedCustomer,refetch, limit])

  return selectedCustomer._id && dispositions?.getAccountDispositions && dispositions?.getAccountDispositions?.length > 0 && (
    <div className="p-5 flex flex-col gap-10">
      <h1 className="text-center text-xl font-bold text-slate-600">Account History</h1>
      <div className={`flex flex-wrap gap-10 justify-center`}>
        {
          dispositions?.getAccountDispositions.map((gad) => (
            <div key={gad._id} className={`w-2/7 2xl:text-sm lg:text-xs flex flex-col gap-2 border p-2 rounded-xl border-slate-400 ${gad.existing && "bg-slate-200"}`}>
              <div className="grid grid-cols-3 gap-2 border border-slate-500 rounded-md bg-white">
                <div className="text-gray-800 font-bold p-2 text-end">Agent</div>
                <div className="p-2 font-medium capitalize text-slate-600 ">{gad.created_by.user_id || "No agent id"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 border border-slate-500 rounded-md bg-white">
                <div className="text-gray-800 font-bold p-2 text-end">Date & Time</div>
                <div className="p-2 text-slate-700 bg-white">{date(gad.createdAt)}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2 ">
                <div className="text-gray-800 font-bold p-2 text-end">Disposition</div>
                <div className="col-span-2 border border-slate-500 rounded-lg text-slate-800 p-2 capitalize bg-white font-bold">{gad.disposition}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2 ">
                <div className="text-gray-800 font-bold p-2 text-end">Amount</div>
                <div className="col-span-2 border border-slate-500 rounded-lg text-slate-800 p-2 bg-white">{gad.amount | 0}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2">
                <div className="text-gray-800 font-bold p-2 text-end">Payment</div>
                <div className="col-span-2 border border-slate-500 rounded-lg text-slate-800 p-2 capitalize bg-white">{gad.payment}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2 ">
                <div className="text-gray-800 font-bold p-2 text-end">Payment Date</div>
                <div className="col-span-2 border border-slate-500 rounded-lg text-slate-800 p-2 capitalize bg-white">{gad.payment_date}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2 ">
                <div className="text-gray-800 font-bold p-2 text-end">Payment Method</div>
                <div className="col-span-2 border border-slate-500 rounded-lg text-slate-800 p-2 capitalize bg-white">{gad.payment_method}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2 ">
                <div className="text-gray-800 font-bold p-2 text-end">Reference No.</div>
                <div className="col-span-2 border border-slate-500 rounded-lg text-slate-800 p-2 capitalize bg-white">{gad.ref_no}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2 ">
                <div className="text-gray-800 font-bold p-2 text-end">Comment</div>
                <div className="col-span-2 max-h-30 border border-slate-500 rounded-lg text-slate-800 p-2 capitalize bg-white">{gad.comment}</div>
              </div>
            </div>
          ))
        }
      </div>
        {
          dispositions?.getAccountDispositions && dispositions?.getAccountDispositions?.length > 3 &&
          <div className="flex justify-center">
            <button type="submit" className={`bg-blue-500 hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-500 font-medium rounded-lg thandleLoadMoreext-sm w-30 py-2 me-2 mb-2  cursor-pointer flex justify-center`} onClick={handleLoadMore}>
              {
                loading ? 
                <>
                  <ImSpinner9 className="animate-spin" />
                </> : 
                <>
                {limit === 3 ? "Load more..." : "Hide" }
                </>
              }
              </button>
          </div>
        }
    </div>
  )
}

export default DispositionRecords