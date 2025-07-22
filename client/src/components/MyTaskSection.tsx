import { useMutation, useQuery, useSubscription, useApolloClient } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../redux/store"
import { dateAndTime } from "../middleware/dateAndTime"
import { setSelectedCustomer, setServerError } from "../redux/slices/authSlice"
import { CurrentDispo } from "../middleware/types"

type outStandingDetails = {
  principal_os: number
  interest_os: number
  admin_fee_os: number
  txn_fee_os: number
  late_charge_os: number
  dst_fee_os: number
  total_os: number
  waive_fee_os: number
}

type grassDetails = {
  grass_region: string
  vendor_endorsement: string
  grass_date: string
}

type AccountBucket = {
  name: string
  dept: string
  _id:string
}

type CustomerRegistered = {
  fullName:string
  dob:string
  gender:string
  contact_no:string[]
  emails:string[]
  addresses:string[]
  isRPC: boolean
  _id:string
}

type CurrentDisposition = {
  disposition: string
}

type EmergencyContact = {
  name: string
  mobile: string
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
  month_pd: number
  isRPCToday: boolean
  assigned_date: string
  out_standing_details: outStandingDetails
  grass_details: grassDetails
  account_bucket: AccountBucket
  dispo_history: CurrentDispo[]
  emergency_contact: EmergencyContact
  current_disposition: CurrentDisposition
  customer_info: CustomerRegistered
}

type GroupTask = {
  task: CustomerData[] | [];
  _id: string;
}

const MY_TASKS = gql`
  query myTasks {
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
      }
      out_standing_details {
        principal_os
        interest_os
        admin_fee_os
        txn_fee_os
        late_charge_os
        dst_fee_os
        total_os
        waive_fee_os
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
        _id
      }
      customer_info {
        fullName
        dob
        gender
        contact_no
        emails
        addresses
        isRPC
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
        }
        out_standing_details {
          principal_os
          interest_os
          admin_fee_os
          txn_fee_os
          late_charge_os
          dst_fee_os
          total_os
          waive_fee_os
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
          _id
        }
        customer_info {
          fullName
          dob
          gender
          contact_no
          emails
          addresses
          isRPC
          _id
        }
      }
    }
  }
`
type SubSuccess = {
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

const NEW_DISPO = gql`
  subscription Subscription {
    dispositionUpdated {
      message
      members
    }
  }
`

const GROUP_CHANGING  = gql`
  subscription Subscription {
    groupChanging {
      message
      members
    }
  }
`

const TASK_CHANGING  = gql`
  subscription Subscription {
    taskChanging {
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

const DESELECT_TASK = gql`
  mutation DeselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`

const MyTaskSection = () => {
  const {userLogged, selectedCustomer} = useSelector((state:RootState)=> state.auth)
  const dispatch = useAppDispatch()
  const client = useApolloClient()
  const {data:myTasksData} = useQuery<{myTasks:CustomerData[] | []}>(MY_TASKS,    
    {
      skip: true, 
      context: { queryDeduplication: false }
    }
  )


  const {data:groupTaskData, refetch:groupTaskRefetch} = useQuery<{groupTask:GroupTask}>(GROUP_TASKS, {
    skip: true,
    context: { queryDeduplication: false }
  })
  
  useSubscription<{somethingChanged:SubSuccess}>(SOMETHING_NEW_IN_TASK,{
    onData: ({data})=> {
      if(data) {
        if(data.data?.somethingChanged?.message === "TASK_SELECTION" && data.data?.somethingChanged?.members?.toString().includes(userLogged._id)) {
          client.refetchQueries({
            include: ['myTasks']
          })
        }
      }
    }
  });

  useSubscription<{taskChanging:SubSuccess}>(TASK_CHANGING,{
    onData: ({data})=> {
      if(data) {
        if(data.data?.taskChanging?.message === "TASK_CHANGING" && (data.data?.taskChanging?.members?.toString().includes(userLogged._id)||data.data?.taskChanging?.members?.toString().includes(userLogged.group))) {
          client.refetchQueries({
            include: ['myTasks','groupTask']
          })
        }
      }
    }
  });

  useSubscription<{dispositionUpdated:SubSuccess}>(NEW_DISPO,{
    onData: ({data})=> {
      if(data){
         if(data.data?.dispositionUpdated?.message === "NEW_DISPOSITION" && data.data?.dispositionUpdated?.members?.toString().includes(userLogged._id)) {
          client.refetchQueries({
            include: ['myTasks','groupTask']
          })
        }
      }
    }
  })

  useSubscription<{groupChanging:SubSuccess}>(GROUP_CHANGING,{
    onData: ({data})=> {
      if(data){
        if(data.data?.groupChanging?.message === "GROUP_CHANGING" &&  data.data?.groupChanging?.members?.toString().includes(userLogged._id)) {
          client.refetchQueries({
            include: ['groupTask']
          })
        }
      }
    }
  })
  

  const [data, setData] = useState<CustomerData[] | null>([])
  const [selection, setSelection] = useState<string>("")

  const groupLength = groupTaskData?.groupTask.task.filter(e=> userLogged.buckets.toString().includes(e.account_bucket._id)).length || null
  const taskLength = myTasksData?.myTasks.filter(e=> userLogged.buckets.toString().includes(e.account_bucket._id)).length

  useEffect(()=> {
    if(selection.trim()==="my_task") {
      setData(myTasksData?.myTasks ? myTasksData?.myTasks.filter(e=> userLogged.buckets.toString().includes(e.account_bucket._id)) : null )
    } else {
      setData(groupTaskData?.groupTask?.task ? groupTaskData?.groupTask.task.filter(e=> userLogged.buckets.toString().includes(e.account_bucket._id)) : null)
    }
  },[selection,myTasksData,groupTaskData,userLogged])

  const [deselectTask] = useMutation(DESELECT_TASK, {
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })


  useEffect(()=> {
    setSelection("")
  },[selectedCustomer._id])

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
      setSelection("")
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })
  
  const handleClickSelect = async(data:CustomerData) => {
    if(selectedCustomer._id) {
      await deselectTask({variables: {id: selectedCustomer._id }})  
    }
    const res = await selectTask({variables: {id: data._id}})
    if(res.data.selectTask.success) {
      dispatch(setSelectedCustomer({...data, isRPCToday: false}))
    }
  }

  const handleClickGroupTask = () => {
    if(selection && selection.trim() !== "my_task"){
      setSelection("")
    } else {
      setSelection("group_task")
    } 
  }

  return (
    <div className={`mt-3 flex justify-end gap-5 relative`}>
      {
        taskLength !== undefined && taskLength > 0 &&
        <div className="flex flex-col gap-2 justify-between w-1/15">
          <p className="lg:text-[0.6em] 2xl:text-xs font-bold flex justify-between"><span>Task:</span><span>{taskLength?.toLocaleString()}</span></p>
          <button type="button" className={`text-white ${selection.trim() !== "my_task" ? "bg-red-500 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-900"}  focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 `} onClick={handleClickMyTask}>{selection.trim() !== "my_task" ? "My Tasks" : "Close"}</button>
        </div>
      }
      {
        (groupLength && groupLength > 0) &&
        <div className="flex flex-col gap-2 justify-between w-1/15">
          <p className="lg:text-[0.6em] 2xl:text-xs font-bold flex justify-between"><span>Task:</span> <span>{groupLength?.toLocaleString()}</span></p>
          <button type="button" className={`${selection.trim() !== "group_task" ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-900"} text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg lg:text-[0.6em] 2xl:text-xs px-5 py-2.5`} onClick={handleClickGroupTask}>{selection.trim() !== "group_task" ? "Group Tasks" : "Close"}</button>
        </div>
      }
      {
        selection.trim() !== "" &&
        <div className="absolute border border-slate-300 rounded-lg shadow-md shadow-black/20 w-2/4 h-96 translate-y-1/2 -bottom-50 right-5 p-2 text-slate-500 flex flex-col bg-white z-50">
          <div className="py-1.5 2xl:text-xs lg:text-[0.6em] bg-slate-200 grid grid-cols-4 px-5 items-center">
            <div className="px-2 text-nowrap truncate">Customer Name</div>
            <div >Disposition</div>
            <div >Date Assigned</div>
            <div className="text-end pr-2">Action</div>
          </div>
          <div className="h-full overflow-y-auto">
            {data?.map(d => (
              <div key={d._id} className="py-1.5 2xl:text-xs lg:text-[0.6em] hover:bg-blue-100 even:bg-slate-100 grid grid-cols-4 px-5 items-center">
                <div className="px-2 text-nowrap truncate">{d.customer_info.fullName}</div>
                <div>{d.current_disposition.disposition ? d.current_disposition.disposition : "N/A" }</div>
                <div>
                  {dateAndTime(d.assigned_date)}
                </div>
                <div className="flex justify-end">
                <button className="text-white bg-green-800 hover:bg-green-900 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-lg 2xl:text-xs lg:text-[0.6em] py-1 px-2 dark:bg-green-800 dark:hover:bg-green-700 dark:focus:ring-gray-700 dark:border-green-700 cursor-pointer" onClick={()=> handleClickSelect(d)}>Select</button>
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