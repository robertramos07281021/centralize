import { Search } from "../middleware/types"
import { IoMdCloseCircleOutline } from "react-icons/io";
import { RootState, useAppDispatch } from "../redux/store";
import { setSelectedCustomer, setServerError } from "../redux/slices/authSlice";
import { gql, useMutation } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import Confirmation from "./Confirmation";
import { useSelector } from "react-redux";

type ComponentProps = {
  others : Search[] | []
  close: ()=> void
}

const DESELECT_TASK = gql`
  mutation deselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`

const SELECT_TASK = gql`
  mutation Mutation($id: ID!) {
    selectTask(id: $id) {
      message
      success
    }
  }
`

const OtherAccountsViews:React.FC<ComponentProps> = ({others,close}) => {
  const dispatch = useAppDispatch()
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  const [confirm,setConfirm] = useState<boolean>(false)
  const [newSelected, setNewSelected] = useState<Search | null>(null)

  const [selectTask] = useMutation(SELECT_TASK,{
    onCompleted: async()=> {
      await deselectTask({variables: {id: selectedCustomer?._id}})
    },
    onError: ()=>{
      dispatch(setServerError(true))
    }
  })
  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "SELECT" as "SELECT",
    yes: () => {},
    no: () => {}
  })
  
  const [deselectTask] = useMutation<{deselectTask:{message: string, success: boolean}}>(DESELECT_TASK,{
    onCompleted: ()=> {
      if(newSelected) dispatch(setSelectedCustomer(newSelected))
      close()  
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })

  const handleSelect = useCallback((caId: string,ca:Search)=> {
    setConfirm(true)
    setModalProps({
      message: `Do you want to select this account with case id of ${ca.case_id}?`,
      toggle: "SELECT",
      yes: async()=> {
        await selectTask({variables:{id: caId}})
        setNewSelected(ca)
      },
      no: ()=> {
        setConfirm(false)
      }
    })
  },[setConfirm,setModalProps])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      } 
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close]);


  return (
    <>
      <div className="w-full h-full z-50 gap-5 absolute px-10 top-0 left-0 bg-black/50 backdrop-blur-[2px] flex p-10" >

        <div className="border h-full w-full rounded-md border-slate-400 flex flex-col bg-white p-5">
          <div className="flex justify-between items-start">
            <h1 className="text-5xl font-medium text-gray-600">Other Accounts</h1>
            <IoMdCloseCircleOutline className="text-5xl m-3 absolute top-10 right-10 hover:scale-110 cursor-pointer hover:text-gray-400" onClick={()=> close()}/>
          </div>
        
          <div className="mt-4 h-full overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0">
                <tr className=" text-gray-600 text-lg text-left select-none bg-blue-100">
                  <th className="pl-5">Case ID / PN / Account ID</th>
                  <th className="pl-5 py-2 ">DPD</th>
                  <th className="pl-5 py-2 ">MAX DPD</th>
                  <th className="pl-5 py-2 ">Endorsement Date</th>
                  <th className="pl-5 py-2 ">Bill Due Date</th>
                  <th className="pl-5 py-2 ">Principal</th>
                  <th className="pl-5 py-2 ">OB</th>
                  <th className="pl-5 py-2 ">Balance</th>
                  <th className="pl-5 py-2 ">Action</th>
                </tr>
              </thead>
              <tbody>
                {
                  others?.map(oa => {
                    const daysExisting = oa.max_dpd - oa.dpd
                    const date = new Date()
                    const newDate = new Date(date)
                    newDate.setDate(Number(newDate.getDate()) + Number(daysExisting))
                  
                    return (
                      <tr key={oa._id} className="text-gray-600 text-base text-left select-none even:bg-gray-50">
                        <td className="pl-5">{oa.case_id}</td>
                        <td className="pl-5">{oa.dpd || "-"}</td>
                        <td className="pl-5">{oa.max_dpd || "-"}</td>
                        <td className="pl-5">{oa.endorsement_date}</td>
                        <td className="pl-5">{(oa.dpd && oa.max_dpd) ? newDate.toDateString() : "-"}</td>
                        <td className="pl-5">{oa.out_standing_details.principal_os.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                        <td className="pl-5">{oa.out_standing_details.total_os.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                        <td className="pl-5">{oa.balance.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                        <td className="pl-5 py-1.5">
                          <button className=" px-7 py-2 text-sm lg:text-base font-medium bg-orange-500 text-white rounded-md hover:bg-orange-700 cursor-pointer" 
                          onClick={()=>  handleSelect(oa._id,oa)}>
                            Select
                          </button>
                        </td>
                      </tr>

                    )
                  })
                }
      
              </tbody>
            </table>
            
          </div>
        </div>
      </div>
      {
        confirm &&
      <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default OtherAccountsViews