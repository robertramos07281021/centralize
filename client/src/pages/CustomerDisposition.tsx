import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CustomerUpdateForm from "../components/CustomerUpdateForm";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { Navigate, useNavigate } from "react-router-dom";
import AccountInfo, { ChildHandle } from "../components/AccountInfo";
import DispositionForm from "../components/DispositionForm";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Search, CustomerRegistered } from "../middleware/types";
import {
  setDeselectCustomer,
  setSelectedCustomer,
  setServerError,
  setSuccess,
} from "../redux/slices/authSlice";
import AgentTimer from "./agent/AgentTimer";
import MyTaskSection from "../components/MyTaskSection";
import { BreakEnum } from "../middleware/exports";
import Loading from "./Loading";
import { IoRibbon } from "react-icons/io5";
import Confirmation from "../components/Confirmation";
import { debounce } from "lodash";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import animationData from "../Animations/Spider.json";
import pumpkin from "../Animations/Spooky Pumpkin.json";
import phone from "../Animations/Phone Call.json"
import NeedToLoginVici from "./agent/NeedToLoginVici.tsx";

// import axios from "axios";

const DESELECT_TASK = gql`
  mutation deselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`;

const PICK_RANDOM = gql`
  query randomCustomer {
    randomCustomer {
      _id
      case_id
      account_id
      endorsement_date
      credit_customer_id
      bill_due_date
      max_dpd
      dpd
      balance
      paid_amount
      isRPCToday
      month_pd
      assigned
      assigned_date
      batch_no
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
        selectivesDispo
      }
      account_update_history {
        principal_os
        total_os
        balance
        updated_date
        updated_by
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
        writeoff_balance
        overall_balance
        cf
        mo_balance
        pastdue_amount
        mo_amort
      }
      grass_details {
        grass_region
        vendor_endorsement
        grass_date
      }
      account_bucket {
        name
        dept
        _id
        can_update_ca
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
      current_disposition {
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
        RFD
        dialer
        createdAt
        contact_method
        chatApp
        sms
        selectivesDispo
      }
    }
  }
`;

const SEARCH = gql`
  query Search($search: String) {
    search(search: $search) {
      _id
      case_id
      account_id
      endorsement_date
      credit_customer_id
      bill_due_date
      max_dpd
      dpd
      balance
      paid_amount
      isRPCToday
      month_pd
      assigned
      assigned_date
      batch_no
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
        selectivesDispo
      }
      account_update_history {
        principal_os
        total_os
        balance
        updated_date
        updated_by
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
        writeoff_balance
        overall_balance
        cf
        mo_balance
        pastdue_amount
        mo_amort
      }
      grass_details {
        grass_region
        vendor_endorsement
        grass_date
      }
      account_bucket {
        name
        dept
        _id
        can_update_ca
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
      current_disposition {
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
        RFD
        dialer
        createdAt
        contact_method
        chatApp
        sms
        selectivesDispo
      }
    }
  }
`;

const SELECT_TASK = gql`
  mutation Mutation($id: ID!) {
    selectTask(id: $id) {
      message
      success
    }
  }
`;

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
`;

const DISPOTYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      code
      name
    }
  }
`;

type Dispotype = {
  id: string;
  code: string;
  name: string;
};

const MAKING_CALL = gql`
  mutation makeCall($phoneNumber: String!) {
    makeCall(phoneNumber: $phoneNumber)
  }
`;

const SearchResult = memo(
  ({
    data,
    search,
    onClick,
  }: {
    data: Search[];
    onClick: (c: Search) => void;
    search: string;
  }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const refs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
          setSelectedIndex((prev) =>
            prev + 1 < data.length ? prev + 1 : prev
          );
        } else if (e.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));
        } else if (e.key === "Enter") {
          if (data[selectedIndex]) {
            onClick(data[selectedIndex]);
          }
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [data, onClick]);

    useEffect(() => {
      if (!data) {
        setSelectedIndex(0);
      }
    }, [search, data]);

    useEffect(() => {
      const selectedRef = refs.current[selectedIndex];
      if (selectedRef) {
        selectedRef.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, [selectedIndex]);

    function escapeRegExp(str: string) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    return (
      <>
        {data.slice(0, 50).map((customer, index) => (
          <div
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            className={`flex flex-col text-sm  cursor-pointer hover:bg-slate-100 py-0.5 ${
              Number(index) === Number(selectedIndex) ? "bg-slate-300" : ""
            } `}
            onClick={() => onClick(customer)}
          >
            <div>
              <div
                className="px-2 font-medium text-slate-600 uppercase block"
                dangerouslySetInnerHTML={{
                  __html: customer.customer_info.fullName.replace(
                    new RegExp(escapeRegExp(search), "gi"),
                    (match) => `<mark>${match}</mark> - <span>`
                  ),
                }}
              />

              <p className="px-2 text-slate-500 text-xs font-bold">
                Balance:{" "}
                {customer?.balance?.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}{" "}
                - {customer?.max_dpd}(DPD)
              </p>
            </div>
            <div className="text-slate-500 text-xs px-2">
              <span>{customer.customer_info.dob}, </span>
              <span>{customer.customer_info.contact_no.join(", ")}, </span>
              <span>{customer.customer_info.addresses.join(", ")}, </span>
              <span>{customer.credit_customer_id}</span>
            </div>
          </div>
        ))}
      </>
    );
  }
);

type Props = {
  label: string;
  values?: (string | null | undefined)[];
  fallbackHeight?: string;
};

const FieldListDisplay = memo(
  ({ label, values = [], fallbackHeight = "p-5" }: Props) => {
    const isEmpty = !values || values.length === 0;

    return (
      <div className="w-full  lg:text-xs text-[0.8rem] ">
        <div className="font-bold text-slate-500 lg:text-sm text-[0.9rem] uppercase">
          {label}
        </div>
        <div className="flex flex-col gap-2">
          {isEmpty ? (
            <div
              className={`w-full border border-gray-600 ${fallbackHeight}  rounded-sm bg-gray-50 text-slate-500 text-wrap`}
            />
          ) : (
            values?.map((val, index) => (
              <div
                key={index}
                className={`w-full ${
                  label.toLowerCase() === "address" ? "min-h-36" : ""
                }  border border-gray-600 p-2.5 rounded-lg bg-gray-50 text-slate-500 flex flex-wrap`}
              >
                {val}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
);

const FieldDisplay = memo(
  ({
    label,
    value,
  }: {
    label: string;
    value: string | number | null | undefined | [];
  }) => (
    <div className=" w-full  mt-1 lg:text-xs text-[0.8em] ">
      <div className="font-bold text-slate-500 uppercase lg:text-sm text-[0.9rem]">
        {label}
      </div>
      <div
        className={`${
          value ? "p-2.5" : "p-5"
        } w-full border border-gray-600 rounded-sm  bg-gray-50 text-slate-500 text-wrap`}
      >
        {value}
      </div>
    </div>
  )
);

const CustomerDisposition = () => {
  const { userLogged, selectedCustomer, breakValue, isOnlineOnVici } = useSelector(
    (state: RootState) => state.auth
  );
  const [randomCustomer, setRandomCustomer] = useState<Search | null>(null);
  const [floatDial, setFloatDial] = useState(true);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isRPC, setIsRPC] = useState<boolean>(false);
  const [isUpdate, setIsUpdate] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [isSearch, setIsSearch] = useState<boolean>(true);
  const { data: searchData, refetch } = useQuery<{ search: Search[] }>(SEARCH, {
    skip: isSearch,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

 
  const [loading2, setLoading2] = useState(false);

  const { data: dispotypes } = useQuery<{ getDispositionTypes: Dispotype[] }>(
    DISPOTYPES
  );
  const findPaid = dispotypes?.getDispositionTypes?.find(
    (dt) => dt.code === "PAID"
  );

  const length = searchData?.search?.length || 0;

  const debouncedSearch = useMemo(() => {
    return debounce(async (val: string) => {
      if (val && val.trim() !== "") {
        await refetch({ search: val });
      }
    }, 500);
  }, [refetch]);

  useEffect(() => {
    const defaultSearchTerm = "096";
    setSearch(search);
    setIsSearch(false);
    debouncedSearch(defaultSearchTerm);
  }, []);

  const handleSearchChange = (val: string) => {
    setIsSearch(false);
    setSearch(val);
    debouncedSearch(val);
  };


  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const [selectTask] = useMutation(SELECT_TASK, {
    onCompleted: () => {
      setSearch("");
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const onClickSearch = useCallback(
    async (customer: Search) => {
      await selectTask({ variables: { id: customer._id } });
      dispatch(setSelectedCustomer(customer));
      setFloatDial(true);
    },
    [selectTask, dispatch]
  );

  const [deselectTask, { loading }] = useMutation<{
    deselectTask: { message: string; success: boolean };
  }>(DESELECT_TASK, {
    onCompleted: () => {
      dispatch(setDeselectCustomer());
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const clearSelectedCustomer = useCallback(async () => {
    await deselectTask({ variables: { id: selectedCustomer?._id } });
    setSearch("");
  }, [selectedCustomer, deselectTask]);

  useEffect(() => {
    if (breakValue !== BreakEnum.PROD && userLogged?.type === "AGENT") {
      navigate("/break-view");
    }
  }, [breakValue, navigate]);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "RPCTODAY" as "RPCTODAY" | "UPDATE",
    yes: () => {},
    no: () => {},
  });

  const [isRPCToday, setIsRPCToday] = useState<boolean>(false);

  useEffect(() => {
    if (selectedCustomer) {
      if (selectedCustomer?.isRPCToday) {
        setIsRPCToday(selectedCustomer?.isRPCToday);
        setModalProps({
          message: "Client already called today!",
          toggle: "RPCTODAY",
          yes: () => {
            setIsRPCToday(false);
          },
          no: () => {
            setIsRPCToday(false);
          },
        });
      }
    } else {
      setIsRPCToday(false);
    }
  }, [selectedCustomer]);

  const { data: randomCustomerData } = useQuery<{ randomCustomer: Search }>(
    PICK_RANDOM,
    { notifyOnNetworkStatusChange: true }
  );

  /// hello here Sample data for candom ====================================================
  // console.log(randomCustomerData?.randomCustomer)

  const [updateRPC] = useMutation<{
    updateRPC: {
      success: boolean;
      message: string;
      customer: CustomerRegistered;
    };
  }>(UPDATE_RPC, {
    onCompleted: async (res) => {
      if (selectedCustomer) {
        dispatch(
          setSuccess({
            success: res.updateRPC.success,
            message: res.updateRPC.message,
            isMessage: false,
          })
        );
        dispatch(
          setSelectedCustomer({
            ...selectedCustomer,
            customer_info: res.updateRPC.customer,
          })
        );
        setIsRPC(false);
      }
    },
  });

  const handleRandomCustomerSelect = useCallback(async () => {
    setLoading2(true);
    try {
      const result = await refetch({ search: "096" });
      const list = result?.data?.search || [];

      if (list.length > 0) {
        const randomIndex = Math.floor(Math.random() * list.length);
        const randomCustomer = list[randomIndex];
        await selectTask({ variables: { id: randomCustomer._id } });
        dispatch(setSelectedCustomer(randomCustomer));
        setSearch("");
      } else {
      }
    } catch (error) {
      dispatch(setServerError(true));
    } finally {
      setLoading2(false);
    }
  }, [setLoading2, selectTask, dispatch, refetch, setSearch]);

  const callbackUpdateRPC = useCallback(async () => {
    await updateRPC({ variables: { id: selectedCustomer?.customer_info._id } });
  }, [updateRPC, selectedCustomer]);

  const callbackNo = useCallback(() => {
    setIsRPC(false);
  }, []);

  const handleClickRPC = () => {
    setIsRPC(true);
    setModalProps({
      message: "This client is a RPC?",
      toggle: "UPDATE",
      yes: callbackUpdateRPC,
      no: callbackNo,
    });
  };

  const childrenDivRef = useRef<ChildHandle>(null);

  const gender = selectedCustomer?.customer_info?.gender
    ? selectedCustomer.customer_info?.gender.length > 1
      ? selectedCustomer.customer_info?.gender.charAt(0).toLowerCase()
      : selectedCustomer.customer_info?.gender.toLowerCase()
    : "";

  // useEffect(() => {
  //   if (
  //     searchData &&
  //     Array.isArray(searchData.search) &&
  //     searchData.search.length > 0
  //   ) {
  //     console.log("Search results updated", searchData.search);
  //   }
  // }, [searchData]);

  // const [makeCall] = useMutation<string>(MAKING_CALL, {
  //   onCompleted: (data) => {
  //     console.log(data);
  //   },
  // });

  // useEffect(() => {
  //   if (selectedCustomer) {
  //     const timer = setTimeout(async () => {
  //       await makeCall({ variables: { phoneNumber: "09126448847" } });
  //     });
  //     return () => clearTimeout(timer);
  //   }
  // }, [selectedCustomer]);

  if (loading) return <Loading />;

  if (!userLogged) return <Navigate to="/" />;

  // if(!isOnlineOnVici && userLogged?.type === "AGENT") return <NeedToLoginVici/>

  return  (
    <>
      {(isRPCToday || isRPC) && <Confirmation {...modalProps} />}
    
    <div
      ref={containerRef}
      className={`h-full w-full relative overflow-auto overflow-x-hidden outline-none flex flex-col gap-2 `}
      onMouseDown={(e) => {
        if (!childrenDivRef.current?.divElement?.contains(e.target as Node)) {
          childrenDivRef?.current?.showButtonToFalse();
        }
      }}
    >



      <div className={`absolute w-60  top-0 left-10 z-0`}>
        <Lottie animationData={animationData} loop={false} autoplay={true} />
      </div>
      <div className={`absolute w-96  top-0 left-[300px] z-0`}>
        <Lottie animationData={animationData} loop={false} autoplay={true} />
      </div>
      <div className={`absolute w-52  top-0 left-[600px] z-0`}>
        <Lottie animationData={animationData} loop={false} autoplay={true} />
      </div>
      <div className={`absolute w-72  top-0 left-[1000px]`}>
        <Lottie animationData={animationData} loop={false} autoplay={true} />
      </div>
      <div className={`absolute w-60  top-0 left-[1300px]`}>
        <Lottie animationData={animationData} loop={false} autoplay={true} />
      </div>
      <div className={`absolute w-80  top-0 left-[1600px] `}>
        <Lottie animationData={animationData} loop={false} autoplay={true} />
      </div>

      <div className="flex w-full p-1.5 z-30">
        {userLogged?.type === "AGENT" && <AgentTimer />}
        <MyTaskSection />
      </div>

      <div className="w-full flex ">

        <div className="flex 2xl:flex-row flex-col w-full items-center relative  justify-center gap-5 py-5">
          <motion.div
            className=" bg-gray-100 w-full lg:w-2/3 2xl:w-1/3 transition-all flex flex-col shadow-md shadow-black/20 rounded-xl items-center border-gray-600 z-10 border-2 relative"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, type: "spring" }}
            layout
          > 

          <AnimatePresence>
           <motion.div
              className="absolute  -top-20 w-50 -left-20 -rotate-30 z-50"
              initial={{y: 30, scale: 0.5, opacity: 0}}
              animate={{y: 0, scale: 1, opacity: 1}}
              
              exit={{y: 30,  scale: 0.8, opacity: 0 }}
            >
              <Lottie animationData={pumpkin} loop={true} />
            </motion.div>
            
          </AnimatePresence>
            <h1 className="text-center px-10 w-full py-3 rounded-t-[9px] border-b bg-gray-400 uppercase font-black text-slate-600 text-2xl mb-1 ">
              Customer Information
            </h1>
            <div
              className={`flex  w-full ${
                selectedCustomer?.customer_info.isRPC
                  ? "justify-start"
                  : "justify-end px-5 py-2"
              } `}
            >
              {selectedCustomer && !selectedCustomer?.customer_info.isRPC && (
                <button
                  className={` px-10 py-1.5 rounded text-white font-black bg-orange-500 transition-all border-orange-700 border-2 shadow-md hover:shadow-none hover:bg-orange-600 cursor-pointer ${
                    isUpdate ? "2xl:absolute top-5 right-5" : ""
                  } `}
                  onClick={handleClickRPC}
                >
                  RPC
                </button>
              )}
              {selectedCustomer?._id &&
                selectedCustomer?.customer_info?.isRPC && (
                  <IoRibbon className=" text-5xl text-blue-500" />
                )}
            </div>

            <div className="px-5 flex flex-col w-full py-5">
              {!selectedCustomer?._id && (
                <div className="relative w-full flex justify-center">
                  <input
                    accessKey="z"
                    type="text"
                    name="search"
                    autoComplete="off"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    id="search"
                    placeholder="Search"
                    className=" w-full p-2 text-sm  text-gray-900 border border-gray-600 rounded-sm bg-gray-50 focus:ring-blue-500 focus:ring outline-0 focus:border-blue-500 "
                  />
                  <div
                    className={`${
                      length > 0 && search ? "" : "hidden"
                    } absolute max-h-96 border border-gray-600 w-full  left-1/2 -translate-x-1/2 bg-white overflow-y-auto rounded-sm top-10`}
                  >
                    <SearchResult
                      data={searchData?.search || []}
                      search={search}
                      onClick={onClickSearch}
                    />
                  </div>
                </div>
              )}
              <FieldDisplay
                label="Full Name"
                value={
                  (randomCustomer || selectedCustomer)?.customer_info
                    ?.fullName
                }
              />
              <FieldDisplay
                label="Date Of Birth (yyyy-mm-dd)"
                value={selectedCustomer?.customer_info?.dob}
              />
              <FieldDisplay
                label="Gender"
                value={(() => {
                  if (gender === "f") {
                    return "Female";
                  } else if (gender === "m") {
                    return "Male";
                  } else if (gender === "o") {
                    return "Other";
                  } else {
                    return "";
                  }
                })()}
              />

              <FieldListDisplay
                label="Mobile No."
                values={selectedCustomer?.customer_info?.contact_no}
              />
              <FieldListDisplay
                label="Email"
                values={selectedCustomer?.customer_info?.emails}
                fallbackHeight="h-10"
              />
              <FieldListDisplay
                label="Address"
                values={selectedCustomer?.customer_info?.addresses}
                fallbackHeight="h-36"
              />
              {selectedCustomer && selectedCustomer.emergency_contact && (
                <div className="2xl:w-1/2 w-full lg:w-8/10 mt-1 ">
                  <p className="font-bold text-slate-500 uppercase lg:text-sm text-[0.9rem]">
                    Emergency Contact Person :
                  </p>
                  <div className="flex gap-2  flex-col lg:flex-row">
                    <FieldDisplay
                      label="Name"
                      value={selectedCustomer.emergency_contact.name}
                    />
                    <FieldDisplay
                      label="Contact"
                      value={selectedCustomer.emergency_contact.mobile}
                    />
                  </div>
                </div>
              )}
              {!isUpdate && (
                <div className=" 2xl:text-sm lg:text-xs mt-5 flex justify-end">
                  {selectedCustomer && (
                    <>
                      {((selectedCustomer?.current_disposition &&
                        findPaid?.id ===
                          selectedCustomer?.current_disposition
                            ?.disposition &&
                        selectedCustomer?.current_disposition
                          .selectivesDispo) ||
                        !selectedCustomer?.current_disposition ||
                        (selectedCustomer.assigned &&
                          selectedCustomer.assigned === userLogged._id) ||
                        (!selectedCustomer.assigned &&
                          findPaid?.id !==
                            selectedCustomer?.current_disposition
                              ?.disposition)) && (
                        <button
                          type="button"
                          onClick={() => setIsUpdate(true)}
                          className={`  bg-orange-500 border-2 border-orange-800  font-black hover:bg-orange-600 focus:outline-none text-white  focus:ring-4 focus:ring-orange-300 transition-all uppercase rounded-md shadow-md  w-24 py-2.5 me-2 mb-2 cursor-pointer`}
                        >
                          Update
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={clearSelectedCustomer}
                        className={`bg-gray-500 border-2 border-gray-800 hover:bg-gray-600 focus:outline-none text-white  focus:ring-4 focus:ring-slate-300 font-black transition-all uppercase shadow-md rounded-md  w-24 py-2.5 me-2 mb-2 cursor-pointer`}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
                
          </motion.div>

          {
            selectedCustomer &&
            <div className="flex flex-col w-full lg:w-2/3 2xl:w-1/3 items-end justify-between z-20 gap-5 ">
              <div className="w-full">
                <AccountInfo ref={childrenDivRef} />
              </div>
              <div className="flex items-end h-full w-full justify-end">
                {selectedCustomer && selectedCustomer.balance > 0 && (
                  <DispositionForm updateOf={() => setIsUpdate(false)} />
                )}
              </div>
            </div>
          }
        </div>
      </div>
        
          <AnimatePresence>
            {isUpdate && (
              <div className="fixed z-50 top-0 justify-center items-center left-0 w-full overflow-hidden flex h-full">
                <motion.div
                  key={'modal_background_cui'}
                  onClick={() => setIsUpdate(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className=" cursor-pointer z-30 absolute top-0 left-0 bg-black/30  backdrop-blur-sm w-full h-full"
                ></motion.div>
                <motion.div
                  key={'modal_cui'}
                  className="flex flex-col bg-gray-100 border-2  overflow-auto border-gray-600 items-center rounded-md max-h-full relative z-40"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  <h1 className="text-center bg-gray-400 border-b border-gray-600 font-black uppercase text-slate-800 px-5 py-4 text-shadow-md text-2xl">
                    Customer Update Information
                  </h1>
                  <div
                    className={`w-full flex flex-col justify-center h-full overflow-hidden  rounded-xl relative`}
                  >
                    <CustomerUpdateForm cancel={() => setIsUpdate(false)} />
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
      {/* {floatDial && (
        <motion.div
          drag
          dragConstraints={containerRef}
          dragElastic={0.1}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: "spring" }}
          className="bg-gray-100 border-2 border-gray-300 shadow-lg shadow-black/3 p-2 w-40 rounded-full  cursor-grab active:cursor-grabbing absolute top-30 right-20"
        >
          <div className="absolute w-full font-black uppercase text-green-900 justify-evenly cursor-grab flex flex-col  h-full items-center right-0 z-20 top-0">
            <motion.div
              className="absolute -left-3 top-5 transition-al"
              initial={{ x: 40, y: 40, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ type: "spring", delay: 0.4 }}
            >
              <div
                onClick={!loading2 ? handleRandomCustomerSelect : undefined}
                className={`" ${
                  loading2
                    ? "bg-gray-400 border-gray-500 cursor-not-allowed "
                    : " hover:scale-110 cursor-pointer bg-green-500 hover:bg-green-600 border-green-900 "
                }  transition-all items-center justify-center flex w-10 h-10  rounded-full border-2 "`}
              >
                {loading2 ? (
                  <div className="border-t-2 border-white w-6 h-6 rounded-full animate-spin "></div>
                ) : (
                  <div>A</div>
                )}
              </div>
            </motion.div>
            <motion.div
              className=" absolute -right-3 top-5   transition-all "
              initial={{ x: -40, y: 40, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ type: "spring", delay: 0.6 }}
              onClick={() => setSearch("096")}
            >
              <div className="bg-green-500 transition-all hover:scale-110 hover:bg-green-600 px-3 py-1 cursor-pointer rounded-full border-2 border-green-900">
                b
              </div>
            </motion.div>
            <motion.div
              className=" absolute -bottom-5   transition-al "
              initial={{ x: 0, y: -40, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ type: "spring", delay: 0.8 }}
            >
              <div className="bg-green-500 transition-all hover:scale-110 hover:bg-green-600 px-3 py-1 cursor-pointer rounded-full border-2 border-green-900">
                c
              </div>
            </motion.div>
          </div>
          <Lottie animationData={phone} loop={false} />
        </motion.div>
      )} */}
    </div>
    </>
  );
};

export default CustomerDisposition;
