import { Fragment, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import type ExcelJS from "exceljs";

type QuestionConfig = {
  text: string;
  defaultScore: number;
  tag: string;
};

type TL = {
  _id: string;
  name: string;
};

type Agent = {
  _id: string;
  name: string;
};

const GET_BUCKET_TL = gql`
  query getBucketTL {
    getBucketTL {
      _id
      name
    }
  }
`;

const GET_BUCKET_AGENTS = gql`
  query getBucketUser {
    getBucketUser {
      _id
      name
    }
  }
`;

const CREATE_SCORE_CARD = gql`
  mutation CreateScoreCardData($input: ScoreCardDataInput!) {
    createScoreCardData(input: $input) {
      _id
      totalScore
      typeOfScoreCard
    }
  }
`;

type EvaluationSectionConfig = {
  headingLabel?: string;
  title: string;
  questions: QuestionConfig[];
};

const withContactSections: EvaluationSectionConfig[] = [
  {
    headingLabel: "A. WITH CONTACT",
    title: "OPENING SKILLS",
    questions: [
      { text: "Uses Appropriate Greeting", defaultScore: 15, tag: "IMPORTANT" },
      {
        text: "Did the agent advise the third party or person talking to that the call was recorded?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent properly identify self and Company? (No Misrepresentation?)",
        defaultScore: 25,
        tag: "CRITICAL",
      },
    ],
  },
  {
    title: "NEGOTIATION SKILLS",
    questions: [
      {
        text: "Did the agent ask for reason for delay in payment (RFD)/ broken promise (RBP) ?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent follow hierarchy of negotiation?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent offer appropriate alternative solutions based on CH's financial situation?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent explain the consequences for non payment & urgency of the payment?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent secure PTP within the allowable grace period?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
    ],
  },
  {
    title: "PRODUCT KNOWLEDGE/PROBLEM SOLVING SKILLS",
    questions: [
      {
        text: "Did the agent offer and appropriately discussed the applicable repayment program?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent accurately explain and compute applicable fees, charges or discount amount?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent address the concerns raised by the CH regarding his/her account?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
    ],
  },
  {
    title: "SOFT SKILLS",
    questions: [
      {
        text: "Did the agent have a good control of the conversation?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent communicate according to the cardholder's language of expertise? Avoided using jargon or technical terms that the customer wasn't familiar with.",
        defaultScore: 10,
        tag: "ESSENTIAL",
      },
      {
        text: "Is the agent's tone of voice professional, not overly aggressive, non-confrontational, not sarcastic or condescending?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent demonstrate empathy and understanding of the customer's situation?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent conduct the call at a reasonable pace - neither rushed nor unnecessarily prolonged?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent record accurate and complete details of the conversation in the system?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent comply with EWBC Collection Agency Code of Conduct?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
    ],
  },
  {
    title: "WRAP UP/CLOSING THE CALL",
    questions: [
      {
        text: "Did the agent  ask for payment confirmation?	",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent reminded client of the next due date or payment schedule?	",
        defaultScore: 10,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent obtains/verifies customer's Information? (Demographics)",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "If an information update was requested, was PID competed as required?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
    ],
  },
];

const withoutContactSections: EvaluationSectionConfig[] = [
  {
    headingLabel: "B. WITHOUT CONTACT",
    title: "OPENING SKILLS",
    questions: [
      { text: "Uses Appropriate Greeting", defaultScore: 15, tag: "IMPORTANT" },
      {
        text: "Did the agent advise the third party or person talking to that the call was recorded?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent properly identify self and Company? (No Misrepresentation?)",
        defaultScore: 25,
        tag: "CRITICAL",
      },
    ],
  },
  {
    title: "PROBING SKILLS",
    questions: [
      {
        text: "Did the agent probe for BTC, ETA/EDA and other contact numbers to reach CH?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent ask for right party contact who can receive the message?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent use the history of the account to follow up previous messages left?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent attempt to contact client thru all the possible contact # based on the history/system?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent ask info questions to obtain lead/s to the whereabouts of client/s?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
    ],
  },
  {
    title: "SOFT SKILLS",
    questions: [
      {
        text: "Did the agent endorse the account for SKIPS and FV?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent have a good control of the conversation?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Is the agent's tone of voice professional, not overly aggressive, non-confrontational, not sarcastic or condescending?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent record accurate details of the conversation in the system?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent comply with EWBC Collection Agency Code of Conduct?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
    ],
  },
  {
    title: "WRAP UP/CLOSING THE CALL",
    questions: [
      {
        text: "Did the agent leave a message for a return call?",
        defaultScore: 25,
        tag: "CRITICAL",
      },
      {
        text: "Did the agent ask the 3rd party to read back the number for return call?",
        defaultScore: 15,
        tag: "CRITICAL",
      },
    ],
  },
];

const defectSummaryRows = [
  { label: "OPENING SKILLS" },
  { label: "NEGOTIATION SKILLS/PROBING SKILLS" },
  { label: "PRODUCT KNOWLEDGE/PROBLEM SOLVING SKILLS" },
  { label: "SOFT SKILLS" },
  { label: "WRAP UP" },
  { label: "TOTAL # OF DEFECT/S AND FINAL SCORE:", highlight: true },
];

const defectRatings = ["Critical = 25", "Important = 15", "Essential = 10"];

const ratingScale = [
  { text: "100 Above - EXCELLENT", color: "bg-[#2E7D32]" },
  { text: "90-99 - SUPERIOR", color: "bg-[#F9A825]" },
  { text: "89-80 - ACCEPTABLE", color: "bg-[#EF6C00]" },
  { text: "79 Below - UNACCEPTABLE", color: "bg-[#C62828]" },
];

const ratingFromScore = (score: number) => {
  if (score >= 100) return "EXCELLENT";
  if (score >= 90) return "SUPERIOR";
  if (score >= 80) return "ACCEPTABLE";
  return "UNACCEPTABLE";
};

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

const QuestionRow = ({
  config,
  isYes,
  onToggle,
}: {
  config: QuestionConfig;
  isYes: boolean;
  onToggle: () => void;
}) => {
  const { text, defaultScore, tag } = config;
  const score = isYes ? 0 : defaultScore;

  const yesClasses =
    "bg-green-600 hover:bg-green-700 border-green-900 text-white";
  const noClasses = "bg-red-600 hover:bg-red-700 border-red-800 text-white";

  return (
    <div className="flex">
      <div className="w-full bg-white px-3 py-1 border-l border-b">{text}</div>
      <div className="grid w-[50%] bg-white items-center justify-center text-center border-r border-b grid-cols-3">
        <div className="border-x p-1 text-xs uppercase gap-1 h-full items-center flex justify-center">
          <motion.button
            type="button"
            data-state={isYes ? "yes" : "no"}
            aria-pressed={isYes}
            onClick={onToggle}
            whileTap={{ scale: 0.2 }}
            className={`py-2 transition-all flex items-center duration-100 justify-center border-2 rounded-sm w-full font-black text-shadow-2xs cursor-pointer ${
              isYes ? yesClasses : noClasses
            }`}
          >
            <span className={isYes ? "block" : "hidden"}>YES</span>
            <span className={isYes ? "hidden" : "block"}>NO</span>
          </motion.button>
        </div>
        <div className="border-r h-full items-center flex justify-center">
          <div>{score}</div>
        </div>
        <div className="px-1 h-full items-center flex justify-center text-xs font-semibold uppercase text-black">
          <div className="truncate">{tag}</div>
        </div>
      </div>
    </div>
  );
};

const SectionTotalRow = ({ totalNo }: { totalNo: number }) => (
  <div className="flex shadow-md">
    <div className="w-full bg-gray-400 font-semibold uppercase rounded-bl-md px-3 py-1 border-l border-b">
      Total
    </div>
    <div className="grid w-[50%] bg-gray-400 rounded-br-md  items-center justify-center text-center border-r border-b grid-cols-3">
      <div className="border-x h-full items-center flex justify-center font-semibold">
        {totalNo}
      </div>
      <div className="border-r h-full" />
      <div />
    </div>
  </div>
);

const EvaluationSection = ({
  headingLabel = "",
  title,
  questions,
  responses,
  onToggle,
}: EvaluationSectionConfig & {
  responses: boolean[];
  onToggle: (index: number) => void;
}) => {
  const totalNo = responses.filter((isYes) => !isYes).length;

  return (
    <div>
      <SectionHeading label={headingLabel} />
      <SectionSubHeader title={title} />
      {questions.map((question, index) => (
        <QuestionRow
          key={question.text}
          config={question}
          isYes={responses[index]}
          onToggle={() => onToggle(index)}
        />
      ))}
      <SectionTotalRow totalNo={totalNo} />
    </div>
  );
};

const DefectSummaryTable = ({
  withContactCounts,
  withoutContactCounts,
  totalNoWithContact,
  totalNoWithoutContact,
  finalScore,
}: {
  withContactCounts: number[];
  withoutContactCounts: number[];
  totalNoWithContact: number;
  totalNoWithoutContact: number;
  finalScore: number;
}) => (
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
        <div className="border-x truncate px-1 h-full items-center flex justify-center">
          <div className="truncate"> W/ CONTACT</div>
        </div>
        <div className=" truncate px-1">W/O CONTACT</div>
      </div>
    </div>

    <div className="flex">
      <div className="w-full grid grid-rows-6 uppercase bg-white  border-l border-b">
        {defectSummaryRows.map(({ label, highlight }) => (
          <div
            key={label}
            className={`px-3 last:border-b-0 py-1 border-b ${
              highlight ? "bg-gray-400" : ""
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid w-[70%] bg-white text-xs truncate items-center justify-center text-center border-r border-b grid-cols-4 grid-rows-6">
        <div className="col-span-2 row-span-6 text-5xl font-black border-l h-full flex items-center justify-center">
          {finalScore}
        </div>
        {defectSummaryRows.map(({ label, highlight }, idx) => (
          <Fragment key={label}>
            <div
              className={`border-x h-full items-center flex justify-center ${
                highlight ? "bg-gray-400" : "border-b"
              }`}
            >
              {highlight ? totalNoWithContact : withContactCounts[idx] ?? 0}
            </div>
            <div
              className={`h-full items-center flex justify-center ${
                highlight
                  ? "bg-gray-400"
                  : idx === 2
                  ? "bg-gray-400 border-b"
                  : "border-b"
              }`}
            >
              {highlight
                ? totalNoWithoutContact
                : idx === 2
                ? ""
                : withoutContactCounts[idx] ?? 0}
            </div>
          </Fragment>
        ))}
      </div>
    </div>

    <div className="flex shadow-md">
      <div className="w-full bg-gray-400 font-semibold uppercase rounded-bl-md  py-1 border-l border-b">
        <div className="ml-3">Final Rating</div>
      </div>
      <div className="grid w-[70%] bg-gray-400 rounded-br-md  items-center justify-center text-center border-r border-b grid-cols-4">
        <div
          className={` ${
            finalScore < 80
              ? "bg-[#C62828]"
              : finalScore < 90
              ? "bg-[#EF6C00]"
              : finalScore < 100
              ? "bg-[#F9A825]"
              : "bg-[#2E7D32]"
          } border-l text-shadow-2xs transition-all col-span-2 h-full items-center flex text-white border-black justify-center font-semibold `}
        >
          {ratingFromScore(finalScore)}
        </div>
        <div className="border-l h-full"></div>
      </div>
    </div>
  </div>
);

const EquivalentRatingBlock = () => (
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
        {defectRatings.map((text) => (
          <div key={text} className="border-b py-1 px-3">
            {text}
          </div>
        ))}
      </div>
      <div className="grid w-[50%] font-black uppercase text-white text-shadow-md grid-rows-4">
        {ratingScale.map(({ text, color }) => (
          <div
            key={text}
            className={`border-l truncate border-black ${color} px-3 py-1 ${
              text !== ratingScale[ratingScale.length - 1].text
                ? "border-b"
                : ""
            }`}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const EastwestScoreCard = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [isOpenTL, setIsOpenTL] = useState(false);
  const [isOpenAgent, setIsOpenAgent] = useState(false);
  const [cardholder, setCardholder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [rateInput, setRateInput] = useState("");
  const [isValidated, setIsValidated] = useState(true);
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const { data: tlData, loading: tlLoading } = useQuery<{ getBucketTL: TL[] }>(
    GET_BUCKET_TL,
    {
      skip: !userLogged,
      fetchPolicy: "cache-and-network",
    }
  );
  const { data: agentData, loading: agentLoading } = useQuery<{
    getBucketUser: Agent[];
  }>(GET_BUCKET_AGENTS, {
    skip: !userLogged,
    fetchPolicy: "cache-and-network",
  });
  const [createScoreCardData, { loading: isSaving }] =
    useMutation(CREATE_SCORE_CARD);
  const createInitialWithContactResponses = () =>
    withContactSections.map((section) => section.questions.map(() => true));
  const createInitialWithoutContactResponses = () =>
    withoutContactSections.map((section) => section.questions.map(() => true));
  const [selectedEvaluator, setSelectedEvaluator] = useState<TL | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [acknowledgedBy, setAcknowledgedBy] = useState("");
  const [evaluatorRemarks, setEvaluatorRemarks] = useState("");
  const [agentRemarks, setAgentRemarks] = useState("");
  const [acComments, setAcComments] = useState("");
  const [withContactResponses, setWithContactResponses] = useState<boolean[][]>(
    createInitialWithContactResponses
  );

  const [withoutContactResponses, setWithoutContactResponses] = useState<
    boolean[][]
  >(createInitialWithoutContactResponses);

  const toggleResponse = (
    column: "with" | "without",
    sectionIndex: number,
    questionIndex: number
  ) => {
    const setter =
      column === "with" ? setWithContactResponses : setWithoutContactResponses;

    setter((prev) =>
      prev.map((section, sIdx) =>
        sIdx === sectionIndex
          ? section.map((val, qIdx) => (qIdx === questionIndex ? !val : val))
          : section
      )
    );
  };

  const computeTotals = () => {
    const withTotals = withContactSections.reduce(
      (acc, section, sIdx) => {
        section.questions.forEach((q, qIdx) => {
          const isYes = withContactResponses[sIdx]?.[qIdx] ?? true;
          if (!isYes) {
            acc.noCount += 1;
            acc.penalty += q.defaultScore;
            acc.perCategory[sIdx] = (acc.perCategory[sIdx] || 0) + 1;
          }
        });
        return acc;
      },
      {
        noCount: 0,
        penalty: 0,
        perCategory: Array(withContactSections.length).fill(0),
      }
    );

    const withoutTotals = withoutContactSections.reduce(
      (acc, section, sIdx) => {
        section.questions.forEach((q, qIdx) => {
          const isYes = withoutContactResponses[sIdx]?.[qIdx] ?? true;
          if (!isYes) {
            acc.noCount += 1;
            acc.penalty += q.defaultScore;
            acc.perCategory[sIdx] = (acc.perCategory[sIdx] || 0) + 1;
          }
        });
        return acc;
      },
      {
        noCount: 0,
        penalty: 0,
        perCategory: Array(withoutContactSections.length).fill(0),
      }
    );

    const totalPenalty = withTotals.penalty + withoutTotals.penalty;
    const finalScore = 100 - totalPenalty;

    return { withTotals, withoutTotals, finalScore };
  };

  const { withTotals, withoutTotals, finalScore } = computeTotals();
  const withContactCounts = [
    withTotals.perCategory[0] ?? 0,
    withTotals.perCategory[1] ?? 0,
    withTotals.perCategory[2] ?? 0,
    withTotals.perCategory[3] ?? 0,
    withTotals.perCategory[4] ?? 0,
    withTotals.noCount,
  ];

  const withoutContactCounts = [
    withoutTotals.perCategory[0] ?? 0,
    withoutTotals.perCategory[1] ?? 0,
    0,
    withoutTotals.perCategory[2] ?? 0,
    withoutTotals.perCategory[3] ?? 0,
    withoutTotals.noCount,
  ];

  // const buildExportRows = () => {
  //   const rows: Array<{
  //     section: string;
  //     question: string;
  //     response: string | number;
  //     score: string | number;
  //     tag: string | number;
  //   }> = [];

  //   withContactSections.forEach((section, sIdx) => {
  //     rows.push({
  //       section: section.headingLabel ?? "",
  //       question: section.title,
  //       response: "",
  //       score: "",
  //       tag: "",
  //     });

  //     section.questions.forEach((q, qIdx) => {
  //       const isYes = withContactResponses[sIdx]?.[qIdx] ?? true;
  //       rows.push({
  //         section: "",
  //         question: q.text,
  //         response: isYes ? "YES" : "NO",
  //         score: isYes ? 0 : q.defaultScore,
  //         tag: q.tag,
  //       });
  //     });

  //     rows.push({
  //       section: "",
  //       question: "Total NO",
  //       response: withTotals.perCategory[sIdx] ?? 0,
  //       score: "",
  //       tag: "",
  //     });

  //     rows.push({
  //       section: "",
  //       question: "",
  //       response: "",
  //       score: "",
  //       tag: "",
  //     });
  //   });

  //   rows.push({
  //     section: "B. WITHOUT CONTACT",
  //     question: "",
  //     response: "",
  //     score: "",
  //     tag: "",
  //   });

  //   withoutContactSections.forEach((section, sIdx) => {
  //     rows.push({
  //       section: "",
  //       question: section.title,
  //       response: "",
  //       score: "",
  //       tag: "",
  //     });

  //     section.questions.forEach((q, qIdx) => {
  //       const isYes = withoutContactResponses[sIdx]?.[qIdx] ?? true;
  //       rows.push({
  //         section: "",
  //         question: q.text,
  //         response: isYes ? "YES" : "NO",
  //         score: isYes ? 0 : q.defaultScore,
  //         tag: q.tag,
  //       });
  //     });

  //     rows.push({
  //       section: "",
  //       question: "Total NO",
  //       response: withoutTotals.perCategory[sIdx] ?? 0,
  //       score: "",
  //       tag: "",
  //     });

  //     rows.push({
  //       section: "",
  //       question: "",
  //       response: "",
  //       score: "",
  //       tag: "",
  //     });
  //   });

  //   rows.push({
  //     section: "",
  //     question: "Overall NO (W/ CONTACT)",
  //     response: withTotals.noCount,
  //     score: "",
  //     tag: "",
  //   });
  //   rows.push({
  //     section: "",
  //     question: "Overall NO (W/O CONTACT)",
  //     response: withoutTotals.noCount,
  //     score: "",
  //     tag: "",
  //   });
  //   rows.push({
  //     section: "",
  //     question: "Final Score",
  //     response: finalScore,
  //     score: "",
  //     tag: ratingFromScore(finalScore),
  //   });

  //   return rows;
  // };

  const buildScoreDetailsPayload = (evaluationDateIso: string) => {
    const mapSections = (
      sections: EvaluationSectionConfig[],
      responses: boolean[][],
      counts: number[]
    ) =>
      sections.map((section, sIdx) => ({
        headingLabel: section.headingLabel ?? "",
        title: section.title,
        totalNo: counts[sIdx] ?? 0,
        questions: section.questions.map((q, qIdx) => {
          const isYes = responses[sIdx]?.[qIdx] ?? true;
          return {
            text: q.text,
            tag: q.tag,
            defaultScore: q.defaultScore,
            response: isYes ? "YES" : "NO",
            penalty: isYes ? 0 : q.defaultScore,
          };
        }),
      }));

    return {
      meta: {
        evaluationDate: evaluationDateIso,
        acknowledgedBy,
        agent: selectedAgent
          ? { id: selectedAgent._id, name: selectedAgent.name }
          : null,
        evaluator: selectedEvaluator
          ? { id: selectedEvaluator._id, name: selectedEvaluator.name }
          : null,
        cardholder,
        accountNumber,
        enteredRate: rateInput,
      },
      withContact: mapSections(
        withContactSections,
        withContactResponses,
        withTotals.perCategory
      ),
      withoutContact: mapSections(
        withoutContactSections,
        withoutContactResponses,
        withoutTotals.perCategory
      ),
      totals: {
        withContact: withTotals.noCount,
        withoutContact: withoutTotals.noCount,
        finalScore,
      },
    };
  };

  const exportToExcel = async () => {
    const excelModule = await import("exceljs/dist/exceljs.min.js");
    const ExcelJS = excelModule.default ?? excelModule;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "QA";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Eastwest Score Card", {
      views: [{ showGridLines: false }],
    });

    const thinBorder: ExcelJS.Borders = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
      diagonal: {},
    };

    const thickBorder: ExcelJS.Borders = {
      top: { style: "medium" },
      left: { style: "medium" },
      bottom: { style: "medium" },
      right: { style: "medium" },
      diagonal: {},
    };

    const amberFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF00" },
    };

    const solidGreenFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF548235" },
    };

    const greenFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF70AD47" },
    };

    const lightGreenFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFA9D08E" },
    };

    const solidBlueFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00B0F0" },
    };
    const blueFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF66CCFF" },
    };

    const lightBlueFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    };

    const orangeFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7030A0" },
    };

    const blackFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000000" },
    };

    const grayFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB0B0B0" },
    };

    const applyBorder = (
      ws: ExcelJS.Worksheet,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      border: ExcelJS.Borders
    ): void => {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const cell = ws.getCell(r, c);
          cell.border = border;
          cell.alignment = {
            ...(cell.alignment ?? {}),
            wrapText: true,
            vertical: "middle",
          };
        }
      }
    };

    const applyBorderWithInner = (
      ws: ExcelJS.Worksheet,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      outer: ExcelJS.Borders,
      inner: ExcelJS.Borders
    ): void => {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const cell = ws.getCell(r, c);
          cell.border = {
            top: r === r1 ? outer.top : inner.top,
            bottom: r === r2 ? outer.bottom : inner.bottom,
            left: c === c1 ? outer.left : inner.left,
            right: c === c2 ? outer.right : inner.right,
            diagonal: {},
          };
          cell.alignment = {
            ...(cell.alignment ?? {}),
            wrapText: true,
            vertical: "middle",
          };
        }
      }
    };

    const applyFill = (
      ws: ExcelJS.Worksheet,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      fill: ExcelJS.Fill
    ): void => {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          ws.getCell(r, c).fill = fill;
        }
      }
    };

    const setFontColor = (
      ws: ExcelJS.Worksheet,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      color: Partial<ExcelJS.Color>,
      bold = false
    ): void => {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const cell = ws.getCell(r, c);
          cell.font = { ...(cell.font ?? {}), color, bold };
        }
      }
    };

    const centerCells = (
      ws: ExcelJS.Worksheet,
      r1: number,
      r2: number,
      c1: number,
      c2: number
    ): void => {
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const cell = ws.getCell(r, c);
          cell.alignment = {
            ...(cell.alignment ?? {}),
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
        }
      }
    };

    worksheet.columns = [
      { header: "A", key: "a", width: 62 },
      { header: "B", key: "b", width: 60 },
      { header: "C", key: "c", width: 19 },
      { header: "D", key: "d", width: 13 },
      { header: "E", key: "e", width: 18 },
      { header: "F", key: "f", width: 3 },
      { header: "G", key: "g", width: 3 },
      { header: "H", key: "h", width: 77 },
      { header: "I", key: "i", width: 57 },
      { header: "J", key: "j", width: 19 },
      { header: "K", key: "k", width: 22 },
      { header: "L", key: "l", width: 20 },
    ];

    worksheet.mergeCells("A1:H1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "TPSP PHONE MONITORING SHEET";
    titleCell.font = { size: 30, bold: true, name: "Calibri" };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.mergeCells("I1:L1");

    const secondTitleCell = worksheet.getCell("I1");
    secondTitleCell.value = "Bernales & Associates";
    secondTitleCell.font = {
      size: 30,
      bold: false,
      name: "Calibri",
      color: { argb: "FF0000" },
    };
    secondTitleCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.getCell("I1").value = "Bernales & Associates";
    applyBorder(worksheet, 1, 1, 1, 12, thickBorder);

    worksheet.getCell("A4").value = "EVALUATION DATE";
    worksheet.getCell("A5").value = "AGENT'S NAME";
    worksheet.getCell("A6").value = "EVALATOR'S NAME (TEAM HEAD)";
    worksheet.getCell("A7").value = "ACKNOWLEDGED/VALIDATED BY: (AC/RO)";
    worksheet.getCell("B4").value = todayLabel;
    worksheet.getCell("B5").value = selectedAgent?.name ?? "";
    worksheet.getCell("B6").value = selectedEvaluator?.name ?? "";
    worksheet.getCell("B7").value = acknowledgedBy;
    applyBorder(worksheet, 4, 7, 1, 2, thinBorder);

    worksheet.mergeCells("I4:K4");
    worksheet.mergeCells("I5:K5");
    worksheet.mergeCells("I6:K6");
    worksheet.mergeCells("A2:L2");
    worksheet.getCell("A2").value = "RATING SHEET";
    worksheet.getCell("A2").alignment = {
      horizontal: "center",
    };
    applyBorder(worksheet, 2, 2, 1, 12, thickBorder);
    worksheet.getCell("H4").value = "CARDHOLDER";
    worksheet.getCell("H5").value = "ACCOUNT NUMBER";
    worksheet.getCell("H6").value = "SCORE:";
    worksheet.getCell("I4").value = cardholder;
    worksheet.getCell("I5").value = accountNumber;
    worksheet.getCell("I6").value = rateInput
      ? `${finalScore} | Rate: ${rateInput}`
      : finalScore;
    applyBorder(worksheet, 4, 6, 8, 11, thinBorder);

    worksheet.getCell("A9").value = "A. WITH CONTACT";
    applyBorder(worksheet, 9, 9, 1, 1, thickBorder);

    worksheet.getCell("A11").value = "OPENING SKILLS";
    applyBorder(worksheet, 11, 11, 1, 1, thickBorder);

    worksheet.mergeCells("C11:D11");
    worksheet.getCell("C11").value = "DEFECT";
    centerCells(worksheet, 11, 11, 3, 4);
    applyBorder(worksheet, 11, 11, 3, 4, thickBorder);

    worksheet.getCell("C12").value = "Y/N";
    worksheet.getCell("D12").value = "SCORE";
    worksheet.getCell("E12").value = "Tagging";
    centerCells(worksheet, 12, 12, 3, 5);
    applyBorder(worksheet, 12, 12, 3, 5, thickBorder);
    worksheet.getRow(13).height = 15;
    worksheet.getRow(14).height = 15;
    worksheet.getRow(21).height = 15;
    worksheet.getRow(23).height = 15;
    worksheet.getRow(36).height = 20;
    worksheet.getRow(40).height = 20;

    worksheet.getRow(42).height = 22;
    worksheet.getRow(43).height = 22;

    applyFill(worksheet, 65, 65, 1, 5, lightGreenFill);
    applyFill(worksheet, 43, 43, 10, 10, lightGreenFill);
    applyFill(worksheet, 49, 49, 10, 10, lightGreenFill);
    applyFill(worksheet, 65, 65, 8, 12, lightGreenFill);
    applyFill(worksheet, 58, 62, 1, 5, amberFill);
    applyFill(worksheet, 4, 7, 2, 2, amberFill);
    applyFill(worksheet, 4, 6, 9, 11, amberFill);
    applyFill(worksheet, 1, 1, 9, 12, amberFill);

    applyFill(worksheet, 58, 62, 8, 12, amberFill);
    applyFill(worksheet, 49, 49, 11, 11, solidBlueFill);
    applyFill(worksheet, 43, 43, 11, 11, solidBlueFill);

    applyFill(worksheet, 13, 15, 3, 3, amberFill);
    applyFill(worksheet, 20, 24, 3, 3, amberFill);
    applyFill(worksheet, 29, 31, 3, 3, amberFill);
    applyFill(worksheet, 36, 43, 3, 3, amberFill);
    applyFill(worksheet, 48, 51, 3, 3, amberFill);
    applyFill(worksheet, 16, 16, 3, 3, lightGreenFill);
    applyFill(worksheet, 25, 25, 3, 3, lightGreenFill);
    applyFill(worksheet, 32, 32, 3, 3, lightGreenFill);
    applyFill(worksheet, 44, 44, 3, 3, lightGreenFill);
    applyFill(worksheet, 52, 52, 3, 3, lightGreenFill);
    applyFill(worksheet, 16, 16, 1, 2, lightGreenFill);
    applyFill(worksheet, 25, 25, 1, 2, lightGreenFill);
    applyFill(worksheet, 32, 32, 1, 2, lightGreenFill);
    applyFill(worksheet, 44, 44, 1, 2, lightGreenFill);
    applyFill(worksheet, 52, 52, 1, 2, lightGreenFill);
    applyFill(worksheet, 9, 9, 1, 1, solidGreenFill);
    applyFill(worksheet, 11, 11, 1, 1, greenFill);
    applyFill(worksheet, 18, 18, 1, 1, greenFill);
    applyFill(worksheet, 27, 27, 1, 1, greenFill);
    applyFill(worksheet, 32, 32, 1, 1, lightGreenFill);
    applyFill(worksheet, 34, 34, 1, 1, greenFill);
    applyFill(worksheet, 46, 46, 1, 1, greenFill);

    applyFill(worksheet, 9, 9, 8, 8, solidBlueFill);
    applyFill(worksheet, 11, 11, 8, 8, blueFill);
    applyFill(worksheet, 16, 16, 8, 10, lightBlueFill);
    applyFill(worksheet, 18, 18, 8, 8, blueFill);

    applyFill(worksheet, 27, 27, 8, 8, blueFill);
    applyFill(worksheet, 34, 34, 8, 10, blueFill);
    applyFill(worksheet, 36, 36, 8, 8, blueFill);

    applyFill(worksheet, 43, 43, 8, 9, orangeFill);
    applyFill(worksheet, 42, 42, 10, 11, orangeFill);
    applyFill(worksheet, 44, 49, 9, 9, orangeFill);
    applyFill(worksheet, 49, 49, 8, 8, orangeFill);

    const whiteFont = { argb: "FFFFFFFF" } as const;
    setFontColor(worksheet, 43, 43, 8, 9, whiteFont, true);
    setFontColor(worksheet, 42, 42, 10, 11, whiteFont, true);
    setFontColor(worksheet, 44, 49, 9, 9, whiteFont, true);
    setFontColor(worksheet, 49, 49, 8, 8, whiteFont, true);

    applyFill(worksheet, 34, 34, 8, 10, lightBlueFill);
    applyFill(worksheet, 40, 40, 8, 10, lightBlueFill);
    applyFill(worksheet, 25, 25, 8, 10, lightBlueFill);

    worksheet.mergeCells("A13:B13");
    worksheet.getCell("A13").value = "Uses Appropriate Greeting";
    worksheet.mergeCells("A14:B14");
    worksheet.getCell("A14").value =
      "Did the agent advise the third party or person talking to that the call was recorded?	";
    applyBorder(worksheet, 34, 34, 1, 1, thickBorder);
    applyBorder(worksheet, 34, 34, 3, 4, thickBorder);
    applyBorder(worksheet, 35, 35, 3, 5, thickBorder);
    applyBorderWithInner(worksheet, 36, 43, 1, 5, thickBorder, thinBorder);
    applyBorder(worksheet, 44, 44, 1, 3, thickBorder);
    worksheet.mergeCells("A15:B15");
    worksheet.getCell("A15").value =
      "Did the agent properly identify self and Company? (No Misrepresentation?)";
    applyBorder(worksheet, 18, 18, 1, 1, thickBorder);
    applyBorder(worksheet, 18, 18, 3, 4, thickBorder);
    applyBorder(worksheet, 19, 19, 3, 5, thickBorder);
    applyBorderWithInner(worksheet, 20, 24, 1, 5, thickBorder, thinBorder);
    applyBorder(worksheet, 25, 25, 1, 3, thickBorder);
    applyBorder(worksheet, 18, 18, 1, 1, thickBorder);
    applyBorder(worksheet, 18, 18, 3, 4, thickBorder);
    applyBorder(worksheet, 19, 19, 3, 5, thickBorder);
    applyBorderWithInner(worksheet, 20, 24, 1, 5, thickBorder, thinBorder);
    applyBorder(worksheet, 25, 25, 1, 3, thickBorder);
    worksheet.mergeCells("A16:B16");
    worksheet.getCell("A16").value = "TOTAL";
    applyBorderWithInner(worksheet, 13, 15, 1, 5, thickBorder, thinBorder);
    applyBorder(worksheet, 16, 16, 1, 3, thickBorder);

    worksheet.getCell("A18").value = "NEGOTIATION SKILLS";

    worksheet.mergeCells("C18:D18");
    worksheet.getCell("C18").value = "DEFECT";
    centerCells(worksheet, 18, 18, 3, 4);

    worksheet.getCell("C19").value = "Y/N";
    worksheet.getCell("D19").value = "SCORE";
    worksheet.getCell("E19").value = "Tagging";
    centerCells(worksheet, 19, 19, 3, 5);

    worksheet.mergeCells("A20:B20");
    worksheet.getCell("A20").value =
      "Did the agent ask for reason for delay in payment (RFD)/ broken promise (RBP) ?";
    worksheet.mergeCells("A21:B21");
    worksheet.getCell("A21").value =
      "Did the agent follow hierarchy of negotiation?";
    worksheet.mergeCells("A22:B22");
    worksheet.getCell("A22").value = applyBorder(
      worksheet,
      27,
      27,
      1,
      1,
      thickBorder
    );
    applyBorder(worksheet, 27, 27, 3, 4, thickBorder);
    applyBorder(worksheet, 28, 28, 3, 5, thickBorder);
    applyBorderWithInner(worksheet, 29, 31, 1, 5, thickBorder, thinBorder);
    applyBorder(worksheet, 32, 32, 1, 3, thickBorder);
    worksheet.getCell("A22").value =
      "Did the agent offer appropriate alternative solutions based on CH's financial situation?";
    worksheet.mergeCells("A23:B23");
    worksheet.getCell("A23").value =
      "Did the agent  explain the consequences for non payment & urgency of the payment?	";
    worksheet.mergeCells("A24:B24");
    worksheet.getCell("A24").value =
      "Did the agent secure PTP within the allowable grace period?	";
    worksheet.mergeCells("A25:B25");
    worksheet.getCell("A25").value = "TOTAL";

    worksheet.mergeCells("A27:B27");
    worksheet.getCell("A27").value = "PRODUCT KNOWLEDGE/PROBLEM SOLVING SKILLS	";

    worksheet.mergeCells("C27:D27");
    worksheet.getCell("C27").value = "DEFECT";
    centerCells(worksheet, 27, 27, 3, 4);

    worksheet.getCell("C28").value = "Y/N";
    worksheet.getCell("D28").value = "SCORE";
    worksheet.getCell("E28").value = "Tagging";
    centerCells(worksheet, 28, 28, 3, 5);

    worksheet.mergeCells("A29:B29");
    worksheet.getCell("A29").value =
      "Did the agent offer and appropriately discussed the applicable repayment program?	";
    worksheet.mergeCells("A30:B30");
    worksheet.getCell("A30").value =
      "Did the agent accurately explain and compute applicable fees, charges or discount amount?	";
    worksheet.mergeCells("A31:B31");
    worksheet.getCell("A31").value =
      "Did the agent address the concerns raised by the CH regarding his/her account?	";
    worksheet.mergeCells("A32:B32");
    worksheet.getCell("A32").value = "TOTAL";

    worksheet.getCell("A34").value = "SOFT SKILLS";

    worksheet.mergeCells("C34:D34");
    worksheet.getCell("C34").value = "DEFECT";
    centerCells(worksheet, 34, 34, 3, 4);

    worksheet.getCell("C35").value = "Y/N";
    worksheet.getCell("D35").value = "SCORE";
    worksheet.getCell("E35").value = "Tagging";
    centerCells(worksheet, 35, 35, 3, 5);

    worksheet.mergeCells("A36:B36");
    worksheet.mergeCells("C38:C39");
    worksheet.mergeCells("D38:D39");
    worksheet.mergeCells("E38:E39");

    worksheet.getCell("A36").value =
      "Did the agent  have a good control of the conversation?	";
    worksheet.mergeCells("A37:B37");
    worksheet.getCell("A37").value =
      "Did the agent  communicate according to the cardholder's language of expertise? Avoided using jargon or technical terms that the customer wasn't familiar with.	";
    worksheet.mergeCells("A38:B39");
    worksheet.getCell("A38").value =
      "Is the agent's tone of voice professional, not overly aggressive, non-confrontational, not sarcastic or condescending?";
    worksheet.mergeCells("A40:B40");
    worksheet.getCell("A40").value =
      "Did the agent demonstrate empathy and understanding of the customer's situation?";
    worksheet.mergeCells("A41:B41");
    worksheet.getCell("A41").value =
      "Did the agent conduct the call at a reasonable pace - neither rushed nor unnecessarily prolonged?	";
    worksheet.mergeCells("A42:B42");
    worksheet.getCell("A42").value =
      "Did the agent record accurate and complete details of the conversation in the system?	";
    worksheet.mergeCells("A43:B43");
    worksheet.getCell("A43").value =
      "Did the agent comply with EWBC Collection Agency Code of Conduct?	";
    worksheet.mergeCells("A44:B44");
    worksheet.getCell("A44").value = "TOTAL";

    worksheet.getCell("A46").value = "WRAP UP/CLOSING THE CALL";

    worksheet.mergeCells("C46:D46");
    worksheet.getCell("C46").value = "DEFECT";
    centerCells(worksheet, 46, 46, 3, 4);

    worksheet.getCell("C47").value = "Y/N";
    worksheet.getCell("D47").value = "SCORE";
    worksheet.getCell("E47").value = "Tagging";
    centerCells(worksheet, 47, 47, 3, 5);

    worksheet.mergeCells("A48:B48");
    worksheet.getCell("A48").value =
      "Did the agent  ask for payment confirmation?";
    worksheet.mergeCells("A49:B49");
    worksheet.getCell("A49").value =
      "Did the agent reminded client of the next due date or payment schedule?";
    worksheet.mergeCells("A50:B50");
    worksheet.getCell("A50").value =
      "Did the agent obtains/verifies customer's Information? (Demographics)";
    worksheet.mergeCells("A51:B51");
    worksheet.getCell("A51").value =
      "If an information update was requested, was PID competed as required?";
    worksheet.mergeCells("A52:B52");
    worksheet.getCell("A52").value = "TOTAL";
    applyBorder(worksheet, 46, 46, 1, 1, thickBorder);
    applyBorder(worksheet, 46, 46, 3, 4, thickBorder);
    applyBorder(worksheet, 47, 47, 3, 5, thickBorder);
    applyBorderWithInner(worksheet, 48, 51, 1, 5, thickBorder, thinBorder);
    applyBorder(worksheet, 52, 52, 1, 3, thickBorder);

    worksheet.getCell("H9").value = "B. WITHOUT CONTACT";
    applyBorder(worksheet, 9, 9, 8, 8, thickBorder);

    worksheet.getCell("H11").value = "OPENING SKILLS";
    applyBorder(worksheet, 11, 11, 8, 8, thickBorder);

    worksheet.mergeCells("J11:K11");
    worksheet.getCell("J11").value = "DEFECT";
    centerCells(worksheet, 11, 11, 10, 11);
    applyBorder(worksheet, 11, 11, 10, 11, thickBorder);

    worksheet.getCell("J12").value = "Y/N";
    worksheet.getCell("K12").value = "SCORE";
    worksheet.getCell("L12").value = "Tagging";
    centerCells(worksheet, 12, 12, 10, 12);
    applyBorder(worksheet, 12, 12, 10, 12, thickBorder);

    applyFill(worksheet, 13, 15, 10, 10, amberFill);
    applyFill(worksheet, 20, 24, 10, 10, amberFill);
    applyFill(worksheet, 29, 33, 10, 10, amberFill);
    applyFill(worksheet, 38, 39, 10, 10, amberFill);
    worksheet.mergeCells("H13:I13");
    worksheet.getCell("H13").value = "Uses Appropriate Greeting";
    worksheet.mergeCells("H14:I14");
    worksheet.getCell("H14").value =
      "Did the agent advise the third party or person talking to that the call was recorded?";
    worksheet.mergeCells("H15:I15");
    worksheet.getCell("H15").value =
      "Did the agent properly identify self and Company? (No Misrepresentation?)";
    worksheet.mergeCells("H16:I16");
    worksheet.getCell("H16").value = "TOTAL";
    applyBorderWithInner(worksheet, 13, 15, 8, 12, thickBorder, thinBorder);
    applyBorder(worksheet, 16, 16, 8, 10, thickBorder);

    worksheet.getCell("H18").value = "PROBING SKILLS";
    applyBorder(worksheet, 18, 18, 8, 8, thickBorder);

    worksheet.mergeCells("J18:K18");
    worksheet.getCell("J18").value = "DEFECT";
    centerCells(worksheet, 18, 18, 10, 11);
    applyBorder(worksheet, 18, 18, 10, 11, thickBorder);

    worksheet.getCell("J19").value = "Y/N";
    worksheet.getCell("K19").value = "SCORE";
    worksheet.getCell("L19").value = "Tagging";
    centerCells(worksheet, 19, 19, 10, 12);
    applyBorder(worksheet, 19, 19, 10, 12, thickBorder);

    worksheet.mergeCells("H20:I20");
    worksheet.getCell("H20").value =
      "Did the agent probe for BTC, ETA/EDA and other contact numbers to reach CH?";
    worksheet.mergeCells("H21:I21");
    worksheet.getCell("H21").value =
      "Did the agent  ask for right party contact who can receive the message?";
    worksheet.mergeCells("H22:I22");
    worksheet.getCell("H22").value =
      "Did the agent  use the history of the account to follow up previous messages left?";
    worksheet.mergeCells("H23:I23");
    worksheet.getCell("H23").value =
      "Did the agent attempt to contact client thru all the possible contact # based on the history/system?";
    worksheet.mergeCells("H24:I24");
    worksheet.getCell("H24").value =
      "Did the agent ask info questions to obtain lead/s to the whereabouts of client/s?";
    worksheet.mergeCells("H25:I25");
    worksheet.getCell("H25").value = "TOTAL";
    applyBorderWithInner(worksheet, 20, 24, 8, 12, thickBorder, thinBorder);
    applyBorder(worksheet, 25, 25, 8, 10, thickBorder);
    applyBorder(worksheet, 18, 18, 1, 1, thickBorder);
    applyBorder(worksheet, 18, 18, 3, 4, thickBorder);
    applyBorder(worksheet, 19, 19, 3, 5, thickBorder);
    applyBorderWithInner(worksheet, 20, 24, 1, 5, thickBorder, thinBorder);
    applyBorder(worksheet, 25, 25, 1, 3, thickBorder);

    worksheet.getCell("H27").value = "SOFT SKILLS";
    applyBorder(worksheet, 27, 27, 8, 8, thickBorder);

    worksheet.mergeCells("J27:K27");
    worksheet.getCell("J27").value = "DEFECT";
    centerCells(worksheet, 27, 27, 10, 11);
    applyBorder(worksheet, 27, 27, 10, 11, thickBorder);

    worksheet.getCell("J28").value = "Y/N";
    worksheet.getCell("K28").value = "SCORE";
    worksheet.getCell("L28").value = "Tagging";
    centerCells(worksheet, 28, 28, 10, 12);
    applyBorder(worksheet, 28, 28, 10, 12, thickBorder);

    worksheet.mergeCells("H29:I29");
    worksheet.getCell("H29").value =
      "Did the agent endorse the account for SKIPS and FV?		";
    worksheet.mergeCells("H30:I30");
    worksheet.getCell("H30").value =
      "Did the agent have a good control of the conversation?	";
    worksheet.mergeCells("H31:I31");
    worksheet.getCell("H31").value =
      "Is the agent's tone of voice professional, not overly aggressive, non-confrontational, not sarcastic or condescending?";
    applyBorderWithInner(worksheet, 29, 33, 8, 12, thickBorder, thinBorder);
    applyBorder(worksheet, 34, 34, 8, 10, thickBorder);
    worksheet.mergeCells("H32:I32");
    worksheet.getCell("H32").value =
      "Did the agent record accurate details of the conversation in the system?	";
    worksheet.mergeCells("H33:I33");
    worksheet.getCell("H33").value =
      "Did the agent comply with EWBC Collection Agency Code of Conduct?	";
    worksheet.mergeCells("H34:I34");
    worksheet.getCell("H34").value = "TOTAL";

    worksheet.getCell("H36").value = "WRAP UP/CLOSING THE CALL";
    applyBorder(worksheet, 36, 36, 8, 8, thickBorder);

    worksheet.mergeCells("J36:K36");
    worksheet.getCell("J36").value = "DEFECT";
    centerCells(worksheet, 36, 36, 10, 11);
    applyBorder(worksheet, 36, 36, 10, 11, thickBorder);

    worksheet.getCell("J37").value = "Y/N";
    worksheet.getCell("K37").value = "SCORE";
    worksheet.getCell("L37").value = "Tagging";
    centerCells(worksheet, 37, 37, 10, 12);
    applyBorder(worksheet, 37, 37, 10, 12, thickBorder);

    worksheet.mergeCells("H38:I38");
    worksheet.getCell("H38").value =
      "Did the agent leave a message for a return call?	";
    worksheet.mergeCells("H39:I39");
    worksheet.getCell("H39").value =
      "Did the agent ask the 3rd party to read back the number for return call?	";
    worksheet.mergeCells("H40:I40");

    worksheet.getCell("H40").value = "TOTAL";
    applyBorderWithInner(worksheet, 38, 39, 8, 12, thickBorder, thinBorder);
    applyBorder(worksheet, 40, 40, 8, 10, thickBorder);

    worksheet.mergeCells("J42:K42");
    worksheet.getCell("J42").value = "COUNT OF DEFECT";
    applyBorder(worksheet, 42, 42, 10, 11, thickBorder);
    worksheet.getCell("J43").value = "W/ CONTACT";
    worksheet.getCell("K43").value = "W/O CONTACT";

    worksheet.getCell("H43").value = "ITEM/S";

    worksheet.getCell("I43").value = "RATE";
    worksheet.mergeCells("I44:I49");
    worksheet.getCell("J43").value = "W/ CONTACT";
    worksheet.getCell("K43").value = "W/O CONTACT";
    applyBorder(worksheet, 43, 49, 8, 11, thickBorder);

    worksheet.getCell("H44").value = "OPENING SKILLS";
    worksheet.getCell("H45").value = "NEGOTIATION SKILLS/PROBING SKILLS";
    worksheet.getCell("H46").value = "PRODUCT KNOWLEDGE/PROBLEM SOLVING SKILLS";
    worksheet.getCell("H47").value = "SOFT SKILLS";
    worksheet.getCell("H48").value = "WRAP UP";
    worksheet.getCell("H49").value = "TOTAL # OF DEFECT/S AND FINAL SCORE:";

    worksheet.getCell("H50").value = "FINAL RATING";
    worksheet.getCell("I50").value = "";
    applyBorder(worksheet, 50, 50, 8, 9, thickBorder);

    worksheet.getCell("H52").value = "EQUIVALENT DEFECT RATING";
    worksheet.getCell("H53").value = "CRITICAL = 25";
    worksheet.getCell("H54").value = "IMPORTANT = 15";
    worksheet.getCell("H55").value = "ESSENTIAL = 10";

    worksheet.getCell("I52").value = "FINAL SCORE/RATING";
    worksheet.getCell("I53").value = "100 Above - EXCELLENT";
    worksheet.getCell("I54").value = "90-99 - SUPERIOR";
    worksheet.getCell("I55").value = "89-80 - ACCEPTABLE";
    worksheet.getCell("I56").value = "79 Below - UNACCEPTABLE";
    applyBorder(worksheet, 52, 56, 8, 8, thickBorder);
    applyBorder(worksheet, 52, 56, 9, 9, thickBorder);
    applyFill(worksheet, 52, 52, 8, 9, blackFill);
    setFontColor(worksheet, 52, 52, 8, 9, whiteFont, true);

    worksheet.mergeCells("A58:E58");
    worksheet.getCell("A58").value = "EVALUATOR'S REMARK/S";

    worksheet.getCell("A58").alignment = {
      horizontal: "center",
    };
    worksheet.mergeCells("A59:E62");
    worksheet.getCell("A59").value = evaluatorRemarks;
    worksheet.getCell("A59").alignment = {
      horizontal: "center",
      vertical: "top",
      wrapText: true,
    };

    worksheet.mergeCells("A63:E64");
    applyBorder(worksheet, 58, 64, 1, 5, thinBorder);

    worksheet.mergeCells("H58:L58");
    worksheet.getCell("H58").value = "AGENT'S REMARKS";

    worksheet.getCell("H58").alignment = {
      horizontal: "center",
    };
    worksheet.mergeCells("H59:L62");
    worksheet.getCell("H59").value = agentRemarks;
    worksheet.getCell("H59").alignment = {
      horizontal: "center",
      vertical: "top",
      wrapText: true,
    };
    worksheet.mergeCells("A65:E65");

    worksheet.getCell("A65").value =
      selectedEvaluator?.name ?? "No evulator selected";
    worksheet.getCell("A65").alignment = {
      horizontal: "center",
    };
    worksheet.mergeCells("A66:E66");
    worksheet.getCell("A66").value = "Team Head's signature over printed name";

    worksheet.getCell("A66").alignment = {
      horizontal: "center",
    };

    applyBorder(worksheet, 65, 66, 1, 5, thinBorder);

    worksheet.mergeCells("H63:L64");
    worksheet.mergeCells("H65:L65");
    worksheet.getCell("H65").value = selectedAgent?.name ?? "No agent selected";
    worksheet.getCell("H65").alignment = {
      horizontal: "center",
    };
    worksheet.mergeCells("H66:L66");
    worksheet.getCell("H66").value = "Collector's Signature over printed name";
    worksheet.getCell("H66").alignment = {
      horizontal: "center",
    };
    applyBorder(worksheet, 65, 66, 8, 12, thinBorder);

    worksheet.getCell("A68").value = `VALIDATED (Y/N): ${
      isValidated ? "YES" : "NO"
    }`;
    worksheet.getCell("A70").value = "AC'S COMMENTS:";
    worksheet.mergeCells("A71:K71");
    worksheet.mergeCells("A72:K72");
    worksheet.mergeCells("A73:K73");
    worksheet.mergeCells("A74:K74");
    worksheet.getCell("A71").value = acComments;
    worksheet.getCell("A71").alignment = {
      horizontal: "left",
      vertical: "top",
      wrapText: true,
    };
    worksheet.mergeCells("A75:E75");

    applyBorder(worksheet, 71, 74, 1, 11, thinBorder);
    applyBorder(worksheet, 75, 75, 1, 5, thinBorder);
    applyFill(worksheet, 71, 74, 1, 11, amberFill);
    applyFill(worksheet, 75, 75, 1, 5, amberFill);

    applyBorder(worksheet, 58, 64, 8, 12, thinBorder);

    applyFill(worksheet, 78, 78, 9, 9, lightGreenFill);
    worksheet.getCell("H78").value = "Noted by:";
    worksheet.getCell("I78").value = acknowledgedBy
      ? acknowledgedBy
      : "No AC/RO assigned";

    worksheet.mergeCells("H79:L79");
    worksheet.getCell("H79").value =
      "Agency Coordinator's Signature over Printed Name";
    worksheet.getCell("H78").alignment = {
      horizontal: "right",
    };
    worksheet.getCell("H79").alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    const withRowMap = [
      [13, 14, 15],
      [20, 21, 22, 23, 24],
      [29, 30, 31],
      [36, 37, 38, 40, 41, 42, 43],
      [48, 49, 50, 51],
    ];

    const withoutRowMap = [
      [13, 14, 15],
      [20, 21, 22, 23, 24],
      [29, 30, 31, 32, 33],
      [38, 39],
    ];

    const setResponses = (
      rowsBySection: number[][],
      totalsBySection: number[],
      sections: EvaluationSectionConfig[],
      responses: boolean[][],
      yCol: number,
      scoreCol: number,
      tagCol: number
    ) => {
      rowsBySection.forEach((rows, sIdx) => {
        let yesCount = 0;
        let noCount = 0;

        rows.forEach((row, qIdx) => {
          const section = sections[sIdx];
          const question = section?.questions?.[qIdx];
          if (!question) return;
          const isYes = responses?.[sIdx]?.[qIdx] ?? true;
          const score = isYes ? 0 : question.defaultScore;
          if (isYes) yesCount += 1;
          else noCount += 1;
          worksheet.getCell(row, yCol).value = isYes ? "Y" : "N";
          worksheet.getCell(row, scoreCol).value = score;
          worksheet.getCell(row, tagCol).value = question.tag;
          [yCol, scoreCol, tagCol].forEach((col) => {
            const cell = worksheet.getCell(row, col);
            cell.alignment = {
              ...(cell.alignment ?? {}),
              horizontal: col === tagCol ? "left" : "center",
              vertical: "middle",
              wrapText: true,
            };
          });
        });

        const totalRow = totalsBySection[sIdx];
        if (totalRow) {
          const totalCell = worksheet.getCell(totalRow, yCol);
          totalCell.value = noCount;
          totalCell.alignment = {
            ...(totalCell.alignment ?? {}),
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
        }
      });
    };

    const withTotalRows = [16, 25, 32, 44, 52];
    const withoutTotalRows = [16, 25, 34, 40];

    setResponses(
      withRowMap,
      withTotalRows,
      withContactSections,
      withContactResponses,
      3,
      4,
      5
    );
    setResponses(
      withoutRowMap,
      withoutTotalRows,
      withoutContactSections,
      withoutContactResponses,
      10,
      11,
      12
    );

    const rateValue = Number.isFinite(finalScore) ? finalScore : "";
    const rateCell = worksheet.getCell("I44");
    rateCell.value = rateValue;
    rateCell.alignment = {
      ...(rateCell.alignment ?? {}),
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    const finalRatingLabel = ratingFromScore(finalScore);
    const finalRatingCell = worksheet.getCell("I50");
    finalRatingCell.value = finalRatingLabel;
    finalRatingCell.alignment = {
      ...(finalRatingCell.alignment ?? {}),
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    const summaryRows = [44, 45, 46, 47, 48, 49];
    summaryRows.forEach((row, idx) => {
      const withVal = withContactCounts[idx] ?? 0;
      const withoutVal = withoutContactCounts[idx] ?? 0;

      worksheet.getCell(row, 10).value = withVal; // J column (W/ contact)
      const withoutCell = worksheet.getCell(row, 11); // K column (W/O contact)
      withoutCell.value = withoutVal;

      [worksheet.getCell(row, 10), withoutCell].forEach((cell) => {
        cell.alignment = {
          ...(cell.alignment ?? {}),
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
      });
    });

    const withoutProdRow = 46;
    const withoutProdCell = worksheet.getCell(withoutProdRow, 11); // K46
    withoutProdCell.value = "";
    withoutProdCell.fill = grayFill;
    withoutProdCell.alignment = {
      ...(withoutProdCell.alignment ?? {}),
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    const calibriAddresses = new Set(["A1", "I1"]);

    worksheet.eachRow({ includeEmpty: true }, (row: ExcelJS.Row) => {
      row.eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell) => {
        const existingFont = cell.font ?? {};
        const baseSize = existingFont.size ?? 15;
        const fontName = calibriAddresses.has(cell.address)
          ? "Calibri"
          : "Arial";

        cell.font = { ...existingFont, name: fontName, size: baseSize };
      });
    });

    worksheet.getCell("A1").font = {
      ...(worksheet.getCell("A1").font ?? {}),
      size: 30,
    };
    worksheet.getCell("I1").font = {
      ...(worksheet.getCell("I1").font ?? {}),
      size: 30,
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlfortangina tlaga namang itong tabaggggggamats-officedocument.spreadsheetml.sheet",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `eastwest-score-sheet-${Date.now()}.xlsx`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const resetForm = () => {
    setCardholder("");
    setAccountNumber("");
    setRateInput("");
    setIsValidated(true);
    setSelectedAgent(null);
    setSelectedEvaluator(null);
    setAcknowledgedBy("");
    setEvaluatorRemarks("");
    setAgentRemarks("");
    setAcComments("");
    setIsOpenAgent(false);
    setIsOpenTL(false);
    setWithContactResponses(createInitialWithContactResponses());
    setWithoutContactResponses(createInitialWithoutContactResponses());
  };

  const handleExport = async () => {
    if (!selectedAgent || !selectedEvaluator || !acknowledgedBy.trim()) {
      alert(
        "Please fill Agent's Name, Evaluator's Name, and Acknowledged/Validated By before saving."
      );
      return;
    }
    if (!accountNumber.trim()) {
      alert("Please enter the account number before saving.");
      return;
    }
    if (!userLogged?._id) {
      alert("Missing user information. Please sign in again.");
      return;
    }
    const departmentId = userLogged?.departments?.[0];
    if (!departmentId) {
      alert("Missing department assignment. Please contact an administrator.");
      return;
    }
    if (isExporting || isSaving) return;

    setIsExporting(true);
    const evaluationDateIso = new Date().toISOString();
    const monthLabel = new Date().toLocaleString("en-US", { month: "long" });
    const safeFinalScore = Math.max(finalScore, 0);
    const scoreDetailsPayload = buildScoreDetailsPayload(evaluationDateIso);

    try {
      await createScoreCardData({
        variables: {
          input: {
            month: monthLabel,
            department: departmentId,
            agentName: selectedAgent._id,
            dateAndTimeOfCall: evaluationDateIso,
            number: accountNumber.trim(),
            assignedQA: userLogged._id,
            typeOfScoreCard: "Eastwest Score Card",
            scoreDetails: scoreDetailsPayload,
            totalScore: safeFinalScore,
          },
        },
      });
      try {
        setIsExporting(true);
        await exportToExcel();
      } catch (error) {
        console.log(error);
      } finally {
        setIsExporting(false);
      }

      await exportToExcel();
      resetForm();
    } catch (error) {
      console.error("Failed to save Eastwest score card", error);
      alert("Failed to save or export. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-5 flex flex-col  text-black w-full h-full max-h-[90vh]">
      <motion.div
        className="border flex rounded-md overflow-hidden flex-col h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className=" font-black relative items-center flex justify-center border-b h-[8.4%] uppercase bg-gray-400 text-2xl text-center py-3 w-full text-black">
          <div>tpsp phone monitoring sheet</div>
          <div className="flex items-center absolute right-5 h-full gap-1 justify-end text-xs">
            <button
              type="button"
              disabled={isExporting || isSaving}
              onClick={() => void handleExport()}
              className="px-4 py-2 cursor-pointer border-green-900 transition-all border-2 font-black uppercase rounded-sm shadow-md text-white bg-green-600 hover:bg-green-700 disabled:border-gray-500 disabled:bg-gray-400"
            >
              {isExporting || isSaving ? "Saving..." : "save"}
            </button>
          </div>
        </div>

        <div className="bg-gray-300 h-[91.6%]  p-5 flex flex-col ">
          <div className="flex justify-between">
            <div className="grid grid-cols-2 xl:grid-cols-3 w-full items-start gap-2">
              <div className="border rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-cols-2 border-b">
                  <div className="truncate bg-gray-400 rounded-tl px-5 border-r py-1" title="EVALUATION DATE" >
                    EVALUATION DATE
                  </div>
                  <div
                    className="items-center truncate flex px-2 rounded-tr-md bg-gray-100"
                    title={todayLabel}
                  >
                    {todayLabel}
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b">
                  <div className="bg-gray-400  px-5 border-r py-1">
                    AGENT'S NAME
                  </div>
                  <div
                    onClick={() => setIsOpenAgent(!isOpenAgent)}
                    className="flex relative px-2 justify-between cursor-pointer items-center bg-gray-100"
                  >
                    <div className="flex items-center">
                      {selectedAgent?.name || "Select Agent"}
                    </div>
                    <div>
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
                    </div>
                    <AnimatePresence>
                      {isOpenAgent && (
                        <motion.div
                          className="absolute top-8 bg-white shadow-lg border rounded-md z-50 max-h-60 overflow-y-auto"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          {agentLoading ? (
                            <div className="p-3 text-center text-gray-500">
                              Loading...
                            </div>
                          ) : !agentData?.getBucketUser?.length ? (
                            <div className="p-3 text-center text-gray-500">
                              No agent available
                            </div>
                          ) : (
                            agentData.getBucketUser.map((agent) => (
                              <button
                                key={agent._id}
                                className="w-full cursor-pointer first-letter:uppercase even:bg-gray-100 border-b border-gray-300 text-left px-3 py-2 hover:bg-gray-200"
                                onClick={() => {
                                  setSelectedAgent(agent);
                                  setIsOpenAgent(false);
                                }}
                              >
                                {agent.name}
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b ">
                  <div
                    className="bg-gray-400 truncate px-5 border-r py-1"
                    title="EVALUATOR'S NAME (TEAM HEAD)"
                  >
                    EVALUATOR'S NAME (TEAM HEAD)
                  </div>

                  <div
                    onClick={() => setIsOpenTL(!isOpenTL)}
                    className="flex  relative px-2 justify-between cursor-pointer bg-gray-100 items-center"
                  >
                    <div className="flex items-center ">
                      {selectedEvaluator?.name || "Select TL"}
                    </div>
                    <div>
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
                    </div>
                    <AnimatePresence>
                      {isOpenTL && (
                        <motion.div
                          className="absolute top-8 bg-white shadow-lg border rounded-md z-50 max-h-60 overflow-y-auto"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          {tlLoading ? (
                            <div className="p-3 text-center text-gray-500">
                              Loading...
                            </div>
                          ) : !tlData?.getBucketTL?.length ? (
                            <div className="p-3 text-center text-gray-500">
                              No TL available
                            </div>
                          ) : (
                            tlData.getBucketTL.map((tl) => (
                              <button
                                key={tl._id}
                                className="w-full cursor-pointer first-letter:uppercase even:bg-gray-100 border-b border-gray-300 text-left px-3 py-2 hover:bg-gray-200"
                                onClick={() => {
                                  setSelectedEvaluator(tl);
                                  setIsOpenTL(false);
                                }}
                              >
                                {tl.name}
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid grid-cols-2  ">
                  <div
                    title="  ACKNOWLEDGED/VALIDATED BY: (AC/RO)"
                    className="bg-gray-400 truncate rounded-bl-md px-5 border-r py-1"
                  >
                    ACKNOWLEDGED/VALIDATED BY: (AC/RO)
                  </div>
                  <input
                    className="px-3 outline-none font-normal rounded-br-md bg-gray-100"
                    type="text"
                    value={acknowledgedBy}
                    onChange={(event) => setAcknowledgedBy(event.target.value)}
                  />
                </div>
              </div>

              <div className="border xl:col-start-3 col-start-2 overflow-hidden rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-cols-2 border-b">
                  <div className="truncate bg-gray-400 rounded-tl px-5 border-r py-1" title="CARDHOLDER" >
                    CARDHOLDER:
                  </div>
                  <input
                    className="pl-2 bg-white outline-none"
                    type="text"
                    value={cardholder}
                    onChange={(event) => setCardholder(event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 border-b">
                  <div className="truncate bg-gray-400  px-5 border-r py-1" title="ACCOUNT NUMBER" >
                    ACCOUNT NUMBER:
                  </div>
                  <input
                    className="pl-2 bg-white outline-none"
                    type="text"
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 ">
                  <div className="bg-gray-400 px-5 border-r py-1">SCORE:</div>
                  <div className="grid bg-white grid-cols-2">
                    <div className="items-center flex justify-center outline-none border-r">
                      {finalScore}
                    </div>
                    <input
                      className="ml-2 outline-none w-full"
                      placeholder="RATE"
                      type="text"
                      value={rateInput}
                      onChange={(event) => setRateInput(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col xl:grid grid-cols-2 mt-2 pb-5 overflow-auto gap-2 h-full">
            <div className="flex gap-2 h-auto flex-col">
              {withContactSections.map((section, index) => (
                <EvaluationSection
                  key={`with-${section.title}-${index}`}
                  {...section}
                  responses={withContactResponses[index]}
                  onToggle={(questionIdx) =>
                    toggleResponse("with", index, questionIdx)
                  }
                />
              ))}

              <div className="flex flex-col border rounded-md overflow-hidden">
                <div className="bg-gray-400 font-semibold px-3 border-b py-1">
                  EVALUATOR'S REMARK/S
                </div>
                <div className="bg-white p-1">
                  <textarea
                    className="w-full min-h-24 outline-none p-2"
                    value={evaluatorRemarks}
                    onChange={(event) =>
                      setEvaluatorRemarks(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 rounded-md overflow-hidden">
                <div className="font-semibold py-1">VALIDATED (Y/N):</div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setIsValidated(true)}
                    className={`border-2 font-black uppercase px-3 flex items-center rounded-sm cursor-pointer text-shadow-2xs justify-center transition-colors ${
                      !isValidated
                        ? "bg-green-600 border-green-900 text-white"
                        : "bg-gray-400 border-2 border-gray-500 text-gray-200 font-black uppercase px-3 flex items-center rounded-sm cursor-pointer text-shadow-2xs justify-center"
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsValidated(false)}
                    className={`border-2 font-black uppercase px-3 flex items-center rounded-sm cursor-pointer text-shadow-2xs justify-center transition-colors ${
                      isValidated
                        ? "bg-red-600 border-red-900 text-white"
                        : "bg-gray-400 border-2 border-gray-500 text-gray-200 font-black uppercase px-3 flex items-center rounded-sm cursor-pointer text-shadow-2xs justify-center"
                    }`}
                  >
                    NO
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 h-auto flex-col">
              {withoutContactSections.map((section, index) => (
                <EvaluationSection
                  key={`without-${
                    section.headingLabel ?? section.title
                  }-${index}`}
                  {...section}
                  responses={withoutContactResponses[index]}
                  onToggle={(questionIdx) =>
                    toggleResponse("without", index, questionIdx)
                  }
                />
              ))}

              <DefectSummaryTable
                withContactCounts={withContactCounts}
                withoutContactCounts={withoutContactCounts}
                totalNoWithContact={withTotals.noCount}
                totalNoWithoutContact={withoutTotals.noCount}
                finalScore={finalScore}
              />

              <EquivalentRatingBlock />
              <div className="flex flex-col border rounded-md overflow-hidden">
                <div className="bg-gray-400 font-semibold px-3 border-b py-1">
                  AGENT'S REMARK/S
                </div>
                <div className="bg-white p-1">
                  <textarea
                    className="w-full min-h-24 outline-none p-2"
                    value={agentRemarks}
                    onChange={(event) => setAgentRemarks(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col border rounded-md overflow-hidden">
                <div className="bg-gray-400 font-semibold px-3 border-b py-1">
                  AC'S COMMENTS:
                </div>
                <div
                  className={` ${
                    isValidated ? "bg-white" : "bg-gray-200"
                  }  p-1 `}
                >
                  <textarea
                    className={` w-full min-h-24 outline-none p-2 `}
                    disabled={!isValidated}
                    value={acComments}
                    onChange={(event) => setAcComments(event.target.value)}
                  />
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
