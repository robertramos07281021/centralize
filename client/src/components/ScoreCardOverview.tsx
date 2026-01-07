import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gql, useQuery } from "@apollo/client";

const GET_SCORECARD_SUMMARIES = gql`
  query GetScoreCardSummaries($date: String, $search: String) {
    getScoreCardSummaries(date: $date, search: $search) {
      _id
      typeOfScoreCard
      totalScore
      dateAndTimeOfCall
      createdAt
      updatedAt
      scoreDetails
      agent {
        _id
        name
      }
      qa {
        _id
        name
      }
      department {
        _id
        name
      }
      month
      number
    }
  }
`;

type ScoreEntry = {
  scores?: number | null;
  points?: number | null;
  missedGuidlines?: string | null;
};

type ScoreSection = Record<string, ScoreEntry>;

type CallComment = {
  call?: number;
  agent?: string;
  evaluator?: string;
  tl?: string;
  action?: string;
  actionPlan?: string;
};

type ScoreDetails = {
  opening?: ScoreSection | null;
  closingTheCall?: ScoreSection | null;
  collectionCallProper?: {
    withContact?: {
      establishingRapport?: ScoreSection | null;
      listeningSkills?: ScoreSection | null;
      negotiationSkills?: ScoreSection | null;
      offeringSolutions?: ScoreSection | null;
    };
    withoutContact?: ScoreSection | null;
    withOrWithoutContact?: ScoreSection | null;
  };
  callComments?: CallComment[];
  negotiationSkills?: ScoreSection | null;
  closing?: ScoreSection | null;
  regulatoryAndCompliance?: ScoreSection | null;
  comments?: {
    highlights?: string | null;
    comments?: string | null;
  } | null;
};

type ScoreCardTypeKey = "default" | "ub" | "eastwest" | "ubMortgage";

type ScoreCardSummary = {
  _id: string;
  typeOfScoreCard: string;
  month?: string | null;
  number?: string | null;
  totalScore?: number | null;
  dateAndTimeOfCall?: string;
  createdAt?: string;
  updatedAt?: string;
  scoreDetails?: ScoreDetails | null;
  agent?: {
    _id: string;
    name: string;
  } | null;
  qa?: {
    _id: string;
    name: string;
  } | null;
  department?: {
    _id: string;
    name: string;
  } | null;
};

type EastwestQuestion = {
  text: string;
  tag?: string;
  defaultScore?: number;
  response?: string;
  penalty?: number;
};

type EastwestSection = {
  headingLabel?: string;
  title?: string;
  totalNo?: number;
  questions?: EastwestQuestion[];
};

type EastwestScoreDetails = {
  meta?: {
    evaluationDate?: string;
    acknowledgedBy?: string;
    agent?: { id?: string; name?: string } | null;
    evaluator?: { id?: string; name?: string } | null;
    cardholder?: string;
    accountNumber?: string;
    enteredScore?: string;
    enteredRate?: string;
  };
  withContact?: EastwestSection[];
  withoutContact?: EastwestSection[];
  totals?: {
    withContact?: number;
    withoutContact?: number;
    finalScore?: number;
  };
  comments?: {
    comments?: string | null;
    highlights?: string | null;
  } | null;
};

const ScoreCardOverview = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTypeFilter, setSelectedTypeFilter] =
    useState<ScoreCardTypeKey | null>(null);
  const [isOpenDefaultScoreCard, setIsOpenDefaultScoreCard] =
    useState<boolean>(false);
  const [isOpenUBScoreCard, setIsOpenUBScoreCard] = useState<boolean>(false);
  const [isOpenEastwestScoreCard, setIsOpenEastwestScoreCard] =
    useState<boolean>(false);
  const [isOpenUBMortgageScoreCard, setIsOpenUBMortgageScoreCard] =
    useState<boolean>(false);
  const [selectedScoreCard, setSelectedScoreCard] =
    useState<ScoreCardSummary | null>(null);

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const variables = useMemo(() => {
    const trimmed = searchTerm.trim();
    return {
      date: selectedDate || null,
      search: trimmed.length > 0 ? trimmed : null,
    };
  }, [selectedDate, searchTerm]);

  const { data, loading, error } = useQuery(GET_SCORECARD_SUMMARIES, {
    variables,
    fetchPolicy: "network-only",
  });
  GET_SCORECARD_SUMMARIES;

  console.log("ScoreCardOverview data:", data);

  const scorecards: ScoreCardSummary[] = data?.getScoreCardSummaries ?? [];

  const deriveTypeKey = (type?: string): ScoreCardTypeKey => {
    const normalized = (type || "").toLowerCase();
    if (normalized.includes("ub mortgage")) return "ubMortgage";
    if (normalized.includes("ub score")) return "ub";
    if (normalized.includes("eastwest")) return "eastwest";
    return "default";
  };

  const filteredScorecards = useMemo(() => {
    if (!selectedTypeFilter) return scorecards;
    return scorecards.filter(
      (entry) => deriveTypeKey(entry.typeOfScoreCard) === selectedTypeFilter
    );
  }, [scorecards, selectedTypeFilter]);

  const overviewStats = useMemo(() => {
    if (filteredScorecards.length === 0) {
      return {
        avgScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
      };
    }
    const scores = filteredScorecards
      .map((entry) => entry.totalScore ?? null)
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value)
      );
    const totalScore = scores.reduce((sum, value) => sum + value, 0);
    const highestScore = scores.length ? Math.max(...scores) : 0;
    const lowestScore = scores.length ? Math.min(...scores) : 0;
    const passCount = scores.filter((score) => score >= 87).length;
    return {
      avgScore: scores.length ? totalScore / scores.length : 0,
      highestScore,
      lowestScore,
      passRate: scores.length ? (passCount / scores.length) * 100 : 0,
    };
  }, [filteredScorecards]);

  const totalsByType = useMemo(() => {
    return scorecards.reduce(
      (acc, entry) => {
        const typeKey = deriveTypeKey(entry.typeOfScoreCard);
        acc[typeKey] += 1;
        return acc;
      },
      { default: 0, eastwest: 0, ub: 0, ubMortgage: 0 }
    );
  }, [scorecards]);

  const getStatusBadge = (score?: number | null) => {
    if (score == null) {
      return { label: "No score", className: "bg-gray-200 text-gray-600" };
    }
    if (score >= 87) {
      return { label: "Passed", className: "bg-green-100 text-green-700" };
    }
    if (score >= 75) {
      return { label: "Passed", className: "bg-green-100 text-green-700" };
    }
    return { label: "Failed", className: "bg-red-100 text-red-700" };
  };

  const formatDate = (value?: string) => {
    if (!value) {
      return "-";
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
  };

  const formatFieldLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase()) || key;

  const formatPoints = (value?: number | null) =>
    value === null || value === undefined ? "-" : value.toString();

  const SCORE_VALUE_LABELS: Record<number, string> = {
    0: "NO",
    1: "YES",
    2: "COACHING",
    3: "N/A",
  };

  const formatScoreLabel = (value?: number | null) => {
    if (value === null || value === undefined) {
      return "-";
    }
    const normalized = Number(value);
    if (Number.isNaN(normalized)) {
      return String(value);
    }
    return SCORE_VALUE_LABELS[normalized] ?? String(value);
  };

  const handleTypeClick = (typeKey: ScoreCardTypeKey) => {
    setSelectedTypeFilter((prev) => (prev === typeKey ? null : typeKey));
  };

  const typeButtonClass = (typeKey: ScoreCardTypeKey, baseClasses: string) => {
    const isSelected = selectedTypeFilter === typeKey;
    const isDimmed = selectedTypeFilter !== null && !isSelected;
    const ringClass = isSelected ? " " : "";
    if (isDimmed) {
      return `font-black uppercase bg-gray-400 border-2 border-gray-600 text-white px-2 items-center flex rounded-md shadow-md cursor-pointer hover:bg-gray-500`;
    }
    return `${baseClasses}${ringClass}`;
  };

  const buildExcelCriteriaRows = (details?: ScoreDetails | null) => {
    const rows: Array<Array<string | number>> = [];
    const pushSection = (
      label: string,
      section?: ScoreSection | null,
      options?: { includePoints?: boolean }
    ) => {
      if (!section) {
        return;
      }
      const entries = Object.entries(section);
      if (!entries.length) {
        return;
      }
      const includePoints = options?.includePoints !== false;
      entries.forEach(([key, entry], index) => {
        const safeEntry = entry ?? {};
        rows.push([
          index === 0 ? label : "",
          formatFieldLabel(key),
          formatScoreLabel(safeEntry.scores),
          includePoints ? safeEntry.points ?? "" : "",
          safeEntry.missedGuidlines?.trim() ?? "",
        ]);
      });
    };

    pushSection("Opening", details?.opening);
    pushSection("Negotiation Skills", details?.negotiationSkills);
    pushSection("Closing", details?.closing);
    pushSection("Regulatory and Compliance", details?.regulatoryAndCompliance, {
      includePoints: false,
    });

    return rows;
  };

  const formatCallDateTime = (value?: string) => {
    if (!value) {
      return "N/A";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const flattenQuestions = (obj: any): Array<any> => {
    const result: Array<any> = [];
    if (!obj) return result;
    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        result.push(...flattenQuestions(item));
      });
    } else if (typeof obj === "object") {
      if ("question" in obj) {
        result.push(obj);
      } else {
        Object.values(obj).forEach((value) => {
          result.push(...flattenQuestions(value));
        });
      }
    }
    return result;
  };

  const extractEastwestDetails = (
    details?: any | null
  ): EastwestScoreDetails | null => {
    if (!details || typeof details !== "object") return null;
    return details as EastwestScoreDetails;
  };

  const renderEastwestSection = (
    label: string,
    sections?: EastwestSection[]
  ) => {
    if (!sections || sections.length === 0) return null;

    return (
      <div className="mt-3 flex flex-col">
        <div className="font-black  bg-gray-300 rounded-t-md py-1 w-full border-x border-t text-center uppercase text-xl text-black">
          {label}
        </div>
        {sections.map((section, sectionIdx) => (
          <div
            key={`${label}-${section.title}-${sectionIdx}`}
            className={`rounded-md overflow-hidden mb-2 border border-black shadow-sm ${
              sectionIdx === 0 ? "rounded-t-none" : ""
            }`}
          >
            <div className="bg-gray-200 border-b px-3 py-2 flex justify-between items-center">
              <div className="font-black uppercase text-gray-900">
                {section.headingLabel || section.title || "Section"}
              </div>
              {typeof section.totalNo === "number" && (
                <div className="text-xs font-black px-2 py-1 rounded-sm bg-gray-100 text-black border border-black">
                  Total NO: {section.totalNo}
                </div>
              )}
            </div>
            {section.questions && section.questions.length > 0 ? (
              <div className="divide-y">
                {section.questions.map((question, qIdx) => (
                  <div
                    key={`${section.title}-q-${qIdx}`}
                    className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 px-3 py-2 even:bg-gray-50"
                  >
                    <div className="md:col-span-2 font-semibold text-black">
                      {question.text}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className=" text-sm font-semibold text-black">
                        Tag:
                      </span>
                      <span className="uppercase text-xs font-black px-2 py-1 rounded-sm bg-gray-200 border border-black">
                        {question.tag || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 justify-start md:justify-end">
                      <span className=" text-sm font-semibold text-black">
                        Response:
                      </span>
                      <span
                        className={`px-3 py-1 rounded-sm font-black uppercase border-2 text-white text-shadow-2xs ${
                          question.response === "YES"
                            ? "bg-green-600 border-green-900"
                            : question.response === "NO"
                            ? "bg-red-600 border-red-900"
                            : "bg-gray-500 border-gray-700"
                        }`}
                      >
                        {question.response || "-"}
                      </span>
                      <div>
                        {typeof question.penalty === "number" && (
                          <div className="flex items-center">
                            <div
                              className={`"  text-sm font-semibold text-black "`}
                            >
                              Penalty:
                            </div>
                            <div
                              className={`" ${
                                question.penalty > 0
                                  ? "bg-red-600 border-red-900"
                                  : "bg-green-600 px-4 border-green-900"
                              } ml-2 text-base text-white font-black  px-3 py-1 rounded  border-2 "`}
                            >
                              {question.penalty}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 italic">
                No questions
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderUBSection = (title: string, section?: any) => {
    const flatQuestions = flattenQuestions(section);
    if (!flatQuestions || flatQuestions.length === 0) return null;
    return (
      <div key={title} className="mt-2">
        <div
          className="font-black bg-gray-300 rounded-t-md py-1 w-full border text-center uppercase text-xl text-black"
          dangerouslySetInnerHTML={{ __html: title }}
        ></div>
        <div className="divide-y flex flex-col">
          {flatQuestions.map((entry: any, idx: number) => (
            <div
              key={idx}
              className="even:bg-gray-100 odd:bg-gray-200 last:border-b last:rounded-b-md border-x px-3 py-2 text-xs md:text-sm"
            >
              <div className="font-semibold uppercase text-black mb-1">
                {entry.question}
              </div>
              <div className="flex justify-between gap-2">
                {entry.calls &&
                  Array.isArray(entry.calls) &&
                  entry.calls.map((callValue: number, callIdx: number) => {
                    return (
                      <div key={callIdx} className="flex gap-2 items-center">
                        <span className="font-semibold">
                          Call {callIdx + 1}:
                        </span>
                        <span
                          className={`mt-1 px-3 py-1 rounded font-black text-white text-shadow-2xs shadow-md border-2 ${
                            callValue >= 1
                              ? "bg-red-600 border-red-900"
                              : "bg-green-600 border-green-900"
                          }`}
                        >
                          {callValue}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEastwestTotals = (details: EastwestScoreDetails | null) => {
    if (!details?.totals) return null;
    const { withContact, withoutContact } = details.totals;
    return (
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-gray-200 border border-black rounded-md p-3 text-center shadow-sm">
          <div className="text-xs uppercase text-gray-600">
            Total Defects (W/ Contact)
          </div>
          <div className="text-2xl font-black text-gray-900">
            {withContact ?? 0}
          </div>
        </div>
        <div className="bg-gray-200 border border-black rounded-md p-3 text-center shadow-sm">
          <div className="text-xs uppercase text-gray-600">
            Total Defects (W/O Contact)
          </div>
          <div className="text-2xl font-black text-gray-900">
            {withoutContact ?? 0}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, section?: ScoreSection | null) => {
    if (!section || Object.keys(section).length === 0) return null;
    const entries = Array.isArray(section)
      ? section.map((entry, i) => [i.toString(), entry])
      : Object.entries(section);
    return (
      <div key={title} className="mt-2">
        <div className="font-black bg-gray-300 rounded-t-md py-1 w-full border text-center uppercase text-xl text-black">
          {title}
        </div>
        <div className="divide-y">
          {entries.map(([key, entry], i) => {
            let entryPoints = entry.points ?? 7;
            let score = entry.scores;
            if (entry.calls) {
              score = entry.calls[i];
              entryPoints = score === 1 ? 2 : score === 0 ? 1 : 0;
            }
            return (
              <div
                key={key}
                className="grid grid-cols-1 even:bg-gray-100 odd:bg-gray-200 last:border-b last:rounded-b-md border-x md:grid-cols-3 gap-2 px-3 py-2 text-xs md:text-sm"
              >
                <div className="font-semibold uppercase text-black">
                  <div>{formatFieldLabel(key)}</div>
                </div>
                <div className="text-gray-700 flex items-center gap-2">
                  <span className="font-medium text-black">Score:</span>{" "}
                  {entry?.scores === 1 ? (
                    <div className="bg-green-600 px-3 py-1 rounded-sm font-black uppercase text-white border-2 border-green-800">
                      YES
                    </div>
                  ) : entry?.scores === 0 ? (
                    <div className="bg-red-600 px-3 py-1 rounded-sm font-black uppercase text-white border-2 border-red-800">
                      NO
                    </div>
                  ) : entry?.scores === 2 ? (
                    <div className="bg-blue-600 px-3 py-1 rounded-sm font-black uppercase text-white border-2 border-blue-800">
                      COACHING
                    </div>
                  ) : entry?.scores === 3 ? (
                    <div className="bg-amber-600 px-3 py-1 rounded-sm font-black uppercase text-white border-2 border-amber-800">
                      N/A
                    </div>
                  ) : (
                    "-"
                  )}
                </div>
                <div className="text-gray-700 flex gap-2 items-center">
                  <span className="font-medium text-black">Points:</span>
                  <div
                    className={` ${
                      entryPoints === 0
                        ? "bg-red-600 border-red-900"
                        : entryPoints === 1
                        ? "bg-red-600 border-red-900"
                        : entryPoints < 3
                        ? "bg-green-600 border-green-900"
                        : entryPoints < 20
                        ? "bg-green-600 border-green-900"
                        : "bg-red-600 border-red-900"
                    } font-black text-white text-shadow-2xs shadow-md px-3 border-2 rounded-sm py-1 `}
                  >
                    <div>
                      {!entry
                        ? 0
                        : entryPoints === 1
                        ? "Failed"
                        : entryPoints === 2
                        ? "Passed"
                        : formatPoints(entryPoints)}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3 text-gray-600">
                  <span className="font-medium text-black">
                    Missed Guidlines:
                  </span>{" "}
                  {entry?.missedGuidlines?.trim() || (
                    <div className="italic text-xs text-gray-400">
                      No Missed Guidlines
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEastwestMeta = (details: EastwestScoreDetails | null) => {
    if (!details) return null;
    const meta = details.meta ?? {};
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm text-gray-800">
        <div>
          <span className="font-black uppercase text-black">Agent:</span>{" "}
          {meta.agent?.name || "Unknown Agent"}
        </div>
        <div>
          <span className="font-black uppercase text-black">Evaluator:</span>{" "}
          {meta.evaluator?.name || "Unknown TL"}
        </div>
        <div>
          <span className="font-black uppercase text-black">Cardholder:</span>{" "}
          {meta.cardholder || "N/A"}
        </div>
        <div>
          <span className="font-black uppercase text-black">Account #:</span>{" "}
          {meta.accountNumber || "N/A"}
        </div>
        <div>
          <span className="font-black uppercase text-black">
            Evaluation Date:
          </span>{" "}
          {formatDate(meta.evaluationDate)}
        </div>
        <div>
          <span className="font-black uppercase text-black">
            Acknowledged By:
          </span>{" "}
          {meta.acknowledgedBy || "N/A"}
        </div>
        <div>
          <span className="font-black uppercase text-black">
            Entered Score:
          </span>{" "}
          {meta.enteredScore || "N/A"}
        </div>
        <div>
          <span className="font-black uppercase text-black">Entered Rate:</span>{" "}
          {meta.enteredRate || "N/A"}
        </div>
      </div>
    );
  };

  const MORTGAGE_CALL_COUNT = 10;

  const normalizeArray = <T,>(value: any, length: number, fallback: T): T[] => {
    const source = Array.isArray(value) ? value : [];
    const next = source
      .slice(0, length)
      .map((entry) =>
        entry === null || entry === undefined ? fallback : entry
      );
    while (next.length < length) {
      next.push(fallback);
    }
    return next;
  };

  const computeMortgageCallScores = (totals: number[]) =>
    totals.map((total) => {
      const numeric = typeof total === "number" ? total : Number(total) || 0;
      const raw = Math.max(0, 100 - numeric * 5);
      return raw >= 75 ? raw : 0;
    });

  const renderUBMortgageSection = (details?: any) => {
    if (!details) return null;

    const callDetails = {
      accountName: normalizeArray(
        details.callDetails?.accountName,
        MORTGAGE_CALL_COUNT,
        ""
      ),
      loanNo: normalizeArray(
        details.callDetails?.loanNo,
        MORTGAGE_CALL_COUNT,
        ""
      ),
      accountStatus: normalizeArray(
        details.callDetails?.accountStatus,
        MORTGAGE_CALL_COUNT,
        ""
      ),
      dateOfCall: normalizeArray(
        details.callDetails?.dateOfCall,
        MORTGAGE_CALL_COUNT,
        ""
      ),
      callDuration: normalizeArray(
        details.callDetails?.callDuration,
        MORTGAGE_CALL_COUNT,
        ""
      ),
      agentName: normalizeArray(
        details.callDetails?.agentName,
        MORTGAGE_CALL_COUNT,
        ""
      ),
    };

    const callTotals = normalizeArray(
      details.callTotals,
      MORTGAGE_CALL_COUNT,
      0
    );
    const withContactStates = normalizeArray(
      details.withContactStates,
      MORTGAGE_CALL_COUNT,
      true
    );
    const callCommentsRaw = normalizeArray<CallComment>(
      details.callComments,
      MORTGAGE_CALL_COUNT,
      {
        agent: "",
        evaluator: "",
        action: "",
        tl: "",
        actionPlan: "",
      }
    );

    const normalizedCallComments = callCommentsRaw.map((comment) => ({
      agent: comment?.agent ?? "",
      evaluator: comment?.evaluator ?? comment?.tl ?? "",
      action: comment?.action ?? comment?.actionPlan ?? "",
    }));
    const questionResponses = details.questionResponses ?? {};

    const getQuestionValues = (questionId: string) =>
      normalizeArray(questionResponses[questionId], MORTGAGE_CALL_COUNT, 0);

    const renderQuestionMatrix = (
      title: string,
      rows: Array<{ label: string; questionId: string }>
    ) => (
      <div className="flex flex-col mt-2">
        <div className="font-black bg-gray-300 rounded-t-md py-1 w-full border-x border-t text-center uppercase text-xl text-black">
          {title}
        </div>
        <div className="border border-black rounded-b-md overflow-auto bg-white">
          <div className="grid grid-cols-12 text-[11px] md:text-xs font-black uppercase bg-gray-200 text-black border-b">
            <div className="px-2 py-2 border-r border-black col-span-2">
              Criteria
            </div>
            {Array.from({ length: MORTGAGE_CALL_COUNT }).map((_, idx) => (
              <div
                key={`${title}-call-${idx}`}
                className="px-2 py-2 text-center last:border-r-0 border-r border-black"
              >
                Call {idx + 1}
              </div>
            ))}
          </div>
          {rows.map((row, rowIdx) => {
            const values = getQuestionValues(row.questionId);
            return (
              <div
                key={`${title}-row-${rowIdx}`}
                className={`grid grid-cols-12 border-b last:border-b-0 h-full text-[11px] md:text-xs items-center ${
                  rowIdx % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                }`}
              >
                <div className="px-2  py-2 border-r border-black col-span-2 text-black font-semibold">
                  {row.label}
                </div>
                {values.map((val, idx) => (
                  <div
                    key={`${row.questionId}-val-${idx}`}
                    className={`" ${
                      val ? "bg-red-400" : ""
                    } px-2 items-center flex justify-center py-2 h-full text-center border-r last:border-r-0 border-black font-black "`}
                  >
                    {val === 0 ? "" : val}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );

    const callScores = computeMortgageCallScores(callTotals);

    const hasComments = normalizedCallComments.some(
      (comment) => comment.agent || comment.evaluator || comment.action
    );

    return (
      <div className="mt-2 flex flex-col">
        <div className="font-black bg-gray-300 rounded-t-md py-1 w-full border-x border-t text-center uppercase text-xl text-black">
          Call Details
        </div>
        <div className="overflow-auto rounded-b-md border border-black bg-gray-50">
          <div className="grid grid-cols-10 border-b gap-2 px-3 py-2 text-xs font-black uppercase bg-gray-200 text-black">
            <div>Call #</div>
            <div className="truncate" title="Account name">
              Account Name
            </div>
            <div>Loan #</div>
            <div>Status</div>
            <div>Date</div>
            <div>Duration</div>
            <div>Agent</div>
            <div className="text-center truncate" title="With contact">
              With Contact
            </div>
            <div className="text-center">Defects</div>
            <div className="text-center">Score</div>
          </div>
          <div className="divide-y">
            {callTotals.map((total, idx) => (
              <div
                key={`mortgage-call-${idx}`}
                className="grid grid-cols-10 gap-2 px-3 py-2 text-xs md:text-sm odd:bg-white even:bg-gray-100 items-center"
              >
                <div className="font-black text-gray-900">Call {idx + 1}</div>
                <div
                  className="truncate first-letter:uppercase"
                  title={callDetails.accountName[idx]}
                >
                  {callDetails.accountName[idx] || (
                    <div className="text-xs text-gray-400 italic truncate">
                      No account
                    </div>
                  )}
                </div>
                <div className="truncate" title={callDetails.loanNo[idx]}>
                  {callDetails.loanNo[idx] || (
                    <div className="text-xs text-gray-400 italic truncate">
                      No loan number
                    </div>
                  )}
                </div>
                <div
                  className="truncate"
                  title={callDetails.accountStatus[idx]}
                >
                  {callDetails.accountStatus[idx] || (
                    <div className="text-xs text-gray-400 italic truncate">
                      No status
                    </div>
                  )}
                </div>
                <div className="truncate" title={callDetails.dateOfCall[idx]}>
                  {formatDate(callDetails.dateOfCall[idx]) === "-" ? (
                    <div className="text-xs text-gray-400 italic truncate">
                      No date
                    </div>
                  ) : (
                    callDetails.dateOfCall[idx]
                  )}
                </div>
                <div className="truncate" title={callDetails.callDuration[idx]}>
                  {callDetails.callDuration[idx] || (
                    <div className="text-xs text-gray-400 italic truncate">
                      No duration
                    </div>
                  )}
                </div>
                <div className="truncate" title={callDetails.agentName[idx]}>
                  {callDetails.agentName[idx] || "-"}
                </div>
                <div
                  className={`" ${
                    withContactStates[idx]
                      ? " bg-green-600 border-green-900"
                      : " bg-red-600 border-red-900"
                  } text-white rounded-sm shadow-md py-1 border-2 text-center font-black "`}
                >
                  {withContactStates[idx] ? "YES" : "NO"}
                </div>
                <div className="text-center font-black">{total ?? 0}</div>
                <div className="text-center font-black">
                  {callScores[idx]?.toFixed(1) ?? "-"}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {renderQuestionMatrix("A. Opening", [
          {
            label:
              "Used appropriate greeting / identified self and agency (full name)",
            questionId: "opening-1",
          },
          {
            label: "Mentioned OSP (authorized Service Provider of UB)",
            questionId: "opening-2",
          },
          { label: "Mentioned line is recorded", questionId: "opening-3" },
          {
            label:
              "Mentioned client/authorized rep full name or asked correct identifiers",
            questionId: "opening-4",
          },
          {
            label: "Agent confirmed speaking to client (explicit YES)",
            questionId: "opening-5",
          },
        ])}

        {renderQuestionMatrix(
          "B. Collection Call Proper - With Contact (Rapport / Empathy / Courtesy)",
          [
            {
              label: "Explained status of the account",
              questionId: "with-contact-1",
            },
            {
              label: "Asked if CH received demand/notification letter",
              questionId: "with-contact-2",
            },
            {
              label: "Showed empathy and compassion as appropriate",
              questionId: "with-contact-3",
            },
          ]
        )}

        {renderQuestionMatrix(
          "B. Collection Call Proper - With Contact (Listening Skills)",
          [
            {
              label: "Sought RFD/RFBP",
              questionId: "with-contact-4",
            },
          ]
        )}

        {renderQuestionMatrix(
          "B. Collection Call Proper - With Contact (Negotiation Skills)",
          [
            {
              label: "Explained consequences of non-payment (legal/BAP/etc.)",
              questionId: "with-contact-5",
            },
            {
              label: "Asked for client's capacity to pay",
              questionId: "with-contact-6",
            },
            {
              label: "Followed hierarchy of negotiation",
              questionId: "with-contact-7",
            },
          ]
        )}

        {renderQuestionMatrix(
          "B. Collection Call Proper - With Contact (Offering Solutions)",
          [
            {
              label: "Offered discount/amnesty/promo",
              questionId: "with-contact-8",
            },
            {
              label: "Advised CH to source out funds",
              questionId: "with-contact-9",
            },
          ]
        )}

        {renderQuestionMatrix("B. Collection Call Proper - Without Contact", [
          {
            label: "Probed on BTC/ETA/other contact numbers",
            questionId: "without-contact-1",
          },
          {
            label: "Used time schedule and follow-up",
            questionId: "without-contact-2",
          },
          {
            label: "Asked for name of party, relation to client",
            questionId: "without-contact-3",
          },
          {
            label: "Left URGENT message with correct contact number",
            questionId: "without-contact-4",
          },
        ])}

        {renderQuestionMatrix(
          "B. Collection Call Proper - With or Without Contact (Quality of Call)",
          [
            {
              label: "Used professional tone of voice",
              questionId: "with-or-without-1",
            },
            {
              label:
                "No unacceptable words/phrases; maintained polite language",
              questionId: "with-or-without-2",
            },
            {
              label: "Updated correct information/payment details on log",
              questionId: "with-or-without-3",
            },
            {
              label: "Adherence to policy (BSP, Code of Conduct, etc.)",
              questionId: "with-or-without-4",
            },
            {
              label: "Integrity issues (no unauthorized collection)",
              questionId: "with-or-without-5",
            },
            {
              label:
                "Exercised sound judgment for appropriate course of action",
              questionId: "with-or-without-6",
            },
          ]
        )}

        {renderQuestionMatrix("C. Closing the Call", [
          { label: "Summarized payment arrangement", questionId: "closing-1" },
          { label: "Offered online payment channels", questionId: "closing-2" },
          {
            label: "Requested return call for payment confirmation",
            questionId: "closing-3",
          },
        ])}

        {hasComments && (
          <div className="mt-2 shadow-md">
            <div className="font-black bg-gray-300 rounded-t-md py-1 w-full border text-center uppercase text-xl text-black">
              Call Comments
            </div>
            <div className="border-x border-b rounded-b-md border-black text-sm text-gray-700 bg-gray-50 divide-y">
              {normalizedCallComments.map((comment, idx) => (
                <div
                  key={`mortgage-comment-${idx}`}
                  className="px-3 py-2 flex flex-col gap-2 odd:bg-gray-100 even:bg-gray-200"
                >
                  <div className="font-semibold text-black">Call {idx + 1}</div>
                  <div className="flex flex-col gap-1">
                    <div>
                      <span className="font-semibold">Comments of Agent:</span>{" "}
                      {comment?.agent?.trim() || (
                        <span className="italic text-xs text-gray-400">
                          No comment
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">
                        Comments of Evaluator:
                      </span>{" "}
                      {comment.evaluator?.trim() || (
                        <span className="italic text-xs text-gray-400">
                          No comment
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">Action Plan:</span>{" "}
                      {comment.action?.trim() || (
                        <span className="italic text-xs text-gray-400">
                          No comment
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const closeModal = () => {
    setIsOpenDefaultScoreCard(false);
    setIsOpenEastwestScoreCard(false);
    setIsOpenUBScoreCard(false);
    setIsOpenUBMortgageScoreCard(false);
    setSelectedScoreCard(null);
  };

  console.log(selectedScoreCard?.typeOfScoreCard, "<<");

  const openScoreCardModal = (scoreCardType: string) => {
    const normalized = (scoreCardType || "").toLowerCase();
    if (normalized.includes("ub mortgage")) {
      setIsOpenDefaultScoreCard(false);
      setIsOpenEastwestScoreCard(false);
      setIsOpenUBScoreCard(false);
      setIsOpenUBMortgageScoreCard(true);
    } else if (scoreCardType === "UB Score Card") {
      setIsOpenDefaultScoreCard(false);
      setIsOpenEastwestScoreCard(false);
      setIsOpenUBScoreCard(true);
    } else if (scoreCardType === "Eastwest Score Card") {
      setIsOpenDefaultScoreCard(false);
      setIsOpenUBScoreCard(false);
      setIsOpenEastwestScoreCard(true);
    } else {
      setIsOpenUBScoreCard(false);
      setIsOpenEastwestScoreCard(false);
      setIsOpenUBMortgageScoreCard(false);
      setIsOpenDefaultScoreCard(true);
    }
  };

  const ratingFromScore = (score: number) => {
    if (score >= 100) return "EXCELLENT";
    if (score >= 90) return "SUPERIOR";
    if (score >= 80) return "ACCEPTABLE";
    return "UNACCEPTABLE";
  };

  const exportEastwestExcel = async (scoreCard: ScoreCardSummary) => {
    const details = extractEastwestDetails(scoreCard.scoreDetails);
    if (!details) {
      window.alert("Missing score details for this score card.");
      return;
    }

    const withContactSections = Array.isArray(details.withContact)
      ? details.withContact
      : [];
    const withoutContactSections = Array.isArray(details.withoutContact)
      ? details.withoutContact
      : [];

    const normalizeResponses = (sections: EastwestSection[]) =>
      sections.map((section) =>
        (section.questions ?? []).map((q) =>
          String(q.response ?? "YES")
            .toUpperCase()
            .startsWith("Y")
        )
      );

    const withContactResponses = normalizeResponses(withContactSections);
    const withoutContactResponses = normalizeResponses(withoutContactSections);

    const withContactCounts = withContactSections.map((s) => s.totalNo ?? 0);
    const withoutContactCounts = withoutContactSections.map(
      (s) => s.totalNo ?? 0
    );

    const withTotalsOverall =
      details.totals?.withContact ??
      withContactCounts.reduce((sum, val) => sum + (val || 0), 0);
    const withoutTotalsOverall =
      details.totals?.withoutContact ??
      withoutContactCounts.reduce((sum, val) => sum + (val || 0), 0);

    withContactCounts.push(withTotalsOverall ?? 0);
    withoutContactCounts.push(withoutTotalsOverall ?? 0);

    const finalScore = Number(
      details.totals?.finalScore ?? scoreCard.totalScore ?? 0
    );

    const acknowledgedBy = details.meta?.acknowledgedBy ?? "";
    const selectedAgentName =
      details.meta?.agent?.name ?? scoreCard.agent?.name ?? "Unknown Agent";
    const selectedEvaluatorName =
      details.meta?.evaluator?.name ?? scoreCard.qa?.name ?? "Unknown QA";
    const cardholder = details.meta?.cardholder ?? "";
    const accountNumber = details.meta?.accountNumber ?? scoreCard.number ?? "";
    const rateInput =
      details.meta?.enteredRate ?? details.meta?.enteredScore ?? "";
    const evaluatorRemarks = details.comments?.comments ?? "";
    const agentRemarks = details.comments?.highlights ?? "";

    const evaluationDate =
      details.meta?.evaluationDate || scoreCard.dateAndTimeOfCall;
    const todayLabel = evaluationDate
      ? new Date(evaluationDate).toLocaleDateString()
      : new Date().toLocaleDateString();

    const excelModule = await import("exceljs/dist/exceljs.min.js");
    const ExcelJS = excelModule.default ?? excelModule;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = selectedEvaluatorName || "QA";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Eastwest Score Card", {
      views: [{ showGridLines: false }],
    });

    const thinBorder = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
      diagonal: {},
    } as const;

    const thickBorder = {
      top: { style: "medium" },
      left: { style: "medium" },
      bottom: { style: "medium" },
      right: { style: "medium" },
      diagonal: {},
    } as const;

    const amberFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF00" },
    } as const;

    const solidGreenFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF548235" },
    } as const;

    const greenFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF70AD47" },
    } as const;

    const lightGreenFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFA9D08E" },
    } as const;

    const solidBlueFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00B0F0" },
    } as const;
    const blueFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF66CCFF" },
    } as const;

    const lightBlueFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" },
    } as const;

    const orangeFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7030A0" },
    } as const;

    const blackFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF000000" },
    } as const;

    const grayFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB0B0B0" },
    } as const;

    const applyBorder = (
      ws: any,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      border: any
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
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
      ws: any,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      outer: any,
      inner: any
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
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
      ws: any,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      fill: any
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
          ws.getCell(r, c).fill = fill;
        }
      }
    };

    const setFontColor = (
      ws: any,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      color: any,
      bold = false
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
          const cell = ws.getCell(r, c);
          cell.font = { ...(cell.font ?? {}), color, bold };
        }
      }
    };

    const centerCells = (
      ws: any,
      r1: number,
      r2: number,
      c1: number,
      c2: number
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
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
    worksheet.getCell("B5").value = selectedAgentName;
    worksheet.getCell("B6").value = selectedEvaluatorName;
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
      "Did the agent advise the third party or person talking to that the call was recorded?\t";
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
      "Did the agent  explain the consequences for non payment & urgency of the payment?\t";
    worksheet.mergeCells("A24:B24");
    worksheet.getCell("A24").value =
      "Did the agent secure PTP within the allowable grace period?\t";
    worksheet.mergeCells("A25:B25");
    worksheet.getCell("A25").value = "TOTAL";

    worksheet.mergeCells("A27:B27");
    worksheet.getCell("A27").value =
      "PRODUCT KNOWLEDGE/PROBLEM SOLVING SKILLS\t";

    worksheet.mergeCells("C27:D27");
    worksheet.getCell("C27").value = "DEFECT";
    centerCells(worksheet, 27, 27, 3, 4);

    worksheet.getCell("C28").value = "Y/N";
    worksheet.getCell("D28").value = "SCORE";
    worksheet.getCell("E28").value = "Tagging";
    centerCells(worksheet, 28, 28, 3, 5);

    worksheet.mergeCells("A29:B29");
    worksheet.getCell("A29").value =
      "Did the agent offer and appropriately discussed the applicable repayment program?\t";
    worksheet.mergeCells("A30:B30");
    worksheet.getCell("A30").value =
      "Did the agent accurately explain and compute applicable fees, charges or discount amount?\t";
    worksheet.mergeCells("A31:B31");
    worksheet.getCell("A31").value =
      "Did the agent address the concerns raised by the CH regarding his/her account?\t";
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
      "Did the agent  have a good control of the conversation?\t";
    worksheet.mergeCells("A37:B37");
    worksheet.getCell("A37").value =
      "Did the agent  communicate according to the cardholder's language of expertise? Avoided using jargon or technical terms that the customer wasn't familiar with.\t";
    worksheet.mergeCells("A38:B39");
    worksheet.getCell("A38").value =
      "Is the agent's tone of voice professional, not overly aggressive, non-confrontational, not sarcastic or condescending?";
    worksheet.mergeCells("A40:B40");
    worksheet.getCell("A40").value =
      "Did the agent demonstrate empathy and understanding of the customer's situation?";
    worksheet.mergeCells("A41:B41");
    worksheet.getCell("A41").value =
      "Did the agent conduct the call at a reasonable pace - neither rushed nor unnecessarily prolonged?\t";
    worksheet.mergeCells("A42:B42");
    worksheet.getCell("A42").value =
      "Did the agent record accurate and complete details of the conversation in the system?\t";
    worksheet.mergeCells("A43:B43");
    worksheet.getCell("A43").value =
      "Did the agent comply with EWBC Collection Agency Code of Conduct?\t";
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
      "Did the agent endorse the account for SKIPS and FV?\t\t";
    worksheet.mergeCells("H30:I30");
    worksheet.getCell("H30").value =
      "Did the agent have a good control of the conversation?\t";
    worksheet.mergeCells("H31:I31");
    worksheet.getCell("H31").value =
      "Is the agent's tone of voice professional, not overly aggressive, non-confrontational, not sarcastic or condescending?";
    applyBorderWithInner(worksheet, 29, 33, 8, 12, thickBorder, thinBorder);
    applyBorder(worksheet, 34, 34, 8, 10, thickBorder);
    worksheet.mergeCells("H32:I32");
    worksheet.getCell("H32").value =
      "Did the agent record accurate details of the conversation in the system?\t";
    worksheet.mergeCells("H33:I33");
    worksheet.getCell("H33").value =
      "Did the agent comply with EWBC Collection Agency Code of Conduct?\t";
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
      "Did the agent leave a message for a return call?\t";
    worksheet.mergeCells("H39:I39");
    worksheet.getCell("H39").value =
      "Did the agent ask the 3rd party to read back the number for return call?\t";
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
      selectedEvaluatorName || "No evulator selected";
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
    worksheet.getCell("H65").value = selectedAgentName || "No agent selected";
    worksheet.getCell("H65").alignment = {
      horizontal: "center",
    };
    worksheet.mergeCells("H66:L66");
    worksheet.getCell("H66").value = "Collector's Signature over printed name";
    worksheet.getCell("H66").alignment = {
      horizontal: "center",
    };
    applyBorder(worksheet, 65, 66, 8, 12, thinBorder);

    worksheet.getCell("A68").value = "VALIDATED (Y/N): ________";
    worksheet.getCell("A70").value = "AC'S COMMENTS:";

    applyBorder(worksheet, 58, 64, 8, 12, thinBorder);

    applyFill(worksheet, 78, 78, 9, 9, lightGreenFill);
    worksheet.getCell("H78").value = "Noted by:";
    worksheet.getCell("I78").value = acknowledgedBy || "No AC/RO assigned";

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
      sections: EastwestSection[],
      responses: boolean[][],
      yCol: number,
      scoreCol: number,
      tagCol: number
    ) => {
      rowsBySection.forEach((rows, sIdx) => {
        let noCount = 0;

        rows.forEach((row, qIdx) => {
          const section = sections[sIdx];
          const question = section?.questions?.[qIdx];
          if (!question) return;
          const isYes = responses?.[sIdx]?.[qIdx] ?? true;
          const score = isYes ? 0 : question.defaultScore ?? 0;
          if (!isYes) noCount += 1;
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

      worksheet.getCell(row, 10).value = withVal;
      const withoutCell = worksheet.getCell(row, 11);
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
    const withoutProdCell = worksheet.getCell(withoutProdRow, 11);
    withoutProdCell.value = "";
    withoutProdCell.fill = grayFill;
    withoutProdCell.alignment = {
      ...(withoutProdCell.alignment ?? {}),
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };

    const calibriAddresses = new Set(["A1", "I1"]);

    worksheet.eachRow({ includeEmpty: true }, (row: any) => {
      row.eachCell({ includeEmpty: true }, (cell: any) => {
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
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `eastwest-score-sheet-${Date.now()}.xlsx`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const exportUBMortgageExcel = async (scoreCard: ScoreCardSummary) => {
    if (!scoreCard.scoreDetails) {
      window.alert("Missing score details for this score card.");
      return;
    }

    const details = scoreCard.scoreDetails as any;
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

    const callDetails = {
      accountName: normalizeArray(
        details.callDetails?.accountName,
        MORTGAGE_CALL_COUNT,
        ""
      ),
      loanNo: normalizeArray(
        details.callDetails?.loanNo,
        MORTGAGE_CALL_COUNT,
        ""
      ),
      accountStatus: normalizeArray(
        details.callDetails?.accountStatus,
        MORTGAGE_CALL_COUNT,
        ""
      ),
      dateOfCall: normalizeArray(
        details.callDetails?.dateOfCall,
        MORTGAGE_CALL_COUNT,
        ""
      ),
      callDuration: normalizeArray(
        details.callDetails?.callDuration,
        MORTGAGE_CALL_COUNT,
        ""
      ),
      agentName: normalizeArray(
        details.callDetails?.agentName,
        MORTGAGE_CALL_COUNT,
        ""
      ),
    };

    const callNumbers = Array.from(
      { length: MORTGAGE_CALL_COUNT },
      (_, idx) => idx + 1
    );
    const callTotals = normalizeArray(
      details.callTotals,
      MORTGAGE_CALL_COUNT,
      0
    );
    const withContactStates = normalizeArray(
      details.withContactStates,
      MORTGAGE_CALL_COUNT,
      true
    );
    const callComments = normalizeArray(
      details.callComments,
      MORTGAGE_CALL_COUNT,
      {
        agent: "",
        evaluator: "",
        action: "",
      }
    );

    const questionResponses: Record<string, number[]> =
      details.questionResponses ?? {};
    const makeZeroArray = () =>
      Array.from({ length: MORTGAGE_CALL_COUNT }, () => 0);
    questionDefs.forEach((q) => {
      if (!questionResponses[q.id]) {
        questionResponses[q.id] = makeZeroArray();
      }
    });

    const callScores = computeMortgageCallScores(callTotals);
    const formattedMonthYear =
      scoreCard.month?.trim() ||
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(scoreCard.dateAndTimeOfCall || Date.now()));

    const excelModule = await import("exceljs/dist/exceljs.min.js");
    const ExcelJS = excelModule.default ?? excelModule;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Mortgage Scorecard", {
      views: [{ showGridLines: false }],
      properties: { defaultRowHeight: 20 },
    });

    const thinBorder: any = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
      diagonal: {},
    };

    const thickBorder: any = {
      top: { style: "medium" },
      left: { style: "medium" },
      bottom: { style: "medium" },
      right: { style: "medium" },
      diagonal: {},
    };

    const headerFill: any = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF9CA3AF" },
    };

    const goldAccentFill: any = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFEF3C7" },
    };

    const whiteFill: any = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };

    const applyBorder = (
      ws: any,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      border: any
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
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
      ws: any,
      r1: number,
      r2: number,
      col: number,
      style: any
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        const cell = ws.getCell(r, col);
        const existing = cell.border ?? {};
        cell.border = {
          ...existing,
          right: { style },
        };
      }
    };

    const applyTopBorder = (
      ws: any,
      r: number,
      c1: number,
      c2: number,
      style: any
    ) => {
      for (let c = c1; c <= c2; c += 1) {
        const cell = ws.getCell(r, c);
        const existing = cell.border ?? {};
        cell.border = {
          ...existing,
          top: { style },
        };
      }
    };

    const applyBottomBorder = (
      ws: any,
      r: number,
      c1: number,
      c2: number,
      style: any
    ) => {
      for (let c = c1; c <= c2; c += 1) {
        const cell = ws.getCell(r, c);
        const existing = cell.border ?? {};
        cell.border = {
          ...existing,
          bottom: { style },
        };
      }
    };

    const applyLeftBorder = (
      ws: any,
      r1: number,
      r2: number,
      col: number,
      style: any
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        const cell = ws.getCell(r, col);
        const existing = cell.border ?? {};
        cell.border = {
          ...existing,
          left: { style },
        };
      }
    };

    const applyMatrixBorders = (
      ws: any,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      outer: any,
      inner: any
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
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
      ws: any,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      fill: any
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
          ws.getCell(r, c).fill = fill;
        }
      }
    };

    worksheet.columns = [
      { width: 10 },
      { width: 50 },
      { width: 10 },
      { width: 14 },
      { width: 10 },
      { width: 14 },
      { width: 10 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ];

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
    worksheet.getCell("C4").value = scoreCard.agent?.name ?? "";

    worksheet.getCell("A5").value = "EVALUATOR:";
    worksheet.mergeCells("C5:E5");
    worksheet.getCell("C5").value = scoreCard.qa?.name ?? "";
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

    for (let i = 0; i < MORTGAGE_CALL_COUNT; i += 1) {
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
        label: "Mentioned (OSP mentioned - authorized Service Provider of UB)",
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
      { label: "Asked if CH received demand/ notification letter", defect: 1 },
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
      { label: "Asked for Client's capacity to pay, if applicable", defect: 1 },
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
      worksheet.getCell(69, col).value = withContactStates[idx] ? "YES" : "NO";
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
    const sanitizedAgent = (scoreCard.agent?.name ?? "agent").replace(
      /\s+/g,
      "-"
    );
    const timestamp = new Date().toISOString().replace(/[:]/g, "-");
    link.download = `ub-mortgage-${sanitizedAgent}-${timestamp}.xlsx`;
    link.click();
  };

  const exportUBExcel = async (scoreCard: ScoreCardSummary) => {
    if (!scoreCard.scoreDetails) {
      window.alert("Missing score details for this score card.");
      return;
    }

    const details: any = scoreCard.scoreDetails ?? {};

    const extractCalls = (value: any) =>
      normalizeArray(value?.calls ?? value, 5, 0);

    const opening = Array.isArray(details.opening) ? details.opening : [];
    const collectionProper = details.collectionCallProper ?? {};
    const withContact = collectionProper.withContact ?? {};
    const withoutContact = collectionProper.withoutContact ?? {};
    const withOrWithout = collectionProper.withOrWithoutContact ?? {};
    const closing = details.closing ?? details.closingTheCall ?? {};

    const questionCallValues: Record<string, number[]> = {
      "opening-greeting": extractCalls(opening[0]),
      "opening-disclaimer": extractCalls(opening[1]),
      "opening-recorded": extractCalls(opening[2]),
      "opening-fullname": extractCalls(opening[3]),
      "opening-selfid": extractCalls(opening[4]),
      "withContact-explainedStatus": extractCalls(
        withContact.establishingRapport?.explainedStatus
      ),
      "withContact-askedNotification": extractCalls(
        withContact.establishingRapport?.askedNotification
      ),
      "withContact-showedEmpathy": extractCalls(
        withContact.establishingRapport?.showedEmpathy
      ),
      "withContact-soughtRFD": extractCalls(
        withContact.listeningSkills?.soughtRFD
      ),
      "withContact-explainedConsequences": extractCalls(
        withContact.negotiationSkills?.explainedConsequences
      ),
      "withContact-askedCapacity": extractCalls(
        withContact.negotiationSkills?.askedCapacity
      ),
      "withContact-followedHierarchy": extractCalls(
        withContact.negotiationSkills?.followedHierarchy
      ),
      "withContact-offeredDiscount": extractCalls(
        withContact.offeringSolutions?.offeredDiscount
      ),
      "withContact-advisedSourceFunds": extractCalls(
        withContact.offeringSolutions?.advisedSourceFunds
      ),
      "withoutContact-probedContactNumbers": extractCalls(
        withoutContact.establishingRapport?.probedContactNumbers
      ),
      "withoutContact-usedTimeSchedule": extractCalls(
        withoutContact.establishingRapport?.usedTimeSchedule
      ),
      "withoutContact-askedPartyName": extractCalls(
        withoutContact.establishingRapport?.askedPartyName
      ),
      "withoutContact-leftUrgentMessage": extractCalls(
        withoutContact.establishingRapport?.leftUrgentMessage
      ),
      "withOrWithoutContact-professionalTone": extractCalls(
        withOrWithout.qualityOfCall?.professionalTone
      ),
      "withOrWithoutContact-politeLanguage": extractCalls(
        withOrWithout.qualityOfCall?.politeLanguage
      ),
      "withOrWithoutContact-updatedInfoSheet": extractCalls(
        withOrWithout.qualityOfCall?.updatedInfoSheet
      ),
      "withOrWithoutContact-adherenceToPolicy": extractCalls(
        withOrWithout.qualityOfCall?.adherenceToPolicy
      ),
      "withOrWithoutContact-gppIntegrityIssues": extractCalls(
        withOrWithout.qualityOfCall?.gppIntegrityIssues
      ),
      "withOrWithoutContact-soundJudgment": extractCalls(
        withOrWithout.qualityOfCall?.soundJudgment
      ),
      "closing-summarizedPayment": extractCalls(closing[0]),
      "closing-requestReturnCall": extractCalls(closing[1]),
    };

    const DEFECT_PENALTY_PERCENT = 5;
    const SCORE_FLOOR_PERCENT = 75;

    const callDefects = Array.from({ length: 5 }).map((_, callIdx) =>
      Object.values(questionCallValues)
        .map((arr) => arr[callIdx] ?? 0)
        .reduce((sum, value) => sum + value, 0)
    );

    const callScores = Array.from({ length: 5 }).map((_, callIdx) => {
      const totalDefectsForCall = callDefects[callIdx] ?? 0;
      const rawScore = Math.max(
        0,
        100 - totalDefectsForCall * DEFECT_PENALTY_PERCENT
      );
      return rawScore < SCORE_FLOOR_PERCENT ? 0 : rawScore;
    });

    const overallScore = callScores.length
      ? callScores.reduce((sum, value) => sum + value, 0) / callScores.length
      : 100;

    const monthLabel =
      scoreCard.month?.trim() ||
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(scoreCard.dateAndTimeOfCall || Date.now()));

    const agentLabel = scoreCard.agent?.name || "Unknown Agent";
    const evaluatorLabel = scoreCard.qa?.name || "Unknown Evaluator";

    const callComments = normalizeArray(details.callComments, 5, {
      agent: "",
      tl: "",
      actionPlan: "",
    });

    const callContactStatuses = normalizeArray(
      details.callContactStatuses ?? details.withContactStates,
      5,
      true
    );

    const excelModule = await import("exceljs/dist/exceljs.min.js");
    const ExcelJS = excelModule.default ?? excelModule;

    const thinBorder: any = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
      diagonal: {},
    };

    const thickBorder: any = {
      top: { style: "medium" },
      left: { style: "medium" },
      bottom: { style: "medium" },
      right: { style: "medium" },
      diagonal: {},
    };

    const applyBorder = (
      ws: any,
      r1: number,
      r2: number,
      c1: number,
      c2: number,
      border: any
    ) => {
      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
          const cell = ws.getCell(r, c);
          cell.border = border;
          cell.alignment = { wrapText: true, vertical: "middle" };
        }
      }
    };

    const headerCell = (cell: any) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D9D9D9" },
      };
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("UB Score Card", {
      views: [{ showGridLines: false }],
      properties: { defaultRowHeight: 22 },
    });

    worksheet.columns = [
      { width: 10 },
      { width: 4 },
      { width: 60 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 16 },
      { width: 10 },
    ];

    worksheet.mergeCells("A1:K1");
    const headerTitleCell = worksheet.getCell("A1");
    headerTitleCell.value = "COLLECTION CALL PERFORMANCE MONITOR";
    headerTitleCell.font = { bold: true, size: 12 };
    headerTitleCell.alignment = { horizontal: "center", vertical: "middle" };

    applyBorder(worksheet, 1, 1, 1, 11, thickBorder);

    worksheet.getCell("B2:C2").value = "For the month of";
    worksheet.getCell("D2").value = monthLabel;
    worksheet.getCell("B3:C3").value = "COLLECTION OFFICER:";
    worksheet.getCell("D3").value = agentLabel;
    worksheet.getCell("B4:C4").value = "EVALUATOR:";
    worksheet.getCell("D4").value = evaluatorLabel;

    worksheet.mergeCells(`H3:I3`);
    worksheet.getCell("H3:I3").border = { top: thinBorder.top };
    worksheet.getCell("J2").value = "(signature)";

    worksheet.mergeCells(`H4:I4`);
    worksheet.getCell("H4:I4").border = { top: thinBorder.top };
    worksheet.getCell("J3").value = "(signature)";

    worksheet.getRow(6).height = 28;
    worksheet.mergeCells("C6");
    worksheet.getCell("C6").value = "Account Name / Account Number";
    headerCell(worksheet.getCell("C6"));

    worksheet.mergeCells("E6:F6");
    worksheet.getCell("E6").value = "Date and Time of Call";
    headerCell(worksheet.getCell("E6"));

    worksheet.mergeCells("H6:I6");
    worksheet.getCell("H6").value = "Date of Logger Review";
    headerCell(worksheet.getCell("H6"));

    for (let i = 0; i < 5; i += 1) {
      worksheet.getCell(`A${7 + i}`).value = `Call ${i + 1}`;
    }

    worksheet.getCell("J6").value = "1st call";
    worksheet.getCell("K6").value = "Last call";

    worksheet.getCell("D13").value = "Defect";
    worksheet.getCell("E13").value = "Call 1";
    worksheet.getCell("F13").value = "Call 2";
    worksheet.getCell("G13").value = "Call 3";
    worksheet.getCell("H13").value = "Call 4";
    worksheet.getCell("I13").value = "Call 5";

    applyBorder(worksheet, 6, 11, 3, 3, thinBorder);
    applyBorder(worksheet, 6, 11, 5, 6, thinBorder);
    applyBorder(worksheet, 6, 11, 8, 9, thinBorder);
    applyBorder(worksheet, 6, 11, 10, 11, thinBorder);

    let row = 15;
    worksheet.mergeCells(`B14:I14`);
    worksheet.getCell(`B14`).value = "A. OPENING";
    headerCell(worksheet.getCell(`B14`));
    applyBorder(worksheet, 14, 14, 2, 8, thickBorder);

    worksheet.getRow(15).height = 10;
    const openingQuestions = [
      {
        label: "Used appropriate greeting / Identified self and Agency",
        defect: 2,
        key: "opening-greeting",
      },
      {
        label: "Mentioned UBP Disclaimer spiel",
        defect: 6,
        key: "opening-disclaimer",
      },
      {
        label: "Mentioned Line is Recorded",
        defect: 5,
        key: "opening-recorded",
      },
      {
        label:
          "Mentioned CH/ Valid CP/Y's Full Name for outgoing calls to a registered number.  Asked correct Positive Identifiers for incoming calls & calls to unregistered number.F",
        defect: 6,
        key: "opening-fullname",
      },
      {
        label: "Properly identified self (first & last name)",
        defect: 6,
        key: "opening-selfid",
      },
    ];

    openingQuestions.forEach(({ label, defect, key }) => {
      row += 1;
      worksheet.getCell(`C${row}`).value = label;
      worksheet.getCell(`D${row}`).value = defect;
      const callVals = questionCallValues[key] || [];
      for (let i = 0; i < 5; i += 1) {
        worksheet.getCell(row, 5 + i).value = callVals[i] ?? "";
      }
      applyBorder(worksheet, row, row, 3, 9, thinBorder);
    });

    let row2 = 25;
    worksheet.mergeCells(`B22:I22`);
    worksheet.getCell(`B22`).value = "B. COLLECTION CALL PROPER";
    headerCell(worksheet.getCell(`B22`));
    applyBorder(worksheet, 22, 22, 2, 8, thickBorder);

    worksheet.getRow(23).height = 10;
    worksheet.mergeCells("C24:I24");

    const withContactTitleCell = worksheet.getCell("C24");
    withContactTitleCell.value = "WITH CONTACT (A/Y)";
    withContactTitleCell.font = { bold: true };
    withContactTitleCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    for (let col = 3; col <= 8; col += 1) {
      worksheet.getCell(24, col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D9D9D9" },
      };
    }

    applyBorder(worksheet, 24, 24, 3, 8, thinBorder);

    worksheet.mergeCells(`C25:I25`);
    worksheet.getCell(`C25`).value = "ESTABLISHING RAPPORT, EMPATHY & COURTESY";
    applyBorder(worksheet, 25, 25, 3, 8, thinBorder);

    const withContactEstablishingRapport = [
      {
        label: "Explained the status of the account*",
        defect: 1,
        key: "withContact-explainedStatus",
      },
      {
        label: "Asked if CH received demand/ notification letter*",
        defect: 2,
        key: "withContact-askedNotification",
      },
      {
        label: "Showed empathy and compassion as appropriate.",
        defect: 2,
        key: "withContact-showedEmpathy",
      },
    ];
    withContactEstablishingRapport.forEach(({ label, defect, key }) => {
      row2 += 1;
      worksheet.getCell(`C${row2}`).value = label;
      worksheet.getCell(`D${row2}`).value = defect;
      const callVals = questionCallValues[key] || [];
      for (let i = 0; i < 5; i += 1) {
        worksheet.getCell(row2, 5 + i).value = callVals[i] ?? "";
      }
      applyBorder(worksheet, row2, row2, 3, 9, thinBorder);
    });

    worksheet.mergeCells(`C29:I29`);
    worksheet.getCell(`C29`).value = "LISTENING SKILLS";
    applyBorder(worksheet, 29, 29, 3, 8, thinBorder);
    const listeningSkills = [
      {
        label: "Sought RFD in payment & RFBP*",
        defect: 1,
        key: "withContact-soughtRFD",
      },
    ];

    let row3 = 29;
    listeningSkills.forEach(({ label, defect, key }) => {
      row3 += 1;
      worksheet.getCell(`C${row3}`).value = label;
      worksheet.getCell(`D${row3}`).value = defect;
      const callVals = questionCallValues[key] || [];
      for (let i = 0; i < 5; i += 1) {
        worksheet.getCell(row3, 5 + i).value = callVals[i] ?? "";
      }
      applyBorder(worksheet, row3, row3, 3, 9, thinBorder);
    });
    worksheet.mergeCells(`C31:I31`);
    worksheet.getCell(`C31`).value = "NEGOTIATION SKILLS";
    applyBorder(worksheet, 31, 31, 3, 8, thinBorder);
    const negotiationSkills = [
      {
        label:
          "Explained consequences of non-payment, if applicable (explained conseq of legal and BAP listing/explained side of the Bank and the contract signed/explained that the bank is serious in collecting legal obligations/possible negative listing of name/future credit facility will be closed/additional collection agency expenses/involvement of lawyer will also be CH's expense)*",
        defect: 1,
        key: "withContact-explainedConsequences",
      },
      {
        label: "Asked for CM's capacity to pay, if applicable*",
        defect: 1,
        key: "withContact-askedCapacity",
      },
      {
        label: "Followed hierarchy of negotiation*",
        defect: 1,
        key: "withContact-followedHierarchy",
      },
    ];
    let row4 = 31;
    negotiationSkills.forEach(({ label, defect, key }) => {
      row4 += 1;
      worksheet.getCell(`C${row4}`).value = label;
      worksheet.getCell(`D${row4}`).value = defect;
      const callVals = questionCallValues[key] || [];
      for (let i = 0; i < 5; i += 1) {
        worksheet.getCell(row4, 5 + i).value = callVals[i] ?? "";
      }
      applyBorder(worksheet, row4, row4, 3, 9, thinBorder);
    });

    worksheet.mergeCells(`C35:I35`);
    worksheet.getCell("C35").value = "OFFERING SOLUTIONS";
    applyBorder(worksheet, 35, 35, 3, 8, thinBorder);
    const offeringSolutions = [
      {
        label: "Offered discount/ amnesty/ promo*",
        defect: 1,
        key: "withContact-offeredDiscount",
      },
      {
        label: "Adviced CH to source out funds*",
        defect: 1,
        key: "withContact-advisedSourceFunds",
      },
    ];
    let row5 = 35;
    offeringSolutions.forEach(({ label, defect, key }) => {
      row5 += 1;
      worksheet.getCell(`C${row5}`).value = label;
      worksheet.getCell(`D${row5}`).value = defect;
      const callVals = questionCallValues[key] || [];
      for (let i = 0; i < 5; i += 1) {
        worksheet.getCell(row5, 5 + i).value = callVals[i] ?? "";
      }
      applyBorder(worksheet, row5, row5, 3, 9, thinBorder);
    });

    worksheet.mergeCells("C39:I39");
    worksheet.getCell("C39").value = "WITHOUT CONTACT";
    applyBorder(worksheet, 39, 39, 3, 8, thinBorder);

    worksheet.mergeCells("C40:I40");
    worksheet.getCell("C40").value = "ESTABLISHING RAPPORT, EMPATHY & COURTESY";
    applyBorder(worksheet, 40, 40, 3, 8, thinBorder);

    const withOutContactEREC = [
      {
        label: "Probed on BTC, ETA and other contact numbers",
        defect: 1,
        key: "withoutContact-probedContactNumbers",
      },
      {
        label: "Used time schedule and follow-up if applicable",
        defect: 1,
        key: "withoutContact-usedTimeSchedule",
      },
      {
        label: "Asked for name of party, relation to client",
        defect: 1,
        key: "withoutContact-askedPartyName",
      },
      {
        label: "Left URGENT message ang gave correct contact number",
        defect: 2,
        key: "withoutContact-leftUrgentMessage",
      },
    ];
    let row6 = 40;
    withOutContactEREC.forEach(({ label, defect, key }) => {
      row6 += 1;
      worksheet.getCell(`C${row6}`).value = label;
      worksheet.getCell(`D${row6}`).value = defect;
      const callVals = questionCallValues[key] || [];
      for (let i = 0; i < 5; i += 1) {
        worksheet.getCell(row6, 5 + i).value = callVals[i] ?? "";
      }
      applyBorder(worksheet, row6, row6, 3, 9, thinBorder);
    });

    worksheet.mergeCells("C46:I46");
    worksheet.getCell("C46").value = "WITH OR WITH OUT CONTACT";
    applyBorder(worksheet, 46, 46, 3, 8, thinBorder);
    worksheet.mergeCells("C47:I47");
    worksheet.getCell("C47").value = "QUALITY OF CALL";
    applyBorder(worksheet, 47, 47, 3, 8, thinBorder);

    const withOrWithoutContactEREC = [
      {
        label: "Used professional tone of voice (did not shout)",
        defect: 2,
        key: "withOrWithoutContact-professionalTone",
      },
      {
        label:
          "Did not use unacceptable words/phrases and maintained polite/civil language",
        defect: 6,
        key: "withOrWithoutContact-politeLanguage",
      },
      {
        label:
          "Updated correct information and payment details on info sheet, if applicable",
        defect: 3,
        key: "withOrWithoutContact-updatedInfoSheet",
      },
      {
        label: "Adherence to Policy(BSP, Code of Conduct, etc.)",
        defect: 6,
        key: "withOrWithoutContact-adherenceToPolicy",
      },
      {
        label:
          "GPP / INTEGRITY ISSUES (Revealed and Collected debt from unauthorized CP)",
        defect: 6,
        key: "withOrWithoutContact-gppIntegrityIssues",
      },
      {
        label:
          "Exercised sound judgment in determining the appropriate course of action.",
        defect: 6,
        key: "withOrWithoutContact-soundJudgment",
      },
    ];
    let row7 = 47;
    withOrWithoutContactEREC.forEach(({ label, defect, key }) => {
      row7 += 1;
      worksheet.getCell(`C${row7}`).value = label;
      worksheet.getCell(`D${row7}`).value = defect;
      const callVals = questionCallValues[key] || [];
      for (let i = 0; i < 5; i += 1) {
        worksheet.getCell(row7, 5 + i).value = callVals[i] ?? "";
      }
      applyBorder(worksheet, row7, row7, 3, 9, thinBorder);
    });

    worksheet.mergeCells(`B56:I56`);
    worksheet.getCell(`B56`).value = "C. CLOSING THE CALL";
    headerCell(worksheet.getCell(`B56`));
    applyBorder(worksheet, 56, 56, 2, 8, thickBorder);

    worksheet.getRow(57).height = 10;
    worksheet.mergeCells("C57:I57");

    const closingQuestions = [
      {
        label: "Summarized payment arrangement*",
        defect: 2,
        key: "closing-summarizedPayment",
      },
      {
        label: "Request return call for payment confirmation*",
        defect: 1,
        key: "closing-requestReturnCall",
      },
    ];
    let row8 = 57;
    closingQuestions.forEach(({ label, defect, key }) => {
      row8 += 1;
      worksheet.getCell(`C${row8}`).value = label;
      worksheet.getCell(`D${row8}`).value = defect;
      const callVals = questionCallValues[key] || [];
      for (let i = 0; i < 5; i += 1) {
        worksheet.getCell(row8, 5 + i).value = callVals[i] ?? "";
      }
      applyBorder(worksheet, row8, row8, 3, 9, thinBorder);
    });

    worksheet.getCell("C61").value = "WITH CONTACT? (Y/N)";
    worksheet.getCell("C62").value = "Total Defects";
    worksheet.getCell(`C63`).value = "Score";
    worksheet.mergeCells(`J61:J63`);
    worksheet.getCell(`J61`).value = `${overallScore.toFixed(2)}%`;

    worksheet.mergeCells("C61:D61");
    worksheet.mergeCells("C62:D62");
    worksheet.mergeCells("C63:D63");

    applyBorder(worksheet, 61, 63, 3, 4, thinBorder);
    applyBorder(worksheet, 61, 63, 10, 10, thickBorder);

    const contactRow = 61;
    callContactStatuses.slice(0, 5).forEach((status, index) => {
      const col = 5 + index;
      worksheet.getCell(contactRow, col).value = status ? "Y" : "N";
    });
    applyBorder(worksheet, contactRow, contactRow, 5, 9, thinBorder);

    const defectsRow = 62;
    callDefects.slice(0, 5).forEach((defects, index) => {
      const col = 5 + index;
      worksheet.getCell(defectsRow, col).value = defects;
    });
    applyBorder(worksheet, defectsRow, defectsRow, 5, 9, thinBorder);

    const scoresRow = 63;
    callScores.slice(0, 5).forEach((score, index) => {
      const col = 5 + index;
      worksheet.getCell(scoresRow, col).value = `${score.toFixed(2)}%`;
    });
    applyBorder(worksheet, scoresRow, scoresRow, 5, 9, thinBorder);

    worksheet.getCell("C65").value = "CALL 1 COMMENTS OF AGENT";

    worksheet.mergeCells(`M1:M85`);
    for (let r = 1; r <= 85; r += 1) {
      const cell = worksheet.getCell(r, 13);
      cell.border = { left: thickBorder.left };
      cell.alignment = { wrapText: true, vertical: "middle" };
    }

    worksheet.mergeCells(`A86:L86`);
    for (let c = 1; c <= 12; c += 1) {
      const cell = worksheet.getCell(86, c);
      cell.border = { top: thickBorder.top };
    }

    let commentRow = 65;
    for (let i = 0; i < 5; i += 1) {
      worksheet.getCell(`C${commentRow}`).value = `CALL ${
        i + 1
      } COMMENTS OF AGENT`;
      worksheet.mergeCells(`D${commentRow}:F${commentRow}`);
      worksheet.getCell(`D${commentRow}`).value = "COMMENTS OF AGENCY TL";
      worksheet.mergeCells(`G${commentRow}:I${commentRow}`);
      worksheet.getCell(`G${commentRow}`).value = "ACTION PLAN";
      applyBorder(worksheet, commentRow, commentRow, 3, 9, thickBorder);

      const agentComment = callComments[i]?.agent || "";
      const tlComment = callComments[i]?.tl || "";
      const actionPlanComment = callComments[i]?.actionPlan || "";

      worksheet.mergeCells(`D${commentRow + 1}:F${commentRow + 2}`);
      worksheet.mergeCells(`G${commentRow + 1}:I${commentRow + 2}`);
      worksheet.mergeCells(`C${commentRow + 1}:C${commentRow + 2}`);
      worksheet.getCell(`C${commentRow + 1}`).value = agentComment;
      worksheet.getCell(`D${commentRow + 1}`).value = tlComment;
      worksheet.getCell(`G${commentRow + 1}`).value = actionPlanComment;
      applyBorder(worksheet, commentRow + 1, commentRow + 2, 3, 9, thickBorder);

      commentRow += 4;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const sanitizedAgent = (scoreCard.agent?.name ?? "agent").replace(
      /\s+/g,
      "-"
    );
    const timestamp = new Date().toISOString().replace(/[:]/g, "-");
    link.download = `ub-score-card-${sanitizedAgent}-${timestamp}.xlsx`;
    link.click();
  };

  const handleExportExcel = async () => {
    if (!selectedScoreCard || isExportingExcel) {
      if (!selectedScoreCard) {
        window.alert("Select a score card to export.");
      }
      return;
    }

    const normalizedType = (
      selectedScoreCard.typeOfScoreCard || ""
    ).toLowerCase();
    if (normalizedType.includes("ub mortgage")) {
      try {
        setIsExportingExcel(true);
        await exportUBMortgageExcel(selectedScoreCard);
      } catch (error) {
        console.error("Failed to export UB Mortgage score card", error);
        window.alert(
          "Unable to export this score card right now. Please try again."
        );
      } finally {
        setIsExportingExcel(false);
      }
      return;
    }

    if (normalizedType.includes("ub score")) {
      try {
        setIsExportingExcel(true);
        await exportUBExcel(selectedScoreCard);
      } catch (error) {
        console.error("Failed to export UB score card", error);
        window.alert(
          "Unable to export this score card right now. Please try again."
        );
      } finally {
        setIsExportingExcel(false);
      }
      return;
    }

    if (normalizedType.includes("eastwest")) {
      try {
        setIsExportingExcel(true);
        await exportEastwestExcel(selectedScoreCard);
      } catch (error) {
        console.error("Failed to export Eastwest score card", error);
        window.alert(
          "Unable to export this score card right now. Please try again."
        );
      } finally {
        setIsExportingExcel(false);
      }
      return;
    }

    const agentName = selectedScoreCard.agent?.name || "Unknown Agent";
    const qaName = selectedScoreCard.qa?.name || "Unknown QA";
    const callDate = selectedScoreCard.dateAndTimeOfCall;
    const parsedDate = callDate ? new Date(callDate) : null;
    const monthLabel =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleString(undefined, { month: "long" })
        : "";
    const recordedMonth = selectedScoreCard.month?.trim();
    const monthDisplay = recordedMonth || monthLabel || "N/A";
    const departmentName = selectedScoreCard.department?.name || "N/A";
    const callNumber = selectedScoreCard.number?.trim() || "N/A";
    const highlightValue =
      selectedScoreCard.scoreDetails?.comments?.highlights?.trim() || "N/A";
    const opportunityValue =
      selectedScoreCard.scoreDetails?.comments?.comments?.trim() || "N/A";
    const criteriaRows = buildExcelCriteriaRows(selectedScoreCard.scoreDetails);
    const numericTotalScore =
      typeof selectedScoreCard.totalScore === "number"
        ? selectedScoreCard.totalScore
        : Number(selectedScoreCard.totalScore ?? 0) || 0;
    const scoreExceeded = numericTotalScore > 100;

    try {
      setIsExportingExcel(true);
      const excelModule = await import("exceljs/dist/exceljs.min.js");
      const ExcelJS = excelModule.default ?? excelModule;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = qaName;
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("QA Score Card", {
        properties: { defaultRowHeight: 22 },
        views: [{ showGridLines: false }],
        pageSetup: {
          fitToWidth: 1,
          orientation: "portrait",
          margins: {
            left: 0.4,
            right: 0.4,
            top: 0.4,
            bottom: 0.4,
            header: 0.2,
            footer: 0.2,
          },
        },
      });

      worksheet.columns = [
        { key: "colA", width: 3 },
        { key: "colB", width: 12 },
        { key: "colC", width: 12 },
        { key: "colD", width: 10 },
        { key: "colE", width: 10 },
        { key: "colF", width: 10 },
        { key: "colG", width: 10 },
        { key: "colH", width: 10 },
        { key: "colI", width: 10 },
        { key: "colJ", width: 10 },
        { key: "colK", width: 7 },
      ];

      const brandBlue = "FF2F5597";
      const headerBlue = "FF366092";
      const lightBlue = "FFE6EEF8";
      const tableLight = "FFF2F6FB";
      const borderColor = "000";
      const white = "FFFFFFFF";
      const borderTemplate = {
        style: "thin" as const,
        color: { argb: borderColor },
      };
      const thickBorderTemplate = {
        style: "medium" as const,
        color: { argb: borderColor },
      };
      const whiteBorderTemplate = {
        style: "thin" as const,
        color: { argb: white },
      };
      const applyBorder = (cell: any) => {
        cell.border = {
          top: borderTemplate,
          left: borderTemplate,
          bottom: borderTemplate,
          right: borderTemplate,
        };
      };
      const applyBorderRange = (
        startRow: number,
        endRow: number,
        startCol: number,
        endCol: number
      ) => {
        for (let row = startRow; row <= endRow; row += 1) {
          for (let col = startCol; col <= endCol; col += 1) {
            applyBorder(worksheet.getCell(row, col));
          }
        }
      };
      const applyOuterBorder = (
        startRow: number,
        endRow: number,
        startCol: number,
        endCol: number,
        template = thickBorderTemplate
      ) => {
        for (let row = startRow; row <= endRow; row += 1) {
          for (let col = startCol; col <= endCol; col += 1) {
            const cell = worksheet.getCell(row, col);
            const existingBorder = cell.border ?? {};
            const newBorder = { ...existingBorder };
            if (row === startRow) {
              newBorder.top = template;
            }
            if (row === endRow) {
              newBorder.bottom = template;
            }
            if (col === startCol) {
              newBorder.left = template;
            }
            if (col === endCol) {
              newBorder.right = template;
            }
            cell.border = newBorder;
          }
        }
      };
      const applyColumnBorder = (
        startRow: number,
        endRow: number,
        column: number,
        side: "left" | "right",
        template = thickBorderTemplate
      ) => {
        for (let row = startRow; row <= endRow; row += 1) {
          const cell = worksheet.getCell(row, column);
          const existingBorder = cell.border ?? {};
          cell.border = {
            ...existingBorder,
            [side]: template,
          };
        }
      };

      try {
        const logoResponse = await fetch("/bernalesLogo.png");
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer();
          const logoId = workbook.addImage({
            buffer: new Uint8Array(logoBuffer),
            extension: "png",
          });
          worksheet.addImage(logoId, {
            tl: { col: 1, row: 0.2 },
            ext: { width: 300, height: 110 },
          });
        }
      } catch (logoError) {
        console.warn("Unable to load logo for Excel export", logoError);
      }

      worksheet.mergeCells("B5:G5");
      const titleCell = worksheet.getCell("B5");
      titleCell.value = "QA Evaluation Form";
      titleCell.font = { name: "Calibri", bold: true, size: 14 };
      titleCell.alignment = { horizontal: "left", vertical: "middle" };

      const infoRowsStart = 6;
      const infoRows: Array<[string, string]> = [
        ["Month", monthDisplay],
        ["Name", agentName],
        ["Department", departmentName],
        ["Date and Time of Call", formatCallDateTime(callDate)],
        ["Number", callNumber],
        ["Assigned QA", qaName],
      ];

      infoRows.forEach(([label, value], index) => {
        const rowIndex = infoRowsStart + index;
        const valueRanges = `B${rowIndex}:C${rowIndex}`;
        worksheet.mergeCells(valueRanges);
        const labelCell = worksheet.getCell(`B${rowIndex}`);
        labelCell.value = label;
        labelCell.font = { bold: false, color: { argb: white } };
        labelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: brandBlue },
        };
        labelCell.alignment = { horizontal: "left", vertical: "middle" };
        const valueRange = `D${rowIndex}:G${rowIndex}`;
        worksheet.mergeCells(valueRange);
        const valueCell = worksheet.getCell(`D${rowIndex}`);
        valueCell.value = value;
        valueCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: white },
        };
        valueCell.alignment = { horizontal: "left", vertical: "middle" };
        applyBorderRange(rowIndex, rowIndex, 2, 7);
      });
      applyOuterBorder(
        infoRowsStart,
        infoRowsStart + infoRows.length - 1,
        2,
        7
      );

      worksheet.mergeCells("H6:H12");
      const totalLabelCells = worksheet.getCell("H6");
      totalLabelCells.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF" },
      };
      totalLabelCells.alignment = { horizontal: "center", vertical: "middle" };
      totalLabelCells.border = {
        top: whiteBorderTemplate,
        left: whiteBorderTemplate,
        bottom: whiteBorderTemplate,
        right: whiteBorderTemplate,
      };

      worksheet.mergeCells("L1:L41");
      const rightBorderCell = worksheet.getCell("L1");
      rightBorderCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF" },
      };
      rightBorderCell.alignment = { horizontal: "center", vertical: "middle" };
      rightBorderCell.border = {
        left: thickBorderTemplate,
      };

      worksheet.mergeCells("A42:K42");
      const footerBorderCell = worksheet.getCell("A42");
      footerBorderCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF" },
      };
      footerBorderCell.alignment = { horizontal: "center", vertical: "middle" };
      footerBorderCell.border = {
        top: thickBorderTemplate,
      };

      worksheet.mergeCells("I6:J7");
      const totalLabelCell = worksheet.getCell("I6");
      totalLabelCell.value = "Total Score";
      totalLabelCell.font = { bold: false, color: { argb: white }, size: 12 };
      totalLabelCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: headerBlue },
      };
      totalLabelCell.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("I8:J11");
      const totalScoreCell = worksheet.getCell("I8");
      totalScoreCell.value = scoreExceeded ? "Check Score" : numericTotalScore;
      totalScoreCell.font = {
        bold: true,
        size: 26,
        color: { argb: brandBlue },
      };
      totalScoreCell.alignment = { horizontal: "center", vertical: "middle" };
      totalScoreCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEDF2FA" },
      };
      applyBorderRange(6, 11, 9, 10);
      applyOuterBorder(6, 11, 9, 10);

      const criteriaHeaderRow = infoRowsStart + infoRows.length + 1;
      const headerRowEnd = criteriaHeaderRow + 1;
      const headerRanges: Array<{ range: string; label: string }> = [
        { range: `B${criteriaHeaderRow}:C${headerRowEnd}`, label: "Criteria" },
        { range: `D${criteriaHeaderRow}:G${headerRowEnd}`, label: "Category" },
        { range: `H${criteriaHeaderRow}:H${headerRowEnd}`, label: "Scores" },
        { range: `I${criteriaHeaderRow}:I${headerRowEnd}`, label: "Points" },
        {
          range: `J${criteriaHeaderRow}:J${headerRowEnd}`,
          label: "Missed Guideline",
        },
      ];
      headerRanges.forEach(({ range, label }) => {
        worksheet.mergeCells(range);
        const [startCell] = range.split(":");
        const cell = worksheet.getCell(startCell);
        cell.value = label;
        cell.font = { bold: false, color: { argb: white } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: headerBlue },
        };
        cell.border = { size: 10, color: { argb: borderColor } };
        applyBorder(cell);
      });
      applyBorderRange(criteriaHeaderRow, headerRowEnd, 2, 10);

      const highlightRowValue = `Highlights: ${highlightValue}`;
      const opportunityRowValue = `Opportunity: ${opportunityValue}`;
      const commentRows: Array<Array<string | number>> = [
        ["Comments", highlightRowValue, "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", opportunityRowValue, "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
      ];
      criteriaRows.push(...commentRows);
      const firstDataRow = headerRowEnd + 1;
      const criteriaTableEndRow = firstDataRow + criteriaRows.length - 1;
      const sectionRanges: Array<{
        label: string;
        startRow: number;
        endRow: number;
        fillColor: string;
      }> = [];
      let currentSectionIndex: number | null = null;
      const commentStartRow =
        firstDataRow + criteriaRows.length - commentRows.length;
      criteriaRows.forEach((rowValues, index) => {
        const excelRowIndex = firstDataRow + index;
        const rowColor = index % 2 === 0 ? tableLight : lightBlue;
        const [
          criteriaLabel,
          categoryLabel,
          scoreValue,
          pointValue,
          missedValue,
        ] = rowValues;
        const isCommentRow = excelRowIndex >= commentStartRow;
        if (typeof criteriaLabel === "string" && criteriaLabel) {
          sectionRanges.push({
            label: criteriaLabel,
            startRow: excelRowIndex,
            endRow: excelRowIndex,
            fillColor: rowColor,
          });
          currentSectionIndex = sectionRanges.length - 1;
        } else if (currentSectionIndex !== null) {
          sectionRanges[currentSectionIndex].endRow = excelRowIndex;
        }

        if (!isCommentRow) {
          worksheet.mergeCells(`D${excelRowIndex}:G${excelRowIndex}`);
          const categoryCell = worksheet.getCell(`D${excelRowIndex}`);
          categoryCell.value = categoryLabel ?? "";
          categoryCell.alignment = {
            horizontal: "left",
            vertical: "middle",
            wrapText: true,
          };
          categoryCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: rowColor },
          };

          const scoreCell = worksheet.getCell(`H${excelRowIndex}`);
          scoreCell.value = scoreValue ?? "";
          scoreCell.alignment = { horizontal: "center", vertical: "middle" };
          scoreCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: rowColor },
          };

          const pointsCell = worksheet.getCell(`I${excelRowIndex}`);
          pointsCell.value = pointValue ?? "";
          pointsCell.alignment = { horizontal: "center", vertical: "middle" };
          pointsCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: rowColor },
          };

          const missedCell = worksheet.getCell(`J${excelRowIndex}`);
          missedCell.value = missedValue ?? "";
          missedCell.alignment = {
            horizontal: "left",
            vertical: "middle",
            wrapText: true,
          };
          missedCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: rowColor },
          };
        }

        applyBorderRange(excelRowIndex, excelRowIndex, 2, 10);
      });

      sectionRanges.forEach(({ label, startRow, endRow, fillColor }) => {
        const mergedRange = `B${startRow}:C${endRow}`;
        worksheet.mergeCells(mergedRange);
        const criteriaCell = worksheet.getCell(`B${startRow}`);
        criteriaCell.value = label;
        criteriaCell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        criteriaCell.font = { bold: true };
        criteriaCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: fillColor },
        };
        applyBorderRange(startRow, endRow, 2, 3);
      });

      const highlightStartRow = commentStartRow;
      const highlightEndRow = highlightStartRow + 2;
      const opportunityStartRow = highlightEndRow + 1;
      const opportunityEndRow = opportunityStartRow + 2;
      const commentBlocks = [
        {
          value: highlightRowValue,
          startRow: highlightStartRow,
          endRow: highlightEndRow,
        },
        {
          value: opportunityRowValue,
          startRow: opportunityStartRow,
          endRow: opportunityEndRow,
        },
      ];
      commentBlocks.forEach(({ value, startRow, endRow }) => {
        for (let row = startRow; row <= endRow; row += 1) {
          ["D", "E", "F", "G", "H", "I", "J"].forEach((col) => {
            worksheet.getCell(`${col}${row}`).value = undefined;
          });
        }
        worksheet.mergeCells(`D${startRow}:J${endRow}`);
        const blockCell = worksheet.getCell(`D${startRow}`);
        blockCell.value = value;
        blockCell.alignment = {
          horizontal: "left",
          vertical: "top",
          wrapText: true,
        };
        blockCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: tableLight },
        };
        applyBorderRange(startRow, endRow, 4, 10);
      });

      applyColumnBorder(firstDataRow, criteriaTableEndRow, 4, "left");
      sectionRanges.forEach(({ startRow, endRow }) => {
        applyOuterBorder(startRow, endRow, 2, 10);
      });

      applyOuterBorder(criteriaHeaderRow, criteriaTableEndRow, 2, 10);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const sanitizedAgent = agentName.replace(/\s+/g, "-").toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:]/g, "-");
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `score-card-${
        sanitizedAgent || "agent"
      }-${timestamp}.xlsx`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to export score card", error);
      window.alert(
        "Unable to export this score card right now. Please try again."
      );
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="p-10 flex w-full h-[90%] relative gap-2">
      <motion.div
        className="w-[30%] bg-gray-100 overflow-hidden text-gray-700 border-black rounded-md shadow-md h-full border flex flex-col"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="border-b px-4 text-black py-3 text-2xl font-black uppercase text-center bg-gray-400">
          Overview
        </div>
        <div className="p-4 flex flex-col bg-gray-300 justify-evenly h-full gap-4 text-sm overflow-auto">
          <div className="bg-white h-full grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 border gap-2 border-black rounded-md shadow-sm p-2">
            <div className="text-xs border p-2 rounded-sm bg-gray-200 text-black flex justify-center flex-col">
              <div className="text-center">Total Default Score Card</div>
              <div className="text-4xl text-center font-black">
                {totalsByType.default}
              </div>
            </div>
            <div className="text-xs border p-2 rounded-sm bg-gray-200 text-black flex justify-center flex-col">
              <div className="text-center">Total Eastwest Score Card</div>
              <div className="text-4xl text-center font-black">
                {totalsByType.eastwest}
              </div>
            </div>
            <div className="text-xs border p-2 rounded-sm bg-gray-200 text-black flex justify-center flex-col">
              <div className="text-center">Total UB Cards Score Card</div>
              <div className="text-4xl text-center font-black">
                {totalsByType.ub}
              </div>
            </div>

            <div className="text-xs border p-2 rounded-sm bg-gray-200 text-black flex justify-center flex-col">
              <div className="text-center">Total UB Mortgage Score Card</div>
              <div className="text-4xl text-center font-black">
                {totalsByType.ubMortgage}
              </div>
            </div>
          </div>
          <div className="bg-white flex justify-between items-center border h-full border-black rounded-md shadow-sm p-4">
            <div className="uppercase font-black text-xl text-black">
              average score
            </div>
            <div className="text-4xl font-black text-black">
              {overviewStats.avgScore.toFixed(1)}
            </div>
          </div>
          <div className="bg-white flex justify-between items-center border h-full border-black rounded-md shadow-sm p-4">
            <div className="uppercase font-black text-xl text-black">
              highest score
            </div>
            <div className="text-4xl font-black text-black">
              {overviewStats.highestScore.toFixed(1)}
            </div>
          </div>
          <div className="bg-white flex justify-between items-center border h-full border-black rounded-md shadow-sm p-4">
            <div className="uppercase font-black text-xl text-black">
              lowest score
            </div>
            <div className="text-4xl font-black text-black">
              {overviewStats.lowestScore.toFixed(1)}
            </div>
          </div>

          <div className="bg-white flex justify-between items-center border h-full border-black rounded-md shadow-sm p-4">
            <div className="uppercase font-black text-xl text-black">
              pass rate
            </div>
            <div className="text-4xl font-black text-black">
              {overviewStats.passRate.toFixed(0)}%
            </div>
          </div>
          <div className="bg-white flex justify-between items-center border h-full border-black rounded-md shadow-sm p-4">
            <div className="uppercase font-black text-xl text-black">
              records shown
            </div>
            <div className="text-4xl font-black text-black">
              {filteredScorecards.length}
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="w-[70%] flex flex-col h-full bg-gray-300 overflow-hidden rounded-md shadow-md border"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
      >
        <div className="bg-gray-400 py-3  font-black uppercase text-center border-b text-2xl">
          Score card overview
        </div>
        <div className="p-3 flex h-full overflow-auto flex-col gap-2">
          <div className="flex justify-between gap-3 flex-wrap">
            <div className="border bg-gray-100 rounded-sm flex items-center px-3">
              <input
                className="text-shadow px-3 py-1 outline-none bg-transparent"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div
                className={typeButtonClass(
                  "default",
                  "font-black uppercase bg-green-600 border-2 border-green-900 text-white px-2 items-center flex rounded-md shadow-md cursor-pointer hover:bg-green-700"
                )}
                onClick={() => handleTypeClick("default")}
                title="Default Score Card"
              >
                SS
              </div>
              <div
                className={typeButtonClass(
                  "ub",
                  "font-black uppercase bg-amber-600 border-2 border-amber-900 text-white px-2 items-center flex rounded-md shadow-md cursor-pointer hover:bg-amber-700"
                )}
                onClick={() => handleTypeClick("ub")}
                title="UB Score Card"
              >
                UB
              </div>
              <div
                className={typeButtonClass(
                  "eastwest",
                  "font-black uppercase bg-blue-600 border-2 border-blue-900 text-white px-2 items-center flex rounded-md shadow-md cursor-pointer hover:bg-blue-700"
                )}
                onClick={() => handleTypeClick("eastwest")}
                title="Eastwest Score Card"
              >
                EW
              </div>
              <div
                className={typeButtonClass(
                  "ubMortgage",
                  "font-black uppercase bg-purple-600 border-2 outline-none border-purple-900 text-white px-2 items-center flex rounded-md shadow-md cursor-pointer hover:bg-purple-700"
                )}
                onClick={() => handleTypeClick("ubMortgage")}
                title="UB Mortgage Score Card"
              >
                UBM
              </div>

              <div className="border bg-gray-100 rounded-sm flex items-center px-3">
                <input
                  className="px-3 py-1 outline-none bg-transparent"
                  placeholder="Search..."
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="w-full border flex flex-col bg-gray-100 rounded-sm overflow-hidden">
            <div className="grid grid-cols-6  uppercase gap-4 p-3 font-black border-b bg-gray-200">
              <div>QA Name</div>
              <div>Agent Name</div>
              <div className="truncate">Score Sheet Type</div>
              <div>Date</div>
              <div className="text-center truncate">Total Score</div>
              <div className="text-center">Status</div>
            </div>
            {error && (
              <div className="flex justify-center items-center h-full text-red-600 font-semibold">
                {error.message}
              </div>
            )}
            {!error && (
              <div className="flex flex-col  overflow-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-full text-gray-500 italic">
                    Loading...
                  </div>
                ) : filteredScorecards.length === 0 ? (
                  <div className="flex justify-center items-center h-full py-2 text-gray-400">
                    No data available
                  </div>
                ) : (
                  <div className="flex flex-col divide-y overflow-auto">
                    {filteredScorecards.map((entry, index) => {
                      const badge = getStatusBadge(entry.totalScore);
                      const formattedDate = formatDate(
                        entry.createdAt || entry.dateAndTimeOfCall
                      );
                      return (
                        <motion.div
                          key={entry._id}
                          className="grid grid-cols-6 border-b  border-gray-300 hover:bg-gray-200 even:bg-gray-100 cursor-pointer odd:bg-white gap-4 px-4 py-3 text-sm items-center bg-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                          onClick={() => {
                            setSelectedScoreCard(entry);
                            openScoreCardModal(entry.typeOfScoreCard);
                          }}
                        >
                          <div className="font-semibold first-letter:uppercase text-gray-800">
                            {entry.qa?.name || "Unknown QA"}
                          </div>
                          <div className="font-semibold first-letter:uppercase text-gray-800">
                            {entry.agent?.name || "Unknown Agent"}
                          </div>
                          <div className="text-gray-700 font-medium">
                            {entry.typeOfScoreCard === "Default Score Card"
                              ? "Score Sheet"
                              : entry.typeOfScoreCard}
                          </div>
                          <div className="text-gray-700 font-medium">
                            {formattedDate}
                          </div>
                          <div className="text-center font-black text-xl text-gray-800">
                            {entry.totalScore != null
                              ? entry.totalScore.toFixed(1)
                              : "-"}
                          </div>
                          <div className="flex justify-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black uppercase ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {isOpenDefaultScoreCard && selectedScoreCard && (
          <motion.div
            className="absolute top-0 left-0 w-full items-center justify-center flex h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="w-full h-full  absolute items-center justify-center flex bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            ></div>
            <motion.div
              className="bg-white z-20 border flex flex-col relative rounded-md p-6 max-w-3xl  max-h-[80vh] "
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleExportExcel();
                }}
                disabled={isExportingExcel}
                className={`absolute bottom-2 cursor-pointer -right-14 flex items-center gap-2 px-3 py-2 border-2 rounded-sm font-black uppercase text-white transition ${
                  isExportingExcel
                    ? "bg-green-400 cursor-not-allowed border-green-700"
                    : "bg-green-600 hover:bg-green-700 border-green-800"
                }`}
                title="Export to Excel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4"
                >
                  <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                  <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleExportExcel();
                }}
                disabled={isExportingExcel}
                className={`absolute bottom-2 cursor-pointer -right-14 flex items-center gap-2 px-3 py-2 border-2 rounded-sm font-black uppercase text-white transition ${
                  isExportingExcel
                    ? "bg-green-400 cursor-not-allowed border-green-700"
                    : "bg-green-600 hover:bg-green-700 border-green-800"
                }`}
                title="Export to Excel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4"
                >
                  <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                  <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
              </button>

              <div className=" flex absolute top-2 -right-10 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1 transition-all shadow-md border-2 border-red-800 bg-red-600 hover:bg-red-700 cursor-pointer text-white rounded-full uppercase text-xs font-black"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col overflow-auto pr-2 h-full">
                <div className="flex mt-2 justify-between items-start gap-4 flex-wrap">
                  <div>
                    <div className="text-xl first-letter:uppercase font-black text-gray-900">
                      {selectedScoreCard.agent?.name || "Unknown Agent"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedScoreCard.typeOfScoreCard}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(selectedScoreCard.createdAt)}
                    </div>
                  </div>
                  <div className="text-right border overflow-hidden shadow-md flex flex-col justify-center  rounded-sm bg-gray-200">
                    <div className="text-3xl py-2 font-black text-center text-gray-900">
                      {selectedScoreCard.totalScore != null
                        ? selectedScoreCard.totalScore.toFixed(1)
                        : "-"}
                    </div>
                    <div className="text-xs border-t px-5 py-2 font-black bg-gray-400 text-black uppercase">
                      Total Score
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm text-gray-800">
                  <div>
                    <span className="font-black uppercase text-black">
                      Call Date:
                    </span>{" "}
                    {formatDate(selectedScoreCard.dateAndTimeOfCall)}
                  </div>
                  <div>
                    <span className="font-black uppercase text-black">
                      Scorecard Type:
                    </span>{" "}
                    {selectedScoreCard.typeOfScoreCard}
                  </div>
                </div>

                {renderSection(
                  "Opening",
                  selectedScoreCard.scoreDetails?.opening
                )}
                {renderSection(
                  "Negotiation Skills",
                  selectedScoreCard.scoreDetails?.negotiationSkills
                )}
                {renderSection(
                  "Closing",
                  selectedScoreCard.scoreDetails?.closing
                )}
                {renderSection(
                  "Regulatory & Compliance",
                  selectedScoreCard.scoreDetails?.regulatoryAndCompliance
                )}

                {selectedScoreCard.scoreDetails?.comments && (
                  <div className="mt-2 shadow-md">
                    <div className="font-black bg-gray-300 rounded-t-md py-1 w-full border text-center uppercase text-xl text-black">
                      Comments
                    </div>
                    <div className="border-x border-b rounded-b-md border-black text-sm text-gray-700 space-y-2 bg-gray-50">
                      <div className="border-b px-3 py-2">
                        <span className="font-semibold ">Highlights:</span>{" "}
                        {selectedScoreCard.scoreDetails.comments?.highlights?.trim() ||
                          "-"}
                      </div>
                      <div className="px-3 py-2 ">
                        <span className="font-semibold">Comments:</span>{" "}
                        {selectedScoreCard.scoreDetails.comments?.comments?.trim() ||
                          "-"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpenEastwestScoreCard && selectedScoreCard && (
          <motion.div
            className="absolute top-0 left-0 w-full items-center justify-center flex h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="w-full h-full absolute items-center justify-center flex bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            ></div>

            <motion.div
              className="bg-white z-20 border flex flex-col relative rounded-md p-6 max-w-4xl max-h-[80vh] "
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleExportExcel();
                }}
                disabled={isExportingExcel}
                className={`absolute bottom-2 cursor-pointer -right-14 flex items-center gap-2 px-3 py-2 border-2 rounded-sm font-black uppercase text-white transition ${
                  isExportingExcel
                    ? "bg-green-400 cursor-not-allowed border-green-700"
                    : "bg-green-600 hover:bg-green-700 border-green-800"
                }`}
                title="Export to Excel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4"
                >
                  <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                  <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 transition-all shadow-md border-2 border-red-800 bg-red-600 hover:bg-red-700 cursor-pointer text-white rounded-full uppercase text-xs font-black absolute top-2 -right-10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="flex flex-col overflow-auto pr-2 h-full">
                <div className="flex mt-2 justify-between items-start gap-4 flex-wrap">
                  <div>
                    <div className="text-xl first-letter:uppercase font-black text-gray-900">
                      {selectedScoreCard.agent?.name || "Unknown Agent"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedScoreCard.typeOfScoreCard}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(selectedScoreCard.createdAt)}
                    </div>
                  </div>
                  <div className="text-right border overflow-hidden shadow-md flex flex-col justify-center rounded-sm bg-gray-200">
                    <div className="text-3xl py-2 font-black text-center text-gray-900">
                      {selectedScoreCard.totalScore != null
                        ? selectedScoreCard.totalScore.toFixed(1)
                        : "-"}
                    </div>
                    <div className="text-xs border-t px-5 py-2 font-black bg-gray-400 text-black uppercase">
                      Total Score
                    </div>
                  </div>
                </div>

                {renderEastwestMeta(
                  extractEastwestDetails(selectedScoreCard.scoreDetails)
                )}

                {renderEastwestTotals(
                  extractEastwestDetails(selectedScoreCard.scoreDetails)
                )}

                {renderEastwestSection(
                  "With Contact",
                  extractEastwestDetails(selectedScoreCard.scoreDetails)
                    ?.withContact
                )}

                {renderEastwestSection(
                  "Without Contact",
                  extractEastwestDetails(selectedScoreCard.scoreDetails)
                    ?.withoutContact
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpenUBScoreCard && selectedScoreCard && (
          <motion.div
            className="absolute top-0 left-0 w-full items-center justify-center flex h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="w-full h-full  absolute items-center justify-center flex bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpenUBScoreCard(false)}
            ></div>
            <motion.div
              className="bg-white z-20 border flex flex-col relative rounded-md p-6 max-w-3xl max-h-[80vh] "
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleExportExcel();
                }}
                disabled={isExportingExcel}
                className={`absolute bottom-2 cursor-pointer -right-14 flex items-center gap-2 px-3 py-2 border-2 rounded-sm font-black uppercase text-white transition ${
                  isExportingExcel
                    ? "bg-green-400 cursor-not-allowed border-green-700"
                    : "bg-green-600 hover:bg-green-700 border-green-800"
                }`}
                title="Export to Excel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4"
                >
                  <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                  <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
              </button>

              <div className=" flex absolute top-2 -right-10 justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpenUBScoreCard(false)}
                  className="p-1 transition-all shadow-md border-2 border-red-800 bg-red-600 hover:bg-red-700 cursor-pointer text-white rounded-full uppercase text-xs font-black"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col overflow-auto pr-2 h-full">
                <div className="flex mt-2 justify-between items-start gap-4 flex-wrap">
                  <div>
                    <div className="text-xl first-letter:uppercase font-black text-gray-900">
                      {selectedScoreCard.agent?.name || "Unknown Agent"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedScoreCard.typeOfScoreCard}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(selectedScoreCard.createdAt)}
                    </div>
                  </div>
                  <div className="text-right border overflow-hidden shadow-md flex flex-col justify-center  rounded-sm bg-gray-200">
                    <div className="text-3xl py-2 font-black text-center text-gray-900">
                      {selectedScoreCard.totalScore != null
                        ? selectedScoreCard.totalScore.toFixed(1)
                        : "-"}
                    </div>
                    <div className="text-xs border-t px-5 py-2 font-black bg-gray-400 text-black uppercase">
                      Total Score
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm text-gray-800">
                  <div>
                    <span className="font-black uppercase text-black">
                      Call Date:
                    </span>{" "}
                    {formatDate(selectedScoreCard.dateAndTimeOfCall)}
                  </div>
                  <div>
                    <span className="font-black uppercase text-black">
                      Scorecard Type:
                    </span>{" "}
                    {selectedScoreCard.typeOfScoreCard}
                  </div>
                </div>

                {renderUBSection(
                  "Opening",
                  selectedScoreCard.scoreDetails?.opening
                )}
                {renderUBSection(
                  "Collection Call Proper - with Contact</br>ESTABLISHING RAPPORT, EMPATHY & COURTESY",
                  selectedScoreCard.scoreDetails?.collectionCallProper
                    ?.withContact?.establishingRapport
                )}

                {renderUBSection(
                  "Collection Call Proper - with Contact</br>listening Skills",
                  selectedScoreCard.scoreDetails?.collectionCallProper
                    ?.withContact?.listeningSkills
                )}

                {renderUBSection(
                  "Collection Call Proper - with Contact</br>negotiation Skills",
                  selectedScoreCard.scoreDetails?.collectionCallProper
                    ?.withContact?.negotiationSkills
                )}

                {renderUBSection(
                  "Collection Call Proper - with Contact</br>offering Solutions",
                  selectedScoreCard.scoreDetails?.collectionCallProper
                    ?.withContact?.offeringSolutions
                )}

                {renderUBSection(
                  "Collection Call Proper - without Contact",
                  selectedScoreCard.scoreDetails?.collectionCallProper
                    ?.withoutContact
                )}

                {renderUBSection(
                  "Collection Call Proper - with or without Contact",
                  selectedScoreCard.scoreDetails?.collectionCallProper
                    ?.withOrWithoutContact
                )}

                {renderUBSection(
                  "Closing The Call",
                  selectedScoreCard.scoreDetails?.closingTheCall
                )}

                {(() => {
                  const rawComments = Array.isArray(
                    selectedScoreCard.scoreDetails?.callComments
                  )
                    ? selectedScoreCard.scoreDetails.callComments.filter(
                        Boolean
                      )
                    : [];

                  const normalized = rawComments.map((comment: any) => ({
                    agent: comment?.agent ?? "",
                    evaluator: comment?.evaluator ?? comment?.tl ?? "",
                    action: comment?.action ?? comment?.actionPlan ?? "",
                    call: comment?.call,
                  }));

                  const hasAny = normalized.some(
                    (comment) =>
                      comment.agent || comment.evaluator || comment.action
                  );

                  if (!hasAny) return null;

                  return (
                    <div className="mt-2 shadow-md">
                      <div className="font-black bg-gray-300 rounded-t-md py-1 w-full border text-center uppercase text-xl text-black">
                        Call Comments
                      </div>
                      <div className="border-x border-b overflow-hidden rounded-b-md border-black text-sm text-gray-700 bg-gray-50 divide-y">
                        {normalized.map((comment, idx: number) => {
                          const callNum =
                            comment && typeof comment.call === "number"
                              ? comment.call
                              : idx + 1;
                          return (
                            <div
                              key={idx}
                              className="px-3 even:bg-gray-100 odd:bg-gray-200 py-2 flex flex-col gap-2"
                            >
                              <div className="col-span-1 font-semibold text-black">
                                Call {callNum}:
                              </div>
                              <div className="flex flex-col justify-between">
                                <div className="col-span-1 flex items-center">
                                  <span className="font-semibold">
                                    Comments of Agent:
                                  </span>{" "}
                                  {comment.agent ? (
                                    String(comment.agent)
                                  ) : (
                                    <div className="italic  ml-1 text-xs text-gray-400">
                                      No comment
                                    </div>
                                  )}
                                </div>
                                <div className="col-span-1 flex items-center">
                                  <span className="font-semibold">
                                    Comments of Evaluator:
                                  </span>{" "}
                                  {comment.evaluator ? (
                                    String(comment.evaluator)
                                  ) : (
                                    <div className="italic ml-1 text-xs text-gray-400">
                                      No comment
                                    </div>
                                  )}
                                </div>
                                <div className="col-span-1 flex items-center">
                                  <span className="font-semibold">
                                    Action Plan:
                                  </span>{" "}
                                  {comment.action ? (
                                    String(comment.action)
                                  ) : (
                                    <div className="italic ml-1 text-xs text-gray-400">
                                      No comment
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {selectedScoreCard.scoreDetails?.comments && (
                  <div className="mt-2 shadow-md">
                    <div className="font-black bg-gray-300 rounded-t-md py-1 w-full border text-center uppercase text-xl text-black">
                      Comments
                    </div>
                    <div className="border-x border-b rounded-b-md border-black text-sm text-gray-700 space-y-2 bg-gray-50">
                      <div className="border-b px-3 py-2">
                        <span className="font-semibold ">Highlights:</span>{" "}
                        {selectedScoreCard.scoreDetails.comments?.highlights?.trim() ||
                          "-"}
                      </div>
                      <div className="px-3 py-2 ">
                        <span className="font-semibold">Comments:</span>{" "}
                        {selectedScoreCard.scoreDetails.comments?.comments?.trim() ||
                          "-"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpenUBMortgageScoreCard && selectedScoreCard && (
          <motion.div
            className="absolute top-0 left-0 w-full items-center justify-center flex h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="w-full h-full absolute items-center justify-center flex bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            ></div>
            <motion.div
              className="bg-white z-20 border flex flex-col relative rounded-md p-6 max-w-5xl max-h-[80vh] "
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleExportExcel();
                }}
                disabled={isExportingExcel}
                className={`absolute bottom-2 cursor-pointer -right-14 flex items-center gap-2 px-3 py-2 border-2 rounded-sm font-black uppercase text-white transition ${
                  isExportingExcel
                    ? "bg-green-400 cursor-not-allowed border-green-700"
                    : "bg-green-600 hover:bg-green-700 border-green-800"
                }`}
                title="Export to Excel"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4"
                >
                  <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                  <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
              </button>

              <div className=" flex absolute top-2 -right-10 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1 transition-all shadow-md border-2 border-red-800 bg-red-600 hover:bg-red-700 cursor-pointer text-white rounded-full uppercase text-xs font-black"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col overflow-auto pr-2 h-full">
                <div className="flex mt-2 justify-between items-start gap-4 flex-wrap">
                  <div>
                    <div className="text-xl first-letter:uppercase font-black text-gray-900">
                      {selectedScoreCard.agent?.name || "Unknown Agent"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedScoreCard.typeOfScoreCard}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(selectedScoreCard.createdAt)}
                    </div>
                  </div>
                  <div className="text-right border overflow-hidden shadow-md flex flex-col justify-center rounded-sm bg-gray-200">
                    <div className="text-3xl py-2 font-black text-center text-gray-900">
                      {selectedScoreCard.totalScore != null
                        ? selectedScoreCard.totalScore.toFixed(1)
                        : "-"}
                    </div>
                    <div className="text-xs border-t px-5 py-2 font-black bg-gray-400 text-black uppercase">
                      Total Score
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm text-gray-800">
                  <div>
                    <span className="font-black uppercase text-black">
                      Scorecard Type:
                    </span>{" "}
                    {selectedScoreCard.typeOfScoreCard}
                  </div>
                </div>

                {renderUBMortgageSection(selectedScoreCard.scoreDetails)}

                {selectedScoreCard.scoreDetails?.comments && (
                  <div className="mt-2 shadow-md">
                    <div className="font-black bg-gray-300 rounded-t-md py-1 w-full border text-center uppercase text-xl text-black">
                      Comments
                    </div>
                    <div className="border-x border-b rounded-b-md border-black text-sm text-gray-700 space-y-2 bg-gray-50">
                      <div className="border-b px-3 py-2">
                        <span className="font-semibold ">Highlights:</span>{" "}
                        {selectedScoreCard.scoreDetails.comments?.highlights?.trim() ||
                          "-"}
                      </div>
                      <div className="px-3 py-2 ">
                        <span className="font-semibold">Comments:</span>{" "}
                        {selectedScoreCard.scoreDetails.comments?.comments?.trim() ||
                          "-"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScoreCardOverview;
