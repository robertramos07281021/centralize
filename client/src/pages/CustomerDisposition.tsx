import { memo, useCallback, useEffect, useMemo, useState } from "react"
import CustomerUpdateForm from "../components/CustomerUpdateForm"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../redux/store"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import AccountInfo from "../components/AccountInfo"
import DispositionForm from "../components/DispositionForm"
import { gql, useMutation, useQuery } from "@apollo/client"
import { Search, CustomerRegistered } from "../middleware/types"
import { setDeselectCustomer, setSelectedCustomer, setServerError, setSuccess } from "../redux/slices/authSlice"
import AgentTimer from "./agent/AgentTimer"
import DispositionRecords from "../components/DispositionRecords"
import MyTaskSection from "../components/MyTaskSection"
import { BreakEnum } from "../middleware/exports"
import Loading from "./Loading"
import { IoRibbon } from "react-icons/io5";
import Confirmation from "../components/Confirmation"
import {debounce} from 'lodash'

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
      month_pd
      emergency_contact {
        name
        mobile
      }
      dispo_history {
         _id
        amount
        disposition
        payment_date
        ref_no
        existing
        comment
        payment
        payment_method
        user
        dialer
        createdAt
        contact_method
        chatApp
        sms
        RFD
      }
      out_standing_details {
        principal_os
        interest_os
        admin_fee_os
        txn_fee_os
        late_charge_os
        dst_fee_os
        waive_fee_os
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

const UPDATE_RPC = gql`
  mutation updateRPC($id: ID!) {
    updateRPC(id: $id) {
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
      success
    }
  }

`

  const SearchResult = memo(({ data, search, onClick }: { data: Search[], search: string, onClick: (c: Search) => void }) => 
  {

    
    return (
    <>
      {data.slice(0, 50).map((customer) => (
      <div
      key={customer._id}
      className="flex flex-col text-sm cursor-pointer hover:bg-slate-100 py-0.5"
      onClick={() => onClick(customer)}
      >
        <div
          className="px-2 font-medium text-slate-600 uppercase"
          dangerouslySetInnerHTML={{
            __html: customer.customer_info.fullName.replace(
              new RegExp(search, "gi"),
              (match) => `<mark>${match}</mark>`
            ),
          }}
        />
        <div className="text-slate-500 text-xs px-2">
          <span>{customer.customer_info.dob}, </span>
          {customer.customer_info.contact_no.map((num, i) => <span key={i}>{num}, </span>)}
          <span>{customer.customer_info.addresses}, </span>
          <span>{customer.credit_customer_id}</span>
        </div>
      </div>
    ))}
    </>
  );
});

type Props = {
  label: string;
  values?: (string | null | undefined)[];
  fallbackHeight?: string;
};

const FieldListDisplay = memo(({ label, values = [], fallbackHeight = "p-5" }: Props) => {
  const isEmpty = !values || values.length === 0;

  return (
    <div className="2xl:w-1/2 w-full lg:w-8/10 lg:text-xs text-[0.8rem] ">
      <div className="font-bold text-slate-500 lg:text-sm text-[0.9rem] uppercase">{label}</div>
      <div className="flex flex-col gap-2">
        {isEmpty ? (
          <div className={`w-full border border-gray-300 ${fallbackHeight}  rounded-lg bg-gray-50 text-slate-500 text-wrap`} />
        ) : (
          values.map((val, index) => (
            <div
              key={index}
              className={`w-full ${label.toLowerCase() === 'address' ? "min-h-36": ""} border border-gray-300 p-2.5 rounded-lg bg-gray-50 text-slate-500 flex flex-wrap`}
            >
              {val}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

const FieldDisplay = memo(({ label, value }:{label:string, value:string | number | null | undefined | []}) => (
  <div className="2xl:w-1/2 w-full lg:w-8/10 mt-1 lg:text-xs text-[0.8em] ">
    <div className="font-bold text-slate-500 uppercase lg:text-sm text-[0.9rem]">{label}</div>
    <div className={`${value ? "p-2.5" : "p-5"} w-full border border-gray-300 rounded-lg  bg-gray-50 text-slate-500 text-wrap`}>
        {value}
      </div>
  </div>
));

const CustomerDisposition = () => {
  const {userLogged, selectedCustomer, breakValue } = useSelector((state:RootState)=> state.auth)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [isRPC, setIsRPC] = useState<boolean>(false)
  const [isUpdate, setIsUpdate] = useState<boolean>(false)
  const [search, setSearch] = useState("")
  const {data:searchData ,refetch} = useQuery<{search:Search[]}>(SEARCH,{variables: {search: search}, skip: search.length === 0,fetchPolicy: 'network-only'})

  const length = searchData?.search?.length || 0;
  const location = useLocation()
  const debouncedSearch = useMemo(() => {
  return debounce(async(val: string) => {
    await refetch({ search: val });
  }, 300);
}, [refetch]);

  const handleSearchChange = useMemo(() => 
  debounce((val: string) => setSearch(val), 300)
, []);

  useEffect(() => {
    if (search) debouncedSearch(search);
  }, [search, debouncedSearch]);


  useEffect(() => {
    return () => {
      handleSearchChange.cancel();
      debouncedSearch.cancel();
    }
  }, [handleSearchChange,debouncedSearch]);

  const [selectTask] = useMutation(SELECT_TASK,{
    onCompleted: ()=> {
      setSearch("")
    },
    onError: ()=>{
      dispatch(setServerError(true))
    }
  })

  const onClickSearch = useCallback(async(customer:Search) => {
    await selectTask({variables: {id: customer._id}})
    dispatch(setSelectedCustomer(customer))
  },[selectTask,dispatch])


  const [deselectTask,{loading}] = useMutation<{deselectTask:{message: string, success: boolean}}>(DESELECT_TASK,{
    onCompleted: ()=> {
      dispatch(setDeselectCustomer()) 
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })

  useEffect(()=> {
    if(location.pathname) {
      const id = selectedCustomer._id;
      if(!id) return
  
      const timer = setTimeout(async()=> {
        await deselectTask({ variables: { id } })
      })
      return ()=> clearTimeout(timer)
    }
  },[deselectTask,location])

  const clearSelectedCustomer = useCallback(async() => {
    await deselectTask({variables: {id: selectedCustomer._id}}) 
  },[selectedCustomer,deselectTask])
  
  useEffect(()=> {
    if(selectedCustomer._id) {
      setSearch("")
    }
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
    toggle: "RPCTODAY" as "RPCTODAY" | "UPDATE",
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

  console.log(selectedCustomer)

  const [updateRPC] = useMutation<{updateRPC:{success: boolean, message: string, customer:CustomerRegistered}}>(UPDATE_RPC,{
    onCompleted: async(res)=> {
      dispatch(setSuccess({
        success: res.updateRPC.success,
        message: res.updateRPC.message
      }))
      dispatch(setSelectedCustomer({...selectedCustomer, customer_info: res.updateRPC.customer}))
      setIsRPC(false)
    }
  })

  const callbackUpdateRPC = useCallback(async()=> {
    await updateRPC({variables: {id:selectedCustomer.customer_info._id}})
  },[updateRPC, selectedCustomer])

  const callbackNo = useCallback(()=> {
    setIsRPC(false)
  },[])

  const handleClickRPC = () => {
    setIsRPC(true)
    setModalProps({
      message: "This client is a RPC?",
      toggle: "UPDATE",
      yes: callbackUpdateRPC,
      no: callbackNo
    })
  }

  if(loading) return <Loading/>

  const gender = selectedCustomer.customer_info?.gender ? (selectedCustomer.customer_info?.gender.length > 1 ? selectedCustomer.customer_info?.gender.charAt(0).toLowerCase() : selectedCustomer.customer_info?.gender.toLowerCase()) : ""

  return userLogged._id ? (
    <div className="h-full w-full overflow-auto outline-none" 
 
     
    > 
      {
        (isRPCToday || isRPC) &&
        <Confirmation {...modalProps}/>
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
            <div className={`flex w-full ${selectedCustomer.customer_info.isRPC ? "justify-start": "justify-end"} `}>
              {
                selectedCustomer._id && !selectedCustomer.customer_info.isRPC &&
                <button className={` px-10 py-1.5 rounded text-white font-bold bg-orange-400 hover:bg-orange-600 ${isUpdate ? "absolute top-5 right-5" : ""} `}onClick={handleClickRPC}>RPC</button>
              }
              {
                selectedCustomer._id && selectedCustomer?.customer_info?.isRPC &&
                <IoRibbon className=" text-5xl text-blue-500"/>
              }
            </div>
            {
              !selectedCustomer._id &&
              <div className="relative 2xl:w-1/2 w-full lg:w-8/10 flex justify-center">
                <input 
                  type="text"
                  name="search" 
                  autoComplete="off"
                  value={search}
                  onChange={(e)=> handleSearchChange(e.target.value)}
                  id="search"
                  placeholder="Search" 
                  className=" w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:ring outline-0 focus:border-blue-500 "
                />
                <div className={`${length > 0 && search ? "" : "hidden"} absolute max-h-96 border border-slate-400 w-full  left-1/2 -translate-x-1/2 bg-white overflow-y-auto rounded-md top-10`}>
                  <SearchResult data={searchData?.search || []} search={search} onClick={onClickSearch}/>
                </div>
              </div>
            }
            <FieldDisplay label="Full Name" value={selectedCustomer.customer_info?.fullName}/>
            <FieldDisplay label="Date Of Birth (yyyy-mm-dd)" value={selectedCustomer.customer_info?.dob}/>
            <FieldDisplay label="Gender" 
              value={
                (()=> {
                  if(gender === 'f') {
                    return "Female"
                  } else if (gender ==='m') {
                    return 'Male'
                  } else if (gender === 'o') {
                    return 'Other'
                  } else {
                    return ""
                  }
                })()

              }
            />
            <FieldListDisplay label="Mobile No." values={selectedCustomer?.customer_info?.contact_no} fallbackHeight="h-10"/>
            <FieldListDisplay label="Email" values={selectedCustomer?.customer_info?.emails} fallbackHeight="h-10"/>
            <FieldListDisplay label="Address" values={selectedCustomer?.customer_info?.addresses} fallbackHeight="h-36"/>
            {
              (selectedCustomer._id && selectedCustomer.emergency_contact) && 
              <div className="2xl:w-1/2 w-full lg:w-8/10 mt-1 ">
                <p className="font-bold text-slate-500 uppercase lg:text-sm text-[0.9rem]">Emergency Contact Person :</p>
                <div className="flex gap-2 flex-col lg:flex-row">
                  <FieldDisplay label="Name" value={selectedCustomer.emergency_contact.name}/>
                  <FieldDisplay label="Contact" value={selectedCustomer.emergency_contact.mobile}/>
                </div>
              </div>
            }
            {
              !isUpdate &&
              <div className="2xl:text-sm lg:text-xs mt-5 flex gap-5">
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
              <p className="w- 2xl:text-2xl font-light text-slate-500">
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
          selectedCustomer.balance > 0 &&
          <DispositionForm updateOf={()=> setIsUpdate(false)}/>
        }
      </div>
      {
        selectedCustomer.dispo_history.length > 0 &&
        <DispositionRecords/>
      }
    </div>
  ) : (<Navigate to="/"/>)
}

export default CustomerDisposition