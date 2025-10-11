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
import { BsExclamationSquareFill } from "react-icons/bs";
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
        late_charge_waive_fee_os
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
    <div className="flex flex-col items-center 2xl:flex-row w-full ">
      <p className="text-gray-800 font-bold text-start w-full  2xl:text-sm text-xs 2xl:w-5/10 leading-4 select-none">
        {label} :
      </p>
      <div
        className={`${
          newValue || null ? "p-2" : "p-4"
        } 2xl:ml-2 text-xs 2xl:text-sm border rounded-lg border-slate-500 bg-gray-100 text-gray-600 w-full`}
      >
        {newValue || ""}
      </div>
    </div>
  );
};
const colorObject: { [key: string]: string } = {
  blue: "bg-blue-400 hover:bg-blue-600",
  green: "bg-green-400 hover:bg-green-600",
  yellow: "bg-yellow-400 hover:bg-yellow-600",
  cyan: "bg-cyan-400 hover:bg-cyan-600",
};

const Buttons = ({
  label,
  onClick,
  length,
  color,
}: {
  label: string;
  onClick: () => void;
  length: number;
  color: keyof typeof colorObject;
}) => {
  return (
    <button
      className={` px-2 py-1.5 rounded-md relative bg-blue-400 ${colorObject[color]} text-slate-800 font-medium cursor-pointer  hover:text-white`}
      onClick={onClick}
    >
      <span>{label}</span>
      <div
        className={`absolute -top-5.5 -right-4 rounded min-w-5 min-h-5 text-xs px-2 ${
          length > 0 && !isNaN(length) ? "bg-red-500" : "bg-green-500"
        } text-white flex items-center justify-center `}
      >
        {length}
      </div>
    </button>
  );
};

export type ChildHandle = {
  showButtonToFalse: () => void;
  divElement: HTMLDivElement | null;
};

const AccountInfo = forwardRef<ChildHandle, {}>((_, ref) => {
  const location = useLocation();
  const isTLCIP = ["/tl-cip", "/agent-cip"].includes(location.pathname);
  const { selectedCustomer, userLogged } = useSelector(
    (state: RootState) => state.auth
  );
  const [showAccounts, setShowAccounts] = useState<boolean>(false);
  const { data } = useQuery<{ customerOtherAccounts: Search[] }>(
    OTHER_ACCOUNTS,
    {
      variables: { caId: selectedCustomer?._id },
      skip: !selectedCustomer && !isTLCIP,
    }
  );
  const [showAccountHistory, setShowAccountHistory] = useState<boolean>(false);
  const { data: accountHistory, refetch } = useQuery<{
    findAccountHistories: AccountHistory[];
  }>(ACCOUNT_HISTORIES, {
    variables: { id: selectedCustomer?._id },
    skip: !selectedCustomer && !isTLCIP,
  });
  const [showButton, setShowButton] = useState<boolean>(false);
  const divRef = useRef<HTMLDivElement | null>(null);
  const [showDispoHistory, setShowDispoHistory] = useState<boolean>(false);
  const [updateCustomerAccounts, setUpdateCustomerAccounts] =
    useState<boolean>(false);
  const UpdateAccountHistory = selectedCustomer?.account_update_history;
  const [showUpdateOnCA, setShowUpdateOnCA] = useState<boolean>(false);

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

  return (
    selectedCustomer && (
      <>
        {showAccounts && (
          <OtherAccountsViews
            others={data?.customerOtherAccounts || []}
            close={() => setShowAccounts(false)}
          />
        )}
        {showAccountHistory && (
          <AccountHistoriesView
            histories={accountHistory?.findAccountHistories || []}
            close={() => setShowAccountHistory(false)}
          />
        )}
        {showDispoHistory && (
          <DispositionRecords close={() => setShowDispoHistory(false)} />
        )}
        {showUpdateOnCA && (
          <UpdatedAccountHistory close={() => setShowUpdateOnCA(false)} />
        )}

        <div
          className={`fixed ${
            userLogged?.type === "AGENT" ? "top-40" : "top-30"
          } gap-2 left-5 z-30`}
        >
          <motion.div
            className=""
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
          >
            {selectedCustomer && (
              <div
                className={`text-4xl text-white shadow-md hover:bg-blue-600 transition-all p-1 bg-blue-500 border-2 rounded-md border-blue-700 cursor-pointer`}
                onClick={() => setShowButton((prev) => !prev)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
            )}
            {!showButton && (
              <div
                className={`absolute -top-2 -right-2 min-w-5 min-h-5 text-xs px-2 flex items-center justify-center text-white rounded-full ${
                  sumOf > 0 && !isNaN(sumOf) ? "bg-red-500" : "bg-green-500"
                }`}
              >
                {isNaN(sumOf) ? 0 : sumOf}
              </div>
            )}
            <AnimatePresence>
              {showButton && (
                <motion.div
                  className="border whitespace-nowrap absolute mt-1 flex flex-col gap-8 p-8 rounded-md border-slate-400 bg-white shadow  "
                  ref={divRef}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ y: -20, opacity: 0 }}
                >
                  {/* <Buttons
                  label="Account History"
                  onClick={() => setShowDispoHistory(true)}
                  length={
                    selectedCustomer &&
                    selectedCustomer?.dispo_history?.length > 0
                      ? selectedCustomer?.dispo_history?.length
                      : 0
                  }
                  color="blue"
                /> */}
                  <div
                    className="relative cursor-pointer"
                    onClick={() => setShowDispoHistory(true)}
                  >
                    <div className="bg-blue-600 border-2 border-blue-900 hover:bg-blue-700 text-center py-3 text-white cursor-pointer shadow-md rounded-md uppercase font-black text-xs">
                      Account History
                    </div>
                    <div
                      className={`${
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
                  {/* <Buttons
                  label="Other Accounts"
                  onClick={() => setShowAccounts(true)}
                  length={
                    data && data?.customerOtherAccounts?.length > 0
                      ? data?.customerOtherAccounts?.length
                      : 0
                  }
                  color="green"
                /> */}

                  <div
                    className="relative cursor-pointer"
                    onClick={() => setShowAccounts(true)}
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
                  {/* <Buttons
                  label="Past Callfile History"
                  onClick={() => setShowAccountHistory(true)}
                  length={
                    accountHistory &&
                    accountHistory.findAccountHistories?.length > 0
                      ? accountHistory?.findAccountHistories?.length
                      : 0
                  }
                  color="yellow"
                /> */}

                  <div
                    className="relative cursor-pointer"
                    onClick={() => setShowAccountHistory(true)}
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
                      accountHistory.findAccountHistories?.length > 0
                        ? accountHistory?.findAccountHistories?.length
                        : 0}
                    </div>
                  </div>
                  {selectedCustomer.account_bucket.can_update_ca && (
                    <div
                      className="relative cursor-pointer"
                      onClick={() => setShowAccountHistory(true)}
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
                    // <Buttons
                    //   label="Update Account History"
                    //   onClick={() => setShowUpdateOnCA(true)}
                    //   length={
                    //     UpdateAccountHistory && UpdateAccountHistory?.length > 0
                    //       ? UpdateAccountHistory?.length
                    //       : 0
                    //   }
                    //   color="cyan"
                    // />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        <motion.div
          className="w-full"
          initial={{ x: 50, opacity: 0 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {userLogged?.type !== "AGENT" &&
            !updateCustomerAccounts &&
            Math.ceil(selectedCustomer.balance) > 0 &&
            selectedCustomer.account_bucket.can_update_ca && (
              <button
                className="absolute right-5 py-2.5 top-0 hover:bg-orange-600 bg-orange-400 font-medium rounded-lg text-sm cursor-pointer px-5 text-white"
                onClick={() => setUpdateCustomerAccounts((prev) => !prev)}
              >
                Update
              </button>
            )}
          <h1 className="text-center font-black uppercase text-slate-600 text-2xl my-2">
            Account Information
          </h1>

          {selectedCustomer.batch_no && (
            <div className=" flex items-center justify-center text-gray-600">
              <div className="w-1/4 flex flex-col text-center">
                <div className="font-bold text-gray-800 text-sm">Batch No.</div>
                <div className="border rounded-md border-slate-500 text-sm py-1.5 bg-gray-100">
                  {selectedCustomer.batch_no}
                </div>
              </div>
            </div>
          )}

          <div className="flex xl:gap-10 gap-2 bg-gray-100 border-t border-x border-slate-400 rounded-t-xl px-5 pt-5 justify-center">
            <div className="flex flex-col uppercase gap-2  w-full">
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
            <div className="flex flex-col gap-2 uppercase  w-full">
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
                endorsementDate={selectedCustomer?.endorsement_date}
              />
            </div>
          </div>
          {!updateCustomerAccounts ? (
            <div className="flex flex-row pt-2 bg-gray-100 border-x border-gray-400 border-b rounded-b-xl shadow-md px-5 pb-5 items-center justify-center xl:gap-5 gap-2 text-slate-800 uppercase font-medium">
              <div>
                <p className="font-medium 2xl:text-lg lg:text-sm ">
                  Outstanding Balance
                </p>
                <div className="min-w-45 border p-2 rounded-lg border-slate-500 bg-gray-100 2xl:text-lg lg:text-base">
                  {selectedCustomer?.out_standing_details?.total_os?.toLocaleString(
                    "en-PH",
                    { style: "currency", currency: "PHP" }
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium 2xl:text-base lg:text-md ">Balance</p>
                <div className="min-w-45 border p-2 rounded-lg border-slate-500 bg-gray-100 2xl:text-lg lg:text-base">
                  {selectedCustomer?.balance?.toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </div>
              </div>
              <div>
                <p className="font-medium 2xl:text-lg lg:text-base ">
                  Total Paid
                </p>
                <div className="min-w-45 border p-2 rounded-lg border-slate-500 bg-gray-100 2xl:text-lg lg:text-base">
                  {selectedCustomer?.paid_amount?.toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div>
            <UpdateCustomerAccount
              cancel={() => setUpdateCustomerAccounts((prev) => !prev)}
            />asaasasasassaasasassa
            </div>
          )}
          {data &&
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
                <div className="mt-5 flex justify-center gap-5 text-slate-500">
                  <div>
                    <h1 className="font-medium 2xl:text-lg lg:text-base">
                      Customer Total OB
                    </h1>
                    <div className="min-w-45 p-2 border border-slate-500 rounded-md">
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
                    <div className="min-w-45 p-2 border border-slate-500 rounded-md">
                      {sumofOtherPrincipal?.toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
        </motion.div>
      </>
    )
  );
});

export default AccountInfo;
