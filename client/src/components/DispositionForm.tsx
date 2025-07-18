import {   useCallback, useEffect, useMemo, useRef, useState } from "react"
import Confirmation from "./Confirmation"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../redux/store"
import { gql, useMutation, useQuery } from "@apollo/client"


import { setDeselectCustomer, setServerError, setSuccess } from "../redux/slices/authSlice"

type Data = {
  amount: string;
  payment: string;
  disposition: string;
  payment_date: string;
  payment_method: string;
  ref_no: string;
  comment: string;
  contact_method: string;
  dialer: Dialer;
}

type Disposition = {
  id: string;
  name: string;
  code: string;
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

type Success = {
  success: boolean;
  message: string;
}

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
type TL = {
  _id: string;
  name: string;
}

enum Dialer  {
  VICI = "vici",
  ISSABEL = "issabel",
  INBOUND = 'inbound',
  NOT = ""
}

type Props = {
  updateOf: ()=> void
}

const IFBANK = ({label}:{label:string})=> {
  return (
    <div className="flex flex-col lg:flex-row items-center">
      <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4 ">{label}</p>
      <div className=" rounded-lg bg-slate-400 border border-gray-400 text-xs lg:text-sm p-4 w-full">
      </div>
    </div>
  )
}


const DispositionForm:React.FC<Props> = ({updateOf}) => {
  const {selectedCustomer, userLogged} = useSelector((state:RootState)=> state.auth)
  const [selectedDispo, setSelectedDispo] = useState<string>('')
  const dispatch = useAppDispatch()
  const [data, setData] = useState<Data>({
    amount: "",
    payment: "",
    disposition: "",
    payment_date: "",
    payment_method: "",
    ref_no: "",
    comment: "",
    contact_method: "",
    dialer: Dialer.NOT
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
        contact_method: "calls",
        dialer: Dialer.NOT
      })
    }
  },[selectedCustomer])

  const {data:disposition} = useQuery<{getDispositionTypes:Disposition[]}>(GET_DISPOSITION_TYPES)

  const dispoObject:{[key:string]:string} = useMemo(()=> {
    const d = disposition?.getDispositionTypes || []
    return Object.fromEntries(d.map(e=> [e.code, e.id]))
  },[disposition])


  const [createDisposition] = useMutation<{createDisposition:Success}>(CREATE_DISPOSITION,{
    onCompleted: (res) => {
      dispatch(setSuccess({
        success: res.createDisposition.success,
        message: res.createDisposition.message
      }))
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
        contact_method: "calls",
        dialer: Dialer.NOT
      })
      updateOf()
      dispatch(setDeselectCustomer())
    },
    onError: () => {
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
        contact_method: "calls",
        dialer: Dialer.NOT
      })
      updateOf()
      dispatch(setDeselectCustomer())

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

  const creatingDispo = useCallback(async()=> {
    await createDisposition({variables: { input: {...data, customer_account: selectedCustomer._id} }})
  },[data, selectedCustomer, createDisposition])

  const noCallback = useCallback(()=> {
    setConfirm(false)
  },[])

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
        yes: creatingDispo,
        no: noCallback
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
      dispatch(setSuccess({
        success: res.tlEscalation.success,
        message: res.tlEscalation.message
      }))
      await deselectTask({variables: {id:selectedCustomer._id}})
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })
  const [escalateTo, setEscalateTo] = useState<boolean>(false)
  const [caToEscalate, setCAToEscalate] = useState<string>("")
  const [selectedTL, setSelectedTL] = useState<string>("")

  const tlEscalationCallback = useCallback(async()=> {
    await tlEscalation({variables: {id:caToEscalate, tlUserId: selectedTL}})
  },[caToEscalate, selectedTL])

  const handleSubmitEscalation = ()=> {
    setConfirm(true)
    setModalProps({
      message: "Do you want to transfer this to your team leader?",
      toggle: "ESCALATE",
      yes: tlEscalationCallback,
      no: noCallback
    })
  }
  const {data:tlData} = useQuery<{getBucketTL:TL[]}>(USER_TL)

  const callbackTLEscalation = useCallback(async(id:string)=> {
     await tlEscalation({variables: {id, tlUserId: tlData?.getBucketTL.flat()}})
  },[tlData?.getBucketTL, tlEscalation ])

  const handleSubmitEscalationToTl = async(id:string) => {
    if(tlData &&  tlData?.getBucketTL.length > 1) {
      setEscalateTo(true)
      setCAToEscalate(id)
    } else {
      setConfirm(true)
      setModalProps({
        message: "Do you want to transfer this to your team leader?",
        toggle: "ESCALATE",
        yes:() => callbackTLEscalation(id),
        no: noCallback
      })
    }
  }

  const anabledDispo = ["PAID","PTP","UNEG"]
  const requiredDispo = ["PAID",'PTP']
  const highUser = ['TL','MIS']

  const contactMethod = highUser.includes(userLogged.type) ? ['calls','sms','email','skip','field'] : (userLogged.account_type === 'caller' ? ['calls','sms','email','field'] : [ userLogged.account_type ])
  return  (
    <>
      {
        escalateTo &&
        <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-[1px] z-50 flex items-center justify-center ">
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
        <h1 className="text-center font-bold text-slate-600 lg:text-base 2xl:text-lg mb-5">Customer Disposition</h1>
        {
          selectedCustomer._id &&

          <div className="flex lg:gap-10 gap-5 justify-center">
            <div className="flex flex-col gap-2 w-full">
              <label className="flex flex-col lg:flex-row items-center">
                <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4">Disposition</p>
                <select 
                  name="disposition" 
                  id="disposition" 
                  value={selectedDispo}
                  required
                  onChange={(e) => {
                    setData({...data, disposition: dispoObject[e.target.value]}); 
                    setSelectedDispo(e.target.value)}
                  }
                  className={`${required && !data.disposition ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"}  w-full border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs lg:text-sm p-2 `}>
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
                <label className="flex flex-col lg:flex-row items-center">
                  <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4">Amount</p>
                    <div className={`flex border items-center rounded-lg w-full ${required && !data.amount ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"} `}>
                      <p className="px-2">&#x20B1;</p>
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
                        className={`w-full text-xs lg:text-sm  text-gray-900 p-2 outline-none`}/>
                    </div> 
                </label> 
                : 
                <IFBANK label="Amount"/>
              }
              {
                anabledDispo.includes(selectedDispo) ? 
                  <label className="flex flex-col lg:flex-row items-center">
                    <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4">Payment</p>
                    <select 
                      name="payment" 
                      id="payment"
                      required={requiredDispo.includes(selectedDispo)}
                      value={data.payment}
                      onChange={(e)=> setData({...data,payment: e.target.value})}
                      className={`${required && !data.payment ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"} border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs lg:text-sm w-full`}
                      >
                      <option value="">Select Payment</option>
                      <option value="partial">Partial</option>
                      <option value="full">Full payment</option>
                    </select>
                  </label>
                :
                <IFBANK label="Payment"/>
              }
                <label className="flex flex-col lg:flex-row items-center">
                  <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4 ">Contact Method</p>
                  <select 
                    name="contact_method" 
                    id="contact_method"
                    required
                    value={data.contact_method}
                    onChange={(e)=> setData({...data, contact_method: e.target.value})}
                    className={`${required && !data.contact_method ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"}  border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs lg:text-sm w-full`}
                    >
                      <option value="">Select Contact Method</option>
                      {
                        contactMethod.map((e,index)=> 
                          <option key={index} value={e}>{e.toUpperCase()}</option>
                        )
                      }
                  </select>
                </label>
                {
                  data.contact_method === "calls" &&
                  <label className="flex flex-col lg:flex-row items-center">
                    <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4">Dialer</p>
                    <select 
                      name="dialer" 
                      id="dialer"
                      required = {data.contact_method === 'calls'}
                      onChange={(e)=> {
                        if (!Object.values(Dialer).includes(e.target.value as Dialer)) {
                          dispatch(setServerError(true));
                        }
                        setData({...data, dialer: e.target.value as Dialer})
                      }}
                      className={`${required && !data.dialer ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"}  border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs lg:text-sm w-full`}
                      >
                        <option value={Dialer.NOT}>Select Dialer</option>
                        <option value={Dialer.ISSABEL}>Issabel</option>
                        <option value={Dialer.VICI}>Vici</option>
                        <option value={Dialer.INBOUND}>Inbound</option>
                    </select>
                  </label>
                }
            </div>
            <div className="flex flex-col gap-2 w-full"> 
              {
                anabledDispo.includes(selectedDispo) ? 
                <label className="flex flex-col lg:flex-row items-center">
                  <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4">Payment Date</p>
                    <input 
                      type="date" 
                      id="payment_date" 
                      name="payment_date"
                      value={data.payment_date}
                      onChange={(e)=> setData({...data, payment_date: e.target.value})}
                      className={`bg-gray-50 border-gray-500 border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs lg:text-sm w-full`}
                    />
                </label>
                :
                <IFBANK label="Payment Date"/>
              }
              {
                anabledDispo.includes(selectedDispo) ? 
                <label className="flex flex-col lg:flex-row items-center">
                  <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4 ">Payment Method</p>
                  <select 
                    name="payment_method" 
                    id="payment_method" 
                    value={data.payment_method}
                    onChange={(e)=> setData({...data, payment_method: e.target.value})}
                    className={` bg-gray-50  border-gray-500 border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs lg:text-sm w-full p-2`}>
                    <option value="">Select Method</option>
                    <option value="Bank to Bank Transfer">Bank to Bank Transfer</option>
                    <option value="7/11">7/11</option>
                    <option value="Gcash/PAY Maya">Gcash/PAY Maya</option>
                    <option value="CASH">CASH</option>
                  </select>
                </label>
                :
                 <IFBANK label="Payment Method"/>
              }
              {
                anabledDispo.includes(selectedDispo)   ?
                <label className="flex flex-col lg:flex-row items-center">
                  <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4 ">Ref. No</p>
                    <input 
                      type="text" 
                      name="ref" 
                      id="ref"
                      autoComplete="off"
                      value={data.ref_no}
                      placeholder="Enter reference no."
                      onChange={(e)=> setData({...data, ref_no: e.target.value})}
                      className={` bg-gray-50 border-gray-500 border rounded-lg text-xs lg:text-sm w-full p-2`}/>
                </label>
                :
                <IFBANK label="Ref. No"/>
              }
              <label className="flex flex-col lg:flex-row items-center">
                <p className="text-gray-800 font-bold text-start w-full  lg:text-sm text-xs lg:w-2/6 leading-4 ">Comment</p>
                <textarea 
                  name="comment"
                  id="comment"
                  placeholder="Comment here..."
                  value={data.comment}
                  onChange={(e)=> setData({...data, comment: e.target.value})}
                  className="bg-gray-50 border border-gray-500 text-gray-900 rounded-lg h-24 focus:ring-blue-500 focus:border-blue-500 text-xs lg:text-sm w-full p-2 resize-none"  
                ></textarea>

              </label>
            </div>
          </div>
          }
          <div className=" flex justify-end mt-5 gap-5">
            {
              data.disposition &&
              <button 
                type="submit" 
                className={`bg-green-500 hover:bg-green-600 focus:outline-none text-white focus:ring-4 focus:ring-green-400 font-medium rounded-lg px-5 lg:px-5 lg:py-2.5 lg:me-2l lg:mb-2 cursor-pointer lg:text-sm text-xs`}>Submit</button>
            }
            {
              data.disposition && userLogged.type === "AGENT" &&
              <button
                type="button"
                className="bg-red-500 hover:bg-red-600 focus:outline-none text-white  focus:ring-4 focus:ring-red-400 font-medium rounded-lg px-5 py-4 lg:px-5 lg:py-2.5 lg:me-2 lg:mb-2 cursor-pointer lg:text-sm text-xs"
                onClick={()=> handleSubmitEscalationToTl(selectedCustomer._id)}
                >
                TL Escalation
              </button>
            }
          </div>
        </form>
      { confirm &&
        <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default DispositionForm