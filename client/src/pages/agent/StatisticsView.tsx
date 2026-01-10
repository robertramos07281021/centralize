import AgentTimer from "./AgentTimer";
import MixedChartView from "./MixedChartView";
import MixedChartMonthView from "./MixedChartMonthView";
import OverallPerformance from "./OverallPerformance";
import DashboardMinis from "./DashboardMinis.tsx";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store.ts";
import { CgDanger } from "react-icons/cg";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { setSuccess, setUserLogged } from "../../redux/slices/authSlice.ts";
import { Users } from "../../middleware/types.ts";

const INPUT_VICI = gql`
  mutation UpdateUserVici_id($vici_id: String!) {
    updateUserVici_id(vici_id: $vici_id) {
      user {
        vici_id
      }
      success
      message
    }
  }
`;

type Sucess = {
  user: Users;
  success: boolean;
  message: string;
};

const StatisticsView = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const [vici_id, setVici_id] = useState<string | null>(null);
  const [required, setRequired] = useState<boolean>(false);

  const [updateUserVici_id] = useMutation<{ updateUserVici_id: Sucess }>(
    INPUT_VICI,
    {
      onCompleted: (data) => {
        setRequired(false);
        setVici_id(null);
        setOpen(false);
        const updateVici_id = data?.updateUserVici_id?.user?.vici_id ?? "";

        if (userLogged) {
          dispatch(setUserLogged({ ...userLogged, vici_id: updateVici_id }));
          dispatch(
            setSuccess({
              success: data.updateUserVici_id.success,
              message: data.updateUserVici_id.message,
              isMessage: false,
            })
          );
        }
      },
      onError: (err) => {
        dispatch(
          setSuccess({
            success: true,
            message: err.message,
            isMessage: false,
          })
        );
      },
    }
  );

  const onSubmitVici_Id = useCallback(async () => {
    if (!vici_id) {
      setRequired(true);
    } else {
      setRequired(false);
      await updateUserVici_id({ variables: { vici_id: vici_id } });
    }
  }, [updateUserVici_id, vici_id]);

  return (
    <div className="flex flex-col h-full bg-slate-200 relative overflow-y-auto  lg:overflow-hidden ">
      {!userLogged?.vici_id && (
        <div className="absolute top-16 right-6 flex items-center justify-center">
          <CgDanger
            onClick={() => setOpen(true)}
            className={`"  text-4xl p-1 shadow-md cursor-pointer rounded-full  bg-red-600 z-20 "`}
            color="white"
          />
          <div className="w-10 h-10 border absolute bg-red-600 z-10 border-red-500 animate-ping rounded-full"></div>
        </div>
      )}
      <div className="p-2">
        <AgentTimer />
      </div>
      <div className=" h-full mb-5 w-full lg:grid flex flex-col grid-cols-1 lg:grid-cols-9 lg:grid-rows-4 lg:gap-2 lg:overflow-hidden grid-rows-3 gap-2 p-2">
        <DashboardMinis />
        <MixedChartView />
        <MixedChartMonthView />
        <OverallPerformance />
      </div>
      <AnimatePresence>
        {open && (
          <div className="absolute top-0 justify-center z-20 items-center flex left-0 w-full h-full">
            <motion.div
              onClick={() => {
                setOpen(false);
                setRequired(false);
              }}
              className="bg-[#00000073] cursor-pointer h-full w-full backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>
            <form onSubmit={onSubmitVici_Id} className="absolute">
              <motion.div
                className="bg-white border  p-5 rounded-md shadow-md"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{}}
              >
                <div className="mb-3 text-center font-black uppercase text-3xl">
                  input your vicI id
                </div>

                <div
                  className={`${
                    required ? "bg-red-200" : "bg-gray-200"
                  }  w-full px-3 py-2 flex border outline-none rounded-md shadow-md `}
                >
                  <input
                    className="w-full bg-transparent outline-none"
                    placeholder="Enter Vici dial ID"
                    value={vici_id || ""}
                    onChange={(e) => {
                      const value =
                        e.target.value.trim() === "" ? null : e.target.value;
                      setVici_id(value);
                    }}
                    required
                  />
                  <div
                    title={
                      "VICI ID is your USER ID in the VICI dialer system\nthe one you use to login to vicidial"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6 cursor-pointer text-blue-800"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 0 1-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 0 1-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584ZM12 18a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <div className="flex mt-5 font-black text-white  uppercase gap-3">
                  <div
                    onClick={() => {
                      setOpen(false);
                      setRequired(false);
                    }}
                    className="py-2 px-3 bg-red-600 border-2 border-red-800 hover:bg-red-800 cursor-pointer transition-all rounded-md shadow-md "
                  >
                    cancel
                  </div>
                  <button
                    type="submit"
                    className="py-2 uppercase w-full text-center border-2 border-green-800 hover:bg-green-800 transition-all cursor-pointer bg-green-600 rounded-md shadow-md"
                  >
                    submit
                  </button>
                </div>
              </motion.div>
            </form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatisticsView;
