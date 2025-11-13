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
  count: number
  amount: number
};

type SelectiveData = {
  selectives: Selective[];
  total: number;
};
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

  const { data: selectivesData, refetch: selectivesRefetch, loading:selectivesLoading } = useQuery<{
    getAllSelectives: SelectiveData;
  }>(GET_BUCKET_SELECTIVE, {
    variables: {
      page,
      limit,
      bucket: selectedBucket?._id,
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

  if(selectivesLoading) return <Loading/>

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
                  >
                    <div className="absolute flex flex-col = max-h-80 overflow-auto z-20 border bg-gray-100  shadow-md  transition-all cursor-pointer rounded-sm  mt-1">
                      {data?.getAllBucket?.map((bucket) => (
                        <div
                          onClick={() => setSelectedBucket(bucket.name ? bucket : null)}
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
          <div className="grid uppercase grid-cols-7 gap-2 px-4 py-1 border rounded-t-md bg-gray-300 font-black">
            <div>name of Selectives</div>
            <div>Callfile</div>
            <div>Bucket</div>
            <div>Date</div>
            <div>Count</div>
            <div>Amount</div>
            <div>Action</div>
          </div>
          <div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div className="" >
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
