import { useMutation, useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiArrowDropDownFill } from "react-icons/ri";
import Confirmation from "../../components/Confirmation";
import { useAppDispatch } from "../../redux/store";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { FaEdit } from "react-icons/fa";
import ActivationButton from "./ActivationButton";


type Bucket = {
  _id: string
  name: string
  dept: string
}

const GET_ALL_BUCKET = gql`
  query GetBuckets {
    getAllBucket {
      _id
      name
      dept
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

type inpuValueState = {
  name: string
  code: string,
  status: number,
  rank: number
}

const GET_ALL_DISPO_TYPE = gql`
  query getDispositionTypes {
    getDispositionTypes {
      contact_methods {
        skipper
        caller
        field
      }
      rank
      status
      id
      name
      buckets
      code
      active
    }
  }
`
type CA = {
  skipper: boolean
  caller: boolean
  field: boolean
}

type Dispotype = {
  id: string
  name: string
  code: string
  buckets: string[]
  active: boolean
  status: number
  rank: number
  contact_methods: CA
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
  const {data:bucketsData} = useQuery<{getAllBucket:Bucket[]}>(GET_ALL_BUCKET)
  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const buckets = bucketsData?.getAllBucket || []
    return Object.fromEntries(buckets.map(b=> [b._id, b.name]))
  },[bucketsData])

  const {data:dispotypeData, refetch} = useQuery<{getDispositionTypes:Dispotype[]}>(GET_ALL_DISPO_TYPE)
  const [selectingBuckets, setSelectingBuckets] = useState<boolean>(false)
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([])
  const [selectingContactMethod, setSelectingContactMethod] = useState<boolean>(false)
  const [selectedContactMethod, setSelectedContactMethod] = useState<Method[]>([])
  const [confirm, setConfirm] = useState<boolean>(false)
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
    code: "",
    status: 1,
    rank: 0,
  })

  const [isUpdate, setIsUpdate] = useState<boolean>(false)
  const form = useRef<HTMLFormElement | null>(null)

  // mutations =====================================
  const [createDispositionType] = useMutation<{createDispositionType:{success: boolean, message: string}}>(CREATE_DISPO_TYPE, {
    onCompleted: (res) => {
      refetch()
      dispatch(setSuccess({
        success: res.createDispositionType.success,
        message: res.createDispositionType.message
      }))
      setInputValue({
        name: "",
        code: "",
        status: 1,
        rank: 0,
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
      refetch()
      dispatch(setSuccess({
        success: res.updateDispositionType.success,
        message: res.updateDispositionType.message
      })),
      setInputValue({
        name: "",
        code: "",
        status: 1,
        rank: 0,
      })
      setIsUpdate(false)
      setConfirm(false)
      setSelectedBuckets([])
      setSelectedContactMethod([])
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

// =======================


  const contact_methods:Method[] = [Method.caller,Method.field,Method.skipper] as const

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "ACTIVATE" | "DEACTIVATE" ,
    yes: () => {},
    no: () => {}
  })

  const creatingDispoType = useCallback(async()=> {
    await createDispositionType({variables: {input: {...inputValue, buckets: selectedBuckets, contact_method: selectedContactMethod }}})
  },[inputValue, selectedBuckets, selectedContactMethod, createDispositionType])

  const updatingDispoType = useCallback(async()=> {
    await updateDispositionType({variables: {id: toUpdateDispo?.id, input: {...inputValue, buckets: selectedBuckets, contact_method: selectedContactMethod }}})
  },[selectedBuckets, selectedContactMethod, updateDispositionType, inputValue, toUpdateDispo])

  const submitActions:Record<string, {message:string, yes:()=> void}> = {
    CREATE: {
      message: "Do you want to add new disposition type?",
      yes: creatingDispoType
    },
    UPDATE: {
      message: "Do you want to update this disposition type?",
      yes: updatingDispoType
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

  const onSubmit = useCallback((e:React.FormEvent,submitToggle:keyof typeof submitActions) => {
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
  },[form, selectedBuckets, selectedContactMethod, setRequired, setConfirm, setModalProps, submitActions])

  const bucketRef = useRef<HTMLDivElement | null>(null)
  const contachMethodRef = useRef<HTMLDivElement | null>(null)

  const handleOnUpdate = useCallback((dispo: Dispotype) => {
    setToUpdateDispo(dispo)
    setIsUpdate(true)
  },[setToUpdateDispo,setIsUpdate])

  useEffect(()=> {
    if(toUpdateDispo) {
      const selectedCA = []
      setInputValue({code: toUpdateDispo.code, name: toUpdateDispo.name, status: toUpdateDispo.status, rank: toUpdateDispo.rank ?? 0})
      setSelectedBuckets(toUpdateDispo.buckets)
      if(toUpdateDispo.contact_methods?.caller) {
        selectedCA.push(Method.caller)
      } 
      if(toUpdateDispo.contact_methods?.field) {
        selectedCA.push(Method.field)
      }   
      if(toUpdateDispo.contact_methods?.skipper) {
        selectedCA.push(Method.skipper)
      } 
      setSelectedContactMethod(selectedCA)
    } else {
      setInputValue({name: "", code: "", status: 1, rank: 0})
      setSelectedBuckets([])
      setSelectedContactMethod([])
    }
  },[toUpdateDispo])

  const handleCheckAll = useCallback((e:React.ChangeEvent<HTMLInputElement>)=> {
    if(e.target.checked) {
      const bucketsIds:string[] = bucketsData?.getAllBucket.map((e)=> e._id) || []
      setSelectedBuckets(bucketsIds)
    } else {
      setSelectedBuckets([])
    }
  },[setSelectedBuckets, bucketsData])


  return (
    <>
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
            {
              isUpdate ? 
                <h1 className="text-xl font-medium text-gray-500">Update Disposition</h1>
              :
                <h1 className="text-xl font-medium text-gray-500">Create Disposition</h1>
            }
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
                  onChange={(e)=> setInputValue(prev=> ({...prev, name: e.target.value}))}
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
                  onChange={(e)=> setInputValue(prev=> ({...prev, code: e.target.value}))}
                  className={`${required && !inputValue.code ? "border-red-500 bg-red-50": "border-slate-500"} border px-2 py-2 rounded-md text-sm outline-none`}/>
              </label>

              <div className="flex gap-5">
                <fieldset className="border border-slate-500 text-gray-500 rounded-xl p-2 flex gap-2 w-full">
                  <legend className="px-1">Status</legend>
                  <label className="flex items-center gap-2">
                    <input 
                    type="radio" 
                    name="status" 
                    checked={inputValue.status === 1} 
                    value={1}
                    onChange={(e)=> setInputValue(prev => ({...prev,status: Number(e.target.value)}))} />
                    <p>Positive</p>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={inputValue.status === 0} 
                      value={0} id="status" 
                      onChange={(e)=> setInputValue(prev => ({...prev,status: Number(e.target.value)}))}/>
                    <p>Negative</p>
                  </label>
                </fieldset>


                <label className="w-full">
                  <p>Rank</p>
                  <select name="rank" id="rank" className="border w-full p-2 rounded-md border-slate-500 text-gray-500"
                    value={inputValue.rank ?? ""}
                    onChange={(e)=> setInputValue(prev=> ({...prev, rank: Number(e.target.value)}))}
                  > 
                    <option value="">0</option>
                    {
                      Array.from({length: 20}).map((_,index)=> {
                        return <option value={index + 1} key={index}>{index + 1}</option>
                      })
                    }

                  </select>


                </label>

              </div>

              <div className="flex flex-col relative cursor-default" ref={bucketRef}>
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
                  <label className="flex items-center gap-2 select-none">
                    <input 
                      type="checkbox" 
                      name="all"
                      id='all' 
                      onChange={handleCheckAll}
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                  </label>
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
                          <span className="text-sm text-gray-600">{ab.name} - {ab.dept}</span>
                        </label>
                      )
                    })
                  }
                  </div>
                }
              </div>
              <div className="flex flex-col relative cursor-default" ref={contachMethodRef}>
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
                          <span className="capitalize text-gray-600">{cm}</span>
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
              <div className="grid grid-cols-8 bg-slate-100 px-2 py-1 font-medium text-gray-600 w-full mt-2">
                <div className="col-span-2">Name</div>
                <div>Code</div>
                <div>Rank</div>
                <div>Status</div>
                <div>Buckets</div>
                <div>Contact Method</div>
                <div>Action</div>
              </div>
            <div className="w-full h-full overflow-y-auto rounded-md p-2 cursor-default select-none">
              {
                dispoData.map((dispo)=> {
                  const dispoCA = []
                  if(dispo.contact_methods?.caller) {
                    dispoCA.push(Method.caller)
                  }
                  if(dispo.contact_methods?.field) {
                    dispoCA.push(Method.field)
                  }
                  if(dispo.contact_methods?.skipper) {
                    dispoCA.push(Method.skipper)
                  }

                  return (
                    <div key={dispo.id}className="grid grid-cols-8 text-sm py-1 hover:bg-blue-50 even:bg-slate-50 text-gray-600 items-center">
                      <div className="nowrap truncate col-span-2">{dispo.name}</div>
                      <div>{dispo.code}</div>
                      <div>{dispo.rank}</div>
                      <div>{dispo.status === 1 ? "Positive" : "Negative"}</div>
                      <div className="truncate" title={dispo.buckets.map((e)=> bucketObject[e]).join(', ')}>{dispo.buckets.map((e)=> bucketObject[e]).join(', ')}</div>
                      <div className="truncate capitalize" title={dispoCA?.join(', ')}>{dispoCA?.join(', ')}</div>

                      <div className="flex gap-5">
                        <FaEdit className="text-xl text-orange-500 cursor-pointer" onClick={()=> (handleOnUpdate(dispo))}/>
                        <ActivationButton id={dispo.id} active={dispo.active} refetch={()=> refetch()} />
                      </div>
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