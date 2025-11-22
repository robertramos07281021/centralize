import { IoMdArrowDropdown } from "react-icons/io";
import { useQuery, gql } from "@apollo/client";
import { Users } from "../../middleware/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaDownload } from "react-icons/fa6";
import ReportsView, { Search } from "./ReportsView";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "../../redux/store";
import ReportsViewPage from "./ReportsViewPage";

type DispositionType = {
  id: string;
  name: string;
  code: string;
  count: string;
};

type Bucket = {
  _id: string;
  name: string;
  dept: string;
};

const DEPT_BUCKET_QUERY = gql`
  query getDeptBucket {
    getDeptBucket {
      _id
      name
      dept
    }
  }
`;
const GET_DEPARTMENT_AGENT = gql`
  query findAgents {
    findAgents {
      _id
      name
      user_id
      buckets
    }
  }
`;

const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`;

const GET_CALLFILES = gql`
  query GetBucketCallfile($bucketId: [ID]) {
    getBucketCallfile(bucketId: $bucketId) {
      _id
      name
      active
      bucket
    }
  }
`;

type Callfile = {
  _id: string;
  name: string;
  active: boolean;
  bucket: string;
};

const BacklogManagementView = () => {
  const { userLogged, isReport } = useSelector(
    (state: RootState) => state.auth
  );
  const { data: agentSelector } = useQuery<{ findAgents: Users[] }>(
    GET_DEPARTMENT_AGENT
  );

  const { data: departmentBucket } = useQuery<{ getDeptBucket: Bucket[] }>(
    DEPT_BUCKET_QUERY
  );
  const [buckets, setBuckets] = useState<Bucket[] | null>(null);
  const [searchBucket, setSearchBucket] = useState<string>("");
  const [bucketDropdown, setBucketDropdown] = useState<boolean>(false);
  const [selectedDisposition, setSelectedDisposition] = useState<string[]>([]);
  const [agentDropdown, setAgentDropdown] = useState<boolean>(false);
  const [agents, setAgents] = useState<Users[] | null>(null);
  const [searchAgent, setSearchAgent] = useState<string>("");
  const userRef = useRef<HTMLDivElement | null>(null);
  const bucketRef = useRef<HTMLDivElement | null>(null);
  // const [reportView, setReportView] = useState<boolean>(false);
  const { data: disposition } = useQuery<{
    getDispositionTypes: DispositionType[];
  }>(GET_DISPOSITION_TYPES);
  const [dateDistance, setDateDistance] = useState({
    from: "",
    to: "",
  });
  let bucketsOfCallfile = [];
  if (Boolean(searchAgent)) {
    bucketsOfCallfile.push(
      ...(agentSelector?.findAgents?.find((x) => x.user_id === searchAgent)
        ?.buckets ?? [])
    );
  } else if (Boolean(searchBucket)) {
    bucketsOfCallfile.push(
      departmentBucket?.getDeptBucket.find((x) => x.name === searchBucket)?._id
    );
  }

  const [selectedCallfile, setSelectedCallfile] = useState<string>("");
  
  const { data: callfilesData, refetch: callfileRefech } = useQuery<{
    getBucketCallfile: Callfile[];
  }>(GET_CALLFILES, { variables: { bucketId: bucketsOfCallfile } });

  const callfile = callfilesData?.getBucketCallfile || [];

  useEffect(() => {
    if (callfile) {
      if (Boolean(searchAgent)) {
        const ifAgent = agentSelector?.findAgents.find(
          (x) => x.user_id === searchAgent
        );
        if (searchAgent) {
          setSelectedCallfile(
            callfile.find(
              (x) => x.active && ifAgent?.buckets.includes(x.bucket)
            )?.name ?? ""
          );
        }
      } else {
        setSelectedCallfile(callfile.find((x) => x.active)?.name ?? "");
      }
    }
  }, [callfile, searchAgent]);

  useEffect(() => {
    const filteredAgent =
      searchAgent?.trim() != ""
        ? agentSelector?.findAgents?.filter(
            (e) =>
              e.name.toLowerCase()?.includes(searchAgent?.toLowerCase()) ||
              e.user_id?.includes(searchAgent ? searchAgent : "")
          )
        : agentSelector?.findAgents;
    setAgents(filteredAgent || null);

    const dropdownAgent =
      filteredAgent?.length.valueOf() && searchAgent?.trim() !== ""
        ? true
        : false;
    const newMapForAgent =
      agentSelector?.findAgents.map((e) => e.user_id) || [];
    if (!newMapForAgent.includes(searchAgent.trim())) {
      setAgentDropdown(dropdownAgent);
    }
    setBucketDropdown(false);
  }, [searchAgent, agentSelector]);

  useEffect(() => {
    const filteredBucket =
      searchBucket.trim() !== ""
        ? departmentBucket?.getDeptBucket.filter((e) =>
            e.name.includes(searchBucket)
          )
        : departmentBucket?.getDeptBucket;
    setBuckets(filteredBucket || null);

    const dropdownBucket =
      filteredBucket?.length.valueOf() && searchBucket.trim() !== ""
        ? true
        : false;
    const newMapforBucket = departmentBucket?.getDeptBucket.map((e) => e.name);
    if (!newMapforBucket?.includes(searchBucket.trim())) {
      setBucketDropdown(dropdownBucket);
    }
    setAgentDropdown(false);
  }, [departmentBucket, searchBucket]);

  const handleCheckBox = useCallback(
    (value: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const check = e.target.checked
        ? [...selectedDisposition, value]
        : selectedDisposition.filter((d) => d !== value);
      setSelectedDisposition(check);
    },
    [selectedDisposition, setSelectedDisposition]
  );

  const handleAgentDropdown = useCallback(() => {
    setAgentDropdown((prev) => !prev);
    setBucketDropdown(false);
  }, [setAgentDropdown, setBucketDropdown, agentDropdown]);

  const handleBucketDropdown = useCallback(() => {
    setBucketDropdown((prev) => !prev);
    setAgentDropdown(false);
  }, [setBucketDropdown, setAgentDropdown, bucketDropdown]);

  const yourBucket = Boolean(userLogged && userLogged?.buckets.length > 1);

  const SearchFilter: Search = {
    searchBucket: yourBucket ? searchBucket : userLogged?.buckets[0] || null,
    searchAgent: searchAgent,
    selectedDisposition: selectedDisposition,
    dateDistance: dateDistance,
    callfile: callfile?.find((x) => x.name === selectedCallfile)?._id || "",
  };

  return (
    <div
      className="grid grid-cols-3 relative grid-rows-1 h-full items-center overflow-hidden"
      onMouseDown={(e) => {
        if (!bucketRef.current?.contains(e.target as Node)) {
          setBucketDropdown(false);
        }
        if (!userRef.current?.contains(e.target as Node)) {
          setAgentDropdown(false);
        }
      }}
    >
      <div className="h-full px-5 py-10 flex flex-col justify-center">
        <motion.div
          className="bg-gray-200 rounded-md border-gray-400 shadow-md border-2 py-5 px-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className=" text-sm md:text-2xl text-slate-700 text-center font-black uppercase md:py-2">
            Select Report
          </h1>
          <div className="p-5 flex  flex-col gap-2 justify-center">
            {yourBucket && (
              <div
                className="flex select-none  flex-col md:flex-row cursor-default"
                ref={bucketRef}
              >
                <div className="flex  font-black mr-2 uppercase items-center text-sm text-slate-500">
                  Bucket:
                </div>
                <div className="col-span-3 w-full shadow-sm relative border flex items-center border-slate-400 rounded-md">
                  <input
                    type="text"
                    name="search_bucket"
                    id="search_bucket"
                    autoComplete="off"
                    value={searchBucket}
                    onChange={(e) => {
                      setSearchBucket(e.target.value.toLocaleUpperCase());
                    }}
                    placeholder="Select Bucket"
                    className="w-full outline-0 p-2 lg:text-xs 2xl:text-sm uppercase"
                  />
                  <div
                    className={`" ${
                      bucketDropdown ? "-rotate-0" : "-rotate-90"
                    } transition-all "`}
                  >
                    <IoMdArrowDropdown
                      className="lg:text-base 2xl:text-2xl"
                      onClick={handleBucketDropdown}
                    />
                  </div>
                  {bucketDropdown && (
                    <div
                      className={`${
                        agents?.length === 0 ? "h-10" : "max-h-96"
                      } border w-full absolute top-10  overflow-y-auto  border-slate-400 rounded z-50 shadow-md`}
                    >
                      {buckets?.map((bucket) => (
                        <div
                          key={bucket._id}
                          className="flex flex-col cursor-pointer font-medium text-slate-600 "
                          onClick={async () => {
                            setSearchBucket(bucket.name);
                            setSearchAgent("");
                            setBucketDropdown(false);
                            await callfileRefech();
                          }}
                        >
                          <div className=" text-sm bg-gray-200 even:bg-gray-200 p-2 hover:bg-gray-300">
                            {bucket.name.toUpperCase()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <label className="flex mr-2 w-full  flex-col md:flex-row relative items-start md:items-center">
              <div className="flex font-black mr-2 uppercase text-left text-sm text-slate-500">
                Callfile:
              </div>
              <select
                name="callfile"
                id="callfile"
                className=" w-full shadow-sm border flex items-center border-slate-400 rounded-md px-2 py-2 lg:text-xs 2xl:text-sm font-medium text-slate-500"
                value={selectedCallfile}
                onChange={(e) => {
                  setSelectedCallfile(e.target.value);
                }}
              >
                {callfile.map((x) => {
                  return (
                    <option
                      key={x._id}
                      value={x.name}
                      className={`${
                        x.active ? "bg-slate-200" : ""
                      } relative cursor-pointer `}
                    >
                      {x.name}
                    </option>
                  );
                })}
              </select>
            </label>

            <div className="flex  flex-col md:flex-row relative" ref={userRef}>
              <div className="flex font-black mr-2 uppercase items-center text-sm text-slate-500">
                Agent:
              </div>
              <div className="col-span-3 shadow-sm w-full relative border flex items-center border-slate-400 rounded-md">
                <input
                  type="text"
                  name="search_agent"
                  id="search_agent"
                  autoComplete="off"
                  value={searchAgent}
                  onChange={(e) => setSearchAgent(e.target.value)}
                  placeholder="Select Agent"
                  className="  w-full outline-0 p-2 lg:text-xs 2xl:text-sm uppercase"
                />

                <div
                  className={`" ${
                    agentDropdown ? "-rotate-0" : "-rotate-90"
                  } transition-all "`}
                >
                  <IoMdArrowDropdown
                    className="lg:text-base 2xl:text-2xl"
                    onClick={handleAgentDropdown}
                  />
                </div>
                {agentDropdown && (
                  <div
                    className={`${
                      agents?.length === 0 ? "h-10" : "max-h-96"
                    } border w-full absolute top-10  overflow-y-auto z-50 border-slate-400 bg-white  rounded`}
                  >
                    {agents?.map((agent) => (
                      <div
                        key={agent._id}
                        className="flex flex-col font-medium bg-slate-200 hover:bg-slate-300 transition-all cursor-pointer border-slate-400  text-slate-600 p-2"
                        onClick={() => {
                          setSearchAgent(agent.user_id);
                          setSearchBucket("");
                          setAgentDropdown(false);
                        }}
                      >
                        <div className=" text-sm">
                          {agent.name.toUpperCase()}
                        </div>
                        <div className="text-xs font-light">
                          {agent.user_id}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex font-black uppercase items-center text-slate-500 py-2 text-center justify-center">
                Disposition
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 max-h-50 items-center text-slate-500 gap-y-1 border-black rounded-sm shadow-sm p-2 justify-center border overflow-y-auto">
                {disposition?.getDispositionTypes?.map((dispoTypes) => (
                  <label
                    key={dispoTypes.id}
                    className=" text-[0.6rem] bg-gray-300 hover:bg-gray-400 h-full overflow-hidden transition-all cursor-pointer p-2 rounded-sm border hover:text-white border-black lg:text-lg lg:whitespace-nowrap font-black items-center flex gap-2"
                  >
                    <input
                      type="checkbox"
                      onChange={(e) => handleCheckBox(e.target.value, e)}
                      name={dispoTypes.name}
                      id={dispoTypes.name}
                      value={dispoTypes.name}
                      checked={selectedDisposition.includes(dispoTypes.name)}
                    />
                    <span className="uppercase items-center">
                      {dispoTypes.name}
                    </span>
                  </label>
                ))}
                <label className=" h-full border border-black p-2 rounded-sm cursor-pointer hover:text-white bg-gray-300 text-[0.6rem] hover:bg-gray-400 transition-all lg:text-[.45rem] items-center flex gap-2">
                  <input
                    type="checkbox"
                    name="all"
                    id="all"
                    value="all"
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (disposition) {
                          setSelectedDisposition(
                            disposition?.getDispositionTypes?.map((v) => v.name)
                          );
                        } else {
                          setSelectedDisposition([]);
                        }
                      } else {
                        setSelectedDisposition([]);
                      }
                    }}
                  />
                  <span className="uppercase font-black text-[0.6rem] lg:text-xl whitespace-nowrap">
                    Select All
                  </span>
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-3">
              <label className="flex  flex-col lg:flex-row text-sm">
                <div className="flex items-center uppercase mr-2 whitespace-nowrap font-black  text-slate-500">
                  Date From :
                </div>
                <div className=" w-full flex border items-center shadow-sm border-slate-400 rounded-lg p-2">
                  <input
                    type="date"
                    name="from"
                    id="from"
                    value={dateDistance.from}
                    onChange={(e) =>
                      setDateDistance({ ...dateDistance, from: e.target.value })
                    }
                    className="w-full outline-0"
                  />
                </div>
              </label>
              <label className="flex flex-col lg:flex-row text-sm">
                <div className="mr-2 flex items-center uppercase whitespace-nowrap font-black text-slate-500">
                  Date To :
                </div>
                <div className="w-full flex border items-center shadow-sm border-slate-400 rounded-lg p-2">
                  <input
                    type="date"
                    name="to"
                    id="to"
                    value={dateDistance.to}
                    onChange={(e) =>
                      setDateDistance({ ...dateDistance, to: e.target.value })
                    }
                    className="w-full outline-0"
                  />
                </div>
              </label>
            </div>
            <h1 className="text-xs 2xl:text-sm text-slate-600">
              <span className=" font-medium">Note: </span>Report can be
              generated by Daily, Weekly and Monthly
            </h1>
            <div className="flex gap-5 mt-2 justify-end">
              <button
                type="button"
                className="bg-blue-500 border-2 border-blue-800 transition-all font-black uppercase hover:bg-blue-600 focus:outline-none text-white  focus:ring-4 focus:ring-blue-300 rounded-lg text-sm px-5 py-2.5 cursor-pointer flex gap-2 items-center justify-center"
              >
                <span>Export</span>
                <FaDownload />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      <ReportsView search={SearchFilter} />
      <AnimatePresence>
        {isReport && (
          <motion.div
            className="absolute p-5 z-50 bg-white top-0 left-0 w-full h-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <ReportsViewPage search={SearchFilter} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BacklogManagementView;
