import { useState } from "react";
import misTlImage from "../../images/TL.jpg";
import agent from "../../images/Agent.avif";
import qa from "../../images/QA.jpg";
import TLCustomerPanel from "../../images/TLCustomer.png";
import TLCustomerPanelAuto from "../../images/TLCustomerAuto.png"
import TlDashboard from "../../images/TLDashboard.png";
import TLProductionManager from "../../images/TLProduction.png";
import TLAgentProduction from "../../images/TLAgentProd.png";
import TLReport from "../../images/TLReport.png";
import TLLogs from "../../images/TLLogs.png";
import TLProductionManagerAuto from "../../images/TLProductionAuto.png";
import TLTaskManager from "../../images/TLTaskManager.png";
import { motion, AnimatePresence } from "framer-motion";

const CCSFlow = () => {
  const [selectedTab, setSelectedTab] = useState("");
  const [agentSelectedTab, setAgentSelectedTab] = useState("dashboard");
  const [qaSupervisorSelectedTab, setQaSupervisorSelectedTab] =
    useState("dashboard");
  const [misSelectedTab, setMisSelectedTab] = useState("dashboard");
  return (
    <div className="p-4 h-full max-h-[400dvh]">
      <motion.div
        className="bg-gray-300 overflow-hidden h-full rounded-md shadow-md border"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="h-[10%] bg-gray-400 border-b font-black uppercase text-center justify-center text-4xl flex items-center w-full">
          CCS Flow
        </div>
        <div className="h-[90%] grid grid-cols-3 p-3 gap-2">
          <div
            onClick={() => setSelectedTab("tl")}
            className="bg-black relative overflow-hidden hover:bg-gray-200 transition-all font-black border shadow-md rounded-md flex items-center cursor-pointer justify-center text-2xl"
          >
            <img
              className="absolute object-cover rounded-lg top-0 left-0 w-full h-full"
              src={misTlImage}
            />
            <div className="z-20 rounded-md w-full h-full flex items-center justify-center bg-black/60 hover:bg-black/80 transition-all backdrop-blur-sm text-white text-shadow-2xs">
              MIS/TL SIDE
            </div>
          </div>

          <div
            onClick={() => setSelectedTab("agent")}
            className="bg-black relative overflow-hidden hover:bg-gray-200 transition-all font-black border shadow-md rounded-md flex items-center cursor-pointer justify-center text-2xl"
          >
            <img
              className="absolute object-cover rounded-lg top-0 left-0 w-full h-full"
              src={agent}
            />
            <div className="z-20 rounded-md w-full h-full flex items-center justify-center bg-black/60 hover:bg-black/80 transition-all backdrop-blur-sm text-white text-shadow-2xs">
              AGENT SIDE
            </div>
          </div>

          <div
            onClick={() => setSelectedTab("qa")}
            className="bg-black relative overflow-hidden hover:bg-gray-200 transition-all font-black border shadow-md rounded-md flex items-center cursor-pointer justify-center text-2xl"
          >
            <img
              className="absolute object-cover rounded-lg top-0 left-0 w-full h-full"
              src={qa}
            />
            <div className="z-20 uppercase rounded-md w-full h-full flex items-center justify-center bg-black/60 hover:bg-black/80 transition-all backdrop-blur-sm text-white text-shadow-2xs">
              QA/QA Supervisor SIDE
            </div>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {selectedTab === "tl" && (
          <motion.div
            className="absolute p-6 top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-100 rounded-md overflow-auto shadow-md w-full h-full border"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="text-2xl relative font-black uppercase flex items-center justify-center border-b bg-gray-400 h-[10%]">
                MIS/TL SIDE
                <div
                  className="absolute p-1 bg-red-600 hover:bg-red-700 rounded-full border-2 border-red-800 top-4 right-4 cursor-pointer text-3xl font-black z-50"
                  onClick={() => setSelectedTab("")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-5 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div className="h-[90%] flex flex-col gap-2 p-2">
                <div className=" grid grid-cols-7  gap-2 w-full h-[5%]">
                  <div
                    onClick={() => setMisSelectedTab("dashboard")}
                    className={`" ${
                      misSelectedTab === "dashboard"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex truncate items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    dashboard
                  </div>

                  <div
                    onClick={() => setMisSelectedTab("customerpanel")}
                    className={`" ${
                      misSelectedTab === "customerpanel" ||
                      misSelectedTab === "customerpanelauto"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase truncate flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    customer panel
                  </div>

                  <div
                    onClick={() => setMisSelectedTab("taskmanager")}
                    className={`" ${
                      misSelectedTab === "taskmanager"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex truncate items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    task manager
                  </div>

                  <div
                    onClick={() => {
                      if (misSelectedTab === "productionmanagerauto") {
                        setMisSelectedTab("productionmanagerauto");
                      } else {
                        setMisSelectedTab("productionmanager");
                      }
                    }}
                    className={`" ${
                      misSelectedTab === "productionmanager" ||
                      misSelectedTab === "productionmanagerauto"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex truncate items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    production manager
                  </div>

                  <div
                    onClick={() => setMisSelectedTab("agentproduction")}
                    className={`" ${
                      misSelectedTab === "agentproduction"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase truncate flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    {" "}
                    agent production
                  </div>

                  <div
                    onClick={() => setMisSelectedTab("report")}
                    className={`" ${
                      misSelectedTab === "report"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex truncate items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    {" "}
                    report
                  </div>

                  <div
                    onClick={() => setMisSelectedTab("logs")}
                    className={`" ${
                      misSelectedTab === "logs"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    {" "}
                    logs
                  </div>
                </div>

                <div className="h-[95%] border rounded-md p-5 bg-white shadow-md overflow-auto">
                  <AnimatePresence mode="wait">
                    {misSelectedTab === "dashboard" && (
                      <motion.div
                        key={"tl-dashboard"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center text-4xl font-black"
                      >
                        {TlDashboard && (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TlDashboard}
                          />
                        )}
                      </motion.div>
                    )}

                    {misSelectedTab === "taskmanager" && (
                      <motion.div
                        key={"tl-taskmanager"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center text-4xl font-black"
                      >
                        {TlDashboard && (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TLTaskManager}
                          />
                        )}
                      </motion.div>
                    )}

                    {(misSelectedTab === "customerpanel" ||
                      misSelectedTab === "customerpanelauto") && (
                      <motion.div
                        key={misSelectedTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full relative h-full flex items-center justify-center text-4xl font-black"
                      >
                        {misSelectedTab === "customerpanel" ? (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TLCustomerPanel}
                          />
                        ) : (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TLCustomerPanelAuto}
                          />
                        )}

                        <motion.div
                          whileTap={{ scale: 0 }}
                          onClick={() => {
                            if (misSelectedTab === "customerpanelauto") {
                              setMisSelectedTab("customerpanel");
                            } else {
                              setMisSelectedTab("customerpanelauto");
                            }
                          }}
                          className="absolute text-base uppercase bg-blue-600 hover:bg-blue-700 transition-all border-2 border-blue-800 text-white shadow-md px-3 py-2 rounded-md top-0 cursor-pointer right-0"
                        >
                          {misSelectedTab === "customerpanelauto"
                            ? "No Auto dialer"
                            : "Auto dialer"}
                        </motion.div>
                      </motion.div>
                    )}

                    {(misSelectedTab === "productionmanager" ||
                      misSelectedTab === "productionmanagerauto") && (
                      <motion.div
                        key={misSelectedTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full relative flex items-center justify-center text-4xl font-black"
                      >
                        {misSelectedTab === "productionmanager" ? (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TLProductionManager}
                          />
                        ) : (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TLProductionManagerAuto}
                          />
                        )}
                        <motion.div
                          whileTap={{ scale: 0 }}
                          onClick={() => {
                            if (misSelectedTab === "productionmanagerauto") {
                              setMisSelectedTab("productionmanager");
                            } else {
                              setMisSelectedTab("productionmanagerauto");
                            }
                          }}
                          className="absolute text-base uppercase bg-blue-600 hover:bg-blue-700 transition-all border-2 border-blue-800 text-white shadow-md px-3 py-2 rounded-md top-0 cursor-pointer right-0"
                        >
                          {misSelectedTab === "productionmanagerauto"
                            ? "No Auto dialer"
                            : "Auto dialer"}
                        </motion.div>
                      </motion.div>
                    )}

                    {misSelectedTab === "agentproduction" && (
                      <motion.div
                        key="tl-agentproduction"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center text-4xl font-black"
                      >
                        {TLCustomerPanel && (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TLAgentProduction}
                          />
                        )}
                      </motion.div>
                    )}

                    {misSelectedTab === "report" && (
                      <motion.div
                        key="tl-report"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center text-4xl font-black"
                      >
                        {TLCustomerPanel && (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TLReport}
                          />
                        )}
                      </motion.div>
                    )}

                    {misSelectedTab === "logs" && (
                      <motion.div
                        key="tl-logs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center text-4xl font-black"
                      >
                        {TLCustomerPanel && (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TLLogs}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTab === "agent" && (
          <motion.div
            className="absolute p-6 top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-100 rounded-md overflow-auto shadow-md w-full h-full border"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="text-2xl relative font-black uppercase flex items-center justify-center border-b bg-gray-400 h-[10%]">
                AGENT SIDE
                <div
                  className="absolute p-1 bg-red-600 hover:bg-red-700 rounded-full border-2 border-red-800 top-4 right-4 cursor-pointer text-3xl font-black z-50"
                  onClick={() => setSelectedTab("")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-5 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div className="h-[90%] flex flex-col gap-2 p-2">
                <div className=" grid grid-cols-7 truncate gap-2 w-full h-[5%]">
                  <div
                    onClick={() => setAgentSelectedTab("dashboard")}
                    className={`" ${
                      agentSelectedTab === "dashboard"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black col-start-3 uppercase flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    dashboard
                  </div>

                  <div
                    onClick={() => setAgentSelectedTab("customerpanel")}
                    className={`" ${
                      agentSelectedTab === "customerpanel"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    customer panel
                  </div>

                  <div
                    onClick={() => setAgentSelectedTab("report")}
                    className={`" ${
                      agentSelectedTab === "report"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    report
                  </div>
                </div>

                <div className="h-[95%] border rounded-md p-5 bg-white shadow-md overflow-auto">
                  <AnimatePresence mode="wait">
                    {agentSelectedTab === "dashboard" && (
                      <motion.div
                        key="agent-dashboard"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center text-4xl font-black"
                      >
                        {TlDashboard && (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TlDashboard}
                          />
                        )}
                      </motion.div>
                    )}

                    {agentSelectedTab === "customerpanel" && (
                      <motion.div
                        key="agent-customerpanel"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center text-4xl font-black"
                      >
                        {TLCustomerPanel && (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TLCustomerPanel}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTab === "qa" && (
          <motion.div
            className="absolute p-6 top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-100 rounded-md overflow-auto shadow-md w-full h-full border"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="text-2xl relative font-black uppercase flex items-center justify-center border-b bg-gray-400 h-[10%]">
                QA/QA supervisor SIDE
                <div
                  className="absolute p-1 bg-red-600 hover:bg-red-700 rounded-full border-2 border-red-800 top-4 right-4 cursor-pointer text-3xl font-black z-50"
                  onClick={() => setSelectedTab("")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-5 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div className="h-[90%] relative flex flex-col gap-2 p-2">
                <div className=" grid grid-cols-8 truncate gap-2 w-full h-[5%]">
                  <div
                    onClick={() => setQaSupervisorSelectedTab("dashboard")}
                    className={`" ${
                      qaSupervisorSelectedTab === "dashboard"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black col-start-2 uppercase flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    dashboard
                  </div>

                  <div
                    onClick={() => setQaSupervisorSelectedTab("accounts")}
                    className={`" ${
                      qaSupervisorSelectedTab === "accounts"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    accounts
                  </div>

                  <div
                    onClick={() =>
                      setQaSupervisorSelectedTab("agentrecordings")
                    }
                    className={`" ${
                      qaSupervisorSelectedTab === "agentrecordings"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    agent recordings
                  </div>

                  <div
                    onClick={() => setQaSupervisorSelectedTab("logs")}
                    className={`" ${
                      qaSupervisorSelectedTab === "logs"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    logs
                  </div>

                  <div
                    onClick={() => setQaSupervisorSelectedTab("report")}
                    className={`" ${
                      qaSupervisorSelectedTab === "report"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    reports
                  </div>

                  <div
                    onClick={() => setQaSupervisorSelectedTab("scoresheet")}
                    className={`" ${
                      qaSupervisorSelectedTab === "scoresheet"
                        ? "bg-gray-200 border-gray-100 text-gray-400/60 cursor-not-allowed "
                        : "bg-gray-300 hover:bg-gray-400 shadow-md cursor-pointer"
                    } font-black uppercase flex items-center border rounded-md transition-all text-center w-full justify-center   "`}
                  >
                    score sheet
                  </div>
                </div>

                <div className="h-[95%] relative border rounded-md p-5 bg-white shadow-md overflow-auto">
                  <div
                    title="Turn it into QA Supervisor side"
                    className="absolute top-2 right-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-all border-2 shadow-md rounded-md text-white border-blue-800 font-black cursor-pointer"
                  >
                    QASV
                  </div>
                  <AnimatePresence mode="wait">
                    {qaSupervisorSelectedTab === "dashboard" && (
                      <motion.div
                        key="qa-dashboard"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center text-4xl font-black"
                      >
                        {TlDashboard && (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TlDashboard}
                          />
                        )}
                      </motion.div>
                    )}

                    {qaSupervisorSelectedTab === "customerpanel" && (
                      <motion.div
                        key="qa-customerpanel"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center text-4xl font-black"
                      >
                        {TLCustomerPanel && (
                          <img
                            className="max-h-full  flex max-w-full"
                            src={TLCustomerPanel}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CCSFlow;
