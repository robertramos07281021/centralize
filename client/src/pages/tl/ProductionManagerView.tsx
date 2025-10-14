import gql from "graphql-tag";
import Uploader from "../../components/Uploader";
import { useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import {
  setProductionManagerPage,
  setServerError,
} from "../../redux/slices/authSlice";
import { motion } from "framer-motion";

import Pagination from "../../components/Pagination";
import CallfilesViews from "./CallfilesViews";

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

enum Status {
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
  const [callfileBucket, setCallfileBucket] = useState<string>("");
  const [required, setRequired] = useState(false);
  const [page, setPage] = useState<string>("1");
  const [status, setStatus] = useState<Status>(Status.active);
  const [totalPage, setTotalPage] = useState<number>(1);
  const [canUpload, setCanUpload] = useState<boolean>(false);
  const [successUploading, setSuccessUploading] = useState<boolean>(false);

  const bucketObject: { [key: string]: string } = useMemo(() => {
    const tlBuckets = bucketData?.getTLBucket || [];
    return Object.fromEntries(tlBuckets.map((e) => [e.name, e._id]));
  }, [bucketData]);

  useEffect(() => {
    setPage(productionManagerPage.toString());
  }, [productionManagerPage]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await refetch();
      } catch (error) {
        dispatch(setServerError(true));
      }
    });
    return () => clearTimeout(timer);
  }, [refetch]);

  useEffect(() => {
    if (bucketData) {
      setCallfileBucket(bucketData.getTLBucket[0].name);
    }
  }, [bucketData]);

  return (
    <div className="p-2 h-full overflow-hidden">
      <div className="h-full flex flex-col ">
        <div className="p-5 flex gap-20 ">
          <div className="w-1/2 flex flex-col gap-2">
            <h1 className=" font-black uppercase text-2xl text-gray-600">
              Call files
            </h1>
            <div className="flex gap-5 h-full items-end">
              <motion.label
                className="flex flex-col h-full w-1/2 "
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {/* <p className="text-sm font-black uppercase text-gray-400">
                  Bucket
                </p> */}
                <select
                  name="bucket"
                  id="bucket"
                  onChange={(e) => setCallfileBucket(e.target.value)}
                  value={callfileBucket}
                  className={`${
                    required ? "bg-red-50 border-red-500" : "border-slate-400"
                  } text-sm font-black w-full p-2 mt-3 h-full  border rounded-lg`}
                >
                  {bucketData?.getTLBucket.map((e) => (
                    <option key={e._id} value={e.name}>
                      {e.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </motion.label>
              <motion.fieldset
                className="flex border rounded-xl p-2 px-5 gap-5 border-slate-400 "
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
              </motion.fieldset>
            </div>
          </div>
          <div className="w-1/2 flex flex-col gap-2">
            <h1 className="text-2xl font-black uppercase text-gray-600 text-center">
              {canUpload && "Uploader"}
            </h1>
            <div className=" h-full flex items-end">
              <Uploader
                width="w-full"
                bucket={bucketObject[callfileBucket]}
                bucketRequired={(e: boolean) => setRequired(e)}
                onSuccess={() =>
                  setCallfileBucket(
                    bucketData && bucketData?.getTLBucket?.length > 0
                      ? bucketData?.getTLBucket[0].name.toUpperCase()
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
          bucket={bucketObject[callfileBucket]}
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
