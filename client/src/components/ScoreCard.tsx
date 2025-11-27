import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { scoreCardDropdownOptions } from "../middleware/exports";

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
  onSelectionChange?: (id: string, value: string) => void;
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
};

const NumericInputColumn = ({
  rows,
  className = "",
  ids,
  onSelectionChange,
}: NumericInputColumnProps) => {
  const [selected, setSelected] = useState<(string | null)[]>(() =>
    Array(rows).fill("N/A")
  );

  const buttons = [
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
          className="flex py-1 border-b items-center w-full justify-center border-gray-400 last:border-b-0 gap-2 px-3"
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
}: PointsInputColumnProps) => (
  <div className={className}>
    {ids.map((id, idx) => (
      <input
        key={id}
        type="number"
        inputMode="numeric"
        min={0}
        className={`outline-none px-2 py-1 ${
          idx !== ids.length - 1 ? "border-b border-gray-400" : ""
        }`}
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
  const [saveFeedback, setSaveFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [pointValues, setPointValues] = useState<Record<string, string>>({});
  const [missedGuidelineValues, setMissedGuidelineValues] = useState<
    Record<string, string>
  >({});
  const [regulatorySelections, setRegulatorySelections] = useState<
    Record<string, string>
  >(() =>
    REGULATORY_POINT_IDS.reduce<Record<string, string>>((acc, id) => {
      acc[id] = "N/A";
      return acc;
    }, {})
  );
  const regulatoryMissedDisabledMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    REGULATORY_POINT_IDS.forEach((regId, idx) => {
      const missedId = REGULATORY_MISSED_GUIDELINE_IDS[idx];
      map[missedId] = regulatorySelections[regId] === "YES";
    });
    return map;
  }, [regulatorySelections]);
  const monthFieldRef = useRef<HTMLDivElement | null>(null);
  const deptFieldRef = useRef<HTMLDivElement | null>(null);
  const agentFieldRef = useRef<HTMLDivElement | null>(null);

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
        setSaveFeedback({ type: "success", message: "Score card saved." });
      },
      onError: (error) => {
        setSaveFeedback({ type: "error", message: error.message });
      },
    }
  );

  const { userLogged } = useSelector((state: RootState) => state.auth);
  const LoginUser = userLogged?.name || "Unknown";

  const totalScore = useMemo(() => {
    return Object.values(pointValues).reduce((sum, value) => {
      const parsed = parseFloat(value);
      return sum + (Number.isNaN(parsed) ? 0 : parsed);
    }, 0);
  }, [pointValues]);

  const scoreExceeded = totalScore > MAX_TOTAL_SCORE;
  const scoreDisplay = scoreExceeded ? "Score too much!" : totalScore;
  const scoreColorClass = scoreExceeded
    ? "text-red-600"
    : totalScore < 75
    ? "text-red-600"
    : totalScore < 87
    ? "text-yellow-500"
    : "text-green-600";

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
    if (value === "YES") {
      const missedId = REGULATORY_SELECTION_TO_MISSED_MAP[fieldId];
      if (missedId) {
        handleMissedGuidelineChange(missedId, "");
      }
    }
  };

  const handleSave = async () => {
    setSaveFeedback(null);

    if (!userLogged?._id) {
      setSaveFeedback({
        type: "error",
        message: "Session expired. Please log in again.",
      });
      return;
    }

    if (
      !selectedMonth ||
      !selectedDeptId ||
      !selectedAgentId ||
      !callDateTime ||
      !callNumber.trim()
    ) {
      setSaveFeedback({
        type: "error",
        message: "Please complete all required fields.",
      });
      return;
    }

    try {
      await createScoreCardData({
        variables: {
          input: {
            month: selectedMonth,
            department: selectedDeptId,
            agent: selectedAgentId,
            dateAndTimeOfCall: new Date(callDateTime).toISOString(),
            number: callNumber.trim(),
            assignedQA: userLogged._id,
            typeOfScoreCard: SCORE_CARD_TYPE,
          },
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-10 flex flex-col  text-black w-full h-full">
      <motion.div
        className="border flex rounded-md overflow-hidden flex-col h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className=" font-black border-b items-center justify-center flex relative  uppercase bg-gray-400 text-2xl text-center py-3 w-full text-black">
          <div>QA Evaluation Page</div>

          <div
            role="button"
            tabIndex={0}
            aria-disabled={saveLoading}
            className={`py-1 px-4 text-sm absolute right-5 border-green-900 transition-all border-2 font-black uppercase rounded-sm shadow-md text-white ${
              saveLoading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 cursor-pointer"
            }`}
            onClick={() => {
              if (!saveLoading) {
                void handleSave();
              }
            }}
            onKeyDown={(event) => {
              if (
                !saveLoading &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                void handleSave();
              }
            }}
          >
            {saveLoading ? "Saving..." : "Save"}
          </div>
        </div>
        <div className="bg-gray-300 p-5 flex flex-col h-full">
          {saveFeedback && (
            <div
              className={`mb-3 text-sm font-semibold ${
                saveFeedback.type === "error"
                  ? "text-red-600"
                  : "text-green-700"
              }`}
            >
              {saveFeedback.message}
            </div>
          )}
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
                <div
                  className={`bg-gray-200 border-black text-7xl font-black border-x border-b flex items-center justify-center rounded-b-md w-full h-full overflow-hidden ${scoreColorClass}`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={scoreExceeded ? "score-too-much" : totalScore}
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -30, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className={` ${
                        scoreExceeded ? "uppercase text-red-600 text-2xl" : ""
                      } `}
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
              <div>missed guidlines</div>
            </div>

            <motion.div
              layout
              className="bg-gray-100  overflow-auto max-h-[450px] rounded-b-md"
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
                      rows={2}
                      className="grid grid-rows-2 w-full border-r"
                    />

                    <PointsInputColumn
                      ids={["opening-question-1", "opening-question-2"]}
                      className="grid grid-rows-2 border-r"
                      valueMap={pointValues}
                      onChange={handlePointChange}
                    />

                    <TextAreaInputColumn
                      rows={2}
                      className="grid grid-rows-2"
                      ids={["opening-introduction", "opening-account-overview"]}
                      dropdownOptions={scoreCardDropdownOptions}
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
                    rows={7}
                    className="grid grid-rows-7 border-r"
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
                    rows={2}
                    className="grid grid-rows-2 border-r"
                  />

                  <PointsInputColumn
                    ids={["closing-third-party", "closing-spiel"]}
                    className="grid grid-rows-2 border-r"
                    valueMap={pointValues}
                    onChange={handlePointChange}
                  />

                  <TextAreaInputColumn
                    rows={2}
                    className="grid grid-rows-2"
                    ids={["closing-third-party", "closing-spiel"]}
                    dropdownOptions={scoreCardDropdownOptions}
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
                      <input className="h-full outline-none px-2 py-1 bg-gray-200 border rounded-sm shadow-md w-full" />
                    </div>
                    <div className="flex rows-span-2 gap-2">
                      <div>Comments:</div>
                      <input className="h-full outline-none px-2 py-1 bg-gray-200 border rounded-sm shadow-md w-full" />
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
