import {   useRef, useState } from "react"
import Confirmation from "./Confirmation"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../redux/store"
import { gql, useMutation, useQuery } from "@apollo/client"
import { Success } from "../middleware/types"
import SuccessToast from "./SuccessToast"
import { setSelectedCustomer, setSettled } from "../redux/slices/authSlice"


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
  mutation CreateDisposition($customerAccountId: ID!, $disposition: String!, $amount: String, $payment: String, $payment_date: String, $payment_method: String, $ref_no: String, $comment: String) {
    createDisposition(customerAccountId: $customerAccountId, disposition: $disposition, amount: $amount, payment: $payment, payment_date: $payment_date, payment_method: $payment_method, ref_no: $ref_no, comment: $comment) {
      success
      message
    }
  }
`

const DispositionForm = () => {
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
 
  const [success, setSuccess] = useState<Success | null>({
    success: false,
    message: ""
  })

  const dispatch = useAppDispatch()

  const [data, setData] = useState({
    amount: "",
    payment: "",
    disposition: "",
    payment_date: "",
    payment_method: "",
    ref_no: "",
    comment: ""
  })


  const {data:disposition} = useQuery<{getDispositionTypes:Disposition[]}>(GET_DISPOSITION_TYPES)

  const [createDisposition] = useMutation(CREATE_DISPOSITION,{
    onCompleted: async() => {
      try {
        setSuccess({
          success: true,
          message: "Disposition successfully created"
        })
        setConfirm(false)
        dispatch(setSettled(false))
        setData({
          amount: "",
          payment: "",
          disposition: "",
          payment_date: "",
          payment_method: "",
          ref_no: "",
          comment: ""
        })
        dispatch(setSelectedCustomer({
          _id: "",
          case_id: "",
          account_id: "",
          endorsement_date: "",
          credit_customer_id: "",
          bill_due_day: 0,
          max_dpd: 0,
          balance: 0,
          paid_amount: 0,
          out_standing_details: {
            principal_os: 0,
            interest_os: 0,
            admin_fee_os: 0,
            txn_fee_os: 0,
            late_charge_os: 0,
            dst_fee_os: 0,
            total_os: 0
          },
          grass_details: {
            grass_region: "",
            vendor_endorsement: "",
            grass_date: ""
          },
          account_bucket: {
            name: "",
            dept: ""
          },
          customer_info: {
            fullName:"",
            dob:"",
            gender:"",
            contact_no:[],
            emails:[],
            addresses:[],
            _id:""
          }
        }))
      } catch (error) {
        console.log(error)
      }
    },
  })

  const handleOnChangeAmount = (e:React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    inputValue = inputValue.replace(/\D/g,"");
    inputValue = inputValue.replace(/^0+/,"") || "0"
    setData({...data, amount: inputValue})
  }

  const Form = useRef<HTMLFormElement | null>(null)
  const [required, setRequired] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT" | "UPLOADED",
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
        toggle: "UPLOADED",
        yes: async() => {
          try {
            await createDisposition({variables: {
              ...data,
              customerAccountId:selectedCustomer._id}})
          } catch (error) {
            console.log(error)
          }
        },
        no: () => {setConfirm(false)}
      })
    }
  }

  const handleChangeDisposition = (value:string) => {
    if(value === "SETTLED") {
      setData({...data, disposition: value, amount: selectedCustomer.balance.toString(), payment: "full"})
    } else if(value === "PAID") {
      setData({...data, disposition: value, payment: "partial"})
    } else {
      setData({...data, disposition: value, payment: "" , amount: ""})
      setRequired(false)
    }
  }


  return  (
    <>
      {
        success?.success &&
        <SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>
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
                value={data.disposition}
                required
                onChange={(e) => handleChangeDisposition(e.target.value)}
                className={`${required && !data.disposition ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"}  border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block col-span-3 p-2 `}>
                <option value="">Select Disposition</option>
                {
                  disposition?.getDispositionTypes.map((dispo)=> (
                    <option key={dispo.id} value={dispo.name} >{dispo.name} - {dispo.code}</option>
                  ))
                }
              </select>
            </label>
            {
              data.disposition === "PAID" || data.disposition === "SETTLED" ? 
              <label className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold ">Amount</p>
                  <div className="relative col-span-3">
                    <input 
                      type="text" 
                      name="amount" 
                      id="amount"
                      value={data.amount}
                      onChange={handleOnChangeAmount}
                      pattern="[0-9]*"
                      disabled={data.disposition === "SETTLED"}
                      placeholder="Enter amount"
                      required={data.disposition === "PAID" || data.disposition === "SETTLED"}
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
              data.disposition === "PAID" ||  data.disposition === "SETTLED" ? 
              <label className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold ">Payment</p>
                  <div 
                    className={`bg-gray-50 border-gray-500 border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block col-span-3 p-2 capitalize`}>
                    {data.payment}
                  </div>
              </label>  
              :
              <div className="grid grid-cols-4 items-center">
                 <p className="text-gray-800 font-bold ">Payment</p>
                <div className="col-span-3 rounded-lg p-4.5 bg-slate-400 border border-gray-400">
                </div>
              </div>
            }
          </div>
          <div className="flex flex-col gap-2"> 
            {
              data.disposition === "PAID" ||  data.disposition === "SETTLED" ? 
              <label className="grid grid-cols-4 items-center">
                <p className="text-gray-800 font-bold">Payment Date</p>
                  <input 
                    type="date" 
                    id="payment_date" 
                    name="payment_date"
                    required={data.disposition === "PAID" ||  data.disposition === "SETTLED"}
                    value={data.payment_date}
                    onChange={(e)=> setData({...data, payment_date: e.target.value})}
                    className={`${required && !data.payment_date ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"} border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 col-span-3`}
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
                data.disposition === "PAID" ||  data.disposition === "SETTLED" ? 
                <label className="grid grid-cols-4 items-center">
                  <p className="text-gray-800 font-bold ">Payment Method</p>
                    <select 
                      name="payment_method" 
                      id="payment_method" 
                      value={data.payment_method}
                      required={data.disposition === "PAID" ||  data.disposition === "SETTLED"}
                      onChange={(e)=> setData({...data, payment_method: e.target.value})}
                      className={`${required && !data.payment_date ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"} border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 col-span-3`}>
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
                data.disposition === "PAID" ||  data.disposition === "SETTLED" ?
                <label className="grid grid-cols-4 items-center">
                  <p className="text-gray-800 font-bold ">Ref. No</p>
                    <input 
                      type="text" 
                      name="ref" 
                      id="ref"
                      required={data.disposition === "PAID" ||  data.disposition === "SETTLED"}
                      value={data.ref_no}
                      placeholder="Enter reference no."
                      onChange={(e)=> setData({...data, ref_no: e.target.value})}
                      className={`${required && !data.payment_date ? "bg-red-100 border-red-500" : "bg-gray-50  border-gray-500"} p-2.5 border rounded-lg col-span-3`}/>
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