import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { Doughnut } from "react-chartjs-2";
import { colorDispo } from "../../middleware/exports";
import { useEffect, useState } from "react";
import { ChartData, ChartOptions } from "chart.js";
import { motion } from "framer-motion";

const REPORT = gql`
  query ProductionReport($dispositions: [ID], $from: String, $to: String) {
    ProductionReport(dispositions: $dispositions, from: $from, to: $to) {
      totalDisposition
      dispotypes {
        dispotype {
          _id
          code
          name
        }
        count
      }
    }
  }
`;

const AGENT_TOTAL_DISPO = gql`
  query getAgentTotalDispositions {
    getAgentTotalDispositions {
      count
      dispotype
    }
  }
`;

const DISPO_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`;

type AgentTotalDispo = {
  count: number;
  dispotype: Dispotype;
};

type Dispotype = {
  _id: string;
  code: string;
  name: string;
};

type Dispotypes = {
  dispotype: Dispotype;
  count: number;
};
type ProductionReport = {
  totalDisposition: number;
  dispotypes: Dispotypes[];
};

type ReportsComponents = {
  dispositions: string[];
  from: string;
  to: string;
};

type DoughnutData = {
  datas: number[];
  colors: string[];
  labels: string[];
};

type DispositionType = {
  id: string;
  code: string;
  name: string;
};

const ReportsComponents: React.FC<ReportsComponents> = ({
  dispositions,
  from,
  to,
}) => {
  const { data: agentTotalDispoData, refetch: TotalDispoRefetch } = useQuery<{
    getAgentTotalDispositions: AgentTotalDispo[];
  }>(AGENT_TOTAL_DISPO, {
    notifyOnNetworkStatusChange: true,
  });

  const { data: dispotypeData, refetch: DispoTypeRefetch } = useQuery<{
    getDispositionTypes: DispositionType[];
  }>(DISPO_TYPES, {
    notifyOnNetworkStatusChange: true,
  });


  const { data: productionReportData, refetch } = useQuery<{
    ProductionReport: ProductionReport;
  }>(REPORT, {
    variables: { dispositions, from, to },
    notifyOnNetworkStatusChange: true,
  });

  console.log(productionReportData)

  console.log("Production Report Data:", productionReportData);
  const [doughnutData, setDoughnutData] = useState<DoughnutData>({
    datas: [],
    colors: [],
    labels: [],
  });

  useEffect(() => {
    if (productionReportData) {
      const dispotypes = productionReportData?.ProductionReport?.dispotypes;

      const totalDispo =
        productionReportData?.ProductionReport?.totalDisposition;

      if (dispotypes.length > 0) {
        const dataLabels: string[] =
          productionReportData?.ProductionReport?.dispotypes.map(
            (e) => e.dispotype.code
          );

        const dataData: number[] =
          productionReportData?.ProductionReport?.dispotypes.map(
            (e) => e.count
          );

        const dataColor: string[] =
          productionReportData?.ProductionReport?.dispotypes.map(
            (e) => colorDispo[e.dispotype.code]
          );

        const dataCounts = dispotypes
          .map((e) => e.count)
          .reduce((t, v) => {
            return t + v;
          });

        const total = totalDispo - dataCounts;

        if (total > 0) {
          dataData.push(total);
          dataLabels.push("Other Dispo");
          dataColor.push("oklch(70.9% 0.01 56.259)");
        }

        setDoughnutData({
          datas: dataData,
          colors: dataColor,
          labels: dataLabels,
        });
      } else {
        setDoughnutData({
          datas: [totalDispo],
          colors: ["oklch(70.9% 0.01 56.259)"],
          labels: ["Other Dispo"],
        });
      }
    }
  }, [productionReportData]);

  useEffect(() => {
    const refetching = async () => {
      await refetch();
    };
    refetching();
  }, [dispositions.length, from, to]);

  const data: ChartData<"doughnut"> = {
    labels: doughnutData.labels,
    datasets: [
      {
        label: "Percentage",
        data: doughnutData.datas,
        backgroundColor: doughnutData.colors,
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
          size: 10,
        } as const,
      },
      legend: {
        position: "bottom" as const,
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const dataset = context.dataset;
            const total = dataset.data.reduce(
              (sum: number, val: any) => sum + val,
              0
            );
            const currentValue = context.raw as number;
            const percentage = ((currentValue / total) * 100).toFixed(1);
            return `Percentage: ${percentage}%`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const labels = ["Name", "Code", "Count"];

  return (
    <div className="h-full flex p-5 overflow-hidden mt-2 gap-2">
      <motion.div
        className=" bg-gray-100 border rounded-md shadow-md border-gray-700 h-full flex flex-col w-1/2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        layout
      >
        <h1 className="text-center text-xl uppercase text-black rounded-t-sm border-b py-3 bg-gray-300 font-black ">
          Dispositions
        </h1>
        <div className="grid grid-cols-3 gap-2  py-2 px-4  bg-gray-200 border-b lg:text-sm 2xl:text-lg md:px-3 ">
          {labels.map((e, index) => (
            <div
              key={index}
              className="text-black text-xs  last:border-0 font-black uppercase "
            >
              {e}
            </div>
          ))}
        </div>
        <div className="h-full overflow-y-auto">
          {(!agentTotalDispoData?.getAgentTotalDispositions ||
            agentTotalDispoData.getAgentTotalDispositions.length === 0) && (
            <div className="text-gray-400 italic text-center py-2">
              {" "}
              No performance found.
            </div>
          )}

          {agentTotalDispoData?.getAgentTotalDispositions.map((e) => {
            const findDispo = dispotypeData?.getDispositionTypes.find(
              (y) => y.id === e.dispotype
            );

            return (
              <div
                className="grid grid-cols-3 gap-2 odd:bg-gray-200 even:bg-gray-100  py-2 px-3 border-b border-gray-300 text-xs font-medium text-black cursor-default"
                key={e.dispotype}
              >
                <div
                  className="truncate"
                  title={findDispo?.name}
                >
                  {findDispo?.name}
                </div>
                <div className="">{findDispo?.code}</div>
                <div className="">{e.count}</div>
              </div>
            );
          })}
        </div>
      </motion.div>
      <motion.div
        className="p-20 w-1/2 border bg-gray-100 rounded-md h-full shadow-md border-gray-700"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        layout
      >
        <Doughnut data={data} options={options} />
      </motion.div>
    </div>
  );
};

export default ReportsComponents;
