import { useSelector } from "react-redux"
import { RootState } from "../redux/store"



const FieldsDiv = ({label, value, endorsementDate}:{label:string, value:string | number | null | undefined, endorsementDate: string | null})=> {
  let newValue = value

  if(Number(value) && endorsementDate) {
    const endorsement = new Date(endorsementDate);
    endorsement.setDate(endorsement.getDate() + Number(value));
    newValue = endorsement.toLocaleDateString("en-PH");
  } 
  
  const fieldsOfNumber = ['principal os','interest os','admin fee os','dst fee os','late charge waive fee os','late charge os','waive fee os', 'txn fee os']

  if(fieldsOfNumber.includes(label.toLowerCase())) {
    newValue = value?.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
  }

  return (
    <div className="flex flex-col items-center lg:flex-row w-full ">
      <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-5/10 leading-4">{label} :</p>
      <div className={`${newValue || null  ?  "p-2": "p-4"} lg:ml-2 text-xs lg:text-sm border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-full`}>{newValue || ""}</div>
    </div>
  )
}


const AccountInfo = () => {
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  return (
    <div className="p-4">
      <h1 className="text-center font-bold text-slate-600 lg:text-base 2xl:text-lg mb-5">Account Information</h1>
      <div className="flex lg:gap-10 gap-2 justify-center ">
        <div className="flex flex-col gap-2  w-full">
          <FieldsDiv label="Bucket" value={selectedCustomer.account_bucket?.name} endorsementDate={null}/>
          <FieldsDiv label="Case ID" value={selectedCustomer.case_id} endorsementDate={null}/>
          <FieldsDiv label="Credit ID" value={selectedCustomer.credit_customer_id} endorsementDate={null}/>
          <FieldsDiv label="Account ID" value={selectedCustomer.account_id} endorsementDate={null}/>
          <FieldsDiv label="DPD" value={selectedCustomer.max_dpd} endorsementDate={null}/>
          <FieldsDiv label="MPD" value={selectedCustomer.month_pd} endorsementDate={null}/>
          <FieldsDiv label="Endorsement Date" value={selectedCustomer.endorsement_date} endorsementDate={null}/>
          <FieldsDiv label="Bill Due Date" value={selectedCustomer.bill_due_day || selectedCustomer.max_dpd } endorsementDate={selectedCustomer.endorsement_date}/>
        </div>
        <div className="flex flex-col gap-2  w-full">
          <FieldsDiv label="Principal OS" value={selectedCustomer?.out_standing_details.principal_os || 0} endorsementDate={null}/>
          <FieldsDiv label="Interest OS" value={selectedCustomer?.out_standing_details.interest_os || 0} endorsementDate={null}/>
          <FieldsDiv label="Admin Fee OS" value={selectedCustomer?.out_standing_details.admin_fee_os || 0} endorsementDate={null}/>
          <FieldsDiv label="Late Charge OS" value={selectedCustomer?.out_standing_details.late_charge_os || 0} endorsementDate={null}/>
          <FieldsDiv label="DST Fee OS" value={selectedCustomer?.out_standing_details.dst_fee_os || 0} endorsementDate={null}/>
          <FieldsDiv label="Txn Fee OS" value={selectedCustomer?.out_standing_details.txn_fee_os || 0} endorsementDate={null}/>
          <FieldsDiv label="Late Charge Waive Fee OS" value={selectedCustomer?.out_standing_details.waive_fee_os || 0} endorsementDate={null}/>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row items-center justify-center lg:gap-5 gap-2 mt-5 text-slate-500 font-medium">
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