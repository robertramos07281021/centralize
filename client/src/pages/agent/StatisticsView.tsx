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
`

type Sucess = {
  user: Users
  success: boolean
  message: string
}

const StatisticsView = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch()
  const [vici_id,setVici_id] = useState<string | null>(null)
  const [required, setRequired] = useState<boolean>(false)

  const [updateUserVici_id] = useMutation<{updateUserVici_id:Sucess}>(INPUT_VICI,{
    onCompleted: (data) => {
      setRequired(false)
      setVici_id(null)
      setOpen(false)
      const updateVici_id = data?.updateUserVici_id?.user?.vici_id ?? "";

      if(userLogged){
        dispatch(setUserLogged({...userLogged, vici_id: updateVici_id }))
        dispatch(setSuccess({
          success: data.updateUserVici_id.success,
          message: data.updateUserVici_id.message,
          isMessage: false
        }))
      }

    },
    onError: (err) => {
      dispatch(setSuccess({
        success: true,
        message: err.message,
        isMessage: false
      }))
    }
  })


  const onSubmitVici_Id = useCallback(async()=> {
    if(!vici_id) {
      setRequired(true)
    } else {
      setRequired(false)
      await updateUserVici_id({variables: {vici_id: vici_id}})
    }
  },[updateUserVici_id,vici_id])

 
  return (
    <div className="flex flex-col lg:h-full bg-slate-200 relative lg:overflow-hidden ">
      {
        !userLogged?.vici_id &&
        <div className="absolute top-16 right-6 flex items-center justify-center">
          <CgDanger
            onClick={() => setOpen(true)}
            className={`"  text-4xl p-1 shadow-md cursor-pointer rounded-full  bg-red-600 z-20 "`}
            color="white"
          />
          <div className="w-10 h-10 border absolute bg-red-600 z-10 border-red-500 animate-ping rounded-full"></div>
        </div>
      }
      <div className="p-2">
        <AgentTimer />
      </div>
      <div className=" h-full w-full grid grid-cols-1 lg:grid-cols-9 lg:grid-rows-4 lg:gap-2 overflow-hidden grid-rows-3 gap-2 p-2">
        <DashboardMinis />
        <MixedChartView />
        <MixedChartMonthView />
        <OverallPerformance />
      </div>
      <AnimatePresence>
        {open && (
          <div className="absolute top-0 justify-center z-50 items-center flex left-0 w-full h-full">
            <motion.div
              onClick={() => {setOpen(false); setRequired(false)} }
              className="bg-[#00000073] cursor-pointer h-full w-full backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>
            <div className="absolute">
              <motion.div
                className="bg-white   p-5 rounded-md shadow-md"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{scale: 0.5, opacity: 0}}
                transition={{}}
              >
                <div className="mb-3 text-center font-black uppercase text-3xl">
                  input the vcI id
                </div>
                <input
                  className={`${required ? "bg-red-200" : "bg-gray-200" }  w-full px-4 py-1 rounded-md shadow-md `}
                  placeholder="Enter Vici dial ID"
                  value={vici_id || ""}
                  onChange={(e)=> {
                    const value = e.target.value.trim() === "" ? null : e.target.value
                    setVici_id(value)
                  }}
                />

                <div className="flex mt-5 font-black text-white  uppercase gap-3">
                  <div
                    onClick={() => {setOpen(false); setRequired(false)}}
                    className="py-2 px-3 bg-red-600 border-2 border-red-800 hover:bg-red-800 cursor-pointer transition-all rounded-md shadow-md "
                  >
                    No
                  </div>
                  <div className="py-2 w-full text-center border-2 border-green-800 hover:bg-green-800 transition-all cursor-pointer bg-green-600 rounded-md shadow0-md"
                  onClick={onSubmitVici_Id}
                  >
                    yes
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatisticsView;
