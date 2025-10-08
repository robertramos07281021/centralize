import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store.ts";
import { setSelectedCampaign } from "../../redux/slices/authSlice.ts";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";


type DeptBranchBucket = {
  _id: string;
  name: string;
};

const BUCKET_AGENT = gql`
  query getBucketUser($bucketId: ID) {
    getBucketUser(bucketId: $bucketId) {
      _id
      name
      user_id
      buckets
    }
  }
`;

const GET_BUCKET = gql`
  query getTLBucket {
    getTLBucket {
      _id
      name
    }
  }
`;

type Bucket = {
  _id: string;
  name: string;
};

type User = {
  _id: string;
  name: string;
  user_id: string;
  buckets: string[];
};

const QAAgentViews = () => {
  const { selectedCampaign } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const isQADashboard = location.pathname !== "/qa-agents-dashboard";

  const { data, refetch: bucketRefetching } = useQuery<{
    getTLBucket: Bucket[];
  }>(GET_BUCKET, { skip: isQADashboard, notifyOnNetworkStatusChange: true });
  const { data: agentData, refetch } = useQuery<{ getBucketUser: User[] }>(
    BUCKET_AGENT,
    {
      variables: { bucketId: selectedCampaign },
      skip: isQADashboard,
      notifyOnNetworkStatusChange: true,
    }
  );

  const newMapBucjket = useMemo(() => {
    const newData = data?.getTLBucket || [];
    return Object.fromEntries(newData.map((d) => [d._id, d.name]));
  }, [data]);

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await bucketRefetching();
    };
    refetching();
  }, [refetch, bucketRefetching]);

  const dispatch = useAppDispatch();
  console.log(newMapBucjket, "gA?");

  return (
    <div className="overflow-hidden flex h-full w-full flex-col">
      <motion.div className="flex items-center justify-end px-5 pt-4">
        {data && data?.getTLBucket?.length > 0 && (
          <select
            name="campaign"
            id="campaign"
            className="px-6 text-center border border-slate-500 rounded py-1.5"
            onChange={(e) => {
              const value =
                e.target.value.trim() === "" ? null : e.target.value;
              dispatch(setSelectedCampaign(value));
            }}
            value={selectedCampaign || ""}
          >
            <option value="">Selecte Campaign</option>
            {data.getTLBucket.map((bucket) => (
              <option value={bucket._id} key={bucket._id}>
                {bucket.name}
              </option>
            ))}
          </select>
        )}
      </motion.div>
      <div className="h-full w-full  p-5 overflow-hidden flex">
        <div className="w-full h-full overflow-auto">
          <table className="w-full overflow-hidden rounded-md table-fixed">
            <thead className=" bg-gray-300 uppercase font-black overflow-hidden">
              <tr>
                <td className="px-2 py-2">Name</td>
                <td className="px-2 py-2">SIP</td>
                <td className="px-2 py-2">Buckets</td>
              </tr>
            </thead>
            <tbody>
              {agentData?.getBucketUser.map((user, index) => (
                <motion.tr
                  key={user._id}
                  className=" even:bg-gray-200 bg-gray-100 cursor-pointer transition-all hover:bg-gray-200 select-none"
                  initial={{opacity: 0}}
                  animate={{opacity: 1}}
                  transition={{delay: index * 0.1}}
                >
                  <td className="capitalize ">
                    <Link
                      to="/agent-recordings"
                      state={user._id}
                      className="w-full h-full px-2 py-1 "
                    >
                      {user.name}
                    </Link>
                  </td>
                  <td className="flex">
                    <Link
                      to="/agent-recordings"
                      className={`w-full h-full px-2 ${
                        user.user_id ? "py-1" : "py-4"
                      }  `}
                      state={user._id}
                    >
                      {user.user_id}
                    </Link>
                  </td>
                  <td>
                    <Link
                      to="/agent-recordings"
                      className="w-full h-full px-2 py-1"
                    >
                      {user.buckets.map((b) => newMapBucjket[b]).join(", ")}
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QAAgentViews;
