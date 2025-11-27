import { motion } from "framer-motion";

type ColumnInputGridProps = {
  inputClassName?: string;
};

const ColumnInputGrid = ({ inputClassName = "" }: ColumnInputGridProps) => (
  <div className="grid h-full w-full grid-cols-10 items-center border-black">
    {Array.from({ length: 10 }).map((_, idx) => (
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

const callNumbers = Array.from({ length: 10 }, (_, idx) => `CALL ${idx + 1}`);

type DetailColumnConfig = {
  label: string;
  title?: string;
  labelClassName?: string;
  containerClassName?: string;
};

const detailColumns: DetailColumnConfig[] = [
  {
    label: "Account Name:",
    labelClassName:
      "bg-gray-400 w-full text-center text-md truncate border-x rounded-t-md border-y px-1 py-1",
  },
  { label: "Loan No:",
    labelClassName:
      "bg-gray-400 w-full text-center text-md truncate border-x rounded-t-md border-y px-1 py-1", },
  { label: "Account Status:",
    labelClassName:
      "bg-gray-400 w-full text-center text-md truncate border-x rounded-t-md border-y px-1 py-1", },
  { label: "Date of call:",
    labelClassName:
      "bg-gray-400 w-full text-center text-md truncate border-x rounded-t-md border-y px-1 py-1", },
  {
    label: "Call Duration:",
    title: "Call Duration",
    labelClassName:
      "bg-gray-400 text-md text-center truncate border-x rounded-t-md border-y px-1 py-1",
    containerClassName:
      "text-sm flex flex-col shadow-md rounded-sm font-black uppercase flex-[0.6] min-w-[70px]",
  },
  {
    label: "Agent Name:",
    title: "Agent Name",
    labelClassName:
      "bg-gray-400 text-md truncate text-center border-x rounded-t-md border-y px-1 py-1",
    containerClassName:
      "text-sm flex flex-col shadow-md rounded-sm font-black uppercase flex-[0.6] min-w-[90px]",
  },
  {
    label: "Score %",
    title: " Score",
    labelClassName:
      "bg-gray-400 text-md truncate border-x rounded-t-md border-y px-1 py-1",
    containerClassName:
      "text-sm flex flex-col shadow-md rounded-sm font-black uppercase flex-[0.4] min-w-[60px]",
  },
];

type ColumnInputRowConfig = {
  text: string;
  title?: string;
  inputClassName?: string;
  textClassName?: string;
  containerClassName?: string;
  showAsterisk?: boolean;
};

const openingRows: ColumnInputRowConfig[] = [
  {
    text: "Used appropriate greeting (Good Morning, Good Afternon, Good day) / Identified self (mention first and last name) and Agency (full Agency name)",
    title:
      "Used appropriate greeting / Identified self and Agency (full Agency name)",
    textClassName: "w-full pl-3 py-1 border-r",
  },
  {
    text: "Mentioned (OSP mentioned - authorized Service Provider of UB)",
  },
  {
    text: "Mentioned Line is Recorded",
    inputClassName: "whitespace-nowrap",
  },
  {
    text: "Mentioned Client name / Authorized Rep Full Name for outgoing calls to a registered number. For incoming calls, asked correct Positive Identifiers from unregistered number.",
    title:
      "Mentioned Client name / Authorized Rep Full Name for outgoing calls to a registered number.  For incoming calls, asked correct Positive Identifiers from unregistered number.",
    textClassName: "w-full pl-3 py-1 border-r",
  },
  {
    text: "Agent confirms talking to the client. Client should confirm (explicit YES) before proceeding to the call",
    title:
      "Agent confirms talking to the client. Client should confirm (explicit YES) before proceeding to the call",
    containerClassName: "h-full flex rounded-b-md shadow-md border-x border-b",
    textClassName: "w-full pl-3 py-1 border-r",
  },
];

const withContactRapportRows: ColumnInputRowConfig[] = [
  {
    text: "Explained the status of the account*",
    title: "\n                  Explained the status of the account*",
  },
  {
    text: "Asked if CH received demand/ notification letter*",
  },
  {
    text: "Showed empathy and compassion as appropriate.",
    inputClassName: "whitespace-nowrap",
  },
];

const withContactListeningRows: ColumnInputRowConfig[] = [
  {
    text: "Sought RFD (reason of delinquency or non-payment) in payment & RFBP (reason for broken promise)",
    title: "\n                Sought RFD in payment & RFBP*",
    textClassName: "w-full pl-3 py-1 border-r",
  },
];

const withContactNegotiationRows: ColumnInputRowConfig[] = [
  {
    text: "Explained consequences of non-payment, if applicable (explained conseq of legal and BAP listing/explained side of the Bank and the contract signed/explained that the bank is serious in collecting legal obligations/possible negative listing of name/future credit facility will be closed/additional collection agency expenses/involvement of lawyer will also be Client's expense)",
    textClassName: "w-full pl-3 py-1 border-r",
  },
  {
    text: "Asked for Client's capacity to pay, if applicable",
  },
  {
    text: "Followed hierarchy of negotiation, if applicable (Full payment, minimum amount due, total past due or last bucket amount)",
    textClassName: "w-full pl-3 py-1 border-r",
  },
];

const withContactSolutionRows: ColumnInputRowConfig[] = [
  {
    text: "Offered discount/ amnesty/ promo*",
  },
  {
    text: "Adviced CH to source out funds*",
    containerClassName: "h-full flex border-x rounded-b-md shadow-md border-b",
  },
];

const withoutContactRows: ColumnInputRowConfig[] = [
  {
    text: "Probed on BTC (best time to call), ETA (Expected time of arrival) and other contact numbers",
    title:
      "Probed on BTC (best time to call), ETA (Expected time of arrival) and other contact numbers",
  },
  {
    text: "Used time schedule and follow-up if applicable",
  },
  {
    text: "Asked for name of party, relation to client",
    inputClassName: "whitespace-nowrap",
  },
  {
    text: "Left URGENT message ang gave correct contact number",
    inputClassName: "whitespace-nowrap",
    containerClassName: "h-full rounded-b-md shadow-md flex border-x border-b",
  },
];

const withOrWithoutRows: ColumnInputRowConfig[] = [
  {
    text: "Used professional tone of voice",
  },
  {
    text: "Did not use unacceptable words/phrases and maintained polite/civil language",
    title:
      "Did not use unacceptable words/phrases and maintained polite/civil language",
    textClassName: "w-full pl-3 py-1 border-r",
  },
  {
    text: "Updated correct information and payment details on info sheet, if applicable",
    inputClassName: "whitespace-nowrap",
  },
  {
    text: "Adherence to Policy(BSP, Code of Conduct, etc.)",
    inputClassName: "whitespace-nowrap",
  },
  {
    text: "Intgerity Issues (Revealed and Collected debt from unauthorized Client)",
    inputClassName: "whitespace-nowrap",
  },
  {
    text: "Exercised sound judgment in determining the appropriate course of action.",
    inputClassName: "whitespace-nowrap",
    containerClassName: "h-full rounded-b-md shadow-md flex border-x border-b",
  },
];

const closingRows: ColumnInputRowConfig[] = [
  {
    text: "Summarized payment arrangement",
    showAsterisk: true,
    containerClassName: "h-full flex border-x border-b ",
    textClassName: "w-full flex pl-3 py-1 border-r truncate",
  },
  {
    text: "Offered online payment channels",
  },
  {
    text: "Request return call for payment confirmation*",
    containerClassName: "h-full flex border-x border-b rounded-b-md  ",
  },
];

const summaryRows: ColumnInputRowConfig[] = [
  {
    text: "WITH CONTACT? (Y/N)",
    containerClassName: "h-full flex border-x border-y rounded-t-md ",
  },
  {
    text: "TOTAL DEFECTS",
  },
  {
    text: "SCORE",
    containerClassName: "h-full flex border-b border-x rounded-b-md shadow-md ",
  },
];

const commentCalls = Array.from({ length: 10 }, (_, idx) => idx + 1);

const ColumnInputRow = ({
  text,
  title,
  inputClassName,
  textClassName = "w-full pl-3 py-1 border-r truncate",
  containerClassName = "h-full flex border-x border-b ",
  showAsterisk = false,
}: ColumnInputRowConfig) => (
  <div className={containerClassName}>
    <div className={textClassName} title={title ?? text}>
      <span>{text}</span>
      {showAsterisk && <span className="ml-1 font-black text-red-800">*</span>}
    </div>
    <ColumnInputGrid inputClassName={inputClassName} />
  </div>
);

const DetailColumn = ({
  label,
  title,
  labelClassName = "bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1",
  containerClassName = "text-sm flex flex-col shadow-md rounded-sm font-black uppercase flex-1 min-w-0",
}: DetailColumnConfig) => (
  <div className={containerClassName}>
    <div className={labelClassName} title={title ?? label}>
      {label}
    </div>
    {callNumbers.map((_, idx) => (
      <input
        key={`${label}-${idx}`}
        className={`py-1 pl-3 border-x border-b outline-none ${
          idx === callNumbers.length - 1 ? "rounded-b-md" : ""
        }`}
      />
    ))}
  </div>
);

const CallCommentSection = ({ callNumber }: { callNumber: number }) => (
  <div className="flex w-full h-auto flex-col">
    <div className="grid uppercase grid-cols-4 border bg-gray-400 py-1 rounded-t-md gap-2">
      <div className="col-span-2 ml-2">CALL {callNumber} COMMENTS OF AGENT</div>
      <div>COMMENTS OF EVALUATOR</div>
      <div>Action Plan</div>
    </div>

    <div className="grid uppercase grid-cols-4 items-center border-x border-b rounded-b-md gap-2">
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
);

const UBMortgageScoreCard = () => {
  return (
    <div className="p-10 flex flex-col  text-black w-full h-full">
      <motion.div
        className="border flex rounded-md overflow-hidden flex-col h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className=" font-black border-b  uppercase bg-gray-400 text-2xl text-center py-3 w-full text-black">
          COLLECTION CALL PERFORMANCE REVIEW - SECURED LOANS COLLECTIONS
        </div>

        <div className="bg-gray-300 max-h-[730px] overflow-auto  p-5 flex flex-col h-full ">
          <div className="flex justify-between">
            <div className="grid grid-cols-4 w-full items-start gap-2">
              <div className="border  rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-rows-2 border-b">
                  <div className="bg-gray-400 rounded-tl px-5 border-b py-1">
                    For the month
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
                <div className="grid grid-rows-2 border-b">
                  <div className="bg-gray-400  px-5 border-b py-1">
                    Collection officer
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
                <div className="grid grid-rows-2 border-b ">
                  <div className="bg-gray-400 px-5 border-b py-1">
                    COLLECTION AGENT/OFFICER:
                  </div>
                  <input className="ml-2 outline-none h-full" type="text" />
                </div>
                <div className="grid grid-rows-2 ">
                  <div className="bg-gray-400 px-5 border-b py-1">
                    Evaluator
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
              </div>

              <div className="flex col-span-3 w-full gap-2 items-end ">
                <div className="text-sm truncate flex flex-col pl-2 pb-1.5 gap-[9px] ">
                  {callNumbers.map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>
                {detailColumns.map((column) => (
                  <DetailColumn key={column.label} {...column} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col pb-5 gap-2 h-full">
            <motion.div
              className=" flex bg-gray-300 h-full border-b z-10"
              layout
            >
              <div className="w-[55%]"></div>
              <div className="grid px-2 text-center w-[55%] truncate grid-cols-11">
                <div>DEFECT</div>
                {callNumbers.map((label) => (
                  <div key={`defect-${label}`}>{label.toUpperCase()}</div>
                ))}
              </div>
            </motion.div>

            <div className="flex h-auto flex-col">
              <div className="w-full bg-gray-400 px-3 py-1 rounded-t-md border">
                A. OPENING
              </div>
              {openingRows.map((row) => (
                <ColumnInputRow key={row.text} {...row} />
              ))}
            </div>

            <div className="flex h-auto flex-col">
              <div className="w-full bg-gray-400 px-3 py-1 rounded-t-md border">
                B. COLLECTION CALL PROPER
              </div>

              <div className="w-full font-semibold bg-gray-400 px-3 py-1  border-x border-b">
                WITH CONTACT (A/Y)
              </div>

              <div className="w-full font-semibold px-3 py-1  border-x border-b">
                ESTABLISHING RAPPORT, EMPATHY & COURTESY
              </div>
              {withContactRapportRows.map((row) => (
                <ColumnInputRow key={row.text} {...row} />
              ))}

              <div className="w-full font-semibold bg-gray-400 px-3 py-1  border-x border-b">
                LISTENING SKILLS
              </div>
              {withContactListeningRows.map((row) => (
                <ColumnInputRow key={row.text} {...row} />
              ))}

              <div className="w-full uppercase font-semibold bg-gray-400 px-3 py-1  border-x border-b">
                negotiation SKILLS
              </div>
              {withContactNegotiationRows.map((row) => (
                <ColumnInputRow key={row.text} {...row} />
              ))}

              <div className="w-full uppercase font-semibold bg-gray-400 px-3 py-1  border-x border-b">
                OFFERING SOLUTIONS
              </div>
              {withContactSolutionRows.map((row) => (
                <ColumnInputRow key={row.text} {...row} />
              ))}

              <div className="w-full mt-2 font-semibold bg-gray-400 px-3 py-1  border rounded-t-md">
                WITH OUT CONTACT
              </div>

              <div className="w-full font-semibold px-3 py-1  border-x border-b">
                ESTABLISHING RAPPORT, EMPATHY & COURTESY
              </div>
              {withoutContactRows.map((row) => (
                <ColumnInputRow key={row.text} {...row} />
              ))}

              <div className="uppercase w-full mt-2 font-semibold bg-gray-400 px-3 py-1  border rounded-t-md">
                WITH or WITH OUT CONTACT
              </div>

              <div className="w-full font-semibold px-3 py-1  border-x border-b">
                QUALITY OF CALL
              </div>
              {withOrWithoutRows.map((row) => (
                <ColumnInputRow key={row.text} {...row} />
              ))}
            </div>

            <div className="flex h-auto flex-col">
              <div className="w-full bg-gray-400 px-3 py-1 rounded-t-md border">
                C. CLOSING THE CALL
              </div>
              <div className="w-full bg-gray-400 font-semibold px-3 py-1  border-x border-b">
                SUMMARY
              </div>
              {closingRows.map((row) => (
                <ColumnInputRow key={row.text} {...row} />
              ))}
            </div>
            <div className="flex items-center justify-end  mt-3">
              <div className="bg-blue-600 cursor-pointer shadow-md transition-all hover:bg-blue-700 px-3 text-white rounded-sm font-black py-1 uppercase text-center border-2 border-blue-900">
                View Total Score Percentage
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex w-full h-auto flex-col">
                {summaryRows.map((row) => (
                  <ColumnInputRow key={row.text} {...row} />
                ))}
              </div>
            </div>
            {commentCalls.map((callNumber) => (
              <CallCommentSection
                key={`call-comment-${callNumber}`}
                callNumber={callNumber}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UBMortgageScoreCard;
