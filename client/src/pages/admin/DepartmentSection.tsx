import { gql, useMutation, useQuery } from "@apollo/client"
import { useCallback, useEffect, useState } from "react"
import Confirmation from "../../components/Confirmation"
import { PiNotePencilBold, PiTrashFill } from "react-icons/pi";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { useAppDispatch } from "../../redux/store";

type UserInfo = {
  _id: string;
  name: string;
};

type Department = {
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
type Branch = {
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
  const dispatch = useAppDispatch()
  const {data:dept, refetch:refetchDept} = useQuery<{getDepts:Department[]}>(DEPARTMENT_QUERY)
  const [name, setName] = useState<string>("")
  const [branch, setBranch] = useState<string>("")
  const [aom, setAom] = useState<string>("")
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

  const {data:aomUsers, refetch:aomRefetch} = useQuery<{getAomUser:UserInfo[],}>(AOM_USER)

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await aomRefetch()
        await refetch()
        await refetchDept()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })
    return () => clearTimeout(timer)
  },[aomRefetch,refetch,refetchDept])

  // mutations ======================================================
  const [createDept,] = useMutation(CREATEDEPT,{
    onCompleted: async() => {
      try {
        const res = await refetch();
        const resDept = await refetchDept()
        if(res.data || resDept.data) {
          dispatch(setSuccess({
            success: true,
            message: "Department successfully created"
          }))
        }
        
      } catch (error) {
        dispatch(setServerError(true))
      }
      setName("")
      setBranch("")
      setAom("")
    },
    onError: (error)=> {
      const errorMessage = error.message
      if (errorMessage?.includes("Duplicate")) {
        dispatch(setSuccess({
          success: true,
          message: "Department already exists"
        }))
        setName("")
        setBranch("")
        setAom("")
        setConfirm(false)
      } else {
        dispatch(setServerError(true))
      }
    }
  })

  const [updateDept] = useMutation(UPDATEDEPT, {
    onCompleted: () => {
      refetch();
      setConfirm(false)
      refetchDept();
      dispatch(setSuccess({
        success: true,
        message: "Department successfully updated"
      }))
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
    onError: (error)=> {
      const errorMessage = error.message
      if (errorMessage?.includes("Duplicate")) {
        dispatch(setSuccess({
          success: true,
          message: "Department already exists"
        }))
        setConfirm(false)
        setName("")
        setBranch("")
        setAom("")
      } else {
        dispatch(setServerError(true))
      }
    }
  })

  const [deleteDept] = useMutation(DELETEDEPT, {
    onCompleted: async() => {
      try {
        await refetch();
        await refetchDept();
        
      } catch (error) {
        
        dispatch(setServerError(true))
      }
      dispatch(setSuccess({
        success: true,
        message: "Department successfully deleted"
      }))
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })

// =================================================================
  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
    yes: () => {},
    no: () => {}
  })

  const creatingCampaign = useCallback(async()=> {
    await createDept({variables: { name, branch, aom }});
  },[createDept,name,branch,aom])

  const updatingCampaign = useCallback(async(dept:Department|null)=> {
    await updateDept({variables: {id: dept?.id, name, branch, aom}})
  },[name, branch, aom, updateDept])


  const deletingCampaign = useCallback(async(dept:Department|null)=> {
    await deleteDept({variables: { id: dept?.id } })
    setConfirm(false)
  },[name, branch, aom])

  const confirmationFunction: Record<string, (dept:Department|null) => Promise<void>> = {
    CREATE: creatingCampaign,
    UPDATE: updatingCampaign,
    DELETE: deletingCampaign
  };

  const handleSubmitCreate = useCallback((action: "CREATE") => {
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
  },[setModalProps, setConfirm, setRequired, name, branch, aom, confirmationFunction])

  const handleSubmitUpdate = useCallback((action: "UPDATE") => {
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
  },[name,branch,aom,deptToModify,setConfirm,setRequired,setModalProps,confirmationFunction])
  
  const handleSubmitDelete = useCallback((dept:Department,action:"DELETE") => {
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
  },[setConfirm, setDeptToModify, setName, setBranch, setAom, setModalProps, confirmationFunction])

  const handleUpdateDept = useCallback((dept:Department) => {
    setDeptToModify(dept)
    setIsUpdate(true)
  },[setDeptToModify, setIsUpdate])

  useEffect(()=> {
    if(isUpdate) {
      setName(deptToModify?.name)
      setBranch(deptToModify?.branch)
      setAom(deptToModify?.aom?.name || "")
    }
  },[deptToModify,isUpdate])

  const handleCancelUpdate = useCallback(() => {
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
  },[setIsUpdate, setDeptToModify, setName, setBranch, setAom])

  return (
    <div className="relative">
      <div className="px-20">
          <div className="inline-flex items-center justify-center w-full">
            <hr className="w-full h-1 my-8 bg-gray-200 border-0 rounded-sm dark:bg-gray-700"/>
            <div className="absolute px-4 -translate-x-1/2 bg-white left-1/2 dark:bg-gray-900"> 
              <h1 className="font-medium text-2xl text-slate-600">Campaign</h1>
            </div>
          </div>
          <div className="flex  gap-5 justify-center"> 
            <div className="h-100 w-2/3 border border-slate-300 rounded-xl p-4 overflow-y-auto">
              {
                dept?.getDepts.map((d) => {
                  return d.name !== "ADMIN" && (
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
                })
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
    </div>
  )
}

export default DepartmentSection
