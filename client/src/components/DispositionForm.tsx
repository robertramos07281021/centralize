import {   useEffect, useRef, useState } from "react"
import Confirmation from "./Confirmation"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../redux/store"
import { gql, useMutation, useQuery } from "@apollo/client"
import { Success } from "../middleware/types"
import SuccessToast from "./SuccessToast"
import { setDeselectCustomer, setServerError } from "../redux/slices/authSlice"

interface Data {
  amount: string
  payment: string
  disposition: string
  payment_date: string
  payment_method: string
  ref_no: string
  comment: string
  contact_method: string
}

interface Disposition {
  id: string
  name: string
  code: string
}

const GET_DISPOSITION_TYPES = gql`
  query Query {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

const CREATE_DISPOSITION = gql`
  mutation CreateDisposition($input: CreateDispo) {
    createDisposition(input:$input) {
      success
      message
    }
  }
`

const TL_ESCATATION = gql`
  mutation TlEscalation($id: ID!, $tlUserId: ID!) {
    tlEscalation(id: $id, tlUserId:$tlUserId) {
      message
      success
    }
  }
`

const DESELECT_TASK = gql`
  mutation deselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`

const USER_TL = gql`
  query GetBucketTL {
    getBucketTL {
      _id
      name
    }
  }

`
interface TL {
  _id: string
  name: string
}


const DispositionForm = () => {
  const {selectedCustomer, userLogged} = useSelector((state:RootState)=> state.auth)

  const [selectedDispo, setSelectedDispo] = useState<string>('')

  const [success, setSuccess] = useState<Success | null>({
    success: false,
    message: ""
  })

  const dispatch = useAppDispatch()

  const [data, setData] = useState<Data>({
    amount: "",
    payment: "",
    disposition: "",
    payment_date: "",
    payment_method: "",
    ref_no: "",
    comment: "",
    contact_method: ""
  })

  useEffect(()=> {
    if(!selectedCustomer._id) {
      setSelectedDispo("")
      setData({
        amount: "",
        payment: "",
        disposition: "",
        payment_date: "",
        payment_method: "",
        ref_no: "",
        comment: "",
        contact_method: "calls"
      })
    }
  },[selectedCustomer])

  const [dispoObject, setDispoObject] = useState<{[key:string]:string}>({})

  const {data:disposition} = useQuery<{getDispositionTypes:Disposition[]}>(GET_DISPOSITION_TYPES)

  useEffect(()=> {
    if(disposition){
      const newObject:{[key:string]:string} = {}
      disposition.getDispositionTypes.forEach((e)=> {
        newObject[e.code] = e.id
      })
      setDispoObject(newObject)
    }
  },[disposition])

  const [createDisposition] = useMutation(CREATE_DISPOSITION,{
    onCompleted: () => {
      setSuccess({
        success: true,
        message: "Disposition successfully created"
      })
      setConfirm(false)
      setSelectedDispo('')
      setData({
        amount: "",
        payment: "",
        disposition: "",
        payment_date: "",
        payment_method: "",
        ref_no: "",
        comment: "",
        contact_method: "calls"
      })
      dispatch(setDeselectCustomer())
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

  const handleOnChangeAmount = (e:React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    inputValue = inputValue.replace(/[^0-9.]/g, '');
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts[1]; 
    }
    if (parts.length === 2) {
      inputValue = parts[0] + '.' + parts[1].slice(0, 2);
    }
    if (inputValue.startsWith('00')) {
      inputValue = '0';
    }
    const amount = parseFloat(inputValue) > selectedCustomer?.balance ? selectedCustomer?.balance.toFixed(2) : inputValue
    const payment = parseFloat(inputValue) > selectedCustomer?.balance ? "full" : "partial"
    setData({...data, amount: amount, payment: payment})
  }

  const Form = useRef<HTMLFormElement | null>(null)
  const [required, setRequired] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "ESCALATE",
    yes: () => {},
    no: () => {}
  })

  const handleSubmitForm = (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if(!Form.current?.checkValidity()) {
      setRequired(true)
    } else {
      setRequired(false)
      setConfirm(true)
      setModalProps({
        message: "Do you want to create the disposition?",
        toggle: "CREATE",
        yes: async() => {
          await createDisposition({variables: { input: {...data, customer_account: selectedCustomer._id} }})
        },
        no: () => {setConfirm(false)}
      })
    }
  }

  const [deselectTask] = useMutation<{deselectTask:Success}>(DESELECT_TASK,{
    onCompleted: ()=> {
      dispatch(setDeselectCustomer()) 
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })

  const [tlEscalation] = useMutation<{tlEscalation:Success}>(TL_ESCATATION,{
    onCompleted: async(res)=> {
      setSuccess({
        success: res.tlEscalation.success,
        message: res.tlEscalation.message
      })
      await deselectTask({variables: {id:selectedCustomer._id}})
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })
  const [escalateTo, setEscalateTo] = useState<boolean>(false)
  const [caToEscalate, setCAToEscalate] = useState<string>("")
  const [selectedTL, setSelectedTL] = useState<string>("")

  const handleSubmitEscalation = ()=> {
    setConfirm(true)
    setModalProps({
      message: "Do you want to transfer this to your team leader?",
      toggle: "ESCALATE",
      yes: async() => {
        await tlEscalation({variables: {id:caToEscalate, tlUserId: selectedTL}})
      },
      no: () => {setConfirm(false)}
    })
  }


  const handleSubmitEscalationToTl = async(id:string) => {
    if(tlData &&  tlData?.getBucketTL.length > 1) {
      setEscalateTo(true)
      setCAToEscalate(id)

    } else {
      setConfirm(true)
      setModalProps({
        message: "Do you want to transfer this to your team leader?",
        toggle: "ESCALATE",
        yes: async() => {
          await tlEscalation({variables: {id, tlUserId: tlData?.getBucketTL.flat()}})
        },
        no: () => {setConfirm(false)}
      })
    }
  }

  const anabledDispo = ["PAID","PTP","UNEG"]
  const requiredDispo = ["PAID",'PTP']
  const highUser = ['TL','MIS']

  const contactMethod = highUser.includes(userLogged.type) ? ['calls','sms','email','skip','field'] : (userLogged.account_type === 'caller' ? ['calls','sms','email'] : [ userLogged.account_type ])


  const {data:tlData} = useQuery<{getBucketTL:TL[]}>(USER_TL)


  return  (
    <>
      {
        success?.success &&
        <SuccessToast successObject={success} close={()=> setSuccess({success:false, message:""})}/>
      }
      {
        escalateTo &&
        <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <div className="w-2/8 h-1/3 border bg-white rounded-lg border-slate-300 shadow-md shadow-black/50 overflow-hidden flex flex-col">
            <h1 className="p-2 bg-red-500 lg:text-sm 2xl:text-base text-white font-bold">Escalate To</h1>
            <div className="w-full h-full flex flex-col items-center justify-center gap-10">
              <select 
                name="tl_account" 
                id="tl_account" 
                onChange={(e)=> {
                  const value = e.target.value
                  const selectedTl:TL | {_id: "", name: ""} =  tlData?.getBucketTL.find(e=> e.name === value) || {_id: "", name: ""}
                    setSelectedTL(selectedTl._id)
                }}
                className="capitalize border p-2  lg:text-sm 2xl:text-lg w-8/10 outline-none border-slate-500 rounded-md text-gray-500">
                <option value="" className="">Select TL</option>
                {
                  tlData?.getBucketTL.map((e)=> 
                    <option 
                      key={e._id} 
                      value={e.name} 
                      className="capitalize"
                    >{e.name}</option> 
                  )
                }
              </select>
              <div className="flex gap-10">
                <button className="rounded-md border py-2 px-4 bg-red-500 text-white font-medium hover:bg-red-700 lg:text-sm 2xl:text-lg " onClick={handleSubmitEscalation}>
                  Submit
                </button>
                <button className="rounded-md border py-2 px-4 bg-slate-500 text-white font-medium hover:bg-slate-700 lg:text-sm 2xl:text-lg " 
                  onClick={()=> setEscalateTo(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

        </div>
      }

      <form ref={Form} className="flex flex-col p-4" noValidate onSubmit={handleSubmitForm}>
        <h1 className="text-center text-lg text-slate-700 font-bold">Customer Disposition</h1>
        {
          selectedCustomer._id &&

        <div className="grid grid-cols-2 lg:gap-5 2xl:gap-10 mt-5 2xl:text-sm lg:text-xs">
          <div className="flex flex-col gap-2">
            <label className="grid grid-cols-4 items-center">
              <p className="text-gray-800 font-bold ">Disposition</p>
              <select 
                name="disposition" 
                id="disposition" 
                value={selectedDispo}
                required
                onChange={(e) => {setData({...data, disposition: dispoObject[e.target.value]}); setSelectedDispo(e.target.value)}}
                className={`${required && !data.disposition ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"}  border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block col-span-3 p-2 `}>
                <option value="">Select Disposition</option>
                {
                  disposition?.getDispositionTypes.map((dispo)=> (
                    <option key={dispo.id} value={dispo.code} >{dispo.name} - {dispo.code}</option>
                  ))
                }
              </select>
            </label>
            {
              anabledDispo.includes(selectedDispo) ? 
              <label className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold ">Amount</p>
                  <div className="relative col-span-3">
                    <input 
                      type="text" 
                      name="amount" 
                      id="amount"
                      autoComplete="off"
                      value={data.amount}
                      onChange={handleOnChangeAmount}
                      pattern="^\d+(\.\d{1,2})?$"
                      placeholder="Enter amount"
                      required={requiredDispo.includes(selectedDispo)}
                      className={`${required && !data.amount ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"} w-full 2xl:text-sm lg:text-xs border  text-gray-900 text-sm rounded-lg pl-8 focus:ring-blue-500 focus:border-blue-500 block p-2 `}/>
                    <p className="absolute top-2 left-4">&#x20B1;</p>
                  </div> 
              </label> 
              : 
              <div className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold ">Amount</p>
                <div className="col-span-3 rounded-lg p-4.5 bg-slate-400 border border-gray-400">
                </div>
              </div>
            }
            {
              anabledDispo.includes(selectedDispo) ? 
                <label className="grid grid-cols-4 items-center">
                   <p className="text-gray-800 font-bold ">Payment</p>
                  <select 
                    name="payment" 
                    id="payment"
                    required={requiredDispo.includes(selectedDispo)}
                    value={data.payment}
                    onChange={(e)=> setData({...data,payment: e.target.value})}
                    className={`${required && !data.payment ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"} border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 col-span-3`}
                    >
                    <option value="">Select Payment</option>
                    <option value="partial">Partial</option>
                    <option value="full">Full payment</option>
                  </select>
                </label>
              :
              <div className="grid grid-cols-4 items-center">
                 <p className="text-gray-800 font-bold ">Payment</p>
                <div className="col-span-3 rounded-lg p-4.5 bg-slate-400 border border-gray-400">
                </div>
              </div>
            }
              <label className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold ">Contact Method</p>
                <select 
                  name="contact_method" 
                  id="contact_method"
                  required
                  value={data.contact_method}
                  onChange={(e)=> setData({...data, contact_method: e.target.value})}
                  className={`${required && !data.contact_method ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"}  border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 col-span-3`}
                  >
                    <option value="">Select Contact Method</option>
                    {
                      contactMethod.map((e,index)=> 
                        <option key={index} value={e}>{e.toUpperCase()}</option>
                      )
                    }
                </select>
              </label>

          </div>
          <div className="flex flex-col gap-2"> 
            {
              anabledDispo.includes(selectedDispo) ? 
              <label className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold">Payment Date</p>
                  <input 
                    type="date" 
                    id="payment_date" 
                    name="payment_date"
                    value={data.payment_date}
                    onChange={(e)=> setData({...data, payment_date: e.target.value})}
                    className={`bg-gray-50 border-gray-500 border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 col-span-3`}
                  />
              </label>
              :
              <div className="grid grid-cols-4 items-center">
                     <p className="text-gray-800 font-bold">Payment Date</p>
                <div className="col-span-3 rounded-lg p-4.5 bg-slate-400 border border-gray-400">
                </div>
              </div>
            }
            {
              anabledDispo.includes(selectedDispo) ? 
              <label className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold ">Payment Method</p>
                <select 
                  name="payment_method" 
                  id="payment_method" 
                  value={data.payment_method}
                  onChange={(e)=> setData({...data, payment_method: e.target.value})}
                  className={` bg-gray-50  border-gray-500 border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 col-span-3`}>
                  <option value="">Select Method</option>
                  <option value="Bank to Bank Transfer">Bank to Bank Transfer</option>
                  <option value="7/11">7/11</option>
                  <option value="Gcash/PAY Maya">Gcash/PAY Maya</option>
                  <option value="CASH">CASH</option>
                </select>
              </label>
              :
              <div className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold ">Payment Method</p>
                <div className="col-span-3 rounded-lg p-4.5 bg-slate-400 border border-gray-400">
                </div>
              </div>
            }
            {
              anabledDispo.includes(selectedDispo)   ?
              <label className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold ">Ref. No</p>
                  <input 
                    type="text" 
                    name="ref" 
                    id="ref"
                    autoComplete="off"
                    value={data.ref_no}
                    placeholder="Enter reference no."
                    onChange={(e)=> setData({...data, ref_no: e.target.value})}
                    className={` bg-gray-50  border-gray-500 p-2.5 border rounded-lg col-span-3`}/>
              </label>
              :
              <div className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold ">Ref. No</p>
                <div className="col-span-3 rounded-lg p-4.5 bg-slate-400 border border-gray-400">
                </div>
              </div>
            }
            <label className="grid grid-cols-4 items-center">
              <p className="text-gray-800 font-bold ">Comment</p>
              <textarea 
                name="comment"
                id="comment"
                placeholder="Comment here..."
                value={data.comment}
                onChange={(e)=> setData({...data, comment: e.target.value})}
                className="bg-gray-50 border border-gray-500 text-gray-900 rounded-lg h-24 focus:ring-blue-500 focus:border-blue-500 block p-2 col-span-3 resize-none"  
              ></textarea>

            </label>
            <div className="ms-5 flex justify-end mt-5">
            {
              data.disposition &&
              <button 
                type="submit" 
                className={`bg-green-500 hover:bg-green-600 focus:outline-none text-white  focus:ring-4 focus:ring-green-400 font-medium rounded-lg px-5 py-2.5 me-2 mb-2 cursor-pointer`}>Submit</button>
            }
            {
              data.disposition && userLogged.type === "AGENT" &&
              <button
                type="button"
                className="bg-red-500 hover:bg-red-600 focus:outline-none text-white  focus:ring-4 focus:ring-red-400 font-medium rounded-lg px-5 py-2.5 me-2 mb-2 cursor-pointer"
                onClick={()=> handleSubmitEscalationToTl(selectedCustomer._id)}
                >
                TL Escalation
              </button>
            }
            </div>
          </div>
        </div>
        }
      </form>
      { confirm &&
        <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default DispositionForm