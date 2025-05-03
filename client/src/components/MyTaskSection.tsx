import { useMutation, useQuery, useSubscription } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../redux/store"
import { dateAndTime } from "../middleware/dateAndTime"
import { setSelectedCustomer } from "../redux/slices/authSlice"
import { useApolloClient } from '@apollo/client';

type outStandingDetails = {
  principal_os: number
  interest_os: number
  admin_fee_os: number
  txn_fee_os: number
  late_charge_os: number
  dst_fee_os: number
  total_os: number
}

type grassDetails = {
  grass_region: string
  vendor_endorsement: string
  grass_date: string
}

type  AccountBucket = {
  name: string
  dept: string
}

type CustomerRegistered = {
  fullName:string
  dob:string
  gender:string
  contact_no:string[]
  emails:string[]
  addresses:string[]
  _id:string
}

type CurrentDispo = {
  disposition: string
}

type CustomerData = {
    _id: string
    case_id: string
    account_id: string
    endorsement_date: string
    credit_customer_id: string
    bill_due_day: number
    max_dpd: number
    balance: number
    paid_amount: number
    assigned_date: string
    out_standing_details: outStandingDetails
    grass_details: grassDetails
    account_bucket: AccountBucket
    current_disposition: CurrentDispo
    customer_info: CustomerRegistered
}

interface GroupTask {
  task: CustomerData[]
  _id: string
}

const MY_TASKS = gql`
  query Query {
    myTasks {
      _id
      case_id
      account_id
      endorsement_date
      credit_customer_id
      bill_due_day
      max_dpd
      balance
      paid_amount
      assigned_date
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
      current_disposition {
        disposition
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
    }
  }
`

const GROUP_TASKS =gql`
  query groupTask {
    groupTask {
      _id
      task {
        _id
        case_id
        account_id
        endorsement_date
        credit_customer_id
        bill_due_day
        max_dpd
        balance
        paid_amount
        assigned_date
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
        current_disposition {
          disposition
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
      }
    }
  }
`
interface SubSuccess {
  message:string
  members:string[]
}


const SOMETHING_NEW_IN_TASK  = gql`
  subscription Subscription {
    somethingChanged {
      message
      members
    }
  }
`

const SELECT_TASK = gql`
  mutation Mutation($id: ID!) {
    selectTask(id: $id) {
      message
      success
    }
  }
`


const MyTaskSection = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const dispatch = useAppDispatch()
  const client = useApolloClient()
  useSubscription<{somethingChanged:SubSuccess}>(SOMETHING_NEW_IN_TASK,{
    onData: ({data})=> {
      if(data) {
        if(data.data?.somethingChanged?.message === "TASK_SELECTION" && data.data?.somethingChanged?.members?.toString().includes(userLogged._id)) {
          client.refetchQueries({
            include: ['groupTask']
          })
        }
        if(data.data?.somethingChanged?.message === "NEW_DISPOSITION" && data.data?.somethingChanged?.members?.toString().includes(userLogged._id)) {
          client.refetchQueries({
            include: ['groupTask']
          })
        }
      }
    }
  });

  // console.log(res.data?.somethingChange?.success)


  const {data:myTasksData} = useQuery<{myTasks:CustomerData[]}>(MY_TASKS)
  const {data:groupTaskData, refetch:groupTaskRefetch} = useQuery<{groupTask:GroupTask}>(GROUP_TASKS)
  const [data, setData] = useState<CustomerData[] | null>([])
  const [selection, setSelection] = useState<string>("")

  useEffect(()=> {
    if(selection.trim()==="my_task") {
      setData(myTasksData?.myTasks ? myTasksData?.myTasks : null )
    } else {
      setData(groupTaskData?.groupTask?.task ? groupTaskData?.groupTask.task : null)
    }
  },[selection,myTasksData,groupTaskData])

  const handleClickMyTask = () => {
    if(selection && selection.trim() !== "group_task"){
      setSelection("")
    } else {
      setSelection("my_task")
    } 
  }

  const [selectTask]= useMutation(SELECT_TASK,{
    onCompleted: ()=> {
      groupTaskRefetch()
    }
  })
  
  const handleClickSelect = async(data:CustomerData) => {
    try {
      const res = await selectTask({variables: {id: data._id}})
      if(res.data.selectTask.success) {
        dispatch(setSelectedCustomer({
          _id: data._id,
          case_id: data.case_id,
          account_id: data.account_id,
          endorsement_date: data.endorsement_date,
          credit_customer_id: data.credit_customer_id,
          bill_due_day: data.bill_due_day,
          max_dpd: data.max_dpd,
          balance: data.balance,
          paid_amount: data.paid_amount,
          out_standing_details: {
            principal_os: data.out_standing_details.principal_os,
            interest_os: data.out_standing_details.interest_os,
            admin_fee_os: data.out_standing_details.admin_fee_os,
            txn_fee_os: data.out_standing_details.txn_fee_os,
            late_charge_os: data.out_standing_details.late_charge_os,
            dst_fee_os: data.out_standing_details.dst_fee_os,
            total_os: data.out_standing_details.total_os
          },
          grass_details: {
            grass_region: data.grass_details.grass_region,
            vendor_endorsement: data.grass_details.vendor_endorsement,
            grass_date: data.grass_details.grass_date
          },
          account_bucket: {
            name: data.account_bucket.name,
            dept: data.account_bucket.dept
          },
          customer_info: {
            fullName: data.customer_info.fullName,
            dob: data.customer_info.dob,
            gender: data.customer_info.gender,
            contact_no: data.customer_info.contact_no,
            emails: data.customer_info.emails,
            addresses: data.customer_info.addresses,
            _id:""
          }
        }))
      }

    } catch (error) { 
      console.log(error)
    }
  }

  const handleClickGroupTask = () => {
    if(selection && selection.trim() !== "my_task"){
      setSelection("")
    } else {
      setSelection("group_task")
    } 
  }

  // useEffect(()=> {
  //   if(selectedCustomer._id) {
  //     setSelection("")
  //   } else {
  //     groupTaskRefetch()
  //   }
  // },[selectedCustomer,groupTaskRefetch])



  return (
    <div className="p-2 flex justify-end gap-5 relative">
      <button type="button" className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5  dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700" onClick={handleClickMyTask}>{selection.trim() !== "my_task" ? "My Tasks" : "Close"}</button>
      <button type="button" className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5  dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700" onClick={handleClickGroupTask}>{selection.trim() !== "group_task" ? "Group Tasks" : "Close"}</button>
      {
        selection.trim() !== "" &&
        <div className="absolute border border-slate-300 rounded-lg shadow-md shadow-black/20 w-2/4 h-96 translate-y-1/2 -bottom-50 right-5 text-sm p-2 text-slate-500 flex flex-col ">
          <div className="h-full  overflow-y-auto">
            {data?.map(d => (
              <div key={d._id} className="py-1.5 text-xs hover:bg-blue-100 even:bg-slate-100 grid grid-cols-4 px-5">
                <div>{d.customer_info.fullName}</div>
                <div>{d.current_disposition.disposition ? d.current_disposition.disposition : "N/A" }</div>
                <div>
                  {dateAndTime(d.assigned_date)}
                </div>
                <div className="flex justify-end">
                <button className="text-white bg-green-800 hover:bg-green-900 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-xs py-1 px-2 dark:bg-green-800 dark:hover:bg-green-700 dark:focus:ring-gray-700 dark:border-green-700 cursor-pointer" onClick={()=> handleClickSelect(d)}>Select</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    </div>
  )
}

export default MyTaskSection