import React, { useEffect, useMemo, useRef, useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";

enum PaymentMethod {
  CASH = "CASH",
  GCASH = "GCASH",
  MAYA = "MAYA",
  BANK_TRANSFER = "BANK_TRANSFER",
  CHECK = "CHECK",
  OTHERS = "OTHERS",
}

enum PaymentType {
  FULL = "FULL",
  PARTIAL = "PARTIAL",
}

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

enum SOF {
  REMMITANCE = "Remmitance",
  BUSSINESS = "Bussiness",
  PENSION = "Pension",
  Allowance = "Allowance",
  CASH_ON_HAND = "Cash On Hand",
  SALARY = "Salary",
  Others = "Others",
}

const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  [PaymentType.FULL]: "Full",
  [PaymentType.PARTIAL]: "Partial",
};

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Cash",
  [PaymentMethod.GCASH]: "GCash",
  [PaymentMethod.MAYA]: "Maya",
  [PaymentMethod.BANK_TRANSFER]: "Bank Transfer",
  [PaymentMethod.CHECK]: "Check",
  [PaymentMethod.OTHERS]: "Others",
};

type DispositionType = {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  contact_methods?: {
    field?: boolean | null;
  } | null;
};

const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
      contact_methods {
        field
      }
    }
  }
`;

const FINISH_CUSTOMER = gql`
  mutation FinishCustomer($id: ID!) {
    finishCustomer(id: $id) {
      success
      message
      customer {
        _id
        started
        finished
      }
    }
  }
`;

const CREATE_FIELD_DISPOSITION = gql`
  mutation CreateFieldDisposition($input: CreateFieldDispositionInput!) {
    createFieldDisposition(input: $input) {
      success
      message
      fieldDisposition {
        _id
      }
    }
  }
`;

type AgentBookedProps = {
  customer?: {
    _id?: string;
    customerName?: string | null;
    addresses?: string[] | null;
    accountNumber?: string | null;
    balance?: number | null;
    callfile?: string | null;
  } | null;
  onClose: () => void;
  refreshAssigned?: () => Promise<any[]>;
  loading?: boolean;
};

const AgentBooked = ({
  customer,
  onClose,
  refreshAssigned,
  loading,
}: AgentBookedProps) => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [selectedDispositionId, setSelectedDispositionId] =
    useState<string>("");
  const [isDispositionModalOpen, setIsDispositionModalOpen] =
    useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    PaymentMethod | ""
  >("");
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] =
    useState<boolean>(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<
    PaymentType | ""
  >("");
  const [isPaymentTypeModalOpen, setIsPaymentTypeModalOpen] =
    useState<boolean>(false);

  const [finishCustomer] = useMutation(FINISH_CUSTOMER);
  const [createFieldDisposition] = useMutation(CREATE_FIELD_DISPOSITION);

  const [selectedRfd, setSelectedRfd] = useState<RFD | "">("");
  const [isRfdModalOpen, setIsRfdModalOpen] = useState<boolean>(false);

  const [selectedSof, setSelectedSof] = useState<SOF | "">("");
  const [isSofModalOpen, setIsSofModalOpen] = useState<boolean>(false);

  const [paymentDate, setPaymentDate] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  const finishTrackRef = useRef<HTMLDivElement | null>(null);
  const finishHandleRef = useRef<HTMLButtonElement | null>(null);
  const finishX = useMotionValue(0);
  const [finishDragMax, setFinishDragMax] = useState<number>(0);

  const [finishHandleWidth, setFinishHandleWidth] = useState<number>(0);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [isCopy, setIsCopy] = useState("");

  const finishFillWidth = useTransform(finishX, (x) => {
    const trackWidth = finishDragMax + finishHandleWidth;
    const width = x + finishHandleWidth;
    return Math.max(0, Math.min(trackWidth, width));
  });

  const handleSetToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setPaymentDate(`${yyyy}-${mm}-${dd}`);
  };

  const { data: dispositionData, loading: dispositionLoading } = useQuery<{
    getDispositionTypes: DispositionType[];
  }>(GET_DISPOSITION_TYPES, { fetchPolicy: "no-cache" });

  const fieldDispositions = useMemo(() => {
    const all = dispositionData?.getDispositionTypes ?? [];
    return all.filter((d) => d?.contact_methods?.field === true);
  }, [dispositionData]);

  const selectedDispositionLabel = useMemo(() => {
    const selected = fieldDispositions.find(
      (d) => d?.id === selectedDispositionId,
    );
    if (!selected) return "";
    const name = String(selected.name ?? "").trim();
    const code = String(selected.code ?? "").trim();
    return code ? `${name} (${code})` : name;
  }, [fieldDispositions, selectedDispositionId]);

  const selectedDispositionCode = useMemo(() => {
    const selected = fieldDispositions.find(
      (d) => d?.id === selectedDispositionId,
    );
    return String(selected?.code ?? "")
      .trim()
      .toUpperCase();
  }, [fieldDispositions, selectedDispositionId]);

  const isPaymentFieldsEnabled = useMemo(() => {
    return ["PAID", "PTP", "UNEG", "PAID (CLAIMING)"].includes(
      selectedDispositionCode,
    );
  }, [selectedDispositionCode]);

  const isFinishEnabled = useMemo(() => {
    const hasDisposition = Boolean(selectedDispositionId);
    if (!hasDisposition) return false;

    const hasComment = comment.trim().length > 0;
    const requiresPaymentDetails = [
      "PAID (CLAIMING)",
      "PAID",
      "PTP",
      "UNEG",
    ].includes(selectedDispositionCode);

    if (!requiresPaymentDetails) return hasComment;

    const hasPaymentMethod = selectedPaymentMethod !== "";
    const hasPaymentType = selectedPaymentType !== "";
    const hasPaymentDate = paymentDate.trim().length > 0;
    const hasAmount = amount.trim().length > 0;
    const hasReference = reference.trim().length > 0;

    const referenceOk =
      hasReference || selectedPaymentMethod === PaymentMethod.CASH;

    return (
      hasComment &&
      hasPaymentMethod &&
      hasPaymentType &&
      hasPaymentDate &&
      hasAmount &&
      referenceOk
    );
  }, [
    amount,
    comment,
    paymentDate,
    reference,
    selectedDispositionCode,
    selectedDispositionId,
    selectedPaymentMethod,
    selectedPaymentType,
  ]);

  useEffect(() => {
    if (isPaymentFieldsEnabled) return;

    setSelectedPaymentMethod("");
    setSelectedPaymentType("");
    setPaymentDate("");
    setAmount("");
    setReference("");
  }, [isPaymentFieldsEnabled]);

  useEffect(() => {
    const compute = () => {
      const track = finishTrackRef.current;
      const handle = finishHandleRef.current;
      if (!track || !handle) return;

      const max = Math.max(0, track.clientWidth - handle.clientWidth);
      setFinishDragMax(max);
      setFinishHandleWidth(handle.clientWidth);
    };

    compute();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => compute());
      if (finishTrackRef.current) ro.observe(finishTrackRef.current);
      if (finishHandleRef.current) ro.observe(finishHandleRef.current);
      return () => ro.disconnect();
    }

    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const handleFinishSwipe = async () => {
    const currentX = finishX.get();

    const threshold = finishDragMax * 0.95;

    if (currentX >= threshold && isFinishEnabled) {
      setIsFinishing(true);
      try {
        await createFieldDisposition({
          variables: {
            input: {
              disposition: selectedDispositionId,
              payment_method:
                selectedPaymentMethod === "" ? null : selectedPaymentMethod,
              payment:
                selectedPaymentType === ""
                  ? null
                  : selectedPaymentType.toLowerCase(),
              payment_date: paymentDate || null,
              amount: amount ? Number(amount) : null,
              ref_no: reference || null,
              rfd: selectedRfd || null,
              sof: selectedSof || null,
              customer_account: customer?._id,
              callfile: customer?.callfile || null,
              user: userLogged?._id,
              comment: comment || null,
            },
          },
        });
        await finishCustomer({ variables: { id: customer?._id } });
        animate(finishX, finishDragMax, { type: "spring", stiffness: 300 });
        if (typeof refreshAssigned === "function") {
          try {
            await refreshAssigned();
          } catch (err) {
            console.error("refreshAssigned failed:", err);
          }
        }
        onClose?.();
      } catch (err) {
        console.error(err);
      } finally {
        setIsFinishing(false);
      }
    } else {
      animate(finishX, 0, { type: "spring", stiffness: 300 });
    }
  };

  useEffect(() => {
    finishX.set(0);
  }, [customer?._id]);

  const addressText = (customer?.addresses || []).join(", ");

  const handleCopy = async () => {
    const text = (customer?.addresses || []).join(", ");
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);

        setIsCopy("Copied!");
        return;
      } catch (err) {
        console.warn("Clipboard API failed, falling back", err);
      }
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      document.execCommand("copy");
      document.body.removeChild(textarea);
      setIsCopy("Copied!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute z-40 flex flex-col p-4 top-0 left-0 w-full gap-2 h-full bg-blue-100"
    >
      <AnimatePresence>
        {!customer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-blue-200/80 backdrop-blur-sm z-20 flex justify-center items-center w-full absolute top-0 left-0 h-full"
          >
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              className="relative h-20 w-20 flex justify-center bg-blue-300 rounded-full shadow-md items-center"
            >
              <div className="text-xs text-gray-500 absolute">Loading...</div>
              <div className="w-full h-full border-t animate-spin rounded-full"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-[85%] overflow-auto flex pr-2 flex-col gap-4">
        <motion.div
          className="bg-blue-200 text-sm font-semibold flex flex-col border border-blue-600 rounded-sm shadow-md"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="py-2 text-center text-white  font-black uppercase bg-blue-600">
            Customer Details
          </div>
          <div className="flex flex-col p-4">
            <div className="w-full">
              <div className="flex gap-2">
                <div>Name: </div>
                <div className="uppercase">
                  {customer?.customerName ?? "Unknown"}
                </div>
              </div>

              <div className="flex gap-2">
                <div>Contact Number: </div>
                <div>
                  {customer?.contact_no ? (
                    customer?.contact_no
                  ) : (
                    <div className="italic text-gray-500 text-xs font-semibold">
                      No contact number
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="flex gap-2 w-full">
                      <div>Address:</div>
                      <div className="w-full h-full">
                        {addressText || (
                          <div className="italic h-full text-gray-500 text-xs font-semibold">
                            No complete address
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center items-center">
                      <button
                        onClick={handleCopy}
                        disabled={!addressText}
                        className="px-3 py-1 bg-gray-100 border rounded-sm shadow-md hover:bg-gray-200 disabled:opacity-50"
                      >
                        {isCopy === "Copied!" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col pt-4 text-center">
              <div className="font-black text-xl whitespace-nowrap">
                {(customer?.balance ?? 0).toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </div>
              <div className="text-xs whitespace-nowrap">Amount to Collect</div>
            </div>
          </div>
          <div className="flex px-4 pb-4 gap-2 text-white">
            <div className="w-full py-2 bg-amber-600 shadow-md border-amber-900 text-center flex justify-center rounded-sm border-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="w-full py-2 bg-green-600 shadow-md border-green-900 text-center flex justify-center rounded-sm border-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97-1.94.284-3.916.455-5.922.505a.39.39 0 0 0-.266.112L8.78 21.53A.75.75 0 0 1 7.5 21v-3.955a48.842 48.842 0 0 1-2.652-.316c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-blue-200 text-sm font-semibold flex flex-col border border-blue-600 rounded-sm shadow-md"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="py-2 text-center text-white  font-black uppercase bg-blue-600">
            Customer Disposition
          </div>
          <div className="grid grid-cols-2 gap-2 p-4">
            <div className="flex flex-col gap-1">
              <div className="flex truncate">
                Select a Disposition:
                <div className="ml-1 font-black text-red-800">*</div>
              </div>
              <div
                onClick={() => setIsDispositionModalOpen(true)}
                className="border px-3 py-1 truncate rounded-sm bg-gray-100 cursor-pointer"
              >
                {selectedDispositionLabel || "Select a disposition"}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex truncate">
                Select a Payment Method:
                <div
                  className={` ${
                    isPaymentFieldsEnabled ? "" : "hidden"
                  }  ml-1 font-black text-red-800 `}
                >
                  *
                </div>
              </div>
              <div
                onClick={() =>
                  isPaymentFieldsEnabled && setIsPaymentMethodModalOpen(true)
                }
                className={`border px-3 py-1 rounded-sm bg-gray-100 truncate ${
                  isPaymentFieldsEnabled
                    ? "cursor-pointer shadow-md"
                    : "opacity-60 border-gray-500 text-gray-500 cursor-not-allowed"
                }`}
              >
                {selectedPaymentMethod
                  ? PAYMENT_METHOD_LABEL[selectedPaymentMethod]
                  : "Select a Payment Method"}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex">
                Payment Type:
                <div
                  className={` ${
                    isPaymentFieldsEnabled ? "" : "hidden"
                  }  ml-1 font-black text-red-800 `}
                >
                  *
                </div>
              </div>
              <div
                onClick={() =>
                  isPaymentFieldsEnabled && setIsPaymentTypeModalOpen(true)
                }
                className={`border px-3 py-1 rounded-sm bg-gray-100 truncate ${
                  isPaymentFieldsEnabled
                    ? "cursor-pointer shadow-md"
                    : "opacity-60 border-gray-500 text-gray-500 cursor-not-allowed"
                }`}
              >
                {selectedPaymentType
                  ? PAYMENT_TYPE_LABEL[selectedPaymentType]
                  : "Select a Payment Type"}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex">
                Payment Date:
                <div
                  className={` ${
                    isPaymentFieldsEnabled ? "" : "hidden"
                  }  ml-1 font-black text-red-800 `}
                >
                  *
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={!isPaymentFieldsEnabled}
                  className={`border outline-none col-span-2 px-1 py-1 rounded-sm bg-gray-100 truncate ${
                    isPaymentFieldsEnabled
                      ? "shadow-md"
                      : "opacity-60 border-gray-500 text-gray-500 cursor-not-allowed"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSetToday}
                  disabled={!isPaymentFieldsEnabled}
                  className={`${
                    !isPaymentFieldsEnabled
                      ? "bg-gray-100 opacity-60 border-gray-500 text-gray-500"
                      : " bg-blue-600 text-white border-blue-900  shadow-md"
                  } text-[0.7rem] border items-center uppercase flex justify-center rounded-sm cursor-pointer`}
                >
                  TODAY
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex">
                Amount:
                <div
                  className={` ${
                    isPaymentFieldsEnabled ? "" : "hidden"
                  }  ml-1 font-black text-red-800 `}
                >
                  *
                </div>
              </div>
              <div className="gap-2">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!isPaymentFieldsEnabled}
                  className={`w-full border outline-none col-span-2 px-3 py-1 rounded-sm bg-gray-100 truncate ${
                    isPaymentFieldsEnabled
                      ? "shadow-md"
                      : "opacity-60 border-gray-500 text-gray-500 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex">
                Reference:
                <div
                  className={` ${
                    isPaymentFieldsEnabled &&
                    selectedPaymentMethod !== PaymentMethod.CASH
                      ? ""
                      : "hidden"
                  }  ml-1 font-black text-red-800 `}
                >
                  *
                </div>
              </div>
              <div className="gap-2">
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={
                    isPaymentFieldsEnabled &&
                    selectedPaymentMethod === PaymentMethod.CASH
                  }
                  className={`w-full border outline-none col-span-2 px-3 py-1 rounded-sm bg-gray-100 truncate ${
                    isPaymentFieldsEnabled &&
                    selectedPaymentMethod !== PaymentMethod.CASH
                      ? "shadow-md"
                      : "opacity-60 border-gray-500 text-gray-500 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div>RFD:</div>
              <div
                onClick={() => setIsRfdModalOpen(true)}
                className="border px-3 py-1 rounded-sm bg-gray-100 truncate cursor-pointer"
              >
                {selectedRfd || "Select a RFD"}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div>SOF:</div>
              <div
                onClick={() => setIsSofModalOpen(true)}
                className="border px-3 py-1 rounded-sm bg-gray-100 truncate cursor-pointer"
              >
                {selectedSof || "Select a SOF"}
              </div>
            </div>

            <div className="col-span-2 gap-1">
              <div className="flex">
                Comment/Remarks:
                <div className="ml-1 font-black text-red-800">*</div>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full min-h-10 border outline-none px-3 py-1 rounded-sm bg-gray-100 truncate"
              />
            </div>
          </div>
        </motion.div>
      </div>
      <div
        className={` bottom-0 transition-all duration-500 h-[15%] abslute text-white w-full items-center flex px left-0 gap-4 `}
      >
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-400/50 h-full max-h-20 backdrop-blur-sm gap-2 flex p-2 rounded-full w-full"
        >
          <div
            ref={finishTrackRef}
            className={`w-full max- h-full flex items-center overflow-hidden rounded-full border-2 relative touch-none select-none ${
              isFinishEnabled
                ? "bg-green-300 border-green-800"
                : "bg-gray-200 border-gray-400"
            }`}
          >
            <motion.div
              className={`absolute left-0 top-0 bottom-0 rounded-full z-0 ${
                isFinishEnabled ? "bg-green-600/60" : "bg-gray-400/30"
              }`}
              style={{ width: finishFillWidth }}
            />

            <div className="absolute inset-0 h-full flex items-center justify-center pointer-events-none z-10">
              {isFinishing ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-green-900"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span className="text-xl font-black uppercase tracking-wide text-green-900">
                    Finishing...
                  </span>
                </div>
              ) : (
                <span
                  className={`text-xl font-black uppercase tracking-wide ${
                    isFinishEnabled ? "text-green-900" : "text-gray-500"
                  }`}
                >
                  FINISH
                </span>
              )}
            </div>

            <motion.button
              ref={finishHandleRef}
              type="button"
              drag={isFinishEnabled && !isFinishing ? "x" : false}
              dragConstraints={{ left: 0, right: finishDragMax }}
              dragElastic={0}
              dragMomentum={false}
              onDragEnd={handleFinishSwipe}
              style={{ x: finishX }}
              className={`relative z-20 h-full px-10 rounded-full uppercase font-black text-white shadow-md flex items-center justify-center touch-none select-none ${
                isFinishEnabled
                  ? `bg-green-600 border-green-900 ${isFinishing ? "opacity-60 cursor-wait" : "cursor-grab active:cursor-grabbing"}`
                  : "bg-gray-400 border-gray-600 cursor-not-allowed"
              }`}
              disabled={isFinishing}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6 text-shadow-2xs"
              >
                <path
                  fillRule="evenodd"
                  d="M3 2.25a.75.75 0 0 1 .75.75v.54l1.838-.46a9.75 9.75 0 0 1 6.725.738l.108.054A8.25 8.25 0 0 0 18 4.524l3.11-.732a.75.75 0 0 1 .917.81 47.784 47.784 0 0 0 .005 10.337.75.75 0 0 1-.574.812l-3.114.733a9.75 9.75 0 0 1-6.594-.77l-.108-.054a8.25 8.25 0 0 0-5.69-.625l-2.202.55V21a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 3 2.25Z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>
      <AnimatePresence>
        {isDispositionModalOpen && (
          <div className="absolute flex flex-col p-10 items-center justify-center top-0 left-0 w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 w-full z-10 h-full bg-black/40 backdrop-blur-sm"
              onClick={() => setIsDispositionModalOpen(false)}
            ></motion.div>
            <motion.div
              className="z-20 flex-col overflow-hidden border-2 border-blue-800  w-full h-full text-white rounded-md shadow-md flex items-center justify-center"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
            >
              <div className="font-black relative text-center w-full border-b-2 border-blue-800 py-3 bg-blue-600 uppercase ">
                SELect a disposition
                <div
                  onClick={() => setIsDispositionModalOpen(false)}
                  className="absolute top-2.5 right-2 cursor-pointer p-1 bg-red-600 rounded-full border-2 border-red-800 shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="4"
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col bg-blue-100 gap-2 shadow-md  p-2 font-semibold text-white w-full overflow-auto ">
                {fieldDispositions.map((disposition) => (
                  <div
                    key={disposition.id}
                    onClick={() => {
                      setSelectedDispositionId(disposition.id || "");
                      setIsDispositionModalOpen(false);
                    }}
                    className="cursor-pointer bg-blue-600 px-4 py-2 border border-blue-800 hover:bg-blue-200 rounded-sm"
                  >
                    {disposition.name}{" "}
                    {disposition.code && `(${disposition.code})`}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPaymentMethodModalOpen && (
          <div className="absolute flex flex-col p-10 items-center justify-center top-0 left-0 w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 w-full z-10 h-full bg-black/40 backdrop-blur-sm"
              onClick={() => setIsPaymentMethodModalOpen(false)}
            />

            <motion.div
              className="z-20 flex-col overflow-hidden border-2 border-blue-800 w-full  text-white rounded-md shadow-md flex items-center justify-center"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
            >
              <div className="font-black relative text-center w-full border-b-2 border-blue-800 py-3 bg-blue-600 uppercase">
                Select a payment method
                <div
                  onClick={() => setIsPaymentMethodModalOpen(false)}
                  className="absolute top-2.5 right-2 cursor-pointer p-1 bg-red-600 rounded-full border-2 border-red-800 shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="4"
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col bg-blue-100 gap-2 shadow-md p-2 font-semibold text-white w-full overflow-auto">
                {(Object.values(PaymentMethod) as PaymentMethod[]).map(
                  (method) => (
                    <div
                      key={method}
                      onClick={() => {
                        setSelectedPaymentMethod(method);
                        setIsPaymentMethodModalOpen(false);
                      }}
                      className="cursor-pointer bg-blue-600 px-4 py-2 border border-blue-800 hover:bg-blue-200 rounded-sm"
                    >
                      {PAYMENT_METHOD_LABEL[method]}
                    </div>
                  ),
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPaymentTypeModalOpen && (
          <div className="absolute flex flex-col p-10 items-center justify-center top-0 left-0 w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 w-full z-10 h-full bg-black/40 backdrop-blur-sm"
              onClick={() => setIsPaymentTypeModalOpen(false)}
            />

            <motion.div
              className="z-20 flex-col overflow-hidden border-2 border-blue-800 w-full text-white rounded-md shadow-md flex items-center justify-center"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
            >
              <div className="font-black relative text-center w-full border-b-2 border-blue-800 py-3 bg-blue-600 uppercase">
                Select a payment type
                <div
                  onClick={() => setIsPaymentTypeModalOpen(false)}
                  className="absolute top-2.5 right-2 cursor-pointer p-1 bg-red-600 rounded-full border-2 border-red-800 shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="4"
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col bg-blue-100 gap-2 shadow-md p-2 font-semibold text-white w-full overflow-auto">
                {(Object.values(PaymentType) as PaymentType[]).map((type) => (
                  <div
                    key={type}
                    onClick={() => {
                      if (selectedPaymentType !== PaymentType.FULL) {
                        setAmount((customer?.balance ?? 0).toString());
                        setSelectedPaymentType(type);
                        setIsPaymentTypeModalOpen(false);
                      } else {
                        setSelectedPaymentType(type);
                        setIsPaymentTypeModalOpen(false);
                        setAmount("");
                      }
                    }}
                    className="cursor-pointer bg-blue-600 px-4 py-2 border border-blue-800 hover:bg-blue-200 rounded-sm"
                  >
                    {PAYMENT_TYPE_LABEL[type]}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRfdModalOpen && (
          <div className="absolute flex flex-col p-10 items-center justify-center top-0 left-0 w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 w-full z-10 h-full bg-black/40 backdrop-blur-sm"
              onClick={() => setIsRfdModalOpen(false)}
            />

            <motion.div
              className="z-20 flex-col overflow-hidden border-2 border-blue-800 w-full text-white rounded-md shadow-md flex items-center justify-center"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
            >
              <div className="font-black relative text-center w-full border-b-2 border-blue-800 py-3 bg-blue-600 uppercase">
                Select RFD
                <div
                  onClick={() => setIsRfdModalOpen(false)}
                  className="absolute top-2.5 right-2 cursor-pointer p-1 bg-red-600 rounded-full border-2 border-red-800 shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="4"
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col bg-blue-100 gap-2 shadow-md p-2 font-semibold text-white w-full overflow-auto">
                {(Object.values(RFD) as RFD[]).map((rfd) => (
                  <div
                    key={rfd}
                    onClick={() => {
                      setSelectedRfd(rfd);
                      setIsRfdModalOpen(false);
                    }}
                    className="cursor-pointer bg-blue-600 px-4 py-2 border border-blue-800 hover:bg-blue-200 rounded-sm"
                  >
                    {rfd}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSofModalOpen && (
          <div className="absolute flex flex-col p-10 items-center justify-center top-0 left-0 w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 w-full z-10 h-full bg-black/40 backdrop-blur-sm"
              onClick={() => setIsSofModalOpen(false)}
            />

            <motion.div
              className="z-20 flex-col overflow-hidden border-2 border-blue-800 w-full text-white rounded-md shadow-md flex items-center justify-center"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
            >
              <div className="font-black relative text-center w-full border-b-2 border-blue-800 py-3 bg-blue-600 uppercase">
                Select SOF
                <div
                  onClick={() => setIsSofModalOpen(false)}
                  className="absolute top-2.5 right-2 cursor-pointer p-1 bg-red-600 rounded-full border-2 border-red-800 shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="4"
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col bg-blue-100 gap-2 shadow-md p-2 font-semibold text-white w-full overflow-auto">
                {(Object.values(SOF) as SOF[]).map((sof) => (
                  <div
                    key={sof}
                    onClick={() => {
                      setSelectedSof(sof);
                      setIsSofModalOpen(false);
                    }}
                    className="cursor-pointer bg-blue-600 px-4 py-2 border border-blue-800 hover:bg-blue-200 rounded-sm"
                  >
                    {sof}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AgentBooked;
