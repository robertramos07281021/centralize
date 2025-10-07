import { useEffect, useState } from "react";
import Pagination from "../../components/Pagination.tsx";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store.ts";
import { setCallfilesPages } from "../../redux/slices/authSlice.ts";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Callifles = gql`
  query getCF($bucket: ID, $limit: Int!, $page: Int!) {
    getCF(bucket: $bucket, limit: $limit, page: $page) {
      result {
        _id
        name
        totalPrincipal
        totalAccounts
        totalOB
        bucket
        createdAt
        active
        endo
        finished_by {
          _id
          name
        }
        target
      }
      total
    }
  }
`;

type User = {
  _id: string;
  name: string;
};

type Callfile = {
  _id: string;
  name: string;
  totalPrincipal: number;
  totalAccounts: number;
  totalOB: number;
  bucket: string;
  createdAt: string;
  active: boolean;
  endo: string;
  finished_by: User;
  target: number;
};

type Results = {
  result: Callfile[];
  total: number;
};

const ALL_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`;

type Bucket = {
  _id: string;
  name: string;
};

const CallfilesConfig = () => {
  const [page, setPage] = useState<string>("1");
  const [totalPage, setTotalPage] = useState<number>(1);
  const dispatch = useDispatch();
  const location = useLocation();
  const isCallfileConfig = location.pathname.includes(
    "callfile-configurations"
  );
  const { callfilesPages, limit } = useSelector(
    (state: RootState) => state.auth
  );

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value.trim() === "" ? null : event.target.value;
    setSelectedOption(value);
  };

  const { data, refetch } = useQuery<{ getCF: Results }>(Callifles, {
    variables: {
      bucket: selectedOption,
      page: callfilesPages,
      limit: limit,
    },
    skip: !selectedOption || !isCallfileConfig,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    setPage(callfilesPages.toString());
  }, [callfilesPages]);

  useEffect(() => {
    if (data) {
      const searchExistingPages = Math.ceil((data?.getCF.total || 1) / limit);
      setTotalPage(searchExistingPages);
    }
  }, [data]);

  const { data: bucketsData, refetch: bucketRefetch } = useQuery<{
    getAllBucket: Bucket[];
  }>(ALL_BUCKET, {
    skip: !isCallfileConfig,
    notifyOnNetworkStatusChange: true,
  });

  console.log(data, "d");
  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await bucketRefetch();
    };
    refetching();
  }, [selectedOption]);

  const countWorkdays = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // If end date is earlier than start date, return 0
  if (end < start) return 0;

  // Adjust both start and end to start from the beginning of the day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  let totalWorkdays = 0;
  
  // Loop through each date between start and end
  while (start <= end) {
    // Check if the current date is a weekday (Mon-Fri)
    if (start.getDay() !== 0 && start.getDay() !== 6) { // 0: Sunday, 6: Saturday
      totalWorkdays++;
    }
    // Move to the next day
    start.setDate(start.getDate() + 1);
  }

  return totalWorkdays;
};

const workdays = countWorkdays('7/31/2025', '8/1/2025');
console.log(workdays);

  return (
    <div className=" h-[85vh] w-full flex flex-col py-1">
      <div className="p-5 flex h-full flex-col w-full">
        <div className="w-full mb-2 justify-between items-center flex">
          <div className="font-black uppercase text-2xl text-gray-400">
            CallFile Configuration
          </div>
          <div className="flex gap-3">
            <motion.div
              className="border-blue-800 py-2 font-black shadow-md text-blue-900 cursor-pointer rounded-md border-2 px-3 bg-blue-500 hover:bg-blue-600 "
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
            >
              <select
                id="dropdown"
                value={selectedOption || ""}
                onChange={handleChange}
                className=" focus:outline-none cursor-pointer rounded-md items-center flex h-full"
              >
                <option className="uppercase" value="">
                  Select a bucket
                </option>
                {bucketsData?.getAllBucket &&
                bucketsData.getAllBucket.length > 0 ? (
                  bucketsData.getAllBucket.map((bucket) => (
                    <option key={bucket._id} value={bucket._id}>
                      {bucket.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No buckets available</option>
                )}
              </select>

              {/* {selectedOption && (
                <div className="mt-2">
                  <strong>Selected:</strong> {selectedOption}
                </div>
              )} */}
            </motion.div>

          </div>
        </div>

        <div className="grid grid-cols-9 gap-3 bg-gray-200 pl-3 pr-6 rounded-t-md py-2 font-semibold">
          <div>Name</div>
          <div>Created At</div>
          <div>Endo</div>
          <div>Total Work Days</div>
          <div>Finished By</div>
          <div>Total Accounts</div>
          <div>Total OB</div>
          <div>Total Principal</div>
          <div>Activity</div>
        </div>

        <div className="overflow-auto flex rounded-b-md flex-col h-full">
          <motion.div
            className="flex flex-col  "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {data?.getCF && data?.getCF.result.length > 0 ? (
              data.getCF.result.map((res, index) => (
                <motion.div
                  key={res._id}
                  className="grid gap-3 bg-gray-100 px-3 py-2 items-center grid-cols-9"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="whitespace-nowrap truncate" title={res.name} >{res.name}</div>
                  <div>
                    {new Date(res.createdAt).toLocaleDateString("en-US")}
                  </div>
                  <div>
                    {}
                    {res.endo
                      ? new Date(res.endo).toLocaleDateString("en-US")
                      : "-"}
                  </div>
                  <div>
                    {res.endo ? (
                      Math.floor(
                        (new Date(res.endo).getTime() -
                          new Date(res.createdAt).getTime()) /
                          (1000 * 3600 * 24)
                      )
                    ) : (
                      <span>0</span>
                    )}
                  </div>
                  <div>{res.finished_by?.name || "null"}</div>
                  <div className="truncate">{res.totalAccounts || 0}</div>
                  <div className="truncate">
                    {res.totalOB?.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }) ||
                      (0).toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                  </div>
                  <div className="truncate">
                    {res.totalPrincipal?.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }) ||
                      (0).toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                  </div>
                  <div className="">
                    {res.active ? (
                      <div className="flex">
                        <div className="bg-green-400 px-3 py-1 rounded-full border-green-600 font-black text-sm uppercase text-green-700 border-2">
                          Active
                        </div>{" "}
                      </div>
                    ) : (
                      <div className="flex">
                        <div className="bg-red-400 px-3 py-1 rounded-full border-red-600 font-black text-sm uppercase text-red-700 border-2">
                          inActive
                        </div>{" "}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <option className="flex justify-center px-3 py-2 bg-gray-100" disabled>No buckets available</option>
            )}
          </motion.div>
        </div>
      </div>
      <div className="py-1 px-2 ">
        <Pagination
          value={page}
          onChangeValue={(e) => setPage(e)}
          onKeyDownValue={(e) => dispatch(setCallfilesPages(e))}
          totalPage={totalPage}
          currentPage={callfilesPages}
        />
      </div>
    </div>
  );
};

export default CallfilesConfig;
