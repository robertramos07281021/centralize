import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { scoreCardDropdownOptions } from "../middleware/exports";
import { setSuccess } from "../redux/slices/authSlice";

const SCORE_CARD_EXPORT_ROOT_ID = "score-card-export-root";

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

const SCORE_CARD_TYPE = "Default Score Card";
const MAX_TOTAL_SCORE = 100;
const REGULATORY_POINT_IDS = [
  "regulatory-call-disposition",
  "regulatory-confidentiality",
  "regulatory-unfair-debt",
  "regulatory-information-accuracy",
  "regulatory-call-recording",
  "regulatory-no-negotiation",
  "regulatory-call-avoidance",
  "regulatory-professionalism",
];
const REGULATORY_MISSED_GUIDELINE_IDS = [
  "call-disposition",
  "confidentiality-of-information",
  "unfair-debt-collection-practices",
  "information-accuracy",
  "call-recording-statement",
  "incomplete-attempt-to-negotiate",
  "call-avoidance-early-termination",
  "professionalism",
];
const REGULATORY_SELECTION_TO_MISSED_MAP = REGULATORY_POINT_IDS.reduce(
  (acc, regulatoryId, index) => {
    acc[regulatoryId] = REGULATORY_MISSED_GUIDELINE_IDS[index];
    return acc;
  },
  {} as Record<string, string>
);

const createDefaultRegulatorySelections = () =>
  REGULATORY_POINT_IDS.reduce<Record<string, string>>((acc, id) => {
    acc[id] = "N/A";
    return acc;
  }, {});
type SectionFieldConfig = {
  key: string;
  scoreId: string;
  missedId?: string;
};

const SCORE_VALUE_MAP = {
  YES: 1,
  NO: 0,
  COACHING: 2,
  "N/A": 3,
} as const;

type SelectionValue = keyof typeof SCORE_VALUE_MAP;

const OPENING_FIELD_CONFIG: SectionFieldConfig[] = [
  {
    key: "introduction",
    scoreId: "opening-question-1",
    missedId: "opening-introduction",
  },
  {
    key: "accountOverview",
    scoreId: "opening-question-2",
    missedId: "opening-account-overview",
  },
];

const NEGOTIATION_FIELD_CONFIG: SectionFieldConfig[] = [
  { key: "probing", scoreId: "negotiation-probing" },
  { key: "hierarchyOfNegotiation", scoreId: "negotiation-hierarchy" },
  { key: "solidifyingStatements", scoreId: "negotiation-solidifying" },
  { key: "activeListening", scoreId: "negotiation-listening" },
  { key: "choiceOfWords", scoreId: "negotiation-words" },
  { key: "conversationControl", scoreId: "negotiation-control" },
  {
    key: "processAndCustomerEducation",
    scoreId: "negotiation-education",
  },
];

const CLOSING_FIELD_CONFIG: SectionFieldConfig[] = [
  { key: "thirdPartyCallHandling", scoreId: "closing-third-party" },
  { key: "closingSpiel", scoreId: "closing-spiel" },
];

const REGULATORY_FIELD_CONFIG: SectionFieldConfig[] = [
  {
    key: "callDisposition",
    scoreId: "regulatory-call-disposition",
    missedId: "call-disposition",
  },
  {
    key: "confidentialityOfInformation",
    scoreId: "regulatory-confidentiality",
    missedId: "confidentiality-of-information",
  },
  {
    key: "unfairDebtCollectionPractices",
    scoreId: "regulatory-unfair-debt",
    missedId: "unfair-debt-collection-practices",
  },
  {
    key: "informationAccuracy",
    scoreId: "regulatory-information-accuracy",
    missedId: "information-accuracy",
  },
  {
    key: "callRecordingStatement",
    scoreId: "regulatory-call-recording",
    missedId: "call-recording-statement",
  },
  {
    key: "noOrIncompleteAttemptToNegotiate",
    scoreId: "regulatory-no-negotiation",
    missedId: "incomplete-attempt-to-negotiate",
  },
  {
    key: "callAvoidanceAndEarlyTermination",
    scoreId: "regulatory-call-avoidance",
    missedId: "call-avoidance-early-termination",
  },
  {
    key: "professionalism",
    scoreId: "regulatory-professionalism",
    missedId: "professionalism",
  },
];

const SCORE_TO_MISSED_GUIDELINE_ID_MAP: Record<string, string> =
  OPENING_FIELD_CONFIG.reduce((acc, field) => {
    if (field.missedId && field.missedId !== field.scoreId) {
      acc[field.scoreId] = field.missedId;
    }
    return acc;
  }, {} as Record<string, string>);

const DEFAULT_POINT_VALUES: Record<string, string> = {
  "opening-question-1": "8",
  "opening-question-2": "8",
  "negotiation-probing": "10",
  "negotiation-hierarchy": "15",
  "negotiation-solidifying": "15",
  "negotiation-listening": "6",
  "negotiation-words": "6",
  "negotiation-control": "7",
  "negotiation-education": "8",
  "closing-third-party": "7",
  "closing-spiel": "10",
};

const GET_DEPARTMENTS = gql`
  query getDepts {
    getDepts {
      id
      name
    }
  }
`;

const GET_DEPT_AGENTS = gql`
  query GetAgentsByDepartment($deptId: ID!) {
    getAgentsByDepartment(deptId: $deptId) {
      _id
      name
    }
  }
`;

const CREATE_SCORECARD_DATA = gql`
  mutation CreateScoreCardData($input: ScoreCardDataInput!) {
    createScoreCardData(input: $input) {
      _id
      totalScore
    }
  }
`;

type InputColumnProps = {
  rows: number;
  className?: string;
  inputClassName?: string;
};

type NumericInputColumnProps = InputColumnProps & {
  ids?: string[];
  onSelectionChange?: (id: string, value: SelectionValue) => void;
  defaultValue?: SelectionValue;
};

type TextAreaInputColumnProps = InputColumnProps & {
  ids?: string[];
  dropdownOptions?: Record<string, string[]>;
  valueMap?: Record<string, string>;
  onValueChange?: (id: string, value: string) => void;
  disabledMap?: Record<string, boolean>;
};

type PointsInputColumnProps = {
  ids: string[];
  className?: string;
  valueMap: Record<string, string>;
  onChange: (id: string, value: string) => void;
  disabledMap?: Record<string, boolean>;
};

const NumericInputColumn = ({
  rows,
  className = "",
  ids,
  onSelectionChange,
  defaultValue = "N/A",
}: NumericInputColumnProps) => {
  const [selected, setSelected] = useState<SelectionValue[]>(() =>
    Array(rows).fill(defaultValue)
  );
  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    if (defaultsAppliedRef.current || !onSelectionChange) {
      return;
    }
    defaultsAppliedRef.current = true;
    Array.from({ length: rows }).forEach((_, idx) => {
      const rowId = ids?.[idx] ?? `${idx}`;
      onSelectionChange(rowId, defaultValue);
    });
  }, [defaultValue, ids, onSelectionChange, rows]);

  const buttons: { label: string; value: SelectionValue; classes: string }[] = [
    {
      label: "YES",
      value: "YES",
      classes:
        "bg-green-600 border-green-900 hover:bg-green-700 cursor-pointer text-white",
    },
    {
      label: "NO",
      value: "NO",
      classes:
        "bg-red-600 border-red-900 hover:bg-red-700 cursor-pointer text-white",
    },
    {
      label: "COACHING",
      value: "COACHING",
      classes:
        "bg-blue-600 border-blue-900 hover:bg-blue-700 cursor-pointer text-white",
    },
    {
      label: "N/A",
      value: "N/A",
      classes:
        "bg-amber-600 border-amber-900 hover:bg-amber-700 cursor-pointer text-white",
    },
  ];

  const baseButtonClass =
    "transition-all font-black uppercase rounded-sm border-2 px-3 py-1 text-xs";

  const selectedClass =
    "bg-gray-300 border-gray-600 text-gray-400 cursor-not-allowed";

  return (
    <div className={className}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 2xl:flex py-1 border-b items-center w-full justify-center border-gray-400 last:border-b-0 gap-2 px-3"
          key={idx}
        >
          {buttons.map((button) => {
            const isSelected = selected[idx] === button.value;
            return (
              <button
                type="button"
                key={button.value}
                className={`${baseButtonClass} ${
                  isSelected ? selectedClass : button.classes
                }`}
                onClick={() => {
                  setSelected((prev) => {
                    const copy = [...prev];
                    copy[idx] = button.value;
                    return copy;
                  });
                  if (onSelectionChange) {
                    const rowId = ids?.[idx] ?? `${idx}`;
                    onSelectionChange(rowId, button.value);
                  }
                }}
              >
                {button.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const TextAreaInputColumn = ({
  rows,
  className = "",
  ids,
  dropdownOptions = {},
  valueMap,
  onValueChange,
  disabledMap,
}: TextAreaInputColumnProps) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [internalValues, setInternalValues] = useState<Record<string, string>>(
    {}
  );
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!activeDropdown) {
        return;
      }
      const currentNode = dropdownRefs.current[activeDropdown];
      if (currentNode && !currentNode.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  return (
    <div className={className}>
      {Array.from({ length: rows }).map((_, idx) => {
        const rowId = ids?.[idx] ?? `text-area-row-${idx}`;
        const options = dropdownOptions[rowId] ?? [];
        const hasOptions = options.length > 0;
        const currentValue = valueMap?.[rowId] ?? internalValues[rowId] ?? "";
        const isDisabled = disabledMap?.[rowId] ?? false;

        const persistValue = (value: string) => {
          if (onValueChange) {
            onValueChange(rowId, value);
          } else {
            setInternalValues((prev) => ({
              ...prev,
              [rowId]: value,
            }));
          }
        };

        return (
          <div
            key={rowId}
            ref={(node) => {
              dropdownRefs.current[rowId] = node;
            }}
            className={`outline-none justify-between last:border-b-0 border-gray-400 bg-white w-full px-2 py-1 resize-none text-xs h-full flex border-b items-center relative ${
              isDisabled ? "cursor-not-allowed bg-gray-200" : ""
            }`}
          >
            <div
              className={
                currentValue && !isDisabled
                  ? "text-black"
                  : "text-gray-400 italic"
              }
            >
              {isDisabled ? "" : currentValue || "Select option"}
            </div>

            <button
              type="button"
              className={`bg-blue-600 hover:bg-blue-700 cursor-pointer transition-all py-1 px-2 border-2 font-black uppercase text-white border-blue-800 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                isDisabled ? "cursor-not-allowed" : ""
              }`}
              onClick={() => {
                if (!hasOptions || isDisabled) {
                  return;
                }
                setActiveDropdown((prev) => (prev === rowId ? null : rowId));
              }}
              disabled={!hasOptions || isDisabled}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </button>
            <AnimatePresence>
              {hasOptions && activeDropdown === rowId && !isDisabled && (
                <motion.div
                  className="absolute right-full top-1 mr-2 bg-white border overflow-hidden rounded-sm shadow-md z-10 w-full"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  {options.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className="w-full cursor-pointer odd:bg-gray-100 even:bg-gray-200 text-left border-b border-gray-400 last:border-b-0 px-3 py-1 text-sm hover:bg-gray-100"
                      onClick={() => {
                        persistValue(option);
                        setActiveDropdown(null);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

const PointsInputColumn = ({
  ids,
  className = "",
  valueMap,
  onChange,
  disabledMap,
}: PointsInputColumnProps) => (
  <div className={className}>
    {ids.map((id, idx) => (
      <input
        key={id}
        type="text"
        inputMode="numeric"
        className={`outline-none px-2 py-1 ${
          idx !== ids.length - 1 ? "border-b border-gray-400" : ""
        } ${
          disabledMap?.[id]
            ? "bg-gray-200 cursor-not-allowed text-gray-500"
            : ""
        }`}
        disabled={true}
        value={valueMap[id] ?? ""}
        onKeyDown={(event) => {
          if (["-", "+", "e", "E", "."].includes(event.key)) {
            event.preventDefault();
          }
        }}
        onChange={(event) => {
          const sanitized = event.target.value.replace(/[^0-9]/g, "");
          onChange(id, sanitized);
        }}
        placeholder="0"
      />
    ))}
  </div>
);

const DefaultScoreCard = () => {
  const [isMonthMenuOpen, setMonthMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isDeptMenuOpen, setDeptMenuOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [isAgentMenuOpen, setAgentMenuOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [callDateTime, setCallDateTime] = useState("");
  const [callNumber, setCallNumber] = useState("");
  const [highlights, setHighlights] = useState("");
  const [commentsNote, setCommentsNote] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [pointValues, setPointValues] = useState<Record<string, string>>({});
  const [missedGuidelineValues, setMissedGuidelineValues] = useState<
    Record<string, string>
  >({});
  const [scoreSelections, setScoreSelections] = useState<
    Record<string, string>
  >({});
  const [regulatorySelections, setRegulatorySelections] = useState<
    Record<string, string>
  >(createDefaultRegulatorySelections);
  const regulatoryMissedDisabledMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    REGULATORY_POINT_IDS.forEach((regId, idx) => {
      const missedId = REGULATORY_MISSED_GUIDELINE_IDS[idx];
      map[missedId] = regulatorySelections[regId] !== "YES";
    });
    return map;
  }, [regulatorySelections]);
  const monthFieldRef = useRef<HTMLDivElement | null>(null);
  const deptFieldRef = useRef<HTMLDivElement | null>(null);
  const agentFieldRef = useRef<HTMLDivElement | null>(null);
  const scoreCardRef = useRef<HTMLDivElement | null>(null);

  const resetScoreCard = () => {
    setSelectedMonth("");
    setMonthMenuOpen(false);
    setSelectedDept("");
    setSelectedDeptId("");
    setDeptMenuOpen(false);
    setSelectedAgent("");
    setSelectedAgentId("");
    setAgentMenuOpen(false);
    setCallDateTime("");
    setCallNumber("");
    setHighlights("");
    setCommentsNote("");
    setPointValues({});
    setMissedGuidelineValues({});
    setScoreSelections({});
    setRegulatorySelections(createDefaultRegulatorySelections());
    setDisabledPoints({});
    setDisabledMissedGuidelines({});
    pointSnapshotsRef.current = {};
    setFormResetKey((prev) => prev + 1);
  };

  const { data: deptData, loading: deptLoading } = useQuery<{
    getDepts: { id: string; name: string }[];
  }>(GET_DEPARTMENTS);
  const departments =
    deptData?.getDepts.filter((dept) => dept.name.toLowerCase() !== "admin") ??
    [];

  const [fetchAgents, { data: agentData, loading: agentLoading }] =
    useLazyQuery<{ getAgentsByDepartment: { _id: string; name: string }[] }>(
      GET_DEPT_AGENTS,
      { fetchPolicy: "network-only" }
    );
  const agents = agentData?.getAgentsByDepartment ?? [];

  const [createScoreCardData, { loading: saveLoading }] = useMutation(
    CREATE_SCORECARD_DATA,
    {
      onCompleted: () => {
        showNotifier("Score card saved.");
      },
      onError: (error) => {
        showNotifier(`INCORRECT: ${error.message}`, true);
      },
    }
  );

  const { userLogged } = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const showNotifier = (message: string, isMessage = false) => {
    dispatch(
      setSuccess({
        success: true,
        message,
        isMessage,
      })
    );
  };
  const LoginUser = userLogged?.name || "Unknown";
  const pointSnapshotsRef = useRef<Record<string, string>>({});
  const [disabledPoints, setDisabledPoints] = useState<Record<string, boolean>>(
    {}
  );
  const [disabledMissedGuidelines, setDisabledMissedGuidelines] = useState<
    Record<string, boolean>
  >({});
  const isProcessing = saveLoading || isExportingExcel;

  const hasRegulatoryFailure = useMemo(() => {
    return Object.values(regulatorySelections).some((value) => value === "YES");
  }, [regulatorySelections]);

  const totalScore = useMemo(() => {
    const rawScore = Object.values(pointValues).reduce((sum, value) => {
      const parsed = parseFloat(value);
      return sum + (Number.isNaN(parsed) ? 0 : parsed);
    }, 0);
    return hasRegulatoryFailure ? 0 : rawScore;
  }, [pointValues, hasRegulatoryFailure]);

  const scoreExceeded = totalScore > MAX_TOTAL_SCORE;
  const scoreFailed = hasRegulatoryFailure;
  const scoreDisplay = scoreExceeded ? "Score too much!" : totalScore;
  const scoreColorClass = scoreFailed
    ? "text-red-600"
    : scoreExceeded
    ? "text-red-600"
    : totalScore < 75
    ? "text-red-600"
    : totalScore < 87
    ? "text-yellow-500"
    : "text-green-600";
  const scoreDisplayClass = scoreExceeded
    ? "uppercase text-red-600 text-2xl"
    : "";

  const mapSelectionToScoreValue = (selection?: string) => {
    const normalizedSelection: SelectionValue =
      selection === "YES" ||
      selection === "NO" ||
      selection === "COACHING" ||
      selection === "N/A"
        ? selection
        : "N/A";
    return SCORE_VALUE_MAP[normalizedSelection];
  };

  const buildSectionEntries = (
    config: SectionFieldConfig[],
    options?: {
      includePoints?: boolean;
      selectionMap?: Record<string, string>;
      scoreMapper?: (selection?: string) => number;
      pointMapper?: (
        field: SectionFieldConfig,
        selection?: string
      ) => number | null | undefined;
    }
  ) => {
    const includePoints = options?.includePoints !== false;
    const selectionSource = options?.selectionMap ?? scoreSelections;
    const scoreMapper = options?.scoreMapper ?? mapSelectionToScoreValue;
    const pointMapper = options?.pointMapper;
    return config.reduce<
      Record<
        string,
        { scores: number; points: number | null; missedGuidlines: string }
      >
    >((acc, field) => {
      const selectionValue = selectionSource[field.scoreId];
      let resolvedPoints: number | null = null;
      if (includePoints) {
        if (pointMapper) {
          const mappedPoints = pointMapper(field, selectionValue);
          resolvedPoints = mappedPoints ?? null;
        } else {
          resolvedPoints = Number(pointValues[field.scoreId] ?? 0);
        }
      }
      acc[field.key] = {
        scores: scoreMapper(selectionValue),
        points: resolvedPoints,
        missedGuidlines:
          missedGuidelineValues[field.missedId ?? field.scoreId] ?? "",
      };
      return acc;
    }, {});
  };

  const buildScoreDetailsPayload = () => ({
    opening: buildSectionEntries(OPENING_FIELD_CONFIG),
    negotiationSkills: buildSectionEntries(NEGOTIATION_FIELD_CONFIG),
    closing: buildSectionEntries(CLOSING_FIELD_CONFIG),
    regulatoryAndCompliance: buildSectionEntries(REGULATORY_FIELD_CONFIG, {
      selectionMap: regulatorySelections,
      pointMapper: (_, selection) => {
        if (!selection) {
          return null;
        }
        return selection === "YES" ? 1 : 2;
      },
    }),
    comments: {
      highlights: highlights.trim(),
      comments: commentsNote.trim(),
    },
  });

  const formatCallDateTime = (value: string) => {
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

  const buildExcelCriteriaRows = () => {
    const rows: Array<Array<string | number>> = [];

    const pushRows = (
      sectionLabel: string,
      config: SectionFieldConfig[],
      options?: {
        includePoints?: boolean;
        selectionMap?: Record<string, string>;
        pointValueResolver?: (
          field: SectionFieldConfig,
          selectionLabel: string
        ) => string | undefined;
      }
    ) => {
      const includePoints = options?.includePoints !== false;
      const selectionSource = options?.selectionMap ?? scoreSelections;
      config.forEach((field, index) => {
        const selectionLabel = selectionSource[field.scoreId] ?? "N/A";
        const missedValue =
          missedGuidelineValues[field.missedId ?? field.scoreId] ?? "";
        let pointsValue = "";
        if (includePoints) {
          if (options?.pointValueResolver) {
            pointsValue =
              options.pointValueResolver(field, selectionLabel) ?? "";
          } else {
            pointsValue = pointValues[field.scoreId] ?? "";
          }
        }
        rows.push([
          index === 0 ? sectionLabel : "",
          field.key
            .replace(/([A-Z])/g, " $1")
            .replace(/[-_]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          selectionLabel,
          pointsValue,
          missedValue,
        ]);
      });
    };

    pushRows("Opening", OPENING_FIELD_CONFIG);
    pushRows("Negotiation Skills", NEGOTIATION_FIELD_CONFIG);
    pushRows("Closing", CLOSING_FIELD_CONFIG);
    pushRows("Regulatory and Compliance", REGULATORY_FIELD_CONFIG, {
      includePoints: true,
      selectionMap: regulatorySelections,
      pointValueResolver: (_, selectionLabel) =>
        selectionLabel === "YES" ? "Auto fail" : "",
    });

    return rows;
  };

  useEffect(() => {
    if (!isMonthMenuOpen && !isDeptMenuOpen && !isAgentMenuOpen) {
      return;
    }

    const handleClickAway = (event: MouseEvent) => {
      const targetNode = event.target as Node;

      if (
        isMonthMenuOpen &&
        monthFieldRef.current &&
        !monthFieldRef.current.contains(targetNode)
      ) {
        setMonthMenuOpen(false);
      }

      if (
        isDeptMenuOpen &&
        deptFieldRef.current &&
        !deptFieldRef.current.contains(targetNode)
      ) {
        setDeptMenuOpen(false);
      }

      if (
        isAgentMenuOpen &&
        agentFieldRef.current &&
        !agentFieldRef.current.contains(targetNode)
      ) {
        setAgentMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway);

    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [isMonthMenuOpen, isDeptMenuOpen, isAgentMenuOpen]);

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setMonthMenuOpen(false);
  };

  const handleDeptSelect = (deptId: string, deptName: string) => {
    setSelectedDept(deptName);
    setSelectedDeptId(deptId);
    setSelectedAgent("");
    setSelectedAgentId("");
    setDeptMenuOpen(false);
    setAgentMenuOpen(false);
    fetchAgents({ variables: { deptId } });
  };

  const handleAgentSelect = (agentId: string, agentName: string) => {
    setSelectedAgent(agentName);
    setSelectedAgentId(agentId);
    setAgentMenuOpen(false);
  };

  const handlePointChange = (fieldId: string, value: string) => {
    setPointValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleScoringSelection = (fieldId: string, selection: string) => {
    setScoreSelections((prev) => ({
      ...prev,
      [fieldId]: selection,
    }));
    const missedGuidelineId =
      SCORE_TO_MISSED_GUIDELINE_ID_MAP[fieldId] ?? fieldId;
    if (selection === "NO") {
      if (pointSnapshotsRef.current[fieldId] === undefined) {
        pointSnapshotsRef.current[fieldId] = pointValues[fieldId] ?? "";
      }
      setPointValues((prev) => ({
        ...prev,
        [fieldId]: "0",
      }));
      setDisabledPoints((prev) => ({
        ...prev,
        [fieldId]: true,
      }));
      setDisabledMissedGuidelines((prev) => ({
        ...prev,
        [missedGuidelineId]: true,
      }));
      return;
    }

    const snapshot = pointSnapshotsRef.current[fieldId];
    if (snapshot !== undefined) {
      setPointValues((prev) => ({
        ...prev,
        [fieldId]: snapshot,
      }));
      delete pointSnapshotsRef.current[fieldId];
    }
    if (snapshot === undefined || snapshot === "") {
      const defaultPoint = DEFAULT_POINT_VALUES[fieldId];
      if (defaultPoint !== undefined) {
        setPointValues((prev) => ({
          ...prev,
          [fieldId]: defaultPoint,
        }));
      }
    }
    setDisabledPoints((prev) => {
      if (!prev[fieldId]) return prev;
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
    setDisabledMissedGuidelines((prev) => {
      if (!prev[missedGuidelineId]) return prev;
      const copy = { ...prev };
      delete copy[missedGuidelineId];
      return copy;
    });
  };

  const handleMissedGuidelineChange = (fieldId: string, value: string) => {
    setMissedGuidelineValues((prev) => {
      if (!value) {
        if (!(fieldId in prev)) {
          return prev;
        }
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      }
      return {
        ...prev,
        [fieldId]: value,
      };
    });
  };

  const handleRegulatorySelection = (fieldId: string, value: string) => {
    setRegulatorySelections((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    const missedId = REGULATORY_SELECTION_TO_MISSED_MAP[fieldId];
    if (missedId && value !== "YES") {
      handleMissedGuidelineChange(missedId, "");
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!userLogged?._id) {
      showNotifier("INCORRECT: Session expired. Please log in again.", true);
      return false;
    }

    if (
      !selectedMonth ||
      !selectedDeptId ||
      !selectedAgentId ||
      !callDateTime ||
      !callNumber.trim()
    ) {
      showNotifier("NOT READY: Please complete all required fields.", true);
      return false;
    }

    const scoreDetailsPayload = buildScoreDetailsPayload();
    try {
      await createScoreCardData({
        variables: {
          input: {
            month: selectedMonth,
            department: selectedDeptId,
            agentName: selectedAgentId,
            dateAndTimeOfCall: new Date(callDateTime).toISOString(),
            number: callNumber.trim(),
            assignedQA: userLogged._id,
            typeOfScoreCard: SCORE_CARD_TYPE,
            scoreDetails: scoreDetailsPayload,
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

  const handleSaveAndExport = async () => {
    if (saveLoading || isExportingExcel) {
      return;
    }
    const saved = await handleSave();
    if (!saved) {
      return;
    }
    const exported = await handleExportExcel();
    if (exported) {
      resetScoreCard();
    }
  };

  const handleExportExcel = async (): Promise<boolean> => {
    if (isExportingExcel) {
      return false;
    }

    setIsExportingExcel(true);
    try {
      const excelModule = await import("exceljs/dist/exceljs.min.js");
      const ExcelJS = excelModule.default ?? excelModule;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = LoginUser || "QA";
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
      const failRed = "FFB91C1C";
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
        ["Month", selectedMonth || "N/A"],
        ["Name", selectedAgent || "N/A"],
        ["Department", selectedDept || "N/A"],
        ["Date and Time of Call", formatCallDateTime(callDateTime)],
        ["Number", callNumber || "N/A"],
        ["Assigned QA", LoginUser || "Unknown"],
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
      applyOuterBorder(infoRowsStart, infoRowsStart + infoRows.length - 1, 2, 7);

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
      const rightBorderCellc = worksheet.getCell("A42");
      rightBorderCellc.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFF" },
      };
      rightBorderCellc.alignment = { horizontal: "center", vertical: "middle" };
      rightBorderCellc.border = {
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
      const totalScoreExportDisplay = scoreExceeded
        ? "Check Score"
        : totalScore || 0;
      totalScoreCell.value = totalScoreExportDisplay;
      totalScoreCell.font = {
        bold: true,
        size: 26,
        color: { argb: scoreFailed ? failRed : brandBlue },
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
        { range: `J${criteriaHeaderRow}:J${headerRowEnd}`, label: "Missed Guideline" },
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

      const criteriaRows = buildExcelCriteriaRows();
      const highlightValue = highlights.trim() || "N/A";
      const opportunityValue = commentsNote.trim() || "N/A";
      const commentRows: Array<Array<string | number>> = [
        ["Comments", `Highlights: ${highlightValue}`, "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", `Opportunity: ${opportunityValue}`, "", "", ""],
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
        const [criteriaLabel, categoryLabel, scoreValue, pointValue, missedValue] = rowValues;
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
          categoryCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
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
          if (
            typeof pointValue === "string" &&
            pointValue.toLowerCase() === "failed"
          ) {
            pointsCell.font = {
              bold: true,
              color: { argb: failRed },
            };
          }

          const missedCell = worksheet.getCell(`J${excelRowIndex}`);
          missedCell.value = missedValue ?? "";
          missedCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
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
          value: `Highlights: ${highlightValue}`,
          startRow: highlightStartRow,
          endRow: highlightEndRow,
        },
        {
          value: `Opportunity: ${opportunityValue}`,
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
      const sanitizedAgent = (selectedAgent || "agent").replace(/\s+/g, "-");
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `score-card-${sanitizedAgent}.xlsx`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
      return true;
    } catch (error) {
      console.error("Failed to export Excel", error);
      showNotifier("NOT READY: Failed to export Excel. Please try again.", true);
      return false;
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="p-5 flex flex-col  text-black w-full h-full max-h-[90vh]">
      <motion.div
        ref={scoreCardRef}
        id={SCORE_CARD_EXPORT_ROOT_ID}
        className="border flex rounded-md overflow-hidden flex-col h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="h-[8.4%] font-black  border-b items-center justify-center flex relative  uppercase bg-gray-400 text-2xl text-center py-3 w-full text-black">
          <div className="">QA Evaluation Page</div>
          <div className="flex items-center absolute right-5 h-full gap-1 justify-end text-xs">
            <div
              role="button"
              tabIndex={0}
              aria-disabled={isProcessing}
              className={` px-4 py-2  border-green-900 transition-all border-2 font-black uppercase rounded-sm shadow-md text-white ${
                isProcessing
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 cursor-pointer"
              }`}
              onClick={() => {
                if (!isProcessing) {
                  void handleSaveAndExport();
                }
              }}
              onKeyDown={(event) => {
                if (
                  !isProcessing &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  void handleSaveAndExport();
                }
              }}
            >
              {isProcessing ? "Processing..." : "Save"}
            </div>
          </div>
        </div>
        <div className="bg-gray-300 h-[91.6%] p-5 flex flex-col">
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
                        className="absolute left-0 top-full w-full mt-1 h-44 z-10 overflow-auto rounded-sm border border-black bg-white shadow-lg"
                        role="listbox"
                      >
                        {MONTHS.map((month) => (
                          <motion.div
                            key={month}
                            className="cursor-pointer w-full even:bg-gray-300 odd:bg-gray-200 border-b last:border-b-0 px-6 py-2 text-sm text-black"
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
                <div className="relative " ref={deptFieldRef}>
                  <motion.div
                    role="button"
                    tabIndex={0}
                    className="flex text-black  cursor-pointer rounded-tr hover:bg-gray-400 items-center justify-between gap-2 px-3 py-1 text-sm shadow-sm"
                    onClick={() =>
                      !deptLoading && setDeptMenuOpen((prev) => !prev)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        !deptLoading && setDeptMenuOpen((prev) => !prev);
                      }
                    }}
                    aria-expanded={isDeptMenuOpen}
                    aria-haspopup="listbox"
                  >
                    <span>
                      {selectedDept ||
                        (deptLoading
                          ? "Loading campaigns..."
                          : "Select Campaign")}
                    </span>
                    <motion.span
                      className="text-xs"
                      animate={{ rotate: isDeptMenuOpen ? 90 : 0 }}
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
                    {isDeptMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1 h-44 overflow-auto z-10 rounded-sm border border-black bg-white shadow-lg"
                        role="listbox"
                      >
                        {departments.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-500">
                            No departments found
                          </div>
                        ) : (
                          departments.map((dept) => (
                            <motion.div
                              key={dept.id}
                              className="cursor-pointer w-full even:bg-gray-200 odd:bg-gray-100 border-b last:border-b-0 px-3 py-2 text-sm text-black"
                              onClick={() =>
                                handleDeptSelect(dept.id, dept.name)
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  handleDeptSelect(dept.id, dept.name);
                                }
                              }}
                              role="option"
                              tabIndex={0}
                              aria-selected={selectedDept === dept.name}
                              whileHover={{ backgroundColor: "#E5E7EB" }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {dept.name}
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="grid grid-cols-2 border-b">
                <div className="bg-gray-400 px-5 border-r py-1">agent Name</div>
                <div className="relative" ref={agentFieldRef}>
                  <motion.div
                    role="button"
                    tabIndex={0}
                    className={`flex text-black rounded-tr items-center justify-between gap-2 px-3 py-1 text-sm shadow-sm ${
                      selectedDeptId
                        ? "cursor-pointer hover:bg-gray-400"
                        : "cursor-not-allowed bg-gray-200"
                    }`}
                    onClick={() => {
                      if (!selectedDeptId) {
                        return;
                      }
                      !agentLoading && setAgentMenuOpen((prev) => !prev);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (!selectedDeptId || agentLoading) {
                          return;
                        }
                        setAgentMenuOpen((prev) => !prev);
                      }
                    }}
                    aria-expanded={isAgentMenuOpen}
                    aria-haspopup="listbox"
                  >
                    <span
                      className={
                        !selectedDeptId
                          ? "text-gray-400 italic font-normal lowercase text-center w-full"
                          : ""
                      }
                    >
                      {!selectedDeptId
                        ? "Select campaign first"
                        : selectedAgent ||
                          (agentLoading
                            ? "Loading agents..."
                            : agents.length > 0
                            ? "Select Agent"
                            : "No agents found")}
                    </span>
                    {selectedDeptId && (
                      <motion.span
                        className="text-xs"
                        animate={{ rotate: isAgentMenuOpen ? 90 : 0 }}
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
                    )}
                  </motion.div>
                  <AnimatePresence>
                    {isAgentMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1 h-44 overflow-auto z-10 rounded-sm border border-black bg-white shadow-lg"
                        role="listbox"
                      >
                        {agentLoading ? (
                          <div className="px-3 py-2 text-xs text-gray-500">
                            Loading agents...
                          </div>
                        ) : agents.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-500">
                            No agents available
                          </div>
                        ) : (
                          agents.map((agent) => (
                            <motion.div
                              key={agent._id}
                              className="cursor-pointer even:bg-gray-200 odd:bg-gray-100 border-b last:border-b-0 px-3 py-2 text-sm text-black"
                              onClick={() =>
                                handleAgentSelect(agent._id, agent.name)
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  handleAgentSelect(agent._id, agent.name);
                                }
                              }}
                              role="option"
                              tabIndex={0}
                              aria-selected={selectedAgentId === agent._id}
                              whileHover={{ backgroundColor: "#E5E7EB" }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {agent.name}
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-2  border-b">
                <div className="bg-gray-400 px-5 border-r py-1">
                  Date and Time of Call
                </div>
                <input
                  className="mx-2 cursor-pointer outline-none"
                  type="datetime-local"
                  value={callDateTime}
                  onChange={(event) => setCallDateTime(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 border-b">
                <div className="bg-gray-400 px-5 border-r py-1">Number</div>
                <input
                  className="ml-2 outline-none"
                  placeholder="Ex. 285548400"
                  type="text"
                  value={callNumber}
                  onChange={(event) => setCallNumber(event.target.value)}
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
              <div className="flex flex-col h-full">
                <div className="px-16 text-2xl border rounded-t-md bg-gray-400 py-2 text-black font-black uppercase">
                  Total Score
                </div>
                <div
                  className={`bg-gray-200 border-black text-5xl font-black border-x border-b flex items-center justify-center rounded-b-md w-full h-full overflow-hidden ${scoreColorClass}`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={
                        scoreFailed
                          ? "score-failed"
                          : scoreExceeded
                          ? "score-too-much"
                          : totalScore
                      }
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -30, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className={` ${scoreDisplayClass} `}
                    >
                      {scoreDisplay}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col mt-2 ">
            <div className="grid font-black uppercase bg-gray-400 border rounded-t-md px-3 py-1 grid-cols-5">
              <div>Criteria</div>
              <div>Category</div>
              <div>Scores</div>
              <div>points</div>
              <div className="truncate">missed guidlines</div>
            </div>

            <motion.div
              layout
              className="bg-gray-100  overflow-auto max-h-[480px] h-full rounded-b-md"
            >
              <div className="flex flex-col text-sm">
                <div className="grid  border-x border-b grid-cols-5">
                  <div className="border-r px-3 py-1 items-center flex text-center">
                    Opening
                  </div>

                  <div className="grid grid-cols-4 w-full  col-span-4">
                    <div className="grid grid-rows-2 border-r">
                      <div className="border-b items-center flex px-2 border-gray-400">
                        Introduction
                      </div>
                      <div className=" items-center flex px-2">
                        Account Overview
                      </div>
                    </div>

                    <NumericInputColumn
                      key={`opening-${formResetKey}`}
                      rows={2}
                      className="grid grid-rows-2 w-full border-r"
                      ids={["opening-question-1", "opening-question-2"]}
                      onSelectionChange={handleScoringSelection}
                      defaultValue="YES"
                    />

                    <PointsInputColumn
                      ids={["opening-question-1", "opening-question-2"]}
                      className="grid grid-rows-2 border-r"
                      valueMap={pointValues}
                      onChange={handlePointChange}
                      disabledMap={disabledPoints}
                    />

                    <TextAreaInputColumn
                      rows={2}
                      className="grid grid-rows-2"
                      ids={["opening-introduction", "opening-account-overview"]}
                      dropdownOptions={scoreCardDropdownOptions}
                      valueMap={missedGuidelineValues}
                      onValueChange={handleMissedGuidelineChange}
                      disabledMap={disabledMissedGuidelines}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col text-sm">
                <div className="grid grid-cols-5 border-x border-b">
                  <div className="border-r px-3 py-1 items-center flex text-center">
                    Negotiation Skills
                  </div>
                  <div className="grid grid-rows-7 border-r">
                    <div className="border-b px-2 border-gray-400 items-center flex">
                      Probing
                    </div>
                    <div className="border-b px-2 border-gray-400 items-center flex">
                      Hierarchy of Negotiation
                    </div>
                    <div className="border-b px-2 border-gray-400 items-center flex">
                      Solidifying Statements
                    </div>
                    <div className="border-b px-2 border-gray-400 items-center flex">
                      Active Listening
                    </div>
                    <div className="border-b px-2 border-gray-400 items-center flex">
                      Choice of Words
                    </div>
                    <div className="border-b px-2 border-gray-400 items-center flex">
                      Conversation Control
                    </div>
                    <div
                      className="items-center flex truncate px-2 border-gray0"
                      title="Process and Customer Education"
                    >
                      Process and Customer Education
                    </div>
                  </div>

                  <NumericInputColumn
                    key={`negotiation-${formResetKey}`}
                    rows={7}
                    className="grid grid-rows-7 border-r"
                    ids={[
                      "negotiation-probing",
                      "negotiation-hierarchy",
                      "negotiation-solidifying",
                      "negotiation-listening",
                      "negotiation-words",
                      "negotiation-control",
                      "negotiation-education",
                    ]}
                    onSelectionChange={handleScoringSelection}
                    defaultValue="YES"
                  />

                  <PointsInputColumn
                    ids={[
                      "negotiation-probing",
                      "negotiation-hierarchy",
                      "negotiation-solidifying",
                      "negotiation-listening",
                      "negotiation-words",
                      "negotiation-control",
                      "negotiation-education",
                    ]}
                    className="grid grid-rows-7 border-r"
                    valueMap={pointValues}
                    onChange={handlePointChange}
                    disabledMap={disabledPoints}
                  />

                  <TextAreaInputColumn
                    rows={7}
                    className="grid grid-rows-7"
                    ids={[
                      "negotiation-probing",
                      "negotiation-hierarchy",
                      "negotiation-solidifying",
                      "negotiation-listening",
                      "negotiation-words",
                      "negotiation-control",
                      "negotiation-education",
                    ]}
                    dropdownOptions={scoreCardDropdownOptions}
                    valueMap={missedGuidelineValues}
                    onValueChange={handleMissedGuidelineChange}
                    disabledMap={disabledMissedGuidelines}
                  />
                </div>
              </div>

              <div className="flex flex-col text-sm">
                <div className="grid border-x border-b grid-cols-5  ">
                  <div className="border-r px-3 py-1 items-center flex text-center">
                    Closing
                  </div>

                  <div className="grid grid-rows-2 border-r">
                    <div
                      className="border-b px-2 border-gray-400 items-center flex"
                      title="Third Party Call Handling"
                    >
                      Third Party Call Handling
                    </div>

                    <div className=" px-2 items-center flex ">
                      Closing Spiel
                    </div>
                  </div>

                  <NumericInputColumn
                    key={`closing-${formResetKey}`}
                    rows={2}
                    className="grid grid-rows-2 border-r"
                    ids={["closing-third-party", "closing-spiel"]}
                    onSelectionChange={handleScoringSelection}
                    defaultValue="YES"
                  />

                  <PointsInputColumn
                    ids={["closing-third-party", "closing-spiel"]}
                    className="grid grid-rows-2 border-r"
                    valueMap={pointValues}
                    onChange={handlePointChange}
                    disabledMap={disabledPoints}
                  />

                  <TextAreaInputColumn
                    rows={2}
                    className="grid grid-rows-2"
                    ids={["closing-third-party", "closing-spiel"]}
                    dropdownOptions={scoreCardDropdownOptions}
                    valueMap={missedGuidelineValues}
                    onValueChange={handleMissedGuidelineChange}
                    disabledMap={disabledMissedGuidelines}
                  />
                </div>
              </div>

              <div className="flex flex-col text-sm">
                <div className="grid grid-cols-5 border-x border-b">
                  <div className="border-r px-3 py-1 items-center flex">
                    Regulatory and Compliance
                  </div>
                  <div className="grid grid-rows-8 border-r">
                    <div className="border-b px-2 border-gray-400 items-center flex">
                      Call Disposition
                    </div>
                    <div
                      className="border-b items-center flex truncate px-2 border-gray-400"
                      title="Confidentiality of Information"
                    >
                      Confidentiality of Information
                    </div>
                    <div
                      className="border-b px-2 border-gray-400 items-center flex truncate"
                      title="Unfair Debt Collection Practices"
                    >
                      Unfair Debt Collection Practices
                    </div>
                    <div className="border-b px-2 border-gray-400 items-center flex">
                      Information Accuracy
                    </div>
                    <div
                      className="border-b px-2 border-gray-400 items-center flex truncate "
                      title="Call Recording Statement"
                    >
                      Call Recording Statement
                    </div>
                    <div
                      className="border-b px-2 border-gray-400 items-center flex truncate "
                      title="No or Incomplete Attempt to Negotiate"
                    >
                      No or Incomplete Attempt to Negotiate
                    </div>
                    <div
                      className="border-b px-2 border-gray-400 items-center flex truncate"
                      title="Call Avoidance and Early Termination"
                    >
                      Call Avoidance and Early Termination
                    </div>
                    <div className="px-2 items-center flex">
                      Professionalism
                    </div>
                  </div>

                  <NumericInputColumn
                    key={`regulatory-${formResetKey}`}
                    rows={8}
                    className="grid grid-rows-8 border-r"
                    ids={REGULATORY_POINT_IDS}
                    onSelectionChange={handleRegulatorySelection}
                  />

                  <div className="grid grid-rows-8 border-r">
                    {REGULATORY_POINT_IDS.map((id, idx) => {
                      const isSelectedYes = regulatorySelections[id] === "YES";
                      const isLast = idx === REGULATORY_POINT_IDS.length - 1;
                      return (
                        <div
                          key={id}
                          className={`px-2 items-center flex ${
                            isLast ? "" : "border-b border-gray-400"
                          } ${
                            isSelectedYes
                              ? "text-red-600 font-semibold"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          {isSelectedYes ? "Failed" : ""}
                        </div>
                      );
                    })}
                  </div>

                  <TextAreaInputColumn
                    rows={8}
                    className="grid grid-rows-8"
                    ids={[
                      "call-disposition",
                      "confidentiality-of-information",
                      "unfair-debt-collection-practices",
                      "information-accuracy",
                      "call-recording-statement",
                      "incomplete-attempt-to-negotiate",
                      "call-avoidance-early-termination",
                      "professionalism",
                    ]}
                    dropdownOptions={scoreCardDropdownOptions}
                    valueMap={missedGuidelineValues}
                    onValueChange={handleMissedGuidelineChange}
                    disabledMap={regulatoryMissedDisabledMap}
                  />
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
                      <input
                        className="h-full outline-none px-2 py-1 bg-gray-200 border rounded-sm shadow-md w-full"
                        value={highlights}
                        onChange={(event) => setHighlights(event.target.value)}
                      />
                    </div>
                    <div className="flex rows-span-2 gap-2">
                      <div>Comments:</div>
                      <input
                        className="h-full outline-none px-2 py-1 bg-gray-200 border rounded-sm shadow-md w-full"
                        value={commentsNote}
                        onChange={(event) =>
                          setCommentsNote(event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DefaultScoreCard;
