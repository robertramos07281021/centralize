import { useMutation, useQuery } from "@apollo/client"
import gql from "graphql-tag"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../../redux/store"
import Confirmation from "../../components/Confirmation"
import Pagination from "../../components/Pagination"
import Loading from "../Loading"
import { setPage, setServerError, setSuccess } from "../../redux/slices/authSlice"
import {debounce} from 'lodash'
import { useLocation } from "react-router-dom"

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


type DispoType = {
  _id: string
  name: string
  code: string
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
    max_dpd: number
    assigned: Assigned
    account_bucket: AccountBucket
    customer_info: CustomerInfo
    dispoType: DispoType
}

type FindCustomerAccount = {
  CustomerAccounts: CustomerAccounts[],
  totalCountCustomerAccounts: string[]
}

const FIND_CUSTOMER_ACCOUNTS = gql`
  query findCustomerAccount($query:QueryCustomerAccount) {
    findCustomerAccount(query: $query) {
      CustomerAccounts {
        _id
        max_dpd
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
        dispoType {
          _id
          name
          code
        }

      }
      totalCountCustomerAccounts
    }
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

type CADQueryValue = {
  disposition: string[],
  page: number,
  groupId: string,
  assigned: string,
  selectedBucket: string | null,
  dpd: number | null
  limit: number
}

type Props = {
  selectedBucket:string | null,
  dpd: number | null
}

const TaskDispoSection:React.FC<Props> = ({selectedBucket, dpd}) => {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const isTaskManager = location.pathname !== '/tl-task-manager'
  const {data:GroupData,refetch:groupRefetch} = useQuery<{findGroup:Group[]}>(DEPT_GROUP,{skip:isTaskManager})
  const {selectedGroup, selectedAgent, page, tasker, taskFilter, selectedDisposition, limit} = useSelector((state:RootState)=> state.auth)
  const groupDataNewObject:{[key:string]:string} = useMemo(()=> {
    const group = GroupData?.findGroup || []
    return Object.fromEntries(group.map(e=> [e.name, e._id]))
  },[GroupData])
  const selected = selectedGroup ? groupDataNewObject[selectedGroup] : selectedAgent
  
  const query:CADQueryValue = {
    disposition: selectedDisposition, 
    page:page , 
    groupId: selected, 
    assigned: taskFilter, 
    limit: limit, 
    selectedBucket,
    dpd
  }
  

  const {data:CustomerAccountsData, refetch:CADRefetch, loading} = useQuery<{findCustomerAccount:FindCustomerAccount}>(FIND_CUSTOMER_ACCOUNTS,{variables: {query: query},skip:isTaskManager })



  const debouncedSearch = useMemo(() => {
    return debounce(async(val: CADQueryValue) => {
      await CADRefetch({ query: val });
    }, 300);
  }, [CADRefetch]);

  useEffect(()=> {
    if(selectedBucket){
      debouncedSearch(query)
    }
  },[selectedDisposition,page,taskFilter,selectedBucket,dpd])

  const [handleCheckAll, setHandleCheckAll] = useState<boolean>(false)
  const [taskToAdd, setTaskToAdd] = useState<string[]>([])
  const [required, setRequired] = useState<boolean>(false)
  const [confirm, setConfirm] = useState<boolean>(false)
  const [taskManagerPage, setTaskManagerPage] = useState("1")

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      if(selectedBucket){
        await CADRefetch()
        await groupRefetch()
      }
    })
    return () => clearTimeout(timer)
  },[selectedBucket,CADRefetch,groupRefetch])

  useEffect(()=> {
    setTaskManagerPage(page.toString())
  },[page])

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      if(selectedBucket) {
     
        await CADRefetch()
        setRequired(false)
        setTaskToAdd([])
        setHandleCheckAll(false)
        setTaskManagerPage("1")
        dispatch(setPage(1))
      
      }
    })

    return () => clearTimeout(timer)
  },[selectedGroup ,tasker, taskFilter, selectedAgent, selectedDisposition,selectedBucket, dpd,CADRefetch])

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT" | "ADDED",
    yes: () => {},
    no: () => {}
  })

  const [deleteGroupTask] = useMutation(DELETE_GROUP_TASK, {
    onCompleted:async() => {
      try {
        const res = await CADRefetch()
        if(res.data) {
          dispatch(setSuccess({
            success:true,
            message: "Task successfully removed"
          }))
        }
      } catch (error) {
        dispatch(setServerError(true))
      }
    
      setConfirm(false)
      setTaskToAdd([])
      setHandleCheckAll(false)
      setRequired(false)
   
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

  const handleClickDeleteGroupTaskButton = useCallback(()=> {
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
  },[setRequired,setConfirm,setModalProps,deleteGroupTask,taskToAdd])

  const handleSelectAllToAdd = useCallback((e:React.ChangeEvent<HTMLInputElement>) => {
    const newArray = CustomerAccountsData?.findCustomerAccount.totalCountCustomerAccounts.map(e => e.toString())
    if(e.target.checked){
      setTaskToAdd(newArray ?? [])
      setHandleCheckAll(true)
    } else {
      setHandleCheckAll(false)
      setTaskToAdd([])
    }
  },[setTaskToAdd,CustomerAccountsData,setTaskToAdd])

  const handleCheckBox= useCallback((value:string, e: React.ChangeEvent<HTMLInputElement>) => {
    const check = e.target.checked ? [...taskToAdd, value] : taskToAdd.filter((d) => d !== value )
    setTaskToAdd(check)
  },[setTaskToAdd,taskToAdd])

  const [addGroupTask] = useMutation(ADD_GROUP_TASK,{
    onCompleted:async() => {
      await CADRefetch()
      setConfirm(false)
      setRequired(false)
      setTaskToAdd([])
      setHandleCheckAll(false)
      dispatch(setSuccess({
        success:true,
        message: "Task successfully added"
      }))
    },
    onError: (error) => {
      console.log(error)
      dispatch(setServerError(true))
    }
  })

  const handleAddTask = useCallback(() => {
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
  },[taskToAdd,setModalProps,setConfirm,setRequired])

  const pages = CustomerAccountsData?.findCustomerAccount?.totalCountCustomerAccounts ? Math.ceil(CustomerAccountsData?.findCustomerAccount?.totalCountCustomerAccounts.length/limit) : 1

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

        <div className="text-xs text-gray-700 uppercase bg-blue-100 dark:bg-gray-700 dark:text-gray-400 grid grid-cols-6 font-medium mt-2">
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
            DPD
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
            CustomerAccountsData?.findCustomerAccount?.CustomerAccounts.map((ca)=> ( 
            <div key={ca._id} className="bg-white border-b border-gray-200 hover:bg-slate-100 grid grid-cols-6 py-2 items-center text-xs">
              <div className="font-medium text-gray-900 whitespace-nowrap dark:text-white uppercase">
                  {ca.customer_info.fullName}
              </div>
              <div className="px-6">
                  {ca.dispoType ? (ca.dispoType.code === "PAID" ? `${ca.dispoType.code} (Partial)` : ca.dispoType.code) : "New Endorsed"}
              </div>
              <div className="px-6 ">
                  {ca.account_bucket.name}
              </div>
              <div className="px-6 ">
                  {ca.max_dpd}
              </div>
              <div className="px-6 capitalize">
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