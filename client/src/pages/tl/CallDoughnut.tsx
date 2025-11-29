import { useQuery } from "@apollo/client";
import { ChartData, ChartOptions } from "chart.js";
import gql from "graphql-tag";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { motion } from "framer-motion";

const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`;

type Dispositions = {
  code: string;
  count: number;
  color: string;
};

type DispositionType = {
  name: string;
  code: string;
  count: string;
  amount: number;
};

type ComponentsProps = {
  totalAccounts: number;
  dispoData: DispositionType[];
  selectedDispositions: string[];
  onDataPrepared?: (payload: DoughnutExportPayload) => void;
};

const positiveDispositionCodes = [
  "PTP",
  "FFUP",
  "UNEG",
  "RTP",
  "PAID",
  "DISP",
  "LM",
  "HUP",
  "WN",
  "RPCCB",
];

export type DoughnutDispositionRow = {
  code: string;
  name: string;
  count: number;
  percentage: number;
  sentiment: "Positive" | "Negative";
};

export type DoughnutSummaryRow = {
  label: string;
  count: number;
  percentage: number;
};

export type DoughnutExportPayload = {
  totalAccounts: number;
  dispositions: DoughnutDispositionRow[];
  summary: DoughnutSummaryRow[];
};

const CallDoughnut: React.FC<ComponentsProps> = ({
  totalAccounts,
  dispoData,
  selectedDispositions,
  onDataPrepared,
}) => {
  const { data: disposition } = useQuery<{
    getDispositionTypes: DispositionType[];
  }>(GET_DISPOSITION_TYPES);
  const [newReportsDispo, setNewReportsDispo] = useState<
    Record<string, number>
  >({});

  const selectionSet = useMemo(() => {
    const normalized = (selectedDispositions || [])
      .map((entry) => entry?.toString().trim().toUpperCase())
      .filter(Boolean);
    const set = new Set(normalized);
    if (disposition?.getDispositionTypes?.length) {
      disposition.getDispositionTypes.forEach((type) => {
        const nameKey = type.name?.toString().trim().toUpperCase();
        const codeKey = type.code?.toString().trim().toUpperCase();
        if (nameKey && normalized.includes(nameKey) && codeKey) {
          set.add(codeKey);
        }
      });
    }
    return set;
  }, [disposition, selectedDispositions]);

  const filteredDispoData = useMemo(() => {
    if (!selectionSet.size) return dispoData;
    return dispoData.filter((item) => {
      const nameKey = (item.name || "").trim().toUpperCase();
      const codeKey = (item.code || "").trim().toUpperCase();
      return selectionSet.has(nameKey) || selectionSet.has(codeKey);
    });
  }, [dispoData, selectionSet]);

  useEffect(() => {
    const reportsDispo: { [key: string]: number } = {};
    filteredDispoData?.forEach((element: DispositionType) => {
      reportsDispo[element.code] = element.count ? Number(element.count) : 0;
    });
    setNewReportsDispo(reportsDispo);
  }, [filteredDispoData]);

  useEffect(() => {
    if (disposition?.getDispositionTypes) {
      const updatedData = disposition.getDispositionTypes.map((e) => ({
        code: e.code,
        count: Number(newReportsDispo[e.code])
          ? Number(newReportsDispo[e.code])
          : 0,
        color: positiveDispositionCodes.includes(e.code)
          ? `oklch(62.7% 0.194 149.214)`
          : `oklch(63.7% 0.237 25.331)`,
      }));
      setDispositionData(updatedData);
    }
  }, [disposition, newReportsDispo]);
  const [dispositionData, setDispositionData] = useState<Dispositions[]>([]);

  const positiveCalls = filteredDispoData.filter((x) =>
    positiveDispositionCodes.includes(x.code)
  );
  const negativeCalls = filteredDispoData.filter(
    (x) => !positiveDispositionCodes.includes(x.code)
  );

  const sumCounts = (items: DispositionType[]) =>
    items.reduce((total, item) => total + Number(item.count ?? 0), 0);

  const filteredPositive = sumCounts(positiveCalls);
  const filteredNegative = sumCounts(negativeCalls);
  const totalDispositionCounts = sumCounts(filteredDispoData);

  const unconnectedCalls = Math.max(
    totalAccounts - totalDispositionCounts,
    0
  );

  const dataLabels = ["Negative Calls", "Positive Calls", "Unconnected Calls"];
  const dataCount = [
    filteredNegative,
    filteredPositive,
    unconnectedCalls,
  ];
  const dataColor = [
    `oklch(63.7% 0.237 25.331)`,
    `oklch(62.7% 0.194 149.214)`,
    `oklch(44.6% 0.043 257.281)`,
  ];

  const data: ChartData<"doughnut"> = {
    labels: dataLabels,
    datasets: [
      {
        label: "Percentage",
        data: dataCount,
        backgroundColor: dataColor,
        hoverOffset: 30,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    plugins: {
      datalabels: {
        color: "oklch(0 0 0)",
        font: {
          weight: "bold",
          size: 14,
        },
        formatter: (value: number) => {
          const percentage = ((value / totalAccounts) * 100).toFixed(2);
          return value === 0 ? "" : `${percentage}%`;
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const currentValue = context.raw as number;
            const percentage = ((currentValue / totalAccounts) * 100).toFixed(
              2
            );
            return `Value: ${percentage}% - ${currentValue}`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const dispositionCount = useCallback(
    (code: string) => {
      const newFilter = dispositionData?.filter((e) => e.code === code);
      return newFilter[0]?.count ?? 0;
    },
    [dispositionData]
  );

  const percentageOfDispo = useCallback(
    (code: string) => {
      const newFilter = dispositionData.filter((e) => e.code === code);
      if (!totalAccounts) return 0;
      return ((newFilter[0]?.count ?? 0) / totalAccounts) * 100;
    },
    [dispositionData, totalAccounts]
  );

  const exportRows = useMemo(() => {
    return filteredDispoData.map((item) => {
      const count = Number(item.count ?? 0);
      const percentage = totalAccounts ? (count / totalAccounts) * 100 : 0;
      return {
        code: item.code,
        name: item.name,
        count,
        percentage,
        sentiment: positiveDispositionCodes.includes(item.code)
          ? "Positive"
          : "Negative",
      } satisfies DoughnutDispositionRow;
    });
  }, [filteredDispoData, totalAccounts]);

  const summaryRows = useMemo(() => {
    const safeTotal = totalAccounts || 0;
    const toPercentage = (value: number) =>
      safeTotal ? (value / safeTotal) * 100 : 0;
    return [
      {
        label: "Negative Calls",
        count: filteredNegative,
        percentage: toPercentage(filteredNegative),
      },
      {
        label: "Positive Calls",
        count: filteredPositive,
        percentage: toPercentage(filteredPositive),
      },
      {
        label: "Unconnected Calls",
        count: unconnectedCalls,
        percentage: toPercentage(unconnectedCalls),
      },
    ] satisfies DoughnutSummaryRow[];
  }, [filteredNegative, filteredPositive, totalAccounts, unconnectedCalls]);

  const exportPayload = useMemo(() => {
    return {
      totalAccounts,
      dispositions: exportRows,
      summary: summaryRows,
    } satisfies DoughnutExportPayload;
  }, [exportRows, summaryRows, totalAccounts]);

  const lastPayloadRef = useRef<string | null>(null);

  useEffect(() => {
    if (!onDataPrepared) return;
    const serialized = JSON.stringify(exportPayload);
    if (lastPayloadRef.current === serialized) return;
    lastPayloadRef.current = serialized;
    onDataPrepared(exportPayload);
  }, [exportPayload, onDataPrepared]);

  return (
    <div className="flex gap-3 justify-between w-full h-full pr-5">
      <div className="w-full flex justify-center item-center flex-col ">
        <div className="flex flex-col justify-center h-full">
          {filteredDispoData.map((dd, index) => {
            const findDispotype = disposition?.getDispositionTypes.find(
              (x) => x.code === dd.code
            );
            return (
              <motion.div
                key={index}
                className="text-xs rounded-md items-center 2xl:text-base text-slate-900 font-medium flex-row flex gap-1 py-0.5 transition-all hover:font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  style={{
                    backgroundColor: `${
                        positiveDispositionCodes.includes(dd?.code)
                        ? `oklch(40.7% 0.194 149.214)`
                        : `oklch(50.7% 0.237 25.331)`
                    }`,
                  }}
                  className="px-2 font-black gap-4 py-1.5 justify-between flex text-gray-100 rounded-sm shadow-sm w-full"
                >
                  <div className="whitespace-nowrap">{dd.code}</div>
                  <div className=" whitespace-nowrap">
                    {findDispotype?.name}
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: `${
                        positiveDispositionCodes.includes(dd?.code)
                        ? `oklch(40.7% 0.194 149.214)`
                        : `oklch(50.7% 0.237 25.331)`
                    }`,
                  }}
                  className="text-center text-white py-1.5  rounded-sm font-black w-full"
                >
                  {dispositionCount(dd.code)} -{" "}
                  {percentageOfDispo(dd.code).toFixed(2)}%
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="w-5/10 flex justify-center min-h-96 max-h-120">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
};

export default CallDoughnut;
