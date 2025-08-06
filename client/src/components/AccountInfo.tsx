import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import gql from "graphql-tag"
import { useQuery } from "@apollo/client"
import { CurrentDispo, Search } from "../middleware/types"
import { useState } from "react"
import OtherAccountsViews from "./OtherAccountsViews"
import { useLocation } from "react-router-dom"
import AccountHistoriesView from "./AccountHistoriesView"



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


const ACCOUNT_HISTORIES = gql`
  query findAccountHistories($id: ID!) {
    findAccountHistories(id: $id) {
      _id
      balance
      bucket
      case_id
      endorsement_date
      max_dpd
      dpd
      out_standing_details {
        principal_os
        total_os
      }
      paid_amount
      dispotype {
        _id
        code
        name
      }
      cd {
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
        RFD
        dialer
        createdAt
        contact_method
        chatApp
        sms
      }
    }
  }
`

type OSD = {
  principal_os: number
  total_os: number
}

type Dispotype = {
  _id: string
  code: string
  name: string
}

type AccountHistory = {
  _id: string
  balance: number
  bucket: string
  case_id: string
  dpd: number
  endorsement_date: string
  max_dpd: number
  out_standing_details: OSD
  cd: CurrentDispo
  dispotype: Dispotype
}


const FieldsDiv = ({label, value, endorsementDate}:{label:string, value:string | number | null | undefined, endorsementDate: string | null})=> {
  let newValue = value
  const fieldsOfNumber = ['principal os','interest os','admin fee os','dst fee os','late charge waive fee os','late charge os','waive fee os', 'txn fee os']

  if(Number(value) && endorsementDate) {
    const endorsement = new Date(endorsementDate);
    endorsement.setDate(endorsement.getDate() + Number(value));
    newValue = endorsement.toLocaleDateString("en-PH");
  } 
  
  if(fieldsOfNumber.includes(label.toLowerCase())) {
    newValue = value?.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
  }

  return (
    <div className="flex flex-col items-center xl:flex-row w-full ">
      <p className="text-gray-800 font-bold text-start w-full  xl:text-sm text-xs xl:w-5/10 leading-4 select-none">{label} :</p>
      <div className={`${newValue || null  ?  "p-2": "p-4.5"} select-none xl:ml-2 text-xs xl:text-sm border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-full`}>{newValue || ""}</div>
    </div>
  )
}

const AccountInfo = () => {
  const location = useLocation()
  const isTLCIP = location.pathname === 'tl-cip'
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  const [showAccounts, setShowAccounts] = useState<boolean>(false)
  const {data} = useQuery<{customerOtherAccounts:Search[]}>(OTHER_ACCOUNTS,{variables: {caId: selectedCustomer?._id}, skip: selectedCustomer._id === "" || isTLCIP})
  const [showAccountHistory, setShowAccountHistory] = useState<boolean>(false)
  const {data:accountHistory} = useQuery<{findAccountHistories:AccountHistory[]}>(ACCOUNT_HISTORIES,{variables: {id: selectedCustomer._id},skip: selectedCustomer._id === "" })



  return (
    <>
      {
        showAccounts &&
        <OtherAccountsViews others={data?.customerOtherAccounts || []} close={()=> setShowAccounts(false)}/>
      }
      {
        showAccountHistory &&
        <AccountHistoriesView close={()=>setShowAccountHistory(false) }/>
      }


      <div className="p-4 flex flex-col">
        { data && data?.customerOtherAccounts?.length > 0 &&
          <div className="flex justify-end">
            <button className=" px-2 py-1.5 rounded-md bg-green-400 text-slate-800 font-medium cursor-pointer hover:bg-green-600 hover:text-white" onClick={()=> setShowAccounts(true)}>Other Accounts</button>
          </div>
        }
        {
          accountHistory && accountHistory?.findAccountHistories.length > 0 &&
          <div className="flex justify-end">
            <button className=" px-2 py-1.5 rounded-md bg-cyan-400 text-slate-800 font-medium cursor-pointer hover:bg-cyan-600 hover:text-white" onClick={()=> setShowAccountHistory(true)}>Account History</button>
          </div>
        }

        <h1 className="text-center font-bold text-slate-600 xl:text-base 2xl:text-lg mb-5">Account Information</h1>
        <div className="flex xl:gap-10 gap-2 justify-center ">
          <div className="flex flex-col gap-2  w-full">
            <FieldsDiv label="Bucket" value={ selectedCustomer.account_bucket?.name } endorsementDate={null}/>
            <FieldsDiv label="Case ID" value={ selectedCustomer.case_id } endorsementDate={null}/>
            <FieldsDiv label="Principal OS" value= { selectedCustomer?.out_standing_details.principal_os || 0 } endorsementDate={null}/>
          </div>
          <div className="flex flex-col gap-2  w-full">
            <FieldsDiv label="DPD" value={ selectedCustomer.dpd } endorsementDate={null}/>
            <FieldsDiv label="Max DPD" value={ selectedCustomer.max_dpd } endorsementDate={null}/>
            <FieldsDiv label="DPD Due Date" value={ selectedCustomer.max_dpd } endorsementDate={ selectedCustomer.endorsement_date }/>
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