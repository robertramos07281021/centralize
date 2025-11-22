
import { motion} from "framer-motion";

const UBScoreCard = () => {
  return (
    <div className="p-10 flex flex-col  text-black w-full h-full">
      <motion.div
        className="border flex rounded-md overflow-hidden flex-col h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className=" font-black border-b  uppercase bg-gray-400 text-2xl text-center py-3 w-full text-black">
          COLLECTION CALL PERFORMANCE MONITOR
        </div>

        <div className="bg-gray-300 p-5 flex flex-col h-full">
          <div className="flex justify-between">
            <div className="border overflow-hidden rounded-md font-black uppercase text-sm shadow-md">
              <div className="grid grid-cols-2 border-b">
                <div className="bg-gray-400 rounded-tl px-5 border-r py-1">
                  For the month
                </div>
                <input className="ml-2 outline-none" type="text" />
              </div>
              <div className="grid grid-cols-2 border-b">
                <div className="bg-gray-400  px-5 border-r py-1">
                  Collection officer
                </div>
                <input className="ml-2 outline-none" type="text" />
              </div>
              <div className="grid grid-cols-2 ">
                <div className="bg-gray-400 rounded-bl px-5 border-r py-1">
                  Evaluator
                </div>
                <input className="ml-2 outline-none" type="text" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UBScoreCard;
