import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Confirmation from "./Confirmation";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  setDeselectCustomer,
  setServerError,
  setSuccess,
} from "../redux/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";

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
};

type Disposition = {
  id: string;
  name: string;
  code: string;
  active: boolean;
};

const GET_DISPOSITION_TYPES = gql`
  query Query {
    getDispositionTypes {
      id
      name
      code
      active
    }
  }
`;

type Success = {
  success: boolean;
  message: string;
};

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
  query GetBucketTL {
    getBucketTL {
      _id
      name
    }
  }
`;
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
  CALLS = "calls",
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
};

const IFBANK = ({ label }: { label: string }) => {
  return (
    <div className="flex flex-col items-start">
      <p className="text-gray-800 whitespace-nowrap font-bold text-start w-full  2xl:text-sm text-xs leading-4 ">
        {label}:
      </p>
      <div className=" rounded-lg bg-slate-400 border border-gray-400 text-xs 2xl:text-sm 2xl:p-4.5 p-4 w-full"></div>
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
  current_disposition?: {
    disposition?: string;
    selectivesDispo?: boolean;
  };
};

const DispositionForm: React.FC<Props> = ({ updateOf }) => {
  const { selectedCustomer, userLogged } = useSelector(
    (state: RootState) => state.auth
  );
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
    existingDispo?.disposition || ""
  );

  const [required, setRequired] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [escalateTo, setEscalateTo] = useState<boolean>(false);
  const [caToEscalate, setCAToEscalate] = useState<string>("");
  const [selectedTL, setSelectedTL] = useState<string>("");

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
    });
  }, [setData, dispatch]);

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

  const [createDisposition] = useMutation<{ createDisposition: Success }>(
    CREATE_DISPOSITION,
    {
      onCompleted: (res) => {
        dispatch(
          setSuccess({
            success: res.createDisposition.success,
            message: res.createDisposition.message,
            isMessage: false,
          })
        );
        setConfirm(false);
        resetForm();
        updateOf();
        dispatch(setDeselectCustomer());
      },
      onError: async () => {
        await deselectTask({ variables: { id: selectedCustomer?._id } });
        setConfirm(false);
        dispatch(setServerError(true));
      },
    }
  );

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
        contact_method:
          checkIfChangeContactMethod && existingDispo
            ? (existingDispo?.contact_method as AccountType)
            : null,
        dialer: null,
        chatApp: null,
        RFD: null,
        sms: null,
      }));
    } else {
      setData((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleOnChangeAmount = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value.replace(/[^0-9.]/g, "");
      const parts = inputValue.split(".");

      if (parts.length > 2) {
        inputValue = parts[0] + "." + parts[1];
      } else if (parts.length === 2) {
        inputValue = parts[0] + "." + parts[1].slice(0, 2);
      }

      if (inputValue.startsWith("00")) {
        inputValue = "0";
      }

      const numericValue = parseFloat(inputValue);
      const balance = selectedCustomer?.balance ?? 0;
      const amount = numericValue > balance ? balance.toFixed(2) : inputValue;
      const payment = numericValue >= balance ? Payment.FULL : Payment.PARTIAL;
      handleDataChange("amount", amount);
      handleDataChange("payment", payment);
    },
    [setData, selectedCustomer, handleDataChange]
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
        input: { ...data, customer_account: selectedCustomer?._id },
      },
    });
  }, [data, selectedCustomer, createDisposition]);

  const noCallback = useCallback(() => {
    setConfirm(false);
  }, [setConfirm]);

  const handleSubmitForm = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!Form.current?.checkValidity()) {
        setRequired(true);
      } else {
        if (selectedDispo === "PAID" && data.payment_date) {
          const paymentDate = new Date(data.payment_date?.toString());
          paymentDate.setHours(23, 59, 59, 999);
          const currentDate = new Date().setHours(23, 59, 59, 999);

          if (Number(paymentDate) > Number(currentDate)) {
            return setRequired(true);
          }
        }

        if (Number(data.amount) === 0 && anabledDispo.includes(selectedDispo)) {
          return setRequired(true);
        }

        setRequired(false);
        setConfirm(true);
        setModalProps({
          message: "Do you want to create the disposition? ",
          toggle: "CREATE",
          yes: creatingDispo,
          no: noCallback,
        });
      }
    },
    [setRequired, setConfirm, setModalProps, Form, creatingDispo, noCallback]
  );

  const tlEscalationCallback = useCallback(async () => {
    await tlEscalation({
      variables: { id: caToEscalate, tlUserId: selectedTL },
    });
  }, [caToEscalate, selectedTL]);

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
    const dispo = cd?.disposition;
    const hasSelective = cd?.selectivesDispo;
    const assignedToUser = customer.assigned === user?._id;
    const notAssigned = !customer.assigned;

    const ptpId = ptpDispoType?.id;
    const paidId = paidDispoType?.id;

    const isNotPTPorPaidAndUnassigned =
      ![ptpId, paidId].includes(dispo ?? "") && notAssigned;

    const isPTPAndAssignedToUser = dispo === ptpId && assignedToUser;

    const isPaidWithSelective = dispo === paidId && hasSelective;

    return !!(
      isNotPTPorPaidAndUnassigned ||
      isPTPAndAssignedToUser ||
      isPaidWithSelective
    );
  }

  return (
    canProceed(selectedCustomer, userLogged, ptpDispoType, paidDispoType) && (
      <AnimatePresence>
        {escalateTo && (
          <div className="absolute top-0 left-0 w-full h-full z-50 flex items-center justify-center ">
            <motion.div
              onClick={() => setEscalateTo(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full absolute top-0 left-0 bg-black/40 backdrop-blur-sm cursor-pointer z-10"
            ></motion.div>
            <motion.div
              className="w-auto h-1/3 bg-white z-20 rounded-lg border-slate-300 shadow-md overflow-hidden flex flex-col"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="px-10 py-3 bg-red-500  uppercase text-4xl text-white font-black text-center">
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
                  className="capitalize border p-2  xl:text-sm 2xl:text-lg w-8/10 outline-none border-slate-500 rounded-md text-gray-500"
                >
                  <option value="" className="">
                    Select TL
                  </option>
                  {tlData?.getBucketTL.map((e) => (
                    <option key={e._id} value={e.name} className="capitalize">
                      {e.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    className="rounded-md cursor-pointer border py-2 px-4 bg-red-500 text-white font-medium hover:bg-red-700 xl:text-sm 2xl:text-lg "
                    onClick={handleSubmitEscalation}
                  >
                    Submit
                  </button>
                  <button
                    className="rounded-md cursor-pointer border py-2 px-4 bg-slate-500 text-white font-medium hover:bg-slate-700 xl:text-sm 2xl:text-lg "
                    onClick={() => setEscalateTo(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <motion.form
          ref={Form}
          className="flex flex-col h-full justify-end w-full"
          noValidate
          onSubmit={handleSubmitForm}
          initial={{x: 20, opacity: 0}}
          animate={{x: 0, opacity: 1}}
          transition={{delay: 0.1}}
        >
          <h1 className="text-center d uppercase font-black text-slate-600 text-2xl my-2">
            Customer Disposition
          </h1>
          {selectedCustomer?._id && (
            <div className="flex bg-gray-100 uppercase w-full h-full p-5 rounded-md border border-slate-400 shadow-md xl:gap-2 gap-2 justify-center select-none">
              <div className="flex flex-col gap-1 w-full">
                <label className="flex flex-col gap-0.5">
                  <p className="text-gray-800 font-bold text-start  mr-2 2xl:text-sm text-xs leading-4">
                    Disposition:
                  </p>
                  <select
                    name="disposition"
                    id="disposition"
                    value={
                      disposition?.getDispositionTypes.find(
                        (x) => x.id === data.disposition
                      )?.code ?? ""
                    }
                    required
                    onChange={(e) => {
                      handleDataChange(
                        "disposition",
                        dispoObject[e.target.value]
                      );
                    }}
                    className={`${
                      required && !data.disposition
                        ? "bg-red-100 border-red-500"
                        : "bg-gray-50  border-gray-500"
                    }  w-full border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs 2xl:text-sm p-2 `}
                  >
                    <option value="" aria-keyshortcuts=";">
                      Select Disposition
                    </option>
                    {Object.entries(dispoObject).map(([key, value]) => {
                      const findDispoName =
                        disposition?.getDispositionTypes.find(
                          (x) => x.id === value
                        );

                      return (
                        findDispoName?.active && (
                          <option
                            value={key}
                            key={key}
                            accessKey={
                              Code[findDispoName?.code as keyof typeof Code]
                            }
                          >
                            {`${findDispoName?.name} - ${key} - "${
                              dispoKeyCode[key] || ""
                            }"`}
                          </option>
                        )
                      );
                    })}
                  </select>
                </label>
                <div className="flex w-full gap-2">
                  <div className="w-full">
                    {anabledDispo.includes(selectedDispo) ? (
                      <label className="flex flex-col w-full items-center">
                        <p className="text-gray-800 font-bold text-start w-full 2xl:text-sm text-xs leading-4">
                          Amount:
                        </p>
                        <div
                          className={`flex border items-center rounded-lg w-full ${
                            required && (!data.amount || data.amount === "0")
                              ? "bg-red-100 border-red-500"
                              : "bg-gray-50  border-gray-500"
                          } `}
                        >
                          <p className="px-2">&#x20B1;</p>
                          <input
                            type="text"
                            name="amount"
                            id="amount"
                            autoComplete="off"
                            value={data.amount ?? 0}
                            onChange={handleOnChangeAmount}
                            pattern="^\d+(\.\d{1,2})?$"
                            placeholder="Enter amount"
                            required={requiredDispo.includes(selectedDispo)}
                            className={`w-full text-xs 2xl:text-sm  text-gray-900 p-2 outline-none`}
                          />
                        </div>
                      </label>
                    ) : (
                      <IFBANK label="Amount" />
                    )}
                  </div>

                  <div className="w-full">
                    {anabledDispo.includes(selectedDispo) ? (
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
                              setData((prev) => ({
                                ...prev,
                                amount: selectedCustomer.balance.toFixed(2),
                              }));
                            }
                            handleDataChange("payment", e.target.value);
                          }}
                          className={`${
                            required && !data.payment
                              ? "bg-red-100 border-red-500"
                              : "bg-gray-50  border-gray-500"
                          } border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                        >
                          <option value="" accessKey="8">
                            Select Payment
                          </option>
                          {Object.entries(Payment).map(
                            ([key, value], index) => {
                              return (
                                <option
                                  value={value}
                                  key={key}
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

                <label className="flex flex-col items-center gap-0.5">
                  <p className="text-gray-800 font-bold text-start w-full  2xl:text-sm text-xs  leading-4 ">
                    Contact Method:
                  </p>
                  <select
                    name="contact_method"
                    id="contact_method"
                    required
                    value={data.contact_method ?? ""}
                    onChange={(e) =>
                      handleDataChange(
                        "contact_method",
                        checkIfChangeContactMethod &&
                          !selectedCustomer.current_disposition?.selectivesDispo
                          ? existingDispo?.contact_method
                          : e.target.value
                      )
                    }
                    className={`${
                      required && !data.contact_method
                        ? "bg-red-100 border-red-500"
                        : "bg-gray-50  border-gray-500"
                    }  border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                  >
                    <option value="">Select Contact Method</option>
                    {Object.entries(AccountType).map(([key, value], index) => {
                      return (
                        <option
                          value={value}
                          key={key}
                          className="capitalize"
                          accessKey={(index + 1).toString()}
                        >
                          {value.charAt(0).toUpperCase() +
                            value.slice(1, value.length)}{" "}
                          - {index + 1}
                        </option>
                      );
                    })}
                  </select>
                </label>
                {data.contact_method === AccountType.CALLS && (
                  <label className="flex flex-col  items-center gap-0.5">
                    <p className="text-gray-800 font-bold text-start w-full 2xl:text-sm text-xs leading-4">
                      Dialer
                    </p>
                    <select
                      name="dialer"
                      id="dialer"
                      required={data.contact_method === AccountType.CALLS}
                      value={data.dialer ?? ""}
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
                          : "bg-gray-50  border-gray-500"
                      }  border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                    >
                      <option value="">Select Dialer</option>
                      {Object.entries(Dialer).map(([key, value]) => {
                        return (
                          <option
                            value={value}
                            key={key}
                            className="capitalize"
                            accessKey={DialerCode[value]}
                          >
                            {value.charAt(0).toUpperCase() +
                              value.slice(1, value.length)}
                          </option>
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
                          : "bg-gray-50  border-gray-500"
                      }  border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                    >
                      <option value="">Select SMS Collector</option>
                      {Object.entries(SMSCollector).map(([key, value]) => {
                        return (
                          <option
                            value={value}
                            key={key}
                            className="capitalize"
                          >
                            {value.charAt(0).toUpperCase() +
                              value.slice(1, value.length)}
                          </option>
                        );
                      })}
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
                      {Object.entries(SkipCollector).map(([key, value]) => {
                        return (
                          <option
                            value={value}
                            key={key}
                            className="capitalize"
                          >
                            {value.charAt(0).toUpperCase() +
                              value.slice(1, value.length)}
                          </option>
                        );
                      })}
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
                    className={` bg-gray-50  border-gray-500  border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                  >
                    <option value="">Select RFD Reason</option>
                    {Object.entries(RFD).map(([key, value]) => {
                      return (
                        <option value={value} key={key}>
                          {value.charAt(0).toUpperCase() +
                            value.slice(1, value.length)}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
              <div className="flex gap-1.5 w-full flex-col">
               
                  {anabledDispo.includes(selectedDispo) ? (
                    <label className="flex flex-col items-center">
                      <p className="text-gray-800 font-bold text-start w-full  2xl:text-sm text-xs 2xl:w-2/6 leading-4">
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
                            : "bg-gray-50  border-gray-500"
                        } border text-gray-900  rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 text-xs 2xl:text-sm w-full`}
                      />
                    </label>
                  ) : (
                    <IFBANK label="Payment Date" />
                  )}
                  {anabledDispo.includes(selectedDispo) ? (
                    <label className="flex flex-col mt-1 2xl:flex-row items-center">
                      <p className="text-gray-800 font-bold text-start w-full 2xl:text-sm text-xs 2xl:w-2/6 leading-4 ">
                        Payment Method:
                      </p>
                      <select
                        name="payment_method"
                        id="payment_method"
                        value={data.payment_method ?? ""}
                        onChange={(e) =>
                          handleDataChange("payment_method", e.target.value)
                        }
                        className={` bg-gray-50  border-gray-500 border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs 2xl:text-sm w-full p-2`}
                      >
                        <option value="">Select Method</option>
                        {Object.entries(PaymentMethod).map(([key, value]) => {
                          return (
                            <option value={value} key={key}>
                              {value}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  ) : (
                    <IFBANK label="Payment Method" />
                  )}
             

                
                  {anabledDispo.includes(selectedDispo) ? (
                    <label className="flex flex-col 2xl:flex-row items-center">
                      <p className="text-gray-800 font-bold text-start w-full  2xl:text-sm text-xs 2xl:w-2/6 leading-4 ">
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
                        className={` bg-gray-50 border-gray-500 border rounded-lg text-xs 2xl:text-sm w-full p-2`}
                      />
                    </label>
                  ) : (
                    <IFBANK label="Ref. No" />
                  )}
                  <label className="flex flex-col items-start">
                    <p className="text-gray-800 mr-2 font-bold text-start w-full  2xl:text-sm text-xs 2xl:w-2/6 leading-4 ">
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
                      className="bg-gray-50 min-h-10 border border-gray-500 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs 2xl:text-sm w-full p-2 resize-none"
                    ></textarea>
                  </label>
                  <div className="flex justify-end gap-2 mt-2">
                    {data.disposition && (
                      <motion.button
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        accessKey="q"
                        type="submit"
                        className={`bg-green-500 hover:bg-green-600 focus:outline-none text-white focus:ring-4 focus:ring-green-400 font-black shadow-md rounded-sm uppercase px-5 py-3 cursor-pointer 2xl:text-sm text-xs`}
                      >
                        Submit
                      </motion.button>
                    )}
                    {data.disposition && userLogged?.type === "AGENT" && (
                      <motion.button
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        type="button"
                        className="bg-red-500 hover:bg-red-600 focus:outline-none text-white uppercase  focus:ring-4 focus:ring-red-400 font-black rounded-sm shadow-md px-5 py-3 cursor-pointer 2xl:text-sm text-xs"
                        onClick={() =>
                          handleSubmitEscalationToTl(
                            selectedCustomer?._id || ""
                          )
                        }
                      >
                        TL Escalation
                      </motion.button>
                    )}
                  </div>
                
              </div>
            </div>
          )}
          <div className=" flex justify-end mt-5 gap-5"></div>
        </motion.form>
        {confirm && <Confirmation {...modalProps} />}
      </AnimatePresence>
    )
  );
};

export default DispositionForm;
