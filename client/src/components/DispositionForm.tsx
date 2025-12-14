import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Confirmation from "./Confirmation";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  setDeselectCustomer,
  setSelectedCustomer,
  setServerError,
  setSuccess,
} from "../redux/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";
import { PresetSelection } from "./AccountInfo";
import { CustomerRegistered } from "../middleware/types.ts";

type Data = {
  amount: string | null;
  payment: Payment | null;
  disposition: string | null;
  payment_date: string | null;
  payment_method: PaymentMethod | null;
  ref_no: string | null;
  comment: string | null;
  contact_method: AccountType | null;
  dialer: Dialer | null;
  RFD: RFD | null;
  chatApp: SkipCollector | null;
  sms: SMSCollector | null;
  partialPayment: number | null;
  SOF: string | null
};

type ContactMethod = {
  skip: boolean;
  field: boolean;
  call: boolean;
  sms: boolean;
  email: boolean;
};

type Disposition = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  contact_methods: ContactMethod;
  buckets: string[];
};

const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
      active
      buckets
      contact_methods {
        skip
        field
        call
        sms
        email
      }
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

type Success = {
  success: boolean;
  message: string;
};

const GET_AGENT_BUCKET = gql`
  query getDeptBucket {
    getDeptBucket {
      _id
      name
      canCall
    }
  }
`;

const CREATE_DISPOSITION = gql`
  mutation CreateDisposition($input: CreateDispo) {
    createDisposition(input: $input) {
      success
      message
    }
  }
`;

const TL_ESCATATION = gql`
  mutation TlEscalation($id: ID!, $tlUserId: ID!) {
    tlEscalation(id: $id, tlUserId: $tlUserId) {
      message
      success
    }
  }
`;

const DESELECT_TASK = gql`
  mutation deselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`;

const USER_TL = gql`
  query getBucketTL {
    getBucketTL {
      _id
      name
    }
  }
`;

type Bucket = {
  _id: string;
  name: string;
  canCall: boolean;
};

type TL = {
  _id: string;
  name: string;
};

enum RFD {
  RA = "Restricted Account",
  BA = "Banned Account",
  DA = "Deactivated Account",
  FA = "Frozen Account",
  FPU = "Forgot Password/Username",
  LAA = "Lost access on the account",
  LC = "Lost cellphone/Change SIM card",
  FRAUD = "Fraud/Scam",
  WFS = "Waiting for Salary/Funds",
  LOF = "Lack of funds",
  IF = "Insufficient Funds",
  FTP = "Forgot to pay",
  UNEMPLOYED = "Unemployed",
  MER = "Medical Expenses/Reasons",
  SE = "School Expenses",
  POB = "Prioritized other bills",
  CALM = "Calamity",
  NRFD = "No RFD/Unable to obtain RFD",
  WI = "Wrong item",
  DI = "Defective Item",
  HACS = "Have agreement with customer Service",
  OOT = "Out of town / Out of country",
  UBO = "Use by Other",
  BLS = "Bussiness Loss/Slowdown",
  BUSSCLOSURE = "Bussiness Closure",
  NOOIC = "No Officer In Charge/No SPA In Charge For OFW",
  SOLD = "Sold To 2nd/3rd Owner",
  OBIS = "Occupied By Illegal Settler",
  WAITING = "Waiting Funds",
  DOTF = "Death Of The Family",
  WAP = "W/Adjustment/Unposted Payment",
  FTIC = "Family/SPA Take In Charge",
  TBC = "Temporary Business Closed",
  BUSSCLOSE = "Business Closed",
}

enum Payment {
  FULL = "full",
  PARTIAL = "partial",
}

enum Dialer {
  VICI = "vici",
  ISSABEL = "issabel",
  INBOUND = "inbound",
}

enum AccountType {
  CALL = "call",
  EMAIL = "email",
  SMS = "sms",
  SKIP = "skip",
  FIELD = "field",
}

enum SkipCollector {
  VIBER = "viber",
  WHATSAPP = "whatsapp",
  FACEBOOK = "facebook",
  GOOGLE = "google",
  LINKEDIN = "linkedin",
  GCASH = "gcash",
  YELLOWPAGE = "yellowpage",
  BRGY = "brgy",
  TELEGRAM = "telegram",
}

enum SMSCollector {
  OPENVOX = "openvox",
  DINSTAR = "dinstar",
  INBOUND = "inbound",
  M360 = "M360",
}

enum PaymentMethod {
  BANKTOBANK = "Bank to Bank Transfer",
  SEVENELEVEN = "7/11",
  GCASH_PAYMAYA = "Gcash / Pay Maya",
  CASH = "CASH",
  SHOPEE_PAY = "Shopee Pay",
  CEBUANA_LHUILLIER = "Cebuana Lhuillier",
  PALAWAN = "Palawan",
  BANK_OVERTHECOUNTER = "Bank (Over The Counter)",
  LAZADA_APP = "Lazada App",
  ATOME_APP = "Atome App",
}

enum SOF {
  REMMITANCE = 'Remmitance',
  BUSSINESS = 'Bussiness',
  PENSION = 'Pension',
  Allowance = 'Allowance',
  CASH_ON_HAND = 'Cash On Hand'
}

enum DialerCode {
  vici = "[",
  issabel = "]",
  inbound = ";",
}

type DispositionType = {
  code: string;
  id: string;
};

type Props = {
  updateOf: () => void;
  inlineData: string;
  canCall: boolean;
  onPresetAmountChange: (value: PresetSelection) => void;
  setLoading: (e: boolean) => void;
};

const IFBANK = ({ label }: { label: string }) => {
  return (
    <div className="flex flex-col items-start">
      <p className="text-gray-800 whitespace-nowrap font-bold text-start w-full  2xl:text-sm text-xs leading-4 ">
        {label}:
      </p>
      <div className=" rounded-sm bg-gray-300 border border-gray-400 text-xs 2xl:text-sm 2xl:p-4.5 p-4 w-full"></div>
    </div>
  );
};

enum Code {
  ANSM = "a",
  BUSY = "b",
  DEC = "c",
  DISP = "s",
  FFUP = "g",
  HUP = "h",
  ITP = "i",
  KOR = "k",
  LM = "l",
  NIS = "n",
  NOA = "m",
  OCA = "o",
  PAID = "p",
  RTP = "r",
  PTP = "t",
  "NO TONE" = "x",
  UNEG = "u",
  UNK = "/",
  RPCCB = ".",
  WN = "w",
}

type User = { _id: string };
type DispoType = { id: string };
type Customer = {
  assigned?: string;
  balance?: number;
  current_disposition?: {
    disposition?: string;
    selectivesDispo?: boolean;
  };
};

const DispositionForm: React.FC<Props> = ({
  updateOf,
  inlineData,
  canCall,
  onPresetAmountChange,
  setLoading,
}) => {
  const { selectedCustomer, userLogged, callUniqueId, isRing, onCall } =
    useSelector((state: RootState) => state.auth);

  const dispatch = useAppDispatch();
  const Form = useRef<HTMLFormElement | null>(null);
  const { data: disposition } = useQuery<{
    getDispositionTypes: Disposition[];
  }>(GET_DISPOSITION_TYPES, { skip: !selectedCustomer });
  const { data: tlData } = useQuery<{ getBucketTL: TL[] }>(USER_TL, {
    skip: !selectedCustomer,
  });
  const existingDispo = selectedCustomer?.dispo_history.find(
    (x) => x.existing === true
  );

  const neverChangeContactMethod = ["PTP", "UNEG", "PAID", "DEC", "RTP", "ITP"];
  const dispoNeverChangeContactMethod = disposition?.getDispositionTypes
    .filter((x) => neverChangeContactMethod.includes(x.code))
    .map((x) => x.id);

  const checkIfChangeContactMethod = dispoNeverChangeContactMethod?.includes(
    existingDispo?.disposition as string
  );
  const { data: agentBucketData } = useQuery<{ getDeptBucket: Bucket[] }>(
    GET_AGENT_BUCKET
  );

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
      }
    },
  });

  const [required, setRequired] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [escalateTo, setEscalateTo] = useState<boolean>(false);
  const [caToEscalate, setCAToEscalate] = useState<string>("");
  const [selectedTL, setSelectedTL] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dispoObject: Record<string, string> = useMemo(() => {
    const d: DispositionType[] = disposition?.getDispositionTypes || [];
    return Object.fromEntries(d.map((e) => [e.code, e.id]));
  }, [disposition]);
  const ptpDispoType = disposition?.getDispositionTypes.find(
    (d) => d.code === "PTP"
  );
  const paidDispoType = disposition?.getDispositionTypes.find(
    (d) => d.code === "PAID"
  );
  const dispoKeyCode: Record<string, string> = useMemo(() => {
    const d: DispositionType[] = disposition?.getDispositionTypes || [];
    return Object.fromEntries(
      d.map((e) => [e.code, Code[e.code as keyof typeof Code]])
    );
  }, [disposition]);

  const checkIfCanCall = agentBucketData?.getDeptBucket
    .map((x) => x.canCall)
    .includes(true);

  const [data, setData] = useState<Data>({
    amount: null,
    payment: null,
    disposition: null,
    payment_date: null,
    payment_method: null,
    ref_no: null,
    comment: null,
    contact_method: null,
    dialer: null,
    chatApp: null,
    RFD: null,
    sms: null,
    partialPayment: null,
    SOF: null
  });

  useEffect(() => {
    if (
      checkIfChangeContactMethod &&
      existingDispo &&
      !selectedCustomer?.current_disposition?.selectivesDispo
    ) {
      setData((prev) => ({
        ...prev,
        contact_method: existingDispo?.contact_method as AccountType,
      }));
    }
  }, [checkIfChangeContactMethod, existingDispo]);

  const selectedDispo =
    disposition?.getDispositionTypes?.find((x) => x.id === data.disposition)
      ?.code ?? "";

  const { contact_method, dialer, chatApp, sms } = data;

  useEffect(() => {
    if (dialer !== null || chatApp !== null || sms !== null) {
      setData((prev) => ({ ...prev, dialer: null, chatApp: null, sms: null }));
    }
  }, [contact_method]);

  const DISPO_OPTIONS = [
    { label: "Partial", value: 1 },
    { label: "New Tad with SF", value: 2 },
    { label: "New Pay Off", value: 3 },
  ];

  const resetForm = useCallback(() => {
    setData({
      amount: null,
      payment: null,
      disposition: null,
      payment_date: null,
      payment_method: null,
      ref_no: null,
      comment: null,
      contact_method: null,
      dialer: null,
      chatApp: null,
      RFD: null,
      sms: null,
      partialPayment: null,
      SOF: null
    });
    onPresetAmountChange({ amount: null, label: null });
  }, [onPresetAmountChange, setData]);

  useEffect(() => {
    if (!selectedCustomer) {
      resetForm();
    }
  }, [selectedCustomer]);

  // mutations ============================================================================

  const [deselectTask] = useMutation<{ deselectTask: Success }>(DESELECT_TASK, {
    onCompleted: () => {
      dispatch(setDeselectCustomer());
      resetForm();
      updateOf();
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [createDisposition, { loading: dispoLoading }] = useMutation<{
    createDisposition: Success;
  }>(CREATE_DISPOSITION, {
    onCompleted: async (res) => {
      dispatch(
        setSuccess({
          success: res.createDisposition.success,
          message: res.createDisposition.message,
          isMessage: false,
        })
      );
      await deselectTask({ variables: { id: selectedCustomer?._id } });
      setLoading(false);
    },
    onError: async () => {
      await deselectTask({ variables: { id: selectedCustomer?._id } });
      dispatch(setServerError(true));
    },
  });

  useEffect(() => {
    if (!dispoLoading ) {
      setLoading(dispoLoading);
    }
  }, [dispoLoading]);

  const [tlEscalation] = useMutation<{ tlEscalation: Success }>(TL_ESCATATION, {
    onCompleted: async (res) => {
      dispatch(
        setSuccess({
          success: res.tlEscalation.success,
          message: res.tlEscalation.message,
          isMessage: false,
        })
      );
      await deselectTask({ variables: { id: selectedCustomer?._id } });
    },
    onError: async () => {
      await deselectTask({ variables: { id: selectedCustomer?._id } });
      dispatch(setServerError(true));
    },
  });
  // ======================================================================================
  const handleDataChange = (key: keyof Data, value: any) => {
    if (key === "disposition") {
      setData((prev) => ({
        ...prev,
        [key]: value,
        amount: null,
        payment: null,
        payment_date: null,
        payment_method: null,
        ref_no: null,
        comment: null,
        dialer: null,
        chatApp: null,
        RFD: null,
        sms: null,
      }));
      onPresetAmountChange({ amount: null, label: null });
      return;
    }
    if (key === "amount") {
      const amountValue =
        value === null || value === "" ? null : value.toString();
      setData((prev) => ({ ...prev, amount: amountValue }));
      onPresetAmountChange({ amount: amountValue, label: null });
      return;
    }
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleOnChangeAmount = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let { value } = e.target;

      if (value === "" || value === "0") {
        handleDataChange("amount", null);
        handleDataChange("payment", null);
        onPresetAmountChange({ amount: null, label: null });
        return;
      }

      const numericValue = parseFloat(value);

      if (isNaN(numericValue)) return;

      const balance = selectedCustomer?.balance ?? 0;
      const payment = numericValue >= balance ? Payment.FULL : Payment.PARTIAL;
      handleDataChange("amount", numericValue);
      onPresetAmountChange({ amount: numericValue, label: null });
      handleDataChange("payment", payment);
    },
    [selectedCustomer, handleDataChange, onPresetAmountChange]
  );

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "ESCALATE",
    yes: () => {},
    no: () => {},
  });

  const creatingDispo = useCallback(async () => {
    await createDisposition({
      variables: {
        input: {
          ...data,
          customer_account: selectedCustomer?._id,
          callId: callUniqueId,
        },
      },
    });
    setConfirm(false);
  }, [data, selectedCustomer, createDisposition, callUniqueId]);

  const noCallback = useCallback(() => {
    setConfirm(false);
  }, [setConfirm]);

  const callbackUpdateRPC = useCallback(async () => {
    await updateRPC({
      variables: { id: selectedCustomer?.customer_info?._id },
    });

    creatingDispo();
  }, [updateRPC, selectedCustomer, creatingDispo]);

  const handleSubmitForm = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!Form.current?.checkValidity()) {
        setRequired(true);
      } else {
        if (selectedDispo === "PAID" && data.payment_date) {
          const paymentDate = new Date(data.payment_date);

          if (isNaN(paymentDate.getTime())) {
            return setRequired(true);
          }

          paymentDate.setHours(23, 59, 59, 999);
          const currentDate = new Date();
          currentDate.setHours(23, 59, 59, 999);

          if (paymentDate > currentDate) {
            return setRequired(true);
          }
        }

        if (
          Number(data.amount) === 0 &&
          requiredDispo.includes(selectedDispo)
        ) {
          return setRequired(true);
        }

        setRequired(false);
        setConfirm(true);
        const positiveDispo = disposition?.getDispositionTypes.filter(x=> ['PTP','PAID','UNEG'].includes(x.code)).map(y=> y.id)

        if (
          !selectedCustomer?.customer_info.isRPC &&
          positiveDispo?.includes(data?.disposition as string)
        ) {
          setModalProps({
            message: "This one is not RPC? if lets create the disposition...",
            toggle: "CREATE",
            yes: callbackUpdateRPC,
            no: creatingDispo,
          });
        } else {
          setModalProps({
            message: "Do you want to create the disposition? ",
            toggle: "CREATE",
            yes: creatingDispo,
            no: noCallback,
          });
        }
      }
    },
    [setRequired, setConfirm, setModalProps, Form, creatingDispo, noCallback]
  );

  const tlEscalationCallback = useCallback(async () => {
    const checkSelectedTl =
      selectedTL.trim() === "" ? tlData?.getBucketTL[0]._id : selectedTL;

    await tlEscalation({
      variables: { id: caToEscalate, tlUserId: checkSelectedTl },
    });
  }, [caToEscalate, selectedTL, tlData]);

  const handleSubmitEscalation = useCallback(() => {
    setConfirm(true);
    setModalProps({
      message: "Do you want to transfer this to your team leader?",
      toggle: "ESCALATE",
      yes: tlEscalationCallback,
      no: noCallback,
    });
  }, [setConfirm, setModalProps, tlEscalationCallback, noCallback]);

  const tlOptions = useMemo(() => {
    return tlData?.getBucketTL || [];
  }, [tlData]);

  const callbackTLEscalation = useCallback(
    async (id: string) => {
      await tlEscalation({ variables: { id, tlUserId: tlOptions } });
    },
    [tlData, tlEscalation]
  );

  const handleSubmitEscalationToTl = useCallback(
    async (id: string) => {
      if (tlOptions.length > 1) {
        setEscalateTo(true);
        setCAToEscalate(id);
      } else {
        setConfirm(true);
        setModalProps({
          message: "Do you want to transfer this to your team leader?",
          toggle: "ESCALATE",
          yes: () => callbackTLEscalation(id),
          no: noCallback,
        });
      }
    },
    [
      tlOptions,
      setEscalateTo,
      setModalProps,
      callbackTLEscalation,
      noCallback,
      setConfirm,
      setCAToEscalate,
    ]
  );

  const secondLine = inlineData.split('|')[1]

  useEffect(() => {
    if (
      (canCall && userLogged?.account_type === "caller") ||
      inlineData.includes("INCALL") ||
      (inlineData.includes("PAUSE") && inlineData.includes("DISPO"))
    ) {
      setData((prev) => ({
        ...prev,
        contact_method: AccountType.CALL,
      }));
    }
  }, [canCall, inlineData]);

  const anabledDispo = ["PAID", "PTP", "UNEG"];
  const requiredDispo = ["PAID", "PTP"];

  const checkIfValid = useCallback((value: string): boolean => {
    const newDate = new Date(value).setHours(23, 59, 59, 999);
    const dateNow = new Date().setHours(23, 59, 59, 999);

    return newDate > dateNow;
  }, []);

  function canProceed(
    customer: Customer | null | undefined,
    user: User | null | undefined,
    ptpDispoType: DispoType | null | undefined,
    paidDispoType: DispoType | null | undefined
  ): boolean {
    if (!customer) return false;

    const cd = customer.current_disposition;
    const balance = customer.balance;
    const dispo = cd?.disposition;

    const hasSelective = cd?.selectivesDispo;
    const assignedToUser =
      customer.assigned?.toString() === user?._id.toString();
    const notAssigned = !customer.assigned;
    const ptpId = ptpDispoType?.id;
    const paidId = paidDispoType?.id;
    const isPTPAndAssignedToUser = dispo === ptpId && assignedToUser;
    const isPaidWithSelective = dispo === paidId && hasSelective;

    return !!(
      Number(balance) >= 0 && (isPaidWithSelective || !hasSelective) && 
      (notAssigned || isPTPAndAssignedToUser )
    );
  }

  return (
    canProceed(selectedCustomer, userLogged, ptpDispoType, paidDispoType) && (
      <>
        <AnimatePresence>
          {escalateTo && (
            <div className="absolute top-0 left-0 w-full h-full z-50 flex items-center justify-center ">
              <motion.div
                key="escalate-backdrop"
                onClick={() => setEscalateTo(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full absolute top-0 left-0 bg-black/40 backdrop-blur-sm cursor-pointer z-10"
              ></motion.div>
              <motion.div
                key="escalate-modal"
                className="w-auto h-1/3 bg-white z-20 rounded-sm border-red-800 border-2 overflow-hidden shadow-md flex flex-col"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="px-10 py-3 bg-red-500 border-b-2 border-red-800 shadow-md  uppercase text-4xl text-white font-black text-center">
                  Escalate To
                </h1>
                <div className="w-full h-full flex flex-col items-center justify-center gap-10">
                  <select
                    name="tl_account"
                    id="tl_account"
                    onChange={(e) => {
                      const value = e.target.value;
                      const selectedTl: TL | { _id: ""; name: "" } =
                        tlData?.getBucketTL.find((e) => e.name === value) || {
                          _id: "",
                          name: "",
                        };
                      setSelectedTL(selectedTl._id);
                    }}
                    className="capitalize border p-2  xl:text-sm 2xl:text-lg w-8/10 outline-none border-black shadow-md rounded-md text-gray-500"
                  >
                    <option value="" className="">
                      Select TL
                    </option>
                    {tlData?.getBucketTL.map((e) => {
                      return (
                        <option
                          key={e._id}
                          value={e.name}
                          className="capitalize"
                        >
                          {e.name}
                        </option>
                      );
                    })}
                  </select>
                  <div className="flex gap-2">
                    <button
                      className="rounded-md border-2 cursor-pointer border-red-800 py-2 px-4 bg-red-500 text-white font-black uppercase hover:bg-red-600 transition-all xl:text-sm 2xl:text-lg "
                      onClick={handleSubmitEscalation}
                    >
                      Submit
                    </button>
                    <button
                      className="rounded-md cursor-pointer border-2 border-gray-800 transition-all py-2 px-4 bg-gray-500 text-white font-black uppercase hover:bg-gray-600 xl:text-sm 2xl:text-lg "
                      onClick={() => setEscalateTo(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {selectedCustomer?._id && (
            <motion.form
              ref={Form}
              noValidate
              key="dispo-form"
              onSubmit={handleSubmitForm}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col bg-gray-100 overflow-hidden uppercase w-full h-full rounded-md border border-black shadow-md justify-center select-none relative"
            >
              <h1 className="text-center py-3 bg-gray-400 d uppercase border-b font-black text-black text-2xl">
                Customer Disposition
              </h1>
              <div className="flex gap-2 p-5">
                <div className="flex flex-col gap-1 w-full">
                  <div className=" gap-2">
                    <label className="flex flex-col items-center">
                      <p className="text-gray-800 font-bold text-start w-full  2xl:text-sm text-xs  leading-4 ">
                        Contact Method:
                      </p>
                      <select
                        name="contact_method"
                        id="contact_method"
                        required={requiredDispo.includes(selectedDispo)}
                        value={data.contact_method ?? ""}
                        onChange={(e) => {
                          handleDataChange(
                            "contact_method",
                            checkIfChangeContactMethod &&
                              !selectedCustomer.current_disposition
                                ?.selectivesDispo
                              ? existingDispo?.contact_method
                              : e.target.value
                          );
                          handleDataChange("disposition", null);
                        }}
                        className={`${
                          required && !data.contact_method
                            ? "bg-red-100 border-red-500"
                            : "bg-gray-50  border-black shadow-md"
                        }  border rounded-sm focus:outline-none  p-2 text-xs 2xl:text-sm w-full`}
                      >
                        <option value="">Select Contact Method</option>
                        {Object.entries(AccountType).map(
                          ([_, value], index) => {
                            return canCall && value === AccountType.CALL ? (
                              <option
                                value={value}
                                key={value}
                                className="capitalize"
                                accessKey={(index + 1).toString()}
                              >
                                {value.charAt(0).toUpperCase() +
                                  value.slice(1, value.length)}{" "}
                                - {index + 1}
                              </option>
                            ) : (
                              !canCall && (
                                <option
                                  value={value}
                                  key={value}
                                  className="capitalize"
                                  accessKey={(index + 1).toString()}
                                >
                                  {value.charAt(0).toUpperCase() +
                                    value.slice(1, value.length)}{" "}
                                  - {index + 1}
                                </option>
                              )
                            );
                          }
                        )}
                      </select>
                    </label>

                    <label className="flex flex-col mt-1">
                      <p className="text-gray-800 font-bold text-start  mr-2 2xl:text-sm text-xs leading-4">
                        Disposition:
                      </p>
                      <select
                        name="disposition"
                        id="disposition"
                        value={
                          disposition?.getDispositionTypes?.find(
                            (x) => x.id === data.disposition
                          )?.code ?? ""
                        }
                        required
                        onChange={(e) => {
                          const selectedCode = e.target.value;

                          handleDataChange(
                            "disposition",
                            dispoObject[selectedCode]
                          );

                          if (
                            selectedCode === "UNEG" ||
                            selectedCode === "PTP" ||
                            selectedCode === "PAID"
                          ) {
                            setIsOpen(true);
                          } else {
                            setIsOpen(false);
                          }
                        }}
                        className={`${
                          required && !data.disposition
                            ? "bg-red-100 border-red-500"
                            : "bg-gray-50  border-black shadow-md"
                        }  w-full border rounded-sm border-black focus:ring-blue-500 focus:border-blue-500 text-xs 2xl:text-sm p-2 `}
                      >
                        <option value="" aria-keyshortcuts=";">
                          Select Disposition
                        </option>
                        {Object.entries(dispoObject).map(
                          ([key, value], index) => {
                            const findDispoName =
                              disposition?.getDispositionTypes?.find(
                                (x) => x.id === value
                              );

                            const dispoCM =
                              findDispoName?.contact_methods ?? {};

                            return (
                              data.contact_method &&
                              findDispoName?.active &&
                              findDispoName?.buckets?.includes(
                                selectedCustomer?.account_bucket?._id
                              ) &&
                              dispoCM[
                                data?.contact_method as keyof typeof dispoCM
                              ] && (
                                <option
                                  value={key}
                                  key={index}
                                  accessKey={
                                    Code[
                                      findDispoName?.code as keyof typeof Code
                                    ]
                                  }
                                >
                                  {`${findDispoName?.name} - ${key} - "${
                                    dispoKeyCode[key] || ""
                                  }"`}
                                </option>
                              )
                            );
                          }
                        )}
                      </select>
                    </label>
                  </div>
                  <div className="flex w-full gap-2">
                    <div className="w-full">
                      {anabledDispo.includes(selectedDispo) ? (
                        <label className="flex flex-col w-full items-center">
                          <p className="text-gray-800 font-bold text-start w-full 2xl:text-sm text-xs leading-4">
                            Amount:
                          </p>
                          <div
                            className={`flex border items-center rounded-sm w-full ${
                              required && (!data.amount || data.amount === "0")
                                ? "bg-red-100 border-red-500"
                                : "bg-gray-0  border-black"
                            } `}
                          >
                            <p className="px-2">&#x20B1;</p>
                            <input
                              step="any"
                              inputMode="decimal"
                              type="number"
                              name="amount"
                              id="amount"
                              value={data.amount || ""}
                              onChange={handleOnChangeAmount}
                              placeholder="Enter amount"
                              required={requiredDispo.includes(selectedDispo)}
                              className={`w-full text-xs 2xl:text-sm  text-gray-900 p-2 outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 appearance-none    `}
                            />
                          </div>
                        </label>
                      ) : (
                        <IFBANK label="Amount" />
                      )}
                    </div>

                    <div className="w-full">
                      {anabledDispo.includes(selectedDispo) &&
                      agentBucketData?.getDeptBucket?.some(
                        (bucket) => bucket.name !== "BPIBANK 2025"
                      ) ? (
                        <label className="flex flex-col w-full items-center">
                          <p className="text-gray-800 font-bold text-start w-full  2xl:text-sm text-xs leading-4">
                            Payment:
                          </p>
                          <select
                            name="payment"
                            id="payment"
                            required={requiredDispo.includes(selectedDispo)}
                            value={data.payment ?? ""}
                            onChange={(e) => {
                              if (e.target.value === Payment.FULL) {
                                const fullAmount =
                                  selectedCustomer.balance.toFixed(2);
                                handleDataChange("amount", fullAmount);
                              }
                              handleDataChange("payment", e.target.value);
                            }}
                            className={`${
                              required && !data.payment
                                ? "bg-red-100 border-red-500"
                                : "bg-gray-50  border-black"
                            } border text-gray-900  rounded-sm focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                          >
                            <option value="" accessKey="8">
                              Select Payment
                            </option>
                            {Object.entries(Payment).map(
                              ([_, value], index) => {
                                return (
                                  <option
                                    value={value}
                                    key={index}
                                    className="capitalize"
                                    accessKey={index > 0 ? "0" : "9"}
                                  >
                                    {value.charAt(0).toUpperCase() +
                                      value.slice(1, value.length)}
                                  </option>
                                );
                              }
                            )}
                          </select>
                        </label>
                      ) : (
                        <IFBANK label="Payment" />
                      )}
                    </div>
                  </div>

                  {data?.contact_method === AccountType.CALL && (
                    <label className="flex flex-col  items-center gap-0.5">
                      <p className="text-gray-800 font-bold text-start w-full 2xl:text-sm text-xs leading-4">
                        Dialer
                      </p>
                      <select
                        name="dialer"
                        id="dialer"
                        required={data?.contact_method === AccountType.CALL}
                        value={
                          !(
                            data.contact_method === AccountType.CALL &&
                            checkIfCanCall
                          )
                            ? data?.dialer ?? ""
                            : Dialer.VICI ?? ""
                        }
                        onChange={(e) =>
                          handleDataChange(
                            "dialer",
                            checkIfChangeContactMethod &&
                              !selectedCustomer.current_disposition
                                ?.selectivesDispo
                              ? existingDispo?.dialer
                              : e.target.value
                          )
                        }
                        className={`${
                          required && !data.dialer
                            ? "bg-red-100 border-red-500"
                            : "bg-gray-50  border-black"
                        }  border text-gray-900  rounded-sm focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                      >
                        <option value="">Select Dialer</option>
                        {Object.entries(Dialer).map(([_, value], index) => {
                          return canCall && value === Dialer.VICI ? (
                            <option
                              value={value}
                              key={index}
                              className="capitalize"
                              accessKey={DialerCode[value]}
                            >
                              {value.charAt(0).toUpperCase() +
                                value.slice(1, value.length)}
                            </option>
                          ) : (
                            !canCall && (
                              <option
                                value={value}
                                key={index}
                                className="capitalize"
                                accessKey={DialerCode[value]}
                              >
                                {value.charAt(0).toUpperCase() +
                                  value.slice(1, value.length)}
                              </option>
                            )
                          );
                        })}
                      </select>
                    </label>
                  )}
                  {data.contact_method === AccountType.SMS && (
                    <label className="flex flex-col items-center gap-0.5">
                      <p className="text-gray-800 font-bold text-start w-full 2xl:text-sm text-xs leading-4">
                        SMS Collector
                      </p>
                      <select
                        name="sms_collector"
                        id="sms_collector"
                        required={data.contact_method === AccountType.SMS}
                        value={data.sms ?? ""}
                        onChange={(e) =>
                          handleDataChange(
                            "sms",
                            checkIfChangeContactMethod &&
                              !selectedCustomer.current_disposition
                                ?.selectivesDispo
                              ? existingDispo?.sms
                              : e.target.value
                          )
                        }
                        className={`${
                          required && !data.dialer
                            ? "bg-red-100 border-red-500"
                            : "bg-gray-50  border-black"
                        }  border text-gray-900  rounded-sm focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                      >
                        <option value="">Select SMS Collector</option>
                        {Object.entries(SMSCollector).map(
                          ([_, value], index) => {
                            return (
                              <option
                                value={value}
                                key={index}
                                className="capitalize"
                              >
                                {value.charAt(0).toUpperCase() +
                                  value.slice(1, value.length)}
                              </option>
                            );
                          }
                        )}
                      </select>
                    </label>
                  )}
                  {data.contact_method === AccountType.SKIP && (
                    <label className="flex flex-col items-center gap-0.5">
                      <p className="text-gray-800 font-bold text-start w-full 2xl:text-sm text-xs  leading-4">
                        Chat App
                      </p>
                      <select
                        name="chat_app"
                        id="chat_app"
                        value={data.chatApp ?? ""}
                        required={data.contact_method === AccountType.SKIP}
                        onChange={(e) =>
                          handleDataChange(
                            "chatApp",
                            checkIfChangeContactMethod &&
                              !selectedCustomer.current_disposition
                                ?.selectivesDispo
                              ? existingDispo?.chatApp
                              : e.target.value
                          )
                        }
                        className={`${
                          required && !data.chatApp
                            ? "bg-red-100 border-red-500"
                            : "bg-gray-50  border-gray-500"
                        } border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                      >
                        <option value="">Select Chat App</option>
                        {Object.entries(SkipCollector).map(
                          ([_, value], index) => {
                            return (
                              <option
                                value={value}
                                key={index}
                                className="capitalize"
                              >
                                {value.charAt(0).toUpperCase() +
                                  value.slice(1, value.length)}
                              </option>
                            );
                          }
                        )}
                      </select>
                    </label>
                  )}
                  <label className="flex flex-col gap-0.5">
                    <p className="text-gray-800 font-bold text-start mr-2 2xl:text-sm text-xs leading-4">
                      RFD:
                    </p>
                    <select
                      name="sms_collector"
                      id="sms_collector"
                      value={data.RFD ?? ""}
                      onChange={(e) => handleDataChange("RFD", e.target.value)}
                      className={` border bg-gray-50  border-black  shadow-md  rounded-sm focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                    >
                      <option value="">Select RFD Reason</option>
                      {Object.entries(RFD).map(([_, value], index) => {
                        return (
                          <option value={value} key={index}>
                            {value.charAt(0).toUpperCase() +
                              value.slice(1, value.length)}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="flex flex-col gap-0.5">
                    <p className="text-gray-800 font-bold text-start mr-2 2xl:text-sm text-xs leading-4">
                      SOF:
                    </p>
                    <select
                      name="sms_collector"
                      id="sms_collector"
                      value={data.SOF ?? ""}
                      onChange={(e) => handleDataChange("SOF", e.target.value)}
                      className={` border bg-gray-50  border-black  shadow-md  rounded-sm focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                    >
                      <option value="">Select SOF Reason</option>
                      {Object.entries(SOF).map(([_, value], index) => {
                        return (
                          <option value={value} key={index}>
                            {value.charAt(0).toUpperCase() +
                              value.slice(1, value.length)}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </div>
                <div className="flex w-full flex-col gap-1">
                  {anabledDispo.includes(selectedDispo) ? (
                    <label className="flex flex-col items-center gap-0.5">
                      <p className="text-gray-800 font-bold text-start w-full  2xl:text-sm text-xs  leading-4">
                        Payment Date:
                      </p>
                      <input
                        type="date"
                        id="payment_date"
                        name="payment_date"
                        required={selectedDispo === "PAID"}
                        value={data.payment_date ?? ""}
                        onChange={(e) =>
                          handleDataChange("payment_date", e.target.value)
                        }
                        className={`${
                          (required && !data.payment_date) ||
                          (required &&
                            data.payment_date &&
                            checkIfValid(data.payment_date))
                            ? "bg-red-100 border-red-500"
                            : "bg-gray-50 border-black"
                        } border text-gray-900  rounded-sm focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                      />
                    </label>
                  ) : (
                    <IFBANK label="Payment Date" />
                  )}
                  {anabledDispo.includes(selectedDispo) ? (
                    <label className="flex flex-col items-center gap-0.5">
                      <p className="text-gray-800 font-bold text-start w-full 2xl:text-sm text-xs leading-4 ">
                        Payment Method:
                      </p>
                      <select
                        name="payment_method"
                        id="payment_method"
                        value={data.payment_method ?? ""}
                        onChange={(e) =>
                          handleDataChange("payment_method", e.target.value)
                        }
                        className={` bg-gray-50 border-black border text-gray-900 rounded-sm focus:ring-blue-500 focus:border-blue-500 text-xs 2xl:text-sm w-full p-2`}
                      >
                        <option value="">Select Method</option>
                        {Object.entries(PaymentMethod).map(
                          ([_, value], index) => {
                            return (
                              <option value={value} key={index}>
                                {value}
                              </option>
                            );
                          }
                        )}
                      </select>
                    </label>
                  ) : (
                    <IFBANK label="Payment Method" />
                  )}

                  {anabledDispo.includes(selectedDispo) ? (
                    <label className="flex flex-col items-center gap-0.5">
                      <p className="text-gray-800 font-bold text-start w-full 2xl:text-sm text-xs  leading-4 ">
                        Ref. No:
                      </p>
                      <input
                        type="text"
                        name="ref"
                        id="ref"
                        autoComplete="off"
                        value={data.ref_no ?? ""}
                        placeholder="Enter reference no."
                        onChange={(e) =>
                          handleDataChange("ref_no", e.target.value)
                        }
                        className={` bg-gray-50 border-black border rounded-sm text-xs 2xl:text-sm w-full p-2`}
                      />
                    </label>
                  ) : (
                    <IFBANK label="Ref. No" />
                  )}
                  <label className="flex flex-col items-start gap-0.5">
                    <p className="text-gray-800  mr-2 font-bold text-start w-full  2xl:text-sm text-xs 2xl:w-2/6 leading-4 ">
                      Comment:
                    </p>
                    <textarea
                      name="comment"
                      id="comment"
                      placeholder="Comment here..."
                      value={data.comment ?? ""}
                      onChange={(e) =>
                        handleDataChange("comment", e.target.value)
                      }
                      className={`" border-black text-black shadow-md bg-gray-50 min-h-10 border rounded-sm focus:ring-blue-500 focus:border-blue-500 text-xs 2xl:text-sm w-full p-2 resize-none "`}
                    ></textarea>
                  </label>
                  <div className="flex justify-end gap-2 mt-2 h-full items-end">
                    {(!isRing || !onCall) &&
                      !(
                        inlineData?.includes("PAUSED") &&
                        inlineData?.includes("LAGGED") &&
                        inlineData?.includes("DISPO")
                      ) && (
                        <>
                          {(data.disposition && (inlineData?.includes("PAUSED") && !secondLine) ) && (
                            <motion.button
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              accessKey="q"
                              type="submit"
                              className={`bg-green-500 border-2 transition-a=ll border-green-800 hover:bg-green-600 focus:outline-none text-white focus:ring-4 focus:ring-green-400 font-black shadow-md rounded-sm uppercase px-5 py-3 cursor-pointer 2xl:text-sm text-xs`}
                            >
                              Submit
                            </motion.button>
                          )}
                        </>
                      )}
                    {/* {data.disposition && userLogged?.type === "AGENT" && ( */}
                    <motion.button
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      type="button"
                      className="bg-red-500 border-2 transition-all border-red-800 hover:bg-red-600 focus:outline-none text-white uppercase  focus:ring-4 focus:ring-red-400 font-black rounded-sm shadow-md px-5 py-3 cursor-pointer 2xl:text-sm text-xs "
                      onClick={() =>
                        handleSubmitEscalationToTl(selectedCustomer?._id || "")
                      }
                    >
                      TL Escalation
                    </motion.button>
                    {/* )} */}
                  </div>
                </div>
              </div>
            </motion.form>
          )}

          {confirm && <Confirmation {...modalProps} />}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen &&
            agentBucketData?.getDeptBucket?.some(
              (bucket) => bucket.name === "BPIBANK 2025"
            ) && (
              <div className="absolute top-0 flex left-0 justify-center items-center z-30 w-full h-full ">
                <motion.div
                  key="bpibank-bg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-black/40 z-10 backdrop-blur-sm w-full h-full absolute top-0 left-0"
                ></motion.div>
                <motion.div
                  key="bpibank-modal"
                  className="flex flex-col z-20 w-auto relative"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <div className="bg-white border text-2xl overflow-hidden rounded-md shadow-md">
                    <div className="bg-gray-300 py-1 px-6  text-center border-b font-black uppercase">
                      Select Options
                    </div>
                    {DISPO_OPTIONS.map(({ label, value }, index) => {
                      return (
                        <div
                          key={index}
                          className="px-3 py-1 odd:bg-gray-100 even:bg-gray-200 text-xs font-black uppercase 2xl:text-sm cursor-pointer hover:bg-gray-300 transition-all"
                          onClick={() => {
                            let amount = 0;
                            const details =
                              selectedCustomer?.out_standing_details;

                            if (!details) return;

                            switch (label) {
                              case "Partial":
                                amount =
                                  details.partial_payment_w_service_fee ?? 0;
                                break;
                              case "New Tad with SF":
                                amount = details.new_tad_with_sf ?? 0;
                                break;
                              case "New Pay Off":
                                amount = details.new_pay_off ?? 0;
                                break;
                              default:
                                amount = 0;
                            }

                            const sanitizedAmount = Number.isFinite(amount)
                              ? amount.toFixed(2)
                              : null;
                            handleDataChange("amount", sanitizedAmount);
                            handleDataChange("partialPayment", value);
                            onPresetAmountChange({
                              amount: Number(sanitizedAmount),
                              label,
                            });
                            setIsOpen(false);
                          }}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            )}
        </AnimatePresence>
      </>
    )
  );
};

export default DispositionForm;
