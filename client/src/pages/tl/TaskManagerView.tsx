import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RiArrowUpSFill } from "react-icons/ri";
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
  const { data: DispositionTypes, refetch } = useQuery<{
    getDispositionTypes: DispositionTypes[];
  }>(GET_ALL_DISPOSITION_TYPE, { notifyOnNetworkStatusChange: true });
  const { data: bucketData, refetch: tlBucketRefetch } = useQuery<{
    getTLBucket: Bucket[];
  }>(BUCKETS, { notifyOnNetworkStatusChange: true });
  const [bucketSelect, setBucketSelect] = useState<
    keyof typeof bucketObject | ""
  >("");

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
      setBucketSelect(bucketData.getTLBucket[0].name);
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
  const [searchName,setSearchName] = useState<string | null>(null)

  return (
    <div className="h-full w-full relative flex flex-col overflow-hidden">
      <div className="flex gap-10 p-5 items-start">
        <div className=" flex gap-5 lg:text-[0.6em] 2xl:text-xs w-full flex-col">
          <div className="flex gap-2">
            <motion.fieldset
              className="flex p-1.5 gap-4 px-4 shadow-sm border rounded-md border-black"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
            >
              <legend className="font-black text-sm uppercase text-black px-2">
                Tasker
              </legend>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input
                  id="default-radio-1"
                  type="radio"
                  value={Tasker.group}
                  name="default-radio"
                  checked={tasker === Tasker.group}
                  onChange={(e) => dispatch(setTasker(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"
                />
                <span>Group</span>
              </label>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input
                  id="default-radio-2"
                  type="radio"
                  value={Tasker.individual}
                  name="default-radio"
                  checked={tasker === Tasker.individual}
                  onChange={(e) => dispatch(setTasker(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 "
                />
                <span>Individual</span>
              </label>
            </motion.fieldset>

            <motion.fieldset
              className="flex p-1.5 gap-4 px-4 shadow-sm border rounded-md border-black"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5, type: "spring" }}
            >
              <legend className="font-black uppercase  text-sm text-black px-2">
                Tasks Filter
              </legend>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input
                  id="default-radio-3"
                  type="radio"
                  value={TaskFilter.assigned}
                  name="default-radio-1"
                  checked={taskFilter === TaskFilter.assigned}
                  onChange={(e) => dispatch(setTaskFilter(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"
                />
                <span>Assigned</span>
              </label>
              <label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <input
                  id="default-radio-4"
                  type="radio"
                  value={TaskFilter.unassigned}
                  name="default-radio-1"
                  checked={taskFilter === TaskFilter.unassigned}
                  onChange={(e) => dispatch(setTaskFilter(e.target.value))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 "
                />
                <span>Unassigned</span>
              </label>
            </motion.fieldset>
          </div>
          <div className="flex gap-2">
            <motion.div
              className="w-1/2 border  cursor-pointer shadow-sm  rounded-md h-10 border-black relative z-50"
              title={selectedDisposition?.toString()}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
            >
              <RiArrowUpSFill
                className={`"  ${
                  showSelection ? "rotate-180" : "rotate-90"
                }  absolute right-2 top-2 text-2xl transition-all "`}
                onClick={onClick}
              />
              <div
                className="lg:w-60  2xl:w-80 h-full px-2 font-bold uppercase truncate text-black flex text-sm items-center"
                onClick={onClick}
              >
                {selectedDisposition?.length > 0
                  ? selectedDisposition?.toString()
                  : "Select Disposition"}
              </div>
              <AnimatePresence>
                {showSelection && (
                  <motion.div
                    className="w-full h-96  border overflow-y-auto absolute top-10 flex rounded-md mt-1 shadow-md text-xs flex-col border-black bg-white"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                  >
                    {DispositionTypes?.getDispositionTypes
                      .filter((e) => e.name !== "PAID")
                      .map((e) => (
                        <label
                          key={e.id}
                          className="flex gap-2 text-black font-black even:bg-gray-100 px-2 py-3"
                        >
                          <input
                            type="checkbox"
                            name={e.name}
                            id={e.name}
                            value={e.name}
                            checked={selectedDisposition?.includes(e.name)}
                            onChange={(e) => handleCheckBox(e.target.value, e)}
                          />
                          <p>{e.name}</p>
                        </label>
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            {showSelection && (
              <div
                onClick={() => setShowSelection(false)}
                className=" z-20 absolute top-0 left-0 w-full h-full"
              ></div>
            )}
            <motion.div
              className=" w-full"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5, type: "spring" }}
            >
              <select
                className="w-full cursor-pointer focus:outline-none h-full shadow-sm text-sm border rounded-md border-black font-bold text-black px-1"
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
            </motion.div>
            <motion.div
              className=" w-full"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5, type: "spring" }}
            >
              <label>
                <input
                  type="number"
                  className="w-15 text-sm pl-4 h-10 shadow-sm border border-black focus:outline-none rounded-md font-bold text-slate-500 px-1"
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
            </motion.div>
            <motion.div
              className=" w-full"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5, type: "spring" }}
            >
              <label>
                <input
                  type="text"
                  className="w-96 text-sm pl-4 h-10 shadow-sm border border-black focus:outline-none rounded-md font-bold text-slate-500 px-1"
                  name="searchName"
                  id="searchName"
                  placeholder="Enter Customer Name ..."
                  autoComplete="off"
                  value={searchName ?? ""}
                  onChange={(e) => {
                    const val = e.target.value.trim() === "" ? null : e.target.value;
                    setSearchName(val);
                  }}
                />
              </label>
            </motion.div>
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
      <TaskDispoSection
        selectedBucket={bucketObject[bucketSelect] || null}
        dpd={dpd}
        searchName={searchName}
      />
    </div>
  );
};

export default TaskManagerView;
