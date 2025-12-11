import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { gql, useLazyQuery, useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import type { ChartData, ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Users } from "../../middleware/types";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import CallReportTables from "./CallReportTables";
import ReportsTables from "./ReportsTables";
import RFDReportTables from "./RFDReportTables";

const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
      active
    }
  }
`;

const DEPT_BUCKET_QUERY = gql`
  query getDeptBucket {
    getDeptBucket {
      _id
      name
      dept
    }
  }
`;

const GET_ALL_BUCKET = gql`
  query GetAllBucket {
    getAllBucket {
      _id
      name
      dept
    }
  }
`;

const GET_DEPARTMENT_AGENT = gql`
  query findAgents {
    findAgents {
      _id
      name
      user_id
      buckets
      type
    }
  }
`;

const GET_BUCKET_CALLFILES = gql`
  query GetBucketCallfile($bucketId: [ID]) {
    getBucketCallfile(bucketId: $bucketId) {
      _id
      name
      bucket
    }
  }
`;

const GET_BUCKET_AGENTS = gql`
  query getBucketUser($bucketId: ID) {
    getBucketUser(bucketId: $bucketId) {
      _id
      name
      user_id
      buckets
      type
    }
  }
`;

const GET_AGENT_CALLFILE_DISPOSITIONS = gql`
  query GetAgentCallfileDispositions(
    $agentId: ID!
    $bucketId: ID
    $callfileId: ID
    $dateFrom: DateTime
    $dateTo: DateTime
  ) {
    getAgentCallfileDispositions(
      agentId: $agentId
      bucketId: $bucketId
      callfileId: $callfileId
      dateFrom: $dateFrom
      dateTo: $dateTo
    ) {
      code
      name
      count
      amount
    }
  }
`;

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

type Bucket = {
  _id: string;
  name: string;
  dept: string;
};

type DispositionType = {
  id: string;
  name: string;
  code: string;
  active: boolean;
};

type Agent = {
  _id: string;
  name: string;
  user_id?: string;
  buckets?: string[];
  type?: string;
};

type CallfileOption = {
  _id: string;
  name: string;
  bucket: string;
};

type CallfileDispositionSummary = {
  code: string;
  name: string;
  count: number;
  amount: number;
};

type ReportCallfile = {
  _id: string;
  name: string;
  totalAccounts: number;
  totalPrincipal: number;
  totalOB: number;
};

type ReportRFD = {
  _id: string;
  count: number;
};

type ReportDisposition = ComponentProps<typeof ReportsTables>["dispo"][number];

type ReportToolGroup = {
  call_method: string;
  dispositions: ReportDisposition[];
};

type ReportAgent = {
  _id: string;
  name: string;
  user_id?: string;
};

type DispositionReportPayload = {
  agent?: ReportAgent | null;
  bucket?: string | null;
  callfile?: ReportCallfile | null;
  toolsDispoCount?: ReportToolGroup[] | null;
  RFD?: ReportRFD[] | null;
};

type DispositionReportResponse = {
  getDispositionReports: DispositionReportPayload | null;
};

type DispositionReportSearchInput = {
  agent: string;
  disposition: string[];
  callfile: string;
  from?: string;
  to?: string;
};

const DOUGHNUT_COLORS = [
  "#2563eb",
  "#ea580c",
  "#16a34a",
  "#db2777",
  "#0d9488",
  "#7c3aed",
  "#f59e0b",
  "#14b8a6",
  "#6366f1",
  "#d946ef",
];

const CallfileAndAgentReport = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);

  const { data } = useQuery<{
    getDispositionTypes: DispositionType[];
  }>(GET_DISPOSITION_TYPES);

  const [isCallfileOpen, setIsCallfileOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedCallfile, setSelectedCallfile] =
    useState<CallfileOption | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDispositions, setSelectedDispositions] = useState<string[]>(
    []
  );
  const [isExporting, setIsExporting] = useState(false);
  const [callfileSearchTerm, setCallfileSearchTerm] = useState("");
  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  const callfileDropdownRef = useRef<HTMLDivElement>(null);
  const agentDropdownRef = useRef<HTMLDivElement>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [
    fetchDispositionReports,
    {
      data: dispositionReportData,
      loading: dispositionReportLoading,
      error: dispositionReportError,
    },
  ] = useLazyQuery<DispositionReportResponse>(GET_DISPOSITION_REPORTS, {
    fetchPolicy: "network-only",
  });

  const isDateRangeValid = useMemo(() => {
    if (!dateFrom || !dateTo) {
      return true;
    }
    return new Date(dateFrom) <= new Date(dateTo);
  }, [dateFrom, dateTo]);

  const { data: departmentBucket } = useQuery<{ getDeptBucket: Bucket[] }>(
    DEPT_BUCKET_QUERY
  );

  const { data: getallbuckets } = useQuery<{ getAllBucket: Bucket[] }>(
    GET_ALL_BUCKET
  );

  const bucketsData =
    userLogged?.type !== "QASUPERVISOR"
      ? departmentBucket?.getDeptBucket
      : getallbuckets?.getAllBucket;

  const bucketIds = useMemo(() => {
    if (!bucketsData) {
      return [] as string[];
    }
    return bucketsData
      .map((bucket) => bucket._id)
      .filter((value): value is string => Boolean(value));
  }, [bucketsData]);

  const { data: agentSelector } = useQuery<{ findAgents: Users[] }>(
    GET_DEPARTMENT_AGENT
  );

  const { data: callfilesData, loading: callfileLoading } = useQuery<{
    getBucketCallfile: CallfileOption[];
  }>(GET_BUCKET_CALLFILES, {
    variables: { bucketId: bucketIds },
    skip: bucketIds.length === 0,
    fetchPolicy: "network-only",
  });

  const { data: bucketAgentsData } = useQuery<{ getBucketUser: Users[] }>(
    GET_BUCKET_AGENTS,
    {
      variables: { bucketId: selectedCallfile?.bucket },
      skip: !selectedCallfile?.bucket,
      fetchPolicy: "network-only",
    }
  );

  const filteredAgents = useMemo(() => {
    const source = selectedCallfile?.bucket
      ? bucketAgentsData?.getBucketUser ?? []
      : agentSelector?.findAgents ?? [];

    return source.filter((agent) => agent.type === "AGENT");
  }, [agentSelector, bucketAgentsData, selectedCallfile]);

  const normalizedCallfileSearch = callfileSearchTerm.trim().toLowerCase();
  const normalizedAgentSearch = agentSearchTerm.trim().toLowerCase();

  const rawCallfiles = callfilesData?.getBucketCallfile ?? [];

  const callfileOptions = useMemo(() => {
    let scoped = rawCallfiles;
    if (selectedAgent?.buckets?.length) {
      const allowed = new Set(selectedAgent.buckets);
      scoped = scoped.filter((callfile) => allowed.has(callfile.bucket));
    }

    if (!normalizedCallfileSearch) {
      return scoped;
    }

    return scoped.filter((callfile) =>
      callfile.name.toLowerCase().includes(normalizedCallfileSearch)
    );
  }, [rawCallfiles, normalizedCallfileSearch, selectedAgent]);

  const agentOptions = useMemo(() => {
    if (!normalizedAgentSearch) {
      return filteredAgents;
    }

    return filteredAgents.filter((agent) => {
      const searchable = [agent.name, agent.user_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedAgentSearch);
    });
  }, [filteredAgents, normalizedAgentSearch]);

  useEffect(() => {
    if (
      selectedAgent &&
      !filteredAgents.some((agent) => agent._id === selectedAgent._id)
    ) {
      setSelectedAgent(null);
    }
  }, [filteredAgents, selectedAgent]);

  useEffect(() => {
    if (
      selectedCallfile &&
      selectedAgent?.buckets?.length &&
      !selectedAgent.buckets.includes(selectedCallfile.bucket)
    ) {
      setSelectedCallfile(null);
    }
  }, [selectedAgent, selectedCallfile]);

  useEffect(() => {
    if (
      selectedCallfile &&
      !rawCallfiles.some((callfile) => callfile._id === selectedCallfile._id)
    ) {
      setSelectedCallfile(null);
    }
  }, [rawCallfiles, selectedCallfile]);

  useEffect(() => {
    setSelectedDispositions([]);
  }, [selectedAgent?._id, selectedCallfile?._id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isCallfileOpen &&
        callfileDropdownRef.current &&
        !callfileDropdownRef.current.contains(target)
      ) {
        setIsCallfileOpen(false);
      }

      if (
        isAgentOpen &&
        agentDropdownRef.current &&
        !agentDropdownRef.current.contains(target)
      ) {
        setIsAgentOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCallfileOpen, isAgentOpen]);

  const shouldSkipAgentDispositionQuery =
    !selectedAgent?._id || !selectedCallfile?._id || !isDateRangeValid;

  const { data: agentDispositionData, loading: agentDispositionLoading } =
    useQuery<{ getAgentCallfileDispositions: CallfileDispositionSummary[] }>(
      GET_AGENT_CALLFILE_DISPOSITIONS,
      {
        variables: {
          agentId: selectedAgent?._id ?? "",
          bucketId: selectedCallfile?.bucket ?? "",
          callfileId: selectedCallfile?._id ?? null,
          dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
          dateTo: dateTo ? new Date(dateTo).toISOString() : null,
        },
        skip: shouldSkipAgentDispositionQuery,
        fetchPolicy: "network-only",
      }
    );

  const agentDispositionSummaries = useMemo(
    () => agentDispositionData?.getAgentCallfileDispositions ?? [],
    [agentDispositionData]
  );

  const dispositions = useMemo(
    () => (data?.getDispositionTypes ?? []).filter((dispo) => dispo.active),
    [data]
  );

  const dispositionKeys = useMemo(
    () => dispositions.map((dispo) => dispo.id ?? dispo.code),
    [dispositions]
  );

  useEffect(() => {
    setSelectedDispositions((current) =>
      current.filter((key) => dispositionKeys.includes(key))
    );
  }, [dispositionKeys]);

  const selectedDispositionCodes = useMemo(() => {
    if (!selectedDispositions.length) {
      return [];
    }

    const keyToCode = dispositions.reduce<Record<string, string>>(
      (acc, { id, code }) => {
        const key = id ?? code;
        if (key && code) {
          acc[key] = code;
        }
        return acc;
      },
      {}
    );

    return selectedDispositions
      .map((key) => keyToCode[key])
      .filter((value): value is string => Boolean(value));
  }, [dispositions, selectedDispositions]);

  const selectedDispositionNames = useMemo(() => {
    if (!selectedDispositions.length) {
      return [];
    }

    const keyToName = dispositions.reduce<Record<string, string>>(
      (acc, { id, code, name }) => {
        const key = id ?? code;
        if (key && name) {
          acc[key] = name;
        }
        return acc;
      },
      {}
    );

    return selectedDispositions
      .map((key) => keyToName[key])
      .filter((value): value is string => Boolean(value));
  }, [dispositions, selectedDispositions]);

  const filteredCallfileDispositionSummaries = useMemo(() => {
    if (!selectedDispositionCodes.length) {
      return agentDispositionSummaries;
    }

    const allowed = new Set(selectedDispositionCodes);
    return agentDispositionSummaries.filter((summary) =>
      allowed.has(summary.code)
    );
  }, [agentDispositionSummaries, selectedDispositionCodes]);

  const totalCallfileDispositionCount = useMemo(() => {
    return filteredCallfileDispositionSummaries.reduce((sum, summary) => {
      const numericCount = Number(summary.count ?? 0);
      return sum + (Number.isNaN(numericCount) ? 0 : numericCount);
    }, 0);
  }, [filteredCallfileDispositionSummaries]);

  const toggleDisposition = (key: string) => {
    setSelectedDispositions((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  };

  const areAllSelected =
    dispositionKeys.length > 0 &&
    selectedDispositions.length === dispositionKeys.length;

  const handleSelectAll = () => {
    setSelectedDispositions(() => (areAllSelected ? [] : [...dispositionKeys]));
  };

  const hasDispositionFilter = selectedDispositionCodes.length > 0;

  const reportToolGroups = useMemo(
    () => dispositionReportData?.getDispositionReports?.toolsDispoCount ?? [],
    [dispositionReportData]
  );

  const callMethodDispositions = useMemo(
    () =>
      reportToolGroups.find((group) => group.call_method === "call")
        ?.dispositions ?? [],
    [reportToolGroups]
  );

  const smsMethodDispositions = useMemo(
    () =>
      reportToolGroups.find((group) => group.call_method === "sms")
        ?.dispositions ?? [],
    [reportToolGroups]
  );

  const emailMethodDispositions = useMemo(
    () =>
      reportToolGroups.find((group) => group.call_method === "email")
        ?.dispositions ?? [],
    [reportToolGroups]
  );

  const skipMethodDispositions = useMemo(
    () =>
      reportToolGroups.find((group) => group.call_method === "skip")
        ?.dispositions ?? [],
    [reportToolGroups]
  );

  const reportRfdEntries = useMemo(
    () => dispositionReportData?.getDispositionReports?.RFD ?? [],
    [dispositionReportData]
  );

  const fallbackReportCallfile = useMemo<ReportCallfile>(
    () => ({
      _id: selectedCallfile?._id ?? "",
      name: selectedCallfile?.name ?? "",
      totalAccounts: 0,
      totalPrincipal: 0,
      totalOB: 0,
    }),
    [selectedCallfile]
  );

  const reportCallfileDetails = useMemo<ReportCallfile>(
    () =>
      dispositionReportData?.getDispositionReports?.callfile ??
      fallbackReportCallfile,
    [dispositionReportData, fallbackReportCallfile]
  );

  const reportTotalAccounts = reportCallfileDetails.totalAccounts ?? 0;

  const reportAgentName =
    dispositionReportData?.getDispositionReports?.agent?.name ??
    selectedAgent?.name ??
    "";

  const reportBucketName =
    dispositionReportData?.getDispositionReports?.bucket ?? null;

  const hasReportModalTables =
    callMethodDispositions.length > 0 ||
    smsMethodDispositions.length > 0 ||
    emailMethodDispositions.length > 0 ||
    skipMethodDispositions.length > 0 ||
    reportRfdEntries.length > 0;

  const doughnutData = useMemo<ChartData<"doughnut">>(() => {
    const labels = filteredCallfileDispositionSummaries.map(
      (summary) => summary.code
    );
    const datasetValues = filteredCallfileDispositionSummaries.map((summary) =>
      Number(summary.count ?? 0)
    );

    const backgroundColor = labels.map(
      (_, index) => DOUGHNUT_COLORS[index % DOUGHNUT_COLORS.length]
    );

    return {
      labels,
      datasets: [
        {
          data: datasetValues,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  }, [filteredCallfileDispositionSummaries]);

  const doughnutOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            color: "#000",
          },
        },
        datalabels: {
          color: "#000",
          font: { weight: "bold", size: 12 },
        },
        tooltip: {
          titleColor: "#fff",
          bodyColor: "#fff",
          callbacks: {
            label: (context) => {
              const value = Number(context.raw ?? 0);
              if (!totalCallfileDispositionCount) {
                return `${context.label}: ${value}`;
              }
              const pct = (
                (value / totalCallfileDispositionCount) *
                100
              ).toFixed(2);
              return `${context.label}: ${value} (${pct}%)`;
            },
          },
        },
      },
    }),
    [totalCallfileDispositionCount]
  );

  const hasDispositionResults = Boolean(
    selectedAgent &&
      selectedCallfile &&
      isDateRangeValid &&
      filteredCallfileDispositionSummaries.length
  );

  const formatDateLabel = (value: string) =>
    value ? new Date(value).toLocaleDateString() : "All Dates";

  const getDispositionFilterLabel = () => {
    if (!hasDispositionFilter) {
      return "All active dispositions";
    }

    const labelMap = dispositions.reduce<Record<string, string>>(
      (acc, dispo) => {
        const key = dispo.id ?? dispo.code;
        if (key) {
          const codeLabel = dispo.code ? ` (${dispo.code})` : "";
          acc[key] = `${dispo.name ?? key}${codeLabel}`;
        }
        return acc;
      },
      {}
    );

    return selectedDispositions.map((key) => labelMap[key] ?? key).join(", ");
  };

  const handleExport = async () => {
    if (!hasDispositionResults) {
      window.alert(
        "Select a callfile, agent, and ensure there is data to export."
      );
      return;
    }

    if (!filteredCallfileDispositionSummaries.length) {
      window.alert("No dispositions match the current filters.");
      return;
    }

    try {
      setIsExporting(true);
      const excelModule = await import("exceljs/dist/exceljs.min.js");
      const ExcelJS = excelModule.default ?? excelModule;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "QA";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Agent Dispositions", {
        properties: { defaultRowHeight: 20 },
      });

      worksheet.addRow(["Agent Disposition Report"]);
      worksheet.mergeCells(1, 1, 1, 6);
      worksheet.getCell("A1").font = { bold: true, size: 14 };

      worksheet.addRow([]);
      worksheet.addRow(["Callfile", selectedCallfile?.name ?? "N/A"]);
      worksheet.addRow(["Agent", selectedAgent?.name ?? "N/A"]);
      worksheet.addRow(["Date From", formatDateLabel(dateFrom)]);
      worksheet.addRow(["Date To", formatDateLabel(dateTo)]);
      worksheet.addRow([
        "Disposition Filter",
        hasDispositionFilter
          ? getDispositionFilterLabel()
          : "All active dispositions",
      ]);

      worksheet.addRow([]);
      const headerRow = worksheet.addRow([
        "#",
        "Code",
        "Disposition Type",
        "Count",
        "Percentage",
        "Amount",
      ]);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      };

      filteredCallfileDispositionSummaries.forEach((summary, index) => {
        const numericCount = Number(summary.count ?? 0);
        const percentage = totalCallfileDispositionCount
          ? ((numericCount / totalCallfileDispositionCount) * 100).toFixed(2)
          : "0.00";
        worksheet.addRow([
          index + 1,
          summary.code || "—",
          summary.name || "—",
          numericCount,
          `${percentage}%`,
          Number(summary.amount ?? 0),
        ]);
      });

      worksheet.addRow([]);
      const totalRow = worksheet.addRow([
        "",
        "",
        "TOTAL",
        totalCallfileDispositionCount,
        "100%",
        filteredCallfileDispositionSummaries.reduce(
          (sum, summary) => sum + Number(summary.amount ?? 0),
          0
        ),
      ]);
      totalRow.font = { bold: true };

      [1, 2, 3, 4, 5, 6].forEach((columnIndex, idx) => {
        const widths = [5, 12, 30, 12, 15, 15];
        worksheet.getColumn(columnIndex).width = widths[idx];
      });

      const sanitizedSegment = (value: string) =>
        value ? value.replace(/[^a-zA-Z0-9_-]/g, "_") : "";

      const identifier =
        [
          sanitizedSegment(selectedCallfile?.name ?? ""),
          sanitizedSegment(selectedAgent?.name ?? ""),
        ]
          .filter(Boolean)
          .join("_") || "Agent";

      const timestamp = new Date()
        .toISOString()
        .replace(/[:]/g, "-")
        .slice(0, 19);
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Agent_Dispositions_${identifier}_${timestamp}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export agent dispositions", error);
      window.alert("Unable to export the report right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewReports = async () => {
    if (!selectedCallfile?._id) {
      window.alert("Select a callfile before opening the detailed report.");
      return;
    }

    if (!selectedAgent?.user_id) {
      window.alert(
        "Select an agent with a valid user ID before opening the report."
      );
      return;
    }

    if (!isDateRangeValid) {
      window.alert("Fix the date range before opening the report modal.");
      return;
    }

    const reportsInput: DispositionReportSearchInput = {
      agent: selectedAgent.user_id,
      disposition: selectedDispositionNames,
      callfile: selectedCallfile._id,
    };

    if (dateFrom) {
      reportsInput.from = dateFrom;
    }

    if (dateTo) {
      reportsInput.to = dateTo;
    }

    setIsReportModalOpen(true);

    try {
      await fetchDispositionReports({
        variables: { reports: reportsInput },
      });
    } catch (error) {
      console.error("Failed to load disposition reports", error);
    }
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
  };

  const isExportDisabled =
    !hasDispositionResults || agentDispositionLoading || isExporting;

  return (
    <>
      <div className="flex flex-row h-full max-h-[90vh] p-10 gap-2  ">
        <motion.div
          className="bg-gray-300 max-w-[500px] overflow-hidden w-full flex flex-col font-black text-black  border rounded-md shadow-md  "
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="text-center items-center transition  flex justify-center border-b h-[8.4%] p-3 bg-gray-400 font-black uppercase w-full text-2xl ">
            Agent Report
          </div>
          <div className="px-3 flex  flex-col h-[91.6%] pb-3">
            <div className="grid items-center grid-cols-3 mt-2">
              <div className="uppercase text-right mr-2 ">Callfile:</div>
              <div
                className="relative w-full col-span-2 flex "
                ref={callfileDropdownRef}
              >
                <div className="border mr-2 w-full rounded-sm bg-gray-200 shadow-md ">
                  <input
                    className="outline-none w-full px-3 py-1 font-normal"
                    placeholder={
                      selectedCallfile?.name
                        ? `Selected: ${selectedCallfile.name}`
                        : "Search a callfile"
                    }
                    value={callfileSearchTerm}
                    onChange={(event) => {
                      setCallfileSearchTerm(event.target.value);
                      setIsCallfileOpen(true);
                    }}
                    onFocus={() => setIsCallfileOpen(true)}
                  />
                </div>
                <div
                  onClick={() => {
                    if (isAgentOpen || selectedAgent) {
                      setIsAgentOpen(false);
                      setIsCallfileOpen(true);
                    } else {
                      setIsCallfileOpen(!isCallfileOpen);
                    }
                  }}
                  className="border bg-gray-200 items-center flex text-black rounded-sm px-3 py-1 cursor-pointer shadow-md "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`" ${
                      isCallfileOpen ? "rotate-90 " : ""
                    } size-4 transition-all "`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <AnimatePresence>
                  {isCallfileOpen && (
                    <motion.div
                      className="absolute z-20 overflow-auto bg-gray-200 max-h-40 w-full top-10 shadow-sm border rounded-sm "
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                    >
                      {callfileLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          Loading callfiles...
                        </div>
                      ) : callfileOptions.length ? (
                        callfileOptions.map((callfile) => (
                          <div
                            onClick={() => {
                              setSelectedCallfile(callfile);
                              setSelectedAgent(null);
                              setCallfileSearchTerm("");
                              setIsCallfileOpen(false);
                              setIsAgentOpen(true);
                            }}
                            className="px-3 hover:bg-gray-300 odd:bg-gray-100 even:bg-white border-b border-gray-300 last:border-b-0 cursor-pointer py-1"
                            key={callfile._id}
                          >
                            {callfile.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          No callfiles match "{callfileSearchTerm}"
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid items-center grid-cols-3 mt-2">
              <div className="uppercase  text-right mr-2 ">Agent:</div>
              <div className="relative col-span-2 flex" ref={agentDropdownRef}>
                <div className="border mr-2 w-full rounded-sm bg-gray-200 shadow-md ">
                  <input
                    className="outline-none w-full px-3 py-1 font-normal"
                    placeholder={
                      selectedAgent?.name
                        ? `Selected: ${selectedAgent.name}`
                        : "Search an agent"
                    }
                    value={agentSearchTerm}
                    onChange={(event) => {
                      setAgentSearchTerm(event.target.value);
                      setIsAgentOpen(true);
                    }}
                    onFocus={() => setIsAgentOpen(true)}
                  />
                </div>

                <div
                  onClick={() => {
                    setIsAgentOpen(!isAgentOpen);
                  }}
                  className={`"  col-span-2 items-center flex border bg-gray-200 px-3 py-1 rounded-sm  cursor-pointer  shadow-md  "`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`" ${
                      isAgentOpen ? "rotate-90 " : ""
                    } size-4 transition-all "`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <AnimatePresence>
                  {isAgentOpen && (
                    <motion.div
                      className="absolute   max-h-40 overflow-auto bg-gray-200 w-full top-10 shadow-sm border rounded-sm "
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                    >
                      {agentOptions.length ? (
                        agentOptions.map((agent) => (
                          <div
                            onClick={() => {
                              setIsAgentOpen(false);
                              setSelectedAgent(agent);
                              setAgentSearchTerm("");
                            }}
                            className="px-3 hover:bg-gray-300 first-letter:uppercase odd:bg-gray-100 even:bg-white border-b border-gray-300 last:border-b-0  cursor-pointer py-1"
                            key={agent._id}
                          >
                            {agent.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          No agents match "{agentSearchTerm}"
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-5  gap-2  flex flex-col h-full">
              <div className="text-center uppercase">select Disposition</div>
              <div className="bg-gray-200 h-full grid grid-cols-2 items-center  overflow-auto  shadow-md border rounded-sm gap-1 p-2">
                <div
                  onClick={handleSelectAll}
                  className={`text-sm uppercase py-1 px-3 h-full items-center flex rounded-xs cursor-pointer border transition-colors ${
                    areAllSelected
                      ? "bg-gray-500 text-white border-black"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                >
                  <div>select all</div>
                </div>
                {dispositions.map(({ id, name, code }, index) => {
                  const key = id ?? code;
                  const isSelected = selectedDispositions.includes(key);

                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      key={key}
                      onClick={() => toggleDisposition(key)}
                      className={`text-sm py-1 px-3 h-full items-center flex rounded-xs cursor-pointer border transition-colors ${
                        isSelected
                          ? "bg-gray-500 text-white border-black"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    >
                      <div>{name}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="grid items-center grid-cols-3 mt-2">
              <div className="uppercase  text-right mr-2 ">Date from:</div>
              <input
                className="col-span-2 border bg-gray-200 rounded-sm px-3 py-1 cursor-pointer  shadow-md "
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>

            <div className="grid items-center grid-cols-3 mt-2">
              <div className="uppercase  text-right mr-2 ">Date To:</div>
              <input
                className="col-span-2 border bg-gray-200 rounded-sm px-3 py-1 cursor-pointer  shadow-md "
                type="date"
                min={dateFrom || undefined}
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            {!isDateRangeValid && (
              <div className="text-xs text-red-600 text-right mt-1">
                Date To must be on or after Date From.
              </div>
            )}
            <div className="font-normal py-2 text-gray-500 text-sm flex justify-center">
              <span className=" font-black mr-1">NOTE: </span>Report can be
              generated by Daily, Weekly and Monthly.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExportDisabled}
                className={`px-3 border-2 flex gap-2 transition-all rounded-sm uppercase py-1 items-center ${
                  isExportDisabled
                    ? "bg-gray-400 cursor-not-allowed text-gray-500 border-gray-500 opacity-70"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer border-blue-900 text-white"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.75 6.75h-3a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3h7.5a3 3 0 0 0 3-3v-7.5a3 3 0 0 0-3-3h-3V1.5a.75.75 0 0 0-1.5 0v5.25Zm0 0h1.5v5.69l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06l1.72 1.72V6.75Z"
                    clipRule="evenodd"
                  />
                  <path d="M7.151 21.75a2.999 2.999 0 0 0 2.599 1.5h7.5a3 3 0 0 0 3-3v-7.5c0-1.11-.603-2.08-1.5-2.599v7.099a4.5 4.5 0 0 1-4.5 4.5H7.151Z" />
                </svg>
                {isExporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className=" h-full flex flex-col w-full bg-gray-300 border overflow-hidden rounded-md "
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
        >
          <div className=" font-black h-[8.4%] relative uppercase text-center text-2xl py-2 border-b bg-gray-400">
            <div> Agent Performance</div>
            <button
              type="button"
              onClick={handleViewReports}
              disabled={dispositionReportLoading}
              className={`absolute right-4 top-4 transition-all px-3 py-1 text-white border-2 rounded-sm shadow-md text-sm ${
                dispositionReportLoading
                  ? "bg-blue-400 border-blue-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 border-blue-900 cursor-pointer"
              }`}
            >
              {dispositionReportLoading ? "Loading..." : "View"}
            </button>
            <div className="flex justify-center  w-full gap-3">
              <div className="text-sm text-black flex">
                Callfile:{" "}
                {selectedCallfile ? (
                  selectedCallfile.name
                ) : (
                  <div className="font-semibold ml-1">Select a callfile</div>
                )}
              </div>
              <div className="text-sm text-black flex">
                Agent:{" "}
                {selectedAgent ? (
                  selectedAgent.name
                ) : (
                  <div className="font-semibold ml-1">Select an agent</div>
                )}
              </div>
            </div>
          </div>
          <div className="h-[91.6%] grid grid-cols-3 gap-2 p-2 bg-gray-300">
            <div className="border flex flex-col gap-2 px-2 py-2 items-center rounded-sm bg-gray-200 overflow-auto">
              {!selectedCallfile || !selectedAgent ? (
                <div className="text-sm h-full flex items-center text-gray-500 text-center">
                  Select a callfile and agent to view dispositions.
                </div>
              ) : !isDateRangeValid ? (
                <div className="text-sm h-full flex items-center text-red-600 text-center">
                  Adjust the date range: Date To must be on or after Date From.
                </div>
              ) : agentDispositionLoading ? (
                <div className="flex items-center justify-center h-full w-full">
                  <div className="flex flex-col relative justify-center items-center ">
                    <div className="border-t-2 rounded-full z-20 w-20 h-20 border-gray-800 animate-spin "></div>
                    <div className="border-2 absolute top-0 left-0 rounded-full z-10 w-20 h-20 border-gray-200 "></div>
                    <div className="absolute  z-10 text-xs text-gray-400">
                      Loading...
                    </div>
                  </div>
                </div>
              ) : hasDispositionResults ? (
                filteredCallfileDispositionSummaries.map((summary, index) => {
                  const percent =
                    totalCallfileDispositionCount > 0
                      ? ((Number(summary.count ?? 0) || 0) /
                          totalCallfileDispositionCount) *
                        100
                      : 0;

                  return (
                    <motion.div
                      key={summary.code}
                      className="w-full flex border hover:bg-gray-200 justify-between items-center bg-white rounded-sm px-3 py-2 shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        delay: index * 0.05,
                      }}
                    >
                      <div className="font-black text-gray-700">
                        {summary.code}
                      </div>
                      <div className="flex flex-col text-right text-gray-600 text-sm">
                        <span>{summary.name}</span>
                        <span className="font-black text-gray-800">
                          {summary.count} ({percent.toFixed(2)}%)
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-sm h-full flex items-center text-gray-500 text-center">
                  {hasDispositionFilter
                    ? "No dispositions match the selected filters."
                    : "No dispositions found for this agent in the selected callfile/date range."}
                </div>
              )}
            </div>
            <div className="border col-span-2 rounded-sm bg-gray-200 flex items-center justify-center p-4">
              {!selectedCallfile || !selectedAgent ? (
                <div className="text-sm text-gray-500 text-center">
                  Select a callfile and agent to view the doughnut chart.
                </div>
              ) : !isDateRangeValid ? (
                <div className="text-sm text-red-600 text-center">
                  Adjust the date range: Date To must be on or after Date From.
                </div>
              ) : agentDispositionLoading ? (
                <div className="flex flex-col relative justify-center items-center">
                  <div className="border-t-2 rounded-full z-20 w-24 h-24 border-gray-800 animate-spin"></div>
                  <div className="border-2 absolute top-0 left-0 rounded-full z-10 w-24 h-24 border-gray-200"></div>
                  <div className="absolute z-10 text-xs text-gray-400">
                    Loading...
                  </div>
                </div>
              ) : hasDispositionResults ? (
                <div className="w-full h-full flex flex-col items-center">
                  <div className="w-full h-full">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Total dispositions: {totalCallfileDispositionCount}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center">
                  {hasDispositionFilter
                    ? "No dispositions match the selected filters."
                    : "No dispositions found for this agent in the selected callfile/date range."}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex  items-center justify-center bg-black/70 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseReportModal}
          >
            <motion.div
              className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg border bg-white shadow-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              exit={{ opacity: 0, scale: 0.8}}
              animate={{ opacity: 1, scale: 1,}}
              transition={{ type: "spring", stiffness: 120, duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative border-gray-200 bg-white ">
                <button
                  type="button"
                  onClick={handleCloseReportModal}
                  className="absolute cursor-pointer right-4 top-4 flex items-center gap-2 rounded-full border-2 border-red-800 bg-red-600 hover:bg-red-700 p-1  text-xs font-black uppercase transition text-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.72 6.72a.75.75 0 0 1 1.06 0L12 10.94l4.22-4.22a.75.75 0 1 1 1.06 1.06L13.06 12l4.22 4.22a.75.75 0 1 1-1.06 1.06L12 13.06l-4.22 4.22a.75.75 0 0 1-1.06-1.06L10.94 12 6.72 7.78a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div className="text-center border-b borderblack px-6 pt-4 bg-gray-400 uppercase font-black text-black flex flex-col items-center gap-2 pb-2">
                  <div className="flex flex-col items-center">
                    {reportBucketName && (
                      <span className="text-2xl" >Bucket: {reportBucketName}</span>
                    )}
                    {reportAgentName && (
                      <span className="flex text-xs gap-2">
                        Agent Name: {reportAgentName}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {dateFrom && dateTo && dateFrom !== dateTo && (
                      <div>
                        From: {formatDateLabel(dateFrom)} to{" "}
                        {formatDateLabel(dateTo)}
                      </div>
                    )}
                    {((!dateFrom && dateTo) ||
                      (dateFrom && !dateTo) ||
                      dateFrom === dateTo) &&
                      (dateFrom || dateTo) && (
                        <div>
                          Date: {formatDateLabel(dateFrom || dateTo || "")}
                        </div>
                      )}
                  </div>
                </div>
              </div>
              <div className="max-h-[75vh] overflow-y-auto bg-white px-6 py-5">
                {dispositionReportError && (
                  <div className="mb-4 rounded-md border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {dispositionReportError.message ||
                      "Unable to load disposition reports."}
                  </div>
                )}

                {dispositionReportLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3 text-gray-600">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-400 border-t-transparent"></div>
                      <span className="text-sm font-semibold uppercase">
                        Loading report details...
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-5 py-5">
                      {callMethodDispositions.length > 0 && (
                        <CallReportTables
                          totalAccounts={reportTotalAccounts}
                          reportsData={callMethodDispositions}
                          callfile={reportCallfileDetails}
                        />
                      )}
                      {smsMethodDispositions.length > 0 && (
                        <ReportsTables
                          totalAccounts={reportTotalAccounts}
                          dispo={smsMethodDispositions}
                          firstTitle="SMS Status"
                          secondTitle="SMS Response"
                          color="yellow"
                        />
                      )}
                      {emailMethodDispositions.length > 0 && (
                        <ReportsTables
                          totalAccounts={reportTotalAccounts}
                          dispo={emailMethodDispositions}
                          firstTitle="Email Status"
                          secondTitle="Email Response"
                          color="indigo"
                        />
                      )}
                      {skipMethodDispositions.length > 0 && (
                        <ReportsTables
                          totalAccounts={reportTotalAccounts}
                          dispo={skipMethodDispositions}
                          firstTitle="Skip Status"
                          secondTitle="Skip Response"
                          color="cyan"
                        />
                      )}
                      {reportRfdEntries.length > 0 && (
                        <RFDReportTables RFD={reportRfdEntries} />
                      )}
                      {!hasReportModalTables && (
                        <div className="rounded-md border border-dashed border-gray-400 bg-white px-4 py-10 text-center text-sm text-gray-500">
                          No detailed report data is available for the selected
                          filters.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CallfileAndAgentReport;
