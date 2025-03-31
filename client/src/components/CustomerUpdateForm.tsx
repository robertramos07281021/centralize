import { useRef, useState } from "react";
import { CiSquarePlus, CiSquareMinus } from "react-icons/ci";

interface CustomerUpdateFormProps {
  cancel: () => void
}


const CustomerUpdateForm:React.FC<CustomerUpdateFormProps> = ({cancel}) => {
  
  // mobile =======================================================================
  const [mobiles, setMobiles] = useState<string[]>([""])

  const handleAddMobile = () => {
    setMobiles([...mobiles, ""])
  }

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
    fullname: "",
    dob: "",
    gender: ""
  })

  const updateForm = useRef<HTMLFormElement | null>(null)
  const handleSubmitUpdateForm = (e:React.FormEvent<HTMLFormElement>| null) => {
    if(e){
      e.preventDefault()
    }
    
    if(updateForm && updateForm.current.checkValidity()) {
      console.log('hello')
    }
  }


  return (
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
          required
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter Full Name"  />
      </div>
      <div> 
        <label 
          htmlFor="dob" 
          className="block text-sm font-bold text-slate-500 dark:text-white">Date Of Birth</label>  
        <input 
          type="date" 
          name="dob" 
          id="dob" 
          required
          className="bg-gray-50 border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"  />
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
            // ${data.gender.trim() === "" ? "bg-red-200" : "bg-gray-50"}
            className={`  border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5`}
          >
            <option value="">Choose a branch</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
      </div>

      <div >
        <label 
          htmlFor="contact" 
          className="block text-sm font-bold text-slate-500 dark:text-white">Mobile No.</label>
        <div className="flex flex-col gap-2">
          {
            mobiles.map((m,index)=> (
              <div key={index} className="flex items-center gap-2">
                <input 
                  type="text" 
                  id={`contact_${index}`}   
                  name={`contact_${index}`}
                  pattern="[0-9][09]"
                  value={m}
                  required
                  onChange={(e)=> handleMobileOnchange(index,e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter Mobile No."  
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
        <label 
        htmlFor="email" 
        className="block text-sm font-bold text-slate-500 dark:text-white">Email Address</label>
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
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
        <label 
          htmlFor="address" 
          className="block text-sm font-bold text-slate-500 dark:text-white">Address</label>
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 h-32 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter Email Address">
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
      <button type="submit" className={` bg-orange-400 hover:bg-orange-500 focus:outline-none text-white  focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}>Update</button>
      <button 
        type="button"
        onClick={cancel} 
        className={` bg-slate-400 hover:bg-slate-500 focus:outline-none text-white  focus:ring-4 focus:ring-slate-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}>Cancel</button>
      </div>
    </form>
  )
}

export default CustomerUpdateForm
