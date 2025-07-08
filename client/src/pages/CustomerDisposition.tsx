import { useEffect, useState } from "react"
import CustomerUpdateForm from "../components/CustomerUpdateForm"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../redux/store"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import SuccessToast from "../components/SuccessToast"
import AccountInfo from "../components/AccountInfo"
import DispositionForm from "../components/DispositionForm"
import { gql, useMutation, useQuery } from "@apollo/client"
import { Search, Success } from "../middleware/types"
import { setDeselectCustomer, setSelectedCustomer, setServerError } from "../redux/slices/authSlice"
import AgentTimer from "./agent/AgentTimer"
import DispositionRecords from "../components/DispositionRecords"
import MyTaskSection from "../components/MyTaskSection"
import { BreakEnum } from "../middleware/exports"
import Loading from "./Loading"
import { IoRibbon } from "react-icons/io5";
import Confirmation from "../components/Confirmation"


const DESELECT_TASK = gql`
  mutation deselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`

const SEARCH = gql`
  query Search($search: String) {
    search(search: $search) {
      _id
      case_id
      account_id
      endorsement_date
      credit_customer_id
      bill_due_day
      max_dpd
      balance
      paid_amount
      isRPCToday
      out_standing_details {
        principal_os
        interest_os
        admin_fee_os
        txn_fee_os
        late_charge_os
        dst_fee_os
        total_os
      }
      grass_details {
        grass_region
        vendor_endorsement
        grass_date
      }
      account_bucket {
        name
        dept
      }
      customer_info {
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

const SELECT_TASK = gql`
  mutation Mutation($id: ID!) {
    selectTask(id: $id) {
      message
      success
    }
  }
`

const CustomerDisposition = () => {
  const {userLogged, selectedCustomer, breakValue} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [isUpdate, setIsUpdate] = useState<boolean>(false)
  const [success, setSuccess] = useState({
    success: false,
    message: ""
  })
  
  const [search, setSearch] = useState("")

  const {data:searchData ,refetch, error} = useQuery<{search:Search[]}>(SEARCH,{variables: {search: search}})

  const length = searchData?.search?.length || 0;

  useEffect(()=> {
    refetch()
    if(error) {
      dispatch(setServerError(true))
    }
  },[search,refetch,error, dispatch])

  const [selectTask] = useMutation(SELECT_TASK,{
    onCompleted: ()=> {
      setSearch("")
      refetch()
    },
    onError: ()=>{
      dispatch(setServerError(true))
    }
  })

  const onClickSearch = async(customer:Search) => {
    await selectTask({variables: {id: customer._id}})
    dispatch(setSelectedCustomer(customer))

  }

  useEffect(()=> {
    const params = new URLSearchParams(location.search);
    if(params?.get("success")) {
      setSuccess({
        success: true,
        message: "Customer successfully updated"
      })
    }
  },[location.search])

  const [deselectTask,{loading}] = useMutation<{deselectTask:Success}>(DESELECT_TASK,{
    onCompleted: ()=> {
      dispatch(setDeselectCustomer()) 
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })

  useEffect(()=> {
    if(!success.success){
      navigate(location.pathname)
    }
  },[ success ,navigate,location.pathname ])

  useEffect(()=> {
    const id = selectedCustomer._id;
    if(!id) return

    const timer = setTimeout(async()=> {
      await deselectTask({ variables: { id } })
    })
    return ()=> clearTimeout(timer)
  },[navigate, deselectTask, dispatch])

  const clearSelectedCustomer = async() => {
    await deselectTask({variables: {id: selectedCustomer._id}}) 
  }
  
  useEffect(()=> {
    setSearch("")
  },[selectedCustomer._id])

  useEffect(()=> {
    if(breakValue !== BreakEnum.PROD && userLogged.type === "AGENT") {
      navigate('/break-view')
    }
  },[breakValue,navigate])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!selectedCustomer?._id) return;
      const body = JSON.stringify({
        query:`
          mutation deselectTask($id: ID!) {
            deselectTask(id: $id) {
              message
              success
            }
          }
        `,
        variables: { id: selectedCustomer._id }
      });
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/graphql', blob);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };

  }, [selectedCustomer]);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "RPCTODAY" as "RPCTODAY",
    yes: () => {},
    no: () => {}
  })
  const [isRPCToday, setIsRPCToday] = useState<boolean>(false)

  useEffect(()=> {
    if(selectedCustomer._id) {
      if(selectedCustomer.isRPCToday) {
        setIsRPCToday(selectedCustomer.isRPCToday)
        setModalProps({
          message: "Client already called today!",
          toggle: "RPCTODAY",
          yes: () => {
            setIsRPCToday(false)
          },
          no: ()=> {
            setIsRPCToday(false)
          }
        })
      }
    } else {
      setIsRPCToday(false)
    }
  },[selectedCustomer])

  if(loading) return <Loading/>

  return userLogged._id ? (
    <div className="h-full w-full overflow-auto"> 
      {
        isRPCToday &&
        <Confirmation {...modalProps}/>
      }
      
      {
        success?.success &&
        <SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>
      }
      <div>
        <div className="p-5">
        {
          userLogged.type === "AGENT" &&
          <AgentTimer/>
        }
        <MyTaskSection/>
        </div>
      <div className="w-full grid grid-cols-2 gap-5 px-5 pb-5">

        
        <div className="flex flex-col items-center"> 
          <h1 className="text-center font-bold text-slate-600 text-lg mb-4">Customer Information</h1>
          <div className="border flex flex-col rounded-xl border-slate-400 w-full h-full items-center justify-center p-5 gap-1.5 relative">
            
          
            {
              selectedCustomer._id && selectedCustomer?.customer_info?.isRPC &&
              <IoRibbon className="top-5 absolute left-5 text-5xl text-blue-500"/>
            }
            {
              !selectedCustomer._id &&
              <div className="ms-5 relative">
                  <input 
                    type="text"
                    name="search" 
                    autoComplete="off"
                    value={search}
                    onChange={(e)=> {setSearch(e.target.value)}}
                    id="search"
                    placeholder="Search" 
                    className="w-96 p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:ring outline-0 focus:border-blue-500 "/>
          
                <div className={`${length > 0 && search ? "" : "hidden"} absolute max-h-96 border border-slate-400 w-96 bg-white overflow-y-auto rounded-md`}>
                  {
                    searchData?.search.map((data) => (
                      <div key={data._id} className="flex flex-col text-sm cursor-pointer hover:bg-slate-100 py-0.5"
                      onClick={() => onClickSearch(data)}
                      >
                        <div className="px-2 font-medium text-slate-600 uppercase">{data.customer_info.fullName}</div>
                        <div className="text-slate-500 text-xs px-2">
                          <span>
                            {data.customer_info.dob},&nbsp; 
                          </span>
                            {data.customer_info.contact_no.map((contact,index) =>
                              <span key={index}>
                                {contact},&nbsp;
                              </span>
                            )}, 
                          <span>
                            {data.customer_info.addresses},&nbsp;
                          </span>
                          <span>
                            {data.credit_customer_id}
                          </span>
                        </div>
                      </div>
                    )) 
                  }
                </div>
              </div>
            }
            <div className="ms-5 mt-5 2xl:text-sm lg:text-xs">
              <div className="font-bold text-slate-500 uppercase">Full Name</div>
              <div className={`${selectedCustomer.customer_info?.fullName ? "p-2.5" : "p-5"} w-96 border border-gray-300 rounded-lg  bg-gray-50 text-slate-500`}>
                {selectedCustomer.customer_info?.fullName}
              </div>
            </div>
            <div className="ms-5 2xl:text-sm lg:text-xs">
              <div className=" font-bold text-slate-500">Date Of Birth (yyyy-mm-dd)</div>
              <div className={`${selectedCustomer.customer_info?.dob ? "p-2.5" : "p-5"} w-96 border border-gray-300 rounded-lg  bg-gray-50 text-slate-500`}>
                {selectedCustomer?.customer_info?.dob}
              </div>
            </div>
            <div className="ms-5 2xl:text-sm lg:text-xs">
              <div className="font-bold text-slate-500">Gender</div>
              <div className={`${selectedCustomer.customer_info?.gender ? "p-2.5" : "p-5"} w-96 border border-gray-300 rounded-lg  bg-gray-50 text-slate-500`}>

                {
                  Boolean(selectedCustomer?.customer_info?.gender ) ? 
                  (selectedCustomer?.customer_info?.gender === "F" || selectedCustomer?.customer_info?.gender.toLocaleLowerCase() === "female")  ? "Female" : "Male" : ""
                }
              </div>
            </div>
            <div className="ms-5 2xl:text-sm lg:text-xs">
              <div className="font-bold text-slate-500">Mobile No.</div>
              <div className="flex flex-col gap-2">
                { !selectedCustomer._id &&
                  <div className="w-96 border border-gray-300 p-5 rounded-lg  bg-gray-50 text-slate-500">
                  </div>
                }
                {selectedCustomer?.customer_info?.contact_no.map((cn,index)=> (
                  <div key={index} className="w-96 border border-gray-300 p-2.5 rounded-lg  bg-gray-50 text-slate-500">
                    {cn}
                  </div>
                ))}
              </div>
            </div>
            <div className="ms-5 2xl:text-sm lg:text-xs">
              <div className=" font-bold text-slate-500">Email</div>
              <div className="flex flex-col gap-2"> 
                { 
                  (!selectedCustomer?._id || selectedCustomer?.customer_info?.emails.length < 1) &&
                  <div className="w-96 border border-gray-300 p-5 rounded-lg  bg-gray-50 text-slate-500 1">
                  </div>
                }
                {
                  selectedCustomer?.customer_info?.emails.map((e,index)=>  (
                    <div key={index} className={`w-96 border border-gray-300 ${selectedCustomer?.customer_info?.emails?.length > 0 ? "p-2.5" : "p-5"}  rounded-lg bg-gray-50 text-slate-500`}>
                      {e}
                    </div>
                  ))
                }
              </div>
            </div>
            <div className="ms-5 2xl:text-sm lg:text-xs">
              <div className="font-bold text-slate-500">Address</div>
              <div className="flex flex-cols gap-2">
                { !selectedCustomer._id &&
                  <div className="w-96 h-36 border border-gray-300 rounded-lg bg-gray-50 text-slate-500">
                  </div>
                }
                {
                  selectedCustomer?.customer_info?.addresses.map((a, index)=> (
                    <div key={index} className="w-96 max-h-96 border border-gray-300 p-2.5 rounded-lg  bg-gray-50 text-slate-500 text-justify">
                      {a}
                    </div>
                  ))
                }

              </div>
            </div>
            {
              !isUpdate &&
            <div className="ms-5 2xl:text-sm lg:text-xs mt-5 flex gap-5">
              { selectedCustomer._id &&
                <>
                  {
                    selectedCustomer.balance != 0 &&
                    <button 
                      type="button" 
                      onClick={()=> setIsUpdate(true)}
                      className={`bg-orange-400 hover:bg-orange-500 focus:outline-none text-white  focus:ring-4 focus:ring-orange-300 font-medium rounded-lg  w-24 py-2.5 me-2 mb-2 cursor-pointer`}>
                      Update
                    </button>
                  }
                  <button 
                    type="button" 
                    onClick={clearSelectedCustomer}
                    className={`bg-slate-400 hover:bg-slate-500 focus:outline-none text-white  focus:ring-4 focus:ring-slate-300 font-medium rounded-lg  w-24 py-2.5 me-2 mb-2 cursor-pointer`}>
                    Cancel
                  </button>
                </>
                
              }
            </div>
            }
          </div>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-center font-bold text-slate-600 text-lg mb-4">Customer Update Information</h1>
          <div className={`border w-full flex justify-center h-full border-slate-400 rounded-xl relative ${!isUpdate && "flex items-center justify-center"}`}>
            {
              isUpdate ?
              <CustomerUpdateForm cancel={()=> setIsUpdate(false)} /> :
              <p className="text-2xl font-light text-slate-500">
                For Updating Customer Info Only
              </p>
            }
        </div>
        </div>
      </div>
      </div>
      <div className="p-5 grid grid-cols-2 gap-5">
        <AccountInfo/>
        {
          (selectedCustomer.balance > 0 && !selectedCustomer.isRPCToday) &&
          <DispositionForm setSuccess={(success:boolean,message:string)=> setSuccess({success:success,message:message})}/>
        }
      </div>
      <DispositionRecords/>
    </div>
  ) : (<Navigate to="/"/>)
}

export default CustomerDisposition