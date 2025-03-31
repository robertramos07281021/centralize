import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import { useEffect, useState } from "react";
import SearchCustomer from "../components/SearchCustomer";
import CustomerUpdateForm from "../components/CustomerUpdateForm";


const Disposition = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });


  const [isUpdate, setIsUpdate] = useState<boolean>(false)


  return (
    <div className="h-full w-full flex flex-col">
      {
        userLogged.type === "AGENT" &&
        <div className="w-full flex justify-between p-5 text-slate-600 text-xs font-medium ">
          <div>
            Bucket: {userLogged?.bucket?.toUpperCase()}
          </div>
          <div className="text-xs">
            Date & Time: <span className="">{time.toLocaleDateString()} - {formattedTime}</span>
          </div>
        </div>
      }
      <div className=" w-full min-h-full flex flex-col">
        <SearchCustomer/>
        <div className="w-full grid grid-cols-2 ">
          <div className="flex flex-col p-2 gap-3"> 
            <h1 className="text-center font-bold text-slate-600 text-lg">Customer Information</h1>
            <div className="ms-5 mt-5">
              <div className="text-sm font-bold text-slate-500">Customer Fullname</div>
              <div className="w-96 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
                Customer Fullname
              </div>
            </div>
            <div className="ms-5">
              <div className="text-sm font-bold text-slate-500">Date Of Birth</div>
              <div className="w-96 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
                DOB
              </div>
            </div>
            <div className="ms-5 ">
              <div className="text-sm font-bold text-slate-500">Gender</div>
              <div className="w-96 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
                Gender
              </div>
            </div>
            <div className="ms-5 ">
              <div className="text-sm font-bold text-slate-500">Mobile No.</div>
              <div className="w-96 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
                Mobile Number
              </div>
            </div>
            <div className="ms-5">
              <div className="text-sm font-bold text-slate-500">Email</div>
              <div className="w-96 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
                Email Address
              </div>
            </div>
            <div className="ms-5">
              <div className="text-sm font-bold text-slate-500">Address</div>
              <div className="w-96 h-32 border border-gray-300 p-2.5 rounded-lg text-sm bg-gray-50 text-slate-500">
                Address
              </div>
            </div>
            {
              !isUpdate &&
            <div className="ms-5">
              <button 
                type="button" 
                onClick={()=> setIsUpdate(true)}
                className={`bg-orange-400 hover:bg-orange-500 focus:outline-none text-white  focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 cursor-pointer`}>Update</button>
            </div>
            }
          </div>
          {
            isUpdate &&
            <CustomerUpdateForm cancel={()=> setIsUpdate(false)}/>
          }
          
        </div>
        <div className="p-5">

        </div>
      </div>
    </div>
  )
}

export default Disposition
