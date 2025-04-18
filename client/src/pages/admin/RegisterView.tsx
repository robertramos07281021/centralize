/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery } from "@apollo/client"
import { useEffect, useState } from "react"
import { Branch, DeptAomId } from "../../middleware/types"
import { BRANCH_DEPARTMENT_QUERY, BRANCH_QUERY } from "../../apollo/query"
import { CREATE_ACCOUNT } from "../../apollo/mutations"
import SuccessToast from "../../components/SuccessToast"
import Confirmation from "../../components/Confirmation"

const RegisterView = () => {

  const {data:branchQuery} = useQuery<{getBranches:Branch[], getBranch:Branch}>(BRANCH_QUERY,{ variables: {name: ""}})
  const [data, setData] = useState({
    type: "",
    name: "",
    username: "",
    branch: "",
    department: "",
    id_number: ""
  })
  const [success, setSuccess] = useState({
    success: false,
    message: ""
  })

  const {data:branchDeptData} = useQuery<{getBranchDept:DeptAomId[]}>(
    BRANCH_DEPARTMENT_QUERY, 
    {
      variables: {branch: data.branch},
      skip: !data.branch 
    } 
  )

  const [createUser] = useMutation(CREATE_ACCOUNT, {
    onCompleted: async() => {
      try {
        setData({
          type: "",
          name: "",
          username: "",
          branch: "",
          department: "",
          id_number: ""
        })
        setSuccess({
          success: true,
          message: "Account created"
        })
      } catch (error) {
        console.log(error)
      }
    },
  })
  const [required, setRequired] = useState(false)

  const [confirm,setConfirm] = useState(false)

  const confirmationFunction: Record<string, () => Promise<void>> = {
    CREATE: async() => {
      try {
        await createUser({variables:  {...data}});
      } catch (error:any) {
        console.log(error)
        const errorMessage = error?.graphQLErrors?.[0]?.message;
        if (errorMessage?.includes("E11000")) {
          setSuccess({
            success: true,
            message: "Username already exists"
          })
          setData({
            type: "",
            name: "",
            username: "",
            branch: "",
            department: "",
            id_number: ""
          })
          setConfirm(false)
        }
      }
    },

  };

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
    yes: () => {},
    no: () => {}
  })


  const submitForm = async() => {
    try {
      
      if(data.type === "AGENT") {
        if(!data.branch || !data.name || !data.username || !data.department ) {
          setRequired(true)
        } else {
          setRequired(false)
          setConfirm(true)
          setModalProps({
            no:()=> setConfirm(false),
            yes:() => { confirmationFunction["CREATE"]?.(); setConfirm(false);},
            message: "Are you sure you want to add this user?",
            toggle: "CREATE"
          })
        }
      } else {
        if(!data.branch || !data.name || !data.username || !data.department ) {
          setRequired(true)
        } else {
          setRequired(false)
          setConfirm(true)
          setModalProps({
            no:()=> setConfirm(false),
            yes:() => { confirmationFunction["CREATE"]?.(); setConfirm(false);},
            message: "Are you sure you want to add this user?",
            toggle: "CREATE"
          })
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    if (data.type === "" && (data.name || data.username || data.branch || data.department || data.id_number)) {
      setData(prev => ({
        ...prev,
        name: "",
        username: "",
        branch: "",
        department: "",
        bucket: "",
        id_number: ""
      }));
    }
  }, [data.type, data])

  return (
    <>
      {
        success?.success &&
        <SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>
      }
    
      <div className="w-full flex flex-col">
        <div className="p-5 text-2xl font-medium text-slate-500 ">Create Account</div>
        <form className=" w-full px-5 py-2 flex flex-col gap-2 items-center justify-center ">
          {
            required && 
          <div className="text-center text-xs text-red-500">All fields are required.</div>
          }
          <label className="w-96">
            <p className="w-96 text-base font-medium text-slate-500">Type</p>
            <select
              id="type"
              name="type"
              value={data.type}
              onChange={(e)=> setData({...data, type: e.target.value})}
              className={`bg-slate-50 border-slate-300 border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5`}
              >
              <option value="">Choose a bucket</option>
              <option value="AGENT">AGENT</option>
              <option value="TL">TL</option>
              <option value="AOM">AOM</option>
              {/* <option value="MIS">MIS</option> */}
              <option value="CEO">CEO</option>
              <option value="ADMIN">ADMIN</option>
              <option value="OPERATION">OPERATION</option>
            </select>
          </label>
          <label className="w-96">
            <p className="w-96 text-base font-medium text-slate-500">Name</p>
            <input 
              type="text" 
              id="name" 
              name="name" 
              autoComplete="name"
              value={data.name}
              onChange={(e)=> setData({...data, name: e.target.value})}
              disabled={data.type.trim() === ""}
              className={`${data.type.trim() === "" ? "bg-gray-200" : "bg-gray-50"}  border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-96 in-disabled:bg-gray-200`}  
              />
          </label>
          
          <label className="w-96">
            <p className="w-96 text-base font-medium text-slate-500">Username</p>
            <input 
              type="text" 
              name="username" 
              id="username" 
              autoComplete="username"
              value={data.username}
              onChange={(e)=> setData({...data,username: e.target.value})}
              disabled={data.type.trim() === "" }
              className={`${data.type.trim() === "" ? "bg-gray-200" : "bg-gray-50"} bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-96 p-2.5`}  
              />
          </label>
          <label className="w-96">
            <p className="w-96 text-base font-medium text-slate-500">User Id</p>
            <input 
              type="text" 
              name="id_number" 
              id="id_number" 
              autoComplete="id_number"
              value={data.id_number}
              onChange={(e)=> setData({...data,id_number: e.target.value})}
              disabled={data.type.trim() === "" }
              className={`${data.type.trim() === "" ? "bg-gray-200" : "bg-gray-50"} bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-96 p-2.5`}  
              />
          </label>
          <label className="w-96">
            <p className="w-96 text-base font-medium text-slate-500">Branch</p>
            <select
              id="branch"
              name="branch"
              value={data.branch}
              onChange={(e)=> setData({...data, branch: e.target.value})}
              disabled={data.type.trim() === ""}
              className={`${data.type.trim() === "" ? "bg-gray-200" : "bg-gray-50"} border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5`}
            >
              <option value="">Choose a branch</option>
              {
                branchQuery?.getBranches.map((branch)=> 
                  <option key={branch.id} value={branch.name}>{branch.name.toUpperCase()}</option>
                )
              }
            </select>
          </label>
          <label className="w-96">
            <p className="w-96 text-base font-medium text-slate-500">Department</p>
            <select
              id="department"
              name="department"
              value={data.department}
              onChange={(e)=> setData({...data, department: e.target.value})}
              disabled={data.branch.trim() === "" || data.type.trim() === ""}
              className={`${data.branch.trim() === "" ? "bg-gray-200" : "bg-gray-50"} border-slate-300 border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5`}
              >
              <option value="">Choose a department</option>
              {
                branchDeptData?.getBranchDept?.map((dept)=> 
                  <option key={dept.id} value={dept.name}>{dept.name.toUpperCase()}</option>
              )
            }
            </select>
          </label>
          <div>

            <button type="button" className="bg-blue-500 hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5" 
            onClick={submitForm}
            >Submit</button>
          </div>
        </form>



      </div>

      { confirm &&
      <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default RegisterView
