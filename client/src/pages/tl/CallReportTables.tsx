type DispositionType = {
  name: string;
  code: string;
  count: string;
  amount: number;
};

type Callfile = {
  _id: string;
  name: string;
  totalAccounts: number;
  totalPrincipal: number;
  totalOB: number;
};

type ComponentsProps = {
  totalAccounts: number;
  reportsData: DispositionType[];
  callfile: Callfile;
};

const CallReportTables: React.FC<ComponentsProps> = ({
  totalAccounts,
  reportsData,
  callfile,
}) => {
  const allAccountsReportDataCount = reportsData
    .map((x) => x.count)
    .reduce((t, v) => t + v);
  const allAccountsReportDataAmount = reportsData
    .map((x) => x.amount)
    .reduce((t, v) => t + v);

  const positive = [
    "PTP",
    "FFUP",
    "UNEG",
    "RTP",
    "PAID",
    "DISP",
    "LM",
    "HUP",
    "WN",
  ];

  const positiveCalls =
    reportsData && reportsData?.length > 0
      ? reportsData?.filter((x) => positive.includes(x.code))
      : [];
  const negativeCalls =
    reportsData && reportsData?.length > 0
      ? reportsData?.filter((x) => !positive.includes(x.code))
      : [];
  const negativeTotalPrincipal =
    callfile?.totalPrincipal -
    (positiveCalls.length > 0
      ? positiveCalls?.map((x) => x.amount)?.reduce((t, v) => t + v)
      : 0);
  const filteredPositive =
    positiveCalls?.length > 0
      ? positiveCalls?.map((y) => y.count)?.reduce((t, v) => t + v)
      : [];

  const totalNegativeCount = totalAccounts - Number(filteredPositive);

  return (
    <>
      <div className=" w-full text-xs 2xl:text-base">
        <div className=" w-full shadow-md">
          <div className="grid bg-orange-500 border-t border-x border-orange-800 items-center text-center  rounded-t-md uppercase  grid-cols-3 font-black uppercase">
            <div className="w-full border-r py-1 border-orange-800 ">
              Total Endorsement
            </div>
            <div className="w-full border-r py-1 border-orange-800">
              Total Principal
            </div>
            <div className="w-full py-1 ">Contactable Rate</div>
          </div>
          <div className="grid bg-orange-400 border border-orange-800 items-center text-center  rounded-b-md uppercase  grid-cols-3 font-black uppercase">
            <div className="w-full border-r flex justify-center border-orange-800 h-full text-center items-center">
              {totalAccounts ?? 0}
            </div>
            <div className="w-full border-r flex justify-center border-orange-800 h-full text-center items-center">
              {callfile?.totalPrincipal?.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              }) ??
                (0).toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
            </div>
            <div className="w-full py-1 flex justify-center text-center">
              {(
                (Number(filteredPositive) / Number(totalAccounts)) *
                100
              ).toFixed(2)}
              %
            </div>
          </div>
        </div>
      </div>

      <div className=" 2xl:text-base text-xs text-black">
        <div className="text-center ">
          <div
            className=" py-1 uppercase border-yellow-800  font-black text-sm  w-full bg-yellow-400  rounded-t-md border"
          >
            Calling Status
          </div>
          <div className=" grid grid-cols-2 border-x border-b border-yellow-800 items-center">
            <div className="w-full py-0.5  bg-yellow-300 h-full text-black font-black uppercase ">
              Positive Call
            </div>
            <div className="w-full py-0.5 border-l border-yellow-800 bg-yellow-300 h-full text-black font-black uppercase ">
              Negative Calls
            </div>
          </div>
          <div className=" grid grid-cols-2 bg-yellow-300 rounded-b-md shadow-md  border-yellow-800 border-b border-x">
            <div className="py-0.5  border-yellow-800 text-slate-900 font-black uppercase">
              {filteredPositive}
            </div>
            <div className=" text-slate-900 border-l border-yellow-800 font-black uppercase">
              {Number(callfile?.totalAccounts) - Number(filteredPositive)}
            </div>
          </div>
        </div>
      </div>

      <div className="2xl:text-base text-sm shadow-md">
        <div className="border-collapse">
          <div>
            <div
              className=" py-1 bg-blue-500 border-blue-800 font-black rounded-t-md border-t-md border uppercase  text-black text-center"
            >
              Positive Calls Status
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-black border-x  border-blue-800 gap-2 text-[8px] md:text-xs md:font-black font-semibold items-center text-center justify-center bg-blue-400 uppercase grid grid-cols-5">
            <div className="border-r truncate border-blue-800 h-full items-center flex justify-center">Disposition</div>
            <div className="border-r truncate border-blue-800 h-full items-center flex justify-center">Count</div>
            <div className="border-r truncate border-blue-800 h-full items-center flex justify-center whitespace-nowrap ">Count Percentage</div>
            <div className="border-r truncate border-blue-800 h-full flex items-center justify-center ">Total Principal</div>
            <div className="truncate py-1 items-center flex justify-center" title="Principal Percentage" >Principal Percentage</div>
          </div>
          {positiveCalls?.map((x, index) => {
            const reducerPositiveCallsAmount =
              positiveCalls.length > 0
                ? positiveCalls.map((x) => x.amount).reduce((t, v) => t + v)
                : 0;
            const reducerPositiveCallsCount =
              positiveCalls.length > 0
                ? positiveCalls.map((y) => y.count).reduce((t, v) => t + v)
                : 0;
            const principalPercent =
              (x.amount / reducerPositiveCallsAmount) * 100;
            const countPersent =
              (Number(x.count) / Number(reducerPositiveCallsCount)) * 100;
            return (
              <div key={index}
                className="grid grid-cols-5 even:bg-blue-200 gap-2 text-[8px] md:text-xs md:font-black font-semibold border-blue-800 border-t border-x bg-blue-100"
              >
                <div className=" border-blue-800 border-r flex items-center justify-center">{x.name}</div>
                <div className=" border-blue-800 border-r flex items-center justify-center">{x.count}</div>
                <div className=" border-blue-800 border-r flex items-center justify-center">
                  {countPersent.toFixed(2)}%
                </div>
                <div className=" border-blue-800 border-r flex items-center justify-center">
                  {x.amount.toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </div>
                <div className=" py-1">
                  {principalPercent.toFixed(2)}%
                </div>
              </div>
            );
          })}
          <div className="rounded-b-md  text-[8px] md:text-xs md:font-black font-semibold bg-blue-200 border-x border-y uppercase gap-2 grid grid-cols-5">
            <div className=" text-green-600 py-1 border-r border-blue-800">
              Total
            </div>
            <div className="border-r border-blue-800 flex items-center justify-center">{filteredPositive}</div>
            <div className="border-r border-blue-800 flex items-center justify-center">100%</div>
            <div className="border-r border-blue-800 flex items-center justify-center">
              {positiveCalls.length > 0
                ? positiveCalls
                    ?.map((x) => x.amount)
                    .reduce((t, v) => t + v)
                    .toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })
                : (0).toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
            </div>
            <div className=" flex items-center justify-center">100%</div>
          </div>
        </div>
      </div>

      <div className="2xl:text-base shadow-md text-xs">
        <div className="border-collapse">
          <div>
            <div
              className=" rounded-t-md border  border-blue-800  text-sm font-black text-center uppercase py-1  bg-blue-500 text-black"
            >
              Negative Calls Status
            </div>
          </div>
        </div>
        <div className="text-center ">
          <div className="text-black  text-[8px] md:text-xs md:font-black font-semibold border-x bg-blue-400 border-blue-800 grid grid-cols-5 border-b uppercase">
            <div className="border-r border-blue-800  flex items-center justify-center">Disposition</div>
            <div className="border-r border-blue-800  flex items-center justify-center">Count</div>
            <div className="border-r border-blue-800  flex items-center justify-center">Count Percentage</div>
            <div className="border-r border-blue-800  flex items-center justify-center">Total Principal</div>
            <div className="py-1">Principal Percentage</div>
          </div>
          {negativeCalls?.map((x, index) => {
            const principalPercent = (x.amount / negativeTotalPrincipal) * 100;
            const countPersent =
              (Number(x.count) / Number(totalNegativeCount)) * 100;
            return (
              <div key={index} className="grid border-x border-b text-[8px] md:text-xs even:bg-blue-300 border-blue-800  uppercase font-semibold md:font-black bg-blue-200 grid-cols-5">
                <div className="border-r border-blue-800  flex items-center justify-center">{x.name}</div>
                <div className="border-r border-blue-800  flex items-center justify-center">{x.count}</div>
                <div className="border-r border-blue-800  flex items-center justify-center">
                  {countPersent.toFixed(2)}%
                </div>
                <div className="border-r border-blue-800  flex items-center justify-center">
                  {x.amount.toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </div>
                <div className=" flex items-center justify-center py-1">
                  {principalPercent.toFixed(2)}%
                </div>
              </div>
            );
          })}
          <div className="grid grid-cols-5  text-[8px] md:text-xs md:font-black font-semibold border-x bg-blue-300  " >
            <div className="border-r border-blue-800 items-center justify-center flex">NO DISPOSITION</div>
            <div className="border-r border-blue-800 items-center justify-center flex">
              {totalAccounts - Number(allAccountsReportDataCount)}
            </div>
            <div className="border-r border-blue-800 items-center justify-center flex">
              {(
                ((totalAccounts - Number(allAccountsReportDataCount)) /
                  totalNegativeCount) *
                100
              ).toFixed(2)}
              %
            </div>
            <td className="border-r  items-center justify-center flex border-blue-800">
              {(
                callfile.totalPrincipal - Number(allAccountsReportDataAmount)
              ).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
            </td>
            <div className=" py-1 items-center justify-center flex">
              {(
                ((callfile.totalPrincipal -
                  Number(allAccountsReportDataAmount)) /
                  negativeTotalPrincipal) *
                100
              ).toFixed(2)}
              %
            </div>
          </div>
          <div className=" text-[8px] bg-blue-200 border-t border-blue-800 border-b border-x rounded-b-md md:text-xs md:font-black font-semibold uppercase grid grid-cols-5">
            <div className="border-r text-green-800 border-blue-800 flex justify-center items-center">
              Total
            </div>
            <div className="border-r border-blue-800 flex justify-center items-center">{totalNegativeCount}</div>
            <div className="border-r border-blue-800 flex justify-center items-center">100%</div>
            <div className="border-r border-blue-800 flex justify-center items-center">
              {negativeTotalPrincipal.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              }) || 0}
            </div>
            <div className=" py-1  flex justify-center items-center">100%</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CallReportTables;
