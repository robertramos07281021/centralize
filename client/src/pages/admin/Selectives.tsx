import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store.ts";
import Pagination from "../../components/Pagination.tsx";
import { setPage } from "../../redux/slices/authSlice.ts";
import Loading from "../Loading.tsx";

const GET_ALL_BUCKETS = gql`
  query GetAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`;

type ALL_BUCKETS = {
  _id: string;
  name: string;
};

const GET_BUCKET_SELECTIVE = gql`
  query getAllSelectives($page: Int, $limit: Int, $bucket: ID) {
    getAllSelectives(page: $page, limit: $limit, bucket: $bucket) {
      selectives {
        _id
        name
        callfile {
          name
        }
        bucket {
          name
        }
        count
        amount
      }
      total
    }
  }
`;

type Callfile_Bucket = {
  name: string;
};

type Selective = {
  _id: string;
  name: string;
  callfile: Callfile_Bucket;
  bucket: Callfile_Bucket;
  count: number;
  amount: number;
};

type SelectiveData = {
  selectives: Selective[];
  total: number;
};

// console.log("Selectives component rendered", selectivesData?.getAllSelectives?.selectives);

const Selectives = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isSelectivePage = !location.pathname.includes("selectives");
  const { page, limit } = useSelector((state: RootState) => state.auth);
  const [pages, setPages] = useState("1");
  const [totalPage, setTotalPage] = useState<number>(1);

  const { data, refetch } = useQuery<{
    getAllBucket: ALL_BUCKETS[];
  }>(GET_ALL_BUCKETS, {
    notifyOnNetworkStatusChange: true,
    skip: isSelectivePage,
  });
  const [selectedBucket, setSelectedBucket] = useState<ALL_BUCKETS | null>(
    null
  );

  const {
    data: selectivesData,
    refetch: selectivesRefetch,
    loading: selectivesLoading,
  } = useQuery<{
    getAllSelectives: SelectiveData;
  }>(GET_BUCKET_SELECTIVE, {
    variables: {
      page,
      limit,
      bucket: selectedBucket?.name ? selectedBucket._id : null,
    },
    notifyOnNetworkStatusChange: true,
    skip: isSelectivePage,
  });


  useEffect(() => {
    if (selectivesData) {
      const searchExistingPages = Math.ceil(
        (selectivesData?.getAllSelectives?.total || 1) / limit
      );
      setTotalPage(searchExistingPages);
    }
  }, [selectivesData]);

  useEffect(() => {
    if (selectedBucket) {
      const refetching = async () => {
        await selectivesRefetch();
      };
      refetching();
    }
  }, [selectedBucket]);

  useEffect(() => {
    const refetching = async () => {
      await selectivesRefetch();
      await refetch();
    };
    refetching();
  }, []);

  

  const selectivesList =
    selectivesData?.getAllSelectives?.selectives ?? [];
  const showEmptyState =
    selectivesData && selectivesList.length === 0;

  if (selectivesLoading) return <Loading />;

  return (
    <div className=" flex flex-col justify-between h-full ">
      <div className="h-full p-5">
        <div className="flex justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="">
              <div className="">
                <motion.div onClick={() => setIsOpen(!isOpen)} layout>
                  <div className="bg-gray-200 relative z-20 cursor-pointer hover:bg-gray-300 transition-all px-2 flex gap-3 py-1 rounded-sm shadow-md border">
                    <div>
                      {selectedBucket?.name
                        ? selectedBucket?.name
                        : "Select a bucket"}
                    </div>
                    <div
                      className={`" ${
                        isOpen ? "rotate-90" : ""
                      } transition-all items-center flex text-black"`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                    layout
                  >
                    <div className="absolute flex flex-col max-h-80 overflow-auto z-20 border bg-gray-100  shadow-md  transition-all cursor-pointer rounded-sm  mt-1">
                      {data?.getAllBucket?.map((bucket) => (
                        <div
                          onClick={() =>
                            setSelectedBucket(bucket.name ? bucket : null)
                          }
                          className="px-3 py-1 odd:bg-gray-200 even:bg-gray-100 hover:bg-gray-300 transition-all "
                          key={bucket._id}
                        >
                          {bucket.name}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="bg-gray-200 rounded-sm shadow-md border items-center gap-3 px-3 py-1 flex">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>

            <input className="focus:outline-none" placeholder="Search..." />
          </div>
        </div>
        <div>
          <div className="grid uppercase grid-cols-6 gap-2 px-4 py-1 border rounded-t-md bg-gray-300 font-black">
            <div>name of Selectives</div>
            <div>Callfile</div>
            <div>Bucket</div>
            <div>Count</div>
            <div>Amount</div>
            <div></div>
          </div>
          <div>
            {showEmptyState && (
              <div className="text-center bg-gray-200 border-x py-2 text-gray-400 border-b rounded-b-md border-black font-black italic">No selectives found.</div>
            )}
            {selectivesList.map((selective, index) => (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="grid grid-cols-6 border-x items-center last:rounded-b-md last:shadow-md gap-2 px-4 py-2 border-b odd:bg-gray-50 even:bg-white hover:bg-gray-100 transition-all "
                  key={selective._id}
                >
                  <div>{selective.name}</div>
                  <div>{selective.callfile?.name || "N/A"}</div>
                  <div>{selective.bucket?.name || "N/A"}</div>
                  <div>{selective.count}</div>
                  <div>
                    {(selective.amount ?? 0).toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  </div>
                  <div className="flex justify-end gap-2">
                    <div className="px-2 py-1 text-white rounded-sm cursor-pointer border-2 border-blue-900 bg-blue-600 hover:bg-blue-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    <div className="px-2 py-1 text-white rounded-sm cursor-pointer border-2 border-green-900 bg-green-600 hover:bg-green-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-5"
                      >
                        <path d="M12 1.5a.75.75 0 0 1 .75.75V7.5h-1.5V2.25A.75.75 0 0 1 12 1.5ZM11.25 7.5v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V7.5h3.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h3.75Z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
            ))}
          </div>
        </div>
      </div>
      <div className="">
        <Pagination
          value={pages}
          onChangeValue={(e) => setPages(e)}
          onKeyDownValue={(e) => dispatch(setPage(e))}
          totalPage={totalPage}
          currentPage={page}
        />
      </div>
    </div>
  );
};

export default Selectives;
