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
          <div className="grid bg-orange-500 border-t border-x border-orange-800 items-center text-center  rounded-t-md uppercase  grid-cols-3 font-black">
            <div className="w-full border-r py-1 border-orange-800 ">
              Total Endorsement
            </div>
            <div className="w-full border-r py-1 border-orange-800">
              Total Principal
            </div>
            <div className="w-full py-1 ">Contactable Rate</div>
          </div>
          <div className="grid bg-orange-400 border border-orange-800 items-center text-center  rounded-b-md uppercase  grid-cols-3 font-black">
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
        <div className="text-center">
          <div
            className=" py-1 uppercase border-yellow-800  font-black text-sm  w-full bg-yellow-400  rounded-t-md border"
          >
            Calling Status
          </div>
          <div className="border-black border">
            <div className="w-50 py-0.5 bg-blue-600 text-white border-black border font-medium ">
              Positive Call
            </div>
            <div className="w-50 border-black border bg-blue-600 text-white font-medium">
              Negative Calls
            </div>
          </div>
          <tr className="border-black border">
            <td className="py-0.5 border text-slate-900 font-medium">
              {filteredPositive}
            </td>
            <td className="border text-slate-900 font-medium">
              {Number(callfile?.totalAccounts) - Number(filteredPositive)}
            </td>
          </tr>
        </div>
      </div>

      <table className="2xl:text-base text-xs">
        <thead className="border-collapse border border-black">
          <tr>
            <th
              colSpan={5}
              className="border border-black py-1 bg-blue-600 text-white"
            >
              Positive Calls Status
            </th>
          </tr>
        </thead>
        <tbody className="text-center">
          <tr className="text-gray-700">
            <th className="border border-black">Disposition</th>
            <th className="border border-black">Count</th>
            <th className="border border-black">Count Percentage</th>
            <th className="border border-black">Total Principal</th>
            <th className="border border-black">Principal Percentage</th>
          </tr>
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
              <tr key={index}>
                <td className="border border-black">{x.name}</td>
                <td className="border border-black">{x.count}</td>
                <td className="border border-black">
                  {countPersent.toFixed(2)}%
                </td>
                <td className="border border-black">
                  {x.amount.toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </td>
                <td className="border border-black">
                  {principalPercent.toFixed(2)}%
                </td>
              </tr>
            );
          })}
          <tr className="font-medium">
            <th className="border border-black bg-green-600 text-white">
              Total
            </th>
            <td className="border border-black">{filteredPositive}</td>
            <td className="border border-black">100%</td>
            <td className="border border-black">
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
            </td>
            <td className="border border-black">100%</td>
          </tr>
        </tbody>
      </table>

      <table className="2xl:text-base text-xs">
        <thead className="border-collapse border border-black">
          <tr>
            <th
              colSpan={5}
              className="border py-1 border-black bg-blue-600 text-white"
            >
              Negative Calls Status
            </th>
          </tr>
        </thead>
        <tbody className="text-center">
          <tr className="text-gray-700">
            <th className="border border-black">Disposition</th>
            <th className="border border-black">Count</th>
            <th className="border border-black">Count Percentage</th>
            <th className="border border-black">Total Principal</th>
            <th className="border border-black">Principal Percentage</th>
          </tr>
          {negativeCalls?.map((x, index) => {
            const principalPercent = (x.amount / negativeTotalPrincipal) * 100;
            const countPersent =
              (Number(x.count) / Number(totalNegativeCount)) * 100;
            return (
              <tr key={index}>
                <td className="border border-black">{x.name}</td>
                <td className="border border-black">{x.count}</td>
                <td className="border border-black">
                  {countPersent.toFixed(2)}%
                </td>
                <td className="border border-black">
                  {x.amount.toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </td>
                <td className="border border-black">
                  {principalPercent.toFixed(2)}%
                </td>
              </tr>
            );
          })}
          <tr>
            <td className="border border-black">NO DISPOSITION</td>
            <td className="border border-black">
              {totalAccounts - Number(allAccountsReportDataCount)}
            </td>
            <td className="border border-black">
              {(
                ((totalAccounts - Number(allAccountsReportDataCount)) /
                  totalNegativeCount) *
                100
              ).toFixed(2)}
              %
            </td>
            <td className="border border-black">
              {(
                callfile.totalPrincipal - Number(allAccountsReportDataAmount)
              ).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}
            </td>
            <td className="border border-black">
              {(
                ((callfile.totalPrincipal -
                  Number(allAccountsReportDataAmount)) /
                  negativeTotalPrincipal) *
                100
              ).toFixed(2)}
              %
            </td>
          </tr>
          <tr className="font-medium">
            <th className="border border-black bg-green-600 text-white">
              Total
            </th>
            <td className="border border-black">{totalNegativeCount}</td>
            <td className="border border-black">100%</td>
            <td className="border border-black">
              {negativeTotalPrincipal.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              }) || 0}
            </td>
            <td className="border border-black">100%</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default CallReportTables;
