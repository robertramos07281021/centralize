import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useState } from "react"

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

interface Member {
  _id: string
  name: string
  user_id: string
}


interface Assigned {
  _id: string
  name: string
  description: string
  members: [Member]
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
    assigned: Assigned
    out_standing_details :OutStandingDetails
    grass_details: GrassDetails
    account_bucket: AccountBucket
    customer_info: CustomerInfo
    currentDisposition: CurrentDisposition
    dispoType: DispoType
    disposition_user : Disposition_user
}



const FIND_CUSTOMER_ACCOUNTS = gql`
query Query($page: Int, $disposition: [String]) {
  findCustomerAccount(page: $page, disposition: $disposition) {
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
      assigned {
        _id
        name
        description
        members {
          _id
          name
          user_id
        }
      }
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
interface modalProps {
  selectedDisposition: string[]
 
}


const TaskDispoSection:React.FC<modalProps>  = ({selectedDisposition}) => {

    const [page, setPage] = useState<number>(1)
    const {data:CustomerAccountsData} = useQuery<{findCustomerAccount:CustomerAccount[]}>(FIND_CUSTOMER_ACCOUNTS,{variables: {disposition: selectedDisposition, page:page }})

  return (
    <div className="border h-full">

    </div>
  )
}

export default TaskDispoSection