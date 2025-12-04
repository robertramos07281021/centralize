import { useLocation, useNavigate } from "react-router-dom";
import { setServerError } from "../redux/slices/authSlice";
import { useAppDispatch } from "../redux/store";
import Lottie from "lottie-react";
import animationData from "../Animations/No Connection.json";
import { motion } from "framer-motion";

const ServerError = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const handleClickOk = () => {
    if (location.pathname === "/agent-recordings") {
      navigate("/agent-production");
    } else {
      navigate(location.pathname);
    }
    dispatch(setServerError(false));
  };

  return (
    <motion.div
      className="z-50 flex items-center justify-center absolute top-0 left-0 bg-white/5 backdrop-blur-sm h-full w-full "
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <div className="p-10 border bg-white rounded-2xl border-black shadow-md flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-60 w-60">
            <Lottie animationData={animationData} loop={true} />
          </div>
          <p className="2xl:text-md lg:text-xs font-medium text-gray-600 text-center">
            There is an error on server side. Please waiting for a couple of
            time.
          </p>
        </div>
        <button
          className="text-white mt-5 uppercase 2xl:text-md lg:text-xs bg-red-600 hover:bg-red-700 rounded-md px-9 border-2 border-red-900 shadow-md py-3 cursor-pointer font-bold"
          onClick={handleClickOk}
        >
          OKay
        </button>
      </div>
    </motion.div>
  );
};

export default ServerError;
