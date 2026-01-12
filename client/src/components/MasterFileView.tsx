import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { motion } from "framer-motion";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";

type MasterFileViewProps = {
  close: () => void;
};

const GET_TL_BUCKET = gql`
  query getTLBucket {
    getTLBucket {
      _id
      name
      dept
    }
  }
`;

const GET_BUCKET_ACTIVE_CALLFILES = gql`
  query getBucketActiveCallfile($bucketIds: [ID]) {
    getBucketActiveCallfile(bucketIds: $bucketIds) {
      _id
      bucket
      name
      active
    }
  }
`;

const GET_MASTERFILE_BY_CALLFILE = gql`
  query masterFileAccountsByCallfile(
    $callfileIds: [ID]
    $page: Int
    $limit: Int
    $search: String
  ) {
    masterFileAccountsByCallfile(
      callfileIds: $callfileIds
      page: $page
      limit: $limit
      search: $search
    ) {
      accounts {
        _id
        case_id
        account_bucket {
          _id
          name
          dept
        }
        customer_info {
          fullName
          gender
          contact_no
        }
        out_standing_details {
          total_os
          principal_os
          last_payment_amount
          last_payment_date
        }
        balance
      }
      total
    }
  }
`;

const MasterFileView: React.FC<MasterFileViewProps> = ({ close }) => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [search, setSearch] = useState("");

  const renderText = (value: unknown, fallback: string) => {
    const v = String(value ?? "").trim();
    return v ? (
      v
    ) : (
      <div className="truncate text-gray-400 italic text-xs">{fallback}</div>
    );
  };

  const formatGender = (value: unknown) => {
    const g = String(value ?? "")
      .trim()
      .toLowerCase();
    if (g === "f" || g === "female") return "Female";
    if (g === "m" || g === "male") return "Male";
    if (g === "o" || g === "other") return "Other";
    return "";
  };

  const formatPhp = (value: unknown) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return "";
    return n.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  };

  const { data: bucketsData } = useQuery(GET_TL_BUCKET, {
    skip: !userLogged,
    notifyOnNetworkStatusChange: true,
  });

  const bucketIds: string[] = useMemo(() => {
    return Array.isArray(bucketsData?.getTLBucket)
      ? bucketsData.getTLBucket.map((b: any) => String(b._id))
      : [];
  }, [bucketsData]);

  const { data: callfilesData } = useQuery(GET_BUCKET_ACTIVE_CALLFILES, {
    skip: !userLogged || bucketIds.length === 0,
    variables: { bucketIds },
    notifyOnNetworkStatusChange: true,
  });

  const activeCallfileIds: string[] = useMemo(() => {
    const callfiles = callfilesData?.getBucketActiveCallfile;
    return Array.isArray(callfiles)
      ? callfiles.map((cf: any) => String(cf._id))
      : [];
  }, [callfilesData]);

  const { data: masterData, loading } = useQuery(GET_MASTERFILE_BY_CALLFILE, {
    skip: !userLogged || activeCallfileIds.length === 0,
    variables: {
      callfileIds: activeCallfileIds,
      page: 1,
      limit: 500,
      search,
    },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (bucketsData?.getTLBucket) {
      console.log("getTLBucket result", bucketsData.getTLBucket);
    }
  }, [bucketsData]);

  useEffect(() => {
    const buckets = bucketsData?.getTLBucket;
    const callfiles = callfilesData?.getBucketActiveCallfile;
    if (!Array.isArray(buckets) || !Array.isArray(callfiles)) return;

    const bucketNameById = new Map(
      buckets.map((b: any) => [String(b._id), String(b.name)])
    );

    const grouped = callfiles.reduce((acc: Record<string, any[]>, cf: any) => {
      const bId = String(cf.bucket);
      if (!acc[bId]) acc[bId] = [];
      acc[bId].push(cf);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([bId, cfs]) => {
      console.log(
        `active callfiles for bucket ${bucketNameById.get(bId) ?? bId}`,
        cfs.map((x) => x.name)
      );
    });
  }, [bucketsData, callfilesData]);

  const rows = masterData?.masterFileAccountsByCallfile?.accounts ?? [];

  return (
    <div className="w-full h-full z-50 gap-5 absolute top-0 left-0 bg-black/50 backdrop-blur-[2px] p-5">
      <motion.div
        className="w-full h-full border rounded-md border-slate-500 bg-white p-5 flex flex-col overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-start">
          <h1 className="text-[0.7rem] md:text-base 2xl:text-xl pb-5  font-black text-black uppercase">
            MASTER FILE
          </h1>
          <div className="flex items-center gap-2">
            <div>
              <input
                placeholder="Search..."
                className="border px-3 py-1 outline-none rounded-sm shadow-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div
              className="p-1 bg-red-500 hover:bg-red-600 transition-all shadow-md cursor-pointer rounded-full border-2 border-red-800 text-white  "
              onClick={() => close()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="h-full flex flex-col min-h-0">
          <div className="w-full flex flex-col table-fixed flex-1 min-h-0">
            <div className=" text-black py-2 font-black uppercase items-center gap-2 px-2 border-x border-t grid grid-cols-9 rounded-t-md text-sm text-left select-none bg-gray-300">
              <div className="">Name</div>
              <div>Bucket</div>
              <div className="truncate">Contact Number</div>
              <div>Gender</div>
              <div className="truncate">Outstanding Balance</div>
              <div>Balance</div>
              <div>principal</div>
              <div>Payment</div>
              <div className="truncate">Payment Date</div>
            </div>
            <div className="border-x border-b rounded-b-md shadow-md flex-1 min-h-0 overflow-y-auto">
              {loading ? (
                <div className="bg-gray-100 h-full py-6 flex justify-center items-center">
                  <div className="relative w-20 h-20 flex shadow-md rounded-full items-center justify-center">
                    <div className="absolute top-0 left-0 w-full h-full border-t-2 animate-spin rounded-full" />
                    <div className="text-xs text-gray-500">Loading...</div>
                  </div>
                </div>
              ) : rows.length === 0 ? (
                <div className="py-2 text-center flex justify-center italic text-gray-400 bg-gray-100 border-black">
                  No customer found.
                </div>
              ) : (
                rows.map((r: any, index: number) => {
                  const name = r?.customer_info?.fullName;
                  const bucketName = r?.account_bucket?.name;
                  const contact = Array.isArray(r?.customer_info?.contact_no)
                    ? r.customer_info.contact_no[0]
                    : "";
                  const gender = r?.customer_info?.gender;
                  const ob = r?.out_standing_details?.total_os;
                  const balance = r?.balance;
                  const principal = r?.out_standing_details?.principal_os;
                  const payment = r?.out_standing_details?.last_payment_amount;
                  const paymentDate = r?.out_standing_details?.last_payment_date;

                  return (
                    <motion.div
                      key={String(r._id)}
                      className="grid grid-cols-9 gap-2 px-2 py-2 text-sm border-t items-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="truncate">{renderText(name, "No name")}</div>
                      <div className="truncate">{renderText(bucketName, "No bucket")}</div>
                      <div className="truncate">
                        {renderText(contact, "No contact number")}
                      </div>
                      <div className="truncate">
                        {renderText(formatGender(gender), "No gender")}
                      </div>
                      <div className="truncate">
                        {renderText(formatPhp(ob), "No outstanding balance")}
                      </div>
                      <div className="truncate">
                        {balance === 0 || balance ? (
                          renderText(formatPhp(balance), "")
                        ) : (
                          <div className="truncate text-gray-400 italic text-xs">
                            No balance
                          </div>
                        )}
                      </div>
                      <div className="truncate">
                        {renderText(formatPhp(principal), "No principal")}
                      </div>
                      <div className="truncate">
                        {renderText(formatPhp(payment), "No payment")}
                      </div>
                      <div className="truncate">
                        {renderText(paymentDate, "No payment date")}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MasterFileView;
