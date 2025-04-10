/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery } from "@apollo/client"
import {  Department, Success } from "../middleware/types"
import { DEPARTMENT_BUCKET, DEPARTMENT_QUERY } from "../apollo/query"
import { useEffect, useMemo, useState } from "react";
import { CREATEBUCKET, DELETEBUCKET, UPDATEBUCKET } from "../apollo/mutations";
import Confirmation from "./Confirmation";
import { PiNotePencilBold, PiTrashFill  } from "react-icons/pi";
import SuccessToast from "./SuccessToast";



interface Bucket {
  name: string
  dept: string
  id: string
}


const BucketSection = () => {
  const {data:dept, refetch} = useQuery<{getDepts:Department[], getDept:Department}>(DEPARTMENT_QUERY,{ variables: { name: "admin" } })
  const campaignOnly = dept?.getDepts.filter((d)=> d.name!== "admin")
  const newDepts = useMemo(() => [...new Set(campaignOnly?.map((d) => d.name))], [campaignOnly])
  const [deptSelected,setDeptSelected] = useState<string | null>(null)
  const [success, setSuccess] = useState<Success>({
    success: false,
    message: ""
  })

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
    dept: ""
  })

  type TypeOfDept = (typeof newDepts)[number];
  
  const handleSelectDept = (dept:TypeOfDept) => {
    setDeptSelected(dept)
    setBucket("")
    setRequired(false)
    setIsUpdate(false)
  }

  const {data:bucketData,refetch:bucketRefetch} = useQuery<{getBuckets:Bucket[],getBucket:Bucket}>(DEPARTMENT_BUCKET,{
    variables: {dept: deptSelected},
    skip: !deptSelected
  })

  
  useEffect(()=> {
    refetch()
    bucketRefetch()
  },[dept,refetch,bucketRefetch])

  const [createBucket] = useMutation(CREATEBUCKET,{
    onCompleted: async(res) => {
      try {
        await refetch();
        await bucketRefetch();
        setSuccess({
          success: res.createBucket.success,
          message: res.createBucket.message
        })
        setBucket("")
      } catch (error) {
        console.log(error)
      }
    },
  })

  const [updateBucket] = useMutation(UPDATEBUCKET, {
    onCompleted: async(res) => {
      try {
        await refetch();
        await bucketRefetch();
        setSuccess({
          success: res.updateBucket.success,
          message: res.updateBucket.message
        })
        setBucket("")
        setIsUpdate(false)
        setBucketToUpdate({
          id: "",
          name: "",
          dept: ""
        })
      } catch (error) {
        console.log(error)
      }
    },
  })

  const [deleteBucket] = useMutation(DELETEBUCKET, {
    onCompleted: async(res) => {
      try {
        await refetch();
        await bucketRefetch();
        setSuccess({
          success: res.deleteBucket.success,
          message: res.deleteBucket.message
        })
        setBucketToUpdate({
          id: "",
          name: "",
          dept: ""
        })
        setBucket("")
        setIsUpdate(false)
        setRequired(false)
      } catch (error) {
        console.log(error)
      }
    },
  })

  const confirmationFunction: Record<string, (b:Bucket | null) => Promise<void>> = {
    CREATE: async() => {
      try {
        await createBucket({variables: { name:bucket, dept:deptSelected }});
      } catch (error:any) {
        const errorMessage = error?.graphQLErrors?.[0]?.message;
        if (errorMessage?.includes("Duplicate")) {
          setSuccess({
            success: true,
            message: "Bucket already exists"
          })
          setBucket("")
        }
      }
    },
    UPDATE: async(b) => {
      try {
        await updateBucket({variables: {id: b?.id, name:bucket }})
      } catch (error:any) {
        console.log(error)
        const errorMessage = error?.graphQLErrors?.[0]?.message;
        if (errorMessage?.includes("Duplicate")) {
          setSuccess({
            success: true,
            message: "Bucket already exists"
          })
          setConfirm(false)
        }
      }
    },
    DELETE:async (b) => {
      try {
        await deleteBucket({variables: { id: b?.id } })
      } catch (error) {
        console.log(error)
      }
    }
  };
  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE",
    yes: () => {},
    no: () => {}
  })



  const handleSubmit = (action: "CREATE" | "UPDATE" | "DELETE",buck: Bucket | null) => {
    if(action !== "DELETE") {
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
  }

  return (
    <>
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
              newDepts.map((nd,index)=> 
              <div 
                key={index} 
                className={`${nd === deptSelected && "bg-slate-200"} text-base uppercase font-medium text-slate-500 p-2 border-b border-slate-300 last:border-b-0 hover:bg-slate-100 cursor-pointer`}
                onClick={()=> handleSelectDept(nd)}
              >
                <p>{nd}</p>
              
              </div>
              )
            }
            
          </div>
          <div className="w-96 h-80 rounded-xl border border-slate-300 p-2 overflow-y-auto">
            {
              bucketData?.getBuckets.map((b) => 
                <div key={b.id}
                  className="text-base uppercase font-medium text-slate-500 p-2 border-b border-slate-300 last:border-b-0 hover:bg-slate-100 cursor-pointer flex justify-between "
                >
                  <p>
                    {b.name}
                  </p>
                  <div className="flex text-2xl gap-2">
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
            placeholder="Enter bucket name"
            onChange={(e)=> setBucket(e.target.value)}
            className={`${required ? "bg-red-50 border-red-300": "bg-gray-50 border-gray-300" }  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}  
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
                        dept: ""
                      });
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
    </>
  )
}

export default BucketSection
