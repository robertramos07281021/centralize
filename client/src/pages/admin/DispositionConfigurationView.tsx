import { useMutation, useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useRef, useState } from "react";
import { RiArrowDropDownFill } from "react-icons/ri";
import Confirmation from "../../components/Confirmation";
import SuccessToast from "../../components/SuccessToast";
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";
import { FaEdit } from "react-icons/fa";


interface Bucket {
  _id: string
  name: string
}

const GET_ALL_BUCKET = gql`
  query GetBuckets {
    getAllBucket {
      _id
      name
    }
  }
`

const CREATE_DISPO_TYPE = gql`
  mutation createDispositionType($input: CreatingDispo) {
    createDispositionType(input: $input) {
      success
      message
    }
  }
`

enum Method {
  skipper = "skipper",
  caller = "caller",
  field = "field",
}

interface inpuValueState {
  name: string
  code: string
}

const GET_ALL_DISPO_TYPE = gql`
  query getDispositionTypes {
    getDispositionTypes {
      contact_methods {
        skipper
        caller
        field
      }
      id
      name
      buckets
      code
      active
    }
  }
`
interface CA {
  skipper: boolean
  caller: boolean
  field: boolean
}

interface Dispotype {
  id: string
  name: string
  code: string
  buckets: string[]
  active: boolean
  contact_method: CA
}

const UPDATE_DISPO = gql`
  mutation updateDispositionType($id: ID!, $input: CreatingDispo) {
    updateDispositionType(id: $id, input: $input) {
      success
      message
    }
  }
`


const DispositionConfigurationView = () => {
  const dispatch = useAppDispatch()
  const [bucketObject, setBucketObject] = useState<{[key:string]:string}>({})
  const {data:bucketsData} = useQuery<{getAllBucket:Bucket[]}>(GET_ALL_BUCKET)
  useEffect(()=> {
    if(bucketsData) {
      const newObject:{[key:string]:string} = {}
      bucketsData.getAllBucket.forEach((e)=>
        newObject[e._id] = e.name
      )
      setBucketObject(newObject)
    }
  },[bucketsData])
  const {data:dispotypeData} = useQuery<{getDispositionTypes:Dispotype[]}>(GET_ALL_DISPO_TYPE)
  const [selectingBuckets, setSelectingBuckets] = useState<boolean>(false)
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([])
  const [selectingContactMethod, setSelectingContactMethod] = useState<boolean>(false)
  const [selectedContactMethod, setSelectedContactMethod] = useState<Method[]>([])
  const [confirm, setConfirm] = useState<boolean>(false)
  const [success, setSuccess] = useState({
    success: false,
    message: ""
  }) 
  const [toUpdateDispo, setToUpdateDispo] = useState<Dispotype | null>(null)


  const [dispoData, setDispoData] = useState<Dispotype[]>([])
  const [search, setSearch] =useState<string>('')

  useEffect(()=> {
    if(dispotypeData){
      if(search) {
        const filterDispotype = dispotypeData?.getDispositionTypes.filter((e)=> e.name.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase()))
        setDispoData(filterDispotype)
      } else {
        setDispoData(dispotypeData.getDispositionTypes)
      }

    }
  },[dispotypeData, search])


  const [required, setRequired] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<inpuValueState>({
    name: "",
    code: ""
  })

  const [isUpdate, setIsUpdate] = useState<boolean>(false)
  const form = useRef<HTMLFormElement | null>(null)

  // mutations =====================================
  const [createDispositionType] = useMutation<{createDispositionType:{success: boolean, message: string}}>(CREATE_DISPO_TYPE, {
    onCompleted: (res) => {
      setSuccess({
        success: res.createDispositionType.success,
        message: res.createDispositionType.message
      })
      setInputValue({
        name: "",
        code: ""
      })
      setConfirm(false)
      setSelectedBuckets([])
      setSelectedContactMethod([])
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

  const [updateDispositionType] = useMutation<{updateDispositionType:{success:boolean, message: string}}>(UPDATE_DISPO,{
    onCompleted: (res)=> {
      setSuccess({
        success: res.updateDispositionType.success,
        message: res.updateDispositionType.message
      }),
      setInputValue({
        name: "",
        code: ""
      })
      setConfirm(false)
      setSelectedBuckets([])
      setSelectedContactMethod([])
    },
  })

// =======================


  const contact_methods:Method[] = [Method.caller,Method.field,Method.skipper] as const

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "ACTIVATE" | "DEACTIVATE" ,
    yes: () => {},
    no: () => {}
  })

  const submitActions:Record<string, {message:string, yes:()=> void}> = {
    CREATE: {
      message: "Do you want to add new disposition type?",
      yes: async() => {
        await createDispositionType({variables: {input: {...inputValue, buckets: selectedBuckets, contact_method: selectedContactMethod }}})
      }
    },
    UPDATE: {
      message: "Do you want to update this disposition type?",
      yes: async() => {
        await updateDispositionType({variables: {id: toUpdateDispo?.id, input: {...inputValue, buckets: selectedBuckets, contact_method: selectedContactMethod }}})
      }
    },
    ACTIVATE: {
      message: "Do you want to activate this disposition type?",
      yes: () => {}
    },
    DEACTIVATE: {
      message: "Do you want to deactivate this disposition type?",
      yes: () => {}
    }
  }

  const onSubmit = (e:React.FormEvent,submitToggle:keyof typeof submitActions) => {
    e.preventDefault()
    if(!form.current?.checkValidity() || selectedBuckets.length < 1 || selectedContactMethod.length < 1) {
      setRequired(true)
    } else {
      setConfirm(true)
     setModalProps({
      message: submitActions[submitToggle].message,
      toggle: submitToggle as 'CREATE' | 'UPDATE' | 'ACTIVATE' | 'DEACTIVATE',
      yes: submitActions[submitToggle].yes,
      no: () => { setConfirm(false) }
     }) 
    }
  }

  const bucketRef = useRef<HTMLDivElement | null>(null)
  const contachMethodRef = useRef<HTMLDivElement | null>(null)

  const handleOnUpdate = (dispo: Dispotype) => {
    setToUpdateDispo(dispo)
    setIsUpdate(true)
  }

  useEffect(()=> {
    if(toUpdateDispo) {
      const selectedCA = []
      setInputValue({code: toUpdateDispo.code, name: toUpdateDispo.name})
      setSelectedBuckets(toUpdateDispo.buckets)
      if(toUpdateDispo.contact_method?.caller) {
        selectedCA.push(Method.caller)
      } 
      if(toUpdateDispo.contact_method?.field) {
        selectedCA.push(Method.field)
      }   
      if(toUpdateDispo.contact_method?.skipper) {
        selectedCA.push(Method.skipper)
      } 
      setSelectedContactMethod(selectedCA)
    } else {
      setInputValue({name: "", code: ""})
      setSelectedBuckets([])
      setSelectedContactMethod([])
    }
  },[toUpdateDispo])

  return (
    <>
      {
        success?.success &&
        (<SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>)
      }
      <div className="h-full w-full flex flex-col overflow-hidden p-2" onMouseDown={(e) => 
        { 
          if(!bucketRef.current?.contains(e.target as Node)) {
            setSelectingBuckets(false)
          }
          if(!contachMethodRef.current?.contains(e.target as Node)) {
            setSelectingContactMethod(false)
          }
        }}>
        <h1 className="text-2xl font-medium text-gray-600">Disposition Configuration</h1>
        <div className="w-full h-full flex overflow-hidden">
          <div className="w-full flex-col gap-10 flex items-center justify-center">
            <h1 className="text-xl font-medium text-gray-500">Create Disposition</h1>
            <form 
              className="flex flex-col gap-5 2xl:w-96 lg:w-80" 
              ref={form} 
              noValidate
              onSubmit={(e)=> onSubmit(e,isUpdate ? "UPDATE" : "CREATE" )}
            >
              <label className="flex flex-col">
                <span className="font-medium text-gray-500">Name</span>
                <input 
                  type="text" 
                  name="name" 
                  autoComplete="off"
                  required
                  id="name" 
                  value={inputValue.name}
                  onChange={(e)=> setInputValue({...inputValue, name: e.target.value})}
                  className={`${required && !inputValue.name ? "border-red-500 bg-red-50": "border-slate-500"} border px-2 py-2 rounded-md text-sm outline-none`}/>
              </label>
              <label className="flex flex-col">
                <span className="font-medium text-gray-500">Code</span>
                <input 
                  type="text" 
                  name="code" 
                  autoComplete="off"
                  id="code" 
                  required
                  value={inputValue.code}
                  onChange={(e)=> setInputValue({...inputValue, code: e.target.value})}
                  className={`${required && !inputValue.code ? "border-red-500 bg-red-50": "border-slate-500"} border px-2 py-2 rounded-md text-sm outline-none`}/>
              </label>
              <div className="flex flex-col relative" ref={bucketRef}>
                <span className="font-medium text-gray-500">Buckets</span>
                <div className={`${required && selectedBuckets.length < 1 ?  "bg-red-50 border-red-500":"border-slate-500"} border py-0.5  rounded-md items-center pl-2.5 flex justify-between`}
                  onClick={()=> setSelectingBuckets(!selectingBuckets)}
                >
                  {
                    selectedBuckets.length < 1 ? 
                    <p className="text-sm select-none cursor-default">Select Buckets</p> :
                    <p className="truncate capitalize">{selectedBuckets.map((e)=> bucketObject[e]).join(', ')}</p>
                  }
                  <RiArrowDropDownFill className="text-3xl" />
                </div>
                {
                  selectingBuckets &&
                  <div className="absolute max-h-50 overflow-y-auto bg-white border w-full top-15 border-slate-500 shadow-md shadow-black/50 flex z-50 flex-col px-2 py-1">
                  {
                    bucketsData?.getAllBucket.map(ab=> {
                      const onClick = (e:React.ChangeEvent<HTMLInputElement>) => {
                        if(e.target.checked) {
                          setSelectedBuckets(prev => [...prev, ab._id])
                        } else {
                          setSelectedBuckets(prev => prev.includes(ab._id) ? prev.filter(id => id !== ab._id) : [...prev, ab._id])
                        }
                      }
                      return (
                        <label key={ab._id} className="flex items-center gap-2 select-none">
                          <input 
                            type="checkbox" 
                            name={ab.name} 
                            id={ab.name} 
                            onChange={onClick}
                            checked = {selectedBuckets.includes(ab._id)}
                          />
                          <span>{ab.name}</span>
                        </label>
                      )
                    })
                  }
                  </div>
                }
              </div>
              <div className="flex flex-col relative" ref={contachMethodRef}>
                <span className="font-medium text-gray-500">Contact Method</span>
                <div className={`${required && selectedContactMethod.length < 1 ?  "bg-red-50 border-red-500": "border-slate-500"} border py-0.5  rounded-md items-center pl-2.5 flex justify-between`}
                  onClick={()=> setSelectingContactMethod(!selectingContactMethod)}
                > 
                {
                  selectedContactMethod.length < 1 ? 
              
                  <p className="text-sm select-none cursor-default">Select Contact Method</p> : 
                  <p className="truncate capitalize">
                    {selectedContactMethod.join(', ')}
                  </p>
                }
                <RiArrowDropDownFill className="text-3xl" />
                </div>
                {
                  selectingContactMethod &&
                  <div className="absolute max-h-50 overflow-y-auto bg-white border w-full top-15 border-slate-500 shadow-md shadow-black/50 flex flex-col px-2 py-1">
                  {
                    contact_methods.map((cm: Method, index) => {
                      const onClick = (e:React.ChangeEvent<HTMLInputElement>) => {
                        if(e.target.checked) {
                          setSelectedContactMethod(prev => [...prev, cm])
                        } else {
                          setSelectedContactMethod((prev:Method[]) => prev.includes(cm) ? prev.filter(method => method !== cm) : [...prev, cm])
                        }
                      }
                      return (
                        <label key={index} className="flex items-center gap-2 select-none">
                          <input 
                            type="checkbox" 
                            name={cm} 
                            id={cm} 
                            onChange={onClick}
                            checked = {selectedContactMethod.includes(cm)}
                          />
                          <span className="capitalize">{cm}</span>
                        </label>
                      )
                    })
                  }
                  </div>
                }
              </div>
             
              <div className="flex justify-center gap-5">
                <button type="submit" className={`${isUpdate ? "border-orange-500 bg-orange-500 hover:bg-orange-700": "hover:bg-blue-700 bg-blue-500 border-blue-500"} border   rounded-lg px-5 py-1.5 text-white  font-bold`}>
                  { isUpdate ? "Update" : "Submit"}
                </button>
                {
                  isUpdate &&
                <button type="submit" className={` border border-slate-500 bg-slate-500 hover:bg-slate-700   rounded-lg px-5 py-1.5 text-white  font-bold`} onClick={()=> {
                  setToUpdateDispo(null)
                  setIsUpdate(false)
                }}>
                  Cancel
                </button>

                }
              </div>
            </form>
          </div>

          <div className="w-6/4 overflow-hidden flex items-center justify-center p-10 flex-col">
            <input 
              type="search" 
              name="search" 
              id="search" 
              className="border border-slate-500 rounded-md w-80 rouned text-sm py-1 px-2" placeholder="Search" 
              autoComplete="off" 
              onChange={(e)=> setSearch(e.target.value)}
              value={search}
              />
              <div className="grid grid-cols-5 bg-slate-100 px-2 py-1 font-medium text-gray-600 w-full mt-2">
                <div>Name</div>
                <div>Code</div>
                <div>Buckets</div>
                <div>Contact Method</div>
                <div>Action</div>
              </div>
            <div className="w-full h-full overflow-y-auto rounded-md p-2">
              {
                dispoData.map((dispo)=> {
                  const dispoCA = []
                  if(dispo.contact_method?.caller) {
                    dispoCA.push(Method.caller)
                  }
                  if(dispo.contact_method?.field) {
                    dispoCA.push(Method.field)
                  }
                  if(dispo.contact_method?.skipper) {
                    dispoCA.push(Method.skipper)
                  }

                  return (
                    <div key={dispo.id}className="grid grid-cols-5 text-sm py-1">
                      <div>{dispo.name}</div>
                      <div>{dispo.code}</div>
                      <div className="truncate">{dispo.buckets.map((e)=> bucketObject[e]).join(', ')}</div>
                      <div className="truncate">{dispoCA?.join(', ')}</div>
                      <div><FaEdit className="text-xl text-orange-500 cursor-pointer" onClick={()=> (handleOnUpdate(dispo))}/></div>
                    </div>
                  )
                })
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

export default DispositionConfigurationView