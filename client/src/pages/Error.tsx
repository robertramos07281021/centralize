import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import animationData from "../Animations/Error 404.json";

export const Error = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="w-screen h-screen bg-white flex items-center justify-center  gap-10 flex-col">
      <Lottie animationData={animationData} />

      <button
        className="text-xl animate-bounce  font-black uppercase bg-red-500 px-5 py-2 shadow-md text-white hover:bg-red-600 duration-200 ease-in-out rounded-md border-2 border-red-800 cursor-pointer"
        onClick={handleBack}
      >
        Back
      </button>
    </div>
  );
};
