import { useSelector } from "react-redux"
import { RootState } from "../redux/store"

const AccountInfo = () => {
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  return (
    <div className="p-4">
      <h1 className="text-center font-bold text-slate-600 lg:text-base 2xl:text-lg mb-5">Account Information</h1>
      <div className="grid grid-cols-2 gap-10">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-4 items-center">
            <p className="text-gray-800 font-bold 2xl:text-sm lg:text-xs">Bucket</p>
            <div className={`${selectedCustomer._id ?  "p-2": "p-4.5"} 2xl:text-sm lg:text-xs border rounded-lg border-slate-500 bg-gray-100 text-gray-600 col-span-3`}>{selectedCustomer?.account_bucket.name}</div>
          </div>
          <div className="grid grid-cols-4 items-center">
            <p className="text-gray-800 font-bold 2xl:text-sm lg:text-xs">Case ID</p>
            <div className={`${selectedCustomer.case_id != "undefined" && Boolean(selectedCustomer?.case_id) ? "p-2": "p-4.5"} 2xl:text-sm lg:text-xs border rounded-lg border-slate-500 bg-gray-100 text-gray-600 col-span-3`}>{selectedCustomer?.case_id != "undefined" ? selectedCustomer?.case_id : ""}</div>
          </div>
          <div className="grid grid-cols-4 items-center">
            <p className="text-gray-800 font-bold 2xl:text-sm lg:text-xs">Credit ID</p>
            <div className={`${selectedCustomer.credit_customer_id ? "p-2": "p-4.5"} 2xl:text-sm lg:text-xs border rounded-lg border-slate-500 bg-gray-100 text-gray-600 col-span-3`}>{selectedCustomer?.credit_customer_id}</div>
          </div>
          <div className="grid grid-cols-4 items-center">
            <p className="text-gray-800 font-bold 2xl:text-sm lg:text-xs">Account ID</p>
            <div className={`${selectedCustomer?.account_id ? "p-2" : "p-4.5"} 2xl:text-sm lg:text-xs border rounded-lg border-slate-500 bg-gray-100 text-gray-600 col-span-3`}>{selectedCustomer?.account_id ? selectedCustomer?.account_id : " "}</div>
          </div>
          <div className="grid grid-cols-4 items-center">
            <p className="text-gray-800 font-bold 2xl:text-sm lg:text-xs">Max DPD</p>
            <div className={`${selectedCustomer?.max_dpd ? "p-2" : "p-4.5"} 2xl:text-sm lg:text-xs border rounded-lg border-slate-500 bg-gray-100 text-gray-600 col-span-3`}>{selectedCustomer?.max_dpd ? selectedCustomer?.max_dpd : " "}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-4 items-center">
            <p className="text-gray-800 font-bold 2xl:text-sm lg:text-xs">Endorsement Date</p>
            <div className={`${selectedCustomer.endorsement_date ?  "p-2": "p-4.5"} 2xl:text-sm lg:text-xs border rounded-lg border-slate-500 bg-gray-100 text-gray-600 col-span-3`}>{selectedCustomer?.endorsement_date}</div>
          </div>
          <div className="grid grid-cols-4 items-center">
            <p className="text-gray-800 font-bold 2xl:text-sm lg:text-xs ">Bill Due Date</p>
            <div className="p-2 2xl:text-sm lg:text-xs border rounded-lg border-slate-500 bg-gray-100 text-gray-600 col-span-3">  {selectedCustomer?.endorsement_date && selectedCustomer?.bill_due_day
            ? new Date(
              new Date(selectedCustomer.endorsement_date).setDate(
              new Date(selectedCustomer.endorsement_date).getDate() + selectedCustomer.bill_due_day
            )).toLocaleDateString(): "N/A"}
          </div>
          </div>
          <div className="grid grid-cols-4 items-center">
            <p className="text-gray-800 font-bold 2xl:text-sm lg:text-xs">Principal OS</p>
            <div className="p-2 2xl:text-sm lg:text-xs border rounded-lg border-slate-500 bg-gray-100 text-gray-600 col-span-3">{selectedCustomer?.out_standing_details.principal_os.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</div>
          </div>
          <div className="grid grid-cols-4 items-center">
            <p className="text-gray-800 font-bold 2xl:text-sm lg:text-xs">Interest OS</p>
            <div className="p-2 2xl:text-sm lg:text-xs border rounded-lg border-slate-500 bg-gray-100 text-gray-600 col-span-3">{selectedCustomer?.out_standing_details.interest_os.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</div>
          </div>
          <div className="grid grid-cols-4 items-center">
            <p className="text-gray-800 font-bold 2xl:text-sm lg:text-xs">DST Fee OS</p>
            <div className="p-2 2xl:text-sm lg:text-xs border rounded-lg border-slate-500 bg-gray-100 text-gray-600 col-span-3">{selectedCustomer?.out_standing_details?.dst_fee_os.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</div>
          </div>
         
        </div>
      </div>
      <div className="flex items-center justify-center gap-5 mt-5 text-slate-500 font-medium">
        <div>
          <p className="font-medium 2xl:text-lg lg:text-base ">Outstanding Balance</p>
          <div className="min-w-45 border p-2 rounded-lg border-slate-400 bg-gray-100 2xl:text-lg lg:text-base">
            {selectedCustomer?.out_standing_details.total_os.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
          </div>
        </div>
        <div>
          <p className="font-medium 2xl:text-base lg:text-md ">Balance</p>
          <div className="min-w-45 border p-2 rounded-lg border-slate-400 bg-gray-100 2xl:text-lg lg:text-base">
            {selectedCustomer?.balance.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
          </div>
        </div>
        <div>
          <p className="font-medium 2xl:text-lg lg:text-base ">Total Paid</p>
          <div className="min-w-45 border p-2 rounded-lg border-slate-400 bg-gray-100 2xl:text-lg lg:text-base">
            {selectedCustomer?.paid_amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}
          </div>
        </div>
      </div>

    </div>
  )
}

export default AccountInfo