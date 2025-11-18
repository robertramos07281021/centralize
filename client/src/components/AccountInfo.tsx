import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { CurrentDispo, Search } from "../middleware/types";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import OtherAccountsViews from "./OtherAccountsViews";
import { useLocation } from "react-router-dom";
import AccountHistoriesView from "./AccountHistoriesView";
import DispositionRecords from "./DispositionRecords";
import UpdateCustomerAccount from "./UpdateCustomerAccount";
import UpdatedAccountHistory from "./UpdatedAccountHistory";
import { motion, AnimatePresence } from "framer-motion";

const OTHER_ACCOUNTS = gql`
  query customerOtherAccounts($caId: ID) {
    customerOtherAccounts(caId: $caId) {
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
      # isRPCToday
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

const GET_AGENT_BUCKET = gql`
  query GetDeptBucket {
    getDeptBucket {
      _id
      name
    }
  }
`;

const ACCOUNT_HISTORIES = gql`
  query findAccountHistories($id: ID!) {
    findAccountHistories(id: $id) {
      _id
      balance
      account_bucket {
        name
      }
      case_id
      endorsement_date
      max_dpd
      dpd
      account_callfile {
        name
      }
      out_standing_details {
        principal_os
        total_os
      }
      user {
        _id
        name
        user_id
      }
      paid_amount
      dispotype {
        _id
        code
        name
      }
      cd {
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
      }
    }
  }
`;

type OSD = {
  principal_os: number;
  total_os: number;
};

type Dispotype = {
  _id: string;
  code: string;
  name: string;
};

type Callfile = {
  name: string;
};

type Bucket = {
  name: string;
};

type User = {
  _id: string;
  name: string;
  user_id: string;
};
type AccountHistory = {
  _id: string;
  balance: number;
  account_bucket: Bucket;
  case_id: string;
  dpd: number;
  account_callfile: Callfile;
  endorsement_date: string;
  max_dpd: number;
  out_standing_details: OSD;
  cd: CurrentDispo;
  dispotype: Dispotype;
  user: User;
  partial_payment_w_service_fee: number;
  new_tad_with_sf: number;
  new_pay_off: number;
  service_fee: number;
  year: string;
  model: string;
  brand: string;
  late_payment_amount: number;
  late_payment_date: string;
};

const FieldsDiv = ({
  label,
  value,
  endorsementDate,
}: {
  label: string;
  value: string | number | null | undefined;
  endorsementDate: string | null;
}) => {
  let newValue = value;
  const fieldsOfNumber = [
    "principal os",
    "interest os",
    "admin fee os",
    "dst fee os",
    "late charge waive fee os",
    "late charge os",
    "waive fee os",
    "txn fee os",
    "cf",
    "txn fee os",
  ];

  if (Number(value) && endorsementDate) {
    const endorsement = new Date(endorsementDate);
    endorsement.setDate(endorsement.getDate() + Number(value));
    newValue = endorsement.toLocaleDateString("en-PH");
  }

  if (fieldsOfNumber.includes(label.toLowerCase())) {
    newValue = value?.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  }

  return (
    <div className="flex flex-col items-center w-full gap-0.5">
      <p className="text-gray-800 font-bold text-start w-full 2xl:text-sm text-xs leading-4 select-none">
        {label} :
      </p>
      <div
        className={`${
          newValue || null ? "p-2" : "2xl:p-4.5 p-4"
        } text-xs 2xl:text-sm border rounded-sm border-black bg-gray-100 text-gray-600 w-full`}
      >
        {newValue || ""}
      </div>
    </div>
  );
};

export type ChildHandle = {
  showButtonToFalse: () => void;
  divElement: HTMLDivElement | null;
};

export type PresetSelection = {
  amount: number | null;
  label: string | null;
};

const AccountInfo = forwardRef<
  ChildHandle,
  { presetSelection?: PresetSelection }
>(({ presetSelection }, ref) => {
  const location = useLocation();
  const isTLCIP = ["/tl-cip", "/agent-cip"].includes(location.pathname);
  const { selectedCustomer, userLogged } = useSelector(
    (state: RootState) => state.auth
  );
  const [showAccounts, setShowAccounts] = useState<boolean>(false);
  const { data, refetch: otherAccountsRefetch } = useQuery<{
    customerOtherAccounts: Search[];
  }>(OTHER_ACCOUNTS, {
    variables: { caId: selectedCustomer?._id },
    skip: !selectedCustomer && !isTLCIP,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (selectedCustomer) {
      const refetching = async () => {
        await otherAccountsRefetch();
      };
      refetching();
    }
  }, [selectedCustomer]);

  const [showAccountHistory, setShowAccountHistory] = useState<boolean>(false);
  const { data: accountHistory, refetch } = useQuery<{
    findAccountHistories: AccountHistory[];
  }>(ACCOUNT_HISTORIES, {
    variables: { id: selectedCustomer?._id },
    skip: !selectedCustomer && !isTLCIP,
    notifyOnNetworkStatusChange: true,
  });

  const [isClose, setIsClose] = useState(false);
  const [showButton, setShowButton] = useState<boolean>(false);
  const divRef = useRef<HTMLDivElement | null>(null);
  const [showDispoHistory, setShowDispoHistory] = useState<boolean>(false);
  const [updateCustomerAccounts, setUpdateCustomerAccounts] =
    useState<boolean>(false);
  const UpdateAccountHistory = selectedCustomer?.account_update_history;
  const [showUpdateOnCA, setShowUpdateOnCA] = useState<boolean>(false);

  const { data: agentBucketData } = useQuery<{ getDeptBucket: Bucket[] }>(
    GET_AGENT_BUCKET,
    {
      notifyOnNetworkStatusChange: true,
      skip: !selectedCustomer && !isTLCIP,
    }
  );

  useImperativeHandle(ref, () => ({
    showButtonToFalse: () => {
      setShowButton(false);
    },
    divElement: divRef.current,
  }));

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (selectedCustomer) {
        await refetch();
      }
    });
    return () => clearTimeout(timer);
  }, [selectedCustomer]);

  const sumOf =
    selectedCustomer && data && accountHistory
      ? data?.customerOtherAccounts?.length +
        accountHistory?.findAccountHistories?.length +
        selectedCustomer?.dispo_history?.length +
        selectedCustomer?.account_update_history?.length
      : 0;

  // const formattedAmount = useMemo(() => {
  //   if (!presetAmount) return "";
  //   const parsed = Number(presetAmount);
  //   return Number.isNaN(parsed)
  //     ? presetAmount
  //     : parsed.toLocaleString("en-PH", {
  //         style: "currency",
  //         currency: "PHP",
  //       });
  // }, [presetAmount]);

  const presetLabel = presetSelection?.label || "Partial";

  return (
    <div className="w-full h-full">
      {isClose && (
        <div className="absolute top-0  left-0 w-full h-full">
          {showAccounts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <OtherAccountsViews
                others={data?.customerOtherAccounts || []}
                close={() => {
                  setIsClose(false);
                  setShowAccounts(false);
                }}
              />
            </motion.div>
          )}
          {showAccountHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AccountHistoriesView
                histories={accountHistory?.findAccountHistories || []}
                close={() => {
                  setIsClose(false);
                  setShowAccountHistory(false);
                }}
              />
            </motion.div>
          )}
          {showDispoHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DispositionRecords
                close={() => {
                  setIsClose(false);
                  setShowDispoHistory(false);
                }}
              />
            </motion.div>
          )}
          {showUpdateOnCA && (
            <UpdatedAccountHistory
              close={() => {
                setIsClose(false);
                setShowUpdateOnCA(false);
              }}
            />
          )}
        </div>
      )}

      <div className="flex flex-col w-full">
        <div className="absolute top-15 left-5 z-30">
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
            {selectedCustomer && (
              <div
                className={`text-4xl text-white shadow-md hover:bg-blue-600 transition-all p-1 bg-blue-500 border-2 rounded-md border-blue-700 cursor-pointer`}
                onClick={() => {
                  setShowButton((prev) => !prev);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
            )}
            <AnimatePresence>
              {!showButton && (
                <motion.div
                  className={`absolute -top-3  font-black py-1 -right-3 min-w-5 min-h-5 border-2 text-xs px-2 flex items-center justify-center text-white rounded-full ${
                    sumOf > 0 && !isNaN(sumOf)
                      ? "bg-red-500 border-red-900"
                      : "bg-green-500 border-green-900"
                  }`}
                  initial={{ scale: 0.1, opacity: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.1 }}
                >
                  {isNaN(sumOf) ? 0 : sumOf}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {showButton && (
                <motion.div
                  className="border whitespace-nowrap absolute mt-1 flex flex-col gap-3 p-4 rounded-md border-black bg-white shadow-md"
                  ref={divRef}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ y: -20, opacity: 0 }}
                >
                  <div
                    className="relative cursor-pointer"
                    onClick={() => {
                      setShowDispoHistory(true);
                      setIsClose(true);
                    }}
                  >
                    <div className="bg-blue-600 border-2 border-blue-900 hover:bg-blue-700 text-center py-3 text-white cursor-pointer shadow-md rounded-md uppercase font-black text-xs">
                      Account History
                    </div>
                    <div
                      className={`${
                        selectedCustomer &&
                        selectedCustomer?.dispo_history?.length > 0
                          ? "bg-red-600 border-red-900"
                          : "bg-green-600 border-green-900"
                      } absolute -top-2 rounded-full border-2 border-green-900 shadow-md px-2 font-black text-white -right-2`}
                    >
                      {selectedCustomer &&
                      selectedCustomer?.dispo_history?.length > 0
                        ? selectedCustomer?.dispo_history?.length
                        : 0}
                    </div>
                  </div>

                  <div
                    className="relative cursor-pointer"
                    onClick={() => {
                      setShowAccounts(true);
                      setIsClose(true);
                    }}
                  >
                    <div className="bg-green-600 border-2 border-green-900 hover:bg-green-700 text-center py-3 text-white cursor-pointer shadow-md rounded-md uppercase font-black text-xs">
                      other account
                    </div>
                    <div
                      className={`${
                        (data?.customerOtherAccounts ?? []).length > 0
                          ? "bg-red-600 border-red-900"
                          : "bg-green-600 border-green-900"
                      } absolute -top-2 rounded-full border-2 border-green-900 shadow-md px-2 font-black text-white -right-2`}
                    >
                      {data && data?.customerOtherAccounts?.length > 0
                        ? data?.customerOtherAccounts?.length
                        : 0}
                    </div>
                  </div>
                  <div
                    className="relative cursor-pointer"
                    onClick={() => {
                      setShowAccountHistory(true);
                      setIsClose(true);
                    }}
                  >
                    <div className="bg-orange-600 border-2 px-4 border-orange-900 hover:bg-orange-700 text-center py-3 text-white cursor-pointer shadow-md rounded-md uppercase font-black text-xs">
                      Past Callfile History
                    </div>
                    <div
                      className={`${
                        (accountHistory?.findAccountHistories ?? []).length > 0
                          ? "bg-red-600 border-red-900"
                          : "bg-green-600 border-green-900"
                      } absolute -top-2 rounded-full border-2 border-green-900 shadow-md px-2 font-black text-white -right-2`}
                    >
                      {accountHistory &&
                      accountHistory?.findAccountHistories?.length > 0
                        ? accountHistory?.findAccountHistories?.length
                        : 0}
                    </div>
                  </div>
                  {selectedCustomer?.account_bucket?.can_update_ca && (
                    <div
                      className="relative cursor-pointer"
                      onClick={() => {
                        setShowUpdateOnCA(true);
                        setIsClose(true);
                      }}
                    >
                      <div className="bg-cyan-600 border-2 px-4 border-cyan-900 hover:bg-cyan-700 text-center py-3 text-white cursor-pointer shadow-md rounded-md uppercase font-black text-xs">
                        Update Account History
                      </div>
                      <div
                        className={`${
                          (UpdateAccountHistory ?? []).length > 0
                            ? "bg-red-600 border-red-900"
                            : "bg-green-600 border-green-900"
                        } absolute -top-2 rounded-full border-2  shadow-md px-2 font-black text-white -right-2`}
                      >
                        {UpdateAccountHistory &&
                        UpdateAccountHistory?.length > 0
                          ? UpdateAccountHistory?.length
                          : 0}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col z-10 w-full overflow-hidden 2xl:gap-2 gap-2 bg-gray-100 border-t-2 border-x-2 border-gray-600 rounded-xl justify-center "
        >
          <h1 className="text-center font-black bg-gray-400 border-b uppercase text-black text-2xl py-3">
            Account Information{" "}
          </h1>

          {selectedCustomer?.batch_no && (
            <div className=" flex items-center justify-center text-gray-600">
              <div className="w-1/4 flex flex-col text-center">
                <div className="font-bold text-gray-800 text-sm">Batch No.</div>
                <div className="border rounded-sm border-black text-sm py-1.5 bg-gray-100">
                  {selectedCustomer.batch_no}
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2 px-5 ">
            <div className="grid grid-cols-3 uppercase gap-2  w-full">
              <FieldsDiv
                label="Bucket"
                value={selectedCustomer?.account_bucket?.name}
                endorsementDate={null}
              />
              <FieldsDiv
                label="Case ID / PN / Account ID"
                value={selectedCustomer?.case_id}
                endorsementDate={null}
              />
              <FieldsDiv
                label="Principal OS"
                value={
                  selectedCustomer?.out_standing_details?.principal_os || 0
                }
                endorsementDate={null}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 uppercase  w-full">
              <FieldsDiv
                label="DPD"
                value={selectedCustomer?.dpd}
                endorsementDate={null}
              />
              <FieldsDiv
                label="Max DPD"
                value={selectedCustomer?.max_dpd}
                endorsementDate={null}
              />
              <FieldsDiv
                label="DPD Due Date"
                value={selectedCustomer?.max_dpd}
                endorsementDate={selectedCustomer?.endorsement_date || ""}
              />
            </div>
          </div>

          {!updateCustomerAccounts ? (
            <div className="flex flex-col bg-gray-100 border-gray-600 border-b-2 rounded-b-xl shadow-md px-5 pb-5 items-end justify-center gap-1 text-slate-800 uppercase font-medium">
              {selectedCustomer &&
                agentBucketData?.getDeptBucket &&
                agentBucketData.getDeptBucket.length > 0 &&
                agentBucketData.getDeptBucket.every(
                  (bucket) => bucket.name !== "BPIBANK 2025"
                ) && (
                  <div className="w-full flex flex-col lg:ml-3 gap-5 text-gray-800">
                    <div className="bg-gray-100 w-full gap-2 grid grid-cols-2 lg:flex flex-col mb-1 md:mb-0 md:flex-row rounded-md">
                      <div className="w-full">
                        <h1 className="font-medium truncate whitespace-nowrap 2xl:text-sm text-xs text-nowrap">
                          Restructuring Balance
                        </h1>
                        <div className="w-full p-1 pl-2 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details
                              ?.mo_balance ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>

                      <div className="w-full">
                        <h1 className="font-medium 2xl:text-sm text-xs text-nowrap">
                          Past Due Amount
                        </h1>
                        <div className="w-full p-1 pl-2 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details
                              ?.pastdue_amount ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>

                      <div className="w-full">
                        <h1 className="font-medium 2xl:text-sm text-xs">
                          MO_Amort
                        </h1>
                        <div className="w-full pl-2 p-1 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details?.mo_amort ??
                            0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>

                      <div className="w-full">
                        <h1 className="font-medium 2xl:text-sm text-xs">DF</h1>
                        <div className=" w-full pl-2 p-1 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details?.cf ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {selectedCustomer &&
                agentBucketData?.getDeptBucket?.some(
                  (bucket) => bucket.name === "BPIBANK 2025"
                ) && (
                  <div className="w-full flex flex-col lg:ml-3 gap-5 text-black">
                    <div className="bg-gray-100 w-full gap-2 grid grid-cols-5 grid-rows-3 mb-1 md:mb-0 md:flex-row rounded-md">
                      <div className="w-full">
                        <div
                          className="font-medium truncate 2xl:text-sm text-xs text-nowrap"
                          title="OUTSTANDING BALANCE"
                        >
                          Outstanding balance:
                        </div>
                        <div className="w-full p-1 pl-2 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details
                              ?.mo_balance ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>

                      <div className="w-full">
                        <h1
                          className="font-medium truncate 2xl:text-sm text-xs text-nowrap"
                          title="PARTIAL PAYMENT W/ SRVCE FEE"
                        >
                          PARTIAL PAYMENT W/ SRVCE FEE"
                        </h1>
                        <div className="w-full p-1 pl-2 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details
                              ?.partial_payment_w_service_fee ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>

                      <div className="w-full">
                        <h1 className="font-medium truncate 2xl:text-sm text-xs">
                          NEW TAD W/SF:
                        </h1>
                        <div className="w-full pl-2 p-1 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details
                              ?.new_tad_with_sf ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>
                      <div className="w-full">
                        <h1 className="font-medium truncate 2xl:text-sm text-xs">
                          NEW PAY OFF:
                        </h1>
                        <div className=" w-full pl-2 p-1 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details
                              ?.new_pay_off ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>

                      <div className="w-full">
                        <h1 className="font-medium truncate 2xl:text-sm text-xs">
                          Service FEE:
                        </h1>
                        <div className=" w-full pl-2 p-1 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details
                              ?.service_fee ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>
                      <div className="w-full">
                        <h1 className="font-medium truncate 2xl:text-sm text-xs">
                          Year:
                        </h1>
                        <div className=" w-full pl-2 p-1 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details?.year ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>

                      <div className="w-full flex flex-col col-span-2">
                        <h1 className="font-medium truncate 2xl:text-sm text-xs">
                          Brand:
                        </h1>
                        <div className=" w-full  pl-2 p-1 border border-black rounded-sm">
                          {selectedCustomer?.out_standing_details.brand || (
                            <div className=" flex items-center italic text-gray-400 lowercase h-full">
                              No Brand
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full col-span-2">
                        <h1 className="font-medium  truncate 2xl:text-sm text-xs">
                          Model:
                        </h1>
                        <div className=" w-full pl-2 p-1 border border-black rounded-sm">
                          {selectedCustomer.out_standing_details.model || (
                            <div className="flex items-center italic text-gray-400 lowercase h-full">
                              No Model
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-full col-span-2">
                        <h1 className="font-medium  truncate 2xl:text-sm text-xs">
                          Montly amortization:
                        </h1>
                        <div className=" w-full pl-2 p-1 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details?.mo_amort ??
                            0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>

                      <div className="w-full  col-span-2">
                        <h1 className="font-medium truncate 2xl:text-sm text-xs">
                          Last Payment Amount:
                        </h1>
                        <div className=" w-full pl-2 p-1 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details
                              ?.last_payment_amount ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>

                      <div className="w-full">
                        <h1 className="font-medium truncate 2xl:text-sm text-xs">
                          Last Payment Date:
                        </h1>
                        <div className=" w-full pl-2 p-1 border border-black rounded-sm">
                          {(
                            selectedCustomer?.out_standing_details
                              ?.last_payment_date ?? 0
                          ).toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {selectedCustomer &&
              agentBucketData?.getDeptBucket?.some(
                (bucket) => bucket.name === "BPIBANK 2025"
              ) ? (
                <div className="flex w-full gap-2 text-black justify-end items-end">
                  <div className="w-full">
                    <p className="font-medium truncate min-w-40 2xl:min-w-auto w-full text-xs 2xl:text-sm ">
                      {presetLabel === "Partial"
                        ? "Partial Payment w/ Service Fee:"
                        : presetLabel === "New Tad with SF"
                        ? "New TAD w/ SF:"
                        : presetLabel === "New Pay Off"
                        ? "New Pay Off:"
                        : ""}
                    </p>
                    <div className="w-full  border p-2  border-black rounded-sm bg-gray-100 2xl:text-sm lg:text-base">
                      {presetLabel === "Partial"
                        ? selectedCustomer?.out_standing_details?.partial_payment_w_service_fee?.toLocaleString(
                            "en-PH",
                            { style: "currency", currency: "PHP" }
                          )
                        : presetLabel === "New Tad with SF"
                        ? selectedCustomer?.out_standing_details?.new_tad_with_sf?.toLocaleString(
                            "en-PH",
                            { style: "currency", currency: "PHP" }
                          )
                        : presetLabel === "New Pay Off"
                        ? selectedCustomer?.out_standing_details?.new_pay_off?.toLocaleString(
                            "en-PH",
                            { style: "currency", currency: "PHP" }
                          )
                        : "No selected!"}
                    </div>
                  </div>
                  <div className="w-full">
                    <p className="font-medium text-xs 2xl:text-sm ">Balance:</p>
                    <div className="w-full border p-2  border-black rounded-sm bg-gray-100 2xl:text-sm lg:text-base">
                      {presetLabel === "Partial"
                        ? selectedCustomer?.out_standing_details?.partial_payment_w_service_fee?.toLocaleString(
                            "en-PH",
                            { style: "currency", currency: "PHP" }
                          )
                        : presetLabel === "New Tad with SF"
                        ? selectedCustomer?.out_standing_details?.new_tad_with_sf?.toLocaleString(
                            "en-PH",
                            { style: "currency", currency: "PHP" }
                          )
                        : presetLabel === "New Pay Off"
                        ? selectedCustomer?.out_standing_details?.new_pay_off?.toLocaleString(
                            "en-PH",
                            { style: "currency", currency: "PHP" }
                          )
                        : "No selected!"}
                    </div>
                  </div>
                  <div className="w-full">
                    <p className="font-medium text-xs 2xl:text-sm">
                      Total Paid
                    </p>
                    <div className="w-full border p-2 border-black rounded-sm bg-gray-100 2xl:text-sm lg:text-base">
                      {selectedCustomer?.paid_amount?.toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </div>
                  </div>
                  {selectedCustomer &&
                    userLogged?.type !== "AGENT" &&
                    !updateCustomerAccounts &&
                    Math.ceil(selectedCustomer?.balance) > 0 &&
                    selectedCustomer?.account_bucket.can_update_ca && (
                      <div className="flex justify-end h-full items-end">
                        <button
                          className=" hover:bg-orange-600 border-2 border-orange-800 bg-orange-500 transition-all shadow-md hover:shadow-none font-black uppercase rounded-md py-2 flex text-sm cursor-pointer px-5 text-white"
                          onClick={() =>
                            setUpdateCustomerAccounts((prev) => !prev)
                          }
                        >
                          Update
                        </button>
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex w-full gap-2 justify-end items-end">
                  <div className="w-full">
                    <p className="font-medium whitespace-nowrap min-w-40 2xl:min-w-auto w-full text-xs 2xl:text-sm ">
                      {selectedCustomer?.out_standing_details &&
                      selectedCustomer.out_standing_details.mo_balance === 0 &&
                      selectedCustomer.out_standing_details.cf !== undefined &&
                      selectedCustomer.out_standing_details.mo_amort !==
                        undefined
                        ? "Outstanding Balance"
                        : "OSB w/ CF"}
                    </p>
                    <div className="w-full  border p-2  border-black rounded-sm bg-gray-100 2xl:text-sm lg:text-base">
                      {selectedCustomer?.out_standing_details?.total_os?.toLocaleString(
                        "en-PH",
                        { style: "currency", currency: "PHP" }
                      )}
                    </div>
                  </div>
                  <div className="w-full">
                    <p className="font-medium text-xs 2xl:text-sm ">Balance</p>
                    <div className="w-full border p-2  border-black rounded-sm bg-gray-100 2xl:text-sm lg:text-base">
                      {selectedCustomer?.balance?.toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </div>
                  </div>
                  <div className="w-full">
                    <p className="font-medium text-xs 2xl:text-sm">
                      Total Paid
                    </p>
                    <div className="w-full border p-2 border-black rounded-sm bg-gray-100 2xl:text-sm lg:text-base">
                      {selectedCustomer?.paid_amount?.toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </div>
                  </div>
                  {selectedCustomer &&
                    userLogged?.type !== "AGENT" &&
                    !updateCustomerAccounts &&
                    Math.ceil(selectedCustomer?.balance) > 0 &&
                    selectedCustomer?.account_bucket.can_update_ca && (
                      <div className="flex justify-end h-full items-end">
                        <button
                          className=" hover:bg-orange-600 border-2 border-orange-800 bg-orange-500 transition-all shadow-md hover:shadow-none font-black uppercase rounded-md py-2 flex text-sm cursor-pointer px-5 text-white"
                          onClick={() =>
                            setUpdateCustomerAccounts((prev) => !prev)
                          }
                        >
                          Update
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <UpdateCustomerAccount
                cancel={() => setUpdateCustomerAccounts((prev) => !prev)}
              />
            </div>
          )}
        </motion.div>
        {selectedCustomer &&
          data &&
          data?.customerOtherAccounts?.length > 0 &&
          (() => {
            const sumofOtherOB =
              data?.customerOtherAccounts
                ?.map((x) => x.out_standing_details?.total_os)
                .reduce((t, v) => t + v) +
              selectedCustomer?.out_standing_details?.total_os;

            const sumofOtherPrincipal =
              data?.customerOtherAccounts
                ?.map((x) => x.out_standing_details?.principal_os)
                .reduce((t, v) => t + v) +
              selectedCustomer?.out_standing_details?.principal_os;

            return (
              <motion.div
                className=" w-full flex flex-col mt-2 lg:mt-0 lg:ml-3 justify-center gap-5 text-slate-800"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-gray-100 w-full shadow-md px-3 py-4 border-2 gap-1 flex flex-col border-gray-600 rounded-md">
                  <div>
                    <h1 className="font-medium 2xl:text-lg lg:text-base">
                      Customer Total OB
                    </h1>
                    <div className="min-w-45 p-1 pl-2 border border-slate-500 rounded-md">
                      {sumofOtherOB?.toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </div>
                  </div>
                  <div>
                    <h1 className="font-medium 2xl:text-lg lg:text-base">
                      Customer Total Principal
                    </h1>
                    <div className="min-w-45 p-1 pl-2 border border-slate-500 rounded-md">
                      {sumofOtherPrincipal?.toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}
      </div>
    </div>
  );
});

export default AccountInfo;
