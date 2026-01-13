import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useQuery, gql } from "@apollo/client";
import { useEffect, useMemo } from "react";
import { CurrentDispo } from "../middleware/types";
import { AnimatePresence, motion } from "framer-motion";

type Agent = {
  _id: string;
  name: string;
};

const AGENTS = gql`
  query findAgents {
    findAgents {
      _id
      name
    }
  }
`;

type Dispotype = {
  id: string;
  name: string;
  code: string;
};

const DISPOTYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`;

type ComponentProps = {
  close: () => void;
};

const DispositionRecords: React.FC<ComponentProps> = ({ close }) => {
  const { selectedCustomer } = useSelector((state: RootState) => state.auth);

  const { data: agentData } = useQuery<{ findAgents: Agent[] }>(AGENTS, {
    notifyOnNetworkStatusChange: true,
  });

  const { data: dispotypesData } = useQuery<{
    getDispositionTypes: Dispotype[];
  }>(DISPOTYPES, { notifyOnNetworkStatusChange: true });

  const dispotypeObject = useMemo(() => {
    const data = dispotypesData?.getDispositionTypes || [];
    return Object.fromEntries(data.map((e) => [e.id, e.name]));
  }, [dispotypesData]);

  const agentObject = useMemo(() => {
    const data = agentData?.findAgents || [];
    return Object.fromEntries(data.map((e) => [e._id, e.name]));
  }, [agentData]);

  const history: CurrentDispo[] = selectedCustomer?.dispo_history || [];

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
  const findExisting = history.find((x) => x.existing === true) || null;
  const notExisting = history.filter((x) => x.existing === false) || null;
  const checkingOnly =
    history
      ?.slice()
      .sort(
        (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))
      ) || [];
  const dispo_historySorted =
    notExisting
      ?.slice()
      .sort(
        (a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt))
      ) || [];
  const checkIfExistingIsLatest = findExisting
    ? checkingOnly[0]._id === findExisting?._id
    : null;


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  return (
    <AnimatePresence>
      <div className=" z-100 absolute gap-5 top-0 p-5 h-full items-center justify-center flex w-full left-0 bg-black/50 backdrop-blur-[2px] overflow-hidden">
        <motion.div
          className="w-full h-full border rounded-md border-slate-500 bg-white p-5 flex flex-col"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <div className="flex justify-between items-start">
            <h1 className="text-[0.7rem] md:text-base 2xl:text-xl pb-5  font-black text-black uppercase">
              Account History - {selectedCustomer?.case_id}
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
              className="lg:text-4xl 2xl:text-5xl m-3 absolute top-10 right-10 hover:scale-110 cursor-pointer hover:text-gray-400"
              onClick={close}
            /> */}
          </div>
          <div className="h-full overflow-y-auto">
            <div className="w-full table-auto">
              <div className="sticky top-0">
                <div className=" text-black py-2 font-black uppercase items-center gap-2 px-2 border grid grid-cols-13 rounded-t-md text-sm text-left select-none bg-gray-300">
                  <div className="">Status</div>
                  <div className="">User</div>
                  <div className="">Date</div>
                  <div className=" ">Disposition</div>
                  <div className=" truncate">Contact Method</div>
                  <div className=" ">Amount</div>
                  <div className=" text-nowrap">Ref No.</div>
                  <div className=" ">Payment</div>
                  <div className="truncate" title="Payment Date">
                    Payment Date
                  </div>
                  <div className=" text-nowrap">Comm App</div>
                  <div className=" ">Comments</div>
                  <div className=" ">RFD</div>
                  <div className=" ">Selectives</div>
                </div>
              </div>
              <div>
                {findExisting && (
                  <div className="bg-gray-100 border-x">
                    <div className="pt-1.5 px-5 text-gray-800 font-medium ">
                      Exsiting Disposition
                    </div>
                  </div>
                )}

                {findExisting && (
                  <div className="text-gray-600 border-b py-1 border-x border-black shadow-md gap-2 items-center text-left select-none grid grid-cols-13 bg-gray-100 lg:text-xs 2xl:text-sm">
                    <div className="pl-5 capitalize ">
                      Current{" "}
                      {checkIfExistingIsLatest && <span> - Latest</span>}
                    </div>
                    <div className=" capitalize  pr-1">
                      {agentObject[findExisting.user]}
                    </div>
                    <div className=" ">{date(findExisting.createdAt)}</div>
                    <div className=" text-nowrap truncate pr-1">
                      {dispotypeObject[findExisting.disposition]}
                    </div>
                    <div className="">
                      {findExisting.contact_method ? (
                        findExisting.contact_method
                      ) : (
                        <div className="text-gray-400 italic">
                          No contact method
                        </div>
                      )}
                    </div>
                    <div className="">
                      {findExisting.amount > 0 ? (
                        findExisting.amount.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        })
                      ) : (
                        <div className="text-gray-400 italic">No amount</div>
                      )}
                    </div>
                    <div className=" py-1.5 text-nowrap truncate">
                      {findExisting.ref_no || (
                        <div className="text-gray-400 italic">No ref no.</div>
                      )}
                    </div>
                    <div className=" py-1.5">
                      {findExisting.payment || (
                        <div className="text-gray-400 italic">No payment</div>
                      )}
                    </div>
                    <div className=" py-1.5">
                      {findExisting.payment_date || (
                        <div className="text-gray-400 italic">
                          No payment date
                        </div>
                      )}
                    </div>
                    {findExisting.selectivesDispo && <div></div>}
                    {findExisting.contact_method === "calls" &&
                      findExisting.dialer && (
                        <div className=" py-1.5">{findExisting.dialer}</div>
                      )}
                    {findExisting.contact_method === "sms" && (
                      <div className=" py-1.5">{findExisting.sms}</div>
                    )}
                    {findExisting.contact_method === "email" ||
                      (findExisting.contact_method === "field" && (
                        <div className=" py-1.5">-</div>
                      ))}
                    {findExisting.contact_method === "skip" && (
                      <div className=" py-1.5">{findExisting.chatApp}</div>
                    )}
                    <div
                      className="truncate  py-1.5 max-w-30"
                      title={
                        findExisting.comment
                          ? findExisting.comment.toString()
                          : ""
                      }
                    >
                      {findExisting.comment || (
                        <div className="text-gray-400 italic">No comment</div>
                      )}
                    </div>
                    <div
                      className="truncate  py-1.5 max-w-30 pr-2"
                      title={
                        findExisting.RFD ? findExisting.RFD.toString() : ""
                      }
                    >
                      {findExisting.RFD || (
                        <div className="text-gray-400 italic">No rfd</div>
                      )}
                    </div>
                    <div className=" py-1.5 max-w-30 pr-2">
                      {findExisting.selectivesDispo ? "Yes" : "No"}
                    </div>
                  </div>
                )}

                {notExisting.length > 0 && (
                  <div className="">
                    <div className="py-1.5 bg-gray-100 px-5 text-gray-800 border-x border-b font-medium ">
                      History
                    </div>
                  </div>
                )}
                {!(dispo_historySorted &&
                  dispo_historySorted?.length === 0) && (
                  <div className="py-1.5 bg-gray-100 px-5 text-center italic text-gray-800 border-x border-b font-medium ">
                    No History
                  </div>
                )}
                {dispo_historySorted?.map((ne, index) => {
                  return (
                    <div
                      key={ne._id}
                      className="text-gray-600 last:rounded-b-md last:shadow-m items-center border-x border-b grid grid-cols-13 gap-2 text-left select-none even:bg-gray-50  lg:text-xs 2xl:text-sm"
                    >
                      <div className="pl-5">
                        {" "}
                        {index + 1 === 1
                          ? !checkIfExistingIsLatest
                            ? "Latest"
                            : "Previous"
                          : index + 1 === 2
                          ? !checkIfExistingIsLatest
                            ? "Previous"
                            : "Past"
                          : "Past"}
                      </div>
                      <div className=" capitalize">{agentObject[ne.user]}</div>
                      <div className="">{date(ne.createdAt)}</div>
                      <div className=" text-nowrap truncate pr-1">
                        {dispotypeObject[ne.disposition]}
                      </div>
                      <div className="">{ne.contact_method}</div>
                      <div className="">
                        {ne.amount > 0 ? (
                          ne.amount.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })
                        ) : (
                          <div className="text-gray-400 italic">No amount</div>
                        )}
                      </div>
                      <div className=" py-1.5 text-nowrap truncate">
                        {ne.ref_no || (
                          <div className="text-gray-400 italic">No ref no.</div>
                        )}
                      </div>
                      <div className=" py-1.5">
                        {ne.payment || (
                          <div className="text-gray-400 italic">No payment</div>
                        )}
                      </div>
                      <div className=" py-1.5">
                        {ne.payment_date || (
                          <div className="text-gray-400 italic">
                            No payment date
                          </div>
                        )}
                      </div>
                      {ne.contact_method === "calls" && (
                        <div className=" py-1.5">{ne.dialer}</div>
                      )}
                      {ne.contact_method === "sms" && (
                        <div className=" py-1.5">{ne.sms}</div>
                      )}
                      {ne.contact_method === "email" ||
                        (ne.contact_method === "field" && (
                          <div className=" py-1.5">-</div>
                        ))}
                      {ne.contact_method === "skip" && (
                        <div className=" py-1.5">{ne.chatApp}</div>
                      )}
                      <div
                        className="truncate  py-1.5 max-w-30 pr-2"
                        title={ne.comment ? ne.comment.toString() : ""}
                      >
                        {ne.comment || (
                          <div className="text-gray-400 italic">No comment</div>
                        )}
                      </div>
                      <div
                        className="truncate  py-1.5 max-w-30 pr-2"
                        title={ne.RFD ? ne.RFD.toString() : ""}
                      >
                        {ne.RFD || (
                          <div className="text-gray-400 italic">
                            No rfd
                          </div>
                        )}
                      </div>
                      <div className=" py-1.5 max-w-30 pr-2">
                        {ne.selectivesDispo ? "Yes" : "No"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DispositionRecords;
