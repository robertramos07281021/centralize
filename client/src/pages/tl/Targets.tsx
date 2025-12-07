import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect } from "react";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

type Target = {
  collected: number;
  totalPrincipal: number;
  target: number;
};

const TARGET_PER_BUCKET = gql`
  query GetTargetPerCampaign($bucket: ID, $interval: String) {
    getTargetPerCampaign(bucket: $bucket, interval: $interval) {
      collected
      totalPrincipal
      target
    }
  }
`;

type NoPTPCollection = {
  count: number;
  amount: number;
};

const NO_PTP_COLLECTION = gql`
  query noPTPCollection($bucket: ID, $interval: String) {
    noPTPCollection(bucket: $bucket, interval: $interval) {
      count
      amount
    }
  }
`;

type PaidType = {
  count: number;
  amount: number;
};

const PAID_DAILY = gql`
  query getTLPaidTotals($input: Input) {
    getTLPaidTotals(input: $input) {
      count
      amount
    }
  }
`;

const PTP_TO_COMFIRM_PAID = gql`
  query ptpToConfirmPaid($bucket: ID, $interval: String) {
    ptpToConfirmPaid(bucket: $bucket, interval: $interval) {
      count
      amount
    }
  }
`;

const CONFIRM_PAID = gql`
  query confirmPaid($bucket: ID, $interval: String) {
    confirmPaid(bucket: $bucket, interval: $interval) {
      amount
      count
    }
  }
`;

type PtpAndConfirmPaid = {
  count: number;
  amount: number;
};

const Targets = () => {
  const { intervalTypes, selectedBucket } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();
  const pathName = location.pathname.slice(1);
  const isTLDashboard = ["tl-dashboard", "aom-dashboard"]?.includes(pathName);

  const { data: targetsData, refetch } = useQuery<{
    getTargetPerCampaign: Target;
  }>(TARGET_PER_BUCKET, {
    variables: { bucket: selectedBucket, interval: intervalTypes },
    skip: !isTLDashboard,
    notifyOnNetworkStatusChange: true,
  });

  const { data: noPTPCollection, refetch: noPTPCollectionRefetch } = useQuery<{
    noPTPCollection: NoPTPCollection;
  }>(NO_PTP_COLLECTION, {
    variables: { bucket: selectedBucket, interval: intervalTypes },
    skip: !isTLDashboard,
    notifyOnNetworkStatusChange: true,
  });

  const { data: paidData, refetch: paidDataRefetch } = useQuery<{
    getTLPaidTotals: PaidType;
  }>(PAID_DAILY, {
    variables: {
      input: { bucket: selectedBucket, interval: intervalTypes },
    },
    skip: !isTLDashboard,
    notifyOnNetworkStatusChange: true,
  });

  const { data: ptpToConfirmData, refetch: ptpToConfirmRefetch } = useQuery<{
    ptpToConfirmPaid: PtpAndConfirmPaid;
  }>(PTP_TO_COMFIRM_PAID, {
    variables: { bucket: selectedBucket, interval: intervalTypes },
    skip: !isTLDashboard,
    notifyOnNetworkStatusChange: true,
  });

  const { data: confirmPaidData, refetch: confirmPaidRefetch } = useQuery<{
    confirmPaid: PtpAndConfirmPaid;
  }>(CONFIRM_PAID, {
    variables: { bucket: selectedBucket, interval: intervalTypes },
    skip: !isTLDashboard,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    const timer = async () => {
      await refetch();
      await noPTPCollectionRefetch();
      await paidDataRefetch();
      await ptpToConfirmRefetch();
      await confirmPaidRefetch()
    };
    if (selectedBucket) {
      timer();
    }
  }, [selectedBucket, intervalTypes]);

  return (
    <motion.div
      className="col-span-2 flex bg-gray-100 row-span-13 rounded-lg border-gray-500 border h-full overflow-auto py-2 px-2 flex-col justify-between col-start-7 row-start-1"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <div className=" border border-yellow-500 rounded-b-md rounded-t-md overflow-hidden flex flex-col items-center text-xs">
        <div className="uppercase text-yellow-800 border-b border-yellow-500 font-black py-1 bg-yellow-200 w-full text-center">
          Collected
        </div>
        <div className="p-2 w-full bg-yellow-100 ">
          <div className="w-full border border-yellow-500 h-2 bg-white rounded-full relative text-sm">
            <div
              className="bg-yellow-500 rounded border-r border-yellow-500 h-full"
              style={{
                width: `${
                  (Number(targetsData?.getTargetPerCampaign?.collected) /
                    Number(targetsData?.getTargetPerCampaign?.totalPrincipal)) *
                  100
                }%`,
              }}
            ></div>
          </div>
          <p className=" text-center">
            <span className="px-1">
              {targetsData?.getTargetPerCampaign?.collected?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                }
              )}
            </span>{" "}
            /
            <span className="px-1">
              {targetsData?.getTargetPerCampaign?.totalPrincipal?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                }
              )}
            </span>
          </p>
        </div>
      </div>

      <div>
        <div className="uppercase text-center font-black text-lg">
          {intervalTypes}
        </div>

        <div className="h-auto border flex flex-col border-blue-600 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
          <div className="uppercase font-black text-blue-800 border-b border-blue-600 py-1 bg-blue-200 w-full text-center">
            Amount Collected with KEPT
          </div>
          <div className="p-2 w-full bg-blue-100">
            <div className="w-full border shadow-sm border-blue-600 h-2 rounded-full relative">
              <div
                className="bg-blue-500 rounded border-r border-blue-600 h-full"
                style={{
                  width: `${
                    (Number(targetsData?.getTargetPerCampaign?.collected) /
                      Number(targetsData?.getTargetPerCampaign?.target)) *
                    100
                  }%`,
                }}
              ></div>
            </div>
            <p className=" text-center">
              <span className="px-1">
                {targetsData?.getTargetPerCampaign?.collected?.toLocaleString(
                  "en-PH",
                  {
                    style: "currency",
                    currency: "PHP",
                  }
                )}
              </span>{" "}
              /
              <span className="px-1">
                {targetsData?.getTargetPerCampaign?.target?.toLocaleString(
                  "en-PH",
                  {
                    style: "currency",
                    currency: "PHP",
                  }
                )}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* <div className="h-auto border flex flex-col border-red-600 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
        <p className="uppercase font-black text-red-800 border-b border-red-600 py-1 bg-red-200 w-full text-center">
          Cured
        </p>
        <div className="p-2 bg-red-100 w-full">
          <div className="w-full border bg-white shadow-sm border-red-500 rounded-full h-2">
            <div
              className="bg-red-500 rounded border-r border-red-500 h-full"
              style={{
                width: `${
                  (Number(targetsData?.getTargetPerCampaign?.collected) /
                    Number(targetsData?.getTargetPerCampaign?.target)) *
                  100
                }%`,
              }}
            ></div>
          </div>
          <p className=" text-center">
            <span className="px-1">
              {targetsData?.getTargetPerCampaign?.collected?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                }
              )}
            </span>{" "}
            /
            <span className="px-1">
              {targetsData?.getTargetPerCampaign?.target?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                }
              )}
            </span>
          </p>
        </div>
      </div> */}

      <div className="h-2/20 border relative w-full flex flex-col  border-violet-600 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
        <p className="uppercase font-black text-violet-800 border-b border-violet-600 py-1 bg-violet-200 w-full text-right pr-5">
          PTP to Confirm Paid
        </p>
        <div className="flex gap-2 w-full justify-center h-full">
          <div className=" absolute shadow-sm left-2 px-3 top-2 text-violet-800 gap-2 uppercase font-black py-1 border border-violet-600 rounded-sm bg-violet-200 flex">
            <p className="w-full">Count: </p>
            <p>{ptpToConfirmData?.ptpToConfirmPaid?.count}</p>
          </div>
          <div className="w-full flex py-1 font-semibold uppercase gap-1 text-violet-800 justify-center bg-violet-100 h-full items-center">
            <p className="">Amount:</p>
            <p>
              {ptpToConfirmData?.ptpToConfirmPaid?.amount?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                }
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="h-2/20 border relative w-full flex flex-col  border-violet-600 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
        <p className="uppercase font-black text-violet-800 border-b border-violet-600 py-1 bg-violet-200 w-full text-right pr-5">
          Confirm Paid
        </p>
        <div className="flex gap-2 w-full justify-center h-full">
          <div className=" absolute shadow-sm left-2 px-3 top-2 text-violet-800 gap-2 uppercase font-black py-1 border border-violet-600 rounded-sm bg-violet-200 flex">
            <p className="w-full">Count: </p>
            <p>{confirmPaidData?.confirmPaid?.count || 0}</p>
          </div>
          <div className="w-full flex py-1  font-semibold uppercase gap-1 text-violet-800 justify-center bg-violet-100 h-full items-center">
            <p className="">Amount:</p>
            <p>{confirmPaidData?.confirmPaid?.amount?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                }
              )}</p>
          </div>
        </div>
      </div>

      <div className="h-2/20 border relative w-full flex flex-col  border-violet-600 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
        <p className="uppercase font-black text-violet-800 border-b border-violet-600 py-1 bg-violet-200 w-full text-right pr-5">
          No PTP Payment
        </p>
        <div className="flex gap-2 w-full justify-center h-full">
          <div className=" absolute shadow-sm left-2 px-3 top-2 text-violet-800 gap-2 uppercase font-black py-1 border border-violet-600 rounded-sm bg-violet-200 flex">
            <p className="w-full">Count: </p>
            <p>{noPTPCollection?.noPTPCollection?.count || 0}</p>
          </div>
          <div className="w-full flex py-1 font-semibold uppercase gap-1 text-violet-800 justify-center bg-violet-100 h-full items-center">
            <p className="">Amount: </p>
            <p>
              {(noPTPCollection?.noPTPCollection?.amount || 0)?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                }
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="h-2/20 border relative w-full flex flex-col  border-violet-600 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
        <p className="uppercase font-black text-violet-800 border-b border-violet-600 py-1 bg-violet-200 w-full text-right pr-5">
          Total Amount Collected
        </p>
        <div className="flex gap-2 w-full justify-center h-full">
          <div className=" absolute shadow-sm left-2 px-3 top-2 text-violet-800 gap-2 uppercase font-black py-1 border border-violet-600 rounded-sm bg-violet-200 flex">
            <p className="w-full">Count:</p>
            <p>{paidData?.getTLPaidTotals?.count || 0}</p>
          </div>
          <div className="w-full flex py-1 font-semibold uppercase gap-1 text-violet-800 justify-center bg-violet-100 items-center h-full">
            <p >Amount: </p>
            <p>
              {(paidData?.getTLPaidTotals?.amount || 0)?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                }
              )}
            </p>
          </div>
        </div>
      </div>

      {/* <div className="flex-wrap flex items-center w-full h-full justify-center">
        <div className={`flex x justify-center w-full h-full relative`}>
          <GoDotFill
            className={`absolute z-20 top-1 left-1 text-5xl ${
              isNaN(callfileVariance)
                ? ""
                : callfileVariance >= 50
                ? "text-green-500"
                : "text-red-500"
            } `}
          />
          <GoDotFill
            className={`absolute z-10 animate-ping top-1 left-1 text-5xl ${
              isNaN(callfileVariance)
                ? ""
                : callfileVariance >= 50
                ? "text-green-500"
                : "text-red-500"
            } `}
          />
          <Doughnut data={data} className="bg-gray-100 px-5 rounded-sm" options={options} />
        </div>
      </div> */}
    </motion.div>
  );
};

export default Targets;
