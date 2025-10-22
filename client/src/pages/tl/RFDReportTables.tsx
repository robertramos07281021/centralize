type RFD = {
  _id: string;
  count: number;
};

type ComponentProp = {
  RFD: RFD[];
};

const RFDReportTables: React.FC<ComponentProp> = ({ RFD }) => {
  return (
    <div className="w-full 2xl:text-base shadow-md text-xs">
      <div>
        <div>
          <div
            className="border border-blue-800 rounded-t-md text-sm text-black font-black text-center w-full py-2 bg-blue-500"
          >
            EOD
          </div>
        </div>
      </div>
      <div className="text-center">
        <div className=" text-[10px] md:text-sm font-semibold md:font-black border-b uppercase items-center justify-center text-black border-x border-blue-800  grid grid-cols-3 bg-blue-400">
          <div className="border-r border-blue-800 items-center flex justify-center h-full">
            Reason For Delay
          </div>
          <div className="border-r border-blue-800 items-center flex justify-center h-full">
            Count
          </div>
          <div className="py-1">Percentage</div>
        </div>
        {RFD.map((x, index) => {
          const filter = RFD.filter((x) => x._id !== null);
          const totals =
            filter.length > 0
              ? filter.map((x) => x.count).reduce((t, v) => t + v)
              : 0;
          const percents = (x.count / totals) * 100;
          return (
            x._id && (
              <div
                key={index}
                className=" text-[10px] md:text-sm font-semibold md:font-black uppercase border-x border-blue-800 border-b grid bg-blue-300 text-black grid-cols-3 text-center"
              >
                <div className="border-r border-blue-800 items-center flex justify-center h-full">{x._id}</div>
                <div className="border-r border-blue-800 items-center flex justify-center h-full">{x.count}</div>
                <div className="py-1">
                  {percents.toFixed(2)}%
                </div>
              </div>
            )
          );
        })}
        <div className={`" grid grid-cols-3 border-x border-b border-blue-800 rounded-b-md text-[10px] md:text-sm font-semibold md:font-black  bg-blue-200 uppercase "`}>
          <div className="border-r text-green-700 text-shadow-sm border-blue-800 items-center flex justify-center h-full">
            Total
          </div>
          <div className="border-r border-blue-800 items-center flex justify-center h-full">
            {RFD.length > 1
              ? RFD?.filter((x) => x._id !== null)
                  ?.map((x) => x.count)
                  ?.reduce((t, v) => t + v)
              : 0}
          </div>
          <div className="py-1">100%</div>
        </div>
      </div>
    </div>
  );
};

export default RFDReportTables;
