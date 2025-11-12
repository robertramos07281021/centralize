import { Search } from "../middleware/types";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { RootState, useAppDispatch } from "../redux/store";
import { setSelectedCustomer, setServerError } from "../redux/slices/authSlice";
import { gql, useMutation } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import Confirmation from "./Confirmation";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";

type ComponentProps = {
  others: Search[] | [];
  close: () => void;
};

const DESELECT_TASK = gql`
  mutation deselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`;

const SELECT_TASK = gql`
  mutation Mutation($id: ID!) {
    selectTask(id: $id) {
      message
      success
    }
  }
`;

const OtherAccountsViews: React.FC<ComponentProps> = ({ others, close }) => {
  const dispatch = useAppDispatch();
  const { selectedCustomer } = useSelector((state: RootState) => state.auth);
  const [confirm, setConfirm] = useState<boolean>(false);
  const [newSelected, setNewSelected] = useState<Search | null>(null);

  const [selectTask] = useMutation(SELECT_TASK, {
    onCompleted: async () => {
      await deselectTask({ variables: { id: selectedCustomer?._id } });
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });
  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "SELECT" as "SELECT",
    yes: () => {},
    no: () => {},
  });

  const [deselectTask] = useMutation<{
    deselectTask: { message: string; success: boolean };
  }>(DESELECT_TASK, {
    onCompleted: () => {
      if (newSelected) dispatch(setSelectedCustomer(newSelected));
      close();
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const handleSelect = useCallback(
    (caId: string, ca: Search) => {
      setConfirm(true);
      setModalProps({
        message: `Do you want to select this account with case id of ${ca.case_id}?`,
        toggle: "SELECT",
        yes: async () => {
          await selectTask({ variables: { id: caId } });
          setNewSelected(ca);
        },
        no: () => {
          setConfirm(false);
        },
      });
    },
    [setConfirm, setModalProps]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  return (
    <>
      <div className="w-full h-full z-50 gap-5 absolute top-0 left-0 bg-black/50 backdrop-blur-[2px] flex p-5">
        <motion.div
          className="border h-full w-full rounded-md border-slate-500 flex flex-col bg-white p-5"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex justify-between items-start">
            <h1 className="text-[0.7rem] md:text-base 2xl:text-xl  font-black text-black uppercase">
              Other Accounts
            </h1>

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
            {/* <IoMdCloseCircleOutline
              className="text-5xl m-3 absolute top-10 right-10 hover:scale-110 cursor-pointer hover:text-gray-400"
              onClick={() => close()}
            /> */}
          </div>

          <div className="mt-4 h-full overflow-y-auto">
            <div className="w-full">
              <div className=" text-black py-2 font-black uppercase items-center gap-2 px-2 border grid grid-cols-9 rounded-t-md text-sm text-left select-none bg-gray-300">
                <div className="truncate" title="Case ID / PN / Account ID">
                  Case ID / PN / Account ID
                </div>
                <div className=" ">DPD</div>
                <div className=" ">MAX DPD</div>
                <div className=" ">Endorsement Date</div>
                <div className=" ">Bill Due Date</div>
                <div className=" ">Principal</div>
                <div className=" ">OB</div>
                <div className=" ">Balance</div>
                <div className=" ">Action</div>
              </div>
              <div>
                {others?.length ||
                  (others?.length === 0 && (
                    <div className="py-3 bg-gray-200 italic border-black text-gray-400 text-center border-x border-b rounded-b-md">
                      No Account
                    </div>
                  ))}
                {others?.map((oa) => {
                  const daysExisting = oa.max_dpd - oa.dpd;
                  const date = new Date();
                  const newDate = new Date(date);
                  newDate.setDate(
                    Number(newDate.getDate()) + Number(daysExisting)
                  );

                  return (
                    <div
                      key={oa._id}
                      className="text-gray-600 text-base text-left select-none even:bg-gray-50"
                    >
                      <div className="pl-5">{oa.case_id}</div>
                      <div className="pl-5">{oa.dpd || "-"}</div>
                      <div className="pl-5">{oa.max_dpd || "-"}</div>
                      <div className="pl-5">{oa.endorsement_date}</div>
                      <div className="pl-5">
                        {oa.dpd && oa.max_dpd ? newDate.toDateString() : "-"}
                      </div>
                      <div className="pl-5">
                        {oa.out_standing_details.principal_os.toLocaleString(
                          "en-PH",
                          { style: "currency", currency: "PHP" }
                        )}
                      </div>
                      <div className="pl-5">
                        {oa.out_standing_details.total_os.toLocaleString(
                          "en-PH",
                          { style: "currency", currency: "PHP" }
                        )}
                      </div>
                      <div className="pl-5">
                        {oa.balance.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        })}
                      </div>
                      <div className="pl-5 py-1.5">
                        <button
                          className=" px-7 py-2 text-sm lg:text-base font-medium bg-orange-500 text-white rounded-md hover:bg-orange-700 cursor-pointer"
                          onClick={() => handleSelect(oa._id, oa)}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {confirm && <Confirmation {...modalProps} />}
    </>
  );
};

export default OtherAccountsViews;
