import { useEffect, useRef, useState } from "react";
import { CiSquarePlus, CiSquareMinus } from "react-icons/ci";
import Confirmation from "./Confirmation";
import { useMutation } from "@apollo/client";
import { UPDATE_CUSTOMER } from "../apollo/mutations";

import {  useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

interface CustomerUpdateFormProps {
  cancel: () => void, 
}

const CustomerUpdateForm:React.FC<CustomerUpdateFormProps> = ({cancel}) => {
  const navigate = useNavigate()
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  // mobile =======================================================================
  const [mobiles, setMobiles] = useState<string[]>([""])

  const handleAddMobile = () => {
    setMobiles([...mobiles, ""])
  }

  const validatePhone = (phone: string): boolean => /^09\d{9}$/.test(phone);

  const handleMinusMobile = (index: number) => {
    if (mobiles.length > 1) {
      setMobiles(mobiles.filter((_, i) => i !== index));
    }
  };

  const handleMobileOnchange = (index:number, value:string) => {
    const newMobile = [...mobiles];
    newMobile[index] = value
    setMobiles(newMobile)
  }
  // email address ======================================================================
  const [emails, setEmails] = useState<string[]>([""])

  const handleAddEmail = () => {
    setEmails([...emails,""])
  }
  const validateEmail = (email: string): boolean=>  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())

  console.log(validateEmail("robert.ramos07281021@gmail.com"))
  const handleEmailOnchange = (index:number, value: string) => {
    const newEmail = [...emails];
    newEmail[index] = value;
    setEmails(newEmail)
  }
  
  const handleMinusEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  //address =====================================================================================

  const [address, setAddress] = useState<string[]>([""])

  const handleAddAddress = () => {
    setAddress([...address,""])
  }

  const handleAddressOnchange = (index:number, value: string) => {
    const newAddress = [...address];
    newAddress[index] = value
    setAddress(newAddress)
  }

  const handleMinusAddress = (index: number) => {
    if(address.length > 1){
      setAddress(address.filter((_,i)=> i !== index))
    }
  }

  // customer data
  const [data, setData] = useState({
    fullName: "",
    dob: "",
    gender: ""
  })

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
    yes: () => {},
    no: () => {}
  })

  const [confirm, setConfirm] = useState(false)

  const [required, setRequired] = useState(false)
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER, {
    onCompleted: async(res) => {
      try {
        cancel()
        navigate(`${location.pathname}?success=true`,{ state: { ...res.updateCustomer.customer} })
      } catch (error) {
        console.log(error)
      }
    },
  })
  const updateForm = useRef<HTMLFormElement | null>(null)
  const handleSubmitUpdateForm = (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if(!updateForm?.current?.checkValidity()) {
      setRequired(true)
    } else {
      setRequired(false)
      setConfirm(true)
      setModalProps({
        message: "Are you sure you want to update this customer profile?",
        toggle: "UPDATE" ,
        yes: async() => {
          try {
            await updateCustomer({variables: {...data, mobiles: mobiles, emails: emails, addresses: address, id:selectedCustomer._id}})
            setConfirm(false)
          } catch (error) {
            console.log(error)
          }
        },
        no: () => {setConfirm(false)}
      })
    }
  }

  useEffect(()=> {
    if(selectedCustomer) {
      setData({
        fullName:selectedCustomer.customer_info.fullName,
        dob: selectedCustomer.customer_info.dob,
        gender: selectedCustomer.customer_info.gender
      })
      setMobiles((prevMobiles) => [
        ...prevMobiles.filter(m => m !== ""),
        ...(selectedCustomer.customer_info.contact_no ?? [])
      ]);
      setAddress((prevAddress) => [
        ...prevAddress.filter(a => a !== ""),
        ...(selectedCustomer.customer_info.addresses ?? [])
      ])
      setEmails((prevEmail) => [
        ...prevEmail.filter(e => e !== ""),
        ...(selectedCustomer.customer_info.emails ?? [])
      ])
    }
  },[selectedCustomer])


  return (
    <>
      <form ref={updateForm} className="flex flex-col p-2 gap-3" onSubmit={(e)=> handleSubmitUpdateForm(e)} noValidate>
        <h1 className="text-center font-bold text-slate-600 text-lg">Customer Update Information</h1>
        <div className="mt-5">
          <label 
            htmlFor="fullName" 
            className="block text-sm font-bold text-slate-500 dark:text-white">Full Name</label>
          <input 
            type="text" 
            id="fullName"   
            name="fullName" 
            value={data.fullName}
            onChange={(e)=> setData({...data, fullName: e.target.value})}
            required
            className={`${required && !data.fullName ? "bg-red-100 border-red-300": "bg-gray-50 border-gray-300"}  border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`} placeholder="Enter Full Name"  />
        </div>
        <div> 
          <label 
            htmlFor="dob" 
            className="block text-sm font-bold text-slate-500 dark:text-white">Date Of Birth</label>  
          <input 
            type="date" 
            name="dob"
            value={data.dob}
            onChange={(e)=> setData({...data, dob: e.target.value})} 
            id="dob" 
            required
            className={`${required && !data.dob ? "bg-red-100 border-red-300" : "bg-gray-50 border-gray-300"}  border  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}  />
        </div>
        <div> 
          <label 
            htmlFor="gender" 
            className="block text-sm font-bold text-slate-500 dark:text-white">Gender</label>  
          <select
            id="gender"
            name="gender"
            value={data.gender}
            required
            onChange={(e)=> setData({...data, gender: e.target.value})}
            className={`${required && !data.gender ? "bg-red-100 border-red-300" : "bg-gray-50 border-gray-300"} border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5`}
          >
            <option value="">Choose a gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>

        <div >
          <div 
            className="block text-sm font-bold text-slate-500 dark:text-white">Mobile No.</div>
          <div className="flex flex-col gap-2">
            {
              mobiles.map((m,index)=> (
                <div key={index} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    id={`contact_${index}`}   
                    name={`contact_${index}`}
                    pattern="^09\d{9}$"
                    value={m}
                    required
                    onChange={(e)=> handleMobileOnchange(index,e.target.value)}
                    className={`${required && (!mobiles[index] || !validatePhone(mobiles[index])) ? "bg-red-100 border-red-300" : "bg-gray-50 border-gray-300" }  border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`} placeholder="Enter Mobile No."  
                  />
                  {
                    index === 0 &&
                    <CiSquarePlus className="text-3xl cursor-pointer bg-green-400 text-white hover:bg-white hover:text-green-500 rounded-md duration-200 ease-in-out" onClick={handleAddMobile}/>
                  }
                  {
                    index !== 0 &&
                    <CiSquareMinus className="text-3xl cursor-pointer hover:text-red-400 text-white bg-red-400 hover:bg-white rounded-md duration-200 ease-in-out" onClick={() => handleMinusMobile(index)}/>
                  }
                </div>
              ))
            }
          </div>
        </div>
          
        <div  className="">
          <div 
          className="block text-sm font-bold text-slate-500 dark:text-white">Email Address</div>
          <div className="flex flex-col gap-2">
            {
              emails.map((email,index)=> (
              <div key={index} className="flex items-center gap-2">
                <input 
                  type="email" 
                  id={`email_${index}`}   
                  name={`email_${index}`}
                  value={email}
                  required
                  onChange={(e)=> handleEmailOnchange(index,e.target.value)}
                  className={`${required && (!emails[index] || !validateEmail(emails[index])) ? "bg-red-100 border-red-300" : "bg-gray-50 border-gray-300" }  border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
                  placeholder="Enter Email Address" 
                  />
                  {
                    index === 0 &&
                    <CiSquarePlus className="text-3xl cursor-pointer bg-green-400 text-white hover:bg-white hover:text-green-500 rounded-md duration-200 ease-in-out" onClick={handleAddEmail}/>
                  }
                  {
                    index !== 0 &&
                    <CiSquareMinus className="text-3xl cursor-pointer hover:text-red-400 text-white bg-red-400 hover:bg-white rounded-md duration-200 ease-in-out" onClick={() => handleMinusEmail(index)}/>
                  }
              </div>
              ))
            }
          </div>
        </div>
        <div className="">
          <div 
            className="block text-sm font-bold text-slate-500 dark:text-white">Address</div>
          <div className="flex flex-col gap-2">
            {
            address.map((a,index)=> (
              <div key={index} className="flex items-center gap-2">
                <textarea 
                  id={`address_${index}`}   
                  name={`address_${index}`}
                  value={a}
                  required
                  onChange={(e)=> handleAddressOnchange(index,e.target.value)} 
                  className={`${required && !address[index] ? "bg-red-100 border-red-300" : "bg-gray-50 border-gray-300"} border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 h-32 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none dark:focus:ring-blue-500 dark:focus:border-blue-500`} placeholder="Enter Email Address">
                </textarea>

                {
                  index === 0 &&
                  <CiSquarePlus className="text-3xl cursor-pointer bg-green-400 text-white hover:bg-white hover:text-green-500 rounded-md duration-200 ease-in-out" onClick={handleAddAddress}/>
                }
                {
                  index !== 0 &&
                  <CiSquareMinus className="text-3xl cursor-pointer hover:text-red-400 text-white bg-red-400 hover:bg-white rounded-md duration-200 ease-in-out" onClick={() => handleMinusAddress(index)}/>
                }
              </div>
            ))
            }
          </div>
        </div>
        <div>
        <button type="submit" className={`bg-orange-400 hover:bg-orange-500 focus:outline-none text-white  focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}>Update</button>
        <button 
          type="button"
          onClick={cancel} 
          className={` bg-slate-400 hover:bg-slate-500 focus:outline-none text-white  focus:ring-4 focus:ring-slate-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}>Cancel</button>
        </div>
      </form>
      { confirm &&
          <Confirmation {...modalProps}/>
        }
    </>
  )
}

export default CustomerUpdateForm
