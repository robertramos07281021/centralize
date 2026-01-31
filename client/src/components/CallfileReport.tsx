import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import type { ChartData, ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Users } from "../middleware/types.ts";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

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

const GET_CALLFILES = gql`
  query GetBucketCallfile($bucketId: [ID]) {
    getBucketCallfile(bucketId: $bucketId) {
      _id
      name
      active
      bucket
    }
  }
`;

const GET_CALLFILE_DISPOSITIONS = gql`
  query GetCallfileDispositions(
    $callfileId: ID!
    $dateFrom: DateTime
    $dateTo: DateTime
  ) {
    getCallfileDispositions(
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

type Bucket = {
  _id: string;
  name: string;
  dept: string;
};

type DispositionType = {
  id?: string;
  name: string;
  code: string;
  active?: boolean;
  count?: string | number;
  amount?: number;
};

type Agent = {
  _id: string;
  name: string;
};

type Callfile = {
  _id: string;
  name: string;
  active?: boolean;
  bucket?: string;
  totalAccounts?: number;
  totalPrincipal?: number;
  totalOB?: number;
};

type CallfileDispositionSummary = {
  code: string;
  name: string;
  count: number;
  amount: number;
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

const QACallfileReport = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const { data } = useQuery<{
    getDispositionTypes: DispositionType[];
  }>(GET_DISPOSITION_TYPES);
  const [isBucketOpen, setIsBucketOpen] = useState(false);
  const [isCallfileOpen, setIsCallfileOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);

  const [selectedCallfile, setSelectedCallfile] = useState<Callfile | null>(
    null
  );
  const [selectedDispositions, setSelectedDispositions] = useState<string[]>(
    []
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [bucketSearchTerm, setBucketSearchTerm] = useState("");
  const [callfileSearchTerm, setCallfileSearchTerm] = useState("");
  const bucketDropdownRef = useRef<HTMLDivElement>(null);
  const callfileDropdownRef = useRef<HTMLDivElement>(null);

  const { data: departmentBucket } = useQuery<{ getDeptBucket: Bucket[] }>(
    DEPT_BUCKET_QUERY
  );

  const { data: allBucketsData } = useQuery<{ getAllBucket: Bucket[] }>(
    GET_ALL_BUCKET
  );

  const bucketsData =
    userLogged?.type === "QASUPERVISOR"
      ? allBucketsData?.getAllBucket
      : departmentBucket?.getDeptBucket;

  const { data: agentSelector } = useQuery<{ findAgents: Users[] }>(
    GET_DEPARTMENT_AGENT
  );

  const filteredAgents = useMemo(() => {
    const agents = agentSelector?.findAgents ?? [];
    return agents.filter((agent) => {
      if (agent.type !== "AGENT") {
        return false;
      }
      if (selectedBucket) {
        return agent.buckets?.includes(selectedBucket._id);
      }
      return true;
    });
  }, [agentSelector, selectedBucket]);

  useEffect(() => {
    if (
      selectedAgent &&
      !filteredAgents.some((agent) => agent._id === selectedAgent._id)
    ) {
      setSelectedAgent(null);
    }
  }, [filteredAgents, selectedAgent]);

  let bucketsOfCallfile: string[] = [];

  if (selectedAgent) {
    const agentData = agentSelector?.findAgents?.find(
      (x) => x._id === selectedAgent._id
    );
    if (agentData?.buckets) {
      bucketsOfCallfile.push(...agentData.buckets);
    }
  } else if (selectedBucket) {
    const bucketData = bucketsData?.find((x) => x._id === selectedBucket._id);
    if (bucketData?._id) {
      bucketsOfCallfile.push(bucketData._id);
    }
  }

  const { data: callfilesData } = useQuery<{
    getBucketCallfile: Callfile[];
  }>(GET_CALLFILES, { variables: { bucketId: bucketsOfCallfile } });

  const normalizedBucketSearch = bucketSearchTerm.trim().toLowerCase();
  const normalizedCallfileSearch = callfileSearchTerm.trim().toLowerCase();

  const bucketOptions = useMemo(() => {
    if (!bucketsData) {
      return [];
    }

    if (!normalizedBucketSearch) {
      return bucketsData;
    }

    return bucketsData.filter((bucket) =>
      bucket.name.toLowerCase().includes(normalizedBucketSearch)
    );
  }, [bucketsData, normalizedBucketSearch]);

  const callfileOptions = useMemo(() => {
    const callfiles = callfilesData?.getBucketCallfile ?? [];
    if (!normalizedCallfileSearch) {
      return callfiles;
    }
    return callfiles.filter((callfile) =>
      callfile.name.toLowerCase().includes(normalizedCallfileSearch)
    );
  }, [callfilesData, normalizedCallfileSearch]);

  useEffect(() => {
    setCallfileSearchTerm("");
    setIsCallfileOpen(false);
  }, [selectedBucket?._id, selectedAgent?._id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        isBucketOpen &&
        bucketDropdownRef.current &&
        !bucketDropdownRef.current.contains(target)
      ) {
        setIsBucketOpen(false);
      }

      if (
        isCallfileOpen &&
        callfileDropdownRef.current &&
        !callfileDropdownRef.current.contains(target)
      ) {
        setIsCallfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isBucketOpen, isCallfileOpen]);

  const isDateRangeValid = useMemo(() => {
    if (!dateFrom || !dateTo) {
      return true;
    }
    return new Date(dateFrom) <= new Date(dateTo);
  }, [dateFrom, dateTo]);

  const shouldSkipDispositionQuery =
    !selectedCallfile?._id || !isDateRangeValid;

  const { data: callfileDispositionData, loading: callfileDispositionLoading } =
    useQuery<{ getCallfileDispositions: CallfileDispositionSummary[] }>(
      GET_CALLFILE_DISPOSITIONS,
      {
        variables: {
          callfileId: selectedCallfile?._id ?? "",
          dateFrom: dateFrom ? new Date(dateFrom).toISOString() : null,
          dateTo: dateTo ? new Date(dateTo).toISOString() : null,
        },
        skip: shouldSkipDispositionQuery,
        fetchPolicy: "network-only",
      }
    );

  const callfileDispositionSummaries = useMemo(
    () => callfileDispositionData?.getCallfileDispositions ?? [],
    [callfileDispositionData]
  );

  const dispositions = (data?.getDispositionTypes ?? []).filter(
    (dispo) => dispo.active === undefined || dispo.active
  );

  const dispositionKeys = useMemo(
    () => dispositions.map((dispo) => dispo.id ?? dispo.code),
    [dispositions]
  );

  useEffect(() => {
    setSelectedDispositions((current) => {
      const filtered = current.filter((key) => dispositionKeys.includes(key));
      return filtered.length === current.length ? current : filtered;
    });
  }, [dispositionKeys]);

  const selectedDispositionCodes = useMemo(() => {
    if (!selectedDispositions.length) {
      return [];
    }

    const keyToCode = dispositions.reduce<Record<string, string>>(
      (acc, { id, code }) => {
        const key = id ?? code;
        if (key) {
          acc[key] = code;
        }
        return acc;
      },
      {}
    );

    return selectedDispositions
      .map((key) => keyToCode[key])
      .filter((item): item is string => Boolean(item));
  }, [dispositions, selectedDispositions]);

  const filteredCallfileDispositionSummaries = useMemo(() => {
    if (!selectedDispositionCodes.length) {
      return callfileDispositionSummaries;
    }

    const allowed = new Set(selectedDispositionCodes);
    return callfileDispositionSummaries.filter((summary) =>
      allowed.has(summary.code)
    );
  }, [callfileDispositionSummaries, selectedDispositionCodes]);

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

  const hasDispositionResults =
    !!selectedCallfile &&
    isDateRangeValid &&
    filteredCallfileDispositionSummaries.length > 0;

  const isExportDisabled =
    !hasDispositionResults || callfileDispositionLoading || isExporting;

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
      window.alert("Select a callfile and ensure there is data to export.");
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

      const worksheet = workbook.addWorksheet("Callfile Dispositions", {
        properties: { defaultRowHeight: 20 },
      });

      worksheet.addRow(["Callfile Disposition Report"]);
      worksheet.mergeCells(1, 1, 1, 6);
      worksheet.getCell("A1").font = { bold: true, size: 14 };

      worksheet.addRow([]);
      worksheet.addRow([
        "Bucket",
        selectedBucket?.name ?? "All accessible buckets",
      ]);
      worksheet.addRow(["Callfile", selectedCallfile?.name ?? "N/A"]);
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
        "Name",
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
          sanitizedSegment(selectedBucket?.name ?? ""),
          sanitizedSegment(selectedCallfile?.name ?? ""),
        ]
          .filter(Boolean)
          .join("_") || "Callfile";

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
      anchor.download = `Callfile_Dispositions_${identifier}_${timestamp}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export dispositions", error);
      window.alert("Unable to export the report right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    const formattedToday = today.toISOString().split("T")[0];
    setDateFrom(formattedToday);
    setDateTo(formattedToday);
  }, []);

  return (
    <div className="flex flex-row h-full max-h-[90vh] p-4 gap-2  ">
      <motion.div
        className="bg-blue-200 max-w-[500px] overflow-hidden w-full flex flex-col font-black  border-2 border-blue-800 rounded-md shadow-md "
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="text-center h-[8.4%] text-white bg-blue-500 py-4 border-b-2 border-blue-800 font-black uppercase w-full text-2xl  ">
          Callfile Report
        </div>

        <div className="px-3 flex  flex-col h-[91.6%] pb-3">
          <div className="grid items-center h-[10%] grid-cols-3 mt-2">
            <div className="uppercase text-right mr-2 ">Bucket:</div>
            <div
              className="relative col-span-2 flex"
              ref={bucketDropdownRef}
            >
              <div className="border mr-2 w-full rounded-sm bg-blue-100 shadow-md ">
                <input
                  className="outline-none w-full px-3 py-1 font-normal"
                  placeholder={
                    selectedBucket?.name
                      ? `Selected: ${selectedBucket.name}`
                      : "Search a bucket"
                  }
                  value={bucketSearchTerm}
                  onChange={(event) => {
                    setBucketSearchTerm(event.target.value);
                    setIsBucketOpen(true);
                  }}
                  onFocus={() => setIsBucketOpen(true)}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCallfileOpen(false);
                  setIsBucketOpen((prev) => !prev);
                }}
                className="border bg-blue-100 rounded-sm px-3 py-1 cursor-pointer shadow-md flex items-center justify-center"
                aria-label="Toggle bucket list"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`${isBucketOpen ? "rotate-90" : ""} size-4 transition-transform`}
                >
                  <path
                    fillRule="evenodd"
                    d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <AnimatePresence>
                {isBucketOpen && (
                  <motion.div
                    className="absolute z-20 overflow-auto bg-blue-100 max-h-40 w-full top-10 shadow-sm border rounded-sm "
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                  >
                    {bucketOptions.length ? (
                      bucketOptions.map((bucket) => (
                        <div
                          onClick={() => {
                            setSelectedBucket(bucket);
                            setSelectedCallfile(null);
                            setBucketSearchTerm("");
                            setIsBucketOpen(false);
                            setIsCallfileOpen(true);
                          }}
                          className="px-3 hover:bg-gray-300 odd:bg-gray-100 even:bg-white border-b border-gray-300 last:border-b-0 cursor-pointer py-1"
                          key={bucket._id}
                        >
                          {bucket.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        {bucketsData?.length
                          ? `No buckets match "${bucketSearchTerm}"`
                          : "No buckets available"}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid items-center grid-cols-3 h-[10%] mt-2">
            <div className="uppercase text-right mr-2 ">Callfile:</div>
            <div
              className="relative col-span-2 flex"
              ref={callfileDropdownRef}
            >
              <div className="border mr-2 w-full rounded-sm bg-blue-100 shadow-md ">
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
              <button
                type="button"
                onClick={() => {
                  setIsBucketOpen(false);
                  setIsCallfileOpen((prev) => !prev);
                }}
                className="border bg-blue-100 rounded-sm px-3 py-1 cursor-pointer shadow-md flex items-center justify-center"
                aria-label="Toggle callfile list"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`${isCallfileOpen ? "rotate-90" : ""} size-4 transition-transform`}
                >
                  <path
                    fillRule="evenodd"
                    d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <AnimatePresence>
                {isCallfileOpen && (
                  <motion.div
                    className="absolute z-20 bg-blue-100 max-h-40 overflow-auto w-full top-10 shadow-sm border rounded-sm "
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                  >
                    {callfileOptions.length ? (
                      callfileOptions.map((callfile) => (
                        <div
                          onClick={() => {
                            setSelectedCallfile(callfile);
                            setCallfileSearchTerm("");
                            setIsCallfileOpen(false);
                          }}
                          className="px-3 hover:bg-gray-300 odd:bg-gray-100 even:bg-white border-b border-gray-300 last:border-b-0 cursor-pointer py-1"
                          key={callfile._id}
                        >
                          {callfile.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        {selectedBucket || selectedAgent
                          ? `No callfiles match "${callfileSearchTerm}"`
                          : "Select a bucket or agent to load callfiles"}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5  gap-2 h-[50%] flex flex-col">
            <div className="text-center uppercase">select Disposition</div>
            <div className="bg-blue-100 h-full grid grid-cols-2 items-center  overflow-auto  shadow-md border rounded-sm gap-1 p-2">
              <div
                onClick={handleSelectAll}
                className={`text-sm uppercase py-1 px-3 h-full items-center flex rounded-xs cursor-pointer hover:bg-blue-500 hover:text-white border text-shadow-2xs ${
                  areAllSelected
                    ? "bg-blue-500 text-white border border-black"
                    : "bg-blue-300"
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
                    className={`text-sm py-1 px-3 h-full items-center flex rounded-xs cursor-pointer hover:bg-blue-500 hover:text-white text-shadow-2xs border ${
                      isSelected
                        ? "bg-blue-500 text-white border border-black"
                        : "bg-blue-300"
                    }`}
                  >
                    <div>{name}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="grid items-center h-[10%] grid-cols-3 mt-2">
            <div className="uppercase  text-right mr-2 ">Date from:</div>
            <input
              className="col-span-2 border bg-blue-100 rounded-sm px-3 py-1 cursor-pointer  shadow-md "
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>

          <div className="grid items-center h-[10%] grid-cols-3 mt-2">
            <div className="uppercase  text-right mr-2 ">Date To:</div>
            <input
              className="col-span-2 border bg-blue-100 rounded-sm px-3 py-1 cursor-pointer  shadow-md "
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
          <div className="flex h-[10%] items-center justify-end">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExportDisabled}
              className={`px-3 border-2 flex gap-2  transition-all rounded-sm uppercase py-1  items-center ${
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
        className=" h-full flex flex-col w-full bg-blue-200 border-2 border-blue-800 overflow-hidden rounded-md "
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
      >
        <div className="text-white font-black h-[8.4%] text-shadow-2xs uppercase text-center text-2xl py-2 border-b-2 border-blue-800 bg-blue-500">
          <div className="" > Callfile Performance</div>
          <div className="flex justify-center w-full gap-3">
            <div className="text-sm flex">
              Bucket:{" "}
              {selectedBucket ? (
                selectedBucket.name
              ) : (
                <div className="font-semibold ml-1">Select a bucket</div>
              )}
            </div>
            <div className="text-sm flex">
              Callfile:{" "}
              {selectedCallfile ? (
                selectedCallfile.name
              ) : (
                <div className="font-semibold ml-1">Select a callfile</div>
              )}
            </div>
          </div>
        </div>
        <div className="grid w-full gap-2 h-[91.6%] p-2 grid-cols-3">
          <div className="border flex flex-col gap-2 px-2 py-2 items-center rounded-sm bg-blue-100 overflow-auto">
            {!isDateRangeValid ? (
              <div className="text-sm h-full items-center justify-center flex text-red-600 text-center">
                Adjust the date range: Date To must be on or after Date From.
              </div>
            ) : callfileDispositionLoading ? (
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
                    className="w-full flex border hover:bg-blue-100 justify-between items-center bg-white rounded-sm px-3 py-2 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      delay: index * 0.1,
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
              <div className="text-sm h-full items-center justify-center flex text-gray-500 text-center">
                {selectedCallfile
                  ? hasDispositionFilter
                    ? "No dispositions match the selected filters."
                    : "No dispositions found for this callfile."
                  : "Select a callfile to view dispositions."}
              </div>
            )}
          </div>
          <div className="border col-span-2 rounded-sm bg-blue-100 flex items-center justify-center p-4">
            {!isDateRangeValid ? (
              <div className="text-sm text-red-600 text-center">
                Adjust the date range: Date To must be on or after Date From.
              </div>
            ) : callfileDispositionLoading ? (
              <div className="flex flex-col relative justify-center items-center">
                <div className="border-t-2 rounded-full z-20 w-24 h-24 border-gray-800 animate-spin"></div>
                <div className="border-2 absolute top-0 left-0 rounded-full z-10 w-24 h-24 border-gray-200"></div>
                <div className="absolute z-10 text-xs text-gray-400">
                  Loading...
                </div>
              </div>
            ) : hasDispositionResults ? (
              <div className="w-full h-full flex flex-col items-center">
                <div className="w-full  h-full">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Total dispositions: {totalCallfileDispositionCount}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center">
                {selectedCallfile
                  ? hasDispositionFilter
                    ? "No dispositions match the selected filters."
                    : "No dispositions found for this callfile."
                  : "Select a callfile to view the doughnut chart."}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QACallfileReport;
