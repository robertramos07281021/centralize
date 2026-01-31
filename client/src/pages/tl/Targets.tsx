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
    (state: RootState) => state.auth,
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
      await confirmPaidRefetch();
    };
    if (selectedBucket) {
      timer();
    }
  }, [selectedBucket, intervalTypes]);

  return (
    <motion.div
      className="col-span-2 bg-blue-200 flex flex-col w-full row-span-13 rounded-lg border-blue-800 border-2 h-full overflow-auto py-2 px-2 gap-2 justify-between col-start-7 row-start-1"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <div className="border-2 col-span-2 flex-1 border-yellow-800 rounded-b-md rounded-t-md overflow-hidden flex flex-col items-center text-xs">
        <div className="uppercase text-white border-b-2 border-yellow-800 font-black py-1 bg-yellow-500 w-full text-center">
          Collected
        </div>
        <div className="p-2 w-full flex flex-col h-full bg-yellow-100 items-center justify-center ">
          <div className="w-full border border-yellow-800 h-2 bg-white rounded-full relative text-sm">
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
                },
              )}
            </span>{" "}
            /
            <span className="px-1">
              {targetsData?.getTargetPerCampaign?.totalPrincipal?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                },
              )}
            </span>
          </p>
        </div>
      </div>

      <div className="col-span-2 flex-1 gap-1 flex flex-col ">
        <div className="uppercase w-full border-2 border-blue-800 rounded-md bg-blue-500 text-white text-shadow-2xs text-center font-black text-lg">
          {intervalTypes}
        </div>

        <div className="border-2 h-full flex flex-col border-blue-800 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
          <div className="uppercase font-black text-white border-b-2 border-blue-800 py-1 bg-blue-500 w-full text-right pr-5">
            Amount Collected with KEPT
          </div>
          <div className="p-2 w-full flex items-center justify-center flex-col h-full bg-blue-100">
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
                  },
                )}
              </span>{" "}
              /
              <span className="px-1">
                {targetsData?.getTargetPerCampaign?.target?.toLocaleString(
                  "en-PH",
                  {
                    style: "currency",
                    currency: "PHP",
                  },
                )}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-2 flex-1 border-2 relative w-full flex flex-col  border-blue-800 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
        <p className="uppercase font-black text-white border-b-2 border-blue-800 py-1 bg-blue-500 w-full text-right pr-5">
          PTP to Confirm Paid
        </p>
        <div className="flex gap-2 w-full justify-center h-full font-black">
          <div className=" absolute shadow-sm left-2 px-3 top-2  bg-blue-100  text-gray-600 gap-2 uppercase py-1 border-2 border-blue-800 rounded-sm flex">
            <p className="w-full">Count: </p>
            <p>{ptpToConfirmData?.ptpToConfirmPaid?.count || 0}</p>
          </div>
          <div className="w-full flex py-1 uppercase gap-1 text-gray-600 justify-center bg-blue-100 h-full items-center">
            <p className="">Amount:</p>
            <p>
              {(
                ptpToConfirmData?.ptpToConfirmPaid?.amount || 0
              )?.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-2 flex-1 border-2 relative w-full flex flex-col  border-blue-800 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
        <p className="uppercase font-black text-white border-b-2 border-blue-800 py-1 bg-blue-500 w-full text-right pr-5">
          Confirm Paid
        </p>
        <div className="flex gap-2 w-full font-black  text-gray-600 justify-center h-full">
          <div className=" absolute shadow-sm left-2 px-3 top-2 gap-2 uppercase font-black py-1 border-2 border-blue-800 rounded-sm bg-blue-100 flex">
            <p className="w-full ">Count: </p>
            <p>{confirmPaidData?.confirmPaid?.count || 0}</p>
          </div>
          <div className="w-full flex py-1 uppercase gap-1 justify-center bg-blue-100 h-full items-center">
            <p className="">Amount:</p>
            <p>
              {(confirmPaidData?.confirmPaid?.amount || 0)?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                },
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-2  font-black text-white flex-1 border-2 relative w-full flex flex-col  border-blue-800 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
        <p className="uppercase border-b-2 border-blue-800 py-1 bg-blue-500 w-full text-right pr-5">
          No PTP Payment
        </p>
        <div className="flex gap-2 w-full font-black text-gray-600 justify-center h-full">
          <div className=" absolute shadow-sm left-2 px-3 top-2 gap-2 uppercase py-1 border-2 border-blue-800 rounded-sm bg-blue-100 flex">
            <p className="w-full">Count: </p>
            <p>{noPTPCollection?.noPTPCollection?.count || 0}</p>
          </div>
          <div className="w-full flex py-1 uppercase gap-1 justify-center bg-blue-100 h-full items-center">
            <p className="">Amount: </p>
            <p>
              {(noPTPCollection?.noPTPCollection?.amount || 0)?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                },
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 border-2 relative w-full flex flex-col  border-blue-800 rounded-t-md rounded-b-md overflow-hidden items-center text-xs">
        <p className="uppercase font-black text-white border-b-2 border-blue-800 py-1 bg-blue-500 w-full text-right pr-5">
          Total Amount Collected
        </p>
        <div className="flex gap-2 w-full font-black text-gray-600 justify-center h-full">
          <div className=" absolute shadow-sm left-2 px-3 top-2 gap-2 uppercase font-black py-1 border-2 border-blue-800 rounded-sm bg-blue-100 flex">
            <p className="w-full">Count:</p>
            <p>{paidData?.getTLPaidTotals?.count || 0}</p>
          </div>
          <div className="w-full flex py-1 uppercase gap-1 justify-center bg-blue-100 items-center h-full">
            <p>Amount: </p>
            <p>
              {(paidData?.getTLPaidTotals?.amount || 0)?.toLocaleString(
                "en-PH",
                {
                  style: "currency",
                  currency: "PHP",
                },
              )}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Targets;
