import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import GaugeChart from "react-gauge-chart";

const GET_QA_USERS = gql`
  query getQAUsers($page: Int!, $limit: Int!) {
    getQAUsers(page: $page, limit: $limit) {
      users {
        _id
        name
        active
        type
        buckets
        isOnline
        isLock
        departments
        scoreCardType
      }
      total
    }
  }
`;

const GET_ALL_DEPTS = gql`
  query getDepts {
    getDepts {
      id
      name
      branch
    }
  }
`;

const GET_ALL_BUCKETS = gql`
  query GetAllBucket {
    getAllBucket {
      _id
      name
      dept
    }
  }
`;

const GET_SCORECARD_SUMMARIES = gql`
  query GetScoreCardSummaries($date: String, $search: String) {
    getScoreCardSummaries(date: $date, search: $search) {
      _id
      qa {
        _id
        name
      }
    }
  }
`;

const QASupervisorDashboard = () => {
  const [value, setValue] = useState(1);

  const { data } = useQuery(GET_QA_USERS, {
    variables: { page: 1, limit: 100 },
  });
  const { data: deptData } = useQuery(GET_ALL_DEPTS);
  const { data: bucketData } = useQuery(GET_ALL_BUCKETS);
  const { data: scorecardData } = useQuery(GET_SCORECARD_SUMMARIES, {
    variables: { date: null, search: null },
    fetchPolicy: "network-only",
  });

  const users = data?.getQAUsers?.users || [];

  const deptMap = useMemo(() => {
    const arr = deptData?.getDepts || [];
    return Object.fromEntries(arr.map((d: any) => [d.id, d.name]));
  }, [deptData]);

  const bucketMap = useMemo(() => {
    const arr = bucketData?.getAllBucket || [];
    return Object.fromEntries(arr.map((b: any) => [b._id, b.name]));
  }, [bucketData]);

  const scoreSheetCountByQa = useMemo(() => {
    const summaries = scorecardData?.getScoreCardSummaries || [];
    return summaries.reduce((acc: Record<string, number>, entry: any) => {
      const qaId = entry?.qa?._id;
      if (qaId) {
        acc[qaId] = (acc[qaId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [scorecardData]);

  useEffect(() => {
    setValue(1);
  }, []);

  return (
    <div className="w-full h-full max-h-[90vh] overflow-hidden relative flex flex-col">
      <div className="bg-blue-500 h-[5%] shadow-md py-1.5 px-4">
        <div className="flex h-full items-center gap-2">
          <div className="bg-blue-300 flex cursor-pointer rounded-md shadow-md hover:shadow-none transition-all hover:bg-blue-400 px-2 items-center h-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="size-5 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </div>
          <div className="bg-blue-300 cursor-pointer rounded-md shadow-md hover:shadow-none transition-all hover:bg-blue-400 px-2 items-center flex h-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="size-5 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <div className="underline font-black text-white uppercase text-lg">
            Week # 12
          </div>
        </div>
      </div>
      <div className="flex h-[10%] p-3 flex-col">
        <div className="grid grid-cols-4 h-full relative gap-3  ">
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
          >
            <div>Total Calls</div>
            <div className=" text-xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div>Total Calls</div>
            <div className=" text-xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div>Total Calls</div>
            <div className=" text-xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div>Total Calls</div>
            <div className=" text-xl text-red-800">100</div>
          </motion.div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 px-3 py-3 gap-3 grid-rows-2 h-[85%]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full"
        >
          <div className="grid  rounded-md shadow overflow-hidden border border-black h-full bg-gray-200">
            <div className="grid-cols-4 py-2 border-b text-start grid items-center px-4 shadow-md rounded-t-sm font-black text-sm text-black uppercase bg-gray-300">
              <div>QA Name</div>
              <div>Campaign</div>
              <div>Bucket(s)</div>
              <div className="truncate text-center" title="Score Sheet report">
                Score Sheet report
              </div>
            </div>
            <div className="divide-y divide-gray-400 overflow-y-auto h-full">
              {users.map((user: any) => (
                <div
                  key={user._id}
                  className="grid grid-cols-4 odd:bg-gray-200 gap-2 transition-all hover:bg-gray-300 even:bg-gray-100 px-4 py-2 items-center text-sm text-black"
                >
                  <div className="first-letter:uppercase">{user.name}</div>
                  <div className="truncate" title={user.departments.join(", ")}>
                    {Array.isArray(user.departments) &&
                    user.departments.length > 0 ? (
                      user.departments
                        .map((deptId: string) => deptMap[deptId] || deptId)
                        .join(", ")
                    ) : (
                      <span className="italic text-gray-400 text-xs">
                        No campaign
                      </span>
                    )}
                  </div>
                  <div className="truncate" title={user.buckets.join(", ")}>
                    {Array.isArray(user.buckets) && user.buckets.length > 0 ? (
                      user.buckets
                        .map(
                          (bucketId: string) => bucketMap[bucketId] || bucketId
                        )
                        .join(", ")
                    ) : (
                      <span className="italic text-gray-400 text-xs">
                        No bucket
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    {scoreSheetCountByQa[user._id] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className=" rounded-md overflow-hidden flex flex-col shadow border border-black h-full bg-gray-200">
            <div className="bg-gray-300 border-b shadow-md border-black rounded-t-sm flex flex-col w-full">
              <div className="font-black uppercase text-center py-3 text-black text-2xl shadow-md ">
                Top 6 QA Performance
              </div>
            </div>
            <div className="h-full grid grid-cols-5 grid-rows-1 px-10  items-end content-center justify-center">
              <div className="w-full h-full flex flex-col justify-end items-center">
                <div className="mb-2 font-black text-gray-500">40%</div>
                <div
                  className={`w-16 h-[40%] duration-500 rounded-t-md bg-green-700 text-center transition-all`}
                ></div>
              </div>

              <div className="w-full h-full flex flex-col justify-end items-center">
                <div className="mb-2 font-black text-gray-500">25%</div>
                <div className="w-16 h-[25%] rounded-t-md bg-green-700 text-center"></div>
              </div>

              <div className="w-full h-full flex flex-col justify-end items-center">
                <div className="mb-2 font-black text-gray-500">70%</div>
                <div className="w-16 h-[70%] rounded-t-md bg-green-700 text-center"></div>
              </div>

              <div className="w-full h-full flex flex-col justify-end items-center">
                <div className="mb-2 font-black text-gray-500">55%</div>
                <div className="w-16 h-[55%] rounded-t-md bg-green-700 text-center"></div>
              </div>

              <div className="w-full h-full flex flex-col justify-end items-center">
                <div className="mb-2 font-black text-gray-500">85%</div>
                <div className="w-16 h-[85%] rounded-t-md bg-red-700 text-center"></div>
              </div>
            </div>
            <div className="px-10 border-t border-gray-500 grid grid-cols-5 text-sm gap-3 truncate text-center font-black uppercase text-gray-500 justify-evenly py-2">
              <div className="truncate" title="Washing Machine">
                Washing Machine
              </div>
              <div>Toaster</div>
              <div>Fridge</div>
              <div className="truncate" title="Air Conditioner">
                Air Conditioner
              </div>
              <div>Television</div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className=" rounded-md shadow  border relative flex flex-col border-gray-500 h-full bg-gray-200">
            <div className="bg-gray-300 border-b border-gray-500  rounded-t-sm justify-evenly py-2 shadow-md w-full flex text-sm ">
              <div className="font-black uppercase text-center py-3 text-gray-500 ">
                Overall Satisfaction Score
              </div>
              <div className="font-black uppercase text-center py-3 text-gray-500 ">
                Satisfaction Score - By QA
              </div>
            </div>
            <div className="flex h-full">
              <div className="flex items-center justify-center h-full flex-col w-full relative">
                <GaugeChart
                  id="gauge-chart"
                  nrOfLevels={100}
                  colors={["#fff"]}
                  percent={value}
                  arcWidth={0.3}
                  needleColor="#333"
                  arcsLength={[1]}
                  hideText
                />
                <div className="font-black uppercase text-gray-500">
                  Satisfaction Score: 3.33
                </div>
              </div>
              <div className="flex flex-col w-full h-full py-3 px-3 items-end font-black text-gray-500">
                <div className="h-full flex w-full">
                  <div className="h-full flex pr-5 border-r-2 flex-col text-end justify-evenly">
                    <div>Jim</div>
                    <div>Stewart</div>
                    <div>Manuel</div>
                    <div>Joshua</div>
                    <div>Daniel</div>
                  </div>
                  <div className="h-full w-full flex pr-5 flex-col text-start justify-evenly">
                    <div>d</div>
                    <div>d</div>
                    <div>d</div>
                    <div>d</div>
                    <div>d</div>
                  </div>
                </div>
                <div className="flex flex-row border-t-2 pl-20 pt-3 justify-evenly w-full">
                  <div>0</div>
                  <div>1</div>
                  <div>2</div>
                  <div>3</div>
                  <div>4</div>
                  <div>5</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className=" rounded-md shadow border relative flex flex-col border-gray-500 h-full bg-gray-200">
            <div className="bg-gray-300 border-b border-gray-500 rounded-t-md w-full">
              <div className="font-black uppercase text-center py-3 text-gray-500 text-2xl shadow-md ">
                SLA Limits
              </div>
            </div>

            <div className="h-full flex text-gray-500 relative flex-col items-center">
              <div className="h-full px-10 font-black items-center justify-center content-center flex relative w-full">
                <div className="text-2xl w-full uppercase ">
                  Call answered in less than 180 seconds:
                </div>
                <div className="text-5xl">40.8%</div>
              </div>

              <div className="h-full px-10 font-black items-center justify-center content-center flex relative w-full">
                <div className="text-2xl w-full uppercase ">
                  Calls with satisfaction score less than %:
                </div>
                <div className="text-5xl ">125</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QASupervisorDashboard;
