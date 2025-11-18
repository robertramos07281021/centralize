import { CurrentDispo } from "../middleware/types";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { motion, AnimatePresence } from "framer-motion";

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

type ComponentProps = {
  close: () => void;
  histories: AccountHistory[];
};

const FieldsComponents = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => {
  let newValue = null;
  if (typeof value === "number") {
    newValue = value.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  } else {
    newValue = value;
  }
  return (
    <div>
      <h1 className="text-base font-black uppercase text-black">{label} :</h1>
      <div
        className={`${
          newValue ? "p-2" : "p-5 "
        } border rounded-md border-black bg-gray-100 text-black font-light`}
      >
        {newValue}
      </div>
    </div>
  );
};

const AccountHistoriesView: React.FC<ComponentProps> = ({
  histories,
  close,
}) => {
  const [showMore, setShowMore] = useState<boolean>(false);
  const [selectedHistory, setSelectedHistory] = useState<AccountHistory | null>(
    null
  );
  const { selectedCustomer } = useSelector((state: RootState) => state.auth);

  const date = (date: string) => {
    const createdDate = new Date(date).toLocaleDateString();
    const time = new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${createdDate} - ${time}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showMore) {
        setShowMore(false);
      } else if (e.key === "Escape" && !showMore) {
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setShowMore, close, showMore]);

  return (
    <div className="w-full h-full">
      <AnimatePresence>
        {showMore && (
          <motion.div className="absolute top-0 z-60  left-0 bg-black/20 backdrop-blur-xs w-full h-full  flex justify-center p-5"
            initial={{ opacity: 0}}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} 
          >
            <div className=" border bg-white rounded-lg border-black p-10 flex flex-col relative">
              <div
                className="p-1 bg-red-500 absolute top-5 right-5 z- hover:bg-red-600 transition-all shadow-md cursor-pointer rounded-full border-2 border-red-800 text-white  "
                onClick={() => {
                  setShowMore(false);
                  setSelectedHistory(null);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-black">
                {selectedHistory?.account_callfile.name}
              </h1>
              <h1 className="text-md text-black font-black">
                {selectedHistory?.account_bucket.name}
              </h1>
              <div className=" flex flex-col">
                <div className="grid grid-cols-3  gap-2 mt-5">
                  <FieldsComponents
                    label="Case ID"
                    value={selectedHistory?.case_id}
                  />
                  <FieldsComponents
                    label="Endorsement Date"
                    value={selectedHistory?.endorsement_date}
                  />
                  <FieldsComponents label="DPD" value={selectedHistory?.dpd} />
                  <FieldsComponents
                    label="Balance"
                    value={selectedHistory?.balance}
                  />
                  <FieldsComponents
                    label="Principal"
                    value={selectedHistory?.out_standing_details.principal_os}
                  />
                  <FieldsComponents
                    label="Total OB"
                    value={selectedHistory?.out_standing_details.total_os}
                  />
                </div>
                <div className=" mt-5 flex gap-2 flex-col">
                  <h1 className="text-md uppercase font-black text-black">
                    Existing Disposition
                  </h1>

                  <fieldset className="flex w-full gap-2 border px-4 py-2 rounded-md border-black">
                    <legend className="px-2 uppercase text-lg font-black text-black ">
                      Agent Info
                    </legend>
                    <div className="w-full">
                      <FieldsComponents
                        label="Name"
                        value={selectedHistory?.user.name.toUpperCase()}
                      />
                    </div>
                    <div className="w-full">
                      <FieldsComponents
                        label="SIP ID"
                        value={selectedHistory?.user.user_id}
                      />
                    </div>
                  </fieldset>
                  <div className=" flex gap-2">
                    <div className="w-full flex flex-col gap-2">
                      <FieldsComponents
                        label="Time Stamp"
                        value={date(selectedHistory?.cd?.createdAt || "")}
                      />
                      <FieldsComponents
                        label="Amount"
                        value={selectedHistory?.cd.amount}
                      />
                      <FieldsComponents
                        label="Contact Method"
                        value={selectedHistory?.cd.contact_method.toUpperCase()}
                      />
                      <FieldsComponents
                        label="Comment"
                        value={selectedHistory?.cd.comment}
                      />
                    </div>
                    <div className="w-full flex gap-2 flex-col">
                      <FieldsComponents
                        label="Disposition: "
                        value={selectedHistory?.dispotype.name}
                      />
                      <FieldsComponents
                        label="Payment"
                        value={selectedHistory?.cd?.payment?.toString() || ""}
                      />
                      {selectedHistory?.cd.chatApp && (
                        <FieldsComponents
                          label="Chat App"
                          value={selectedHistory?.cd?.chatApp.toUpperCase()}
                        />
                      )}
                      {selectedHistory?.cd.sms && (
                        <FieldsComponents
                          label="SMS"
                          value={selectedHistory?.cd?.sms.toUpperCase()}
                        />
                      )}
                      {selectedHistory?.cd.dialer && (
                        <FieldsComponents
                          label="Dialer"
                          value={selectedHistory?.cd?.dialer.toUpperCase()}
                        />
                      )}
                      <FieldsComponents
                        label="RFD"
                        value={selectedHistory?.cd?.RFD?.toString() || ""}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full h-full z-50 gap-5 absolute top-0 left-0 bg-black/50 backdrop-blur-[2px] p-5">
        <motion.div
          className="w-full h-full border rounded-md border-slate-500 bg-white p-5 flex flex-col"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex justify-between items-start">
            <h1 className="text-[0.7rem] md:text-base 2xl:text-xl font-black uppercase text-black pb-5">
              Past Callfile History - {selectedCustomer?.customer_info.fullName}
            </h1>

            <div
              className="p-1 bg-red-500 hover:bg-red-600 transition-all shadow-md cursor-pointer rounded-full border-2 border-red-800 text-white  "
              onClick={() => close()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </div>
            {/* <IoMdCloseCircleOutline
              className="text-3xl m-3 absolute top-10 right-10 hover:scale-110 cursor-pointer hover:text-gray-400"
              onClick={close}
            /> */}
          </div>
          <div className="h-full overflow-y-auto">
            <div className="w-full table-auto">
              <div className=" text-black py-2 font-black uppercase items-center gap-2 px-2 border grid grid-cols-10 rounded-t-md text-sm text-left select-none bg-gray-300">
                <div className="">Callfile name</div>
                <div className="truncate">Case ID / PN / Account ID</div>
                <div className=" ">Principal</div>
                <div className=" ">OB</div>
                <div className=" ">Balance</div>
                <div className="">Status</div>
                <div className="truncate">Concat Method</div>
                <div className="truncate">Communication App</div>
                <div className=" ">User</div>
                <div className="">Action</div>
              </div>
              <div>
                {(!histories?.length || histories?.length === 0) && (
                  <div className="py-3 bg-gray-200 italic border-black text-gray-400 text-center border-x border-b rounded-b-md">
                    No callfile found
                  </div>
                )}
                {histories?.map((oa) => {
                  const daysExisting = oa.max_dpd - oa.dpd;
                  const date = new Date();
                  const newDate = new Date(date);
                  newDate.setDate(
                    Number(newDate.getDate()) + Number(daysExisting)
                  );
                  return (
                    <div
                      key={oa._id}
                      className="grid grid-cols-10 gap-2 px-2 py-1 hover:bg-gray-300 transition-all text-black items-center text-left select-none odd:bg-gray-200 even:bg-gray-100 border-x border-b border-black last:rounded-b-md last:shadow-md text-sm"
                    >
                      <div className="">{oa.account_callfile?.name || "-"}</div>

                      <div className="">{oa.case_id || "-"}</div>

                      <div className="">
                        {oa.out_standing_details?.principal_os != null
                          ? oa.out_standing_details.principal_os.toLocaleString(
                              "en-PH",
                              {
                                style: "currency",
                                currency: "PHP",
                              }
                            )
                          : "-"}
                      </div>

                      <div className="">
                        {oa.out_standing_details?.total_os != null
                          ? oa.out_standing_details.total_os.toLocaleString(
                              "en-PH",
                              {
                                style: "currency",
                                currency: "PHP",
                              }
                            )
                          : "-"}
                      </div>

                      <div className="">
                        {oa.balance != null ? (
                          oa.balance.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })
                        ) : (
                          <div className="text-gray-400 italic text-xs">
                            No balance
                          </div>
                        )}
                      </div>

                      <div className="">{oa.dispotype?.name || "-"}</div>

                      <div className="">{oa.cd?.contact_method || "-"}</div>

                      <div className="">
                        {oa.cd?.contact_method === "calls" &&
                          (oa.cd?.dialer || "-")}
                        {oa.cd?.contact_method === "sms" && (oa.cd?.sms || "-")}
                        {(oa.cd?.contact_method === "email" ||
                          oa.cd?.contact_method === "field") &&
                          "-"}
                        {oa.cd?.contact_method === "skip" &&
                          (oa.cd?.chatApp || "-")}

                        {oa.cd?.contact_method && (
                          <div className="text-gray-400 italic text-xs">
                            No communication app
                          </div>
                        )}
                      </div>

                      <div className="capitalize">{oa.user?.name || "-"}</div>

                      <div className="">
                        <button
                          className="px-5 py-1 text-sm border-2 border-orange-800 lg:text-base font-black uppercase bg-orange-500 text-white rounded-md hover:bg-orange-600 cursor-pointer"
                          onClick={() => {
                            setShowMore(true);
                            setSelectedHistory(oa);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountHistoriesView;
