import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RiArrowUpSFill } from "react-icons/ri";
import { VscLoading } from "react-icons/vsc";
import GroupSection from "./GroupSection";
import TaskDispoSection from "./TaskDispoSection";
import AgentSection from "./AgentSection";
import { RootState, useAppDispatch } from "../../redux/store";
import {
  setAgent,
  setSelectedDisposition,
  setSelectedGroup,
  setTasker,
  setTaskFilter,
  Tasker,
  TaskFilter,
} from "../../redux/slices/authSlice";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

type DispositionTypes = {
  id: string;
  name: string;
  code: string;
};

const GET_ALL_DISPOSITION_TYPE = gql`
  query GetDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`;
type Bucket = {
  _id: string;
  name: string;
};

const BUCKETS = gql`
  query GetTLBucket {
    getTLBucket {
      _id
      name
    }
  }
`;

const TaskManagerView = () => {
  const dispatch = useAppDispatch();
  const { tasker, taskFilter, selectedDisposition } = useSelector(
    (state: RootState) => state.auth
  );
  const { data: DispositionTypes, refetch, loading: dispoLoading } = useQuery<{
    getDispositionTypes: DispositionTypes[];
  }>(GET_ALL_DISPOSITION_TYPE, { notifyOnNetworkStatusChange: true });
  const { data: bucketData, refetch: tlBucketRefetch, loading: bucketLoading } = useQuery<{
    getTLBucket: Bucket[];
  }>(BUCKETS, { notifyOnNetworkStatusChange: true });
  const [bucketSelect, setBucketSelect] = useState<
    keyof typeof bucketObject | ""
  >("");

  const segmentToggle = (
    options: { label: string; value: string }[],
    active: string,
    onSelect: (value: string) => void
  ) => {
    const index = options.findIndex((opt) => opt.value === active);
    const clampedIndex = index >= 0 ? index : 0;
    const isFirst = clampedIndex === 0;

    return (
      <div className="overflow-hidden w-full shadow-md uppercase relative border border-black rounded-b-md flex text-sm font-black">
        <motion.div
          initial={{ x: 0, opacity: 0, width: "50%" }}
          animate={{ x: isFirst ? "0%" : "100%", opacity: 1, width: "50%" }}
          className={`" ${
            isFirst
              ? "border-r border-blue-900 bg-blue-400"
              : "border-l border-blue-900 bg-blue-400"
          } left-0 top-0 z-10 h-full absolute "`}
        ></motion.div>
        <div className="flex z-20 w-full">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`" ${active === opt.value ? "text-black" : " text-gray-400"} w-1/2 text-center text-black px-3 py-2 cursor-pointer "`}
              onClick={() => onSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const timer = async () => {
      await refetch();
      await tlBucketRefetch();
    };
    timer();
  }, []);

  const bucketObject: { [key: string]: string } = useMemo(() => {
    const tlBuckets = bucketData?.getTLBucket || [];
    return Object.fromEntries(tlBuckets.map((e) => [e.name, e._id]));
  }, [bucketData]);

  useEffect(() => {
    if (bucketData) {
      const first = bucketData.getTLBucket[0];
      if (first) {
        setBucketSelect(first.name);
      }
    }
  }, [bucketData]);

  useEffect(() => {
    dispatch(setSelectedGroup(""));
    dispatch(setAgent(""));
  }, [tasker, dispatch]);

  const handleCheckBox = useCallback(
    (value: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const dispositions = selectedDisposition || [];
      if (e.target.checked) {
        dispatch(setSelectedDisposition([...dispositions, value]));
      } else {
        dispatch(
          setSelectedDisposition(dispositions.filter((d) => d !== value))
        );
      }
    },
    [selectedDisposition, dispatch]
  );

  const [showSelection, setShowSelection] = useState<boolean>(false);

  const onClick = useCallback(() => {
    setShowSelection(!showSelection);
  }, [setShowSelection, showSelection]);

  const [dpd, setDpd] = useState<number | null>(null);
  const [searchName, setSearchName] = useState<string | null>(null);

  const isLoading = dispoLoading || bucketLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <VscLoading className="animate-spin text-4xl text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-h-[90dvh] h-full w-full grid grid-cols-3 p-5 gap-2 relative overflow-hidden">
      <motion.div className=" h-[95%] flex flex-col gap-10 items-start"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-gray-200 overflow-auto w-full h-full flex flex-col p-5 border rounded-md shadow-md ">  
          <div className=" flex  gap-2 lg:text-[0.6em] 2xl:text-xs w-full flex-col">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col bg-gray-300">
                <div className="font-black bg-blue-500 py-2 border-x border-t rounded-t-md text-center text-sm uppercase text-black px-1">
                  Tasker
                </div>
                {segmentToggle(
                  [
                    { label: "Group", value: Tasker.group },
                    { label: "Individual", value: Tasker.individual },
                  ],
                  tasker,
                  (val) => dispatch(setTasker(val))
                )}
              </div>

              <div className="flex flex-col bg-gray-300">
                <div className="font-black bg-blue-500 py-2 border-x border-t rounded-t-md text-sm text-center uppercase text-black px-1">
                  Tasks Filter
                </div>
                {segmentToggle(
                  [
                    { label: "Assigned", value: TaskFilter.assigned },
                    { label: "Unassigned", value: TaskFilter.unassigned },
                  ],
                  taskFilter,
                  (val) => dispatch(setTaskFilter(val))
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-base" >Disposition:</div>
              <div
                className="w-full border bg-white cursor-pointer shadow-sm  rounded-md h-10 border-black relative z-50"
                title={selectedDisposition?.toString()}
              >
                <RiArrowUpSFill
                  className={`"  ${
                    showSelection ? "rotate-180" : "rotate-90"
                  }  absolute right-2 top-2 text-2xl transition-all "`}
                  onClick={onClick}
                />
                <div
                  className="w-full h-full px-2 font-bold uppercase truncate text-black flex text-sm items-center"
                  onClick={onClick}
                >
                  {selectedDisposition?.length > 0
                    ? selectedDisposition?.toString()
                    : "Select Disposition"}
                </div>
                <AnimatePresence>
                  {showSelection && (
                    <motion.div
                      className="w-full max-h-60  border overflow-y-auto absolute top-10 flex rounded-md mt-1 shadow-md text-xs flex-col border-black bg-white"
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                    >
                      {DispositionTypes?.getDispositionTypes
                        .filter((e) => e.name !== "PAID")
                        .map((e) => (
                          <label
                            key={e.id}
                            className="flex gap-2 text-black border-b border-gray-300 font-black even:bg-gray-100 px-2 py-3"
                          >
                            <input
                              type="checkbox"
                              name={e.name}
                              id={e.name}
                              value={e.name}
                              checked={selectedDisposition?.includes(e.name)}
                              onChange={(e) =>
                                handleCheckBox(e.target.value, e)
                              }
                            />
                            <p>{e.name}</p>
                          </label>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {showSelection && (
                <div
                  onClick={() => setShowSelection(false)}
                  className=" z-20 absolute top-0 left-0 w-full h-full"
                ></div>
              )}
              <div className="mb-2"
              >
                <div className="text-base" >Campaign: </div>
                <select
                  className="w-full py-2 bg-white cursor-pointer shadow-sm text-sm border rounded-md border-black font-bold text-black px-1"
                  name="bucket"
                  id="bucket"
                  value={bucketSelect}
                  onChange={(e) => setBucketSelect(e.target.value)}
                >
                  {bucketData?.getTLBucket.map((e) => (
                    <option
                      className="rounded-md mt-10"
                      key={e._id}
                      value={e.name}
                    >
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <div
                  className=""
                >
                  <label>
                    <input
                      type="number"
                      className="w-15 text-sm bg-white pl-4 h-10 shadow-sm border border-black focus:outline-none rounded-md font-normal text-black px-1"
                      name="dpd"
                      id="dpd"
                      min={0}
                      value={dpd ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDpd(val === "" ? null : Number(val));
                      }}
                    />
                  </label>
                </div>
                <div
                  className=" w-full"
                >
                  <label>
                    <input
                      type="text"
                      className="w-full bg-white text-sm pl-4 h-10 shadow-sm border border-black focus:outline-none rounded-md font-normal text-black px-1"
                      name="searchName"
                      id="searchName"
                      placeholder="Enter Customer Name..."
                      autoComplete="off"
                      value={searchName ?? ""}
                      onChange={(e) => {
                        const val =
                          e.target.value.trim() === "" ? null : e.target.value;
                        setSearchName(val);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          {tasker === "group" ? (
            <GroupSection />
          ) : (
            <AgentSection
              bucket={String(
                bucketObject[bucketSelect] as keyof typeof bucketObject
              )}
            />
          )}
        </div>
      </motion.div>
      <div className="col-span-2 h-full max-h-[90dvh]">
        <TaskDispoSection
          selectedBucket={bucketObject[bucketSelect] || null}
          dpd={dpd}
          searchName={searchName}
        />
      </div>
    </div>
  );
};

export default TaskManagerView;
