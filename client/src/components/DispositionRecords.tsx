import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useQuery, gql } from "@apollo/client";
import { useEffect, useMemo } from "react";
import { CurrentDispo } from "../middleware/types";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className=" z-80 gap-5 absolute top-0 p-5 h-full w-full left-0 bg-black/50 backdrop-blur-[2px] overflow-hidden">
        <div className="w-full h-full border rounded-md border-slate-500 bg-white p-5 flex flex-col">
          <div className="flex justify-between items-start">
            <h1 className="lg:text-lg 2xl:text-5xl font-medium text-gray-600 pb-5">
              Account History - {selectedCustomer?.case_id}
            </h1>
            <IoMdCloseCircleOutline
              className="lg:text-4xl 2xl:text-5xl m-3 absolute top-10 right-10 hover:scale-110 cursor-pointer hover:text-gray-400"
              onClick={close}
            />
          </div>
          <div className="h-full overflow-y-auto">
            <table className="w-full table-auto">
              <thead className="sticky top-0">
                <tr className=" text-gray-600 lg:text-sm 2xl:text-lg text-left select-none bg-blue-100">
                  <th className="pl-5">Status</th>
                  <th className="lg:pl-2 2xl:pl-5">User</th>
                  <th className="lg:pl-2 2xl:pl-5">Date</th>
                  <th className="lg:pl-2 2xl:pl-5 py-2 ">Disposition</th>
                  <th className="lg:pl-2 2xl:pl-5 py-2 text-nowrap">CM</th>
                  <th className="lg:pl-2 2xl:pl-5 py-2 ">Amount</th>
                  <th className="lg:pl-2 2xl:pl-5 py-2 text-nowrap">Ref No.</th>
                  <th className="lg:pl-2 2xl:pl-5 py-2 ">Payment</th>
                  <th className="lg:pl-2 2xl:pl-5 py-2 text-nowrap">
                    Payment Date
                  </th>
                  <th className="lg:pl-2 2xl:pl-5 py-2 text-nowrap">
                    Comm App
                  </th>
                  <th className="lg:pl-2 2xl:pl-5 py-2 ">Comments</th>
                  <th className="lg:pl-2 2xl:pl-5 py-2 ">RFD</th>
                  <th className="lg:pl-2 2xl:pl-5 py-2 ">Selectives</th>
                </tr>
              </thead>
              <tbody>
                {findExisting && (
                  <tr>
                    <td
                      className="py-1.5 px-5 text-blue-500 font-medium "
                      colSpan={9}
                    >
                      Exsiting Disposition
                    </td>
                  </tr>
                )}

                {findExisting && (
                  <tr className="text-gray-600 text-left select-none bg-slate-100 lg:text-xs 2xl:text-sm">
                    <td className="pl-5 capitalize text-nowrap">
                      Current{" "}
                      {checkIfExistingIsLatest && <span> - Latest</span>}
                    </td>
                    <td className="lg:pl-2 2xl:pl-5 capitalize text-nowrap truncate pr-1">
                      {agentObject[findExisting.user]}
                    </td>
                    <td className="lg:pl-2 2xl:pl-5 text-nowrap truncate">
                      {date(findExisting.createdAt)}
                    </td>
                    <td className="lg:pl-2 2xl:pl-5 text-nowrap truncate pr-1">
                      {dispotypeObject[findExisting.disposition]}
                    </td>
                    <td className="lg:pl-2 2xl:pl-5">
                      {findExisting.contact_method}
                    </td>
                    <td className="lg:pl-2 2xl:pl-5">
                      {findExisting.amount > 0
                        ? findExisting.amount.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })
                        : null}
                    </td>
                    <td className="lg:pl-2 2xl:pl-5 py-1.5 text-nowrap truncate">
                      {findExisting.ref_no}
                    </td>
                    <td className="lg:pl-2 2xl:pl-5 py-1.5">
                      {findExisting.payment}
                    </td>
                    <td className="lg:pl-2 2xl:pl-5 py-1.5">
                      {findExisting.payment_date}
                    </td>
                    {findExisting.selectivesDispo && <td></td>}
                    {findExisting.contact_method === "calls" &&
                      findExisting.dialer && (
                        <td className="lg:pl-2 2xl:pl-5 py-1.5">
                          {findExisting.dialer}
                        </td>
                      )}
                    {findExisting.contact_method === "sms" && (
                      <td className="lg:pl-2 2xl:pl-5 py-1.5">
                        {findExisting.sms}
                      </td>
                    )}
                    {findExisting.contact_method === "email" ||
                      (findExisting.contact_method === "field" && (
                        <td className="lg:pl-2 2xl:pl-5 py-1.5">-</td>
                      ))}
                    {findExisting.contact_method === "skip" && (
                      <td className="lg:pl-2 2xl:pl-5 py-1.5">
                        {findExisting.chatApp}
                      </td>
                    )}
                    <td
                      className="truncate lg:pl-2 2xl:pl-5 py-1.5 max-w-30"
                      title={
                        findExisting.comment
                          ? findExisting.comment.toString()
                          : ""
                      }
                    >
                      {findExisting.comment}
                    </td>
                    <td
                      className="truncate lg:pl-2 2xl:pl-5 py-1.5 max-w-30 pr-2"
                      title={
                        findExisting.RFD ? findExisting.RFD.toString() : ""
                      }
                    >
                      {findExisting.RFD}
                    </td>
                    <td className="lg:pl-2 2xl:pl-5 py-1.5 max-w-30 pr-2">
                      {findExisting.selectivesDispo ? "Yes" : "No"}
                    </td>
                  </tr>
                )}

                {notExisting.length > 0 && (
                  <tr>
                    <td
                      className="py-1.5 px-5 text-slate-600 font-medium "
                      colSpan={9}
                    >
                      History
                    </td>
                  </tr>
                )}
                {dispo_historySorted?.map((ne, index) => {
                  return (
                    <tr
                      key={ne._id}
                      className="text-gray-600 text-left select-none even:bg-gray-50  lg:text-xs 2xl:text-sm"
                    >
                      <td className="pl-5">
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
                      </td>
                      <td className="lg:pl-2 2xl:pl-5 capitalize">
                        {agentObject[ne.user]}
                      </td>
                      <td className="lg:pl-2 2xl:pl-5">{date(ne.createdAt)}</td>
                      <td className="lg:pl-2 2xl:pl-5 text-nowrap truncate pr-1">
                        {dispotypeObject[ne.disposition]}
                      </td>
                      <td className="lg:pl-2 2xl:pl-5">{ne.contact_method}</td>
                      <td className="lg:pl-2 2xl:pl-5">
                        {ne.amount > 0
                          ? ne.amount.toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })
                          : null}
                      </td>
                      <td className="lg:pl-2 2xl:pl-5 py-1.5 text-nowrap truncate">
                        {ne.ref_no}
                      </td>
                      <td className="lg:pl-2 2xl:pl-5 py-1.5">{ne.payment}</td>
                      <td className="lg:pl-2 2xl:pl-5 py-1.5">
                        {ne.payment_date}
                      </td>
                      {ne.contact_method === "calls" && (
                        <td className="lg:pl-2 2xl:pl-5 py-1.5">{ne.dialer}</td>
                      )}
                      {ne.contact_method === "sms" && (
                        <td className="lg:pl-2 2xl:pl-5 py-1.5">{ne.sms}</td>
                      )}
                      {ne.contact_method === "email" ||
                        (ne.contact_method === "field" && (
                          <td className="lg:pl-2 2xl:pl-5 py-1.5">-</td>
                        ))}
                      {ne.contact_method === "skip" && (
                        <td className="lg:pl-2 2xl:pl-5 py-1.5">
                          {ne.chatApp}
                        </td>
                      )}
                      <td
                        className="truncate lg:pl-2 2xl:pl-5 py-1.5 max-w-30 pr-2"
                        title={ne.comment ? ne.comment.toString() : ""}
                      >
                        {ne.comment}
                      </td>
                      <td
                        className="truncate lg:pl-2 2xl:pl-5 py-1.5 max-w-30 pr-2"
                        title={ne.RFD ? ne.RFD.toString() : ""}
                      >
                        {ne.RFD}
                      </td>
                      <td className="lg:pl-2 2xl:pl-5 py-1.5 max-w-30 pr-2">
                        {ne.selectivesDispo ? "Yes" : "No"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DispositionRecords;
