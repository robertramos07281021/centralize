import { gql, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import Loading from "../Loading";
import CallDoughnut from "./CallDoughnut";
import CallReportTables from "./CallReportTables";
import RFDReportTables from "./RFDReportTables";
import ReportsTables from "./ReportsTables";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const GET_DISPOSITION_REPORTS = gql`
  query GetDispositionReports($reports: SearchDispoReports) {
    getDispositionReports(reports: $reports) {
      RFD {
        _id
        count
      }
      agent {
        _id
        name
        user_id
      }
      bucket
      callfile {
        _id
        totalAccounts
        totalPrincipal
        name
        totalOB
      }
      toolsDispoCount {
        call_method
        dispositions {
          name
          count
          amount
          code
        }
      }
    }
  }
`;

type Callfile = {
  _id: string;
  name: string;
  totalAccounts: number;
  totalPrincipal: number;
  totalOB: number;
};

type RFD = {
  _id: string;
  count: number;
};

type DispositionType = {
  name: string;
  code: string;
  count: string;
  amount: number;
};

type Agent = {
  _id: string;
  name: string;
  branch: string;
  department: string;
  user_id: string;
  buckets: string[];
};

type Tools = {
  dispositions: DispositionType[];
  call_method: string;
};
type Reports = {
  agent: Agent;
  bucket: string;
  toolsDispoCount: Tools[];
  callfile: Callfile;
  RFD: RFD[];
};

type Distance = {
  from: string;
  to: string;
};

export type Search = {
  searchAgent: string;
  searchBucket: string | null;
  selectedDisposition: string[];
  dateDistance: Distance;
  callfile: String;
};

type SearchFilter = {
  agent: string;
  disposition: string[];
  from: string;
  to: string;
  callfile: String;
};

type Props = {
  search: Search;
};

const ReportsView: React.FC<Props> = ({ search }) => {
  const location = useLocation();
  const [searchFilter, setSearchFilter] = useState<SearchFilter>();

  useEffect(() => {
    setSearchFilter({
      agent: search.searchAgent,
      disposition: search.selectedDisposition,
      from: search.dateDistance.from,
      to: search.dateDistance.to,
      callfile: search.callfile,
    });
  }, [search]);

  const isReporting = location.pathname !== "/tl-reports";

  const { data: reportsData, loading: reportLoading } = useQuery<{
    getDispositionReports: Reports;
  }>(GET_DISPOSITION_REPORTS, {
    variables: { reports: searchFilter },
    fetchPolicy: "network-only",
    skip: isReporting,
  });

  const callMethod =
    reportsData?.getDispositionReports?.toolsDispoCount?.find(
      (x) => x.call_method === "calls"
    )?.dispositions || [];
  const smsMethod =
    reportsData?.getDispositionReports?.toolsDispoCount?.find(
      (x) => x.call_method === "sms"
    )?.dispositions || [];
  const emailMethod =
    reportsData?.getDispositionReports?.toolsDispoCount?.find(
      (x) => x.call_method === "email"
    )?.dispositions || [];
  const skipMethod =
    reportsData?.getDispositionReports?.toolsDispoCount?.find(
      (x) => x.call_method === "skip"
    )?.dispositions || [];
  const totalAccounts =
    (reportsData &&
      reportsData?.getDispositionReports?.callfile?.totalAccounts) ||
    0;
  const callfile = reportsData?.getDispositionReports?.callfile || {
    _id: "",
    name: "",
    totalAccounts: 0,
    totalPrincipal: 0,
    totalOB: 0,
  };
  const RFD = reportsData?.getDispositionReports?.RFD || [];

  if (reportLoading) return <Loading />;

  return (
    <div
      className={` col-span-2 flex flex-col overflow-auto relative h-5/6 px-5`}
    >
      <div className="text-center border-b-2 border-gray-200 sticky bg-white top-0 uppercase font-black 2xl:text-lg lg:text-2xl  text-slate-800 flex item-center justify-center gap-5 pb-5 ">
        <>
          {reportsData?.getDispositionReports?.bucket && (
            <span>Bucket: {reportsData.getDispositionReports.bucket}</span>
          )}
          {reportsData?.getDispositionReports?.agent?.name && (
            <h1 className="flex gap-2">
              Agent Name: {reportsData.getDispositionReports.agent.name}
            </h1>
          )}

          {search.dateDistance.from &&
            search.dateDistance.to &&
            search.dateDistance.from !== search.dateDistance.to && (
              <div>
                From: {search.dateDistance.from} to {search.dateDistance.to}
              </div>
            )}

          {((!search.dateDistance.from && search.dateDistance.to) ||
            (search.dateDistance.from && !search.dateDistance.to) ||
            search.dateDistance.from === search.dateDistance.to) &&
            (search.dateDistance.from || search.dateDistance.to) && (
              <div>
                Date: {search.dateDistance.from || search.dateDistance.to}
              </div>
            )}
        </>
      </div>
      <motion.div
        className="flex flex-col gap-5 "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 1 }}
      >
        <CallDoughnut totalAccounts={totalAccounts} dispoData={callMethod} />
        <div className="flex flex-col gap-5 py-5">
          {callMethod.length > 0 && (
            <CallReportTables
              totalAccounts={totalAccounts}
              reportsData={callMethod}
              callfile={callfile}
            />
          )}
          {smsMethod.length > 0 && (
            <ReportsTables
              totalAccounts={totalAccounts}
              dispo={smsMethod}
              firstTitle="SMS Status"
              secondTitle="SMS Response"
              color="yellow"
            />
          )}
          {emailMethod.length > 0 && (
            <ReportsTables
              totalAccounts={totalAccounts}
              dispo={emailMethod}
              firstTitle="Email Status"
              secondTitle="Email Response"
              color="indigo"
            />
          )}
          {skipMethod.length > 0 && (
            <ReportsTables
              totalAccounts={totalAccounts}
              dispo={skipMethod}
              firstTitle="Skip Status"
              secondTitle="Skip Response"
              color="cyan"
            />
          )}
          {RFD.length > 0 && <RFDReportTables RFD={RFD} />}
        </div>
      </motion.div>
    </div>
  );
};

export default ReportsView;
