import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Loading from "../Loading";
import { useAppDispatch } from "../../redux/store";
import { setSuccess } from "../../redux/slices/authSlice";
import { motion } from "framer-motion";

const UPDATE_DATABASE = gql`
  mutation updateDatabase {
    updateDatabase {
      message
      success
    }
  }
`;
type Success = {
  success: boolean;
  message: string;
};

const AdminDashboard = () => {
  const dispatch = useAppDispatch();

  const [updateDatabase, { loading }] = useMutation<{
    updateDatabase: Success;
  }>(UPDATE_DATABASE, {
    onCompleted: (res) => {
      const result = res.updateDatabase;
      dispatch(
        setSuccess({
          success: result.success,
          message: result.message,
          isMessage: false,
        })
      );
    },
    onError: (error) => {
      console.log(error.message);
    },
  });

  if (loading) return <Loading />;

  return (
    <div className="relative justify-center items-center w-full h-full flex">
      <motion.button
        onClick={async () => await updateDatabase()}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="bg-blue-500 items-center gap-2 flex px-3 rounded-sm font-black uppercase text-blue-900 shadow-md hover:bg-blue-600 cursor-pointer hover:shadow-xl transition-all border-2 border-blue-800 py-1">
          <div className="">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </div>
          <div>upDate</div>
        </div>
      </motion.button>
    </div>
  );
};

export default AdminDashboard;
