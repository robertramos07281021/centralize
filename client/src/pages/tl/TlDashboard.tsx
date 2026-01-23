import PTP from "./PTP";
import PTPKeptTl from "./PTPKeptTl";
// import Paid from "./Paid";
import TLDailyCollected from "./TLDailyCollected";
import TLAgentProduction from "./TLAgentProduction";
import Targets from "./Targets";
import DailyFTE from "./DailyFTE";
import { useEffect, useMemo, useRef, useState } from "react";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import {
  setIntervalTypes,
  setSelectedBucket,
} from "../../redux/slices/authSlice";
import MessageModal, { MessageChildren } from "./MessageModal";
import { IntervalsTypes } from "../../middleware/types.ts";
import { useLocation } from "react-router-dom";
// import NoPTPPayment from "./NoPTPPayment.tsx";
import { motion, AnimatePresence } from "framer-motion";

const DEPT_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      _id
      name
      principal
      isActive
    }
  }
`;

export type Bucket = {
  _id: string;
  name: string;
  principal: boolean;
  isActive: boolean;
};

const AOM_BUCKET = gql`
  query findAomBucket {
    findAomBucket {
      buckets {
        _id
        name
      }
    }
  }
`;

type AomBucket = {
  buckets: Bucket[];
};

const TlDashboard = () => {
  const { userLogged, selectedBucket, intervalTypes } = useSelector(
    (state: RootState) => state.auth
  );

  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [showIntervals, setShowIntervals] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const pathName = location.pathname.slice(1);
  const isTLDashboard = ["tl-dashboard", "aom-dashboard"].includes(pathName);

  const { data, refetch } = useQuery<{ getAllBucket: Bucket[] }>(DEPT_BUCKET, {
    notifyOnNetworkStatusChange: true,
    skip: !isTLDashboard,
  });

  const { data: aomBucketData, refetch: bucketDateRefetch } = useQuery<{
    findAomBucket: AomBucket[];
  }>(AOM_BUCKET, { notifyOnNetworkStatusChange: true, skip: !isTLDashboard });

  const newAomBucketsData =
    aomBucketData?.findAomBucket.flatMap((ab) => ab.buckets) || [];

  const buckets =
    userLogged?.type === "AOM"
      ? newAomBucketsData.map((abd) => abd._id)
      : userLogged?.buckets;

  const bucketObject: { [key: string]: string } = useMemo(() => {
    const bucketData = data?.getAllBucket || [];
    return Object.fromEntries(bucketData.map((bd) => [bd._id, bd.name]));
  }, [data]);
  const [isOpenMessage, setIsopenMessage] = useState<boolean>(false);

  const bucketSelectorRef = useRef<HTMLDivElement | null>(null);
  const intervalSelectorRef = useRef<HTMLDivElement | null>(null);

  const findBucket = data?.getAllBucket.find(
    (bucket) => bucket._id === selectedBucket
  );

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await bucketDateRefetch();
    };
    refetching();
  }, []);

  useEffect(() => {
    if (isTLDashboard && userLogged && !selectedBucket) {
      if (userLogged.type === "AOM") {
        dispatch(setSelectedBucket(newAomBucketsData[0]?._id));
      } else {
        dispatch(setSelectedBucket(userLogged?.buckets[0]));
      }
    }
  }, [location.pathname, userLogged]);

  useEffect(() => {
    if (findBucket && findBucket.principal) {
      dispatch(setIntervalTypes(IntervalsTypes.DAILY));
    }
  }, [findBucket]);

  const messageRef = useRef<MessageChildren | null>(null);

  return (
    <div
      className="h-full overflow-hidden p-2 grid grid-rows-13 grid-cols-8 bg-slate-600/10 gap-2 relative"
      onMouseDown={(e) => {
        if (!bucketSelectorRef.current?.contains(e.target as Node)) {
          setShowSelector(false);
        }
        if (!intervalSelectorRef.current?.contains(e.target as Node)) {
          setShowIntervals(false);
        }
        if (!messageRef.current?.divElement?.contains(e.target as Node)) {
          setIsopenMessage(false);
        }
      }}
    >
      <div className="grid grid-cols-6 gap-2 col-span-6 row-span-2">
        <DailyFTE />
        <motion.div
          className="grid grid-cols-3 col-span-3 gap-2 "
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <TLDailyCollected />
          <PTP />
          <PTPKeptTl />
          {/* <NoPTPPayment />
          <Paid /> */}
        </motion.div>
      </div>

      <motion.div
        className="col-span-6 grid grid-cols-full row-span-11 gap-2"
        transition={{ type: "spring", duration: 1 }}
      >
        <TLAgentProduction />
      </motion.div>
      <Targets />
      <AnimatePresence>
        {showSelector && (
          <motion.div
            className="absolute bottom-4 right-14 w-auto h-100 overflow-auto border bg-white rounded-md border-black p-2 flex flex-col gap-2 "
            ref={bucketSelectorRef}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {buckets?.map((x) => {
              const findBucket = data?.getAllBucket.find((y) => x === y._id);
              
              return (
                findBucket?.isActive && (
                  <label
                    key={x}
                    className={`w-full h-auto border border-black text-black hover:bg-gray-300 cursor-pointer px-2 py-1 rounded ${
                      selectedBucket === x ? "bg-gray-200" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="bucketSelector"
                      id={bucketObject[x]}
                      value={x}
                      onChange={() => dispatch(setSelectedBucket(x))}
                      hidden
                    />
                    {bucketObject[x]}
                  </label>
                )
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showIntervals && (
          <motion.div
            className="absolute bottom-4 right-14 w-2/20 border bg-white rounded-md border-black p-2 flex flex-col gap-2"
            ref={intervalSelectorRef}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {Object.entries(IntervalsTypes).map(([key, value]) => (
              <label
                key={key}
                className={`w-full border border-black text-black hover:bg-slate-200 cursor-pointer px-2 py-1 rounded ${
                  value === intervalTypes ? "bg-gray-200" : ""
                }`}
              >
                <input
                  type="radio"
                  name="bucketSelector"
                  id={value}
                  value={value}
                  onChange={(e) =>
                    dispatch(setIntervalTypes(e.target.value as IntervalsTypes))
                  }
                  hidden
                />
                <span className="uppercase">{value}</span>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpenMessage && (
          <MessageModal
            bucket={findBucket}
            ref={messageRef}
            closeModal={() => setIsopenMessage(false)}
          />
        )}
      </AnimatePresence>

      <div className="text-3xl absolute bottom-5 right-5 flex flex-col gap-2">
        <motion.div
          onClick={() => setIsopenMessage((prev) => !prev)}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <div className={`" ${isOpenMessage ? "scale-105" : "opacity-25 hover:opacity-100 hover:scale-105 hover:shadow-xl"} w-8 flex items-center justify-center cursor-pointer h-8 bg-white  transition-all  border rounded-full "`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-4"
            >
              <path
                fillRule="evenodd"
                d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97-1.94.284-3.916.455-5.922.505a.39.39 0 0 0-.266.112L8.78 21.53A.75.75 0 0 1 7.5 21v-3.955a48.842 48.842 0 0 1-2.652-.316c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </motion.div>
        {!findBucket?.principal && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", duration: 1, delay: 0.1 }}
            onClick={() => setShowIntervals((prev) => !prev)}
          >
            <div
              className={`" ${
                showIntervals
                  ? "scale-105"
                  : "opacity-25 hover:opacity-100 hover:scale-105 hover:shadow-xl"
              } w-8 flex items-center justify-center cursor-pointer h-8 bg-white  transition-all border rounded-full "`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M3.792 2.938A49.069 49.069 0 0 1 12 2.25c2.797 0 5.54.236 8.209.688a1.857 1.857 0 0 1 1.541 1.836v1.044a3 3 0 0 1-.879 2.121l-6.182 6.182a1.5 1.5 0 0 0-.439 1.061v2.927a3 3 0 0 1-1.658 2.684l-1.757.878A.75.75 0 0 1 9.75 21v-5.818a1.5 1.5 0 0 0-.44-1.06L3.13 7.938a3 3 0 0 1-.879-2.121V4.774c0-.897.64-1.683 1.542-1.836Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </motion.div>
        )}
        {userLogged && buckets && buckets?.length > 1 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", duration: 1, delay: 0.2 }}
            onClick={() => setShowSelector((prev) => !prev)}
          >
            <div
              className={`" ${
                showSelector
                  ? "scale-105"
                  : "hover:scale-105 hover:shadow-xl opacity-25 hover:opacity-100"
              } w-8 flex items-center justify-center cursor-pointer h-8 bg-white  transition-all border rounded-full "`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4"
              >
                <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                <path
                  fillRule="evenodd"
                  d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </motion.div>
        )}

        {/* <SiGooglemessages
          className="cursor-pointer bg-white rounded-full"
          onClick={() => setIsopenMessage((prev) => !prev)}
        /> */}
        {/* {!findBucket?.principal && (
          <BsFilterCircleFill
            className="cursor-pointer bg-white rounded-full"
            onClick={() => setShowIntervals((prev) => !prev)}
          />
        )} */}
        {/* {userLogged && buckets && buckets?.length > 1 && (
          <BsFillPlusCircleFill
            className={`cursor-pointer duration-200 bg-white rounded-full ${
              showSelector ? "rotate-45" : ""
            }`}
            onClick={() => setShowSelector((prev) => !prev)}
          />
        )} */}
      </div>
    </div>
  );
};

export default TlDashboard;
