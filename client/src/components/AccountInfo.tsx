import { useSelector } from "react-redux"
import { RootState } from "../redux/store"



const FieldsDiv = ({label, value, endorsementDate}:{label:string, value:string | number | null | undefined, endorsementDate: string | null})=> {
  let newValue = value
  if(Number(value) && endorsementDate) {
    const endorsementValue = new Date(endorsementDate)
    const dateDueDate = endorsementValue.getDate() + Number(value)
    newValue = new Date(dateDueDate).toLocaleDateString()
  } 
  
  if(label.toLowerCase().includes('principal') || label.toLowerCase().includes('interest os') || label.toLowerCase().includes('dst fee os')) {
    newValue = value?.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
  }

  return (
    <div className="flex flex-col items-center lg:flex-row w-full ">
      <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4">{label} :</p>
      <div className={`${newValue || null  ?  "p-2": "p-4"} text-xs lg:text-sm border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-full`}>{newValue || ""}</div>
    </div>
  )
}


const AccountInfo = () => {
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  return (
    <div className="p-4">
      <h1 className="text-center font-bold text-slate-600 lg:text-base 2xl:text-lg mb-5">Account Information</h1>
      <div className="flex lg:gap-10 gap-5 items-center justify-center ">
        <div className="flex flex-col gap-2  w-full">
          <FieldsDiv label="Bucket" value={selectedCustomer.account_bucket?.name} endorsementDate={null}/>
          <FieldsDiv label="Case ID" value={selectedCustomer.case_id} endorsementDate={null}/>
          <FieldsDiv label="Credit ID" value={selectedCustomer.credit_customer_id} endorsementDate={null}/>
          <FieldsDiv label="Account ID" value={selectedCustomer?.account_id} endorsementDate={null}/>
          <FieldsDiv label="Max DPD" value={selectedCustomer?.max_dpd} endorsementDate={null}/>
        </div>
        <div className="flex flex-col gap-2  w-full">
          <FieldsDiv label="Endorsement Date" value={selectedCustomer.endorsement_date} endorsementDate={null}/>
          <FieldsDiv label="Bill Due Date" value={selectedCustomer?.bill_due_day} endorsementDate={selectedCustomer.endorsement_date}/>
          <FieldsDiv label="Principal OS" value={selectedCustomer?.out_standing_details.principal_os} endorsementDate={null}/>
          <FieldsDiv label="Interest OS" value={selectedCustomer?.out_standing_details.interest_os} endorsementDate={null}/>
          <FieldsDiv label="DST Fee OS" value={selectedCustomer?.out_standing_details.dst_fee_os} endorsementDate={null}/>
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