import { useCallback, useEffect, useRef, useState } from "react";
import { CiSquarePlus, CiSquareMinus } from "react-icons/ci";
import Confirmation from "./Confirmation";
import { gql, useMutation } from "@apollo/client";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { setSelectedCustomer, setServerError, setSuccess } from "../redux/slices/authSlice";
import { CustomerRegistered } from "../middleware/types";

const UPDATE_CUSTOMER = gql` mutation
  updateCustomer($fullName:String!, $dob:String!, $gender:String!, $mobiles:[String], $emails:[String], $addresses:[String],$id:ID!, $isRPC:Boolean) {
    updateCustomer(fullName:$fullName, dob:$dob, gender:$gender, mobiles:$mobiles, emails:$emails, addresses:$addresses, id:$id, isRPC: $isRPC) {
      success
      message
      customer {
        fullName
        dob
        gender
        contact_no
        emails
        addresses
        _id
        isRPC
      }
    }
  }
`

type UpdatedCustomer = {
  customer: CustomerRegistered;
  success: boolean;
  message: string;
}

type CustomerUpdateFormProps = {
  cancel: () => void;
}

enum Gender {
  FEMALE = 'F',
  MALE = 'M',
  OTHERS = 'O',
  NULL = ""
}

const CustomerUpdateForm:React.FC<CustomerUpdateFormProps> = ({cancel}) => {
  const dispatch = useAppDispatch()
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  const [formState, setFormState] = useState({
    fullName: "",
    dob: "",
    gender: "",
    isRPC: false,
    mobiles: [""],
    emails: [""],
    addresses: [""]
  });
    

  // mobile =======================================================================

  const handleAddMobile = () => {
    setFormState(prev => ({
      ...prev,
      mobiles: [...prev.mobiles, ""]
    }));
  }

  const validatePhone = (phone: string): boolean => /^09\d{9}$/.test(phone);

  const handleMinusMobile = (index: number) => {
    setFormState(prev => ({
      ...prev,
      mobiles: prev.mobiles.filter((_, i) => i !== index)
    }));
  };

  const handleMobileOnchange = (index:number, value:string) => {
    setFormState(prev => ({
      ...prev,
      mobiles: prev.mobiles.map((val, i) => i === index ? value : val)
    }));
  }

  // email address ================================================================


  const handleAddEmail = () => {
    setFormState(prev => ({
      ...prev,
      emails: [...prev.emails, ""]
    }));
  }
  const validateEmail = (email: string): boolean=>  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())

  const handleEmailOnchange = (index:number, value: string) => {
    setFormState(prev => ({
      ...prev,
      emails: prev.emails.map((val, i) => i === index ? value : val)
    }));
  }
  
  const handleMinusEmail = (index: number) => {
    setFormState(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }));
  };

  //address =======================================================================


  const handleAddAddress = () => {
    setFormState(prev => ({
      ...prev,
      addresses: [...prev.addresses, ""]
    }));
  }

  const handleAddressOnchange = (index:number, value: string) => {
    setFormState(prev => ({
      ...prev,
      addresses: prev.addresses.map((val, i) => i === index ? value : val)
    }));
  }

  const handleMinusAddress = (index: number) => {
    setFormState(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  }

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
    yes: () => {},
    no: () => {}
  })

  const [confirm, setConfirm] = useState(false)

  const [required, setRequired] = useState(false)
  const [updateCustomer] = useMutation<{updateCustomer:UpdatedCustomer}>(UPDATE_CUSTOMER, {
    onCompleted: async(res) => {
      if(!selectedCustomer) return
      const result = res.updateCustomer
      dispatch(setSelectedCustomer({ ...selectedCustomer, customer_info: result.customer }));
      dispatch(setSuccess({
        success: result.success,
        message: result.message
      }))
      cancel();
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })

  const handleConfirmYes = useCallback(async () => {
    await updateCustomer({ variables: { ...formState, id: selectedCustomer?.customer_info._id } });
    setConfirm(false);
  }, [formState, selectedCustomer, updateCustomer]);

  const handleConfirmNo = useCallback(() => {
    setConfirm(false);
  }, []);

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
        yes: handleConfirmYes,
        no: handleConfirmNo
      })
    }
  }
  
  useEffect(()=> {
    if (selectedCustomer) {
      const gender = selectedCustomer?.customer_info?.gender ? (selectedCustomer?.customer_info?.gender?.length > 1 ? selectedCustomer.customer_info.gender.charAt(0).toLowerCase() : selectedCustomer.customer_info.gender.toLowerCase()) : ""
    
      setFormState({
        fullName: selectedCustomer.customer_info.fullName || "",
        dob: selectedCustomer.customer_info.dob || "",
        gender: (()=> {
          if(gender === 'f') {
            return Gender.FEMALE
          } else if (gender ==='m') {
            return Gender.MALE
          } else if (gender === 'o') {
            return Gender.OTHERS
          } else {
            return Gender.NULL
          }
        })(),
        isRPC: selectedCustomer.customer_info.isRPC || false,
        mobiles: selectedCustomer.customer_info.contact_no?.length
          ? selectedCustomer.customer_info.contact_no
          : [""],
        emails: selectedCustomer.customer_info.emails?.length
          ? selectedCustomer.customer_info.emails
          : [""],
        addresses: selectedCustomer.customer_info.addresses?.length
          ? selectedCustomer.customer_info.addresses
          : [""]
      });
    }
  },[selectedCustomer])



  return (
    <>
      <form ref={updateForm} className="flex flex-col gap-3 w-full items-center justify-center p-5 lg:text-xs text-[0.8em]" onSubmit={(e)=> handleSubmitUpdateForm(e)} noValidate>
   
        <label className="flex gap-2 w-full">
          <input type="checkbox" name="rpc" id="rpc"
            checked={formState.isRPC}
            onChange={(e) => {
              setFormState(prev => ({ ...prev, isRPC: e.target.checked }));
            }}
          />
          <h1>RPC</h1>
        </label>

        <label 
          className="text-slate-500 dark:text-white 2xl:w-1/2 w-full lg:w-8/10">
          <p className="font-bold uppercase lg:text-sm text-[0.9rem]">Full Name</p>
          <input 
            type="text" 
            id="fullName"   
            name="fullName" 
            autoComplete="off"
            value={formState.fullName}
            onChange={(e)=> setFormState({...formState, fullName: e.target.value})}
            required
            className={`${required && !formState.fullName ? "bg-red-100 border-red-300": "bg-gray-50 border-gray-300"}  border rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`} placeholder="Enter Full Name"  />
          </label>
  
          <label 
            className="text-xs lg:text-sm text-slate-500 dark:text-white 2xl:w-1/2 w-full lg:w-8/10">
            <p className="font-bold uppercase lg:text-sm text-[0.9rem]">Date Of Birth</p>
            <input 
              type="date" 
              name="dob"
              value={formState.dob}
              onChange={(e)=> setFormState({...formState, dob: e.target.value})} 
              id="dob" 
              className={` bg-gray-50 border-gray-300  border  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 `}  
            />
          </label>  
              
          <label 
            className="text-xs lg:text-sm text-slate-500 dark:text-white 2xl:w-1/2 w-full lg:w-8/10">
            <p className="font-bold uppercase lg:text-sm text-[0.9rem]">Gender</p>
            <select
              id="gender"
              name="gender"
              value={formState.gender}
              required
              onChange={(e)=> setFormState({...formState, gender: e.target.value})}
              className={`${required && !formState.gender ? "bg-red-100 border-red-300" : "bg-gray-50 border-gray-300"} border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            >
              <option value={Gender.NULL}>Choose a gender</option>
              <option value={Gender.MALE}>Male</option>
              <option value={Gender.FEMALE}>Female</option>
              <option value={Gender.OTHERS}>Others</option>
            </select>
          </label>  
              
        <div className="text-xs lg:text-sm text-slate-500 dark:text-white 2xl:w-1/2 w-full lg:w-8/10">
          <p className="font-bold uppercase lg:text-sm text-[0.9rem]">Mobile No.</p>
          <div className="flex flex-col gap-2">
            {
              formState.mobiles.map((m,index)=> (
                <div key={index} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    id={`contact_${index}`}   
                    name={`contact_${index}`}
                    pattern="^09\d{9}$"
                    value={m}
                    required
                    onChange={(e)=> handleMobileOnchange(index,e.target.value)}
                    className={`${required && (!formState.mobiles[index] || !validatePhone(formState.mobiles[index])) ? "bg-red-100 border-red-300" : "bg-gray-50 border-gray-300" }  border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`} placeholder="Enter Mobile No."  
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
          
        <div className="text-xs lg:text-sm text-slate-500 dark:text-white 2xl:w-1/2 w-full lg:w-8/10">
          <p className="font-bold uppercase lg:text-sm text-[0.9rem]">Email Address</p>
          <div className="flex flex-col gap-2">
            {
              formState.emails.map((email,index)=> (
              <div key={index} className="flex items-center gap-2">
                <input 
                  type="email" 
                  id={`email_${index}`}   
                  name={`email_${index}`}
                  value={email}
                  required
                  onChange={(e)=> handleEmailOnchange(index,e.target.value)}
                  className={`${required && (!formState.emails[index] || !validateEmail(formState.emails[index])) ? "bg-red-100 border-red-300" : "bg-gray-50 border-gray-300" }  border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
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
        <div className="text-xs lg:text-sm text-slate-500 dark:text-white 2xl:w-1/2 w-full lg:w-8/10">
          <p className="font-bold uppercase lg:text-sm text-[0.9rem]">Address</p>
          <div className="flex flex-col gap-2">
            {
              formState.addresses.map((a,index)=> (
                <div key={index} className="flex items-center gap-2">
                  <textarea 
                    id={`address_${index}`}   
                    name={`address_${index}`}
                    value={a}
                    required
                    onChange={(e)=> handleAddressOnchange(index,e.target.value)} 
                    className={`${required && !formState.addresses[index] ? "bg-red-100 border-red-300" : "bg-gray-50 border-gray-300"} border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full h-32 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none dark:focus:ring-blue-500 dark:focus:border-blue-500`} placeholder="Enter Email Address">
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
        <div className="flex justify-center gap-5">
          <button type="submit" className={`bg-orange-500 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-500 font-medium rounded-lg text-sm w-24 py-2.5 me-2  cursor-pointer`}>Save</button>
          <button 
            type="button"
            onClick={cancel} 
            className={` bg-slate-400 hover:bg-slate-500 focus:outline-none text-white  focus:ring-4 focus:ring-slate-300 font-medium rounded-lg text-sm w-24 py-2.5 me-2 cursor-pointer`}>Cancel</button>
        </div>
      </form>
      { confirm &&
          <Confirmation {...modalProps}/>
        }
    </>
  )
}

export default CustomerUpdateForm
