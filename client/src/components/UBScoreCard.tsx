import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { month as MONTHS } from "../middleware/exports";

type ColumnInputGridProps = {
  inputClassName?: string;
};

const ColumnInputGrid = ({ inputClassName = "" }: ColumnInputGridProps) => (
  <div className="grid h-full bg-gray-100 w-full grid-cols-6 items-center border-black">
    {Array.from({ length: 6 }).map((_, idx) => (
      <div
        key={idx}
        className="border-r h-full border-black last:border-r-0 flex items-center justify-center px-1 py-1"
      >
        <input
          className={`w-full truncate outline-none bg-transparent ${inputClassName}`}
        />
      </div>
    ))}
  </div>
);

const UBScoreCard = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isMonthMenuOpen, setMonthMenuOpen] = useState(false);
  const monthFieldRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMonthMenuOpen) {
      return;
    }

    const handleClickAway = (event: MouseEvent) => {
      if (
        monthFieldRef.current &&
        !monthFieldRef.current.contains(event.target as Node)
      ) {
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
          COLLECTION CALL PERFORMANCE MONITOR
        </div>

        <div className="bg-gray-300 max-h-[730px]  p-5 flex flex-col h-full ">
          <div className="flex justify-between">
            <div className="grid grid-cols-4 w-full items-start gap-2">
              <div className="border rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-rows-2 border-b">
                  <div className="bg-gray-400 rounded-tl px-5 border-b py-1">
                    For the month
                  </div>
                  <div className="relative" ref={monthFieldRef}>
                    <motion.div
                      role="button"
                      tabIndex={0}
                      className="flex text-black cursor-pointer items-center justify-between gap-2 px-3 py-1 text-sm"
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
                        animate={{ rotate: isMonthMenuOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="3"
                          stroke="currentColor"
                          className="size-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </motion.span>
                    </motion.div>
                    <AnimatePresence>
                      {isMonthMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-20 left-0 top-full mt-1 h-44 w-full overflow-auto rounded-sm border border-black bg-white shadow-lg"
                          role="listbox"
                        >
                          {MONTHS.map((month) => (
                            <button
                              type="button"
                              key={month}
                              className="w-full text-left even:bg-gray-200 odd:bg-gray-100 border-b last:border-b-0 px-4 py-2 text-sm hover:bg-gray-200"
                              onClick={() => handleMonthSelect(month)}
                            >
                              {month}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="grid grid-rows-2 border-b">
                  <div className="bg-gray-400  px-5 border-b py-1">
                    Collection officer
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
                <div className="grid grid-rows-2 ">
                  <div className="bg-gray-400 px-5 border-b py-1">
                    Evaluator
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
              </div>
              <div className="flex items-end ">
                <div className=" text-sm truncate px-3 gap-2.5 flex flex-col">
                  <div className="">Call 1</div>
                  <div className="">Call 2</div>
                  <div className="">Call 3</div>
                  <div className="">Call 4</div>
                  <div className="">Call 5</div>
                </div>
                <div className="text-sm w-full bg-gray-100 flex flex-col shadow-md rounded-sm font-black uppercase">
                  <div className="bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1">
                    Account Name/Account Number
                  </div>
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x rounded-b-md border-b outline-none" />
                </div>
              </div>

              <div className="text-sm flex bg-gray-100 flex-col shadow-md rounded-sm font-black uppercase">
                <div className="bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1">
                  Date and Time of Call
                </div>
                <input className="py-1 pl-3 border-x border-b outline-none" />
                <input className="py-1 pl-3 border-x border-b outline-none" />
                <input className="py-1 pl-3 border-x border-b outline-none" />
                <input className="py-1 pl-3 border-x border-b outline-none" />
                <input className="py-1 pl-3 border-x rounded-b-md border-b outline-none" />
              </div>

              <div className="flex w-full gap-2">
                <div className="text-sm flex bg-gray-100 flex-col shadow-md rounded-sm font-black uppercase">
                  <div className="bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1">
                    Date of Logger Review
                  </div>
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x rounded-b-md border-b outline-none" />
                </div>
                <div className="text-sm truncate bg-gray-100 flex flex-col shadow-md rounded-sm font-black uppercase">
                  <div
                    className="bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1"
                    title="1st Call"
                  >
                    1st Call
                  </div>
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x rounded-b-md border-b outline-none" />
                </div>
                <div className="text-sm truncate bg-gray-100 flex flex-col shadow-md rounded-sm font-black uppercase">
                  <div
                    className="bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1"
                    title="Lat Call"
                  >
                    Lat Call
                  </div>
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x border-b outline-none" />
                  <input className="py-1 pl-3 border-x rounded-b-md border-b outline-none" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col pb-5 overflow-auto gap-2 h-full">
            <motion.div
              className=" flex bg-gray-300 sticky h-full top-0 border-b z-10"
              layout
            >
              <div className="w-full"></div>
              <div className="grid px-2 text-center w-full truncate grid-cols-6">
                <div>DEFECT</div>
                <div>CALL 1</div>
                <div>CALL 2</div>
                <div>CALL 3</div>
                <div>CALL 4</div>
                <div>CALL 5</div>
              </div>
            </motion.div>

            <div className="flex h-auto flex-col">
              <div className="w-full bg-gray-400 px-3 py-1 rounded-t-md border">
                A. OPENING
              </div>
              <div className=" h-full bg-gray-100 flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate"
                  title="
                  Used appropriate greeting / Identified self and Agency (full
                  Agency name)"
                >
                  Used appropriate greeting / Identified self and Agency (full
                  Agency name)
                </div>
                <ColumnInputGrid />
              </div>

              <div className=" h-full bg-gray-100 flex border-x border-b ">
                <div className="w-full pl-3 py-1 border-r truncate">
                  Mentioned UBP Disclaimer spiel
                </div>
                <ColumnInputGrid />
              </div>
              <div className=" h-full bg-gray-100 flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="
                  Mentioned Line is Recorded"
                >
                  Mentioned Line is Recorded
                </div>
                <ColumnInputGrid inputClassName="whitespace-nowrap" />
              </div>
              <div className="h-full flex bg-gray-100 flex-row border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r"
                  title="
                  Mentioned CH/ Valid CP/Y's Full Name for outgoing calls to a registered number. Asked correct Positive Identifiers for incoming calls & calls to unregistered number.
                "
                >
                  Mentioned CH/ Valid CP/Y's Full Name for outgoing calls to a
                  registered number. Asked correct Positive Identifiers for
                  incoming calls & calls to unregistered number.
                </div>
                <ColumnInputGrid />
              </div>
              <div className=" h-full flex bg-gray-100 rounded-b-md shadow-md border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r "
                  title="  Properly identified self, mentioned first and last name to CH/Valid CP/Y"
                >
                  Properly identified self, mentioned first and last name to CH/
                  Valid CP/Y
                </div>
                <ColumnInputGrid />
              </div>
            </div>

            <div className="flex h-auto flex-col">
              <div className="w-full bg-gray-400 px-3 py-1 rounded-t-md border">
                B. COLLECTION CALL PROPER
              </div>

              <div className="w-full font-semibold bg-gray-400 px-3 py-1  border-x border-b">
                WITH CONTACT (A/Y)
              </div>

              <div className="w-full font-semibold bg-gray-300 px-3 py-1  border-x border-b">
                ESTABLISHING RAPPORT, EMPATHY & COURTESY
              </div>
              <div className=" h-full flex border-x bg-gray-100 border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate"
                  title="
                  Explained the status of the account*"
                >
                  Explained the status of the account*
                </div>
                <ColumnInputGrid />
              </div>

              <div className=" h-full flex border-x bg-gray-100 border-b ">
                <div className="w-full pl-3 py-1 border-r truncate">
                  Asked if CH received demand/ notification letter*
                </div>
                <ColumnInputGrid />
              </div>
              <div className=" h-full flex border-x bg-gray-100 border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Showed empathy and compassion as appropriate.
                </div>
                <ColumnInputGrid inputClassName="whitespace-nowrap" />
              </div>

              <div className="w-full font-semibold bg-gray-300 px-3 py-1  border-x border-b">
                LISTENING SKILLS
              </div>
              <div
                className="h-full flex flex-row bg-gray-100 border-x border-b "
                title="
                Sought RFD in payment & RFBP*"
              >
                <div className="w-full pl-3 py-1 border-r truncate">
                  Sought RFD in payment & RFBP*
                </div>
                <ColumnInputGrid />
              </div>

              <div className="w-full uppercase font-semibold bg-gray-300 px-3 py-1  border-x border-b">
                negotiation SKILLS
              </div>
              <div className=" h-full flex border-x border-b bg-gray-100 ">
                <div
                  className="w-full pl-3 py-1 border-r "
                  title=" Explained consequences of non-payment, if applicable (explained conseq of legal and BAP listing/explained side of the Bank and the contract signed/explained that the bank is serious in collecting legal obligations/possible negative listing of name/future credit facility will be closed/additional collection agency expenses/involvement of lawyer will also be CH's expense)*"
                >
                  Explained consequences of non-payment, if applicable
                  (explained conseq of legal and BAP listing/explained side of
                  the Bank and the contract signed/explained that the bank is
                  serious in collecting legal obligations/possible negative
                  listing of name/future credit facility will be
                  closed/additional collection agency expenses/involvement of
                  lawyer will also be CH's expense)*
                </div>
                <ColumnInputGrid />
              </div>

              <div className=" h-full flex border-x border-b bg-gray-100 ">
                <div
                  className="w-full pl-3 py-1 border-r "
                  title=" Asked for CM's capacity to pay, if applicable"
                >
                  Asked for CM's capacity to pay, if applicable*
                </div>
                <ColumnInputGrid />
              </div>

              <div className=" h-full flex border-x border-b bg-gray-100 ">
                <div
                  className="w-full pl-3 py-1 border-r "
                  title=" Followed hierarchy of negotiation*"
                >
                  Followed hierarchy of negotiation*
                </div>
                <ColumnInputGrid />
              </div>

              <div className="w-full uppercase font-semibold bg-gray-300 px-3 py-1  border-x border-b">
                OFFERING SOLUTIONS
              </div>

              <div className=" h-full flex border-x border-b bg-gray-100 ">
                <div
                  className="w-full pl-3 py-1 border-r "
                  title=" Followed hierarchy of negotiation*"
                >
                  Offered discount/ amnesty/ promo*
                </div>
                <ColumnInputGrid />
              </div>

              <div className=" h-full flex border-x rounded-b-md bg-gray-100 shadow-md border-b ">
                <div
                  className="w-full pl-3 py-1 border-r "
                  title=" Followed hierarchy of negotiation*"
                >
                  Adviced CH to source out funds*
                </div>
                <ColumnInputGrid />
              </div>

              <div className="w-full mt-2 font-semibold bg-gray-400 px-3 py-1  border rounded-t-md">
                WITH OUT CONTACT
              </div>

              <div className="w-full bg-gray-300 font-semibold px-3 py-1  border-x border-b">
                ESTABLISHING RAPPORT, EMPATHY & COURTESY
              </div>
              <div className=" h-full bg-gray-100 flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate"
                  title="
                  Explained the status of the account*"
                >
                  Probed on BTC, ETA and other contact numbers
                </div>
                <ColumnInputGrid />
              </div>

              <div className=" h-full bg-gray-100 flex border-x border-b ">
                <div className="w-full pl-3 py-1 border-r truncate">
                  Used time schedule and follow-up if applicable
                </div>
                <ColumnInputGrid />
              </div>
              <div className=" h-full bg-gray-100 flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Asked for name of party, relation to client
                </div>
                <ColumnInputGrid inputClassName="whitespace-nowrap" />
              </div>

              <div className=" h-full bg-gray-100 rounded-b-md shadow-md flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Left URGENT message ang gave correct contact number
                </div>
                <ColumnInputGrid inputClassName="whitespace-nowrap" />
              </div>

              <div className="uppercase w-full mt-2 font-semibold bg-gray-400 px-3 py-1  border rounded-t-md">
                WITH or WITH OUT CONTACT
              </div>

              <div className="w-full bg-gray-300 font-semibold px-3 py-1  border-x border-b">
                QUALITY OF CALL
              </div>
              <div className=" h-full flex bg-gray-100 border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate"
                  title="
                  Explained the status of the account*"
                >
                  Used professional tone of voice (did not shout)
                </div>
                <ColumnInputGrid />
              </div>

              <div className=" h-full flex bg-gray-100 border-x border-b ">
                <div className="w-full pl-3 py-1 border-r truncate">
                  Did not use unacceptable words/phrases and maintained
                  polite/civil language
                </div>
                <ColumnInputGrid />
              </div>
              <div className=" h-full flex bg-gray-100 border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Updated correct information and payment details on info sheet,
                  if applicable
                </div>
                <ColumnInputGrid inputClassName="whitespace-nowrap" />
              </div>

              <div className=" h-full flex bg-gray-100 border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Adherence to Policy(BSP, Code of Conduct, etc.)
                </div>
                <ColumnInputGrid inputClassName="whitespace-nowrap" />
              </div>

              <div className=" h-full flex bg-gray-100 border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  GPP / INTEGRITY ISSUES (Revealed and Collected debt from
                  unauthorized CP)
                </div>
                <ColumnInputGrid inputClassName="whitespace-nowrap" />
              </div>

              <div className=" h-full rounded-b-md bg-gray-100 shadow-md flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Exercised sound judgment in determining the appropriate course
                  of action.
                </div>
                <ColumnInputGrid inputClassName="whitespace-nowrap" />
              </div>
            </div>

            <div className="flex h-auto flex-col">
              <div className="w-full bg-gray-400 px-3 py-1 rounded-t-md border">
                C. CLOSING THE CALL
              </div>
              <div className="w-full bg-gray-300 font-semibold px-3 py-1  border-x border-b">
                SUMMARY
              </div>
              <div className="  bg-gray-100 h-full flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate"
                  title="Summarized payment arrangement*"
                >
                  Summarized payment arrangement*
                </div>
                <ColumnInputGrid />
              </div>

              <div className=" bg-gray-100 h-full flex border-x border-b rounded-b-md  ">
                <div
                  className="w-full pl-3 py-1 border-r truncate"
                  title="Request return call for payment confirmation*"
                >
                  Request return call for payment confirmation*
                </div>
                <ColumnInputGrid />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex w-full h-auto flex-col overflow-hidden border rounded-md">
                <div className=" bg-gray-100 border-b h-full flex  ">
                  <div
                    className="w-full pl-3 py-1 border-r truncate"
                    title="Summarized payment arrangement*"
                  >
                    WITH CONTACT? (Y/N)
                  </div>
                  <ColumnInputGrid />
                </div>

                <div className=" bg-gray-100 h-full flex border-b ">
                  <div
                    className="w-full pl-3 py-1 border-r truncate"
                    title="Request return call for payment confirmation*"
                  >
                    TOTAL DEFECTS
                  </div>
                  <ColumnInputGrid />
                </div>
                <div className=" bg-gray-100 h-full flex  shadow-md ">
                  <div
                    className="w-full pl-3 py-1 border-r truncate"
                    title="Summarized payment arrangement*"
                  >
                    SCORE
                  </div>
                  <ColumnInputGrid />
                </div>
              </div>
              <div className="border rounded-md  w-52 max-w-54 shadow-md relative flex flex-col items-center justify-end pb-4 truncate overflow-hidden">
                <div className="bg-gray-400 py-1 w-full text-center  px-3 border-b font-black rounded-t-2xs absolute top-0 uppercase">
                  Total Score
                </div>
                <div className="text-4xl uppercase font-black">100%</div>
              </div>
            </div>

            <div className="flex w-full h-auto flex-col">
              <div className="grid uppercase grid-cols-4 border bg-gray-400 py-1 rounded-t-md gap-2">
                <div className="col-span-2 ml-2"> CALL 1 COMMENTS OF AGENT</div>
                <div>COMMENTS OF AGENCY TL</div>
                <div>Action Plan</div>
              </div>

              <div className="grid bg-gray-100 uppercase grid-cols-4 items-center border-x border-b rounded-b-md gap-2">
                <div className="col-span-2 ml-2 py-1 flex items-center border-r h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
                <div className=" flex items-center border-r h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
                <div className=" flex items-center h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
              </div>
            </div>

            <div className="flex w-full h-auto flex-col">
              <div className="grid uppercase grid-cols-4 border bg-gray-400 py-1 rounded-t-md gap-2">
                <div className="col-span-2 ml-2"> CALL 2 COMMENTS OF AGENT</div>
                <div>COMMENTS OF AGENCY TL</div>
                <div>Action Plan</div>
              </div>

              <div className="grid uppercase bg-gray-100 grid-cols-4 items-center border-x border-b rounded-b-md gap-2">
                <div className="col-span-2 ml-2 py-1 flex items-center border-r h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
                <div className=" flex items-center border-r h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
                <div className=" flex items-center h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
              </div>
            </div>

            <div className="flex w-full h-auto flex-col">
              <div className="grid uppercase grid-cols-4 border bg-gray-400 py-1 rounded-t-md gap-2">
                <div className="col-span-2 ml-2"> CALL 3 COMMENTS OF AGENT</div>
                <div>COMMENTS OF AGENCY TL</div>
                <div>Action Plan</div>
              </div>

              <div className="grid uppercase bg-gray-100 grid-cols-4 items-center border-x border-b rounded-b-md gap-2">
                <div className="col-span-2 ml-2 py-1 flex items-center border-r h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
                <div className=" flex items-center border-r h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
                <div className=" flex items-center h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
              </div>
            </div>

            <div className="flex w-full h-auto flex-col">
              <div className="grid uppercase grid-cols-4 border bg-gray-400 py-1 rounded-t-md gap-2">
                <div className="col-span-2 ml-2"> CALL 4 COMMENTS OF AGENT</div>
                <div>COMMENTS OF AGENCY TL</div>
                <div>Action Plan</div>
              </div>

              <div className="grid uppercase bg-gray-100 grid-cols-4 items-center border-x border-b rounded-b-md gap-2">
                <div className="col-span-2 ml-2 py-1 flex items-center border-r h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
                <div className=" flex items-center border-r h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
                <div className=" flex items-center h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
              </div>
            </div>

            <div className="flex w-full h-auto flex-col">
              <div className="grid uppercase grid-cols-4 border bg-gray-400 py-1 rounded-t-md gap-2">
                <div className="col-span-2 ml-2"> CALL 5 COMMENTS OF AGENT</div>
                <div>COMMENTS OF AGENCY TL</div>
                <div>Action Plan</div>
              </div>
              <div className="grid uppercase bg-gray-100 grid-cols-4 items-center border-x border-b rounded-b-md gap-2">
                <div className="col-span-2 ml-2 py-1 flex items-center border-r h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
                <div className=" flex items-center border-r h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
                <div className=" flex items-center h-full">
                  <input className="outline-none px-1 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UBScoreCard;
