import { Search } from "../middleware/types"
import { IoMdCloseCircleOutline } from "react-icons/io";
import { RootState, useAppDispatch } from "../redux/store";
import { setSelectedCustomer, setServerError } from "../redux/slices/authSlice";
import { gql, useMutation } from "@apollo/client";
import { useCallback, useState } from "react";
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



const FieldDiv = ({label, value, endorsementDate}: {label:string, value: number | string | null | undefined, endorsementDate: string | null | undefined})=> {

  let newValue = value

  if(Number(value) && endorsementDate) {
    const endorsement = new Date(endorsementDate);
    endorsement.setDate(endorsement.getDate() + Number(value));
    newValue = endorsement.toLocaleDateString("en-PH");
  } 

  const fieldsOfNumber = ['principal os','interest os','admin fee os','dst fee os','late charge waive fee os','late charge os','waive fee os', 'txn fee os','out standing balance']

  if(fieldsOfNumber.includes(label.toLowerCase())) {
    newValue = value?.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
  }

  return (
    <div className="w-full">
      <h1 className="text-sm lg:text-base font-medium text-gray-700 capitalize">{label} :</h1>
      {
        value ? 
        <p className="text-xs lg:text-sm border px-2 flex items-center rounded py-1.5 border-slate-500 text-gray-600">{newValue}</p> : 
        <p className="text-xs lg:text-sm border px-2 flex items-center rounded py-4 bg-gray-200 border-slate-500"></p>
      }
    </div>
  )
}

const OtherAccountsViews:React.FC<ComponentProps> = ({others,close}) => {
  const dispatch = useAppDispatch()
  const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
  const [confirm,setConfirm] = useState<boolean>(false)
  const [newSelected, setNewSelected] = useState<Search | null>(null)

  const [selectTask] = useMutation(SELECT_TASK,{
    onCompleted: async()=> {
      await deselectTask({variables: {id: selectedCustomer._id}})
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

  return (
    <>
      <div className="w-full h-full z-50 gap-5 absolute px-10 top-0 left-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center" >
        <IoMdCloseCircleOutline className="text-5xl text-white absolute top-10 right-10 hover:scale-110 cursor-pointer hover:text-gray-300" onClick={()=> close()}/>
        {
          others?.map(oa => {
            return (
              <div key={oa._id} className={`w-1/3 bg-white min-h-3/5 border border-slate-500 rounded-lg flex flex-col  p-5 gap-5`}>
                <div className="w-full flex flex-col lg:flex-row lg:gap-5">
                  <div className="w-full">
                    <FieldDiv label="Case ID" value={oa.case_id} endorsementDate={null}/>
                    <FieldDiv label="Credit ID" value={oa.credit_customer_id} endorsementDate={null}/>
                    <FieldDiv label="Account ID" value={oa.account_id} endorsementDate={null}/>
                    <FieldDiv label="DPD" value={oa.max_dpd} endorsementDate={null}/>
                    <FieldDiv label="MPD" value={oa.month_pd} endorsementDate={null}/>
                    <FieldDiv label="Endorsement Date" value={oa.endorsement_date} endorsementDate={null}/>
                    <FieldDiv label="Bill Due Date" value={oa.max_dpd || 0} endorsementDate={oa.endorsement_date}/>
                  </div>
                  <div className="w-full">
                    <FieldDiv label="Principal OS" value={oa.out_standing_details.principal_os} endorsementDate={null}/>
                    <FieldDiv label="Interest OS" value={oa.out_standing_details.interest_os} endorsementDate={null}/>
                    <FieldDiv label="Admin Fee OS" value={oa.out_standing_details.admin_fee_os} endorsementDate={null}/>
                    <FieldDiv label="Late Charge OS" value={oa.out_standing_details.late_charge_os} endorsementDate={null}/>
                    <FieldDiv label="DST Fee OS" value={oa.out_standing_details.dst_fee_os} endorsementDate={null}/>
                    <FieldDiv label="TXN Fee OS" value={oa.out_standing_details.txn_fee_os} endorsementDate={null}/>
                    <FieldDiv label="Late Charge Waive Fee OS" value={oa.out_standing_details.late_charge_waive_fee_os || 0} endorsementDate={null}/>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <FieldDiv label="Out Standing Balance" value={oa.out_standing_details.total_os || 0} endorsementDate={null}/>
                  <div className="flex justify-center">
                    <button className=" px-7 py-2 text-sm lg:text-base font-medium bg-orange-500 text-white rounded-md hover:bg-orange-700 cursor-pointer" 
                    onClick={()=>  handleSelect(oa._id,oa)}>
                      Select
                    </button>
                  </div>
                </div>
              </div>

            )})
        }
      </div>
      {
        confirm &&
      <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default OtherAccountsViews