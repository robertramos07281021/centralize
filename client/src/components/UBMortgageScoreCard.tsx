import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode, InputHTMLAttributes, ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { setSuccess } from "../redux/slices/authSlice";
import type ExcelJS from "exceljs";

type TL = {
  _id: string;
  name: string;
};

type Agent = {
  _id: string;
  name: string;
};

const CREATE_MORTGAGE_SCORECARD = gql`
  mutation CreateMortgageScoreCard($input: ScoreCardDataInput!) {
    createScoreCardData(input: $input) {
      _id
      totalScore
      typeOfScoreCard
    }
  }
`;

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

type ColumnInputGridProps = {
  inputClassName?: string;
  defectValue?: number;
  values?: number[];
  onToggleValue?: (
    callIndex: number,
    nextValue: number,
    prevValue: number
  ) => void;
  onCallValueChange?: (
    callIndex: number,
    nextValue: number,
    prevValue: number
  ) => void;
};

const callNumbers = Array.from({ length: 10 }, (_, idx) => `CALL ${idx + 1}`);

const formatDurationValue = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const handleDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
  const formatted = formatDurationValue(e.target.value);
  if (formatted !== e.target.value) {
    e.target.value = formatted;
  }
};

const ColumnInputGrid = ({
  inputClassName = "",
  defectValue,
  values,
  onToggleValue,
  onCallValueChange,
}: ColumnInputGridProps) => {
  const toggle = (index: number) => {
    const defect = defectValue ?? 0;
    const currentValue = values?.[index] ?? 0;
    const prevValue = currentValue;
    const nextValue = currentValue === 0 ? defect : 0;
    onToggleValue?.(index, nextValue, prevValue);
    onCallValueChange?.(index, nextValue, prevValue);
  };

  return (
    <div
      className={`grid h-full w-full items-center border-black ${
        defectValue !== undefined ? "grid-cols-11" : "grid-cols-10"
      }`}
    >
      {defectValue !== undefined && (
        <div className="border-r h-full border-black flex items-center justify-center px-1 py-1 bg-gray-100 font-normal">
          {defectValue}
        </div>
      )}
      {callNumbers.map((_, idx) => {
        const currentValue = values?.[idx] ?? 0;
        const isYes = currentValue === 0;
        const value = isYes ? 0 : defectValue ?? 0;
        return (
          <div
            key={idx}
            className="border-r h-full border-black last:border-r-0 flex flex-col items-center bg-gray-100 justify-center px-1 py-1 gap-1"
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className={`w-full py-1 border-2 rounded-sm shadow-md font-black uppercase text-white cursor-pointer transition-colors ${
                isYes
                  ? "bg-green-600 hover:bg-green-700 border-green-900"
                  : "bg-red-600 hover:bg-red-700 border-red-900"
              } ${inputClassName}`}
            >
              {value}
            </button>
          </div>
        );
      })}
    </div>
  );
};

type DetailColumnConfig = {
  label: string;
  title?: string;
  labelClassName?: string;
  containerClassName?: string;
  values?: (string | number)[];
  valueProvider?: (callIndex: number) => string;
  onValueChange?: (callIndex: number, value: string) => void;
  inputType?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
};

const detailColumns: DetailColumnConfig[] = [
  {
    label: "Account Name:",
    labelClassName:
      "bg-gray-400 w-full text-center text-md truncate border-x rounded-t-md border-y px-1 py-1",
  },
  {
    label: "Loan No:",
    labelClassName:
      "bg-gray-400 w-full text-center text-md truncate border-x rounded-t-md border-y px-1 py-1",
  },
  {
    label: "Account Status:",
    labelClassName:
      "bg-gray-400 w-full text-center text-md truncate border-x rounded-t-md border-y px-1 py-1",
  },
  {
    label: "Date of call:",
    labelClassName:
      "bg-gray-400 w-full text-center text-md truncate border-x rounded-t-md border-y px-1 py-1",
    inputType: "date",
  },
  {
    label: "Call Duration:",
    title: "Call Duration",
    labelClassName:
      "bg-gray-400 text-md text-center truncate border-x rounded-t-md border-y px-1 py-1",
    containerClassName:
      "text-[13.3px] flex flex-col shadow-md rounded-sm font-black uppercase flex-[0.6] min-w-[70px]",
    inputProps: {
      type: "text",
      placeholder: "00:00",
      inputMode: "numeric",
      pattern: "^(?:[0-5]?\\d:[0-5]\\d)$",
      onChange: handleDurationChange,
    },
  },
  {
    label: "Score %",
    title: " Score",
    labelClassName:
      "bg-gray-400 text-md text-center truncate border-x rounded-t-md border-y px-1 py-1",
    containerClassName:
      "text-sm flex flex-col shadow-md rounded-sm font-black uppercase flex-[0.4] min-w-[60px]",
    values: [],
  },
];

type ColumnInputRowConfig = {
  text: string;
  title?: string;
  inputClassName?: string;
  textClassName?: string;
  containerClassName?: string;
  showAsterisk?: boolean;
  defectValue?: number;
  questionId?: string;
  questionValues?: number[];
  onQuestionToggle?: (
    questionId: string,
    callIndex: number,
    nextValue: number,
    prevValue: number
  ) => void;
  onCallValueChange?: (
    callIndex: number,
    nextValue: number,
    prevValue: number
  ) => void;
  renderContent?: () => ReactNode;
};

const openingRows: ColumnInputRowConfig[] = [
  {
    text: "Used appropriate greeting (Good Morning, Good Afternon, Good day) / Identified self (mention first and last name) and Agency (full Agency name)",
    title:
      "Used appropriate greeting / Identified self and Agency (full Agency name)",
    textClassName: "w-full pl-3 py-1 border-r",
    questionId: "opening-1",
    defectValue: 2,
  },
  {
    text: "Mentioned (OSP mentioned - authorized Service Provider of UB)",
    questionId: "opening-2",
    defectValue: 1,
  },
  {
    text: "Mentioned Line is Recorded",
    inputClassName: "whitespace-nowrap",
    questionId: "opening-3",
    defectValue: 5,
  },
  {
    text: "Mentioned Client name / Authorized Rep Full Name for outgoing calls to a registered number. For incoming calls, asked correct Positive Identifiers from unregistered number.",
    title:
      "Mentioned Client name / Authorized Rep Full Name for outgoing calls to a registered number.  For incoming calls, asked correct Positive Identifiers from unregistered number.",
    textClassName: "w-full pl-3 py-1 border-r",
    questionId: "opening-4",
    defectValue: 6,
  },
  {
    text: "Agent confirms talking to the client. Client should confirm (explicit YES) before proceeding to the call",
    title:
      "Agent confirms talking to the client. Client should confirm (explicit YES) before proceeding to the call",
    containerClassName:
      "h-full items-cen flex rounded-b-md shadow-md border-x border-b",
    textClassName: "w-full bg-gray-100 pl-3 rounded-bl-md py-1 border-r",
    questionId: "opening-5",
    defectValue: 6,
  },
];

const withContactRapportRows: ColumnInputRowConfig[] = [
  {
    text: "Explained the status of the account*",
    title: "\n                  Explained the status of the account*",
    questionId: "with-contact-1",
    defectValue: 1,
  },
  {
    text: "Asked if CH received demand/ notification letter*",
    questionId: "with-contact-2",
    defectValue: 1,
  },
  {
    text: "Showed empathy and compassion as appropriate.",
    inputClassName: "whitespace-nowrap",
    questionId: "with-contact-3",
    defectValue: 2,
  },
];

const withContactListeningRows: ColumnInputRowConfig[] = [
  {
    text: "Sought RFD (reason of delinquency or non-payment) in payment & RFBP (reason for broken promise)",
    title: "\n                Sought RFD in payment & RFBP*",
    textClassName: "w-full pl-3 py-1 border-r",
    questionId: "with-contact-4",
    defectValue: 1,
  },
];

const withContactNegotiationRows: ColumnInputRowConfig[] = [
  {
    text: "Explained consequences of non-payment, if applicable (explained conseq of legal and BAP listing/explained side of the Bank and the contract signed/explained that the bank is serious in collecting legal obligations/possible negative listing of name/future credit facility will be closed/additional collection agency expenses/involvement of lawyer will also be Client's expense)",
    textClassName: "w-full pl-3 py-1 border-r",
    questionId: "with-contact-5",
    defectValue: 1,
  },
  {
    text: "Asked for Client's capacity to pay, if applicable",
    questionId: "with-contact-6",
    defectValue: 1,
  },
  {
    text: "Followed hierarchy of negotiation, if applicable (Full payment, minimum amount due, total past due or last bucket amount)",
    textClassName: "w-full pl-3 py-1 border-r",
    questionId: "with-contact-7",
    defectValue: 1,
  },
];

const withContactSolutionRows: ColumnInputRowConfig[] = [
  {
    text: "Offered discount/ amnesty/ promo*",
    questionId: "with-contact-8",
    defectValue: 1,
  },
  {
    text: "Adviced CH to source out funds*",
    containerClassName: "h-full flex border-x rounded-b-md shadow-md border-b",
    questionId: "with-contact-9",
    defectValue: 1,
  },
];

const withoutContactRows: ColumnInputRowConfig[] = [
  {
    text: "Probed on BTC (best time to call), ETA (Expected time of arrival) and other contact numbers",
    title:
      "Probed on BTC (best time to call), ETA (Expected time of arrival) and other contact numbers",
    questionId: "without-contact-1",
    defectValue: 1,
  },
  {
    text: "Used time schedule and follow-up if applicable",
    questionId: "without-contact-2",
    defectValue: 1,
  },
  {
    text: "Asked for name of party, relation to client",
    inputClassName: "whitespace-nowrap",
    questionId: "without-contact-3",
    defectValue: 1,
  },
  {
    text: "Left URGENT message ang gave correct contact number",
    inputClassName: "whitespace-nowrap",
    containerClassName: "h-full rounded-b-md shadow-md flex border-x border-b",
    questionId: "without-contact-4",
    defectValue: 2,
  },
];

const withOrWithoutRows: ColumnInputRowConfig[] = [
  {
    text: "Used professional tone of voice",
    questionId: "with-or-without-1",
    defectValue: 2,
  },
  {
    text: "Did not use unacceptable words/phrases and maintained polite/civil language",
    title:
      "Did not use unacceptable words/phrases and maintained polite/civil language",
    textClassName: "w-full pl-3 py-1 border-r",
    questionId: "with-or-without-2",
    defectValue: 6,
  },
  {
    text: "Updated correct information and payment details on info sheet, if applicable",
    inputClassName: "whitespace-nowrap",
    questionId: "with-or-without-3",
    defectValue: 3,
  },
  {
    text: "Adherence to Policy(BSP, Code of Conduct, etc.)",
    inputClassName: "whitespace-nowrap",
    questionId: "with-or-without-4",
    defectValue: 6,
  },
  {
    text: "Intgerity Issues (Revealed and Collected debt from unauthorized Client)",
    inputClassName: "whitespace-nowrap",
    questionId: "with-or-without-5",
    defectValue: 6,
  },
  {
    text: "Exercised sound judgment in determining the appropriate course of action.",
    inputClassName: "whitespace-nowrap",
    containerClassName: "h-full rounded-b-md shadow-md flex border-x border-b",
    questionId: "with-or-without-6",
    defectValue: 6,
  },
];

const closingRows: ColumnInputRowConfig[] = [
  {
    text: "Summarized payment arrangement",
    showAsterisk: true,
    containerClassName:
      "h-full bg-gray-100 rounded-br-md flex border-x border-b ",
    textClassName: "w-full flex pl-3 py-1 border-r truncate",
    questionId: "closing-1",
    defectValue: 2,
  },
  {
    text: "Offered online payment channels",
    questionId: "closing-2",
    defectValue: 1,
  },
  {
    text: "Request return call for payment confirmation*",
    containerClassName: "h-full flex border-x border-b rounded-b-md  ",
    questionId: "closing-3",
    defectValue: 1,
  },
];

const commentCalls = Array.from({ length: 10 }, (_, idx) => idx + 1);

const ColumnInputRow = ({
  text,
  title,
  inputClassName,
  textClassName = "w-full bg-gray-100 pl-3 py-1 border-r rounded-bl-md truncate",
  containerClassName = "h-full  bg-gray-100 flex border-x border-b ",
  showAsterisk = false,
  defectValue,
  questionId,
  questionValues,
  onQuestionToggle,
  onCallValueChange,
  renderContent,
}: ColumnInputRowConfig) => (
  <div className={containerClassName}>
    <div className={textClassName} title={title ?? text}>
      {renderContent ? (
        renderContent()
      ) : (
        <>
          <span>{text}</span>
          {showAsterisk && (
            <span className="ml-1 font-black text-red-800">*</span>
          )}
        </>
      )}
    </div>
    {renderContent ? null : (
      <ColumnInputGrid
        inputClassName={inputClassName}
        defectValue={defectValue}
        values={questionValues}
        onToggleValue={
          questionId
            ? (callIndex, nextValue, prevValue) =>
                onQuestionToggle?.(questionId, callIndex, nextValue, prevValue)
            : undefined
        }
        onCallValueChange={questionId ? undefined : onCallValueChange}
      />
    )}
  </div>
);

const DetailColumn = ({
  label,
  title,
  labelClassName = "bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1",
  containerClassName = "text-sm flex flex-col shadow-md rounded-sm font-black uppercase flex-1 min-w-0",
  values,
  valueProvider,
  onValueChange,
  inputType,
  inputProps,
}: DetailColumnConfig) => (
  <div className={containerClassName}>
    <div className={labelClassName} title={title ?? label}>
      {label}
    </div>
    {callNumbers.map((_, idx) => (
      <div
        key={`${label}-${idx}`}
        className={`py-1 px-3 border-x bg-white border-b ${
          idx === callNumbers.length - 1 ? "rounded-b-md" : ""
        } ${values ? "text-center " : ""}`}
      >
        {values ? (
          values[idx] ?? ""
        ) : (
          <input
            type={inputProps?.type ?? inputType ?? "text"}
            className={`w-full outline-none ${inputProps?.className ?? ""}`}
            value={valueProvider?.(idx) ?? ""}
            {...inputProps}
            onChange={(e) => {
              inputProps?.onChange?.(e);
              onValueChange?.(idx, e.target.value);
            }}
          />
        )}
      </div>
    ))}
  </div>
);

const CallCommentSection = ({
  callNumber,
  comment,
  onCommentChange,
}: {
  callNumber: number;
  comment: { agent: string; evaluator: string; action: string };
  onCommentChange: (  
    key: "agent" | "evaluator" | "action",
    value: string
  ) => void;
}) => (
  <div className="flex w-full h-auto flex-col">
    <div className="grid uppercase grid-cols-4 border bg-gray-400 py-1 rounded-t-md gap-2">
      <div className="col-span-2 ml-2">CALL {callNumber} COMMENTS OF AGENT</div>
      <div>COMMENTS OF EVALUATOR</div>
      <div>Action Plan</div>
    </div>

    <div className="grid uppercase bg-gray-100 grid-cols-4 items-center border-x border-b rounded-b-md gap-2">
      <div className="col-span-2 ml-2 py-1 flex items-center border-r h-full">
        <input
          className="outline-none px-1 w-full"
          value={comment.agent}
          onChange={(e) => onCommentChange("agent", e.target.value)}
        />
      </div>
      <div className=" flex items-center border-r h-full">
        <input
          className="outline-none px-1 w-full"
          value={comment.evaluator}
          onChange={(e) => onCommentChange("evaluator", e.target.value)}
        />
      </div>
      <div className=" flex items-center h-full">
        <input
          className="outline-none px-1 w-full"
          value={comment.action}
          onChange={(e) => onCommentChange("action", e.target.value)}
        />
      </div>
    </div>
  </div>
);

const UBMortgageScoreCard = () => {
  const dispatch = useAppDispatch();
  const [isOpenAgent, setIsOpenAgent] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [fullScore, setFullScore] = useState<boolean>(false);
  const { data: tlData } = useQuery<{ getBucketTL: TL[] }>(GET_BUCKET_TL, {
    skip: !userLogged,
    fetchPolicy: "cache-and-network",
  });
  const { data: agentData, loading: agentLoading } = useQuery<{
    getBucketUser: Agent[];
  }>(GET_BUCKET_AGENTS, {
    skip: !userLogged,
    fetchPolicy: "cache-and-network",
  });

  console.log(tlData);
  console.log(agentData);
  const MORTGAGE_DEPARTMENT_ID = "123";

  const showNotifier = (message: string, isMessage = false) => {
    dispatch(
      setSuccess({
        success: true,
        message,
        isMessage,
      })
    );
  };

  const [createMortgageScoreCardData, { loading: saveLoading }] = useMutation(
    CREATE_MORTGAGE_SCORECARD,
    {
      onCompleted: () => {
        showNotifier("Score card saved.");
      },
      onError: (error) => {
        showNotifier(`INCORRECT: ${error.message}`, true);
      },
    }
  );
  const [callTotals, setCallTotals] = useState<number[]>(() =>
    Array.from({ length: callNumbers.length }, () => 0)
  );

  const [withContactStates, setWithContactStates] = useState<boolean[]>(() =>
    Array.from({ length: callNumbers.length }, () => true)
  );

  const makeZeroArray = () =>
    Array.from({ length: callNumbers.length }, () => 0);

  const questionDefs = [
    { id: "opening-1", defect: 2, row: 22 },
    { id: "opening-2", defect: 1, row: 23 },
    { id: "opening-3", defect: 5, row: 24 },
    { id: "opening-4", defect: 6, row: 25 },
    { id: "opening-5", defect: 6, row: 26 },
    { id: "with-contact-1", defect: 1, row: 32 },
    { id: "with-contact-2", defect: 1, row: 33 },
    { id: "with-contact-3", defect: 2, row: 34 },
    { id: "with-contact-4", defect: 1, row: 36 },
    { id: "with-contact-5", defect: 1, row: 38 },
    { id: "with-contact-6", defect: 1, row: 39 },
    { id: "with-contact-7", defect: 1, row: 40 },
    { id: "with-contact-8", defect: 1, row: 42 },
    { id: "with-contact-9", defect: 1, row: 43 },
    { id: "without-contact-1", defect: 1, row: 46 },
    { id: "without-contact-2", defect: 1, row: 47 },
    { id: "without-contact-3", defect: 1, row: 48 },
    { id: "without-contact-4", defect: 2, row: 49 },
    { id: "with-or-without-1", defect: 2, row: 54 },
    { id: "with-or-without-2", defect: 6, row: 55 },
    { id: "with-or-without-3", defect: 3, row: 56 },
    { id: "with-or-without-4", defect: 6, row: 57 },
    { id: "with-or-without-5", defect: 6, row: 58 },
    { id: "with-or-without-6", defect: 6, row: 59 },
    { id: "closing-1", defect: 2, row: 64 },
    { id: "closing-2", defect: 1, row: 65 },
    { id: "closing-3", defect: 1, row: 66 },
  ];

  const [questionResponses, setQuestionResponses] = useState<
    Record<string, number[]>
  >(() => {
    const entries = questionDefs.map((q) => [q.id, makeZeroArray()]);
    return Object.fromEntries(entries);
  });

  const [callDetails, setCallDetails] = useState({
    accountName: Array.from({ length: callNumbers.length }, () => ""),
    loanNo: Array.from({ length: callNumbers.length }, () => ""),
    accountStatus: Array.from({ length: callNumbers.length }, () => ""),
    dateOfCall: Array.from({ length: callNumbers.length }, () => ""),
    callDuration: Array.from({ length: callNumbers.length }, () => ""),
    agentName: Array.from({ length: callNumbers.length }, () => ""),
  });

  const [callComments, setCallComments] = useState(
    Array.from({ length: callNumbers.length }, () => ({
      agent: "",
      evaluator: "",
      action: "",
    }))
  );

  const recalcCallTotals = (responses: Record<string, number[]>) => {
    const totals = makeZeroArray();
    Object.values(responses).forEach((vals) => {
      vals.forEach((val, idx) => {
        totals[idx] += val || 0;
      });
    });
    return totals;
  };

  useEffect(() => {
    setCallTotals(recalcCallTotals(questionResponses));
  }, [questionResponses]);

  useEffect(() => {
    setCallDetails((prev) => ({
      ...prev,
      agentName: Array.from(
        { length: callNumbers.length },
        () => selectedAgent?.name ?? ""
      ),
    }));
  }, [selectedAgent]);

  const handleQuestionToggle = (
    questionId: string,
    callIndex: number,
    nextValue: number,
    // prevValue: number
  ) => {
    setQuestionResponses((prev) => {
      const current = prev[questionId] ?? makeZeroArray();
      const next = [...current];
      next[callIndex] = nextValue;
      return { ...prev, [questionId]: next };
    });
  };

  const handleDetailChange = (
    field: keyof typeof callDetails,
    callIndex: number,
    value: string
  ) => {
    setCallDetails((prev) => {
      const nextField = [...prev[field]];
      nextField[callIndex] = value;
      return { ...prev, [field]: nextField };
    });
  };

  const handleCommentChange = (
    callIndex: number,
    key: "agent" | "evaluator" | "action",
    value: string
  ) => {
    setCallComments((prev) => {
      const next = [...prev];
      next[callIndex] = { ...next[callIndex], [key]: value };
      return next;
    });
  };

  // const totalDefectsOverall = callTotals.reduce((sum, val) => sum + val, 0);

  const formattedMonthYear = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  const callScores = callTotals.map((total) => {
    const raw = Math.max(0, 100 - total * 5);
    return raw >= 75 ? raw : 0;
  });

  const handleSave = async (): Promise<boolean> => {
    if (!userLogged?._id) {
      showNotifier("INCORRECT: Session expired. Please log in again.", true);
      return false;
    }

    const departmentId = userLogged?.departments?.[0] || MORTGAGE_DEPARTMENT_ID;
    if (!departmentId) {
      showNotifier("INCORRECT: No department assigned. Please contact admin.", true);
      return false;
    }

    if (!selectedAgent?._id) {
      showNotifier("INCORRECT: Select an agent before saving.", true);
      return false;
    }

    try {
      const scoreDetails = {
        callDetails,
        questionResponses,
        callTotals,
        withContactStates,
        callComments,
      };

      const totalScore = callScores.length
        ? callScores.reduce((sum, val) => sum + (val || 0), 0) / callScores.length
        : 0;

      await createMortgageScoreCardData({
        variables: {
          input: {
            month: formattedMonthYear,
            department: departmentId,
            agentName: selectedAgent._id,
            dateAndTimeOfCall: new Date().toISOString(),
            number: callDetails.loanNo[0] || "N/A",
            assignedQA: userLogged._id,
            typeOfScoreCard: "UB MORTGAGE",
            scoreDetails,
            totalScore,
          },
        },
      });

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const excelModule = await import("exceljs/dist/exceljs.min.js");
      const ExcelJS = excelModule.default ?? excelModule;

      // const totalDefectsOverall = callTotals.reduce(
      //   (sum, val) => sum + (val || 0),
      //   0
      // );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Mortgage Scorecard", {
        views: [{ showGridLines: false }],
        properties: { defaultRowHeight: 20 },
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

      const headerFill: ExcelJS.Fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF9CA3AF" },
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

      const applyRightBorder = (
        ws: ExcelJS.Worksheet,
        r1: number,
        r2: number,
        col: number,
        style: ExcelJS.BorderStyle
      ): void => {
        for (let r = r1; r <= r2; r++) {
          const cell = ws.getCell(r, col);
          const existing = cell.border ?? {};
          cell.border = {
            ...existing,
            right: { style },
          };
        }
      };

      const applyTopBorder = (
        ws: ExcelJS.Worksheet,
        r: number,
        c1: number,
        c2: number,
        style: ExcelJS.BorderStyle
      ): void => {
        for (let c = c1; c <= c2; c++) {
          const cell = ws.getCell(r, c);
          const existing = cell.border ?? {};
          cell.border = {
            ...existing,
            top: { style },
          };
        }
      };

      const applyBottomBorder = (
        ws: ExcelJS.Worksheet,
        r: number,
        c1: number,
        c2: number,
        style: ExcelJS.BorderStyle
      ): void => {
        for (let c = c1; c <= c2; c++) {
          const cell = ws.getCell(r, c);
          const existing = cell.border ?? {};
          cell.border = {
            ...existing,
            bottom: { style },
          };
        }
      };

      const applyLeftBorder = (
        ws: ExcelJS.Worksheet,
        r1: number,
        r2: number,
        col: number,
        style: ExcelJS.BorderStyle
      ): void => {
        for (let r = r1; r <= r2; r++) {
          const cell = ws.getCell(r, col);
          const existing = cell.border ?? {};
          cell.border = {
            ...existing,
            left: { style },
          };
        }
      };

      const applyMatrixBorders = (
        ws: ExcelJS.Worksheet,
        r1: number,
        r2: number,
        c1: number,
        c2: number,
        outer: ExcelJS.BorderStyle,
        inner: ExcelJS.BorderStyle
      ): void => {
        for (let r = r1; r <= r2; r++) {
          for (let c = c1; c <= c2; c++) {
            const cell = ws.getCell(r, c);
            const existing = cell.border ?? {};
            cell.border = {
              ...existing,
              top: { style: r === r1 ? outer : inner },
              bottom: { style: r === r2 ? outer : inner },
              left: { style: c === c1 ? outer : inner },
              right: { style: c === c2 ? outer : inner },
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

      worksheet.columns = [
        { width: 10 }, //a
        { width: 50 }, //b
        { width: 10 }, //c
        { width: 14 }, //d
        { width: 10 }, //e
        { width: 14 }, //f
        { width: 10 }, //g
        { width: 20 }, //h
        { width: 20 }, //i
        { width: 20 }, //j
        { width: 10 }, //k
        { width: 10 }, //l
        { width: 10 }, //m
        { width: 20 }, //n
        { width: 20 }, //o
        { width: 20 }, //p
      ];

      const goldAccentFill: ExcelJS.Fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEF3C7" },
      };

      const whiteFill: ExcelJS.Fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };

      worksheet.mergeCells("A1:M1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value =
        "COLLECTION CALL PERFORMANCE REVIEW - SECURED LOANS COLLECTIONS";
      titleCell.font = { bold: true, size: 12 };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      applyFill(worksheet, 1, 1, 1, 13, headerFill);

      worksheet.getCell("A2").value = "For the month of";
      worksheet.getRow(1).height = 30;
      worksheet.getRow(2).height = 13;
      worksheet.getRow(3).height = 13;
      worksheet.getRow(4).height = 13;
      worksheet.getRow(5).height = 13;
      worksheet.getRow(7).height = 25;
      worksheet.getRow(27).height = 15;

      worksheet.mergeCells("C2:E2");
      worksheet.getCell("C2").value = formattedMonthYear;

      worksheet.getCell("A3").value = "COLLECTION AGENCY";
      worksheet.mergeCells("C3:E3");
      worksheet.getCell("C3").value = "Bernales & Associates";

      worksheet.getCell("A4").value = "COLLECTION AGENT/OFFICER";
      worksheet.mergeCells("C4:E4");
      worksheet.getCell("C4").value = selectedAgent?.name ?? "";

      worksheet.getCell("A5").value = "EVALUATOR:";
      worksheet.mergeCells("C5:E5");
      worksheet.getCell("C5").value = userLogged?.name ?? "";
      applyFill(worksheet, 2, 5, 3, 5, goldAccentFill);
      applyBottomBorder(worksheet, 2, 3, 5, "thin");
      applyBottomBorder(worksheet, 3, 3, 5, "thin");
      applyBottomBorder(worksheet, 4, 3, 5, "thin");
      applyBottomBorder(worksheet, 5, 3, 5, "thin");

      worksheet.mergeCells("B7:C7");
      worksheet.getCell("B7").value = "Account Name:";

      worksheet.mergeCells("D7:E7");
      worksheet.getCell("D7").value = "Loan No:";

      worksheet.mergeCells("F7:G7");
      worksheet.getCell("F7").value = "Account Status:";

      worksheet.getCell("H7").value = "Date of Call:";

      worksheet.getCell("I7").value = "Call Duration:";
      worksheet.getCell("J7").value = "Agent Name:";
      worksheet.getCell("K7").value = "Score:";
      applyBorder(worksheet, 7, 7, 2, 11, thickBorder);
    

      worksheet.mergeCells("B8:C8");
      worksheet.mergeCells("B9:C9");
      worksheet.mergeCells("B10:C10");
      worksheet.mergeCells("B11:C11");
      worksheet.mergeCells("B12:C12");
      worksheet.mergeCells("B13:C13");
      worksheet.mergeCells("B14:C14");
      worksheet.mergeCells("B15:C15");
      worksheet.mergeCells("B16:C16");
      worksheet.mergeCells("B17:C17");

      worksheet.mergeCells("D8:E8");
      worksheet.mergeCells("D9:E9");
      worksheet.mergeCells("D10:E10");
      worksheet.mergeCells("D11:E11");
      worksheet.mergeCells("D12:E12");
      worksheet.mergeCells("D13:E13");
      worksheet.mergeCells("D14:E14");
      worksheet.mergeCells("D15:E15");
      worksheet.mergeCells("D16:E16");
      worksheet.mergeCells("D17:E17");

      worksheet.mergeCells("F8:G8");
      worksheet.mergeCells("F9:G9");
      worksheet.mergeCells("F10:G10");
      worksheet.mergeCells("F11:G11");
      worksheet.mergeCells("F12:G12");
      worksheet.mergeCells("F13:G13");
      worksheet.mergeCells("F14:G14");
      worksheet.mergeCells("F15:G15");
      worksheet.mergeCells("F16:G16");
      worksheet.mergeCells("F17:G17");

      applyFill(worksheet, 8, 17, 2, 10, goldAccentFill);
      applyFill(worksheet, 8, 17, 11, 11, whiteFill);
      applyMatrixBorders(worksheet, 8, 17, 2, 11, "medium", "thin");
      applyLeftBorder(worksheet, 8, 17, 2, "medium");

      callNumbers.forEach((_, idx) => {
        const row = 8 + idx;
        worksheet.getCell(row, 2).value = callDetails.accountName[idx] ?? "";
        worksheet.getCell(row, 4).value = callDetails.loanNo[idx] ?? "";
        worksheet.getCell(row, 6).value = callDetails.accountStatus[idx] ?? "";
        worksheet.getCell(row, 8).value = callDetails.dateOfCall[idx] ?? "";
        worksheet.getCell(row, 9).value = callDetails.callDuration[idx] ?? "";
        worksheet.getCell(row, 10).value = callDetails.agentName[idx] ?? "";
        worksheet.getCell(row, 11).value = callScores[idx]
          ? `${callScores[idx]}%`
          : 0;
      });

      worksheet.getCell("C19").value = "DEFECT";
      callNumbers.forEach((label, idx) => {
        const cell = worksheet.getCell(19, idx + 4);
        cell.value = label;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      for (let i = 0; i < 10; i++) {
        const cell = worksheet.getCell(8 + i, 1);
        cell.value = `Call ${i + 1}`;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      worksheet.mergeCells("A20:M20");
      worksheet.getCell("A20").value = "A. OPENING";
      worksheet.getCell("A20").font = { bold: true };
      applyFill(worksheet, 20, 20, 1, 13, headerFill);

      applyBorder(worksheet, 22, 26, 2, 13, thinBorder);

      const openingItems = [
        {
          label:
            "Used appropriate greeting (Good Morning, Good Afternon, Good day) / Identified self (mention first and last name) and Agency (full Agency name)",
          defect: 2,
        },
        {
          label:
            "Mentioned (OSP mentioned - authorized Service Provider of UB)",
          defect: 1,
        },
        { label: "Mentioned Line is Recorded", defect: 5 },
        {
          label:
            "Mentioned Client name / Authorized Rep Full Name for outgoing calls to a registered number.  For incoming calls, asked correct Positive Identifiers from unregistered number.",
          defect: 6,
        },
        {
          label:
            "Agent confirms talking to the client. Client should confirm (explicit YES) before proceeding to the call",
          defect: 6,
        },
      ];

      openingItems.forEach((item, idx) => {
        const row = 22 + idx;
        const numCell = worksheet.getCell(row, 1);
        numCell.value = "";
        numCell.alignment = { horizontal: "center", vertical: "middle" };

        const labelCell = worksheet.getCell(row, 2);
        labelCell.value = item.label;
        labelCell.alignment = { wrapText: true, vertical: "middle" };

        const defectCell = worksheet.getCell(row, 3);
        defectCell.value = item.defect;
        defectCell.alignment = { horizontal: "center", vertical: "middle" };
      });

      const writeQuestionValues = (questionId: string, row: number) => {
        const values = questionResponses[questionId] ?? makeZeroArray();
        values.forEach((val, idx) => {
          const cell = worksheet.getCell(row, 4 + idx);
          cell.value = val === 0 ? "" : val;
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });
      };

      applyFill(worksheet, 22, 26, 4, 13, goldAccentFill);

      worksheet.mergeCells("A28:M28");
      worksheet.getCell("A28").value = "B. COLLECTION CALL PROPER";
      worksheet.getCell("A28").font = { bold: true };
      applyFill(worksheet, 28, 28, 1, 13, headerFill);

      worksheet.mergeCells("B30:M30");
      worksheet.getCell("B30").value = "WITH CONTACT";
      worksheet.getCell("B30").font = { bold: true };
      applyFill(worksheet, 30, 30, 2, 13, headerFill);
      applyBorder(worksheet, 30, 43, 2, 13, thinBorder);

      const withContactItems = [
        { label: "ESTABLISHING RAPPORT, EMPATHY & COURTESY", defect: "" },
        { label: "Explained the status of the account", defect: 1 },
        {
          label: "Asked if CH received demand/ notification letter",
          defect: 1,
        },
        { label: "Showed empathy and compassion as appropriate.", defect: 2 },
        { label: "LISTENING SKILLS", defect: "" },
        {
          label:
            "Sought RFD (reason of delinquency or non-payment) in payment & RFBP (reason for broken promise)",
          defect: 1,
        },
        { label: "NEGOTIATION SKILLS", defect: "" },
        {
          label:
            "Explained consequences of non-payment, if applicable (explained conseq of legal and BAP listing/explained side of the Bank and the contract signed/explained that the bank is serious in collecting legal obligations/possible negative listing of name/future credit facility will be closed/additional collection agency expenses/involvement of lawyer will also be Client's expense)",
          defect: 1,
        },
        {
          label: "Asked for Client's capacity to pay, if applicable",
          defect: 1,
        },
        {
          label:
            "Followed hierarchy of negotiation, if applicable (Full payment, minimum amount due, total past due or last bucket amount",
          defect: 1,
        },
        { label: "OFFERING SOLUTIONS", defect: "" },
        { label: "Offered discount/ amnesty/ promo", defect: 1 },
        { label: "Adviced Client to source out funds", defect: 1 },
      ];

      withContactItems.forEach((item, idx) => {
        const row = 31 + idx;
        worksheet.getCell(row, 1).value = "";

        const labelCell = worksheet.getCell(row, 2);
        labelCell.value = item.label;
        labelCell.alignment = { wrapText: true, vertical: "middle" };
        if (item.defect === "") {
          labelCell.font = { bold: true };
        }

        const defectCell = worksheet.getCell(row, 3);
        defectCell.value = item.defect === "" ? "" : item.defect;
        defectCell.alignment = { horizontal: "center", vertical: "middle" };
      });

      applyFill(worksheet, 31, 43, 4, 13, goldAccentFill);
      applyFill(worksheet, 31, 31, 4, 13, goldAccentFill);
      applyFill(worksheet, 35, 35, 4, 13, goldAccentFill);
      applyFill(worksheet, 37, 37, 4, 13, goldAccentFill);
      applyFill(worksheet, 41, 41, 4, 13, goldAccentFill);

      worksheet.mergeCells("B52:M52");
      worksheet.getCell("B52").value = "WITH OR WITHOUT CONTACT";
      worksheet.getCell("B52").font = { bold: true };
      worksheet.mergeCells("B45:M45");
      worksheet.getCell("B45").value = "WITHOUT CONTACT";
      worksheet.getCell("B45").font = { bold: true };
      applyFill(worksheet, 45, 45, 2, 13, headerFill);
      applyFill(worksheet, 52, 52, 2, 13, headerFill);
      applyBorder(worksheet, 45, 50, 2, 13, thinBorder);

      const withoutContactItems = [
        { label: "ESTABLISHING RAPPORT, EMPATHY & COURTESY", defect: "" },
        {
          label:
            "Probed on BTC (best time to call), ETA (Expected time of arrival) and other contact numbers",
          defect: 1,
        },
        { label: "Used time schedule and follow-up if applicable", defect: 1 },
        { label: "Asked for name of party, relation to client", defect: 1 },
        {
          label: "Left URGENT message ang gave correct contact number",
          defect: 2,
        },
      ];

      withoutContactItems.forEach((item, idx) => {
        const row = 46 + idx;
        worksheet.getCell(row, 1).value = "";

        const labelCell = worksheet.getCell(row, 2);
        labelCell.value = item.label;
        labelCell.alignment = { wrapText: true, vertical: "middle" };
        if (item.defect === "") {
          labelCell.font = { bold: true };
        }

        const defectCell = worksheet.getCell(row, 3);
        defectCell.value = item.defect === "" ? "" : item.defect;
        defectCell.alignment = { horizontal: "center", vertical: "middle" };
      });

      applyFill(worksheet, 46, 50, 4, 13, goldAccentFill);

      const withOrWithoutContactItems = [
        { label: "QUALITY OF CALL", defect: "" },
        { label: "Used professional tone of voice", defect: 2 },
        {
          label:
            "Did not use unacceptable words/phrases and maintained polite/civil language",
          defect: 6,
        },
        {
          label:
            "Updated correct information and payment details on logfle/collection memo, if applicable",
          defect: 3,
        },
        { label: "Adherence to Policy(BSP, Code of Conduct, etc.)", defect: 6 },
        {
          label:
            "Intgerity Issues (Revealed and Collected debt from unauthorized Client)",
          defect: 6,
        },
        {
          label:
            "Exercised sound judgment in determining the appropriate course of action.",
          defect: 6,
        },
      ];

      withOrWithoutContactItems.forEach((item, idx) => {
        const row = 53 + idx;
        worksheet.getCell(row, 1).value = "";

        const labelCell = worksheet.getCell(row, 2);
        labelCell.value = item.label;
        labelCell.alignment = { wrapText: true, vertical: "middle" };
        if (item.defect === "") {
          labelCell.font = { bold: true };
        }

        const defectCell = worksheet.getCell(row, 3);
        defectCell.value = item.defect === "" ? "" : item.defect;
        defectCell.alignment = { horizontal: "center", vertical: "middle" };
      });

      applyFill(worksheet, 53, 59, 4, 13, goldAccentFill);
      applyFill(worksheet, 53, 53, 4, 13, goldAccentFill);

      applyBorder(worksheet, 52, 59, 2, 13, thinBorder);

      questionDefs.forEach((q) => {
        writeQuestionValues(q.id, q.row);
      });

      worksheet.mergeCells("A61:M61");
      worksheet.getCell("A61").value = "C. CLOSING THE CALL";
      worksheet.getCell("A61").font = { bold: true };
      applyFill(worksheet, 61, 61, 1, 13, headerFill);

      worksheet.mergeCells("B63:M63");
      worksheet.getCell("B63").value = "SUMMARY";
      worksheet.getCell("B63").font = { bold: true };
      applyFill(worksheet, 63, 63, 2, 13, headerFill);
      applyBorder(worksheet, 63, 66, 2, 13, thinBorder);

      const summaryItems = [
        { label: "Summarized payment arrangement", defect: 2 },
        { label: "Offered online payment channels", defect: 1 },
        { label: "Request return call for payment confirmation", defect: 1 },
      ];

      worksheet.mergeCells("N69:N71");
      worksheet.getCell("N69").value = "99.71%";

      worksheet.mergeCells("O69:O71");
      worksheet.getCell("O69").value = "99.71%";

      worksheet.mergeCells("P69:P71");
      worksheet.getCell("P69").value = "99.71%";

      applyBorder(worksheet, 69, 71, 14, 16, thinBorder);

      summaryItems.forEach((item, idx) => {
        const row = 64 + idx;
        worksheet.getCell(row, 1).value = "";

        const labelCell = worksheet.getCell(row, 2);
        labelCell.value = item.label;
        labelCell.alignment = { wrapText: true, vertical: "middle" };

        const defectCell = worksheet.getCell(row, 3);
        defectCell.value = item.defect;
        defectCell.alignment = { horizontal: "center", vertical: "middle" };
      });

      applyFill(worksheet, 64, 66, 4, 13, goldAccentFill);

      callNumbers.forEach((_, idx) => {
        const col = 4 + idx;
        worksheet.getCell(69, col).value = withContactStates[idx]
          ? "YES"
          : "NO";
        worksheet.getCell(69, col).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(70, col).value = callTotals[idx] ?? 0;
        worksheet.getCell(70, col).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        worksheet.getCell(71, col).value = `${callScores[idx] ?? 0}%`;
        worksheet.getCell(71, col).alignment = {
          horizontal: "center",
          vertical: "middle",
        };
      });

      const withContactCell = worksheet.getCell("B69");
      withContactCell.value = "WITH CONTACT? (Y/N)";
      withContactCell.alignment = { horizontal: "right", vertical: "middle" };

      const totalDefectsCell = worksheet.getCell("B70");
      totalDefectsCell.value = "TOTAL DEFECTS";
      totalDefectsCell.alignment = { horizontal: "right", vertical: "middle" };

      const totalDefectsValueCell = worksheet.getCell(70, 3);
      totalDefectsValueCell.value = 68;
      totalDefectsValueCell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      const scoreCell = worksheet.getCell("B71");
      scoreCell.value = "SCORE";
      scoreCell.alignment = { horizontal: "right", vertical: "middle" };
      applyBorder(worksheet, 69, 71, 2, 13, thinBorder);

      callNumbers.forEach((_, idx) => {
        const startRow = 74 + idx * 4;

        const summaryCell = worksheet.getCell(startRow, 2);
        summaryCell.value = `CALL ${idx + 1} CALL SUMMARY`;
        summaryCell.alignment = { vertical: "middle", wrapText: true };
        summaryCell.font = { bold: true };

        worksheet.mergeCells(startRow, 3, startRow, 5);
        const evaluatorCell = worksheet.getCell(startRow, 3);
        evaluatorCell.value = "COMMENTS OF EVALUATOR";
        evaluatorCell.alignment = { vertical: "middle", wrapText: true };
        evaluatorCell.font = { bold: true };

        worksheet.mergeCells(startRow, 6, startRow, 8);
        const actionCell = worksheet.getCell(startRow, 6);
        actionCell.value = "ACTION PLAN";
        actionCell.alignment = { vertical: "middle", wrapText: true };
        actionCell.font = { bold: true };

        applyFill(worksheet, startRow, startRow, 2, 8, headerFill);
        applyFill(worksheet, startRow + 1, startRow + 2, 2, 8, goldAccentFill);

        worksheet.mergeCells(startRow + 1, 2, startRow + 2, 2);
        worksheet.mergeCells(startRow + 1, 3, startRow + 2, 5);
        worksheet.mergeCells(startRow + 1, 6, startRow + 2, 8);

        const comments = callComments[idx];
        worksheet.getCell(startRow + 1, 2).value = comments?.agent ?? "";
        worksheet.getCell(startRow + 1, 3).value = comments?.evaluator ?? "";
        worksheet.getCell(startRow + 1, 6).value = comments?.action ?? "";

        applyBorder(worksheet, startRow, startRow + 2, 2, 8, thinBorder);
      });
      applyRightBorder(worksheet, 1, 112, 13, "thick");
      applyTopBorder(worksheet, 113, 1, 13, "thick");

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "mortgage-scorecard.xlsx";
      link.click();
    } catch (error) {
      console.error("Failed to export mortgage scorecard", error);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleSaveAndExport = async () => {
    if (saveLoading || isExportingExcel) return;
    const saved = await handleSave();
    if (!saved) return;
    await handleExportExcel();
  };

  const summaryRows: ColumnInputRowConfig[] = [
    {
      text: "WITH CONTACT? (Y/N)",
      textClassName: "w-full pl-0 py-0 truncate font-black",
      containerClassName: "h-full flex border-x border-y rounded-t-md ",
      renderContent: () => (
        <div className="flex h-full w-full items-center border-black">
          <div className="w-full pl-3 py-1 border-r truncate font-normal">
            WITH CONTACT? (Y/N)
          </div>
          <div className="grid h-full w-full items-center border-black grid-cols-11">
            <div className="border-r h-full border-black flex items-center justify-center px-1 py-1 bg-gray-300" />
            {callNumbers.map((_, idx) => {
              const isYes = withContactStates[idx];
              return (
                <div
                  key={`with-contact-${idx}`}
                  className="border-r h-full border-black last:border-r-0 flex items-center justify-center px-1 py-1 bg-gray-100"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setWithContactStates((prev) => {
                        const next = [...prev];
                        next[idx] = !prev[idx];
                        return next;
                      })
                    }
                    className={`w-full py-1 border-2 rounded-sm shadow-md font-black uppercase text-white cursor-pointer transition-colors ${
                      isYes
                        ? "bg-green-600 hover:bg-green-700 border-green-900"
                        : "bg-red-600 hover:bg-red-700 border-red-900"
                    }`}
                  >
                    {isYes ? "YES" : "NO"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      text: "TOTAL DEFECTS",
      textClassName: "w-full pl-0 py-0 truncate font-black",
      renderContent: () => (
        <div className="flex h-full w-full items-center border-black">
          <div className="w-full pl-3 py-1 border-r truncate font-normal">
            TOTAL DEFECTS
          </div>
          <div className="grid h-full w-full items-center border-black grid-cols-11">
            <div className="border-r h-full border-black flex items-center justify-center px-1 py-1 bg-gray-300 font-normal">
              68
            </div>
            {callNumbers.map((_, idx) => (
              <div
                key={`total-defect-${idx}`}
                className="border-r h-full border-black last:border-r-0 flex items-center justify-center px-1 py-1 bg-gray-100 font-normal"
              >
                {callTotals[idx] ?? 0}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      text: "SCORE",
      textClassName: "w-full pl-0 py-0 truncate font-black",
      containerClassName:
        "h-full flex border-b border-x rounded-b-md shadow-md ",
      renderContent: () => (
        <div className="flex h-full w-full items-center border-black">
          <div className="w-full pl-3 py-1 border-r truncate font-normal">
            SCORE
          </div>
          <div className="grid h-full w-full items-center border-black grid-cols-11">
            <div className="border-r h-full border-black flex items-center justify-center px-1 py-1 bg-gray-300" />
            {callNumbers.map((_, idx) => (
              <div
                key={`score-${idx}`}
                className="border-r h-full border-black last:border-r-0 flex items-center justify-center px-1 py-1 bg-gray-100 font-normal"
              >
                {callScores[idx] ?? 100}%
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const isProcessing = saveLoading || isExportingExcel;

  const handleCallValueChange = (
    callIndex: number,
    nextValue: number,
    prevValue: number
  ) => {
    setCallTotals((prev) => {
      const updated = [...prev];
      const delta = nextValue - prevValue;
      updated[callIndex] = Math.max(0, (updated[callIndex] || 0) + delta);
      return updated;
    });
  };

  return (
    <div className="p-5 flex flex-col relative h-full text-black w-full max-h-[90vh]">
      <motion.div
        className="border flex rounded-md overflow-hidden flex-col h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className=" font-black relative items-center flex justify-center border-b  h-[8.4%]  uppercase bg-gray-400 text-2xl text-center py-3 w-full text-black">
          <div>
            COLLECTION CALL PERFORMANCE REVIEW - SECURED LOANS COLLECTIONS
          </div>
          <div className="flex items-center absolute right-5 h-full gap-1 justify-end text-xs">
            <button
              type="button"
              onClick={handleSaveAndExport}
              disabled={isProcessing}
              className="px-4 py-2 cursor-pointer border-green-900 transition-all border-2 font-black uppercase rounded-sm shadow-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              {isProcessing ? "Processing..." : "Save"}
            </button>
          </div>
        </div>

        <div className="bg-gray-300  h-[91.6%] overflow-auto  p-5 flex flex-col ">
          <div className="flex justify-between">
            <div className="grid grid-cols-4 w-full items-start gap-2">
              <div className="border  rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-rows-2 border-b">
                  <div className="bg-gray-400 rounded-t-md px-5 border-b py-1">
                    For the month
                  </div>
                  <div className="h-full px-5 items-center flex bg-gray-100">
                    {formattedMonthYear}
                  </div>
                </div>
                <div className="grid grid-rows-2 items-center border-b">
                  <div className="bg-gray-400  px-5 border-b py-1">
                    Collection officer
                  </div>
                  <div className="h-full px-5 items-center flex bg-gray-100">
                    Bernales & Associates
                  </div>
                </div>
                <div className="grid grid-rows-2 border-b">
                  <div className="bg-gray-400 px-5 border-b py-1">
                    COLLECTION AGENT/OFFICER:
                  </div>
                  <div className="relative flex flex-col">
                    <div
                      onClick={() => setIsOpenAgent(!isOpenAgent)}
                      className="flex bg-gray-100 h-full cursor-pointer items-center px-5 justify-between"
                    >
                      <div>
                        {selectedAgent ? selectedAgent.name : "Select an Agent"}
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={`" ${
                          isOpenAgent ? "rotate-90" : ""
                        } size-4 transition-all "`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <AnimatePresence>
                      {isOpenAgent && (
                        <motion.div
                          className="absolute z-20 max-h-48 overflow-auto border rounded-md top-8 w-full bg-white"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          {agentLoading && <div>Loading...</div>}
                          {agentData?.getBucketUser.map((agent) => (
                            <div
                              key={agent._id}
                              onClick={() => {
                                setIsOpenAgent(false);
                                setSelectedAgent(agent);
                              }}
                              className="px-3 py-2 border-b last:border-b-0 shadow-md odd:bg-gray-100 even:bg-gray-200 hover:bg-gray-300 cursor-pointer"
                            >
                              {agent.name}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="grid grid-rows-2 ">
                  <div className="bg-gray-400 px-5 border-b py-1">
                    Evaluator
                  </div>
                  <div className="w-full px-5 rounded-b-md items-center flex h-full bg-gray-100">
                    {userLogged?.name}
                  </div>
                </div>
              </div>

              <div className="flex col-span-3 w-full gap-2 items-end ">
                <div className="text-sm truncate flex flex-col pl-2 pb-1.5 gap-[9px] ">
                  {callNumbers.map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>
                {detailColumns.map((column) => (
                  <DetailColumn
                    key={column.label}
                    {...column}
                    values={
                      column.label === "Score %"
                        ? callScores.map((score) => `${score}%`)
                        : column.values
                    }
                    valueProvider={(idx) => {
                      const fieldMap: Record<string, keyof typeof callDetails> =
                        {
                          "Account Name:": "accountName",
                          "Loan No:": "loanNo",
                          "Account Status:": "accountStatus",
                          "Date of call:": "dateOfCall",
                          "Call Duration:": "callDuration",
                          "Agent Name:": "agentName",
                        };
                      const key = fieldMap[column.label];
                      if (!key) return "";
                      return callDetails[key][idx] ?? "";
                    }}
                    onValueChange={(idx, value) => {
                      const fieldMap: Record<string, keyof typeof callDetails> =
                        {
                          "Account Name:": "accountName",
                          "Loan No:": "loanNo",
                          "Account Status:": "accountStatus",
                          "Date of call:": "dateOfCall",
                          "Call Duration:": "callDuration",
                          "Agent Name:": "agentName",
                        };
                      const key = fieldMap[column.label];
                      if (!key) return;
                      handleDetailChange(key, idx, value);
                    }}
                    inputProps={column.inputProps}
                  />
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
                <ColumnInputRow
                  key={row.text}
                  {...row}
                  questionValues={
                    row.questionId
                      ? questionResponses[row.questionId]
                      : undefined
                  }
                  onQuestionToggle={handleQuestionToggle}
                  onCallValueChange={handleCallValueChange}
                />
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
                <ColumnInputRow
                  key={row.text}
                  {...row}
                  questionValues={
                    row.questionId
                      ? questionResponses[row.questionId]
                      : undefined
                  }
                  onQuestionToggle={handleQuestionToggle}
                  onCallValueChange={handleCallValueChange}
                />
              ))}

              <div className="w-full font-semibold bg-gray-400 px-3 py-1  border-x border-b">
                LISTENING SKILLS
              </div>
              {withContactListeningRows.map((row) => (
                <ColumnInputRow
                  key={row.text}
                  {...row}
                  questionValues={
                    row.questionId
                      ? questionResponses[row.questionId]
                      : undefined
                  }
                  onQuestionToggle={handleQuestionToggle}
                  onCallValueChange={handleCallValueChange}
                />
              ))}

              <div className="w-full uppercase font-semibold bg-gray-400 px-3 py-1  border-x border-b">
                negotiation SKILLS
              </div>
              {withContactNegotiationRows.map((row) => (
                <ColumnInputRow
                  key={row.text}
                  {...row}
                  questionValues={
                    row.questionId
                      ? questionResponses[row.questionId]
                      : undefined
                  }
                  onQuestionToggle={handleQuestionToggle}
                  onCallValueChange={handleCallValueChange}
                />
              ))}

              <div className="w-full uppercase font-semibold bg-gray-400 px-3 py-1  border-x border-b">
                OFFERING SOLUTIONS
              </div>
              {withContactSolutionRows.map((row) => (
                <ColumnInputRow
                  key={row.text}
                  {...row}
                  questionValues={
                    row.questionId
                      ? questionResponses[row.questionId]
                      : undefined
                  }
                  onQuestionToggle={handleQuestionToggle}
                  onCallValueChange={handleCallValueChange}
                />
              ))}

              <div className="w-full mt-2 font-semibold bg-gray-400 px-3 py-1  border rounded-t-md">
                WITH OUT CONTACT
              </div>

              <div className="w-full font-semibold px-3 py-1  border-x border-b">
                ESTABLISHING RAPPORT, EMPATHY & COURTESY
              </div>
              {withoutContactRows.map((row) => (
                <ColumnInputRow
                  key={row.text}
                  {...row}
                  questionValues={
                    row.questionId
                      ? questionResponses[row.questionId]
                      : undefined
                  }
                  onQuestionToggle={handleQuestionToggle}
                  onCallValueChange={handleCallValueChange}
                />
              ))}

              <div className="uppercase w-full mt-2 font-semibold bg-gray-400 px-3 py-1  border rounded-t-md">
                WITH or WITH OUT CONTACT
              </div>

              <div className="w-full font-semibold px-3 py-1  border-x border-b">
                QUALITY OF CALL
              </div>
              {withOrWithoutRows.map((row) => (
                <ColumnInputRow
                  key={row.text}
                  {...row}
                  questionValues={
                    row.questionId
                      ? questionResponses[row.questionId]
                      : undefined
                  }
                  onQuestionToggle={handleQuestionToggle}
                  onCallValueChange={handleCallValueChange}
                />
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
                <ColumnInputRow
                  key={row.text}
                  {...row}
                  questionValues={
                    row.questionId
                      ? questionResponses[row.questionId]
                      : undefined
                  }
                  onQuestionToggle={handleQuestionToggle}
                  onCallValueChange={handleCallValueChange}
                />
              ))}
            </div>
            <div className="flex items-center justify-end  mt-3">
              <div
                onClick={() => setFullScore(true)}
                className="bg-blue-600 cursor-pointer shadow-md transition-all hover:bg-blue-700 px-3 text-white rounded-sm font-black py-1 uppercase text-center border-2 border-blue-900"
              >
                View Total Score Percentage
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex w-full h-full flex-col">
                {summaryRows.map((row) => (
                  <ColumnInputRow key={row.text} {...row} />
                ))}
              </div>
            </div>
            {commentCalls.map((callNumber) => (
              <CallCommentSection
                key={`call-comment-${callNumber}`}
                callNumber={callNumber}
                comment={callComments[callNumber - 1]}
                onCommentChange={(key, value) =>
                  handleCommentChange(callNumber - 1, key, value)
                }
              />
            ))}
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {fullScore && (
          <div className="absolute top-0  justify-center items-center w-full h-full flex z-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullScore(false)}
              className="bg-black/40 absolute left-0 top-0 backdrop-blur-md w-full h-full"
            ></motion.div>
            <motion.div
              className="bg-gray-100 border rounded-md overflow-hidden w-full max-w-[60%] max-h-[80%] z-20 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="px-5 py-2 bg-gray-300 text-2xl font-black uppercase border-b text-center">
                Total Scores
              </div>
              <div className="grid grid-cols-5 p-2 gap-2">
                <div className="border text-sm text-center flex justify-center flex-col h-20 p-2 rounded-md bg-gray-200">
                  <div>Call 1</div>
                  <div className="text-3xl font-black">100%</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UBMortgageScoreCard;
