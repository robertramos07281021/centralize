
import { gql, useMutation, useQuery } from "@apollo/client"
import { useEffect, useRef, useState } from "react"
import { Success, Users } from "../../middleware/types"
import Confirmation from "../../components/Confirmation"
import { useLocation, useNavigate } from "react-router-dom"
import SuccessToast from "../../components/SuccessToast"
import { MdKeyboardArrowDown } from "react-icons/md";
import UserOptionSettings from "./UserOptionSettings"
import { useAppDispatch } from "../../redux/store"
import { setServerError } from "../../redux/slices/authSlice"


interface modalProps {
  state: Users
}

interface Bucket {
  name: string
  dept: string
  id: string
}

interface Branch {
  id:string
  name: string
}

interface Dept {
  id:string
  name:string
  branch:string
  aom:string
}

interface Bucket {
  id:string
  name: string
}

interface DeptBucket {
  dept: string
  buckets: Bucket[]
}

const DEPT_BUCKET_QUERY = gql`
   query getBuckets($dept: [ID]) {
    getBuckets(dept: $dept) {
      dept
      buckets {
        id
        name
      }
    }
  }
`

const BRANCH_QUERY = gql`
  query branchQuery {
    getBranches {
      id
      name
    }
  } 
`

const BRANCH_DEPARTMENT_QUERY = gql`
  query getBranchDept($branch: String) {
    getBranchDept(branch: $branch){
      id
      name
    }
  }
`

const RESET_PASSWORD = gql`
  mutation resetPassword($id:ID!) {
    resetPassword(id:$id) {
      success
      message
      user {
        _id
        name
        username
        type
        departments
        branch
        change_password
        buckets
        isLock
        account_type
        active
        _id
        user_id
      }
    }
  }
`

const UPDATE_USER = gql`
  mutation updateUser( $name:String!, $type: String!, $branch:ID!, $departments: [ID], $buckets:[ID], $id: ID!, $account_type: String) {
    updateUser( name:$name, type:$type, branch:$branch, departments:$departments, buckets:$buckets, id:$id, account_type:$account_type){
      success
      message
      user {
        _id
        name
        username
        type
        departments
        branch
        active
        account_type
        isLock
        change_password
        buckets
        _id
        user_id
      }
    }
  }
`

const STATUS_UPDATE = gql`
  mutation Mutation($id:ID!) {
    updateActiveStatus(id:$id) {
      success
      message
      user {
        _id
        name
        username
        type
        departments
        branch
        active
        account_type
        isLock
        change_password
        buckets
        _id
        user_id
      }
    }
  }
`


const UNLOCK_USER = gql`
  mutation unlockUser($id: ID!) {
    unlockUser(id: $id) {
      message
      success
      user {
        _id
        name
        username
        type
        departments
        branch
        change_password
        buckets
        isOnline
        active
        isLock
        createdAt
        user_id
        group
        account_type
      }
    }
  }
`

const UpdateUserForm:React.FC<modalProps> = ({state}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const validForCampaignAndBucket = ["AGENT", "TL", "MIS"]
  const [branchObject, setBranchObject] = useState<{[key:string]:string}>({}) // id to name
  const [objectBranch, setObjectbranch] = useState<{[key:string]:string}>({})// name to id
  const {data:branchesData} = useQuery<{getBranches:Branch[]}>(BRANCH_QUERY)
  const [isUpdate, setIsUpdate] = useState(false)
  const [required, setRequired] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [dept, setDept] = useState<{[key:string]:string}>({})
  const [bucketObject,setBucketObject] = useState<{[key:string]:string}>({})
  const [selectionDept, setSelectionDept] = useState<boolean>(false)
  const [selectionBucket,setSelectionBucket] = useState<boolean>(false)
  type UserType = "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION" ;

  const isValidUserType = (value: string): value is UserType => {
    return ["AGENT", "ADMIN", "AOM", "TL", "CEO", "OPERATION"].includes(value);
  };
  
  const safeType = isValidUserType(state?.type) ? state.type : "AGENT";
  
  const [success, setSuccess] = useState<Success | null>({
    success: false,
    message: ""
  })

  const [check, setCheck] = useState<boolean>(state?.active)

  const [data, setData] = useState<{
    username: string;
    type: UserType;
    name: string;
    branch: string;
    departments: string[];
    buckets: string[];
    account_type: string
  }>({
    username: state?.username,
    type: safeType,
    name: state?.name,
    branch: state?.branch,
    departments: state?.departments,
    buckets: state?.buckets || [],
    account_type: state?.account_type
  })
  
  const {data:branchDeptData, refetch:branchDeptRefetch} = useQuery<{getBranchDept:Dept[]}>(
    BRANCH_DEPARTMENT_QUERY, 
    {
      variables: {branch: branchObject[data.branch]},
    },
  )

  const {data:deptBucket} = useQuery<{getBuckets:DeptBucket[]}>(DEPT_BUCKET_QUERY,{
    variables: {dept: data.departments},
  })

  useEffect(()=> {
    if(branchDeptData) {
      const newObject:{[key:string]:string} = {}
      branchDeptData.getBranchDept.map((d)=> {
        newObject[d.name.toString()] = d.id
      })
      setDept(newObject)
    }
    if(branchesData) {
      const newObject:{[key:string]:string} = {}
      const objectNew:{[key:string]:string} = {}
      
      branchesData.getBranches.map((b)=> {
        newObject[b.id] = b.name
        objectNew[b.name] = b.id
      })
      setObjectbranch(objectNew)
      setBranchObject(newObject)
    }

    if(deptBucket){
      const newObject:{[key:string]:string} = {}
      deptBucket.getBuckets.map(e=> {
        e.buckets.map((b)=> 
          newObject[b.name] = b.id
        )
      })
      setBucketObject(newObject)
    }


  },[branchDeptData,branchesData, deptBucket])


  // ================ mutations ===================================
  const [updateUser] = useMutation(UPDATE_USER, {
    onCompleted: (res) => {
      navigate(location.pathname, { state: { ...res.updateUser.user, newKey: "newKey" } });
      setSuccess({
        success: res.updateUser.success,
        message: res.updateUser.message
      })
      
      setIsUpdate(false)
    },
    onError: (error) => {
      console.log(error)
      dispatch(setServerError(true))
    }
  })
  
  const [resetPassword] = useMutation(RESET_PASSWORD, {
    onCompleted: (res) => {
      navigate(location.pathname, { state: { ...state, newKey: "newKey" } });
      setSuccess({
        success: res.resetPassword.success,
        message: res.resetPassword.message
      })
    },
    onError:() => {
      dispatch(setServerError(true))
    }
  })

  const [updateActiveStatus] = useMutation(STATUS_UPDATE,{
    onCompleted: (res) => {
      navigate(location.pathname, { state: { ...res.updateActiveStatus.user, newKey: "newKey" } });
      setSuccess({
        success: res.updateActiveStatus.success,
        message: res.updateActiveStatus.message
      })
    },
    onError:  ()=> {
      dispatch(setServerError(true))
    }
  })


  const [unlockUser] = useMutation(UNLOCK_USER, {
    onCompleted: (res) => {
      navigate(location.pathname, {state: {...res.unlockUser.user, newKey: 'newKey'}})
      setSuccess({
        success: res.unlockUser.success,
        message: res.unlockUser.message
      })
    },
    onError:() => {
      dispatch(setServerError(true))
    }
  })

//  ====================================================================== 

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "UNLOCK",
    yes: () => {},
    no: () => {}
  })

  const handleCancel = () => {
    setIsUpdate(false)
    setRequired(false)
    setData({    
      username: state?.username,
      type: safeType,
      name: state?.name,
      branch: state?.branch,
      departments: state?.departments,
      buckets: state?.buckets,
      account_type: state.account_type
    })
  }

  const submitValue: Record<string, () => Promise<void>>  = {
    UPDATE: async() => {
      if(data.type === "AGENT") {
        if(!data.branch || !data.name || !data.departments || !data.buckets) {
          setRequired(true)
          return
        } else {
          setRequired(false)
        }
      }
      setConfirm(true)
      setModalProps({
        no:()=> setConfirm(false),
        yes:async() => { 
          await updateUser({variables: {...data, id: state._id}})
          setConfirm(false)
        },
        message: "Are you sure you want to update this user?",
        toggle: "UPDATE"
      })
    },
    RESET: async() => {
      setConfirm(true)
      setModalProps({
        no:()=> setConfirm(false),
        yes:async() => { 
          await resetPassword({variables: {id: state._id}})
          setConfirm(false)
        },
        message: "Are you sure you want to reset password of this user?",
        toggle: "UPDATE"
      })
    },
    STATUS: async() => {
      setConfirm(true)
      setModalProps({
        no:()=> {setConfirm(false); setCheck(state.active)},
        yes:async() => { 
          await updateActiveStatus({variables: {id: state._id}})
          setConfirm(false)
        },
        message: `Are you sure you want to ${state.active ? "Deactivate" : "Activate"} of this user?`,
        toggle: "UPDATE"
      })
    },
    UNLOCK: async()=> {
      setConfirm(true)
      setModalProps({
        no:()=> {setConfirm(false); setCheck(state.active)},
        yes:async() => { 
          await unlockUser({variables: {id: state._id}})
          setConfirm(false)
        },
        message: `Are you sure you want to unlock this user?`,
        toggle: "UNLOCK"
      })
    }
  }

  const handleSubmit = (action: "UPDATE" | "RESET" | "STATUS" | "UNLOCK",status:boolean) => {
    submitValue[action]?.()
    if(action === "STATUS") {
      setCheck(status)
    }
  }
  const handleCheckedDept = (e:React.ChangeEvent<HTMLInputElement>, value: string)=> {
    const check = e.target.checked ? [...data.departments, dept[value]] : data.departments.filter((d) => d !== dept[value] )
    setData({...data, departments: check})
  }
  const handleCheckedBucket = (e:React.ChangeEvent<HTMLInputElement>, value: string)=> {
    const check = e.target.checked ? [...data.buckets, bucketObject[value]] : data.buckets.filter((d) => d !== bucketObject[value] )
    setData({...data, buckets: check})
  }
  
  useEffect(()=> {
    branchDeptRefetch()
  },[data.branch])
  
  const campaignDiv = useRef<HTMLDivElement | null>(null)
  const bucketDiv = useRef<HTMLDivElement | null>(null)


  return (
    <>
      {
        success?.success &&
        (<SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>)
      }
      <div className="px-5 w-full grid grid-cols-2 gap-10 col-span-2" onMouseDown={(e)=> 
        {
          if(!campaignDiv.current?.contains(e.target as Node)) {
              setSelectionDept(false)
          }
          if(!bucketDiv.current?.contains(e.target as Node)) {
            setSelectionBucket(false)
          }
      }}>
        <div className=" w-full flex flex-col gap-2 py-5">
          {
            required && 
          <div className="text-center text-xs text-red-500">All fields are required.</div>
          }
          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Type</p>
            <select
              id="type"
              name="type"
              value={data?.type}
              disabled={!isUpdate}
              onChange={(e) => {
                const newType = e.target.value as UserType;
                setData({ ...data, type: newType });
              }}
              className={`bg-slate-50 border-slate-300 border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
              >
              <option value="">Choose a bucket</option>
              <option value="AGENT">AGENT</option>
              <option value="TL">TL</option>
              <option value="AOM">AOM</option>
              <option value="MIS">MIS</option>
              <option value="CEO">CEO</option>
              <option value="ADMIN">ADMIN</option>
              <option value="OPERATION">OPERATION</option>
            </select>
          </label>

          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Username</p>
            <input 
              type="text" 
              name="username" 
              id="username" 
              autoComplete="username"
              value={data?.username}
              disabled
              className={`${data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"}  border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}  
              />
          </label>

          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Name</p>
            <input 
              type="text" 
              id="name" 
              name="name" 
              autoComplete="name"
              value={data?.name}
              onChange={(e)=> setData({...data, name: e.target.value})}
              disabled={!isUpdate}
              className={`${data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"}  border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full in-disabled:bg-gray-200`}  
              />
          </label>
    
          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Account Type</p>
            <select
              id="branch"
              name="branch"
              value={data.account_type || ""}
              onChange={(e)=> setData({...data, account_type: e.target.value})}
              disabled={!isUpdate}
              className={`${data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"} border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            >
              <option value="">Choose account type</option>
              <option value="caller">Caller</option>
              <option value="field">Field</option>
              <option value="skipper">Skipper</option>
           
            </select>
          </label>
          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Branch</p>
            <select
              id="branch"
              name="branch"
              value={branchObject[data.branch]}
              onChange={(e)=> {setData({...data, branch: objectBranch[e.target.value], departments: [], buckets: []})}}
              disabled={!isUpdate}
              className={`${data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"} border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            >
              <option value="">Choose a branch</option>
              {
                branchesData?.getBranches.map((branch)=> 
                  <option key={branch.id} value={branch.name}>{branch.name.toUpperCase()}</option>
                )
              }
            </select>
          </label>
        
          <div className="w-full relative" ref={campaignDiv}>
            <p className="w-full text-base font-medium text-slate-500">Campaign</p>
            <div className={`${data.departments.length === 0 && "bg-gray-200"} w-full text-sm border rounded-lg flex justify-between ${selectionDept && data.departments.length > 0 ? "border-blue-500" : "border-slate-300"}`}>
              <div 
              className="w-full p-2.5 text-nowrap truncate cursor-default" 
              title={data.departments.map(deptId => Object.entries(dept).find(([, val]) => val.toString() === deptId)?.[0]).join(', ').replace(/_/g, " ")} 
              onClick={()=> {if(validForCampaignAndBucket.toString().includes(data.type) && isUpdate) {setSelectionDept(!selectionDept); setSelectionBucket(false)} }}
              >
                {
                  data.departments.length < 1 ? "Select Department" : data.departments.map(deptId => Object.entries(dept).find(([, val]) => val.toString() === deptId)?.[0]).join(', ').replace(/_/g, " ")
                }
              </div>
              <MdKeyboardArrowDown 
              className="text-lg absolute right-0 top-9" 
              onClick={()=> {if(validForCampaignAndBucket.toString().includes(data.type) && isUpdate) {setSelectionDept(!selectionDept); setSelectionBucket(false)}}}
              />
            </div>
            {
              (selectionDept && data.branch ) &&
              <div className="w-full absolute left-0 top-16.5 bg-white border-slate-300 p-1.5 max-h-70 overflow-y-auto border z-40">
                {
                  branchDeptData?.getBranchDept.map((e)=> {
                    return e.name !== "ADMIN" &&(
                      <label key={e.id} className="flex gap-2">
                        <input 
                        type="checkbox"
                        name={e.name} 
                        id={e.name} 
                        value={e.name}
                        onChange={(e)=> handleCheckedDept(e, e.target.value)} 
                        checked={data.departments.toString().includes(e.id)} />
                        <span>{e.name.replace(/_/g," ")}</span>
                      </label>
                    )
                  })
                }
              </div>
            }
          </div>
          <div className="w-full relative" ref={bucketDiv}>
            <p className="w-full text-base font-medium text-slate-500">Bucket</p>
            <div className={`${data.departments.length === 0 && "bg-gray-200"} w-full text-sm border rounded-lg flex justify-between ${selectionBucket && data.departments.length > 0 ? "border-blue-500" : "border-slate-300"}`}>
              <div className="w-full p-2.5 text-nowrap truncate cursor-default" title={data.buckets.map(bucketId => Object.entries(bucketObject).find(([, val]) => val.toString() === bucketId)?.[0]).join(', ').replace(/_/g, " ")} onClick={()=> {if(validForCampaignAndBucket.toString().includes(data.type) && isUpdate) setSelectionBucket(!selectionBucket)}}>
                {
                  data.buckets.length < 1 ? "Select Bucket" : data.buckets.map(bucketId => Object.entries(bucketObject).find(([, val]) => val.toString() === bucketId)?.[0]).join(', ').replace(/_/g, " ")
                }
              </div>
              <MdKeyboardArrowDown className="text-lg absolute right-0 top-9" onClick={()=> {if(validForCampaignAndBucket.toString().includes(data.type) && isUpdate) setSelectionBucket(!selectionBucket)}}/>
            </div>
            {
              (selectionBucket && data.departments.length > 0) &&
              <div className="w-full absolute left-0 top-16.5 bg-white border-slate-300 p-1.5 max-h-50 overflow-y-auto border z-40">
                {
                  deptBucket?.getBuckets.map((e,index)=> 
                    <div key={index} className="py-0.5">
                      <div className="uppercase text-sm">{e.dept}</div>
                      {
                        e.buckets.map(e => 
                        <label key={e.id} className="flex gap-2 text-xs">
                          <input 
                          type="checkbox"
                          name={e.name} 
                          id={e.name} 
                          value={e.name}
                          onChange={(e)=> handleCheckedBucket(e, e.target.value)} 
                          checked={data.buckets.toString().includes(e.id)} />
                          <span className="uppercase">{e.name.replace(/_/g," ")}</span>
                        </label>
                        )
                      }
                    </div>
                  )
                }
              </div>
            }
          </div>

          <div>
          {
            isUpdate ? 
            <div className="flex gap-10">
              <button type="button" className="bg-orange-500 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5" 
              onClick={() => handleSubmit("UPDATE",false)}
              >Submit</button>
              <button type="button" className="bg-slate-500 hover:bg-slate-600 focus:outline-none text-white focus:ring-4 focus:ring-slate-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5" 
              onClick={handleCancel}
              >Cancel</button>
            </div>
            : 
            <button type="button" className="bg-orange-500 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5" 
            onClick={() => setIsUpdate(true)}
            >Update</button>
          }
          </div>
        </div>

        <UserOptionSettings Submit={(action: "UPDATE" | "RESET" | "STATUS" | "UNLOCK", status)=> handleSubmit(action, status)} check={check} isLock={state.isLock}  />
      </div>
      { confirm &&
        <Confirmation {...modalProps}/>
      }
      
    </>
  )
}

export default UpdateUserForm
