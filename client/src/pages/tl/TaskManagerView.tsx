
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import { RiArrowDownSFill, RiArrowUpSFill   } from "react-icons/ri";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import GroupSection from "../../components/GroupSection";


interface DispositionTypes {
  id:string
  name: string
  code: string
}

interface OutStandingDetails {
  principal_os:number
  interest_os: number
  admin_fee_os: number
  txn_fee_os: number
  late_charge_os: number
  dst_fee_os: number
  total_os: number
}

interface GrassDetails {
  grass_region: string
  vendor_endorsement: string
  grass_date: string
}

interface AccountBucket {
  name: string
  dept:string 
}

interface CustomerInfo {
  fullName: string
  dob: string
  gender: string
  contact_no: string
  emails: string
  addresses: string
  _id: string
}

interface CurrentDisposition {
  _id: string
  amount: number
  disposition: string
  payment_date: string
  ref_no: string
  existing: string
  comment: string
  payment: string
  payment_method: string
  user: string
}

interface DispoType {
  _id: string
  name: string
  code: string
}

interface Disposition_user {
  _id: string
  name: string
  user_id: string
}

interface CustomerAccount {
    _id: string
    case_id: string
    account_id: string
    endorsement_date:string
    credit_customer_id:string
    bill_due_day:number
    max_dpd: number
    balance: number
    paid_amount:number
    out_standing_details :OutStandingDetails
    grass_details: GrassDetails
    account_bucket: AccountBucket
    customer_info: CustomerInfo
    currentDisposition: CurrentDisposition
    dispoType: DispoType
    disposition_user : Disposition_user
}



const GET_ALL_DISPOSITION_TYPE = gql`
  query GetDispositionTypes {
  getDispositionTypes {
    id
    name
    code
  }
}
`

const FIND_CUSTOMER_ACCOUNTS = gql`
query Query($dept: String!, $page: Int, $disposition: [String]) {
  findCustomerAccount(dept: $dept, page: $page, disposition: $disposition) {
    CustomerAccounts {
      _id
      case_id
      account_id
      endorsement_date
      credit_customer_id
      bill_due_day
      max_dpd
      balance
      paid_amount
      out_standing_details {
        principal_os
        interest_os
        admin_fee_os
        txn_fee_os
        late_charge_os
        dst_fee_os
        total_os
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
      }
      currentDisposition {
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
      }
      dispoType {
        _id
        name
        code
      }
      disposition_user {
        name
        user_id
        _id
      }
    }
    totalCountCustomerAccounts
  }
}
`

const TaskManagerView = () => {
  const {userLogged} = useSelector((state:RootState)=>state.auth )
  const {data:DispositionTypes} = useQuery<{getDispositionTypes:DispositionTypes[]}>(GET_ALL_DISPOSITION_TYPE)
  const [selectedDisposition, setSelectedDisposition] = useState<string[]>([])
  const [page, setPage] = useState<number>(1)
  const {data:CustomerAccountsData} = useQuery<{findCustomerAccount:CustomerAccount[]}>(FIND_CUSTOMER_ACCOUNTS,{variables: {disposition: selectedDisposition, dept: userLogged.department, page:page }})

  


  const handleCheckBox= (value:string, e: React.ChangeEvent<HTMLInputElement>) => {
    const check = e.target.checked ? [...selectedDisposition, value] : selectedDisposition.filter((d) => d !== value )
    setSelectedDisposition(check)
  }

  const [showSelection, setShowSelection] = useState<boolean>(false)
  const onClick = ()=> {
    setShowSelection(!showSelection) 
  }

  return (
    <div className="h-full w-full p-5 ">
      <div className="flex gap-10 mt-5">
        <div className=" flex gap-10 text-sm items-end">
          <div className="w-96 border rounded-md h-10 border-slate-500 relative cursor-default " title={selectedDisposition.toString()} >
            {
              showSelection ?
              <RiArrowUpSFill  className="absolute right-2 top-2 text-2xl" onClick={onClick} />
              :
              <RiArrowDownSFill className="absolute right-2 top-2 text-2xl" onClick={onClick}/>
            }
            <div className="w-80 p-2.5 text-xs truncate font-bold text-slate-500">
              {selectedDisposition.length > 0 ? selectedDisposition.toString(): "Select Disposition"}
            </div>
            {
              showSelection &&
              <div className="w-full h-96  border overflow-y-auto absolute top-10 flex gap-5 p-5 text-xs flex-col border-slate-500">
              {
                DispositionTypes?.getDispositionTypes.filter((e)=> e.name !== "SETTLED").map((e) =>
                  <label key={e.id} className="flex gap-2 text-slate-500">
                    <input   
                    type="checkbox" 
                    name={e.name} 
                    id={e.name} 
                    value={e.name}
                    checked={selectedDisposition.includes(e.name)}
                    onChange={(e)=> handleCheckBox(e.target.value, e)} />
                    <p>{e.name}{e.name === "PAID" ? " (Not Completely Settled)":""}</p>
                  </label>
                )
              }
              </div>
            }
          </div>
          <label className="flex gap-2 text-slate-500 items-center">
            <input   
              disabled
              type="checkbox" 
              name="due_date" 
              id="due_date"
              value="due date"
            />
            <p>Due Date</p>
          </label>
        </div>
        <GroupSection/>
     
      </div>
    </div>
  )
}

export default TaskManagerView