import { useSelector } from "react-redux"
import { RootState } from "../redux/store"

const AccountInfo = () => {
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  return (
    <div className="p-4">
      <h1 className="text-center font-bold text-slate-600 text-lg mb-5">Account Information</h1>
      <div className="grid grid-cols-2 gap-10 text-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 justify-between">
            <p className="text-gray-800 font-bold">Bucket</p>
            <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{selectedCustomer?.account_bucket.name}</div>
          </div>
          <div className="flex items-center gap-3 justify-between">
            <p className="text-gray-800 font-bold ">Case ID</p>
            <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{selectedCustomer?.case_id}</div>
          </div>
          <div className="flex items-center gap-3 justify-between">
            <p className="text-gray-800 font-bold ">Credit ID</p>
            <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{selectedCustomer?.credit_customer_id}</div>
          </div>
          <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">Account ID</p>
              <div className={`${selectedCustomer?.account_id ? "p-2" : "p-4.5"} border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80`}>{selectedCustomer?.account_id ? selectedCustomer?.account_id : " "}</div>
            </div>
        
        </div>
        <div className="flex flex-col  ">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">Endorsement Date</p>
              <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-96">{selectedCustomer?.endorsement_date}</div>
            </div>
            <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">Bill Due Date</p>
              <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">  {selectedCustomer?.endorsement_date && selectedCustomer?.bill_due_day
            ? new Date(
              new Date(selectedCustomer.endorsement_date).setDate(
              new Date(selectedCustomer.endorsement_date).getDate() + selectedCustomer.bill_due_day
            )
      ).toLocaleDateString() // Format the date to readable string
    : "N/A"}</div>
            </div>
            <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">Principal OS</p>
              <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{selectedCustomer?.out_standing_details.principal_os}</div>
            </div>
            <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">Interest OS</p>
              <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{selectedCustomer?.out_standing_details.interest_os}</div>
            </div>
            <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">DST Fee OS</p>
              <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{selectedCustomer?.out_standing_details?.dst_fee_os}</div>
            </div>
          </div>
         
        </div>
      </div>
      <div className="flex items-center justify-center gap-5 mt-5 text-slate-500 font-medium">
      <p className="font-medium">Outstanding Balance</p>
      <div className="w-80 border p-2 rounded-lg border-slate-400 bg-gray-100">
        {selectedCustomer?.out_standing_details.total_os}
      </div>
      </div>

    </div>
  )
}

export default AccountInfo