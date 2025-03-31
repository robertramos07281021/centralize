
import { useMutation, useQuery } from "@apollo/client"
import { useState } from "react"
import { Branch, Bucket, DeptAomId, Success, Users } from "../middleware/types"
import { BRANCH_DEPARTMENT_QUERY, BRANCH_QUERY, DEPT_BUCKET_QUERY } from "../apollo/query"
import { RESET_PASSWORD, STATUS_UPDATE, UPDATE_USER } from "../apollo/mutations"
import Confirmation from "./Confirmation"
import { useLocation, useNavigate } from "react-router-dom"
import SuccessToast from "./SuccessToast"

interface modalProps {
  state: Users
}

const UpdateUserForm:React.FC<modalProps> = ({state}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const {data:branchesData} = useQuery<{getBranches:Branch[], getBranch:Branch}>(BRANCH_QUERY,{ variables: {name: ""}})

  const [isUpdate, setIsUpdate] = useState(false)
  const [required, setRequired] = useState(false)
  const [confirm, setConfirm] = useState(false)

  type UserType = "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION" ;

  const isValidUserType = (value: string): value is UserType => {
    return ["AGENT", "ADMIN", "AOM", "TL", "CEO", "OPERATION"].includes(value);
  };
  
  const safeType = isValidUserType(state?.type) ? state.type : "AGENT";
  
  const [success, setSuccess] = useState<Success | null>({
    success: false,
    message: ""
  })

  const [check, setCheck] = useState<boolean>(state.active)

  const [data, setData] = useState<{
    username: string;
    type: UserType;
    name: string;
    branch: string;
    department: string;
    bucket: string | null;
  }>({
    username: state?.username,
    type: safeType,
    name: state?.name,
    branch: state?.branch,
    department: state?.department,
    bucket: state?.bucket || null
  })

  // ================ mutations ===================================
  const [updateUser] = useMutation(UPDATE_USER, {
    onCompleted: async(res) => {
      try {
        navigate(location.pathname, { state: { ...res.updateUser.user, newKey: "newKey" } });
        setSuccess({
          success: res.updateUser.success,
          message: res.updateUser.message
        })
        setIsUpdate(false)
      } catch (error) {
        console.log(error)
      }
    },
  })

  const [resetPassword] = useMutation(RESET_PASSWORD, {
    onCompleted: async(res) => {
      try {
        navigate(location.pathname, { state: { ...state, newKey: "newKey" } });
        setSuccess({
          success: res.resetPassword.success,
          message: res.resetPassword.message
        })
      } catch (error) {
        console.log(error)
      }
    },
  })

  const [updateActiveStatus] = useMutation(STATUS_UPDATE,{
    onCompleted: async(res) => {
      try {
        navigate(location.pathname, { state: { ...res.updateActiveStatus.user, newKey: "newKey" } });
        setSuccess({
          success: res.updateActiveStatus.success,
          message: res.updateActiveStatus.message
        })
      } catch (error) {
        console.log(error)
      }
    },
  })

//  ====================================================================== 
  const {data:branchDeptData} = useQuery<{getBranchDept:DeptAomId[]}>(
    BRANCH_DEPARTMENT_QUERY, 
    {
      variables: {branch: data.branch},
      skip: !data.branch 
    } 
  )

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
    yes: () => {},
    no: () => {}
  })

  const {data:deptBucket} = useQuery<{getDeptBucket:Bucket[]}>(DEPT_BUCKET_QUERY,{
    variables: {dept: data.department},
    skip: !data.department
  })

  const handleCancel = () => {
    setIsUpdate(false)
    setRequired(false)
    setData({    
      username: state?.username,
      type: safeType,
      name: state?.name,
      branch: state?.branch,
      department: state?.department,
      bucket: state?.bucket})
  }

  const submitValue: Record<string, () => Promise<void>>  = {
    UPDATE: async() => {
      if(data.type === "AGENT") {
        if(!data.branch || !data.name || !data.department || !data.bucket) {
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
          try {
            await updateUser({variables: {name: data.name, type: data.type, branch: data.branch, department: data.department, bucket: data.bucket, id: state._id }})
            setConfirm(false)
          } catch (error) {
           console.log(error)
          }
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
          try {
            await resetPassword({variables: {id: state._id}})
            setConfirm(false)
          } catch (error) {
           console.log(error)
          }
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
          try {
            await updateActiveStatus({variables: {id: state._id}})
            setConfirm(false)
          } catch (error) {
           console.log(error)
          }
        },
        message: `Are you sure you want to ${state.active ? "Deactivate" : "Activate"} of this user?`,
        toggle: "UPDATE"
      })
    },
  }

  const handleSubmit = (action: "UPDATE" | "RESET" | "STATUS",status:boolean) => {
    submitValue[action]?.()
    if(action === "STATUS") {
      setCheck(status)
    }
  }

  return (
    <>
      {
        success?.success &&
        (<SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>)
      }
      <div className="px-5 py-2 w-full grid grid-cols-2 gap-10 col-span-2">
   
        <div className=" w-full  flex flex-col gap-2 items-center justify-center ">
          {
            required && 
          <div className="text-center text-xs text-red-500">All fields are required.</div>
          }
          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Type</p>
            <select
              id="type"
              name="type"
              value={data.type}
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
              value={data.username}
              disabled
              className={`${data.type.trim() === "" ? "bg-gray-200" : "bg-gray-50"} bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}  
              />
          </label>

          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Name</p>
            <input 
              type="text" 
              id="name" 
              name="name" 
              autoComplete="name"
              value={data.name}
              onChange={(e)=> setData({...data, name: e.target.value})}
              disabled={!isUpdate}
              className={`${data.type.trim() === "" ? "bg-gray-200" : "bg-gray-50"}  border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full in-disabled:bg-gray-200`}  
              />
          </label>
          
          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Branch</p>
            <select
              id="branch"
              name="branch"
              value={data.branch}
              onChange={(e)=> setData({...data, branch: e.target.value})}
              disabled={!isUpdate}
              className={`${data.type.trim() === "" ? "bg-gray-200" : "bg-gray-50"} border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            >
              <option value="">Choose a branch</option>
              {
                branchesData?.getBranches.map((branch)=> 
                  <option key={branch.id} value={branch.name}>{branch.name.toUpperCase()}</option>
                )
              }
            </select>
          </label>
          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Department</p>
            <select
              id="department"
              name="department"
              value={data.department}
              onChange={(e)=> setData({...data, department: e.target.value})}
              disabled={!isUpdate}
              className={`${data.branch.trim() === "" ? "bg-gray-200" : "bg-gray-50"} border-slate-300 border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
              >
              <option value="">Choose a department</option>
              {
                branchDeptData?.getBranchDept?.map((dept)=> 
                  <option key={dept.id} value={dept.name}>{dept.name.toUpperCase()}</option>
              )
            }
            </select>
          </label>
          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Bucket</p>
            <select
              id="bucket"
              name="bucket"
              value={data.bucket || ""}
              onChange={(e)=> setData({...data,bucket: e.target.value})}
              disabled={!isUpdate}
              className={`${(data.department.trim() === "") || data.type !== "AGENT"  ? "bg-gray-200" : "bg-gray-50"} border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
              >
              <option value="">Choose a bucket</option>
              {
                deptBucket?.getDeptBucket.map((bucket)=> 
                  <option key={bucket.id} value={bucket.name}>{bucket.name.toUpperCase()}</option>
              )
            }
            </select>
          </label>
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
        <div className="flex flex-col gap-5">
          <div>
            <button 
              type="button" 
              className="bg-orange-500 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5" 
              onClick={()=> handleSubmit("RESET",false)}
            >Reset Password</button>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={check}
              onChange={(e) => handleSubmit("STATUS",e.target.checked)}
              className="sr-only peer"/>
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{check ? "Activated": "Deactivated"}</span>
          </label>
        </div>
      </div>
      { confirm &&
        <Confirmation {...modalProps}/>
      }
      
    </>
  )
}

export default UpdateUserForm
