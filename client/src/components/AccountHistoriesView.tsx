import { IoMdCloseCircleOutline } from "react-icons/io";
import { CurrentDispo } from "../middleware/types";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

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
      <h1 className="text-base font-medium text-gray-700">{label} :</h1>
      <div
        className={`${
          newValue ? "p-2" : "p-5 bg-slate-100"
        } border rounded-md border-slate-500 text-slate-900 font-light`}
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
    <>
      {showMore && (
        <div className="absolute top-0 left-0 bg-black/20 backdrop-blur-xs w-full h-full z-50 flex justify-center p-5">
          <IoMdCloseCircleOutline
            className="text-5xl  absolute top-4 right-5 hover:scale-110 cursor-pointer hover:text-black text-white hidden lg:block"
            onClick={() => {
              setShowMore(false);
              setSelectedHistory(null);
            }}
          />
          <div className="min-h-96 border lg:w-1/2 w-full bg-white rounded-lg border-slate-400 p-10 flex flex-col relative">
            <IoMdCloseCircleOutline
              className="text-5xl  absolute top-4 right-5 hover:scale-110 cursor-pointer hover:text-black text-black lg:hidden block"
              onClick={() => {
                setShowMore(false);
                setSelectedHistory(null);
              }}
            />
            <h1 className="text-3xl font-medium text-gray-600">
              {selectedHistory?.account_callfile.name}
            </h1>
            <h1 className="text-lg text-gray-600 font-medium">
              {selectedHistory?.account_bucket.name}
            </h1>
            <div className="h-full flex flex-col">
              <div className="flex gap-10 mt-5">
                <div className="w-full flex gap-2 flex-col">
                  <FieldsComponents
                    label="Case ID"
                    value={selectedHistory?.case_id}
                  />
                  <FieldsComponents
                    label="Endorsement Date"
                    value={selectedHistory?.endorsement_date}
                  />
                  <FieldsComponents label="DPD" value={selectedHistory?.dpd} />
                </div>
                <div className="w-full flex gap-2 flex-col">
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
              </div>
              <div className="h-full mt-5 flex gap-2 flex-col">
                <h1 className="text-2xl font-medium text-slate-600">
                  Existing Disposition
                </h1>

                <fieldset className="flex w-full gap-10 border p-2 rounded-md border-slate-500">
                  <legend className="px-2 text-lg font-medium text-slate-700 ">
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
                <div className="h-full flex gap-10">
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
        </div>
      )}

      <div className="w-full h-full z-40 gap-5 absolute px-10 top-0 left-0 bg-black/50 backdrop-blur-[2px] p-10">
        <div className="w-full h-full border rounded-md border-slate-500 bg-white p-5 flex flex-col">
          <div className="flex justify-between items-start">
            <h1 className="2xl:text-5xl font-medium text-gray-600 pb-5">
              Past Callfile History - {selectedCustomer?.customer_info.fullName}
            </h1>
            <IoMdCloseCircleOutline
              className="text-5xl m-3 absolute top-10 right-10 hover:scale-110 cursor-pointer hover:text-gray-400"
              onClick={close}
            />
          </div>
          <div className="h-full overflow-y-auto">
            <table className="w-full table-auto">
              <thead className="sticky top-0">
                <tr className=" text-gray-600 text-lg text-left select-none bg-blue-100">
                  <th className="pl-5">Callfile</th>
                  <th className="pl-5">Case ID / PN / Account ID</th>
                  <th className="pl-5 py-2 ">Principal</th>
                  <th className="pl-5 py-2 ">OB</th>
                  <th className="pl-5 py-2 ">Balance</th>
                  <th className="pl-5 py-2 ">Status</th>
                  <th className="pl-5 py-2 ">Concat Method</th>
                  <th className="pl-5 py-2 ">Communication App</th>
                  <th className="pl-5 py-2 ">User</th>
                  <th className="pl-5 py-2 ">Action</th>
                </tr>
              </thead>
              <tbody>
                {histories?.map((oa) => {
                  const daysExisting = oa.max_dpd - oa.dpd;
                  const date = new Date();
                  const newDate = new Date(date);
                  newDate.setDate(
                    Number(newDate.getDate()) + Number(daysExisting)
                  );

                  return (
                    <tr
                      key={oa._id}
                      className="text-gray-600 text-left select-none even:bg-gray-50  text-sm"
                    >
                      <td className="pl-5">{oa.account_callfile.name}</td>
                      <td className="pl-5">{oa.case_id}</td>
                      <td className="pl-5">
                        {oa.out_standing_details.principal_os.toLocaleString(
                          "en-PH",
                          { style: "currency", currency: "PHP" }
                        )}
                      </td>
                      <td className="pl-5">
                        {oa.out_standing_details.total_os.toLocaleString(
                          "en-PH",
                          { style: "currency", currency: "PHP" }
                        )}
                      </td>
                      <td className="pl-5">
                        {oa.balance.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        })}
                      </td>
                      <td className="pl-5 py-1.5">{oa.dispotype.name}</td>
                      <td className="pl-5 py-1.5">{oa.cd.contact_method}</td>
                      {oa.cd.contact_method === "calls" && (
                        <td className="pl-5 py-1.5">{oa.cd.dialer}</td>
                      )}
                      {oa.cd.contact_method === "sms" && (
                        <td className="pl-5 py-1.5">{oa.cd.sms}</td>
                      )}
                      {oa.cd.contact_method === "email" ||
                        (oa.cd.contact_method === "field" && (
                          <td className="pl-5 py-1.5">-</td>
                        ))}
                      {oa.cd.contact_method === "skip" && (
                        <td className="pl-5 py-1.5">{oa.cd.chatApp}</td>
                      )}
                      <td className="capitalize">{oa.user.name}</td>
                      <td className="py-1.5">
                        <button
                          className="px-7 py-2 text-sm lg:text-base font-medium bg-orange-500 text-white rounded-md hover:bg-orange-700 cursor-pointer"
                          onClick={() => {
                            setShowMore(true);
                            setSelectedHistory(oa);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountHistoriesView;
