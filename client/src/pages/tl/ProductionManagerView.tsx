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
          <div className="bg-gray-100 border overflow-hidden border-black rounded-md w-full items-center flex flex-col">
            <h1 className=" font-black bg-gray-400 w-full uppercase text-base py-2 text-black  text-center border-b">
              Call files{" "}
              {bucketObject[callfileBucket as keyof typeof bucketObject]}
            </h1>
            <div className="flex gap-2 p-2 h-full items-center justify-center">
              <motion.label
                className="flex flex-col "
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
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
                    required ? "bg-red-50 border-red-500" : "border-black"
                  } text-sm font-black w-full p-2 h-full  border rounded-md`}
                >
                  {bucketData?.getTLBucket.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </motion.label>

              <div className="overflow-hidden relative border border-black rounded-md flex  text-sm font-black">
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
              {/* <motion.fieldset
                className="flex border rounded-md p-2 px-5 gap-5 border-black "
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <legend className="text-sm font-black uppercase text-gray-800 px-2">
                  Status
                </legend>
                <label className="text-sm flex gap-1 text-gray-600">
                  <input
                    type="radio"
                    name="status"
                    id="all"
                    checked={status === Status.all}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    value={Status.all}
                  />
                  <span>All</span>
                </label>
                <label className="text-sm flex gap-1 text-gray-600">
                  <input
                    type="radio"
                    name="status"
                    id="active"
                    checked={status === Status.active}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    value={Status.active}
                  />
                  <span>Active</span>
                </label>
                <label className="text-sm flex gap-1 text-gray-600">
                  <input
                    type="radio"
                    name="status"
                    id="finished"
                    checked={status === Status.finished}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    value={Status.finished}
                  />
                  <span>Finished</span>
                </label>
              </motion.fieldset> */}  
            </div>
          </div>
          <div className="w-full border overflow-hidden border-black rounded-md bg-gray-100 flex flex-col">
            <div className="h-full items-center py-2 flex justify-center text-base font-black uppercase text-black bg-gray-400 border-b text-center">
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
          </div>
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
