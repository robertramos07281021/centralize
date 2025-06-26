/* eslint-disable @typescript-eslint/no-explicit-any */
import { gql, useMutation, useQuery } from "@apollo/client"
import {  Department, Success } from "../../middleware/types"
import { useEffect, useMemo, useState } from "react";
import Confirmation from "../../components/Confirmation";
import { PiNotePencilBold, PiTrashFill  } from "react-icons/pi";
import SuccessToast from "../../components/SuccessToast";
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";

interface Bucket {
  name: string
  dept: string
  id: string
  viciIp: string
  issabelIp: string
}

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
const DEPARTMENT_BUCKET = gql`
  query findDeptBucket($dept:ID) {
    findDeptBucket(dept: $dept) {
      id
      name
      dept
      issabelIp
      viciIp
    }
  }
`

const CREATEBUCKET = gql`mutation
  createBucket($name: String!, $dept:String!, $viciIp: String, $issabelIp:String){
    createBucket(name:$name, dept:$dept, viciIp: $viciIp, issabelIp: $issabelIp) {
      success
      message
    }
  }
`
const UPDATEBUCKET = gql `mutation
  updateBucket($input: UpdateBucket) {
    updateBucket(input:$input) {
      success
      message
    }
  }
`
const DELETEBUCKET = gql `mutation
  deleteBucket($id:ID!) {
    deleteBucket(id:$id) {
      success
      message
    }
  }
`

const BucketSection = () => {
  const dispatch = useAppDispatch()
  const {data:dept, refetch} = useQuery<{getDepts:Department[], getDept:Department}>(DEPARTMENT_QUERY,{ variables: { name: "admin" } })
  const campaignOnly = dept?.getDepts.filter((d)=> d.name!== "admin")
  const newDepts = useMemo(() => [...new Set(campaignOnly?.map((d) => d.id))], [campaignOnly])
  const [deptSelected,setDeptSelected] = useState<string | null>(null)
  const [success, setSuccess] = useState<Success>({
    success: false,
    message: ""
  })
  const [deptObject, setDeptObject] = useState<{[key:string]:string}>({})
  useEffect(()=> {
    if(dept) {
      const newObject:{[key:string]:string} = {}
      dept?.getDepts?.map((d)=> {
        newObject[d.id] = d.name
      })
      setDeptObject(newObject)
    }
  },[dept])

  const [issabelIp, setIssabelIp] = useState<string>("")
  const [viciIp, setViciIp] = useState<string>("")


  const [confirm,setConfirm] = useState<boolean>(false)
  const [bucket, setBucket] = useState<string>("")

  useEffect(() => {
    if (newDepts.length > 0 && deptSelected === null) {
      setDeptSelected(newDepts[0]);
    }
  },[newDepts, deptSelected]);

  const [required,setRequired] = useState<boolean>(false)
  const [isUpdate, setIsUpdate] = useState<boolean>(false)
  const [bucketToUpdate, setBucketToUpdate] = useState<Bucket>({
    id: "",
    name: "",
    dept: "",
    viciIp: "",
    issabelIp: ""
  })

  const handleSelectDept = (dept:string) => {
    setDeptSelected(dept)
    setBucket("")
    setRequired(false)
    setIsUpdate(false)
  }

  const {data:bucketData,refetch:bucketRefetch} = useQuery<{findDeptBucket:Bucket[]}>(DEPARTMENT_BUCKET,{
    variables: {dept: deptSelected},
    skip: !deptSelected
  })

  useEffect(()=> {
    refetch()
    bucketRefetch()
  },[dept,refetch,bucketRefetch])


// mutations ==============================================

  const [createBucket] = useMutation(CREATEBUCKET,{
    onCompleted: async(res) => {
      refetch();
      bucketRefetch();
      setSuccess({
        success: res.createBucket.success,
        message: res.createBucket.message
      })
      setBucket("")
      setViciIp("")
      setIssabelIp("")
    },
    onError: (error) => {
    const errorMessage = error?.message
      if (errorMessage?.includes("Duplicate")) {
        setSuccess({
          success: true,
          message: "Bucket already exists"
        })
        setBucket("")
      }

      if(errorMessage?.includes('Response')) {
        dispatch(setServerError(true))
      }
    }
  })

  const [updateBucket] = useMutation(UPDATEBUCKET, {
    onCompleted: (res) => {
      refetch();
      bucketRefetch();
      setSuccess({
        success: res.updateBucket.success,
        message: res.updateBucket.message
      })
      setBucket("")
      setIsUpdate(false)
      setBucketToUpdate({
        id: "",
        name: "",
        dept: "",
        viciIp: "",
        issabelIp: ""
      })
      setViciIp("")
      setIssabelIp("")
    },
    onError: (error) => {
    
      const errorMessage = error?.message;
      console.log(errorMessage)
      if (errorMessage?.includes("Duplicate")) {
        setSuccess({
          success: true,
          message: "Bucket already exists"
        })
        setConfirm(false)
      }
      if(errorMessage?.includes('Response')) {
        dispatch(setServerError(true))
      }
    }
  })

  const [deleteBucket] = useMutation(DELETEBUCKET, {
    onCompleted: (res) => {
      refetch();
      bucketRefetch();
      setSuccess({
        success: res.deleteBucket.success,
        message: res.deleteBucket.message
      })
      setBucketToUpdate({
        id: "",
        name: "",
        dept: "",
        viciIp: "",
        issabelIp: ""
      })
      setBucket("")
      setIsUpdate(false)
      setRequired(false)
    },
    onError: (error) => {
      const errorMessage = error?.message;
      if(errorMessage?.includes('Response')) {
        dispatch(setServerError(true))
      }
    }
  })
  
// ===============================================================

  type BucketOperation = "CREATE" | "UPDATE" | "DELETE";

  const confirmationFunction: Record<BucketOperation, (b:Bucket | null) => Promise<void>> = {
    CREATE: async() => {
      await createBucket({variables: { name:bucket, dept: deptObject[deptSelected || ""] , viciIp, issabelIp}});
    },
    UPDATE: async(b) => {
      if(b) {
        const input = {
          name: bucket,
          id: b.id,
          viciIp,
          issabelIp
        }
        await updateBucket({variables: {input}})
      }
    },
    DELETE:async (b) => {
      await deleteBucket({variables: { id: b?.id } })
    }
  };


  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE",
    yes: () => {},
    no: () => {}
  })

  const [requiredIps, setRequiredIps] = useState<boolean>(false)

  const handleSubmit = (action: "CREATE" | "UPDATE" | "DELETE",buck: Bucket | null) => {
    if(action !== "DELETE") {
      if(!viciIp && !issabelIp) {
        setRequiredIps(true)
        return
      } else {
        setRequiredIps(false)
      }

      if(!bucket) {
        setRequired(true)
        return
      } else {
        setRequired(false)
      }
    }

    setConfirm(true)

    const actionExnts = {
      CREATE: {message : "Are you sure you want to add this bucket?", params: buck},
      UPDATE: {message: "Are you sure you want to update this bucket?", params: buck},
      DELETE: {message: "Are you sure you want to delete this bucket?", params: buck}
    }

    setModalProps({
      no:()=> setConfirm(false),
      yes:() => { confirmationFunction[action]?.(actionExnts[action]?.params); setConfirm(false);},
      message: actionExnts[action]?.message ,
      toggle: action
    })
  }

  const handleUpdate = (b:Bucket) => {
    setRequired(false)
    setIsUpdate(true)
    setBucket(b.name)
    setBucketToUpdate(b)
    setIssabelIp(b.issabelIp)
    setViciIp(b.viciIp)
  }

  return (
    <div className="relative">
      {
        success.success &&
        <SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>
      }
      <div className="px-20">

        <div className="inline-flex items-center justify-center w-full">
          <hr className="w-full h-1 my-8 bg-gray-200 border-0 rounded-sm dark:bg-gray-700"/>
          <div className="absolute px-4 -translate-x-1/2 bg-white left-1/2 dark:bg-gray-900"> 
            <h1 className="font-medium text-2xl text-slate-600">Bucket</h1>
          </div>
        </div>
        <div className="flex gap-5 justify-center">
          <div className="w-96 h-80 rounded-xl border border-slate-300 p-2 overflow-y-auto">
            {
              newDepts.map((nd,index)=> {
                const findBucket = dept?.getDepts.find(x => x.id === nd)
                return deptObject[nd] !== "ADMIN" && (
                  <div 
                    key={index} 
                    className={`${nd === deptSelected && "bg-slate-200"} text-base uppercase font-medium text-slate-500 p-2 border-b border-slate-300 last:border-b-0 hover:bg-slate-100 cursor-pointer`}
                    onClick={()=> handleSelectDept(nd)}
                  >
                    <p className="text-sm">{deptObject[nd]?.replace(/_/g," ")}- <span>{findBucket?.branch}</span></p>
                  </div>
                )
              }
              )
            
            }
          
          </div>
          <div className="w-150 h-80 rounded-xl border border-slate-300 p-2 overflow-y-auto">
              <div className="grid grid-cols-4 text-base font-bold text-gray-500 bg-gray-50 py-0.5">
                <div className="px-2">Name</div>
                <div>Vici</div>
                <div>Issabel</div>
                <div className="text-end px-2">Action</div>
              </div>
            {
              bucketData?.findDeptBucket.map((b) => 
                <div key={b.id}
                  className="text-sm uppercase font-medium text-slate-500 p-2 border-b border-slate-300 last:border-b-0 hover:bg-slate-100 cursor-pointer grid grid-cols-4"
                >
                  <div className="uppercase">
                    {b.name}
                  </div>
                  <div>{b.viciIp}</div>
                  <div>{b.issabelIp}</div>
                  <div className="flex text-2xl gap-2 justify-end">
                    <PiNotePencilBold className="text-green-400 cursor-pointer hover:text-green-600" onClick={()=> handleUpdate(b)} />
                    <PiTrashFill  className="text-red-400 hover:text-red-600 cursor-pointer"
                    onClick={()=> handleSubmit("DELETE",b)}
                    />
                  </div>
                </div>
              )
            }
          </div>
          <div className="flex gap-5 w-96 flex-col">
            <input 
            type="text"
            name="name_bucket"
            id="name_bucket"
            value={bucket}
            autoComplete="off"
            placeholder="Enter bucket name"
            onChange={(e)=> setBucket(e.target.value)}
            className={`${required && !bucket ? "bg-red-50 border-red-300": "bg-gray-50 border-gray-300" }  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}  
            />
            <input 
              type="text" 
              name="issabelIp"
              id="issabelIp"
              value={issabelIp}
              autoComplete="off"
              placeholder="Enter Issabel Ip"
              onChange={(e)=> setIssabelIp(e.target.value)}
              className={`${requiredIps && !issabelIp ? "bg-red-50 border-red-300": "bg-gray-50 border-gray-300" }  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}  
            />
            <input 
              type="text" 
              name="viciIp"
              id="viciIp"
              value={viciIp}
              autoComplete="off"
              placeholder="Enter Vici Ip"
              onChange={(e)=> setViciIp(e.target.value)}
              className={`${requiredIps && !viciIp ? "bg-red-50 border-red-300": "bg-gray-50 border-gray-300" }  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}  
            />
            { newDepts.length > 0 &&
              <div>
                {
                  !isUpdate ?  
                  <button type="button" className={`bg-blue-500 hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`} onClick={()=>handleSubmit("CREATE", null)}>Add</button> :
                  <>
                    <button type="button" className={`bg-orange-500 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`} onClick={()=>handleSubmit("UPDATE", bucketToUpdate)}>Update</button>
                    <button type="button" className={`bg-slate-500 hover:bg-slate-600 focus:outline-none text-white focus:ring-4 focus:ring-slate-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`} onClick={()=> {
                      setBucketToUpdate({
                        id: "",
                        name: "",
                        dept: "",
                        viciIp: "",
                        issabelIp: ""
                      });
                      setIssabelIp("")
                      setViciIp("")
                      setBucket("")
                      setRequired(false)
                      setIsUpdate(false)
                    }}>Cancel</button>
                  </>
                }
            </div>
            }
          </div>
        </div>
      </div>
      {confirm &&
        <Confirmation {...modalProps}/>
      }
    </div>
  )
}

export default BucketSection
