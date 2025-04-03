import { useRef, useState } from "react"
import Confirmation from "./Confirmation"



const DispositionForm = () => {
  const disposition = ["Bill Dispute","Follow Up Payment","Failed Verification", "Hung Up", "In Capacity To Pay", "Leave Message", "Paid", "Promise To Pay", "RPC Call Back", "Refuse To Pay", "Undernego", "Answering Machine", "Wrong Number", "No Answer"]

  const [data, setData] = useState({
    amount: "",
    payment: "",
    disposition: "",
    payment_date: "",
    payment_method: "",
    ref: "",
    comment: ""
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
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
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
        message: "Do you want to update the disposition?",
        toggle: "UPDATE",
        yes: () => {},
        no: () => {setConfirm(false)}
      })
    }
  }

  return (
    <>
      <form ref={Form} className="flex flex-col" noValidate onSubmit={handleSubmitForm}>
        <h1 className="text-center text-lg text-slate-700 font-bold">Customer Disposition</h1>
        <div className="grid grid-cols-2 gap-10 mt-10">
          <div className="flex flex-col gap-2">
            <label className="flex gap-2 items-center justify-between">
              <p className="text-gray-800 font-bold text-sm">Amount</p>
              <div className="relative">
                <input 
                  type="text" 
                  name="amount" 
                  id="amount"
                  value={data.amount}
                  onChange={handleOnChangeAmount}
                  pattern="[0-9]*"
                  className="bg-gray-50 border border-gray-500 text-gray-900 text-sm rounded-lg pl-8 focus:ring-blue-500 focus:border-blue-500 block w-80 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
                <p className="absolute top-2 left-4">&#x20B1;</p>
              </div>
            </label>
            <label className="flex gap-2 items-center justify-between">
              <p className="text-gray-800 font-bold text-sm">Payment</p>
              <select 
                name="payment" 
                id="payment" 
                value={data.payment}
        
                onChange={(e)=> setData({...data, payment: e.target.value})}
                className="bg-gray-50 border border-gray-500 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                <option value="">Select Payment</option>
                <option value="partial">Partial</option>
                <option value="full">Full</option>
              </select>
            </label>
            <label className="flex gap-2 items-center justify-between">
              <p className="text-gray-800 font-bold text-sm">Disposition</p>
              <select 
                name="disposition" 
                id="disposition" 
                value={data.disposition}
                required
                onChange={(e)=> setData({...data, disposition: e.target.value})}
                className={`${required && !data.disposition ? "bg-red-100  border-red-500" : "bg-gray-50  border-gray-500"}  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}>
                <option value="">Select Disposition</option>
                {
                  disposition.map((dispo,index)=> (
                    <option key={index} value={dispo}>{dispo}</option>
                  ))
                }
              </select>
            </label>
            
          </div>
          <div className="flex flex-col gap-2"> 
            <label className="flex gap-2 items-center justify-between">
              <p className="text-gray-800 font-bold text-sm">Payment Date</p>
              <input 
                type="date" 
                id="payment_date" 
                name="payment_date"
                value={data.payment_date}
                onChange={(e)=> setData({...data, payment_date: e.target.value})}
                className="bg-gray-50 border border-gray-500 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required 
              />
            </label>
            <label className="flex gap-2 items-center justify-between">
              <p className="text-gray-800 font-bold text-sm">Payment Method</p>
              <select 
                name="payment_method" 
                id="payment_method" 
                value={data.payment_method}
                required
                onChange={(e)=> setData({...data, payment_method: e.target.value})}
                className="bg-gray-50 border border-gray-500 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                <option value="">Select Method</option>
                <option value="Bank to Bank Transfer">Bank to Bank Transfer</option>
                <option value="7/11">7/11</option>
                <option value="Gcash/PAY Maya">Gcash/PAY Maya</option>
                <option value="CASH">CASH</option>
              </select>
            </label>
            <label className="flex gap-2 items-center justify-between">
              <p className="text-gray-800 font-bold text-sm">Ref.</p>
              <div className="">
                <input 
                  type="text" 
                  name="ref" 
                  id="ref"
                  value={data.ref}
                  onChange={(e)=> setData({...data, ref: e.target.value})}
                  className="p-1.5 border rounded-lg border-slate-500 w-80"/>
              </div>
            </label>
            <label className="flex gap-2 justify-between">
              <p className="text-gray-800 font-bold text-sm">Comment</p>
              <div className="">
                <textarea 
                  name="comment" 
                  id="comment"
                  value={data.comment}
                  onChange={(e)=> setData({...data, comment: e.target.value})}
                  className="bg-gray-50 border border-gray-500 text-gray-900 text-sm rounded-lg h-24 focus:ring-blue-500 focus:border-blue-500 block w-80 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 resize-none"  
                ></textarea>
              </div>
            </label>
            <div className="ms-5 flex justify-end mt-5">
              <button 
                type="submit" 
                className={`bg-orange-400 hover:bg-orange-500 focus:outline-none text-white  focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 cursor-pointer`}>Submit</button>
            </div>
          </div>
        </div>
      </form>
      { confirm &&
        <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default DispositionForm