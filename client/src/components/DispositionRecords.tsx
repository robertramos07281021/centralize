import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import { useQuery, gql } from "@apollo/client"
import { useMemo, useState } from "react"

type Agent = {
  _id: string
  name: string
}

const AGENTS = gql`
  query findAgents {
    findAgents {
      _id
      name
    }
  }
`

type Dispotype = {
  id: string
  name: string
  code: string
}

const DISPOTYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`


const DispositionRecords = () => {
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth )
  const [limit, setLimit] = useState(3)

  const {data:agentData} = useQuery<{findAgents:Agent[]}>(AGENTS)
  const {data:dispotypesData} = useQuery<{getDispositionTypes:Dispotype[]}>(DISPOTYPES)

  const dispotypeObject = useMemo(()=> {
    const data = dispotypesData?.getDispositionTypes || []
    return Object.fromEntries(data.map(e=> [e.id, e.name]))
  },[dispotypesData])

  const agentObject = useMemo(()=> {
    const data = agentData?.findAgents || []
    return Object.fromEntries(data.map(e=> [e._id, e.name]))
  },[agentData])

  const history = selectedCustomer?.dispo_history || []
  const slicedHistory = history.slice(0,limit)

  const date = (date:string) => {
    const createdDate = new Date(date).toLocaleDateString()
    const time = new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    return `${createdDate} - ${time}`
  }
  
  const handleLoadMore = () => {
    if(limit === 3) {
      setLimit(history.length)
    } else {
      setLimit(3)
    }
  }
  const withPayment = ['PTP','UNEG','PAID']

  const filter = dispotypesData?.getDispositionTypes.filter(e=> withPayment.includes(e.code)).map(x=> x.id)

  return selectedCustomer._id && selectedCustomer?.dispo_history && (
    <div className="p-5 flex flex-col gap-10">
      <h1 className="text-center text-xl font-bold text-slate-600">Account History</h1>
      <div className={`flex flex-wrap gap-10 justify-center`}>
        {
          slicedHistory.map((gad,index) => (
            <div key={gad._id} className={`w-8/10 lg:w-2/7 2xl:text-sm lg:text-xs flex flex-col gap-2 border p-2 rounded-xl border-slate-400 ${gad.existing && "bg-slate-200"}`}>
               <div className=" gap-2 border border-slate-500 rounded-md bg-white p-2 text-center font-medium 2xl:text-base lg;text-sm text-slate-600">
                {index + 1 === 1 ? "Latest" :  (index + 1 === 2 ? "Previous" : "Past")}
              </div>
              <div className="grid grid-cols-3 gap-2 border border-slate-500 rounded-md bg-white ">
                <div className="text-gray-800 font-bold p-2 text-end">Agent</div>
                <div className="p-2 col-span-2 font-medium capitalize text-slate-600 ">{agentObject[gad.user] || "No agent id"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 border border-slate-500 rounded-md bg-white w-full">
                <div className="text-gray-800 font-bold p-2 text-end">Date & Time</div>
                <div className="p-2 col-span-2 text-slate-700  w-full">{date(gad.createdAt)}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2 ">
                <div className="text-gray-800 font-bold p-2 text-end">Disposition</div>
                <div className="col-span-2 border border-slate-500 rounded-lg text-slate-800 p-2 capitalize bg-white font-bold">{dispotypeObject[gad.disposition]}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2 ">
                <div className="text-gray-800 font-bold p-2 text-end">Contact Method</div>
                <div className="col-span-2 border border-slate-500 rounded-lg text-slate-800 p-2 capitalize bg-white">{gad.contact_method}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2 ">
                <div className="text-gray-800 font-bold p-2 text-end">Amount</div>
                <div className="col-span-2 border border-slate-500 rounded-lg text-slate-800 p-2 bg-white">{gad.amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</div>
              </div>
              <div className=" grid grid-cols-3 gap-2">
                <div className="text-gray-800 font-bold p-2 text-end">Payment</div>
                <div className="col-span-2 border border-slate-500 rounded-lg text-slate-800 p-2 capitalize bg-white">{filter?.includes(gad.disposition) ? gad.payment || "" : ""}</div>
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
              <div className=" grid grid-cols-3 gap-2 ">
                <div className="text-gray-800 font-bold p-2 text-end">Dialer</div>
                <div className="col-span-2 max-h-30 border border-slate-500 rounded-lg text-slate-800 p-2 capitalize bg-white">{gad.dialer}</div>
              </div>
            </div>
          ))
        }
      </div>
      {
        history.length > 3 &&
        <div className="flex justify-center">
          <button type="submit" className={`bg-blue-500 hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-500 font-medium rounded-lg thandleLoadMoreext-sm w-30 py-2 me-2 mb-2  cursor-pointer flex justify-center`} onClick={handleLoadMore}>
            {limit === 3 ? "Load more..." : "Hide" }
          </button>
        </div>
      }
    </div>
  )
}

export default DispositionRecords