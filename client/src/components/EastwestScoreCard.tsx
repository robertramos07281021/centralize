import { motion } from "framer-motion";

type EvaluationSectionConfig = {
  headingLabel?: string;
  title: string;
  questions: string[];
};

const withContactSections: EvaluationSectionConfig[] = [
  {
    headingLabel: "A. WITH CONTACT",
    title: "OPENING SKILLS",
    questions: [
      "Uses Appropriate Greeting",
      "Did the agent advise the third party or person talking to that the call was recorded?",
      "Did the agent properly identify self and Company? (No Misrepresentation?)",
    ],
  },
  {
    title: "NEGOTIATION SKILLS",
    questions: [
      "Did the agent ask for reason for delay in payment (RFD)/ broken promise (RBP) ?",
      "Did the agent follow hierarchy of negotiation?",
      "Did the agent offer appropriate alternative solutions based on CH's financial situation?",
      "Did the agent explain the consequences for non payment & urgency of the payment?",
      "Did the agent secure PTP within the allowable grace period?",
    ],
  },
  {
    title: "PRODUCT KNOWLEDGE/PROBLEM SOLVING SKILLS",
    questions: [
      "Did the agent offer and appropriately discussed the applicable repayment program?",
      "Did the agent accurately explain and compute applicable fees, charges or discount amount?",
      "Did the agent address the concerns raised by the CH regarding his/her account?",
    ],
  },
  {
    title: "SOFT SKILLS",
    questions: [
      "Did the agent have a good control of the conversation?",
      "Did the agent communicate according to the cardholder's language of expertise? Avoided using jargon or technical terms that the customer wasn't familiar with.",
      "Is the agent's tone of voice professional, not overly aggressive, non-confrontational, not sarcastic or condescending?",
      "Did the agent demonstrate empathy and understanding of the customer's situation?",
      "Did the agent conduct the call at a reasonable pace - neither rushed nor unnecessarily prolonged?",
      "Did the agent conduct the call at a reasonable pace - neither rushed nor unnecessarily prolonged? Did the agent record accurate and complete details of the conversation in the system?",
      "Did the agent comply with EWBC Collection Agency Code of Conduct?",
    ],
  },
  {
    title: "WRAP UP/CLOSING THE CALL",
    questions: [
      "Did the agent ask for payment confirmation?",
      "Did the agent reminded client of the next due date or payment schedule?",
      "Did the agent obtains/verifies customer's Information? (Demographics)",
      "If an information update was requested, was PID competed as required?",
    ],
  },
];

const withoutContactSections: EvaluationSectionConfig[] = [
  {
    headingLabel: "B. WITHOUT CONTACT",
    title: "OPENING SKILLS",
    questions: [
      "Uses Appropriate Greeting",
      "Did the agent advise the third party or person talking to that the call was recorded?",
      "Did the agent properly identify self and Company? (No Misrepresentation?)",
    ],
  },
  {
    title: "PROBING SKILLS",
    questions: [
      "Did the agent probe for BTC, ETA/EDA and other contact numbers to reach CH?",
      "Did the agent ask for right party contact who can receive the message?",
      "Did the agent use the history of the account to follow up previous messages left?",
      "Did the agent attempt to contact client thru all the possible contact # based on the history/system?",
      "Did the agent ask info questions to obtain lead/s to the whereabouts of client/s?",
    ],
  },
  {
    title: "SOFT SKILLS",
    questions: [
      "Did the agent endorse the account for SKIPS and FV?",
      "Did the agent have a good control of the conversation?",
      "Is the agent's tone of voice professional, not overly aggressive, non-confrontational, not sarcastic or condescending?",
      "Did the agent record accurate details of the conversation in the system?",
      "Did the agent comply with EWBC Collection Agency Code of Conduct?",
    ],
  },
  {
    title: "WRAP UP/CLOSING THE CALL",
    questions: [
      "Did the agent leave a message for a return call?",
      "Did the agent ask the 3rd party to read back the number for return call?",
    ],
  },
];

const SectionHeading = ({ label = "" }: { label?: string }) => (
  <div className="flex">
    <div className="w-full bg-gray-400 px-3 py-1 border-l border-y rounded-tl-md">
      {label}
    </div>
    <div className="grid w-[50%] bg-gray-400 rounded-tr-md border-r border-y grid-cols-3">
      <div className="col-span-2 border-x uppercase flex text-center justify-center items-center">
        defect
      </div>
    </div>
  </div>
);

const SectionSubHeader = ({ title }: { title: string }) => (
  <div className="flex">
    <div className="w-full font-semibold bg-gray-400 px-3 py-1 border-l border-b">
      {title}
    </div>
    <div className="grid w-[50%] bg-gray-400 items-center justify-center text-center border-r border-b grid-cols-3">
      <div className="border-x h-full items-center flex justify-center">
        Y/N
      </div>
      <div className="border-r h-full items-center flex justify-center">
        SCORE
      </div>
      <div>TAGGING</div>
    </div>
  </div>
);

const QuestionRow = ({ text }: { text: string }) => (
  <div className="flex">
    <div className="w-full bg-white px-3 py-1 border-l border-b">{text}</div>
    <div className="grid w-[50%] bg-white items-center justify-center text-center border-r border-b grid-cols-3">
      <div className="border-x h-full items-center flex justify-center">
        <input className="px-1 w-full truncate outline-none bg-transparent " />
      </div>
      <div className="border-r h-full items-center flex justify-center">
        <input className="px-1 w-full truncate outline-none bg-transparent " />
      </div>
      <div>
        <input className="px-1 w-full truncate outline-none bg-transparent " />
      </div>
    </div>
  </div>
);

const SectionTotalRow = () => (
  <div className="flex shadow-md">
    <div className="w-full bg-gray-400 font-semibold uppercase rounded-bl-md px-3 py-1 border-l border-b">
      Total
    </div>
    <div className="grid w-[50%] bg-gray-400 rounded-br-md  items-center justify-center text-center border-r border-b grid-cols-3">
      <div className="border-x h-full items-center flex justify-center">
        <div></div>
      </div>
    </div>
  </div>
);

const EvaluationSection = ({
  headingLabel = "",
  title,
  questions,
}: EvaluationSectionConfig) => (
  <div>
    <SectionHeading label={headingLabel} />
    <SectionSubHeader title={title} />
    {questions.map((question) => (
      <QuestionRow key={question} text={question} />
    ))}
    <SectionTotalRow />
  </div>
);

const EastwestScoreCard = () => {
  return (
    <div className="p-10 flex flex-col  text-black w-full h-full">
      <motion.div
        className="border flex rounded-md overflow-hidden flex-col h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className=" font-black border-b  uppercase bg-gray-400 text-2xl text-center py-3 w-full text-black">
          tpsp phone monitoring sheet
        </div>

        <div className="bg-gray-300 max-h-[730px]  p-5 flex flex-col h-full ">
          <div className="flex justify-between">
            <div className="grid grid-cols-3 w-full items-start gap-2">
              <div className="border overflow-hidden rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-cols-2 border-b">
                  <div className="bg-gray-400 rounded-tl px-5 border-r py-1">
                    EVALUATION DATE
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
                <div className="grid grid-cols-2 border-b">
                  <div className="bg-gray-400  px-5 border-r py-1">
                    AGENT'S NAME
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
                <div className="grid grid-cols-2 border-b ">
                  <div className="bg-gray-400 px-5 border-r py-1">
                    EVALUATOR'S NAME (TEAM HEAD)
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>

                <div className="grid grid-cols-2  ">
                  <div className="bg-gray-400 px-5 border-r py-1">
                    ACKNOWLEDGED/VALIDATED BY: (AC/RO)
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
              </div>

              <div className="border col-start-3 overflow-hidden rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-cols-2 border-b">
                  <div className="bg-gray-400 rounded-tl px-5 border-r py-1">
                    CARDHOLDER
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
                <div className="grid grid-cols-2 border-b">
                  <div className="bg-gray-400  px-5 border-r py-1">
                    ACCOUNT NUMBER
                  </div>
                  <input className="ml-2 outline-none" type="text" />
                </div>
                <div className="grid grid-cols-2 ">
                  <div className="bg-gray-400 px-5 border-r py-1">SCORE:</div>
                  <div className="grid grid-cols-2">
                    <input className="ml-2 outline-none border-r" type="text" />
                    <input
                      className="ml-2 outline-none w-full"
                      placeholder="RATE"
                      type="text"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 mt-2 pb-5 overflow-auto gap-2 h-full">
            <div className="flex gap-2 h-auto flex-col">
              {withContactSections.map((section, index) => (
                <EvaluationSection
                  key={`with-${section.title}-${index}`}
                  {...section}
                />
              ))}
            </div>

            <div className="flex gap-2 h-auto flex-col">
              {withoutContactSections.map((section, index) => (
                <EvaluationSection
                  key={`without-${
                    section.headingLabel ?? section.title
                  }-${index}`}
                  {...section}
                />
              ))}

              <div>
                <div className="flex">
                  <div className="w-full bg-gray-400 py-1 border-l border-y rounded-tl-md"></div>
                  <div className="grid w-[70%] bg-gray-400 rounded-tr-md border-r border-y grid-cols-4">
                    <div className=" col-start-3 col-span-2 py-1 border-l uppercase flex text-center justify-center items-center">
                      COUNT OF DEFECT
                    </div>
                  </div>
                </div>

                <div className="flex">
                  <div className="w-full uppercase font-semibold bg-gray-400 py-1 border-l border-b">
                    <div className="ml-3">ITEM/S</div>
                  </div>
                  <div className="grid w-[70%] bg-gray-400 text-xs truncate items-center justify-center text-center border-r border-b grid-cols-4">
                    <div className="border-l text-base col-span-2 h-full items-center flex justify-center">
                      RATE
                    </div>
                    <div className="border-x truncate px-1 h-full items-center flex justify-center funga ">
                      <div className="truncate"> W/ CONTACT</div>
                    </div>
                    <div className=" truncate px-1">W/O CONTACT</div>
                  </div>
                </div>

                <div className="flex">
                  <div className="w-full grid grid-rows-5 uppercase bg-white  border-l border-b">
                    <div className="border-b px-3 py-1">OPENING SKILLS</div>
                    <div className="border-b px-3 py-1">
                      NEGOTIATION SKILLS/PROBING SKILLS
                    </div>
                    <div className="border-b px-3 py-1">
                      PRODUCT KNOWLEDGE/PROBLEM SOLVING SKILLS
                    </div>
                    <div className="border-b px-3 py-1">SOFT SKILLS</div>
                    <div className=" px-3 py-1 border-b">WRAP UP</div>
                    <div className=" px-3 py-1 bg-gray-400">
                      TOTAL # OF DEFECT/S AND FINAL SCORE:
                    </div>
                  </div>
                  <div className="grid w-[70%] bg-white text-xs truncate items-center justify-center text-center border-r border-b grid-cols-4 grid-rows-6">
                    <div className="col-span-2 text-5xl font-black border-l h-full flex items-center justify-center row-span-6">
                      100%
                    </div>
                    <div className="border-x h-full items-center flex justify-center border-b">
                      1
                    </div>
                    <div className=" h-full items-center flex justify-center border-b">
                      1
                    </div>
                    <div className="border-x h-full items-center flex justify-center border-b">
                      1
                    </div>
                    <div className=" h-full items-center flex justify-center border-b">
                      1
                    </div>
                    <div className="border-x h-full items-center flex justify-center border-b">
                      1
                    </div>
                    <div className=" h-full items-center flex justify-center border-b">
                      12
                    </div>
                    <div className="border-x h-full items-center flex justify-center border-b">
                      1
                    </div>
                    <div className=" h-full items-center flex justify-center border-b">
                      1
                    </div>
                    <div className="border-x h-full items-center flex justify-center border-b">
                      1
                    </div>
                    <div className=" h-full items-center flex justify-center border-b">
                      1
                    </div>
                    <div className="border-x bg-gray-400 h-full items-center flex justify-center">
                      1
                    </div>
                    <div className=" h-full bg-gray-400 items-center flex justify-center">
                      1
                    </div>
                  </div>
                </div>

                <div className="flex shadow-md">
                  <div className="w-full bg-gray-400 font-semibold uppercase rounded-bl-md  py-1 border-l border-b">
                    <div className="ml-3">Final Rating</div>
                  </div>
                  <div className="grid w-[70%] bg-gray-400 rounded-br-md  items-center justify-center text-center border-r border-b grid-cols-4">
                    <div className="border-l col-span-2 h-full items-center flex justify-center">
                      <div></div>
                    </div>
                    <div className="border-l h-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col  w-full">
                <div className="border flex w-full bg-gray-400 rounded-t-md">
                  <div className="w-full ">
                    <div className="ml-3 py-1">EQUIVALENT DEFECT RATING</div>
                  </div>

                  <div className="grid w-[50%] grid-cols-2 ">
                    <div className="col-span-2 border-l h-full py-1 px-3">
                      FINAL SCORE/RATING
                    </div>
                  </div>
                </div>

                <div className="w-full flex  border-x rounded-b-md shadow-md border-b bg-white ">
                  <div className="flex w-full flex-col">
                    <div className="border-b  py-1 px-3">Critical = 25</div>
                    <div className="border-b  py-1 px-3">Important = 15</div>
                    <div className="border-b  py-1 px-3">Essential = 10</div>
                  </div>
                  <div className="grid w-[50%] font-black uppercase text-white text-shadow-md grid-rows-4">
                    <div className="border-l border-black bg-[#2E7D32] px-3 py-1 border-b">
                      100 Above - EXCELLENT
                    </div>
                    <div className="border-l border-black bg-[#F9A825] px-3 py-1 border-b">
                      90-99 - SUPERIOR
                    </div>
                    <div className="border-l border-black bg-[#EF6C00] px-3 py-1 border-b">
                      89-80 - ACCEPTABLE
                    </div>
                    <div className="border-l border-black bg-[#C62828] px-3 py-1">
                      79 Below - UNACCEPTABLE
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

export default EastwestScoreCard;
