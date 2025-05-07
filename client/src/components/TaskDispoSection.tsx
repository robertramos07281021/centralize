import { useMutation, useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import Confirmation from "./Confirmation"
import SuccessToast from "./SuccessToast"
import Pagination from "./Pagination"
import Loading from "../pages/Loading"

interface Success {
  success: boolean,
  message: string
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

interface Member {
  _id: string
  name: string
  user_id: string
}


interface Group {
  _id: string
  name: string
  description?: string
  members?: Member[]
}

interface User {
  _id: string
  name: string
  user_id: string
}

type Assigned = Group | User

interface CustomerAccounts {
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

interface FindCustomerAccount {
  CustomerAccounts: CustomerAccounts[],
  totalCountCustomerAccounts: number
}

const FIND_CUSTOMER_ACCOUNTS = gql`
query findCustomerAccount($page: Int, $disposition: [String], $groupId: ID, $assigned:String,$limit: Int) {
  findCustomerAccount(page: $page, disposition: $disposition, groupId: $groupId, assigned:$assigned, limit:$limit ) {
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
  query selectAllCustomerAccount($disposition: [String], $groupId:ID, $assigned:String) {
    selectAllCustomerAccount(disposition: $disposition,groupId: $groupId, assigned: $assigned )
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
interface Member {
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



const TaskDispoSection = () => {
  const [groupDataNewObject, setGroupDataNewObject] = useState<{[key:string]:string}>({})
  const {selectedGroup, selectedAgent, page, tasker, taskFilter, selectedDisposition, limit} = useSelector((state:RootState)=> state.auth)
  const selected = selectedGroup ? groupDataNewObject[selectedGroup] : selectedAgent
  const {data:CustomerAccountsData, refetch:CADRefetch, loading} = useQuery<{findCustomerAccount:FindCustomerAccount;}>(FIND_CUSTOMER_ACCOUNTS,{variables: {disposition: selectedDisposition, page:page , groupId: selected, assigned: taskFilter, limit: limit}})
  const [handleCheckAll, setHandleCheckAll] = useState<boolean>(false)
  const [taskToAdd, setTaskToAdd] = useState<string[]>([])
  const {data:selectAllCustomerAccountData, refetch:SACARefetch} = useQuery<{selectAllCustomerAccount:string[]}>(SELECT_ALL_CUSTOMER_ACCOUNT,{variables: {disposition: selectedDisposition, groupId:selected, assigned: taskFilter }})
  const [required, setRequired] = useState<boolean>(false)
  const [confirm, setConfirm] = useState<boolean>(false)
  const {data:GroupData} = useQuery<{findGroup:Group[]}>(DEPT_GROUP)
  const [success, setSuccess] = useState<Success>({
    success:false,
    message: ""
  })
  
  useEffect(()=> {
    setRequired(false)
    CADRefetch()
    setTaskToAdd([])
    setHandleCheckAll(false)
    SACARefetch()
  },[selectedGroup,CADRefetch,tasker, taskFilter,SACARefetch, selectedAgent, selectedDisposition])

  useEffect(()=> {
    const newObject:{[key:string]:string}= {}
    if(GroupData){
      GroupData.findGroup.map((e)=> {
        newObject[e.name] = e._id
      })
    }
    setGroupDataNewObject(newObject)
  },[GroupData])

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
      setSuccess({
        success:true,
        message: "Task successfully removed"
      })
    },
  })

  const handleClickDeleteGroupTaskButton = ()=> {
    if(selectAllCustomerAccountData && selectAllCustomerAccountData?.selectAllCustomerAccount?.length < 1 ) {
      setRequired(true)
    } else {
    setConfirm(true)
    setModalProps({
      message: `Remove this task?`,
      toggle: "DELETE",
      yes: async() => {
        try {
          await deleteGroupTask({variables: {caIds: taskToAdd}})
        } catch (error) {
          console.log(error)
        }
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
      setSuccess({
        success:true,
        message: "Task successfully added"
      })
    },
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
          try {
            await addGroupTask({variables: {groupId: selected ,task: taskToAdd}})
          } catch (error) {
            console.log(error)
          }
        },
        no: () => {
          setConfirm(false)
        }
      })
    }
  }

  if(loading) return (<Loading/>)

  return (
    <>
      {
        success?.success &&
        <SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>
      }
      <div className="p-5 h-full flex flex-col justify-between">
        <div className="flex flex-col">
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
                  <button type="button" className="focus:outline-none text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs px-5 h-10 me-2 mb-2" onClick={handleAddTask}>Add Task</button> : 

                  <button type="button" className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-xs px-5 h-10 me-2 mb-2" onClick={handleClickDeleteGroupTaskButton}>Remove task</button>
                }
              </div>
            </div>
          }
      
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 ">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                  <th scope="col" className="px-6 py-3">
                    Customer Name
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Current Disposition
                  </th>
                  <th scope="col" className="px-6 py-3">
                    
                  </th>
                  <th scope="col" className="px-6 py-3">
                    assigned
                  </th>
                  {
                    (selectedGroup || selectedAgent) &&
                    <th scope="col" className="px-6 py-3 w-70 text-end">
                      Action
                    </th>

                  }
              </tr>
            </thead>
            <tbody>
              { 
                (selectedGroup || selectedAgent) &&
                <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-blue-100">
                  <th scope="row" className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white uppercase">
                      
                  </th>
                  <td className="px-6">
                      
                  </td>
                  <td className="px-6 ">
                      
                  </td>
                  <td className="px-6">
                  
                  </td>
                  <td className=" flex gap-2 ps-6 justify-end w-70"> 
                    <label>
                      <input type="checkbox" name="all" id="all" 
                      checked={handleCheckAll}
                      onChange={(e)=> handleSelectAllToAdd(e)} className={`${taskFilter === "assigned" && "accent-red-600"}`}/>
                      <span className="ps-2">Select All</span>
                    </label>
                  </td>
                </tr>
              }
              {
                CustomerAccountsData?.findCustomerAccount.CustomerAccounts.map((ca,index)=> ( 
                <tr key={ca._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-blue-100">
                  <th scope="row" className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white uppercase">
                      {ca.customer_info.fullName}
                  </th>
                  <td className="px-6">
                      {ca.currentDisposition ? (ca.dispoType.code === "PAID" ? `${ca.dispoType.code} (Not Settled)` : ca.dispoType.code) : "New Endorsed"}
                  </td>
                  <td className="px-6 ">
                      {index + 1}
                  </td>
                  <td className="px-6">
                    {ca.assigned?.name}
                  </td>
                  {
                    (selectedGroup || selectedAgent) &&
                    <td className="px-6 flex items-center py-4 justify-end">
                        <input type="checkbox" name={ca.customer_info.fullName} id={ca.customer_info.fullName} onChange={(e)=> handleCheckBox(ca._id, e)} checked={taskToAdd.includes(ca._id)} className={`${taskFilter === "assigned" && "accent-red-600" }`}/>
                    </td>
                  }
                </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        { Math.ceil(CustomerAccountsData?.findCustomerAccount?.totalCountCustomerAccounts ? CustomerAccountsData?.findCustomerAccount?.totalCountCustomerAccounts/limit : 1) > 1 &&
          <Pagination totalPage={CustomerAccountsData?.findCustomerAccount?.totalCountCustomerAccounts ? CustomerAccountsData?.findCustomerAccount?.totalCountCustomerAccounts : 1 }/>
        }
    
      </div>
      { confirm &&
      <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default TaskDispoSection