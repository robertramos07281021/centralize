import { motion } from "framer-motion";

type ColumnInputGridProps = {
  inputClassName?: string;
};

const ColumnInputGrid = ({ inputClassName = "" }: ColumnInputGridProps) => (
  <div className="grid h-full w-full grid-cols-6 items-center border-black">
    {Array.from({ length: 6 }).map((_, idx) => (
      <div
        key={idx}
        className="border-r border-black last:border-r-0 flex items-center justify-center px-1 py-1"
      >
        <input
          className={`w-full truncate outline-none bg-transparent ${inputClassName}`}
        />
      </div>
    ))}
  </div>
);

const UBScoreCard = () => {
  return (
    <div className="p-10 flex flex-col  text-black w-full h-full">
      <motion.div
        className="border flex rounded-md overflow-hidden flex-col h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className=" font-black border-b  uppercase bg-gray-400 text-2xl text-center py-3 w-full text-black">
          COLLECTION CALL PERFORMANCE MONITOR
        </div>

        <div className="bg-gray-300 p-5 flex flex-col h-full">
          <div className="flex justify-between">
            <div className="grid grid-cols-4 w-full items-start gap-2">
              <div className="border overflow-hidden rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-rows-2 border-b">
                  <div className="bg-gray-400 rounded-tl px-5 border-b py-1">
                    For the month
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
                <div className="grid grid-rows-2 border-b">
                  <div className="bg-gray-400  px-5 border-b py-1">
                    Collection officer
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
                <div className="grid grid-rows-2 ">
                  <div className="bg-gray-400 px-5 border-b py-1">
                    Evaluator
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
              </div>
              <div className="flex items-end">
                <div className=" text-sm truncate px-3 gap-2.5 flex flex-col">
                  <div className="">Call 1</div>
                  <div className="">Call 2</div>
                  <div className="">Call 3</div>
                  <div className="">Call 4</div>
                  <div className="">Call 5</div>
                </div>
                <div className="text-sm w-full flex flex-col shadow-md rounded-sm font-black uppercase">
                  <div className="bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1">
                    Account Name/Account Number
                  </div>
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x rounded-b-md border-b outline-none" />
                </div>
              </div>

              <div className="text-sm flex flex-col shadow-md rounded-sm font-black uppercase">
                <div className="bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1">
                  Date and Time of Call
                </div>
                <input className="py-1 pl-3 border-x border-b outline-none" />
                <input className="py-1 pl-3 border-x border-b outline-none" />
                <input className="py-1 pl-3 border-x border-b outline-none" />
                <input className="py-1 pl-3 border-x border-b outline-none" />
                <input className="py-1 pl-3 border-x rounded-b-md border-b outline-none" />
              </div>

              <div className="flex w-full gap-2">
                <div className="text-sm flex flex-col shadow-md rounded-sm font-black uppercase">
                  <div className="bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1">
                    Date of Logger Review
                  </div>
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x rounded-b-md border-b outline-none" />
                </div>
                <div className="text-sm truncate flex flex-col shadow-md rounded-sm font-black uppercase">
                  <div
                    className="bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1"
                    title="1st Call"
                  >
                    1st Call
                  </div>
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x rounded-b-md border-b outline-none" />
                </div>
                <div className="text-sm truncate flex flex-col shadow-md rounded-sm font-black uppercase">
                  <div
                    className="bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1"
                    title="Lat Call"
                  >
                    Lat Call
                  </div>
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x rounded-b-md border-b outline-none" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="mt-1 flex">
              <div className="w-full"></div>
              <div className="grid px-2 text-center w-full truncate grid-cols-6">
                <div>DEFECT</div>
                <div>CALL 1</div>
                <div>CALL 2</div>
                <div>CALL 3</div>
                <div>CALL 4</div>
                <div>CALL 5</div>
              </div>
            </div>

            <div className="flex h-auto flex-col">
              <div className="w-full bg-gray-400 px-3 py-1 rounded-t-md border">
                A. OPENING
              </div>
              <div className=" h-full flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate"
                  title="
                  Used appropriate greeting / Identified self and Agency (full
                  Agency name)"
                >
                  Used appropriate greeting / Identified self and Agency (full
                  Agency name)
                </div>
                <ColumnInputGrid />
              </div>

              <div className=" h-full flex border-x border-b ">
                <div className="w-full pl-3 py-1 border-r truncate">
                  Mentioned UBP Disclaimer spiel
                </div>
                <ColumnInputGrid />
              </div>
              <div className=" h-full flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="
                  Mentioned Line is Recorded"
                >
                  Mentioned Line is Recorded
                </div>
                <ColumnInputGrid inputClassName="whitespace-nowrap" />
              </div>
              <div className="h-full flex flex-row border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate"
                  title="
                  Mentioned CH/ Valid CP/Y's Full Name for outgoing calls to a registered number. Asked correct Positive Identifiers for incoming calls & calls to unregistered number.
                "
                >
                  Mentioned CH/ Valid CP/Y's Full Name for outgoing calls to a
                  registered number. Asked correct Positive Identifiers for
                  incoming calls & calls to unregistered number.
                </div>
                <ColumnInputGrid />
              </div>
              <div className=" h-full flex rounded-b-md shadow-md border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r "
                  title="  Properly identified self, mentioned first and last name to CH/Valid CP/Y"
                >
                  Properly identified self, mentioned first and last name to CH/
                  Valid CP/Y
                </div>
                <ColumnInputGrid />
              </div>
            </div>

            <div className="flex h-auto flex-col">
              <div className="w-full bg-gray-400 px-3 py-1 rounded-t-md border">
                B. COLLECTION CALL PROPER
              </div>
              <div className=" h-full flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate"
                  title="
                  Used appropriate greeting / Identified self and Agency (full
                  Agency name)"
                >
                  Used appropriate greeting / Identified self and Agency (full
                  Agency name)
                </div>
                <ColumnInputGrid />
              </div>

              <div className=" h-full flex border-x border-b ">
                <div className="w-full pl-3 py-1 border-r truncate">
                  Mentioned UBP Disclaimer spiel
                </div>
                <ColumnInputGrid />
              </div>
              <div className=" h-full flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="
                  Mentioned Line is Recorded"
                >
                  Mentioned Line is Recorded
                </div>
                <ColumnInputGrid inputClassName="whitespace-nowrap" />
              </div>
              <div
                className="h-full flex flex-row border-x border-b "
                title="
                  Mentioned CH/ Valid CP/Y's Full Name for outgoing calls to a registered number. Asked correct Positive Identifiers for incoming calls & calls to unregistered number.
                "
              >
                <div className="w-full pl-3 py-1 border-r truncate">
                  Mentioned CH/ Valid CP/Y's Full Name for outgoing calls to a
                  registered number. Asked correct Positive Identifiers for
                  incoming calls & calls to unregistered number.
                </div>
                <ColumnInputGrid />
              </div>
              <div className=" h-full flex rounded-b-md shadow-md border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r "
                  title="  Properly identified self, mentioned first and last name to CH/Valid CP/Y"
                >
                  Properly identified self, mentioned first and last name to CH/
                  Valid CP/Y
                </div>
                <ColumnInputGrid />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UBScoreCard;
