/* eslint-disable @typescript-eslint/no-explicit-any */

import { gql, useMutation, useQuery } from "@apollo/client"
import { useEffect, useState } from "react"
import Confirmation from "./Confirmation"
import { PiNotePencilBold, PiTrashFill } from "react-icons/pi";
import SuccessToast from "./SuccessToast"

interface Success {
  success: boolean;
  message: string;
}

interface UserInfo {
  _id: string;
  name: string;
};

interface Department {
  id: string;
  name: string;
  branch: string;
  aom: UserInfo ;
}

const CREATEDEPT = gql`mutation
  createDept($name:String!, $branch:String!, $aom:String!) {
    createDept(branch:$branch, name:$name, aom:$aom) {
      success
      message
    }
  }
`
const UPDATEDEPT = gql`mutation
  updateDept($name:String!, $branch:String!, $aom:String!, $id:ID!) {
    updateDept(branch:$branch, name:$name, aom:$aom, id:$id){
      success
      message
    }
  }
`
const DELETEDEPT = gql `mutation
  deleteDept($id:ID!) {
    deleteDept(id:$id) {
      success
      message
    }
  }
`
interface Branch {
  id:string
  name:string
}

const BRANCH_QUERY = gql`
  query branchQuery {
    getBranches {
      id
      name
    }
  } 
`

const AOM_USER = gql`
  query getAomUser {
    getAomUser {
      _id
      name
      username
      type
      departments
      branch
      change_password
    }
  }

`

const DEPARTMENT_QUERY = gql`
  query departmentQuery{
    getDepts {
      id
      name
      branch
      aom { _id name }
    }
  }
`

const DepartmentSection = () => {
  const {data, refetch } = useQuery<{getBranches:Branch[]}>(BRANCH_QUERY)

  const {data:dept, refetch:refetchDept} = useQuery<{getDepts:Department[]}>(DEPARTMENT_QUERY)
  
  const [name, setName] = useState<string>("")
  const [branch, setBranch] = useState<string>("")
  const [aom, setAom] = useState<string>("")
  const [success, setSuccess] = useState<Success>({
    success: false,
    message: ""
  })
  const [confirm, setConfirm] = useState<boolean>(false)
  const [required, setRequired] = useState<boolean>(false)
  const [isUpdate,setIsUpdate] = useState<boolean>(false)
  const [deptToModify, setDeptToModify] = useState<Department>({
    id: "",
    name: "",
    branch: "",
    aom: {
      _id: "",
      name: "",
    }
  }) 


  const {data:aomUsers} = useQuery<{getAomUser:UserInfo[],}>(AOM_USER)
  // mutations ======================================================
  const [createDept,] = useMutation(CREATEDEPT,{
    onCompleted: () => {
      refetch();
      refetchDept()
      setSuccess({
        success: true,
        message: "Department successfully created"
      })
      setName("")
      setBranch("")
      setAom("")
    },
  })

  const [updateDept] = useMutation(UPDATEDEPT, {
    onCompleted: () => {
      refetch();
      setConfirm(false)
      refetchDept();
      setSuccess({
        success: true,
        message: "Department successfully updated"
      })
      setName("")
      setBranch("")
      setAom("")
      setIsUpdate(false)
      setDeptToModify({
        id: "",
        name: "",
        branch: "",
        aom: {
          _id: "",
          name: "",
        }
      })
    },
  })

  const [deleteDept] = useMutation(DELETEDEPT, {
    onCompleted: () => {
      refetch();
      refetchDept();
      setSuccess({
        success: true,
        message: "Department successfully deleted"
      })
    },
  })

// =================================================================
  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
    yes: () => {},
    no: () => {}
  })

  const confirmationFunction: Record<string, (dept:Department|null) => Promise<void>> = {
    CREATE: async() => {
      try {
        await createDept({variables: { name:name, branch:branch, aom:aom }});
      } catch (error:any) {
        const errorMessage = error?.graphQLErrors?.[0]?.message;
        if (errorMessage?.includes("Duplicate")) {
          setSuccess({
            success: true,
            message: "Department already exists"
          })
          setName("")
          setBranch("")
          setAom("")
          setConfirm(false)
        }
      }
    },
    UPDATE: async(dept) => {
      try {
        await updateDept({variables: {id: dept?.id, name: name, branch: branch, aom: aom}})
      
      } catch (error:any) {
        const errorMessage = error?.graphQLErrors?.[0]?.message;
        if (errorMessage?.includes("Duplicate")) {
          setSuccess({
            success: true,
            message: "Department already exists"
          })
          setConfirm(false)
          setName("")
          setBranch("")
          setAom("")
        }
      }
    },
    DELETE:async (dept) => {
      try {
        await deleteDept({variables: { id: dept?.id } })
        setConfirm(false)
      } catch (error) {
        console.log(error)
      }
    }
  };

  const handleSubmitCreate = (action: "CREATE") => {
    if(!name || !branch || !aom) {
      setRequired(true)
    } else {
      setRequired(false)
      setConfirm(true)
      setModalProps({
        no:()=> setConfirm(false),
        yes:() => { confirmationFunction[action]?.(null); setConfirm(false);},
        message: "Are you sure you want to add this department?",
        toggle: action
        })
      }
    }

  const handleSubmitUpdate = (action: "UPDATE") => {
    if(!name || !branch || (!aom && deptToModify?.name !== "admin")) {
      setRequired(true)
    } else {
      setRequired(false)
      setConfirm(true)
      setModalProps({
        no:()=> setConfirm(false),
        yes:() => { confirmationFunction[action]?.(deptToModify);},
        message: "Are you sure you want to add this department?",
        toggle: action
      })
    }
  }
  
  const handleSubmitDelete = (dept:Department,action:"DELETE") => {
    setConfirm(true)
    setDeptToModify({
      id: "",
      name: "",
      branch: "",
      aom: {
        _id: "",
        name: "",
      }
    })
    setName("")
    setBranch("")
    setAom("")
    setModalProps({
      no:()=> setConfirm(false),
      yes:() => { confirmationFunction[action]?.(dept); setConfirm(false);},
      message: "Are you sure you want to delete this department?",
      toggle: action
    })
  }

  const handleUpdateDept = (dept:Department) => {
    setDeptToModify(dept)
    setIsUpdate(true)
  }

  useEffect(()=> {
    if(isUpdate) {
      setName(deptToModify?.name)
      setBranch(deptToModify?.branch)
      setAom(deptToModify?.aom?.name || "")
    }
  },[deptToModify,isUpdate])

  const handleCancelUpdate = () => {
    setIsUpdate(false)
    setDeptToModify({
      id: "",
      name: "",
      branch: "",
      aom: {
        _id: "",
        name: "",
      }
    })
    setName("")
    setBranch("")
    setAom("")
  }

  return (
    <>
      {
        success?.success &&
        <SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>
      }
      <div className="px-20">
          <div className="inline-flex items-center justify-center w-full">
            <hr className="w-full h-1 my-8 bg-gray-200 border-0 rounded-sm dark:bg-gray-700"/>
            <div className="absolute px-4 -translate-x-1/2 bg-white left-1/2 dark:bg-gray-900"> 
              <h1 className="font-medium text-2xl text-slate-600">Department</h1>
            </div>
          </div>
          <div className="flex  gap-5 justify-center"> 
            <div className="h-100 w-2/3 border border-slate-300 rounded-xl p-4 overflow-y-auto">
              {
                dept?.getDepts.map((d) => 
                  <div key={d.id} className="justify-between px-2 py-2 border-b border-slate-300 last:border-b-0 hover:bg-slate-200/60 text-base font-medium text-slate-500 grid grid-cols-5 text-center items-center">
                    <div className="col-span-2 ">{d?.name.replace(/_/g, " ")}</div>
                    <div className="text-xs">{d?.branch.toUpperCase()}</div>
                    <div className="text-xs">{d?.aom?.name.toUpperCase()}</div>
                    <div className="flex justify-end text-2xl gap-5">
                      <PiNotePencilBold className="text-green-400 cursor-pointer hover:text-green-600" onClick={()=> handleUpdateDept(d)}/>
                      <PiTrashFill  
                        className="text-red-400 hover:text-red-600 cursor-pointer"
                        onClick={()=> handleSubmitDelete(d,"DELETE")}
                        />
                    </div>
                  </div>
                )
              }

            </div>
            <div className="flex flex-col gap-5">
              <h1 className="text-base font-medium text-slate-500">Create Department</h1>
              <input
                type="text"
                name="name"
                id="name"
                autoComplete="name"
                value={name}
                required
                placeholder="Enter department name"
                onChange={(e)=> setName(e.target.value)}
                className={`${required && !name ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-300"} bg-gray-50 border-gray-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-96 p-2.5 `}  
              />

              <select 
                id="branch"
                name="branch"
                value={branch}
                onChange={(e)=> setBranch(e.target.value)}
                className={`${required && !branch ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-300"}  border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
              >
                <option value="">Choose a branch</option>.
                {
                  data?.getBranches.map((branch)=> 
                    <option key={branch.id} value={branch.name}>{branch.name.toUpperCase()}</option>
                  )
                }
              </select>

              <select 
                id="aom"
                name="aom"
                value={aom}
                onChange={(e)=> setAom(e.target.value)}
                className={`${required && !aom && deptToModify.name !== "admin"  ? "bg-red-50 border-red-300" : "bg-gray-50 border-gray-300"} bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}>
                <option value="">Choose a aom</option>
                {
                  aomUsers?.getAomUser.map((aom) => 
                    <option key={aom._id} value={aom.name}>{aom.name.toUpperCase()}</option>
                  )
                }
              </select>
          

              <div>
                {
                  !isUpdate ? 
                  <button type="button" className={`bg-blue-500 hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`} onClick={() => handleSubmitCreate("CREATE")}>Create</button> :
                  <>
                    <button type="button" className="bg-orange-500 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer" onClick={() => handleSubmitUpdate("UPDATE")}>Update</button>
                    <button type="button" className="bg-slate-500 hover:bg-slate-600 focus:outline-none text-white focus:ring-4 focus:ring-slate-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer" onClick={handleCancelUpdate}>Cancel</button>
                  </>
                }
           
              </div>
            </div>
            
          </div>
      </div>
      {
        confirm &&
        <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default DepartmentSection
