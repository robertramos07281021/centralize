import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  agentToUpdate: string | null;
  cancel: () => void;
  success: (message: string, success: boolean) => void;
};

const AGENT = gql`
  query getUser($id: ID) {
    getUser(id: $id) {
      targets {
        daily
        weekly
        monthly
      }
    }
  }
`;
type Target = {
  daily: number;
  weekly: number;
  monthly: number;
};

const SET_TARGETS = gql`
  mutation setTargets($userId: ID, $targets: Targets) {
    setTargets(userId: $userId, targets: $targets) {
      message
      success
    }
  }
`;

const SetTargetsModal: React.FC<Props> = ({
  agentToUpdate,
  cancel,
  success,
}) => {
  const { data: agentData, refetch } = useQuery<{
    getUser: { targets: Target };
  }>(AGENT, { variables: { id: agentToUpdate } });

  const [targets, setTarget] = useState({
    daily: "0",
    weekly: "0",
    monthly: "0",
  });

  useEffect(() => {
    const timer = async () => {
      await refetch();
    };

    timer();
  }, []);

  useEffect(() => {
    if (agentData?.getUser?.targets) {
      setTarget({
        daily: agentData?.getUser?.targets?.daily?.toString() || "0",
        weekly: agentData?.getUser?.targets?.weekly.toString() || "0",
        monthly: agentData?.getUser?.targets?.monthly.toString() || "0",
      });
    }
  }, [agentData]);

  const [setTargets] = useMutation<{
    setTargets: { message: string; success: boolean };
  }>(SET_TARGETS, {
    onCompleted: (res) => {
      success(res.setTargets.message, res.setTargets.success);
    },
  });

  const handleSubmitTargets = useCallback(async () => {
    await setTargets({ variables: { userId: agentToUpdate, targets } });
  }, [targets, setTargets, agentToUpdate]);

  return (
    <AnimatePresence>
      <div className="absolute top-0 left-0 overflow-hidden z-50 bg-white/20 backdrop-blur-sm h-full w-full flex items-center justify-center">
        <motion.div
          className="w-[400px] border border-orange-800 h-[400px] rounded-sm overflow-hidden bg-white flex flex-col  shadow-md shadow-black/20"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
        >
          <h1 className="py-2 border-b border-orange-800 text-2xl w-full flex justify-center  px-3 bg-orange-500 uppercase text-center text-white font-black ">
            Set Targets
          </h1>
          <div className="h-full p-5 w-full flex flex-col items-center justify-center gap-5">
            <label className="flex flex-col w-full">
              <p className="text-sm font-bold uppercase text-black">Daily:</p>
              <input
                type="text"
                className="border w-full rounded-md border-black px-2 py-1 text-black"
                value={targets.daily}
                autoComplete="off"
                id="daily"
                name="daily"
                onChange={(e) => {
                  const regex = /^[1-9]\d*$/;
                  const val = e.target.value;
                  if (val === "" || regex.test(val)) {
                    setTarget({ ...targets, daily: val });
                  }
                }}
              />
            </label>
            <label className="flex flex-col w-full">
              <p className="text-sm font-bold uppercase text-black">Weekly:</p>
              <input
                type="text"
                className="border w-full rounded-md border-black px-2 py-1 text-black"
                value={targets.weekly}
                autoComplete="off"
                id="weekly"
                name="weekly"
                onChange={(e) => {
                  const regex = /^[1-9]\d*$/;
                  const val = e.target.value;
                  if (val === "" || regex.test(val)) {
                    setTarget({ ...targets, weekly: val });
                  }
                }}
              />
            </label>
            <label className="flex flex-col w-full">
              <p className="text-sm font-bold uppercase text-black">Monthly:</p>
              <input
                type="text"
                className="border w-full rounded-md border-black px-2 py-1 text-black"
                value={targets.monthly}
                autoComplete="off"
                id="monthly"
                name="monthly"
                onChange={(e) => {
                  const regex = /^[1-9]\d*$/;
                  const val = e.target.value;
                  if (val === "" || regex.test(val)) {
                    setTarget({ ...targets, monthly: val });
                  }
                }}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className="bg-orange-500 border-2 border-orange-800 hover:bg-orange-600 focus:outline-none text-white transition-all rounded-sm uppercase font-black text-sm w-24 py-2.5  cursor-pointer"
                onClick={handleSubmitTargets}
              >
                Submit
              </button>
              <button
                type="button"
                className="bg-gray-300 text-black border-2 border-gray-400 hover:bg-gray-400 transition-all  rounded-sm uppercase text-sm w-24 font-black py-2.5 me-2  cursor-pointer"
                onClick={cancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SetTargetsModal;
