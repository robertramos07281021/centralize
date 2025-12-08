import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { accountsNavbar } from "../middleware/exports.ts";
import gql from "graphql-tag";
import { useQuery, useSubscription, useMutation } from "@apollo/client";
import {
  setSuccess,
  setIsRing,
  setOnCall,
  setDeselectCustomer,
  setServerError,
  setIsReport,
  setSelectedCustomer,
} from "../redux/slices/authSlice.ts";
import { useEffect, useState, useCallback } from "react";
import ConfirmationModal from "./Confirmation.tsx";
import { useSingleTabGuard } from "./useSingleTabGuard.tsx";
import { motion, AnimatePresence } from "framer-motion";

type MyTask = {
  case_id: string;
};

const MY_TASK = gql`
  query myTasks {
    myTasks {
      case_id
    }
  }
`;

type SubSuccess = {
  message: string;
  members: string[];
};

type SubSuccessMessage = {
  bucket: string;
  message: string;
};

const SOMETHING_ESCALATING = gql`
  subscription somethingEscalating {
    somethingChanged {
      members
      message
    }
  }
`;
const TASK_CHANGING = gql`
  subscription taskChanging {
    taskChanging {
      members
      message
    }
  }
`;

// const DESELECT_TASK = gql`
//   mutation deselectTask($id: ID!) {
//     deselectTask(id: $id) {
//       message
//       success
//     }
//   }
// `

const SELECTED_BUCKET_MESSAGE = gql`
  query SelectedBucket($id: ID) {
    selectedBucket(id: $id) {
      message
    }
  }
`;

const NEW_BUCKET_MESSAGE = gql`
  subscription Subscription {
    newBucketMessage {
      bucket
      message
    }
  }
`;

const END_CALL = gql`
  mutation endAndDispoCall {
    endAndDispoCall {
      success
      message
    }
  }
`;

const DESELECT_TASK = gql`
  mutation deselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`;

const NEW_UPDATE_ONCALLFILE = gql`
  subscription updateOnCallfiles {
    updateOnCallfiles {
      bucket
      message
    }
  }
`;

const IS_AUTO_DIAL = gql`
  query isAutoDial {
    isAutoDial
  }
`;

const AGENT_BUCKETS = gql`
  query getTLBucket {
    getTLBucket {
      canCall
    }
  }
`;

const NavbarExtn = () => {
  const { userLogged, success, onCall, selectedCustomer } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();
  const { data: myTask, refetch } = useQuery<{ myTasks: MyTask[] }>(MY_TASK, {
    notifyOnNetworkStatusChange: true,
  });
  const dispatch = useAppDispatch();
  const [confirm, setConfirm] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isDuplicate = useSingleTabGuard();

  const { data: agentBucketsData, refetch: agentBucketRefetch } = useQuery<{
    getTLBucket: { canCall: boolean }[];
  }>(AGENT_BUCKETS, {
    notifyOnNetworkStatusChange: true,
  });

  const canCallMap = agentBucketsData?.getTLBucket.map((x) => x.canCall);

  useEffect(() => {
    if (isDuplicate) {
      alert("You already have this app open. Redirecting...");
      window.location.href = "about:blank";
    }
  }, [isDuplicate]);

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await agentBucketRefetch();
    };
    refetching();
  }, []);

  const { refetch: messageRefetch } = useQuery<{
    selectedBucket: { message: string };
  }>(SELECTED_BUCKET_MESSAGE, {
    skip: !success.success,
    notifyOnNetworkStatusChange: true,
  });

  useSubscription<{ somethingChanged: SubSuccess }>(SOMETHING_ESCALATING, {
    onData: async ({ data }) => {
      if (!userLogged) return;
      if (data) {
        if (
          data.data?.somethingChanged?.message === "TASK_SELECTION" &&
          data.data?.somethingChanged?.members
            .toString()
            .includes(userLogged._id)
        ) {
          await refetch();
        }
      }
    },
  });

  useSubscription<{ taskChanging: SubSuccess }>(TASK_CHANGING, {
    onData: async ({ data }) => {
      if (!userLogged) return;
      if (data) {
        if (
          data.data?.taskChanging?.message === "TASK_CHANGING" &&
          data.data?.taskChanging?.members?.toString().includes(userLogged._id)
        ) {
          await refetch();
        }
      }
    },
  });

  useSubscription<{ newBucketMessage: SubSuccessMessage }>(NEW_BUCKET_MESSAGE, {
    onData: async ({ data }) => {
      if (!userLogged) return;
      if (data) {
        if (
          data.data?.newBucketMessage?.message === "NEW_BUCKET_MESSAGE" &&
          userLogged.buckets.includes(data.data?.newBucketMessage?.bucket)
        ) {
          const res = await messageRefetch({
            id: data.data.newBucketMessage.bucket,
          });
          if (res.data) {
            dispatch(
              setSuccess({
                message: res.data.selectedBucket.message,
                success: true,
                isMessage: true,
              })
            );
          }
        }
      }
    },
  });

  const userType = userLogged?.type as keyof typeof accountsNavbar;
  if (!userType || !accountsNavbar[userType]) return null;
  const length = myTask?.myTasks.length || 0;

  const [endAndDispoCall] = useMutation<{
    endAndDispoCall: { success: boolean; message: string };
  }>(END_CALL, {
    onCompleted: async (data) => {
      dispatch(setOnCall(false));
      dispatch(setSelectedCustomer(null));
      dispatch(
        setSuccess({
          message: data.endAndDispoCall.message,
          success: data.endAndDispoCall.success,
          isMessage: false,
        })
      );
    },
  });

  const [deselectTask] = useMutation<{
    deselectTask: { message: string; success: boolean };
  }>(DESELECT_TASK, {
    onCompleted: () => {
      dispatch(setDeselectCustomer());
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  useSubscription<{ updateOnCallfiles: { bucket: string; message: string } }>(
    NEW_UPDATE_ONCALLFILE,
    {
      onData: async ({ data }) => {
        if (data) {
          if (
            userLogged?.buckets.includes(
              data.data?.updateOnCallfiles.bucket as string
            ) &&
            data.data?.updateOnCallfiles.message === "NEW_UPDATE_CALLFILE"
          ) {
            await isAutoDialRefetch();
          }
        }
      },
    }
  );

  const { data: isAutoDialData, refetch: isAutoDialRefetch } = useQuery<{
    isAutoDial: boolean;
  }>(IS_AUTO_DIAL, {
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (
      isAutoDialData?.isAutoDial &&
      userLogged?.type === "AGENT" &&
      !location?.pathname.includes("break-view")
    ) {
      navigate("/agent-cip");
    }
  }, [isAutoDialData?.isAutoDial, location?.pathname]);

  const endCallYes = useCallback(async () => {
    if (selectedCustomer?._id) {
      await deselectTask({ variables: { id: selectedCustomer._id } });
    }

    await endAndDispoCall();
    dispatch(setIsRing(false));
    setConfirm(false);
    if (targetPath) {
      navigate(targetPath);
    }
  }, [endAndDispoCall, targetPath, navigate, dispatch]);

  const navClick = async (link: string) => {
    if (
      (isAutoDialData?.isAutoDial && userLogged?.type === "AGENT") ||
      location.pathname.includes("break-view")
    )
      return null;
    if (onCall) {
      setTargetPath(link);
      setConfirm(true);
    } else {
      navigate(link);
      if (selectedCustomer?._id) {
        await deselectTask({ variables: { id: selectedCustomer._id } });
      }
      dispatch(setIsReport(false));
    }
  };

  return (
    userLogged && (
      <>
        {confirm && (
          <ConfirmationModal
            message="You are currently on a call. End the call before navigating?"
            toggle="DELETE"
            yes={endCallYes}
            no={() => setConfirm(false)}
          />
        )}
        <div className="border-b select-none border-blue-400 flex items-center justify-center text-base font-medium text-slate-500 bg-white print:hidden">
          {accountsNavbar[userType].map((an, index) => {
            const callLogs = an.name.trim().toLowerCase() === "call monitoring";

            if (callLogs && !canCallMap?.includes(true)) return null;

            return (
              <div
                onClick={() => {
                  if (an.link) {
                    navClick(an.link);
                  } else if (an.tabs) {
                    setOpenIndex(index === openIndex ? null : index);
                  }
                }}
                key={index}
                className={`relative justify-center flex items-center ${
                  isAutoDialData?.isAutoDial && userLogged?.type === "AGENT"
                    ? ""
                    : "cursor-pointer"
                }`}
              >
                <div
                  className={`${index > 0 && "border-l "} ${
                    location.pathname.includes(an.link as string) &&
                    "bg-blue-500 hover:bg-blue-500 hover:text-white text-shadow-md text-white"
                  } text-xs ${
                    isAutoDialData?.isAutoDial &&
                    !location.pathname.includes(an.link as string) &&
                    userLogged?.type === "AGENT"
                      ? "bg-gray-200"
                      : "hover:bg-blue-400 hover:text-white border-blue-400 text-gray-500"
                  } py-2 px-3 text-center font-black uppercase transition-all`}
                >
                  {an.name}
                </div>
                <AnimatePresence>
                  {an.tabs && openIndex === index && (
                    <motion.div
                      className="absolute mt-1 bg-white shadow-black/40 top-8  border border-blue-400 rounded-md shadow-md min-w-max z-50"
                      initial={{ opacity: 0, y: -25, scale: 0.5 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -25, scale: 0.5 }}
                      transition={{ duration: 0.5, type: "spring" }}
                    >
                      {an.tabs.map((tab, tabIndex) => (
                        <div
                          key={tabIndex}
                          onClick={() => {
                            if (tab.link) navClick(tab.link);
                          }}
                          className={`px-4 py-2 last:border-b-0 border-b border-blue-400  text-sm transition-all hover:bg-blue-500 font-black uppercase hover:text-white cursor-pointer ${
                            location.pathname.includes(tab.link as string)
                              ? "bg-blue-500 text-white"
                              : "text-gray-500"
                          }`}
                        >
                          {tab.name}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {an.name.includes("Panel") && length > 0 && (
                  <>
                    <div className="absolute text-[0.6em] w-5 h-5 flex items-center justify-center text-white rounded-full bg-red-500 -top-3 border-white border-2 -right-1 z-50">
                      {length}
                    </div>
                    <div className="absolute text-[0.6em] w-5 h-5 flex items-center justify-center rounded-full bg-red-500 -top-3 -right-1 z-40 animate-ping"></div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </>
    )
  );
};

export default NavbarExtn;
