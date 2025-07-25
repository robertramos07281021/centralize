/* eslint-disable @typescript-eslint/no-explicit-any */
import { gql, useMutation, useQuery } from "@apollo/client"
import {  useCallback, useRef, useState } from "react"
import { PiNotePencilBold, PiTrashFill  } from "react-icons/pi";
import Confirmation from "../../components/Confirmation"
import { useAppDispatch } from "../../redux/store";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";


const BRANCH_QUERY = gql`
  query branchQuery {
    getBranches {
      id
      name
    }
  } 
`
const CREATEBRANCH = gql`mutation createBranch($name: String!) {
  createBranch(name:$name) {
    success
    message
  }
}
`
const UPDATEBRANCH = gql`mutation updateBranch($name: String!, $id: ID!) {
  updateBranch(name:$name, id: $id) {
    success
    message
  }
  }
`
const DELETEBRANCH = gql`mutation deleteBranch($id: ID!) {
  deleteBranch(id:$id) {
    success
    message
  } 
}
`

type Branch = {
  id:string
  name: string
}

const BranchSection = () => {

  const {data,refetch} = useQuery<{getBranches:Branch[]}>(BRANCH_QUERY)
  const dispatch = useAppDispatch()

  const form = useRef<HTMLFormElement | null>(null)
  const [name, setName] = useState<string>("")
  const [isUpdate,setIsUpdate] = useState<boolean>(false)
  const [required, setRequired] = useState<boolean>(false)
  const [confirm, setConfirm] = useState<boolean>(false)
  const [branchToUpdate, setBranchToUpdate] = useState<Branch | null>(null)


  const [createBranch] = useMutation(CREATEBRANCH,{
    onCompleted: async() => {
      await refetch();
      dispatch(setSuccess({
        success: true,
        message: "Branch successfully created"
      }))
      setName("")
    },
    onError: (error) => {
      const errorMessage = error.message;
      if (errorMessage?.includes("E11000")) {
        dispatch(setSuccess({
          success: true,
          message: "Branch already exists"
        }))
        setName("")
        setConfirm(false)
      } else {
        dispatch(setServerError(true))
      }
    }
  })

  const [updateBranch] = useMutation(UPDATEBRANCH, {
    onCompleted: async() => {
      try {
        const res = await refetch();
        if(res.data) {
          dispatch(setSuccess({
            success: true,
            message: "Branch successfully updated"
          }))
        }
      } catch (error) {
        dispatch(setServerError(true))
      }
      setName("")
      setIsUpdate(false)
      setBranchToUpdate(null)
    },
    onError: (error) => {
    const errorMessage = error.message;
      if (errorMessage?.includes("E11000")) {
        dispatch(setSuccess({
          success: true,
          message: "Branch already exists"
        }))
        setConfirm(false)
      } else {
        dispatch(setServerError(true))
      }
    }
  })

  const [deleteBranch] = useMutation(DELETEBRANCH, {
    onCompleted: async() => {
      try {
        const res = await refetch();
        if(res.data) {
          dispatch(setSuccess({
            success: true,
            message: "Branch successfully deleted"
          }))
        }
      } catch (error) {
        dispatch(setServerError(true))
      }
      setName("")
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

  const creatingBranch = useCallback(async()=> {
    await createBranch({variables: { name }});
  },[createBranch, name])

  const updatingBranch = useCallback(async()=> {
      await updateBranch({variables: {id: branchToUpdate?.id, name}})
  },[branchToUpdate, name, updateBranch])

  const deletingBranch = useCallback(async(branch?:Branch)=> {
    if (!branch) return;
    await deleteBranch({variables: { id: branch.id } })
    setBranchToUpdate(null)
  },[deleteBranch, setBranchToUpdate])

  const confirmationFunction: Record<string, (branch?:Branch) => Promise<void>> = {
    CREATE: creatingBranch,
    UPDATE: updatingBranch,
    DELETE: deletingBranch
  };

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" ,
    yes: () => {},
    no: () => {}
  })

  const handleUpdateBranch = useCallback((branch:Branch) => {
    setIsUpdate(true)
    setBranchToUpdate(branch)
    setName(branch.name)
  },[setIsUpdate,setBranchToUpdate,setName])

  const handleSubmitForm = useCallback((e:React.FormEvent<HTMLFormElement> | null,action: "CREATE" | "UPDATE" | "DELETE" | "LOGOUT") => {
    if(e) {
      e.preventDefault()
    }
    if(!form?.current?.checkValidity()) {
      setRequired(true)
    } else {
      setConfirm(true)

      if(action === "CREATE") {
        setRequired(false)
        setModalProps({
          no:()=> setConfirm(false),
          yes:() => { confirmationFunction[action]?.(); setConfirm(false);},
          message: "Are you sure you want to add this branch?",
          toggle: action
        })
      } else if( action === "UPDATE") {
        setRequired(false)
        setModalProps({
          no:()=> setConfirm(false),
          yes:() => { confirmationFunction[action]?.(); setConfirm(false); },
          message: "Are you sure you want to update this branch?",
          toggle: action
        })  
      } 
    }
  },[setModalProps,setRequired,confirmationFunction,setConfirm,form])

  return (
    <div className="relative">
      <div className="px-20">
        <div className="inline-flex items-center justify-center w-full">
            <hr className="w-full h-1 my-8 bg-gray-200 border-0 rounded-sm dark:bg-gray-700"/>
            <div className="absolute px-4 -translate-x-1/2 bg-white left-1/2 dark:bg-gray-900"> 
              <h1 className="font-medium text-2xl text-slate-600">Branch</h1>
            </div>
        </div>
        <div className="flex gap-10 justify-center">
          <div className="h-100 py-2 w-96 border rounded-xl border-slate-300 overflow-y-auto px-4">
            {
              data?.getBranches?.map((branch) => 
                <div key={branch.id} className="flex justify-between px-2 py-2 border-b border-slate-300 last:border-b-0 hover:bg-slate-200/60">
                  <p className="uppercase font-medium text-slate-500">
                    {branch.name}
                  </p>
                  <div className="flex text-2xl gap-2">
                    <PiNotePencilBold className="text-green-400 cursor-pointer hover:text-green-600" onClick={()=> handleUpdateBranch(branch)}/>
                    <PiTrashFill  className="text-red-400 hover:text-red-600 cursor-pointer"
                    onClick={()=> { 
                      setConfirm(true);
                      setModalProps({
                        no:()=> setConfirm(false),
                        yes:async() => { 
                          if(branch){ await confirmationFunction["DELETE"](branch)}; 
                          setConfirm(false)
                        },
                        message: "Are you sure you want to delete this branch?",
                        toggle: "DELETE"
                    })}}
                    />
                  </div>
                </div>
              )
            }
          </div>

          <form ref={form} onSubmit={(e)=> handleSubmitForm(e,isUpdate ? "UPDATE" : "CREATE")} className="w-96 flex flex-col gap-5" noValidate>
            {
              isUpdate ?
              <h1 className="text-base font-medium text-slate-500">Update Branch</h1> :
              <h1 className="text-base font-medium text-slate-500">Add Branch</h1>
            }
            <input 
            type="text"
            name="name"
            id="name"
            autoComplete="name"
            value={name}
            required
            placeholder="Enter name"
            onChange={(e)=> setName(e.target.value)}
            className={`${required ? "bg-red-100 border-red-300 " : "bg-gray-50 border-gray-300 "} border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-96 p-2.5 `}  
            />
            <div className="flex gap-5">
              <button type="submit" className={`${isUpdate ? "bg-orange-400 hover:bg-orange-500" : " bg-blue-700 hover:bg-blue-800"} focus:outline-none text-white  focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}>{!isUpdate ? "Create" : "Update"}</button>
              {
                isUpdate &&
                <button type="button" className={` bg-slate-400 hover:bg-slate-500 focus:outline-none text-white  focus:ring-4 focus:ring-slate-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`} onClick={()=> {setIsUpdate(false); setName("")}}>Cancel</button>
              }
            </div>
          </form>
        </div>
      </div>
      { confirm &&
        <Confirmation {...modalProps}/>
      }

    </div>
  )
}

export default BranchSection
