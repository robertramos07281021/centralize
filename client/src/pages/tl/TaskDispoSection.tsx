import { useMutation, useQuery } from "@apollo/client"
import gql from "graphql-tag"
import React, { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../../redux/store"
import Confirmation from "../../components/Confirmation"
import Pagination from "../../components/Pagination"
import Loading from "../Loading"
import { setPage, setServerError, setSuccess } from "../../redux/slices/authSlice"

type OutStandingDetails = {
  principal_os:number
  interest_os: number
  admin_fee_os: number
  txn_fee_os: number
  late_charge_os: number
  dst_fee_os: number
  total_os: number
}

type GrassDetails = {
  grass_region: string
  vendor_endorsement: string
  grass_date: string
}

type AccountBucket = {
  name: string
  dept:string 
}

type CustomerInfo = {
  fullName: string
  dob: string
  gender: string
  contact_no: string
  emails: string
  addresses: string
  _id: string
}

type CurrentDisposition = {
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

type DispoType = {
  _id: string
  name: string
  code: string
}

type Disposition_user = {
  _id: string
  name: string
  user_id: string
}



type Group = {
  _id: string
  name: string
  description?: string
  members?: Member[]
}

type User = {
  _id: string
  name: string
  user_id: string
}

type Assigned = Group | User

type CustomerAccounts = {
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

type FindCustomerAccount = {
  CustomerAccounts: CustomerAccounts[],
  totalCountCustomerAccounts: number
}

const FIND_CUSTOMER_ACCOUNTS = gql`
query findCustomerAccount($page: Int, $disposition: [String], $groupId: ID, $assigned:String,$limit: Int, $selectedBucket: ID) {
  findCustomerAccount(page: $page, disposition: $disposition, groupId: $groupId, assigned:$assigned, limit:$limit ,selectedBucket:$selectedBucket) {
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
        ... on User {
          name
          user_id
        } 
        ... on Group {
          _id
          name
          description
          members {
            _id
            name
            user_id
          }
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
const SELECT_ALL_CUSTOMER_ACCOUNT = gql`
  query selectAllCustomerAccount($disposition: [String], $groupId:ID, $assigned:String, $selectedBucket:ID) {
    selectAllCustomerAccount(disposition: $disposition,groupId: $groupId, assigned: $assigned,selectedBucket: $selectedBucket )
  }
`
const ADD_GROUP_TASK = gql`
  mutation Mutation($groupId: ID!, $task: [ID]) {
  addGroupTask(groupId: $groupId, task: $task) {
    message
    success
  }
}
`
type Member = {
  _id: string
  name: string
  user_id: string
}

const DEPT_GROUP = gql`
  query Query {
    findGroup {
      _id
      name
      description
      members {
        _id
        name
        user_id
      }
    }
  }
`
const DELETE_GROUP_TASK = gql`
  mutation Mutation($caIds: [ID]) {
    deleteGroupTask(caIds: $caIds) {
      message
      success
    }
  }
`

type Props = {
  selectedBucket:string
}

const TaskDispoSection:React.FC<Props> = ({selectedBucket}) => {
  const dispatch = useAppDispatch()
  const {data:GroupData} = useQuery<{findGroup:Group[]}>(DEPT_GROUP)
  const {selectedGroup, selectedAgent, page, tasker, taskFilter, selectedDisposition, limit} = useSelector((state:RootState)=> state.auth)

  const groupDataNewObject:{[key:string]:string} = useMemo(()=> {
    const group = GroupData?.findGroup || []
    return Object.fromEntries(group.map(e=> [e.name, e._id]))
  },[GroupData])
  const selected = selectedGroup ? groupDataNewObject[selectedGroup] : selectedAgent

  const {data:CustomerAccountsData, refetch:CADRefetch, loading, error:fcaError} = useQuery<{findCustomerAccount:FindCustomerAccount;}>(FIND_CUSTOMER_ACCOUNTS,{variables: {disposition: selectedDisposition, page:page , groupId: selected, assigned: taskFilter, limit: limit, selectedBucket: selectedBucket}})
  const [handleCheckAll, setHandleCheckAll] = useState<boolean>(false)
  const [taskToAdd, setTaskToAdd] = useState<string[]>([])
  const {data:selectAllCustomerAccountData, refetch:SACARefetch,error:sacaError} = useQuery<{selectAllCustomerAccount:string[]}>(SELECT_ALL_CUSTOMER_ACCOUNT,{variables: {disposition: selectedDisposition, groupId:selected, assigned: taskFilter, selectedBucket}})

  const [required, setRequired] = useState<boolean>(false)
  const [confirm, setConfirm] = useState<boolean>(false)

  const [taskManagerPage, setTaskManagerPage] = useState("1")
  useEffect(()=> {
    if(sacaError || sacaError) {
      dispatch(setServerError(true))
    }
  },[dispatch, fcaError, sacaError])


  useEffect(()=> {
    setTaskManagerPage(page.toString())
  },[page])

  useEffect(()=> {
    CADRefetch()
    SACARefetch()
  },[selectedBucket,SACARefetch,CADRefetch])

  useEffect(()=> {
    setRequired(false)
    CADRefetch()
    setTaskToAdd([])
    setHandleCheckAll(false)
    SACARefetch()
  },[selectedGroup,CADRefetch,tasker, taskFilter,SACARefetch, selectedAgent, selectedDisposition])

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT" | "ADDED",
    yes: () => {},
    no: () => {}
  })

  const [deleteGroupTask] = useMutation(DELETE_GROUP_TASK, {
    onCompleted:() => {
      CADRefetch()
      SACARefetch()
      setConfirm(false)
      setTaskToAdd([])
      setHandleCheckAll(false)
      setRequired(false)
      dispatch(setSuccess({
        success:true,
        message: "Task successfully removed"
      }))
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

  const handleClickDeleteGroupTaskButton = ()=> {
    if(taskToAdd.length === 0) {
      setRequired(true)
    } else {
      setConfirm(true)
      setModalProps({
        message: `Remove this task?`,
        toggle: "DELETE",
        yes: async() => {
          await deleteGroupTask({variables: {caIds: taskToAdd}})
        },
        no: () => {
          setConfirm(false)
        }
      })
    }
  }

  const handleSelectAllToAdd = (e:React.ChangeEvent<HTMLInputElement>) => {
    const newArray = selectAllCustomerAccountData?.selectAllCustomerAccount.map(e => e.toString())
    if(e.target.checked){
      setTaskToAdd(newArray ?? [])
      setHandleCheckAll(true)
    } else {
      setHandleCheckAll(false)
      setTaskToAdd([])
    }
  }

  const handleCheckBox= (value:string, e: React.ChangeEvent<HTMLInputElement>) => {
    const check = e.target.checked ? [...taskToAdd, value] : taskToAdd.filter((d) => d !== value )
    setTaskToAdd(check)
  }

  const [addGroupTask] = useMutation(ADD_GROUP_TASK,{
    onCompleted:() => {
      CADRefetch()
      SACARefetch()
      setConfirm(false)
      setRequired(false)
      setTaskToAdd([])
      setHandleCheckAll(false)
      dispatch(setSuccess({
        success:true,
        message: "Task successfully added"
      }))
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

  const handleAddTask = () => {
    if(taskToAdd.length === 0) {
      setRequired(true)
    } else {
      setRequired(false)
      setConfirm(true)
      setModalProps({
        message: `You assigning the task?`,
        toggle: "CREATE",
        yes: async() => {
          await addGroupTask({variables: {groupId: selected ,task: taskToAdd}})
        },
        no: () => {
          setConfirm(false)
        }
      })
    }
  }

  const pages = CustomerAccountsData?.findCustomerAccount?.totalCountCustomerAccounts ? Math.ceil(CustomerAccountsData?.findCustomerAccount?.totalCountCustomerAccounts/limit) : 1

  const valuePage = parseInt(taskManagerPage) > pages ? pages.toString() : taskManagerPage 

  if(loading) return (<Loading/>)

  return (
    <>
      <div className="h-full w-full flex flex-col p-2 overflow-hidden">
        {
          (selectedGroup || selectedAgent) &&
          <div className={`flex ${required ? "justify-between" : "justify-end"}  items-center`}>
            { required &&
              <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
              <span className="font-medium">No Item Selected!</span> Please add one or more task.
            </div>
            }
            <div className="flex gap-2">
              { taskFilter !== "assigned" ? 
                <button type="button" className="focus:outline-none text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs px-5 h-10 me-2 " onClick={handleAddTask}>Add Task</button> : 

                <button type="button" className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-xs px-5 h-10 me-2" onClick={handleClickDeleteGroupTaskButton}>Remove task</button>
              }
            </div>
          </div>
        }

        <div className="text-xs text-gray-700 uppercase bg-blue-100 dark:bg-gray-700 dark:text-gray-400 grid grid-cols-5 font-medium mt-2">
          <div  className="px-6 py-3">
            Customer Name
          </div>
          <div className="px-6 py-3">
            Current Disposition
          </div>
          <div  className="px-6 py-3">
            Bucket
          </div>
          <div  className="px-6 py-3">
            Assigned
          </div>
          <div className="px-6 py-3 text-end">
            Action
          </div>
        </div>
        <div className=" w-full h-full text-gray-500 flex flex-col overflow-y-auto relative mb-2">
          { 
            (selectedGroup || selectedAgent) &&
            <div className="bg-white border-b  border-gray-200 hover:bg-blue-100 flex py-2 items-center text-xs justify-end sticky top-0">
              <label className=" flex gap-2 justify-end px-2 w-full">
                <input type="checkbox" name="all" id="all" 
                checked={handleCheckAll}
                onChange={(e)=> handleSelectAllToAdd(e)} className={`${taskFilter === "assigned" && "accent-red-600"}`}/>
                <span className="ps-2">Select All</span>
              </label>
            </div>
          }
          {
            CustomerAccountsData?.findCustomerAccount.CustomerAccounts.map((ca)=> ( 
            <div key={ca._id} className="bg-white border-b border-gray-200 hover:bg-slate-100 grid grid-cols-5 py-2 items-center text-xs">
              <div className="font-medium text-gray-900 whitespace-nowrap dark:text-white uppercase">
                  {ca.customer_info.fullName}
              </div>
              <div className="px-6">
                  {ca.currentDisposition ? (ca.dispoType.code === "PAID" ? `${ca.dispoType.code} (Partial)` : ca.dispoType.code) : "New Endorsed"}
              </div>
              <div className="px-6 ">
                  {ca.account_bucket.name}
              </div>
              <div className="px-6">
                {ca.assigned?.name}
              </div>
              <div className="px-6 flex items-center justify-end">
                {
                  (selectedGroup || selectedAgent) &&
                  <input type="checkbox" name={ca.customer_info.fullName} id={ca.customer_info.fullName} onChange={(e)=> handleCheckBox(ca._id, e)} checked={taskToAdd.includes(ca._id)} className={`${taskFilter === "assigned" && "accent-red-600" }`}/>
                }
              </div>
            </div>
            ))
          }
        </div>
        <Pagination value={valuePage} onChangeValue={(e)=>setTaskManagerPage(e)} onKeyDownValue={(e)=> dispatch(setPage(e))} totalPage={pages} currentPage={page}/>
      </div>
      { confirm &&
      <Confirmation {...modalProps}/>
      }
      </>

  )
}

export default TaskDispoSection