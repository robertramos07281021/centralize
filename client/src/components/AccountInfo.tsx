import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import gql from "graphql-tag"
import { useQuery } from "@apollo/client"
import { Search } from "../middleware/types"
import { useState } from "react"
import OtherAccountsViews from "./OtherAccountsViews"



const OTHER_ACCOUNTS = gql`
  query customerOtherAccounts($caId: ID) {
    customerOtherAccounts(caId: $caId) {
       _id
      case_id
      account_id
      endorsement_date
      credit_customer_id
      bill_due_day
      max_dpd
      balance
      paid_amount
      isRPCToday
      month_pd
      emergency_contact {
        name
        mobile
      }
      dispo_history {
         _id
        amount
        disposition
        payment_date
        ref_no
        existing
        comment
        payment
        payment_method
        user
        dialer
        createdAt
        contact_method
        chatApp
        sms
        RFD
      }
      out_standing_details {
        principal_os
        interest_os
        admin_fee_os
        txn_fee_os
        late_charge_os
        dst_fee_os
        waive_fee_os
        total_os
        late_charge_waive_fee_os
      }
      grass_details {
        grass_region
        vendor_endorsement
        grass_date
      }
      account_bucket {
        name
        dept
      }
      customer_info {
        fullName
        dob
        gender
        contact_no
        emails
        addresses
        _id
        isRPC
      }
    }
  }
`




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
    <div className="flex flex-col items-center xl:flex-row w-full ">
      <p className="text-gray-800 font-bold text-start w-full  xl:text-sm text-xs xl:w-5/10 leading-4 select-none">{label} :</p>
      <div className={`${newValue || null  ?  "p-2": "p-4"} select-none xl:ml-2 text-xs xl:text-sm border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-full`}>{newValue || ""}</div>
    </div>
  )
}

const AccountInfo = () => {
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  const [showAccounts, setShowAccounts] = useState<boolean>(false)
  const {data} = useQuery<{customerOtherAccounts:Search[]}>(OTHER_ACCOUNTS,{variables: {caId: selectedCustomer?._id}, skip: selectedCustomer._id === ""})
  
  return (
    <>
      {
        showAccounts &&
        <OtherAccountsViews others={data?.customerOtherAccounts || []} close={()=> setShowAccounts(false)}/>
      }
      <div className="p-4 flex flex-col">
        { data && data?.customerOtherAccounts?.length > 0 &&
          <div className="flex justify-end">
            <button className=" px-2 py-1.5 rounded-md bg-green-400 text-slate-800 font-medium cursor-pointer hover:bg-green-600 hover:text-white" onClick={()=> setShowAccounts(true)}>Other Accounts</button>
          </div>
        }
        <h1 className="text-center font-bold text-slate-600 xl:text-base 2xl:text-lg mb-5">Account Information</h1>
        <div className="flex xl:gap-10 gap-2 justify-center ">
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
        <div className="flex flex-col xl:flex-row items-center justify-center xl:gap-5 gap-2 mt-5 text-slate-500 font-medium">
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
        {
          data && data?.customerOtherAccounts?.length > 0 && 
          (()=> {
            const sumofOtherOB = data?.customerOtherAccounts.map(x=> x.out_standing_details.total_os).reduce((t,v)=> t+v) + selectedCustomer.out_standing_details.total_os

            const sumofOtherPrincipal = data.customerOtherAccounts.map(x=> x.out_standing_details.principal_os).reduce((t,v)=> t+v) + selectedCustomer.out_standing_details.principal_os

            return (
              <div className="mt-5 flex justify-center gap-5 text-slate-500">
                <div>
                  <h1 className="font-medium 2xl:text-lg lg:text-base">Customer Total OB</h1>
                  <div className="min-w-45 p-2 border border-slate-500 rounded-md">{sumofOtherOB.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</div>
                </div>
                <div>
                  <h1 className="font-medium 2xl:text-lg lg:text-base">Customer Total Principal</h1>
                  <div className="min-w-45 p-2 border border-slate-500 rounded-md">{sumofOtherPrincipal.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</div>
                </div>
              </div>
            )
          })()
        }
      </div>
    </>
  )
}

export default AccountInfo