import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { motion } from "framer-motion";
const DEPT_USER = gql`
  query Query {
    findAgents {
      _id
      name
    }
  }
`;
type DeptUser = {
  _id: string;
  name: string;
};

type ComponentProp = {
  close: () => void;
};

const UpdatedAccountHistory: React.FC<ComponentProp> = ({ close }) => {
  const { selectedCustomer } = useSelector((state: RootState) => state.auth);
  const { data } = useQuery<{ findAgents: DeptUser[] }>(DEPT_USER, {
    skip: !selectedCustomer,
  });
  const history = Array.isArray(selectedCustomer?.account_update_history)
    ? [...selectedCustomer?.account_update_history].sort(
        (a, b) =>
          new Date(b.updated_date).getTime() -
          new Date(a.updated_date).getTime()
      )
    : [];

  const userObject = useMemo(() => {
    const newData = data?.findAgents || [];
    return Object.fromEntries(newData.map((e) => [e._id, e.name]));
  }, [data]);

  return (
    <div className="w-full h-full z-50 gap-5 absolute top-0 left-0 bg-black/50 backdrop-blur-[2px] p-5">
      <motion.div
        className="w-full h-full border rounded-md border-slate-500 bg-white p-5 flex flex-col"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex justify-between items-start">
          <h1 className="text-[0.7rem] md:text-base 2xl:text-xl pb-5  font-black text-black uppercase">
            Updated Account History -{" "}
            {selectedCustomer?.customer_info?.fullName}
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
            onClick={close}
          /> */}
        </div>
        <div className="h-full overflow-y-auto">
          <div className="w-full table-fixed">
            <div className=" text-black py-2 font-black uppercase items-center gap-2 px-2 border grid grid-cols-5 rounded-t-md text-sm text-left select-none bg-gray-300">
              <div className="">Principal</div>
              <div>Out Standing Balance</div>
              <div>Balance</div>
              <div>Updated By</div>
              <div>Date</div>
            </div>
            <div>
              {history.length > 0 ? (
                history?.map((x, index) => {
                  return (
                    <div key={index} className=" text-black py-2 font-black uppercase items-center gap-2 px-2 border grid grid-cols-5 rounded-t-md text-sm text-left select-none bg-gray-300">
                      <div className="pl-5 py-1.5">
                        {x.principal_os
                          ? x.principal_os?.toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })
                          : (0).toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })}
                      </div>
                      <div>
                        {x.total_os
                          ? x.total_os?.toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })
                          : (0).toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })}
                      </div>
                      <div>
                        {x.balance
                          ? x.balance?.toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })
                          : (0).toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })}
                      </div>
                      <div className="capitalize">
                        {userObject[x.updated_by]}
                      </div>
                      <div>
                        {new Date(x.updated_date)?.toLocaleDateString()} -{" "}
                        {new Date(x.updated_date).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-3 bg-gray-200 italic border-black text-gray-400 text-center border-x border-b rounded-b-md">
                  No update history
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UpdatedAccountHistory;
