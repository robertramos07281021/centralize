import { useSelector } from "react-redux"
import { RootState } from "../redux/store"
import { IoMdCloseCircleOutline } from "react-icons/io";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useMemo } from "react";

const DEPT_USER = gql`
  query Query {
    findAgents {
      _id
      name
    }
  }
`
type DeptUser = {
  _id: string
  name: string
}

type ComponentProp = {
  close: () => void
}

const UpdatedAccountHistory:React.FC<ComponentProp> = ({close}) => {
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  const {data} = useQuery<{findAgents:DeptUser[]}>(DEPT_USER,{skip: !selectedCustomer})
  const history = Array.isArray(selectedCustomer?.account_update_history)
 ? [...selectedCustomer?.account_update_history].sort((a,b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime()) : []

  const userObject = useMemo(()=> {
    const newData = data?.findAgents || []
    return Object.fromEntries(newData.map(e=> [e._id, e.name]))
  },[data])


  return (
    <div className="w-full h-full z-40 gap-5 absolute px-10 top-0 left-0 bg-black/50 backdrop-blur-[2px] p-10">
      <div className="w-full h-full border rounded-md border-slate-500 bg-white p-5 flex flex-col">
        <div className="flex justify-between items-start">
          <h1 className="2xl:text-5xl font-medium text-gray-600 pb-5">Updated Account History - {selectedCustomer?.customer_info?.fullName}</h1>
          <IoMdCloseCircleOutline className="text-5xl m-3 absolute top-10 right-10 hover:scale-110 cursor-pointer hover:text-gray-400" onClick={close}/>
        </div>
        <div className="h-full overflow-y-auto">
            <table className="w-full table-fixed">
              <thead className="sticky top-0">
                <tr className=" text-gray-600 text-lg text-left select-none bg-blue-100">
                  <th className="pl-5 py-2">Principal</th>
                  <th>Out Standing Balance</th>
                  <th>Balance</th>
                  <th>Updated By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {
                  history.length > 0 ? history?.map((x,index) => {
                  return (
                    <tr key={index} className="text-slate-600">
                      <td className="pl-5 py-1.5">{x.principal_os ?  x.principal_os?.toLocaleString('en-PH',{style: "currency",currency: 'PHP'}) : (0).toLocaleString('en-PH',{style: "currency",currency: 'PHP'})}</td>
                      <td>{x.total_os ?  x.total_os?.toLocaleString('en-PH',{style: "currency",currency: 'PHP'}) : (0).toLocaleString('en-PH',{style: "currency",currency: 'PHP'})}</td>
                      <td>{x.balance ?  x.balance?.toLocaleString('en-PH',{style: "currency",currency: 'PHP'}) : (0).toLocaleString('en-PH',{style: "currency",currency: 'PHP'})}</td>
                      <td className="capitalize">{userObject[x.updated_by]}</td>
                      <td>{new Date(x.updated_date)?.toLocaleDateString()} - {new Date(x.updated_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</td>
                    </tr>
                  )
                  }) : null
                }
              </tbody>
            </table>
          </div>


      </div>
    </div>
  )
}

export default UpdatedAccountHistory