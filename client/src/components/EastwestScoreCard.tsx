import { Fragment, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

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
        text: "Did the agent ask for payment confirmation?",
        defaultScore: 15,
        tag: "IMPORTANT",
      },
      {
        text: "Did the agent reminded client of the next due date or payment schedule?",
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
      Total NO
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
  const [selectedEvaluator, setSelectedEvaluator] = useState<TL | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [acknowledgedBy, setAcknowledgedBy] = useState("");
  const [withContactResponses, setWithContactResponses] = useState<boolean[][]>(
    () =>
      withContactSections.map((section) => section.questions.map(() => true))
  );

  const [withoutContactResponses, setWithoutContactResponses] = useState<
    boolean[][]
  >(() =>
    withoutContactSections.map((section) => section.questions.map(() => true))
  );

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

  const buildExportRows = () => {
    const rows: Array<{
      section: string;
      question: string;
      response: string | number;
      score: string | number;
      tag: string | number;
    }> = [];

    withContactSections.forEach((section, sIdx) => {
      rows.push({
        section: section.headingLabel ?? "",
        question: section.title,
        response: "",
        score: "",
        tag: "",
      });

      section.questions.forEach((q, qIdx) => {
        const isYes = withContactResponses[sIdx]?.[qIdx] ?? true;
        rows.push({
          section: "",
          question: q.text,
          response: isYes ? "YES" : "NO",
          score: isYes ? 0 : q.defaultScore,
          tag: q.tag,
        });
      });

      rows.push({
        section: "",
        question: "Total NO",
        response: withTotals.perCategory[sIdx] ?? 0,
        score: "",
        tag: "",
      });

      rows.push({
        section: "",
        question: "",
        response: "",
        score: "",
        tag: "",
      });
    });

    rows.push({
      section: "B. WITHOUT CONTACT",
      question: "",
      response: "",
      score: "",
      tag: "",
    });

    withoutContactSections.forEach((section, sIdx) => {
      rows.push({
        section: "",
        question: section.title,
        response: "",
        score: "",
        tag: "",
      });

      section.questions.forEach((q, qIdx) => {
        const isYes = withoutContactResponses[sIdx]?.[qIdx] ?? true;
        rows.push({
          section: "",
          question: q.text,
          response: isYes ? "YES" : "NO",
          score: isYes ? 0 : q.defaultScore,
          tag: q.tag,
        });
      });

      rows.push({
        section: "",
        question: "Total NO",
        response: withoutTotals.perCategory[sIdx] ?? 0,
        score: "",
        tag: "",
      });

      rows.push({
        section: "",
        question: "",
        response: "",
        score: "",
        tag: "",
      });
    });

    rows.push({
      section: "",
      question: "Overall NO (W/ CONTACT)",
      response: withTotals.noCount,
      score: "",
      tag: "",
    });
    rows.push({
      section: "",
      question: "Overall NO (W/O CONTACT)",
      response: withoutTotals.noCount,
      score: "",
      tag: "",
    });
    rows.push({
      section: "",
      question: "Final Score",
      response: finalScore,
      score: "",
      tag: ratingFromScore(finalScore),
    });

    return rows;
  };

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
      properties: { defaultRowHeight: 18 },
      views: [{ showGridLines: true }],
    });

    worksheet.columns = [
      { header: "Section", key: "section", width: 22 },
      { header: "Question", key: "question", width: 75 },
      { header: "Response", key: "response", width: 12 },
      { header: "Score", key: "score", width: 10 },
      { header: "Tag", key: "tag", width: 14 },
    ];

    worksheet.mergeCells("A1:E1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "TPSP Phone Monitoring Sheet";
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: "center" };

    worksheet.addRow({});
    const headerRow = worksheet.addRow({
      section: "Section",
      question: "Question",
      response: "Response",
      score: "Score",
      tag: "Tag",
    });
    headerRow.font = { bold: true };

    const exportRows = buildExportRows();
    exportRows.forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `eastwest-score-card-${Date.now()}.xlsx`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
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

      await exportToExcel();
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
              className="px-4 py-2 cursor-pointer border-green-900 transition-all border-2 font-black uppercase rounded-sm shadow-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              {isExporting || isSaving ? "processing..." : "save"}
            </button>
          </div>
        </div>

        <div className="bg-gray-300 h-[91.6%]  p-5 flex flex-col ">
          <div className="flex justify-between">
            <div className="grid grid-cols-3 w-full items-start gap-2">
              <div className="border rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-cols-2 border-b">
                  <div className="bg-gray-400 rounded-tl px-5 border-r py-1">
                    EVALUATION DATE
                  </div>
                  <div className="items-center flex px-2 rounded-tr-md bg-gray-100">
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
                  <div className="bg-gray-400 px-5 border-r py-1">
                    EVALUATOR'S NAME (TEAM HEAD)
                  </div>

                  <div
                    onClick={() => setIsOpenTL(!isOpenTL)}
                    className="flex  relative justify-between cursor-pointer bg-gray-100 items-center"
                  >
                    <div className="flex mx-2 items-center ">
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
                  <div className="bg-gray-400 rounded-bl-md px-5 border-r py-1">
                    ACKNOWLEDGED/VALIDATED BY: (AC/RO)
                  </div>
                  <input
                    className=" outline-none rounded-br-md bg-gray-100"
                    type="text"
                    value={acknowledgedBy}
                    onChange={(event) => setAcknowledgedBy(event.target.value)}
                  />
                </div>
              </div>

              <div className="border col-start-3 overflow-hidden rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-cols-2 border-b">
                  <div className="bg-gray-400 rounded-tl px-5 border-r py-1">
                    CARDHOLDER:
                  </div>
                  <input
                    className="ml-2 outline-none"
                    type="text"
                    value={cardholder}
                    onChange={(event) => setCardholder(event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 border-b">
                  <div className="bg-gray-400  px-5 border-r py-1">
                    ACCOUNT NUMBER:
                  </div>
                  <input
                    className="ml-2 outline-none"
                    type="text"
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 ">
                  <div className="bg-gray-400 px-5 border-r py-1">SCORE:</div>
                  <div className="grid grid-cols-2">
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
          <div className="grid grid-cols-2 mt-2 pb-5 overflow-auto gap-2 h-full">
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
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EastwestScoreCard;
