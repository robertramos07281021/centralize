import gql from "graphql-tag";
import Uploader from "../../components/Uploader";
import { useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import { setProductionManagerPage } from "../../redux/slices/authSlice";
import { motion } from "framer-motion";

import Pagination from "../../components/Pagination";
import CallfilesViews from "./CallfilesViews";

type Bucket = {
  _id: string;
  canCall: string;
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

export enum Status {
  all = "all",
  active = "active",
  finished = "finished",
}

const ProductionManagerView = () => {
  const dispatch = useAppDispatch();
  const { productionManagerPage } = useSelector(
    (state: RootState) => state.auth
  );
  const { data: bucketData, refetch } = useQuery<{ getTLBucket: Bucket[] }>(
    BUCKETS
  );

  const [callfileBucket, setCallfileBucket] = useState<string | null>(null);
  const [required, setRequired] = useState(false);
  const [page, setPage] = useState<string>("1");
  const [status, setStatus] = useState<Status>(Status.active);
  const [totalPage, setTotalPage] = useState<number>(1);
  const [canUpload, setCanUpload] = useState<boolean>(false);
  const [successUploading, setSuccessUploading] = useState<boolean>(false);

  const bucketObject: { [key: string]: string } = useMemo(() => {
    const tlBuckets = bucketData?.getTLBucket || [];
    return Object.fromEntries(tlBuckets.map((e) => [e._id, e.name]));
  }, [bucketData]);

  useEffect(() => {
    setPage(productionManagerPage.toString());
  }, [productionManagerPage]);

  useEffect(() => {
    const timer = async () => {
      await refetch();
    };
    timer();
  }, []);

  useEffect(() => {
    if (bucketData && !callfileBucket) {
      setCallfileBucket(bucketData?.getTLBucket[0]._id);
    }
  }, [bucketData, callfileBucket]);

  return (
    <div className="p-2 h-full overflow-hidden">
      <div className="h-full flex flex-col ">
        <div className="px-5 py-2 w-full flex gap-2 ">
          <motion.div
            className="bg-blue-100 border-2 overflow-hidden border-blue-800 rounded-md w-full items-center flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-shadow-2xs font-black bg-blue-500 w-full uppercase text-base py-2 text-white border-blue-800  text-center border-b-2">
              Call files{" "}
              {bucketObject[callfileBucket as keyof typeof bucketObject]}
            </h1>
            <div className="flex gap-2 p-2 h-full items-center justify-center">
              <label className="flex flex-col ">
                <select
                  name="bucket"
                  id="bucket"
                  onChange={(e) => {
                    const value =
                      e.target.value.trim() === "" ? null : e.target.value;
                    setCallfileBucket(value);
                  }}
                  value={callfileBucket || ""}
                  className={`${
                    required ? "bg-red-50 border-red-500" : "border-blue-800"
                  } text-sm  font-black w-full p-2 h-full outline-none bg-blue-200 border-2 rounded-md`}
                >
                  {bucketData?.getTLBucket.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>

              <div className="overflow-hidden relative border-2 border-blue-800 bg-blue-200 shadow-md rounded-md flex  text-sm font-black">
                <motion.div
                  initial={{ x: 0, opacity: 0 }}
                  animate={{
                    x: status === "all" ? 0 : status === "active" ? 50 : 125,
                    opacity: 1,
                    width:
                      status === "all" ? 50 : status === "active" ? 76 : 100,
                  }}
                  className={`" ${
                    status === "all"
                      ? "border-r  border-amber-900 bg-amber-500"
                      : status === "active"
                      ? " border-x  border-blue-900 bg-blue-500"
                      : "border-l border-green-900 bg-green-500"
                  } left-0 top-0 z-10  h-full absolute "`}
                ></motion.div>
                <div className="flex z-20 ">
                  <div
                    className={`" ${
                      status === "all" && "text-white"
                    } text-black px-3 py-2  cursor-pointer   text-shadow-xs "`}
                    onClick={() => setStatus(Status.all)}
                  >
                    ALL
                  </div>
                  <div
                    className={`" ${
                      status === "active" && "text-white"
                    } text-black  px-3 py-2 text-shadow-2xs cursor-pointer "`}
                    onClick={() => setStatus(Status.active)}
                  >
                    ACTIVE
                  </div>
                  <div
                    className={`" ${
                      status === "finished" && "text-white"
                    } text-black  px-3 py-2 text-shadow-2xs cursor-pointer "`}
                    onClick={() => setStatus(Status.finished)}
                  >
                    FINISHED
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="w-full border-2 overflow-hidden border-blue-800 rounded-md bg-blue-100 flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{delay: 0.2}}
          >
            <div className=" items-center py-2 flex justify-center text-base font-black uppercase text-white text-shadow-2xs bg-blue-500 border-blue-800  border-b-2 text-center">
              {"Uploader"}
            </div>
            <div className="px-3 py-2 h-full flex items-end">
              <Uploader
                width="w-full"
                bucket={callfileBucket}
                bucketRequired={(e: boolean) => setRequired(e)}
                onSuccess={() =>
                  setCallfileBucket(
                    bucketData && bucketData?.getTLBucket?.length > 0
                      ? bucketData?.getTLBucket[0]._id
                      : ""
                  )
                }
                canUpload={canUpload}
                successUpload={() => setSuccessUploading(true)}
              />
            </div>
          </motion.div>
        </div>
        <CallfilesViews
          bucket={callfileBucket}
          status={status}
          setTotalPage={(e) => setTotalPage(e)}
          setCanUpload={(e) => setCanUpload(e)}
          successUpload={successUploading}
          setUploading={() => setSuccessUploading(false)}
        />
        <Pagination
          value={page}
          onChangeValue={(e) => setPage(e)}
          onKeyDownValue={(e) => dispatch(setProductionManagerPage(e))}
          totalPage={totalPage}
          currentPage={productionManagerPage}
        />
      </div>
    </div>
  );
};

export default ProductionManagerView;
