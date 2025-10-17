import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect } from "react";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type PTPKept = {
  count: number;
  amount: number;
};

const PTP_KEPT_TOTAL = gql`
  query getTLPTPKeptTotals($input: Input) {
    getTLPTPKeptTotals(input: $input) {
      count
      amount
    }
  }
`;

// <div className="flex justify-end w-full">
//   <AiOutlineLoading3Quarters className="animate-spin" />
// </div>

const PTPKeptTl = () => {
  const { intervalTypes, selectedBucket } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();
  const pathName = location.pathname.slice(1);
  const isTLDashboard = ["tl-dashboard", "aom-dashboard"].includes(pathName);

  const {
    data: ptpKetpData,
    refetch,
    loading,
  } = useQuery<{ getTLPTPKeptTotals: PTPKept }>(PTP_KEPT_TOTAL, {
    variables: {
      input: { bucket: selectedBucket, interval: intervalTypes },
      skip: !isTLDashboard,
      notifyOnNetworkStatusChange: true,
    },
  });

  useEffect(() => {
    const timer = async () => {
      await refetch();
    };
    if (selectedBucket) {
      timer();
    }
  }, [intervalTypes, selectedBucket]);

  const paidSelected = ptpKetpData?.getTLPTPKeptTotals || null;

  return (
    <div className="border-green-500 border bg-white text-green-600 rounded-sm  flex flex-col shadow-md">
      <div className="lg:text-xs 2xl:text-lg rounded-t-xs flex items-center justify-center text-green-800 border-b border-green-500 font-black uppercase h-[50%] bg-green-400 ">
        <h1>
          Kept{" "}
          <span className="text-[0.6rem] 2xl:text-xs capitalize">{`(${intervalTypes})`}</span>{" "}
        </h1>
      </div>
      <div className="h-[50%] w-full flex justify-between items-center relative  text-lg  2xl:text-xl">
        {!loading ? (
          <>
            <div className="font-bold text-center absolute shadow-md -top-4 right-2 px-2.5 bg-green-100 rounded-full border border-green-600 ">
              {paidSelected ? paidSelected?.count : 0}
            </div>
            <div className="font-black flex w-full justify-center text-center items-center gap-2">
              <p className="text-center flex" >
                {paidSelected
                  ? paidSelected?.amount.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })
                  : (0).toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
              </p>
            </div>
          </>
        ) : (
          <div className="flex justify-end w-full">
            <AiOutlineLoading3Quarters className="animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PTPKeptTl;
