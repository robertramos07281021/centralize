import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CustomerUpdateForm from "../components/CustomerUpdateForm";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { Navigate, useNavigate } from "react-router-dom";
import AccountInfo, {
  ChildHandle,
  PresetSelection,
} from "../components/AccountInfo";
import DispositionForm from "../components/DispositionForm";
import { gql, useMutation, useQuery, useSubscription } from "@apollo/client";
import { Search, CustomerRegistered } from "../middleware/types";
import {
  setCallUniqueId,
  setDeadCall,
  setDeselectCustomer,
  setIsRing,
  setMobileToCall,
  setOnCall,
  setSelectedCustomer,
  setServerError,
  setSuccess,
  setBreakValue,
  setStart,
  setReadyForBreak,
  setViciOnAir,
} from "../redux/slices/authSlice";
import AgentTimer from "./agent/AgentTimer";
import MyTaskSection from "../components/MyTaskSection";
import { BreakEnum, breaks } from "../middleware/exports";
import Loading from "./Loading";
import { IoRibbon } from "react-icons/io5";
import Confirmation from "../components/Confirmation";
import { debounce } from "lodash";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import phone from "../Animations/Phone Call.json";
import NeedToLoginVici from "./agent/NeedToLoginVici.tsx";
import frequency from "../Animations/Sound voice waves.json";

import Helper from "../components/Helper.tsx";

const DESELECT_TASK = gql`
  mutation deselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`;

const PICK_RANDOM = gql`
  query randomCustomer($buckets: [ID], $autoDial: Boolean) {
    randomCustomer(buckets: $buckets, autoDial: $autoDial) {
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
        partial_payment_w_service_fee
        new_tad_with_sf
        new_pay_off
        service_fee
        year
        brand
        model
        last_payment_amount
        last_payment_date
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
        partial_payment_w_service_fee
        new_tad_with_sf
        new_pay_off
        service_fee
        year
        brand
        model
        last_payment_amount
        last_payment_date
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

const END_CALL = gql`
  mutation endAndDispoCall {
    endAndDispoCall {
      success
      message
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

const CHECK_IF_INLINE = gql`
  query Query {
    checkIfAgentIsInline
  }
`;

const GET_RECORDING = gql`
  mutation getCallRecording($user_id: ID!, $mobile: String!) {
    getCallRecording(user_id: $user_id, mobile: $mobile)
  }
`;

const NEW_UPDATE_ONCALLFILE = gql`
  subscription updateOnCallfiles {
    updateOnCallfiles {
      bucket
      message
    }
  }
`;

const ALL_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      _id
      canCall
    }
  }
`;

// type Bucket = {
//   _id: string;
//   name: string;
// };

type BucketCanCall = {
  _id: string;
  canCall: boolean;
};

type Dispotype = {
  id: string;
  code: string;
  name: string;
};

type UpdateProduction = {
  message: string;
  success: boolean;
  start: string;
};

const UPDATE_PRODUCTION = gql`
  mutation UpdateProduction($type: String!) {
    updateProduction(type: $type) {
      message
      success
      start
    }
  }
`;

const NEW_UPDATE_ONBUCKET = gql`
  subscription newUpdateOnBucket {
    newUpdateOnBucket {
      bucket
      message
    }
  }
`;

const MAKING_CALL = gql`
  mutation makeCall($phoneNumber: String!) {
    makeCall(phoneNumber: $phoneNumber)
  }
`;

const IS_AUTO_DIAL = gql`
  query isAutoDial {
    isAutoDial
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
        {data.slice(0, 50).map((customer, index) => {
          return (
            <div
              key={customer._id}
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
          );
        })}
      </>
    );
  }
);

type Props = {
  label: string;
  values?: (string | null | undefined)[];
  fallbackHeight?: string;
  onClickValue?: (phone: string) => void;
  canCall?: boolean;
};

const FieldListDisplay = memo(
  ({
    label,
    values = [],
    fallbackHeight = "p-5",
    onClickValue,
    canCall,
  }: Props) => {
    const isEmpty = !values || values.length === 0;
    const isPhoneNumber = label.toLowerCase() === "mobile no.";

    return (
      <div className="w-full lg:text-xs text-[0.8rem]">
        <div className="font-bold text-black lg:text-sm text-[0.9rem] uppercase">
          {label}:
        </div>
        <div className="flex flex-col gap-2">
          {isEmpty ? (
            <div
              className={`w-full border italic text-xs items-center px-3 h-full py-2.5 border-black ${fallbackHeight}  rounded-sm bg-gray-50 text-gray-400 text-wrap`}
            >
              No information
            </div>
          ) : (
            values?.map((val, index) => (
              <div className="flex gap-2 w-full " key={index}>
                <div
                  className={`w-full ${
                    label.toLowerCase() === "address" ? "" : ""
                  }  border border-black p-2.5 rounded-sm bg-gray-50 text-black flex flex-wrap`}
                >
                  {val}
                </div>
                {canCall &&
                  isPhoneNumber &&
                  val &&
                  val.trim() !== "" &&
                  index !== 0 && (
                    <button
                      onClick={() => {
                        onClickValue?.(val);
                      }}
                      className={`  hover:bg-green-600 bg-green-500 cursor-pointer border-green-900 p-[7px] border-2 text-white rounded-md transition-all borde2 shadow-md `}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                        />
                      </svg>
                    </button>
                  )}
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
    value: React.ReactNode;
  }) => {
    const hasValue = value !== null && value !== undefined && value !== "";
    const displayValue = hasValue ? value : <div className="italic text-gray-400">No information</div>;

    return (
      <div className=" w-full  mt-1 lg:text-xs text-[0.8em] ">
        <div className="font-bold text-black uppercase lg:text-sm text-[0.9rem]">
          {label}:
        </div>
        <div
          className={`${hasValue ? "p-2.5" : "p-2.5"} w-full border border-black rounded-sm  bg-gray-50 text-black text-wrap`}
        >
          {displayValue}
        </div>
      </div>
    );
  }
);

const CustomerDisposition = () => {
  const {
    userLogged,
    selectedCustomer,
    breakValue,
    isOnlineOnVici,
    onCall,
    isRing,
    mobileToCall,
    readyForBreak,
  } = useSelector((state: RootState) => state.auth);
  const [manualDial, setManualDial] = useState<string | null>(null);
  const [isUpdate, setIsUpdate] = useState<boolean>(false);
  const [isSearch, setIsSearch] = useState<Search[] | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isRPC, setIsRPC] = useState<boolean>(false);

  const [search, setSearch] = useState<string>("");
  const [breaker, setBreaker] = useState(false);
  const [dial, setDial] = useState(false);
  const containerRef = useRef(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [dispoLoading, setDispoLoading] = useState<boolean>(false);

  useEffect(() => {
    if (readyForBreak && !selectedCustomer) {
      onClickBreakSelection(BreakEnum[readyForBreak as keyof typeof BreakEnum]);
      dispatch(setReadyForBreak(null));
    }
  }, [readyForBreak, selectedCustomer]);

  useEffect(() => {
    if (search.trim() === "") {
      setIsSearch(null);
    }
  }, [search]);

  const { data: bucketData, refetch: bucketsRefetch } = useQuery<{
    getAllBucket: BucketCanCall[];
  }>(ALL_BUCKET, {
    notifyOnNetworkStatusChange: true,
  });

  const canCallBuckets = bucketData?.getAllBucket
    ?.filter((x) => userLogged?.buckets?.includes(x._id))
    .map((bucket) => bucket.canCall);

  const { refetch } = useQuery<{ search: Search[] }>(SEARCH, {
    skip: !isSearch,
    notifyOnNetworkStatusChange: true,
  });
  const { data: dispotypes } = useQuery<{ getDispositionTypes: Dispotype[] }>(
    DISPOTYPES
  );
  const [presetSelection, setPresetSelection] = useState<PresetSelection>({
    amount: null,
    label: null,
  });

  const [updateProduction] = useMutation<{
    updateProduction: UpdateProduction;
  }>(UPDATE_PRODUCTION, {
    onCompleted: () => {
      dispatch(setStart(new Date().toString()));
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const onClickBreakSelection = async (value: string) => {
    setBreaker(false);
    dispatch(setBreakValue(BreakEnum[value as keyof typeof BreakEnum]));
    await updateProduction({ variables: { type: value } });
  };

  useEffect(() => {
    if (dial && inputRef.current) {
      inputRef.current.focus();

      inputRef.current.select();
    }
  }, [dial]);

  const handleNumberClick = (num: string) => {
    setManualDial((prev) => {
      const current = prev ?? "";
      if (current.length >= 11 && current.includes("09")) return current;
      return current + num;
    });
  };

  const handleClear = () => setManualDial(null);
  const findPaid = dispotypes?.getDispositionTypes?.find(
    (dt) => dt.code === "PAID"
  );

  const debouncedSearch = useMemo(() => {
    return debounce(async (val: string) => {
      if (val && val.trim() !== "") {
        const res = await refetch({ search: val });
        setIsSearch(res.data.search);
      }
    }, 500);
  }, [refetch]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    debouncedSearch(val);
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const [selectTask, { loading: selectTaskLoading }] = useMutation(
    SELECT_TASK,
    {
      onCompleted: () => {
        setSearch("");
      },
      onError: (err) => {
        if (err.message.includes("Already taken")) {
          dispatch(setSelectedCustomer(null));
          dispatch(
            setSuccess({
              success: true,
              message: "Customer already taken by other agent",
              isMessage: false,
            })
          );
        }
      },
    }
  );

  const onClickSearch = useCallback(
    async (customer: Search) => {
      const res = await selectTask({ variables: { id: customer._id } });
      if (!res.errors) {
        setIsSearch(null);
        setSearch("");
        dispatch(setSelectedCustomer(customer));
      }
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

  const { data, refetch: caiiRefetching } = useQuery<{
    checkIfAgentIsInline: string;
  }>(CHECK_IF_INLINE, {
    notifyOnNetworkStatusChange: true,
  });

  const checkIfAgentIsInline = data?.checkIfAgentIsInline;

  const clearSelectedCustomer = useCallback(async () => {
    const res = await deselectTask({
      variables: { id: selectedCustomer?._id },
    });
    if (!res?.errors) {
      setSearch("");
      dispatch(setIsRing(false));
      if (
        !checkIfAgentIsInline?.includes("PAUSE") &&
        canCallBuckets?.includes(true)
      ) {
        await endAndDispoCall();
      }
    }
  }, [
    selectedCustomer,
    deselectTask,
    checkIfAgentIsInline,
    canCallBuckets,
    dispatch,
    setSearch,
  ]);

  useEffect(() => {
    if (breakValue !== BreakEnum.PROD && userLogged?.type === "AGENT") {
      navigate("/break-view");
    }
  }, [breakValue, navigate]);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "RPCTODAY" as "RPCTODAY" | "UPDATE" | "CREATE",
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

  const { refetch: refetchRandomCustomer } = useQuery<{
    randomCustomer: Search;
  }>(PICK_RANDOM, {
    variables: { buckets: userLogged?.buckets },
    notifyOnNetworkStatusChange: true,
  });

  const [updateRPC, { loading: updateRPCLoading }] = useMutation<{
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

  const callbackUpdateRPC = useCallback(async () => {
    await updateRPC({
      variables: { id: selectedCustomer?.customer_info?._id },
    });
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
  const [confirm, setConfirm] = useState(false);

  const [getCallRecording, { loading: getCallingRecordingLoading }] =
    useMutation<{ getCallRecording: string }>(GET_RECORDING, {
      onCompleted: (data) => {
        dispatch(setCallUniqueId(data.getCallRecording));
      },
    });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viciDialStatus, setViciDialStatus] = useState<string | null>(null);

  const autoSearch = useCallback(async () => {
    const { data } = await caiiRefetching();
    if (data?.checkIfAgentIsInline) {
      setViciDialStatus(data?.checkIfAgentIsInline);
      setErrorMessage(null);
      const splitInline = data.checkIfAgentIsInline?.split("|") ?? null;
      dispatch(
        setViciOnAir(
          `${splitInline[10]}|${splitInline[splitInline.length - 1]}`
        )
      );
      const res = await refetch({ search: splitInline[10] });
      if (!res.error) {
        if (res.data.search.length > 1) {
          setIsSearch(res.data.search);
        } else if (res.data.search.length === 1) {
          const selectingTask = await selectTask({
            variables: { id: res.data.search[0]._id },
          });
          if (!selectingTask?.errors) {
            dispatch(setSelectedCustomer(res.data.search[0]));
          }
        }
      }
    } else {
      setErrorMessage(
        !data.checkIfAgentIsInline
          ? "You dont have any call on vicidial"
          : data.checkIfAgentIsInline
      );
    }
  }, [
    caiiRefetching,
    refetch,
    dispatch,
    selectTask,
    setErrorMessage,
    setViciOnAir,
  ]);

  const [makeCall] = useMutation<{
    makeCall: string;
  }>(MAKING_CALL, {
    onCompleted: async (data) => {
      const makeCall = data.makeCall;
      setDial(false);
      setBreaker(false);
      const jsonPart = makeCall.split("||")[1];
      if (jsonPart !== undefined) {
        dispatch(setOnCall(true));
      }
    },
  });
  const [randomLoading, setRandomLoading] = useState(false);
  const handleRandomFetch = async () => {
    if (isAutoDialData?.isAutoDial) {
      dispatch(setIsRing(true));
    }

    setRandomLoading(true);

    const res = await refetchRandomCustomer({
      buckets: userLogged?.buckets,
      autoDial: false,
    });

    if (res.data.randomCustomer) {
      setRandomLoading(false);
      const selectionRes = await selectTask({
        variables: { id: res?.data?.randomCustomer?._id },
      });
      if (!selectionRes.errors) {
        dispatch(setSelectedCustomer(res?.data?.randomCustomer));
      }
    } else {
      setRandomLoading(false);
      dispatch(
        setSuccess({
          success: true,
          message: "All accounts already dial",
          isMessage: false,
        })
      );
    }
  };
  // =============================== need to add on skip

  useSubscription<{ newUpdateOnBucket: { bucket: string; message: string } }>(
    NEW_UPDATE_ONBUCKET,
    {
      onData: async ({ data }) => {
        if (data) {
          if (
            userLogged?.buckets.includes(
              data.data?.newUpdateOnBucket?.bucket as string
            ) &&
            data.data?.newUpdateOnBucket.message === "NEW_UPDATE_BUCKET"
          ) {
            await bucketsRefetch();
          }
        }
      },
    }
  );

  const { data: isAutoDialData, refetch: isAutodialRefetch } = useQuery<{
    isAutoDial: boolean;
  }>(IS_AUTO_DIAL, {
    notifyOnNetworkStatusChange: true,
    skip: !location.pathname.includes("cip") || !canCallBuckets?.includes(true),
  });

  useSubscription<{ updateOnCallfiles: { bucket: string; message: string } }>(
    NEW_UPDATE_ONCALLFILE,
    {
      onData: async ({ data }) => {
        if (data) {
          if (data.data) {
            if (
              userLogged?.buckets?.includes(
                data?.data?.updateOnCallfiles?.bucket as string
              ) &&
              data.data?.updateOnCallfiles?.message === "NEW_UPDATE_CALLFILE"
            ) {
              await isAutodialRefetch();
            }
          }
        }
      },
    }
  );

  useEffect(() => {
    const refetching = async () => {
      await bucketsRefetch();
      await isAutodialRefetch();
    };
    refetching();
  }, []);

  useEffect(() => {
    setTimeout(async () => {
      if (!canCallBuckets?.includes(true)) {
        return null;
      }
      if (
        !selectedCustomer &&
        userLogged?.type === "AGENT" &&
        search.trim() === "" &&
        isOnlineOnVici &&
        isAutoDialData?.isAutoDial &&
        userLogged?.account_type === "caller"
      ) {
        const res = await refetchRandomCustomer({
          buckets: userLogged?.buckets,
          autoDial: true,
        });

        if (res.data.randomCustomer === null) {
          dispatch(
            setSuccess({
              success: true,
              message: "Callfile already finished to call",
              isMessage: false,
            })
          );
        } else {
          const selectTaskres = await selectTask({
            variables: { id: res?.data?.randomCustomer?._id },
          });
          if (!selectTaskres.errors) {
            dispatch(setIsRing(true));
            dispatch(setSelectedCustomer(res?.data?.randomCustomer));
          }
        }
      }
    }, 1000);
  }, [selectedCustomer, search, isAutoDialData?.isAutoDial, breakValue]);

  function normalizePhilippineNumber(rawNumber: string): string | null {
    if (!rawNumber) return null;

    let number = rawNumber.replace(/\D/g, "");

    if (number.startsWith("00")) number = number.slice(2);
    if (number.startsWith("63")) number = number.slice(2);

    if (!number.startsWith("0")) number = "0" + number;

    const mobileRegex = /^09\d{9}$/;
    if (mobileRegex.test(number)) return number;

    const landlineRegex = /^0\d{7,10}$/;
    if (landlineRegex.test(number)) return number;

    return null;
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!canCallBuckets?.includes(true)) return null;

      if (
        Boolean(selectedCustomer) &&
        isOnlineOnVici &&
        checkIfAgentIsInline?.includes("PAUSE") &&
        isAutoDialData?.isAutoDial
      ) {
        let rawNumber = selectedCustomer?.customer_info?.contact_no[0];
        const phoneNumber = normalizePhilippineNumber(rawNumber as string);
        if (!phoneNumber) return;

        if (!onCall || !isRing) {
          setDial(false);
          dispatch(setMobileToCall(phoneNumber));
          await makeCall({ variables: { phoneNumber: phoneNumber } });
        }
      }
    });

    return () => clearTimeout(timer);
  }, [selectedCustomer]);

  const manualDialCustomerNumber = useCallback(async (phoneNumber: string) => {
    dispatch(setIsRing(true));

    const newPhone = normalizePhilippineNumber(phoneNumber);

    if (!newPhone) return;

    if (
      checkIfAgentIsInline?.includes("INCALL") ||
      (checkIfAgentIsInline?.includes("PAUSE") &&
        checkIfAgentIsInline.includes("LAGGED") &&
        checkIfAgentIsInline.includes("DISPO"))
    ) {
      await endAndDispoCall();
    }

    setConfirm(false);
    setTimeout(async () => {
      dispatch(setMobileToCall(newPhone));
      await makeCall({ variables: { phoneNumber: newPhone } });
    }, 1000);
  }, []);

  const dialManualNumber = async () => {
    dispatch(setIsRing(true));
    dispatch(setOnCall(true));

    if (isOnlineOnVici && checkIfAgentIsInline?.includes("PAUSE")) {
      const timer = setTimeout(async () => {
        if (!onCall) {
          dispatch(setMobileToCall(manualDial));
          await makeCall({ variables: { phoneNumber: manualDial } });
        }
      });
      return () => clearTimeout(timer);
    }
  };

  useEffect(() => {
    if (checkIfAgentIsInline?.includes("DEAD")) {
      dispatch(setDeadCall(checkIfAgentIsInline?.includes("DEAD")));
    }
  }, [checkIfAgentIsInline]);

  const [endAndDispoCall] = useMutation<{
    endAndDispoCall: { success: boolean; message: string };
  }>(END_CALL, {
    onCompleted: async (data) => {
      dispatch(setOnCall(false));
      dispatch(
        setSuccess({
          message: data.endAndDispoCall.message,
          success: data.endAndDispoCall.success,
          isMessage: false,
        })
      );
      if (mobileToCall) {
        await getCallRecording({
          variables: { user_id: userLogged?._id, mobile: mobileToCall },
        });
        dispatch(setMobileToCall(null));
      }
    },
  });

  const handleEndCall = useCallback(async () => {
    if (!canCallBuckets?.includes(true)) return null;

    setConfirm(true);
    setManualDial(null);
    // setPause(false);
    setModalProps({
      message: "End the call?",
      toggle: "CREATE",
      yes: async () => {
        await endAndDispoCall();
        setConfirm(false);
        dispatch(setIsRing(false));
      },
      no: () => setConfirm(false),
    });
  }, [endAndDispoCall, setModalProps, setConfirm, canCallBuckets]);

  const handleUsingPhoneUI = useCallback(async () => {
    if (!canCallBuckets?.includes(true)) return null;

    if (
      (checkIfAgentIsInline?.includes("PAUSED") &&
        !checkIfAgentIsInline?.includes("LAGGED")) ||
      (checkIfAgentIsInline?.includes("INCALL") &&
        checkIfAgentIsInline?.includes("DEAD"))
    ) {
      if (!Boolean(selectedCustomer)) {
        handleRandomFetch();
      } else {
        if (
          selectedCustomer?.customer_info?.contact_no &&
          selectedCustomer?.customer_info?.contact_no?.length > 0
        ) {
          setConfirm(true);

          if (selectedCustomer?.customer_info?.contact_no[0].trim() !== "") {
            setModalProps({
              message: `Do you want to redial this number (${selectedCustomer?.customer_info?.contact_no[0]})?`,
              toggle: "CREATE",
              yes: () => {
                dispatch(setCallUniqueId(null));
                manualDialCustomerNumber(
                  selectedCustomer?.customer_info?.contact_no[0] || ""
                );
              },
              no: () => setConfirm(false),
            });
          }
        }
      }
    }
  }, [
    checkIfAgentIsInline,
    selectedCustomer,
    manualDialCustomerNumber,
    handleRandomFetch,
  ]);

  useEffect(() => {
    if (checkIfAgentIsInline?.includes("INCALL")) {
      dispatch(setOnCall(true));
    } else {
      dispatch(setOnCall(false));
    }
  }, [data, dispatch]);

  const [showHelper, setShowHelper] = useState<boolean>(false);

  const isLoading = loading || selectTaskLoading;

  if (isLoading) return <Loading />;

  if (!userLogged) return <Navigate to="/" />;

  if (!isOnlineOnVici && canCallBuckets?.includes(true))
    return <NeedToLoginVici />;

  return (
    <>
      {showHelper && <Helper close={() => setShowHelper(false)} />}
      <div className="overflow-hidden flex flex-col relative h-full w-full">
        {!selectedCustomer && (
          <div className="absolute bottom-3 left-3 ">
            <button
              className=" rounded-full text-2xl p-2 bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-none flex items-center justify-center cursor-pointer text-b transition-all font-bold "
             title="Help?"
              onClick={() => setShowHelper(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="size-10 rounded-full"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 0 1-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 0 1-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {readyForBreak && (
          <div className="absolute top-10 z-20  left-0 translate-x-1/2 text-center py-2 w-1/2 text-2xl border-2 border-red-500 rounded-xl bg-red-200 font-bold text-red-600">
            You are on <span className="underline">{readyForBreak} Break</span>{" "}
            after this session!
          </div>
        )}
        <div className="oveflow-hidden flex h-full w-full ">
          {(isRPCToday || isRPC) && <Confirmation {...modalProps} />}

          {confirm && <Confirmation {...modalProps} />}

          <div
            ref={containerRef}
            className={`h-full w-full overflow-y-auto overflow-x-hidden outline-none flex flex-col gap-2 `}
            onMouseDown={(e) => {
              if (
                !childrenDivRef.current?.divElement?.contains(e.target as Node)
              ) {
                childrenDivRef?.current?.showButtonToFalse();
              }
            }}
          >
            <div className="flex w-full p-1.5 z-30">
              {userLogged?.type === "AGENT" && <AgentTimer />}
              {(!isRing || !onCall) && !selectedCustomer && <MyTaskSection />}
            </div>

            <div className="flex gap-3 w-full justify-center px-5 lg:px-10 2xl:px-20 flex-col lg:flex-row items-center py-5">
              <motion.div
                key={"customer-bg"}
                className={`flex w-full  ${
                  selectedCustomer ? "" : "lg:w-1/2 2xl:w-1/3"
                } h-full 2xl:flex-row flex-col items-center relative  justify-center gap-5`}
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1, type: "spring" }}
                  layout
                  className="w-full"
                >
                  <div className=" bg-gray-100 h-full w-full transition-all flex flex-col shadow-md shadow-black/20 overflow-hidden rounded-md items-center border-black ovesrflow-hidden z-10 border relative">
                    <div className="w-32 h-32 absolute -top-28"></div>

                    <div className="top-40 absolute  left-0 bg-black"></div>

                    <h1 className="text-center px-10 w-full flex-nowrap truncate text-ellipsis py-3 border-b bg-gray-400 border-black uppercase font-black text-black text-2xl mb-1 ">
                      Customer Information
                    </h1>
                    <div
                      className={`flex  w-full ${
                        selectedCustomer?.customer_info.isRPC
                          ? "justify-start"
                          : "justify-end px-5 py-2"
                      } `}
                    >
                      {selectedCustomer &&
                        !selectedCustomer?.customer_info.isRPC && (
                          <button
                            className={`px-10 py-1.5 rounded text-white font-black transition-all border-2 shadow-md ${
                              isUpdate ? "2xl:absolute top-5 right-5" : ""
                            } ${
                              updateRPCLoading
                                ? "bg-orange-300 border-orange-500 cursor-not-allowed"
                                : "bg-orange-500 border-orange-700 hover:shadow-none hover:bg-orange-600 cursor-pointer"
                            }`}
                            title="Right Person Contacted"
                            disabled={updateRPCLoading}
                            onClick={() => {
                              if (!updateRPCLoading) {
                                handleClickRPC();
                              }
                            }}
                          >
                            {updateRPCLoading ? "Processing..." : "RPC"}
                          </button>
                        )}
                      {selectedCustomer?._id &&
                        selectedCustomer?.customer_info?.isRPC && (
                          <IoRibbon className=" text-5xl text-blue-500" />
                        )}
                    </div>

                    <div className="px-5 flex flex-col w-full pb-5">
                      {!selectedCustomer && (
                        <div className="relative w-full flex justify-center">
                          {!isAutoDialData?.isAutoDial && (
                            <div className="w-full flex gap-2">
                              <input
                                accessKey="z"
                                type="text"
                                name="search"
                                autoComplete="off"
                                value={search}
                                onChange={(e) =>
                                  handleSearchChange(e.target.value)
                                }
                                id="search"
                                placeholder="Search"
                                className=" w-full p-2 text-sm  text-gray-900 border border-black rounded-sm bg-gray-50 focus:ring-blue-500 focus:ring outline-0 focus:border-blue-500 "
                              />
                              <button
                                className="border-2 rounded px-5 cursor-pointer bg-blue-600 hover:bg-blue-700 transition-all text-white border-blue-900 uppercase font-bold text-sm"
                                onClick={autoSearch}
                              >
                                Search
                              </button>
                            </div>
                          )}
                          {errorMessage && (
                            <div className="w-full h-auto top-10 absolute p-2 italic border text-slate-700 font-medium text-sm bg-gray-200 shadow shadow-black/50 rounded">
                              {errorMessage}
                            </div>
                          )}
                          {isSearch && isSearch?.length > 0 && (
                            <div
                              className={`absolute max-h-96 border border-black w-full  left-1/2 -translate-x-1/2 bg-white overflow-y-auto rounded-sm top-10`}
                            >
                              <SearchResult
                                data={isSearch || []}
                                search={search}
                                onClick={onClickSearch}
                              />
                            </div>
                          )}
                          {isSearch && isSearch.length <= 0 && (
                            <div className="w-full h-auto top-10 absolute p-2 italic border text-slate-700 font-medium text-sm bg-gray-200 shadow shadow-black/50 rounded">
                              No file was found, or another agent has already
                              taken the customer.
                            </div>
                          )}
                        </div>
                      )}
                      <FieldDisplay
                        label="Full Name"
                        value={selectedCustomer?.customer_info?.fullName|| <div className="italic text-gray-400">No information</div>}
                      />
                      <FieldDisplay
                        label="Date Of Birth (yyyy-mm-dd)"
                        value={selectedCustomer?.customer_info?.dob || <div className="italic text-gray-400">No information</div>}
                      />
                      <FieldDisplay
                        label="Gender"
                        value={(() => {
                          const gender =
                            selectedCustomer?.customer_info?.gender?.toLowerCase();
                          if (gender === "f" || gender === "female") return "Female";
                          if (gender === "m" || gender === "male") return "Male";
                          if (gender === "o" || gender === "other") return "Other";
                          return null;
                        })()}
                      />

                      <FieldListDisplay
                        label="Mobile No."
                        values={
                          selectedCustomer?.customer_info?.contact_no[0]
                            ? selectedCustomer?.customer_info?.contact_no
                            : []
                        }
                        canCall={canCallBuckets?.includes(true)}
                        onClickValue={manualDialCustomerNumber}
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
                      {selectedCustomer &&
                        selectedCustomer.emergency_contact && (
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
                                value={
                                  selectedCustomer.emergency_contact.mobile
                                }
                              />
                            </div>
                          </div>
                        )}
                      {!isUpdate && (
                        <div className=" 2xl:text-sm lg:text-xs mt-5 flex justify-end">
                          {selectedCustomer && (
                            <div>
                              {((selectedCustomer?.current_disposition &&
                                findPaid?.id ===
                                  selectedCustomer?.current_disposition
                                    ?.disposition &&
                                selectedCustomer?.current_disposition
                                  .selectivesDispo) ||
                                !selectedCustomer?.current_disposition ||
                                (selectedCustomer.assigned &&
                                  selectedCustomer.assigned ===
                                    userLogged._id) ||
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
                              {!isAutoDialData?.isAutoDial && (
                                <button
                                  type="button"
                                  onClick={clearSelectedCustomer}
                                  className={`bg-gray-500 border-2 border-gray-800 hover:bg-gray-600 focus:outline-none text-white  focus:ring-4 focus:ring-slate-300 font-black transition-all uppercase shadow-md rounded-md  w-24 py-2.5 me-2 mb-2 cursor-pointer`}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {selectedCustomer && (
                <div className="flex flex-col w-full  items-end justify-between gap-3 ">
                  <AccountInfo
                    ref={childrenDivRef}
                    presetSelection={presetSelection}
                  />

                  <div className="flex items-end h-full w-full justify-end">
                    {selectedCustomer && (
                      <DispositionForm
                        updateOf={() => setIsUpdate(false)}
                        inlineData={viciDialStatus || ""}
                        canCall={isAutoDialData?.isAutoDial as boolean}
                        onPresetAmountChange={setPresetSelection}
                        setLoading={(e: boolean) => setDispoLoading(e)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence>
              {isUpdate && (
                <div className="fixed z-50 top-0 justify-center items-center left-0 w-full overflow-hidden flex h-full">
                  <motion.div
                    key={"modal_background_cui"}
                    onClick={() => setIsUpdate(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className=" cursor-pointer z-30 absolute top-0 left-0 bg-black/30  backdrop-blur-sm w-full h-full"
                  ></motion.div>
                  <motion.div
                    key={"modal_cui"}
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

            {/* Dial Button the violet one*/}
            {canCallBuckets?.includes(true) && (
              <motion.div
                drag
                key={"canCallBuclet-div"}
                dragConstraints={containerRef}
                dragElastic={0.1}
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, type: "spring" }}
                className={`" w-40 rounded-full cursor-grab active:cursor-grabbing absolute top-30 right-20 z-40 justify-center items-center flex "`}
              >
                {(randomLoading ||
                  getCallingRecordingLoading ||
                  dispoLoading) &&
                !isRing &&
                checkIfAgentIsInline?.includes("PAUSE") ? (
                  <div className=" h-40  border-0 bg-white w-full rounded-full flex items-center justify-center">
                    <div className="absolute z-20 text-gray-500 text-sm">
                      Please wait...
                    </div>
                    <div className="border-t-2 bg-gray-100 shadow-md w-40 h-40 animate-spin rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {!checkIfAgentIsInline?.includes("INCALL") &&
                      !isRing &&
                      !isAutoDialData?.isAutoDial && (
                        <div
                          onClick={() => {
                            if (dial) {
                              setManualDial(null);
                              setBreaker(false);
                              setDial((prev) => !prev);
                            } else {
                              setBreaker(false);

                              setDial((prev) => !prev);
                            }
                          }}
                          className="absolute z-50 -top-4 cursor-pointer"
                        >
                          <motion.div
                            key={"dial-button-key"}
                            initial={{ x: 0, y: 40, opacity: 0 }}
                            animate={{ x: 0, y: 0, opacity: 1 }}
                            transition={{
                              type: "spring",
                              delay: isRing ? 1.4 : 0.6,
                            }}
                          >
                            <div className="bg-purple-600  text-white cursor-pointer border-purple-950 hover:bg-purple-700 hover:scale-105 text-sm transition-all px-3 py-1 rounded-md border-2 shadow-md font-black uppercase">
                              Keypad{" "}
                            </div>{" "}
                          </motion.div>
                        </div>
                      )}

                    {/* Break button on bottom */}
                    {userLogged?.type === "AGENT" && (
                      <div
                        onClick={() => {
                          if (dial) {
                            setDial(false);
                            setBreaker((prev) => !prev);
                          } else {
                            setBreaker((prev) => !prev);
                          }
                        }}
                        className="absolute z-50 -bottom-3 cursor-pointer"
                      >
                        <motion.div
                          key={"break-button-div"}
                          initial={{ x: 0, y: -40, opacity: 0 }}
                          animate={{ x: 0, y: 0, opacity: 1 }}
                          transition={{
                            type: "spring",
                            delay: isRing ? 1.4 : 0.8,
                          }}
                        >
                          <div className="bg-blue-600 text-white cursor-pointer border-blue-900 hover:bg-blue-700 hover:scale-105 text-sm transition-all px-3 py-1 rounded-md border-2 shadow-md font-black uppercase">
                            break{" "}
                          </div>{" "}
                        </motion.div>
                      </div>
                    )}

                    {/*Break selection*/}
                    <AnimatePresence>
                      {breaker && (
                        <motion.div
                          key={"breaker-div"}
                          className="z-100 cursor-default bg-gray-200 shadow-md overflow-hidden border-2 rounded-md border-gray-800 -bottom-[216px] text-black absolute"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                        >
                          <div className="overflow-y-auto max-h-[194px]">
                            {breaks.map((e, index) => (
                              <div
                                key={index}
                                onClick={() => {
                                  setBreaker(false);
                                  if (readyForBreak !== e.value) {
                                    dispatch(
                                      setReadyForBreak(e.value as BreakEnum)
                                    );
                                  } else {
                                    dispatch(setReadyForBreak(null));
                                  }
                                }}
                                className="px-7 py-1 border-r last:border-b-0 cursor-pointer text-black border-b transition-all border-gray-300 odd:bg-gray-100 even:bg-white hover:bg-gray-200 whitespace-nowrap"
                              >
                                <div className="font-black uppercase">
                                  {e.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Dial phone button */}
                    <AnimatePresence>
                      {dial && (
                        <motion.div
                          key={"dialer-button-div"}
                          className="bg-gray-200 z-100 cursor-default shadow-md p-2 border-2 rounded-md border-gray-800 -bottom-54 text-black absolute"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                        >
                          <div>
                            <input
                              className="border bg-gray-400 text-center flex font-black py-1 focus:outline-none border-black rounded-sm shadow-md"
                              placeholder="Ex. 09123456789"
                              ref={inputRef}
                              type="text"
                              value={manualDial || ""}
                              onChange={(e) =>
                                setManualDial(
                                  e.target.value.replace(/[^0-9]/g, "")
                                )
                              }
                              maxLength={11}
                            />
                          </div>

                          <div className="grid items-center grid-cols-3 gap-2 py-2 font-black uppercase">
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                              (num) => (
                                <div
                                  key={num}
                                  onClick={() => handleNumberClick(num)}
                                  className="text-center cursor-pointer transition-all hover:bg-gray-400 bg-gray-300 rounded-sm shadow-md border"
                                >
                                  {num}
                                </div>
                              )
                            )}

                            <div className="justify-center text-center flex h-full">
                              <div
                                onClick={() => {
                                  if (manualDial && manualDial.length > 1) {
                                    handleClear();
                                  }
                                }}
                                className={`" ${
                                  manualDial && manualDial.length > 0
                                    ? "bg-red-600 cursor-pointer hover:bg-red-800 border-red-950 text-white "
                                    : "bg-gray-400 border-gray-500 cursor-not-allowed text-gray-300"
                                }  h-full  w-full text-xs flex items-center justify-center border shadow-md  rounded-sm "`}
                              >
                                clear
                              </div>
                            </div>

                            <div
                              onClick={() => handleNumberClick("0")}
                              className="text-center cursor-pointer transition-all hover:bg-gray-400 bg-gray-300 rounded-sm shadow-md border"
                            >
                              0
                            </div>
                            <div
                              onClick={() => {
                                if (
                                  manualDial &&
                                  manualDial.length > 10 &&
                                  manualDial.includes("09")
                                ) {
                                  dialManualNumber();
                                }
                              }}
                              className={`" ${
                                manualDial &&
                                manualDial.length > 10 &&
                                manualDial.includes("09")
                                  ? "bg-green-500 hover:bg-green-600 border-black cursor-pointer text-white"
                                  : "bg-gray-400 border-gray-500 cursor-not-allowed text-gray-300"
                              }  h-full flex justify-center   transition-all shadow-md text-center items-center border  text-xs rounded-sm "`}
                            >
                              Dial
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div
                      className={` ${
                        (checkIfAgentIsInline?.includes("INCALL") &&
                          !checkIfAgentIsInline?.includes("DIAL") &&
                          !checkIfAgentIsInline?.includes("DEAD")) ||
                        (checkIfAgentIsInline?.includes("PAUSED") &&
                          checkIfAgentIsInline?.includes("LAGGED") &&
                          checkIfAgentIsInline?.includes("DISPO"))
                          ? "bg-purple-900 border-black"
                          : "bg-gray-100 border-gray-900"
                      }  p-2 border-2  rounded-full h-full w-full shadow-md shadow-black/20 `}
                    >
                      <div className={`transition-all duration-300 `}>
                        <div className="w-full relative h-full flex justify-center items-center">
                          {/* Frequency */}
                          <AnimatePresence>
                            {((checkIfAgentIsInline?.includes("INCALL") &&
                              !checkIfAgentIsInline?.includes("DIAL") &&
                              !checkIfAgentIsInline?.includes("DEAD")) ||
                              (checkIfAgentIsInline?.includes("PAUSED") &&
                                checkIfAgentIsInline?.includes("LAGGED") &&
                                checkIfAgentIsInline?.includes("DISPO"))) && (
                              <motion.div
                                key={"lottie-frequency-div"}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                layout
                                className="absolute -top-0 p-3 rounded-md "
                              >
                                <Lottie animationData={frequency} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Dialer phone */}
                        <div className="absolute w-full font-black uppercase text-green-900 justify-evenly  cursor-grab flex flex-col  h-full items-center right-0 z-20 top-0">
                          {((!isRing &&
                            checkIfAgentIsInline?.includes("PAUSED")) ||
                            (isRing &&
                              checkIfAgentIsInline?.includes("INCALL")) ||
                            (checkIfAgentIsInline?.includes("PAUSED") &&
                              checkIfAgentIsInline?.includes("LAGGED") &&
                              checkIfAgentIsInline?.includes("DISPO"))) && (
                            <motion.div
                              key={""}
                              className="absolute -left-5 top-14.5 transition-al"
                              initial={{ x: 40, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ type: "spring", delay: 0.2 }}
                            >
                              <div
                                onClick={handleUsingPhoneUI}
                                className={`" ${
                                  !(
                                    (checkIfAgentIsInline?.includes("PAUSED") &&
                                      !checkIfAgentIsInline?.includes(
                                        "LAGGED"
                                      ) &&
                                      !checkIfAgentIsInline?.includes(
                                        "DISPO"
                                      )) ||
                                    (checkIfAgentIsInline?.includes("PAUSED") &&
                                      checkIfAgentIsInline?.includes(
                                        "LAGGED"
                                      ) &&
                                      !checkIfAgentIsInline?.includes(
                                        "DISPO"
                                      )) ||
                                    (checkIfAgentIsInline?.includes("INCALL") &&
                                      checkIfAgentIsInline?.includes("DEAD"))
                                  )
                                    ? "bg-gray-400 border-gray-500 cursor-not-allowed "
                                    : " hover:scale-110 cursor-pointer bg-green-500 hover:bg-green-600 border-green-900 "
                                }  transition-all items-center justify-center flex p-2 text-white  rounded-full border-2 "`}
                              >
                                <div
                                  title={
                                    !Boolean(selectedCustomer)
                                      ? "Dial Next"
                                      : "Re-Dial"
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-5"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M19.5 9.75a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 1 1.5 0v2.69l4.72-4.72a.75.75 0 1 1 1.06 1.06L16.06 9h2.69a.75.75 0 0 1 .75.75Z"
                                      clipRule="evenodd"
                                    />
                                    <path
                                      fillRule="evenodd"
                                      d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* End call */}
                          {((!isRing &&
                            checkIfAgentIsInline?.includes("PAUSED")) ||
                            (isRing &&
                              checkIfAgentIsInline?.includes("INCALL")) ||
                            (checkIfAgentIsInline?.includes("PAUSED") &&
                              checkIfAgentIsInline?.includes("LAGGED") &&
                              checkIfAgentIsInline?.includes("DISPO"))) && (
                            <motion.div
                              className={`" absolute -right-5 top-14.5  "`}
                              initial={{ x: -40, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{
                                type: "spring",
                                delay: isRing ? 1 : 0.4,
                              }}
                            >
                              <div
                                className={` ${
                                  (isRing &&
                                    checkIfAgentIsInline?.includes("INCALL")) ||
                                  (checkIfAgentIsInline?.includes("PAUSED") &&
                                    checkIfAgentIsInline?.includes("LAGGED") &&
                                    checkIfAgentIsInline?.includes("DISPO"))
                                    ? "bg-red-500 border-red-900 hover:scale-110 cursor-pointer "
                                    : "border-gray-900 cursor-not-allowed  bg-gray-400 "
                                } transition-all text-white   p-2  rounded-full border-2  `}
                                onClick={() => {
                                  {
                                    if (
                                      checkIfAgentIsInline?.includes(
                                        "INCALL"
                                      ) ||
                                      (checkIfAgentIsInline?.includes(
                                        "PAUSED"
                                      ) &&
                                        checkIfAgentIsInline?.includes(
                                          "LAGGED"
                                        ) &&
                                        checkIfAgentIsInline?.includes("DISPO"))
                                    ) {
                                      handleEndCall();
                                    }
                                  }
                                }}
                                title="End Call"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="size-5"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M15 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-4.72 4.72a.75.75 0 1 1-1.06-1.06l4.72-4.72h-2.69a.75.75 0 0 1-.75-.75Z"
                                    clipRule="evenodd"
                                  />
                                  <path
                                    fillRule="evenodd"
                                    d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Middle Phone */}

                      {(!isRing ||
                        (isRing && checkIfAgentIsInline?.includes("PAUSED")) ||
                        (isRing &&
                          checkIfAgentIsInline?.includes("INCALL") &&
                          !checkIfAgentIsInline?.includes("DIAL"))) && (
                        <Lottie
                          animationData={phone}
                          loop={
                            isRing &&
                            checkIfAgentIsInline?.includes("PAUSED") &&
                            !checkIfAgentIsInline?.includes("LAGGED") &&
                            !checkIfAgentIsInline?.includes("DISPO")
                          }
                          autoplay={
                            isRing &&
                            checkIfAgentIsInline?.includes("PAUSED") &&
                            !checkIfAgentIsInline?.includes("LAGGED") &&
                            !checkIfAgentIsInline?.includes("DISPO")
                          }
                        />
                      )}

                      {isRing &&
                        checkIfAgentIsInline?.includes("INCALL") &&
                        checkIfAgentIsInline?.includes("DIAL") && (
                          <div
                            style={{
                              filter:
                                "invert(10%) sepia(94%) saturate(7475%) hue-rotate(350deg) brightness(100%) contrast(100%)",
                            }}
                          >
                            <Lottie
                              animationData={phone}
                              loop={
                                isRing &&
                                checkIfAgentIsInline?.includes("INCALL") &&
                                checkIfAgentIsInline?.includes("DIAL")
                              }
                              autoplay={
                                isRing &&
                                checkIfAgentIsInline?.includes("INCALL") &&
                                checkIfAgentIsInline?.includes("DIAL")
                              }
                            />
                          </div>
                        )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDisposition;
