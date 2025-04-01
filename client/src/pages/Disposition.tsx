import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import { useEffect, useState } from "react";
import SearchCustomer from "../components/SearchCustomer";
import { useQuery } from "@apollo/client";
import { ALL_CUSTOMER } from "../apollo/query";
import Pagination from "../components/Pagination";
import { AllCustomers, CustomerRegistered } from "../middleware/types";
import { Link } from "react-router-dom";




const Disposition = () => {
  const {userLogged, page} = useSelector((state:RootState)=> state.auth)

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    if(userLogged.type === "AGENT") {
      const timer = setInterval(() => {
        setTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [userLogged]);

  const [customers, setCustomers] = useState<CustomerRegistered[]>([])


  const formattedTime = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });


  const {data:Customers, refetch} = useQuery<{getCustomers:AllCustomers}>(ALL_CUSTOMER,{variables: {page:page}})
  
  useEffect(()=> {
    refetch()
  },[page, refetch])
  

  useEffect(()=> {
    if(Customers){
      setCustomers(Customers?.getCustomers?.customers)
    }
  },[Customers])

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
      <div className=" w-full min-h-full flex flex-col px-5">
        <SearchCustomer/>
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 mt-5 ">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 border-y-2 border-slate-300">
            <tr>
              <th scope="col" className="px-6 py-3">
                  Full name
              </th>
              <th scope="col" className="px-6 py-3">
                  contact no
              </th>
              <th scope="col" className="px-6 py-3">
                  dob
              </th>
              <th scope="col" className="px-6 py-3">
                  email
              </th>
              <th scope="col" className="">
              </th>
            </tr>
          </thead>
          <tbody>
            {
              customers.map((customer,index) => (

              <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white uppercase">
                  {customer.fullName}
                </th>
                <td className="px-6 py-4 flex">
                  {customer.contact_no.map((cn, index)=> (
                    <p key={index}>{cn}{(customer.contact_no.length !== index) && (customer.contact_no.length > 1 ) && ", "}</p>
                  ))}
                </td>
                <td className="px-6 py-4">
                  {customer.dob}
                </td>
                <td className="px-6 py-4 flex">
                  {customer.emails.map((email,index) => (
                    <p key={index}>{email}{(customer.emails.length !== index) && (customer.emails.length > 1 )}</p>
                  ))}
                </td>
                <td>
                  <Link to={"#"}>
                    View
                  </Link>
                </td>
              </tr>
              ))
            }
          </tbody>
        </table>

      </div>
      <div className="p-2 flex justify-center">
        <Pagination totalCustomers={Customers?.getCustomers?.total ? Customers?.getCustomers?.total : 0 }/>
      </div>
    </div>
  )
}

export default Disposition
