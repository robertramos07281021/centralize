import React from "react";

type DispositionType = {
  name: string;
  code: string;
  count: string;
  amount: number;
};
type ComponentProp = {
  totalAccounts: number;
  dispo: DispositionType[];
  firstTitle: string;
  secondTitle: string;
  color: string;
};

const ReportsTables: React.FC<ComponentProp> = ({
  totalAccounts,
  dispo,
  secondTitle,
  firstTitle,
  color,
}) => {
  const sortedDispo = [...dispo].sort(
    (a, b) => Number(b.count) - Number(a.count)
  );
  const totalCount = [...dispo].map((x) => x.count)?.reduce((t, v) => t + v);
  const totalAmount = [...dispo].map((x) => x.amount)?.reduce((t, v) => t + v);

  const colorObject: { [key: string]: string } = {
    indigo: "bg-indigo-500",
    cyan: "bg-cyan-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-300",
  };

  return (
    <>
      <div className=" flex-col flex shadow-md border-black w-full text-sm 2xl:text-lg">
        <div
          className={`w-full py-0.5 ${
            colorObject[color as keyof typeof colorObject]
          } font-black uppercase rounded-t-md text-center py-2 border-indigo-700 border`}
        >
          {firstTitle}
        </div>
        <div className="text-center grid grid-rows-2 w-full">
          <div className="grid grid-cols-2 items-center border-x  text-[10px] md:text-sm font-semibold md:font-black border-indigo-700 uppercase bg-indigo-400 w-full">
            <div
              className={`w-full border-r border-indigo-700 py-1 h-full
               `}
            >
              Response Count
            </div>
            <div
              className={`w-full  
              `}
            >
              Not Responded
            </div>
          </div>
          <div className="grid grid-cols-2 bg-indigo-300 border-y rounded-b-md items-center  text-[10px] md:text-sm font-semibold md:font-black border-b border-indigo-700 border-x">
            <div className="h-full items-center flex justify-center border-r border-indigo-700 ">
              {totalCount}
            </div>
            <div className="">
              {totalAccounts - Number(totalCount)}
            </div>
          </div>
        </div>
      </div>
      <div className="2xl:text-lg shadow-md text-sm">
        <div>
          <div>
            <div
              className={`border font-black text-center border-indigo-700 uppercase py-2 rounded-t-md ${
                colorObject[color as keyof typeof colorObject]
              }`}
            >
              {secondTitle}
            </div>
          </div>
        </div>
        <div className="w-full" >
          <div className="text-black border-b text-[10px] md:text-sm font-semibold md:font-black items-center justify-center text-center bg-indigo-400 border-x border-indigo-700 text-xs px-3 uppercase grid grid-cols-5 w-full ">
            <div className="border-r h-full items-center flex justify-center border-indigo-700">Disposition</div>
            <div className="border-r h-full items-center flex justify-center border-indigo-700">Count</div>
            <div className="truncate border-r h-full items-center flex justify-center border-indigo-700" title="Count Percentage">Count Percentage</div>
            <div className="truncate border-r h-full items-center flex justify-center  border-indigo-700" title="Total Principal" >Total Principal</div>
            <div className="truncate py-2 text-center px-2" title="Principal Percentage" >Principal Percentage</div>
          </div>
          {sortedDispo.map((x, index) => {
            const totalAmount =
              (x.amount /
                sortedDispo.map((x) => x.amount).reduce((t, v) => t + v)) *
              100;
            return (
              <div key={index} className="text-center text-[10px] md:text-sm font-semibold md:font-black border-b text-xs bg-indigo-200 px-3 border-x border-indigo-700 grid grid-cols-5 ">
                <div className="border-r h-full items-center flex justify-center border-indigo-700">{x.name}</div>
                <div className="border-r h-full items-center flex justify-center border-indigo-700">{x.count}</div>
                <div className="border-r h-full items-center flex justify-center border-indigo-700">
                  {((Number(x.count) / Number(totalCount)) * 100).toFixed(2)}%
                </div>
                <div className="border-r h-full items-center flex justify-center border-indigo-700">
                  {x.amount.toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  })}
                </div>
                <div className="py-1 h-full items-center flex justify-center border-indigo-700">
                  {totalAmount.toFixed(2)}%
                </div>
              </div>
            );
          })}
          <div className="text-center text-[10px] md:text-sm font-semibold md:font-black border-x border-b border-indigo-700 rounded-b-md uppercase items-center  justify-center px-3 bg-indigo-100 grid grid-cols-5">
            <div className="border-r text-green-700 text-shadow-2xs h-full items-center flex justify-center border-indigo-700">
              Total
            </div>
            <div className="border-r h-full items-center flex justify-center border-indigo-700">{totalCount}</div>
            <div className="border-r h-full items-center flex justify-center border-indigo-700">100%</div>
            <div className="border-r h-full items-center flex justify-center border-indigo-700">
              {totalAmount.toLocaleString("en-PH", {
                style: "currency",
                currency: "PHP",
              })}
            </div>
            <div className="py-1">100%</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportsTables;
