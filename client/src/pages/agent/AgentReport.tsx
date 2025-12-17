import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useRef, useState } from "react";
import { FaDownload } from "react-icons/fa6";
import ReportsComponents, {
  ReportsComponentsHandle,
} from "./ReportsComponents";
import { motion } from "framer-motion";

type DispositionType = {
  id: string;
  name: string;
  code: string;
};


const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`;
  
const formatDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AgentReport = () => {
  const { data: dispotypeData } = useQuery<{
    getDispositionTypes: DispositionType[];
  }>(GET_DISPOSITION_TYPES);


  const [selectedDispoAgent, setSelectedDispoAgent] = useState<string[]>([]);
  const reportsRef = useRef<ReportsComponentsHandle>(null);

  const handleCheckeDisposition = (
    value: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.checked) {
      setSelectedDispoAgent((prev) =>
        prev.includes(value) ? prev : [...prev, value]
      );
    } else {
      setSelectedDispoAgent((prev) => prev.filter((item) => item !== value));
    }
  };

  const [date, setDate] = useState<{ from: string; to: string }>(() => {
    const today = new Date();
    const formatted = formatDate(today);
    return { from: formatted, to: formatted };
  });
  const allSelected =
    (dispotypeData?.getDispositionTypes.length || 0) > 0 &&
    dispotypeData?.getDispositionTypes.length === selectedDispoAgent.length;

  return (
    <div className="flex flex-row h-full max-h-[90vh] p-10 gap-2">
      <motion.div
        className="bg-gray-300 max-w-[500px] overflow-hidden w-full flex flex-col font-black text-black border rounded-md shadow-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="text-center items-center flex justify-center border-b h-[8.4%] p-3 bg-gray-400 font-black uppercase w-full text-2xl">
          Agent Report
        </div>
        <div className="px-3 flex flex-col h-[91.6%] pb-3 gap-3 overflow-auto">
          <div className="flex flex-col gap-2 h-[70%]">
            <div className="uppercase text-center mt-2  ">Disposition Types</div>
            <div className="bg-white max-h-full border rounded-sm shadow-sm p-2 flex flex-col gap-2  overflow-y-auto">
              <label className="flex cursor-pointer gap-2 px-2 py-1 rounded-sm border hover:bg-gray-100 bg-gray-50 text-sm items-center">
                <input
                  type="checkbox"
                  name="all"
                  id="all"
                  onChange={(e) => {
                    if (e.target.checked) {
                      const dispotype: string[] =
                        dispotypeData?.getDispositionTypes.map((y) => y.id) || [];
                      setSelectedDispoAgent(dispotype);
                    } else {
                      setSelectedDispoAgent([]);
                    }
                  }}
                  checked={allSelected}
                />
                <span className="select-none text-md uppercase  ">Select All</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dispotypeData?.getDispositionTypes.map((dispotype, index) => {
                  const isChecked = selectedDispoAgent.includes(dispotype.id);
                  return (
                    <motion.label
                      key={dispotype.id}
                      className={`flex gap-2 px-2 py-2 rounded-sm border text-sm cursor-pointer transition-colors shadow-sm ${
                        isChecked
                          ? "bg-blue-100 border-blue-400"
                          : "bg-gray-50 hover:bg-gray-100 border-black"
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <input
                        type="checkbox"
                        name={dispotype.name}
                        id={dispotype.name}
                        onChange={(e) => handleCheckeDisposition(dispotype.id, e)}
                        checked={isChecked}
                      />
                      <span className="select-none truncate">
                        {dispotype.name} - {dispotype.code}
                      </span>
                    </motion.label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid items-center grid-cols-3 gap-2 mt-2">
            <div className="uppercase text-right mr-2">Date from:</div>
            <input
              className="col-span-2 border bg-gray-200 rounded-sm px-3 py-2 cursor-pointer shadow-md"
              type="date"
              name="from"
              id="from"
              onChange={(e) => setDate({ ...date, from: e.target.value })}
              value={date.from}
            />
          </div>

          <div className="grid items-center grid-cols-3 gap-2">
            <div className="uppercase text-right mr-2">Date to:</div>
            <input
              className="col-span-2 border bg-gray-200 rounded-sm px-3 py-2 cursor-pointer shadow-md"
              type="date"
              name="to"
              id="to"
              onChange={(e) => setDate({ ...date, to: e.target.value })}
              value={date.to}
            />
          </div>

          <div className="flex justify-end mt-auto">
            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => reportsRef.current?.exportDispositions()}
            >
              <div className="flex items-center gap-3 rounded-sm border-2 border-blue-800 px-4 hover:bg-blue-600 duration-200 ease-in-out cursor-pointer py-2 bg-blue-500 text-white font-bold uppercase">
                Export <FaDownload />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="h-full flex flex-col w-full bg-gray-300 border overflow-hidden rounded-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.05 }}
      >
        <div className="font-black h-[8.4%] items-center flex justify-center relative uppercase text-center text-2xl py-3 border-b bg-gray-400">
          <div>Report Preview</div>
        </div>
        <div className="h-[91.6%] bg-gray-200 overflow-auto">
          <div className="h-full rounded-sm shadow-sm overflow-hidden">
            <ReportsComponents
              ref={reportsRef}
              dispositions={selectedDispoAgent}
              from={date.from}
              to={date.to}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AgentReport;
