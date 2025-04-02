import { useQuery } from "@apollo/client"
import { ACCOUNT_INFO } from "../apollo/query"

interface AccountInfoProps {
  id: string
}

interface outStandingDetails {
  principal_os: number
  interest_os: number
  admin_fee_os: number
  txn_fee_os: number
  late_charge_os: number
  dst_fee_os: number
  total_os: number
}

interface grassDetails {
  grass_region: string
  vendor_endorsement: string
  grass_date: string
}

interface  AccountBucket {
  name: string
  dept: string
}

interface accountInfo {
  id: string
  case_id: string,
  account_id: string
  endorsement_date: string
  credit_customer_id: string
  bill_due_day: number
  max_dp: number
  out_standing_details: outStandingDetails
  grass_details: grassDetails
  account_bucket: AccountBucket
}

const AccountInfo:React.FC<AccountInfoProps> = ({id}) => {
  const {data:CustomerAccountInfo} = useQuery<{accountInfo:accountInfo}>(ACCOUNT_INFO,{variables: {id: id}})
  const accountInfo = CustomerAccountInfo?.accountInfo
  return (
    <div className="p-4">
      <h1 className="text-center font-bold text-slate-600 text-lg mb-5">Account Information</h1>
      <div className="grid grid-cols-2 gap-10 text-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 justify-between">
            <p className="text-gray-800 font-bold">Bucket</p>
            <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{accountInfo?.account_bucket.name}</div>
          </div>
          <div className="flex items-center gap-3 justify-between">
            <p className="text-gray-800 font-bold ">Case ID</p>
            <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{accountInfo?.case_id}</div>
          </div>
          <div className="flex items-center gap-3 justify-between">
            <p className="text-gray-800 font-bold ">Credit ID</p>
            <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{accountInfo?.credit_customer_id}</div>
          </div>
          <div className="flex items-center gap-3 justify-between">
            <p className="text-gray-800 font-bold ">Credit ID</p>
            <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{accountInfo?.credit_customer_id}</div>
          </div>
          <div className="flex items-center gap-3 justify-between">
            <p className="text-gray-800 font-bold ">Interest OS</p>
            <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{accountInfo?.out_standing_details?.interest_os}</div>
          </div>
        </div>
        <div className="flex flex-col  ">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">Endorsement Date</p>
              <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-96">{accountInfo?.endorsement_date}</div>
            </div>
            <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">Account ID</p>
              <div className={`${accountInfo?.account_id ? "p-2" : "p-4.5"} border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80`}>{accountInfo?.account_id ? accountInfo?.account_id : " "}</div>
            </div>
            <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">Bill Due Date</p>
              <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">  {accountInfo?.endorsement_date && accountInfo?.bill_due_day
            ? new Date(
              new Date(accountInfo.endorsement_date).setDate(
              new Date(accountInfo.endorsement_date).getDate() + accountInfo.bill_due_day
            )
      ).toLocaleDateString() // Format the date to readable string
    : "N/A"}</div>
            </div>
            <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">Principal OS</p>
              <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{accountInfo?.out_standing_details.principal_os}</div>
            </div>
            <div className="flex items-center gap-3 justify-between">
              <p className="text-gray-800 font-bold ">Interest OS</p>
              <div className="p-2 border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-80">{accountInfo?.out_standing_details.interest_os}</div>
            </div>
          </div>
         
        </div>
      </div>
      <div className="flex items-center justify-center gap-5 mt-5 text-slate-500 font-medium">
      <p className="font-medium">Outstanding Balance</p>
      <div className="w-80 border p-2 rounded-lg border-slate-400 bg-gray-100">
        {accountInfo?.out_standing_details.total_os}
      </div>
      </div>

    </div>
  )
}

export default AccountInfo