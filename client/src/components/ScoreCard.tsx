import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DefaultScoreCard = () => {
  const [isMonthMenuOpen, setMonthMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const monthFieldRef = useRef<HTMLDivElement | null>(null);

  const { userLogged } = useSelector((state: RootState) => state.auth);
  const LoginUser = userLogged?.name || "Unknown";

  useEffect(() => {
    if (!isMonthMenuOpen) {
      return;
    }

    const handleClickAway = (event: MouseEvent) => {
      if (!monthFieldRef.current?.contains(event.target as Node)) {
        setMonthMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway);

    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [isMonthMenuOpen]);

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setMonthMenuOpen(false);
  };

  return (
    <div className="p-10 flex flex-col  text-black w-full h-full">
      <motion.div
        className="border flex rounded-md overflow-hidden flex-col h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className=" font-black border-b  uppercase bg-gray-400 text-2xl text-center py-3 w-full text-black">
          QA Evaluation Page
        </div>
        <div className="bg-gray-300 p-5 flex flex-col h-full">
          <div className="flex justify-between">
            <div className="border rounded-md font-black uppercase text-sm shadow-md">
              <div className="grid grid-cols-2 border-b">
                <div className="bg-gray-400 rounded-tl px-5 border-r py-1">
                  Month
                </div>
                <div className="relative" ref={monthFieldRef}>
                  <motion.div
                    role="button"
                    tabIndex={0}
                    className="flex text-black cursor-pointer rounded-tr hover:bg-gray-400 items-center justify-between gap-2  px-3 py-1 text-sm shadow-sm"
                    onClick={() => setMonthMenuOpen((prev) => !prev)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setMonthMenuOpen((prev) => !prev);
                      }
                    }}
                    aria-expanded={isMonthMenuOpen}
                    aria-haspopup="listbox"
                  >
                    <span>{selectedMonth || "Select Month"}</span>
                    <motion.span
                      className="text-xs"
                      animate={{ rotate: isMonthMenuOpen ? 180 : 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      ^
                    </motion.span>
                  </motion.div>
                  <AnimatePresence>
                    {isMonthMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute -right-28  -top-0.5 z-10 overflow-hidden rounded-sm border border-black bg-white shadow-lg"
                        role="listbox"
                      >
                        {MONTHS.map((month) => (
                          <motion.div
                            key={month}
                            className="cursor-pointer  even:bg-gray-300 odd:bg-gray-200 border-b last:border-b-0 px-3 py-2 text-sm text-black"
                            onClick={() => handleMonthSelect(month)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleMonthSelect(month);
                              }
                            }}
                            role="option"
                            tabIndex={0}
                            aria-selected={selectedMonth === month}
                            whileHover={{ backgroundColor: "#E5E7EB" }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {month}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-2 border-b">
                <div className="bg-gray-400 px-5 border-r py-1">Department</div>
                <input className="ml-2 outline-none" type="text" />
              </div>
              <div className="grid grid-cols-2 border-b">
                <div className="bg-gray-400 px-5 border-r py-1">agent Name</div>
                <input className="ml-2 outline-none" type="text" />
              </div>

              <div className="grid grid-cols-2  border-b">
                <div className="bg-gray-400 px-5 border-r py-1">
                  Date and Time of Call
                </div>
                <input
                  className="mx-2 cursor-pointer outline-none"
                  type="datetime-local"
                />
              </div>

              <div className="grid grid-cols-2 border-b">
                <div className="bg-gray-400 px-5 border-r py-1">Number</div>
                <input
                  className="ml-2 outline-none"
                  placeholder="Ex. 285548400"
                  type="text"
                />
              </div>

              <div className="grid grid-cols-2">
                <div className="bg-gray-400 rounded-bl-md px-5 border-r py-1">
                  Assigned QA
                </div>
                <div className="px-3 flex items-center h-full ">
                  {LoginUser}
                </div>
              </div>
            </div>

            <div className="flex h-full gap-4">
              <div className="flex flex-col h-full gap-2 justify-end text-xs items-end">
                <div className="font-black flex justify-center w-full text-center hover:shadow-none uppercase bg-red-600 text-white px-4 py-2 rounded-md shadow-md border-2 transition-all border-red-800 cursor-pointer hover:bg-red-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4 mr-2"
                  >
                    <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                  </svg>
                  export to pdf
                </div>
                <div className="font-black flex hover:shadow-none uppercase bg-green-600 text-white px-4 py-2 rounded-md shadow-md border-2 transition-all border-green-800 cursor-pointer hover:bg-green-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4 mr-2"
                  >
                    <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                  </svg>
                  export to excel
                </div>
              </div>
              <div className="flex flex-col h-full">
                <div className="px-16 text-2xl border rounded-t-md bg-gray-400 py-2 text-black font-black uppercase">
                  Total Score
                </div>
                <div className="bg-gray-200 text-red-700 border-black text-7xl font-black border-x border-b flex items-center justify-center rounded-b-md w-full h-full ">
                  0
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col h-full mt-2 ">
            <div className="grid font-black uppercase bg-gray-400 border rounded-t-md px-3 py-1 grid-cols-5">
              <div>Criteria</div>
              <div>Category</div>
              <div>Scores</div>
              <div>points</div>
              <div>missed guidlines</div>
            </div>

            <div className="bg-gray-100 rounded-b-md">
              <div className="flex flex-col text-sm">
                <div className="grid  border-x border-b grid-cols-5">
                  <div className="border-r px-3 py-1 items-center flex text-center">
                    Opening
                  </div>

                  <div className="grid grid-cols-4 w-full col-span-4">
                    <div className="grid grid-rows-2 border-r">
                      <div className="border-b px-2 border-gray-400">
                        Introduction
                      </div>
                      <div className=" px-2">Account Overview</div>
                    </div>

                    <div className="grid grid-rows-2 border-r">
                      <div className="border-b px-2 border-gray-400">1</div>
                      <div className=" px-2 ">2</div>
                    </div>

                    <div className="grid grid-rows-2 border-r">
                      <input
                        className="outline-none border-b px-2 border-gray-400"
                        type="number"
                        placeholder="0"
                      />
                      <input
                        className="outline-none px-2"
                        placeholder="0"
                        type="number"
                      />
                    </div>

                    <div className="grid grid-rows-2">
                      <div className="border-b px-2 border-gray-400">1</div>
                      <div className=" px-2 ">2</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col text-sm">
                <div className="grid grid-cols-5 border-x border-b">
                  <div className="border-r px-3 py-1 items-center flex text-center">
                    Negotiation Skills
                  </div>
                  <div className="grid grid-rows-7 border-r">
                    <div className="border-b px-2 border-gray-400">Probing</div>
                    <div className="border-b px-2 border-gray-400">
                      Hierarchy of Negotiation
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Solidifying Statements
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Active Listening
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Choice of Words
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Conversation Control
                    </div>
                    <div
                      className="boer-b truncate px-2 border-gray0"
                      title="Process and Customer Education"
                    >
                      Process and Customer Education
                    </div>
                  </div>

                  <div className="grid grid-rows-7 border-r">
                    <div className="border-b px-2 border-gray-400">1</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="borde px-2 border-gray00">2</div>
                  </div>

                  <div className="grid grid-rows-7 border-r">
                    <input
                      className="outline-none border-b px-2 border-gray-400"
                      type="number"
                      placeholder="0"
                    />
                    <input
                      className="outline-none border-b px-2 border-gray-400"
                      type="number"
                      placeholder="0"
                    />
                    <input
                      className="outline-none border-b px-2 border-gray-400"
                      type="number"
                      placeholder="0"
                    />
                    <input
                      className="outline-none border-b px-2 border-gray-400"
                      type="number"
                      placeholder="0"
                    />
                    <input
                      className="outline-none border-b px-2 border-gray-400"
                      type="number"
                      placeholder="0"
                    />
                    <input
                      className="outline-none border-b px-2 border-gray-400"
                      type="number"
                      placeholder="0"
                    />
                    <input
                      className="outline-none  px-2"
                      placeholder="0"
                      type="number"
                    />
                  </div>

                  <div className="grid grid-rows-7">
                    <div className="border-b px-2 border-gray-400">1</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="px-2">2</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col text-sm">
                <div className="grid border-x border-b grid-cols-5  ">
                  <div className="border-r px-3 py-1 items-center flex text-center">
                    Closing
                  </div>

                  <div className="grid grid-rows-2 border-r">
                    <div
                      className="border-b px-2 border-gray-400"
                      title="Third Party Call Handling"
                    >
                      Third Party Call Handling
                    </div>

                    <div className=" px-2 ">Closing Spiel</div>
                  </div>

                  <div className="grid grid-rows-2 border-r">
                    <div className="border-b px-2 border-gray-400">1</div>
                    <div className="px-2 ">2</div>
                  </div>

                  <div className="grid grid-rows-2 border-r">
                    <input
                      className="outline-none border-b px-2 border-gray-400"
                      type="number"
                      placeholder="0"
                    />
                    <input
                      className="outline-none px-2 "
                      type="number"
                      placeholder="0"
                    />
                  </div>

                  <div className="grid grid-rows-2">
                    <div className="border-b px-2 border-gray-400">1</div>
                    <div className="px-2 ">2</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col text-sm">
                <div className="grid grid-cols-5 border-x border-b">
                  <div className="border-r px-3 py-1 items-center flex">
                    Regulatory and Compliance
                  </div>
                  <div className="grid grid-rows-8 border-r">
                    <div className="border-b px-2 border-gray-400">
                      Call Disposition
                    </div>
                    <div
                      className="border-b truncate px-2 border-gray-400"
                      title="Confidentiality of Information"
                    >
                      Confidentiality of Information
                    </div>
                    <div
                      className="border-b px-2 border-gray-400 truncate"
                      title="Unfair Debt Collection Practices"
                    >
                      Unfair Debt Collection Practices
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Information Accuracy
                    </div>
                    <div
                      className="border-b px-2 border-gray-400 truncate "
                      title="Call Recording Statement"
                    >
                      Call Recording Statement
                    </div>
                    <div
                      className="border-b px-2 border-gray-400 truncate "
                      title="No or Incomplete Attempt to Negotiate"
                    >
                      No or Incomplete Attempt to Negotiate
                    </div>
                    <div
                      className="border-b px-2 border-gray-400 truncate"
                      title="Call Avoidance and Early Termination"
                    >
                      Call Avoidance and Early Termination
                    </div>
                    <div className="px-2">Professionalism</div>
                  </div>

                  <div className="grid grid-rows-8 border-r">
                    <div className="border-b px-2 border-gray-400">1</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className=" px-2">2</div>
                  </div>

                  <div className="grid grid-rows-8 border-r">
                    <div className="border-b px-2 border-gray-400">
                      Auto Fail
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Auto Fail
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Auto Fail
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Auto Fail
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Auto Fail
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Auto Fail
                    </div>
                    <div className="border-b px-2 border-gray-400">
                      Auto Fail
                    </div>
                    <div className="px-2">Auto Fail</div>
                  </div>

                  <div className="grid grid-rows-8">
                    <div className="border-b px-2 border-gray-400">1</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="border-b px-2 border-gray-400">2</div>
                    <div className="px-2 ">2</div>
                  </div>
                </div>
              </div>

              <div className="flex  flex-col text-sm">
                <div className="grid grid-cols-5 border-x rounded-b-md shadow-md border-b ">
                  <div className="border-r px-3 py-4 items-center flex text-center">
                    Comments
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2 col-span-4">
                    <div className="flex rows-span-2 gap-2">
                      <div>HighLights:</div>
                      <input className="h-full outline-none px-2 py-1 bg-gray-200 border rounded-sm shadow-md w-full" />
                    </div>
                    <div className="flex rows-span-2 gap-2">
                      <div>Comments:</div>
                      <input className="h-full outline-none px-2 py-1 bg-gray-200 border rounded-sm shadow-md w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DefaultScoreCard;
