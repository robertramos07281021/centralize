import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { month as MONTHS } from "../middleware/exports";
import { gql, useQuery, useMutation } from "@apollo/client";

const CREATE_UB_SCORECARD = gql`
  mutation CreateUBScoreCardData($input: UBScoreCardInput!) {
    createUBScoreCardData(input: $input) {
      _id
      month
      totalScore
      typeOfScoreCard
    }
  }
`;

type ColumnInputGridProps = {
  inputClassName?: string;
  defectValue?: number | string;
  isReadOnly?: boolean;
  staticCellClassName?: string;
  defectCellClassName?: string;
  renderCell?: (columnIndex: number) => ReactNode;
  onCallValueChange?: (
    callIndex: number,
    value: number,
    previousValue: number
  ) => void;
};

type BucketUser = {
  _id: string;
  name: string;
  type: string;
};

type BucketTL = {
  _id: string;
  name: string;
  buckets?: string[];
};

const GET_BUCKET_USERS = gql`
  query getBucketUser($bucketId: ID) {
    getBucketUser(bucketId: $bucketId) {
      _id
      name
      vici_id
      type
    }
  }
`;

const GET_BUCKET_TL_BY_BUCKET = gql`
  query getBucketTLByBucket($bucketId: ID!) {
    getBucketTLByBucket(bucketId: $bucketId) {
      _id
      name
      buckets
    }
  }
`;

const UB_CARD_BUCKET_ID = "68953e5063619472f1691ce7";

const ColumnInputGrid = ({
  inputClassName = "",
  defectValue,
  isReadOnly = false,
  staticCellClassName = "",
  defectCellClassName = "",
  renderCell,
  onCallValueChange,
}: ColumnInputGridProps) => {
  const callValuesRef = useRef<number[]>([0, 0, 0, 0, 0]);

  const parseNumericValue = (rawValue: string) => {
    if (rawValue.trim() === "") {
      return 0;
    }
    const parsed = Number.parseFloat(rawValue);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const handleCallInputChange = (
    columnIdx: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    if (!onCallValueChange) {
      return;
    }
    const callIndex = columnIdx - 1;
    if (callIndex < 0 || callIndex >= callValuesRef.current.length) {
      return;
    }
    const nextValue = parseNumericValue(event.target.value);
    const previousValue = callValuesRef.current[callIndex] ?? 0;
    if (nextValue === previousValue) {
      return;
    }
    callValuesRef.current[callIndex] = nextValue;
    onCallValueChange(callIndex, nextValue, previousValue);
  };

  return (
    <div className="grid h-full bg-gray-100 w-full grid-cols-6 items-center border-black">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="border-r flex flex-col border-black last:border-r-0 h-full"
        >
          {idx === 0 ? (
            <div
              className={`w-full text-center font-normal ${
                isReadOnly && defectValue == null ? staticCellClassName : ""
              } ${defectCellClassName}`}
            >
              {defectValue ?? ""}
            </div>
          ) : renderCell ? (
            <div className="flex h-full w-full items-stretch">
              {renderCell(idx)}
            </div>
          ) : isReadOnly ? (
            <div
              className={`w-full h-8 rounded-sm ${staticCellClassName}`}
              aria-hidden="true"
            />
          ) : (
            <input
              className={` w-full outline-none ${inputClassName}`}
              inputMode="numeric"
              onChange={(event) => handleCallInputChange(idx, event)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const callLabels = Array.from({ length: 5 }, (_, idx) => `Call ${idx + 1}`);
const DEFECT_PENALTY_PERCENT = 5;
const SCORE_FLOOR_PERCENT = 75;

const getScoreColorClasses = (score: number) => {
  if (score === 0) {
    return "text-red-800 text-black";
  }
  if (score >= 75 && score <= 90) {
    return "text-yellow-800 text-black";
  }
  if (score <= 100 && score > 90) {
    return "text-green-800 text-black";
  }
  return "text-red-800 text-black";
};

type LabeledInputColumnProps = {
  title: string;
  containerClassName?: string;
  titleClassName?: string;
  inputCount?: number;
  inputType?: string;
};

const LabeledInputColumn = ({
  title,
  containerClassName = "",
  titleClassName = "",
  inputCount = 5,
  inputType = "text",
}: LabeledInputColumnProps) => (
  <div
    className={`text-sm bg-gray-100 flex flex-col shadow-md rounded-sm font-black uppercase ${containerClassName}`}
  >
    <div
      className={`bg-gray-400 truncate text-md border-x rounded-t-md border-y px-5 py-1 ${titleClassName}`}
    >
      {title}
    </div>
    {Array.from({ length: inputCount }).map((_, idx) => (
      <input
        key={idx}
        type={inputType}
        className={`py-1 px-3 border-x ${
          idx === inputCount - 1 ? "rounded-b-md" : ""
        } border-b outline-none`}
      />
    ))}
  </div>
);

const CallCommentSection = ({ callNumber }: { callNumber: number }) => (
  <div className="flex w-full h-auto flex-col">
    <div className="grid uppercase grid-cols-4 border bg-gray-400 py-1 rounded-t-md gap-2">
      <div className="col-span-2 ml-2">{` CALL ${callNumber} COMMENTS OF AGENT`}</div>
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
);

const UBScoreCard = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedCollectionOfficer, setSelectedCollectionOfficer] =
    useState<string>("");
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("");
  const [isMonthMenuOpen, setMonthMenuOpen] = useState(false);
  const [isCollectionMenuOpen, setCollectionMenuOpen] = useState(false);
  const [isEvaluatorMenuOpen, setEvaluatorMenuOpen] = useState(false);
  const [questionCallValues, setQuestionCallValues] = useState<{ [questionKey: string]: number[] }>({});
  const [callContactStatuses, setCallContactStatuses] = useState<boolean[]>(
    () => Array(5).fill(true)
  );
  const monthFieldRef = useRef<HTMLDivElement | null>(null);
  const collectionFieldRef = useRef<HTMLDivElement | null>(null);
  const evaluatorFieldRef = useRef<HTMLDivElement | null>(null);
  const [createUBScoreCardData] = useMutation(CREATE_UB_SCORECARD);

  const handleCallValueChange = useCallback(
    (questionKey: string, callIndex: number, value: number) => {
      setQuestionCallValues((prev) => {
        const prevArr = prev[questionKey] ?? Array(5).fill(0);
        const updatedArr = [...prevArr];
        updatedArr[callIndex] = value;
        return { ...prev, [questionKey]: updatedArr };
      });
    },
    []
  );

  const totalDefectsSum = useMemo(() => {
    return Object.values(questionCallValues)
      .flat()
      .reduce((sum, value) => sum + value, 0);
  }, [questionCallValues]);

  const callScores = useMemo(() => {
    const firstKey = Object.keys(questionCallValues)[0];
    const arr = firstKey ? questionCallValues[firstKey] : Array(5).fill(0);
    return arr.map((value) => {
      const rawScore = Math.max(0, 100 - value * DEFECT_PENALTY_PERCENT);
      return rawScore < SCORE_FLOOR_PERCENT ? 0 : rawScore;
    });
  }, [questionCallValues]);

  const overallScore = useMemo(() => {
    if (callScores.length === 0) {
      return 100;
    }
    const totalScore = callScores.reduce((sum, value) => sum + value, 0);
    return totalScore / callScores.length;
  }, [callScores]);

  useEffect(() => {
    if (!isMonthMenuOpen && !isCollectionMenuOpen && !isEvaluatorMenuOpen) {
      return;
    }

    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (monthFieldRef.current?.contains(target)) {
        return;
      }
      if (collectionFieldRef.current?.contains(target)) {
        return;
      }
      if (evaluatorFieldRef.current?.contains(target)) {
        return;
      }

      setMonthMenuOpen(false);
      setCollectionMenuOpen(false);
      setEvaluatorMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [isMonthMenuOpen, isCollectionMenuOpen, isEvaluatorMenuOpen]);

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setMonthMenuOpen(false);
  };

  const handleContactStatusChange = useCallback(
    (callIndex: number, hasContact: boolean) => {
      setCallContactStatuses((prevStatuses) => {
        if (prevStatuses[callIndex] === hasContact) {
          return prevStatuses;
        }
        const updated = [...prevStatuses];
        updated[callIndex] = hasContact;
        return updated;
      });
    },
    []
  );

  const handleCollectionOfficerSelect = (officerId: string) => {
    setSelectedCollectionOfficer(officerId);
    setCollectionMenuOpen(false);
    setEvaluatorMenuOpen(true);
  };

  const handleEvaluatorSelect = (tlId: string) => {
    setSelectedEvaluator(tlId);
    setEvaluatorMenuOpen(false);
  };

  const { data: bucketUsersData } = useQuery<{
    getBucketUser: BucketUser[];
  }>(GET_BUCKET_USERS, {
    variables: { bucketId: UB_CARD_BUCKET_ID },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only",
  });
  const { data: bucketTLData } = useQuery<{
    getBucketTLByBucket: BucketTL[];
  }>(GET_BUCKET_TL_BY_BUCKET, {
    variables: { bucketId: UB_CARD_BUCKET_ID },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only",
  });

  const bucketUsers = bucketUsersData?.getBucketUser ?? [];
  const collectionOfficers = bucketUsers.filter(
    (user) => user.type === "AGENT"
  );
  const evaluators = bucketTLData?.getBucketTLByBucket ?? [];
  const selectedCollectionOfficerLabel =
    collectionOfficers.find(
      (officer) => officer._id === selectedCollectionOfficer
    )?.name || "Select collection officer";
  const selectedEvaluatorLabel =
    evaluators.find((tl) => tl._id === selectedEvaluator)?.name ||
    "Select evaluator";
  return (
    <div className="p-5 flex flex-col  text-black w-full max-h-[90vh]">
      <motion.div
        className="border flex rounded-md overflow-hidden flex-col h-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className=" font-black relative items-center flex justify-center border-b  h-[8.4%]  uppercase bg-gray-400 text-2xl text-center py-3 w-full text-black">
          <div>collection call performance monitor</div>
          <div className="flex items-center absolute right-5 h-full gap-1 justify-end text-xs">
            <button
              className="px-4 py-2 cursor-pointer border-green-900 transition-all border-2 font-black uppercase rounded-sm shadow-md text-white bg-green-700 hover:bg-green-800 disabled:bg-gray-400"
              onClick={async () => {
                if (!selectedMonth) return alert("Please select a month");
                if (!selectedCollectionOfficer)
                  return alert("Please select a collection officer");
                if (!selectedEvaluator)
                  return alert("Please select an evaluator");
                const getCalls = (key: string) => questionCallValues[key] ?? Array(5).fill(0);
                const scoreDetails = {
                  opening: [
                    {
                      question: "Used appropriate greeting / Identified self and Agency (full Agency name)",
                      calls: getCalls("opening-greeting"),
                    },
                    {
                      question: "Mentioned UBP Disclaimer spiel",
                      calls: getCalls("opening-disclaimer"),
                    },
                    {
                      question: "Mentioned Line is Recorded",
                      calls: getCalls("opening-recorded"),
                    },
                    {
                      question: "Mentioned CH/ Valid CP/Y's Full Name for outgoing calls to a registered number. Asked correct Positive Identifiers for incoming calls & calls to unregistered number.",
                      calls: getCalls("opening-fullname"),
                    },
                    {
                      question: "Properly identified self, mentioned first and last name to CH/Valid CP/Y",
                      calls: getCalls("opening-selfid"),
                    },
                  ],
                  collectionCallProper: {
                    withContact: {
                      establishingRapport: {
                        explainedStatus: {
                          question: "Explained the status of the account",
                          calls: getCalls("withContact-explainedStatus"),
                        },
                        askedNotification: {
                          question: "Asked if CH received demand/ notification letter",
                          calls: getCalls("withContact-askedNotification"),
                        },
                        showedEmpathy: {
                          question: "Showed empathy and compassion as appropriate.",
                          calls: getCalls("withContact-showedEmpathy"),
                        },
                      },
                      listeningSkills: {
                        soughtRFD: {
                          question: "Sought RFD in payment & RFBP",
                          calls: getCalls("withContact-soughtRFD"),
                        },
                      },
                      negotiationSkills: {
                        explainedConsequences: {
                          question: "Explained consequences of non-payment, if applicable",
                          calls: getCalls("withContact-explainedConsequences"),
                        },
                        askedCapacity: {
                          question: "Asked for CM's capacity to pay, if applicable",
                          calls: getCalls("withContact-askedCapacity"),
                        },
                        followedHierarchy: {
                          question: "Followed hierarchy of negotiation",
                          calls: getCalls("withContact-followedHierarchy"),
                        },
                      },
                      offeringSolutions: {
                        offeredDiscount: {
                          question: "Offered discount/ amnesty/ promo",
                          calls: getCalls("withContact-offeredDiscount"),
                        },
                        advisedSourceFunds: {
                          question: "Adviced CH to source out funds",
                          calls: getCalls("withContact-advisedSourceFunds"),
                        },
                      },
                    },
                    withoutContact: {
                      establishingRapport: {
                        probedContactNumbers: {
                          question: "Probed on BTC, ETA and other contact numbers",
                          calls: getCalls("withoutContact-probedContactNumbers"),
                        },
                        usedTimeSchedule: {
                          question: "Used time schedule and follow-up if applicable",
                          calls: getCalls("withoutContact-usedTimeSchedule"),
                        },
                        askedPartyName: {
                          question: "Asked for name of party, relation to client",
                          calls: getCalls("withoutContact-askedPartyName"),
                        },
                        leftUrgentMessage: {
                          question: "Left URGENT message ang gave correct contact number",
                          calls: getCalls("withoutContact-leftUrgentMessage"),
                        },
                      },
                    },
                    withOrWithoutContact: {
                      qualityOfCall: {
                        professionalTone: {
                          question: "Used professional tone of voice (did not shout)",
                          calls: getCalls("withOrWithoutContact-professionalTone"),
                        },
                        politeLanguage: {
                          question: "Did not use unacceptable words/phrases and maintained polite/civil language",
                          calls: getCalls("withOrWithoutContact-politeLanguage"),
                        },
                        updatedInfoSheet: {
                          question: "Updated correct information and payment details on info sheet, if applicable",
                          calls: getCalls("withOrWithoutContact-updatedInfoSheet"),
                        },
                        adherenceToPolicy: {
                          question: "Adherence to Policy(BSP, Code of Conduct, etc.)",
                          calls: getCalls("withOrWithoutContact-adherenceToPolicy"),
                        },
                        gppIntegrityIssues: {
                          question: "GPP / INTEGRITY ISSUES (Revealed and Collected debt from unauthorized CP)",
                          calls: getCalls("withOrWithoutContact-gppIntegrityIssues"),
                        },
                        soundJudgment: {
                          question: "Exercised sound judgment in determining the appropriate course of action.",
                          calls: getCalls("withOrWithoutContact-soundJudgment"),
                        },
                      },
                    },
                  },
                  closingTheCall: [
                    {
                      question: "Summarized payment arrangement",
                      calls: getCalls("closing-summarizedPayment"),
                    },
                    {
                      question: "Request return call for payment confirmation",
                      calls: getCalls("closing-requestReturnCall"),
                    },
                  ],
                };

                try {
                  await createUBScoreCardData({
                    variables: {
                      input: {
                        month: selectedMonth,
                        department: UB_CARD_BUCKET_ID,
                        agentName: selectedCollectionOfficer,
                        dateAndTimeOfCall: new Date().toISOString(),
                        number: "N/A",
                        assignedTL: selectedEvaluator,
                        typeOfScoreCard: "UB Score Card",
                        scoreDetails,
                        totalScore: overallScore,
                      },
                    },
                  });
                } catch (err: any) {
                  console.error("GraphQL error:", err);
                  alert("Failed to save. Check console.");
                }
              }}
            >
              Save
            </button>
          </div>
        </div>

        <div className="bg-gray-300  h-[91.6%] overflow-auto p-5 flex flex-col ">
          <div className="flex justify-between">
            <div className="grid grid-cols-4 w-full items-start gap-2">
              <div className="border rounded-md font-black uppercase text-sm shadow-md">
                <div className="grid grid-rows-2 border-b">
                  <div className="bg-gray-400 rounded-t-md px-5 border-b py-1">
                    For the month
                  </div>
                  <div className="relative" ref={monthFieldRef}>
                    <motion.div
                      role="button"
                      tabIndex={0}
                      className="flex text-black bg-white cursor-pointer items-center justify-between gap-2 px-5 py-1 text-sm"
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
                          className="absolute z-20  left-0 top-full mt-1 h-44 w-full overflow-auto rounded-sm border border-black bg-white shadow-lg"
                          role="listbox"
                        >
                          {MONTHS.map((month) => (
                            <button
                              type="button"
                              key={month}
                              className="w-full text-left cursor-pointer even:bg-gray-200 odd:bg-gray-100 border-b last:border-b-0 px-4 py-2 text-sm hover:bg-gray-300"
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
                  <div className="relative" ref={collectionFieldRef}>
                    <motion.div
                      role="button"
                      tabIndex={0}
                      className="flex text-black bg-white cursor-pointer items-center justify-between gap-2 px-5 py-1 text-sm"
                      onClick={() =>
                        setCollectionMenuOpen((prev) => {
                          if (!prev) {
                            setMonthMenuOpen(false);
                            setEvaluatorMenuOpen(false);
                          }
                          return !prev;
                        })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setCollectionMenuOpen((prev) => {
                            if (!prev) {
                              setMonthMenuOpen(false);
                              setEvaluatorMenuOpen(false);
                            }
                            return !prev;
                          });
                        }
                      }}
                      aria-expanded={isCollectionMenuOpen}
                      aria-haspopup="listbox"
                    >
                      <span>{selectedCollectionOfficerLabel}</span>
                      <motion.span
                        className="text-xs"
                        animate={{ rotate: isCollectionMenuOpen ? 90 : 0 }}
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
                      {isCollectionMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-20 left-0 top-full mt-1 h-44 w-full overflow-auto rounded-sm border border-black bg-white shadow-lg"
                          role="listbox"
                        >
                          {collectionOfficers.map((officer) => (
                            <button
                              type="button"
                              key={officer._id}
                              className="w-full text-left cursor-pointer even:bg-gray-200 odd:bg-gray-100 border-b last:border-b-0 px-4 py-2 text-sm hover:bg-gray-300"
                              onClick={() =>
                                handleCollectionOfficerSelect(officer._id)
                              }
                            >
                              {officer.name}
                            </button>
                          ))}
                          {collectionOfficers.length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No collection officers
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="grid grid-rows-2 ">
                  <div className="bg-gray-400 px-5 border-b py-1">
                    Evaluator
                  </div>
                  <div className="relative" ref={evaluatorFieldRef}>
                    <motion.div
                      role="button"
                      tabIndex={0}
                      className="flex text-black rounded-b-sm bg-white cursor-pointer items-center justify-between gap-2 px-5 py-1 text-sm"
                      onClick={() =>
                        setEvaluatorMenuOpen((prev) => {
                          if (!prev) {
                            setMonthMenuOpen(false);
                            setCollectionMenuOpen(false);
                          }
                          return !prev;
                        })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setEvaluatorMenuOpen((prev) => {
                            if (!prev) {
                              setMonthMenuOpen(false);
                              setCollectionMenuOpen(false);
                            }
                            return !prev;
                          });
                        }
                      }}
                      aria-expanded={isEvaluatorMenuOpen}
                      aria-haspopup="listbox"
                    >
                      <span>{selectedEvaluatorLabel}</span>
                      <motion.span
                        className="text-xs"
                        animate={{ rotate: isEvaluatorMenuOpen ? 90 : 0 }}
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
                      {isEvaluatorMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-20 left-0 top-full mt-1 h-44 w-full overflow-auto rounded-sm border border-black bg-white shadow-lg"
                          role="listbox"
                        >
                          {evaluators.map((tl) => (
                            <button
                              type="button"
                              key={tl._id}
                              className="w-full text-left cursor-pointer even:bg-gray-200 odd:bg-gray-100 border-b last:border-b-0 px-4 py-2 text-sm hover:bg-gray-300"
                              onClick={() => handleEvaluatorSelect(tl._id)}
                            >
                              {tl.name}
                            </button>
                          ))}
                          {evaluators.length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No evaluators
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="flex items-end ">
                <div className=" text-sm truncate px-3 gap-2.5 flex flex-col">
                  {callLabels.map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>
                <LabeledInputColumn
                  title="Account Name/Account Number"
                  containerClassName="w-full"
                />
              </div>

              <LabeledInputColumn
                title="Date and Time of Call"
                containerClassName="w-full"
                inputType="datetime-local"
              />

              <div className="flex w-full gap-2">
                <LabeledInputColumn
                  title="Date of Logger Review"
                  containerClassName="w-full"
                />
                <LabeledInputColumn
                  title="1st Call"
                  containerClassName="w-full truncate"
                />
                <LabeledInputColumn
                  title="Lat Call"
                  containerClassName="w-full truncate"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col pb-5 overflow-auto gap-2 h-full ">
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
                  title="Used appropriate greeting / Identified self and Agency (full Agency name)"
                >
                  Used appropriate greeting / Identified self and Agency (full Agency name)
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("opening-greeting", callIdx, value)}
                  defectValue={2}
                />
              </div>

              <div className=" h-full bg-gray-100 flex border-x border-b ">
                <div className="w-full pl-3 py-1 border-r truncate">
                  Mentioned UBP Disclaimer spiel
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("opening-disclaimer", callIdx, value)}
                  defectValue={6}
                />
              </div>
              <div className=" h-full bg-gray-100 flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="
                  Mentioned Line is Recorded"
                >
                  Mentioned Line is Recorded
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("opening-recorded", callIdx, value)}
                  inputClassName="whitespace-nowrap"
                  defectValue={5}
                />
              </div>
              <div className="h-full flex bg-gray-100 flex-row border-x border-b ">
                <div
                  className="w-full truncate pl-3 py-1 border-r"
                  title="
                  Mentioned CH/ Valid CP/Y's Full Name for outgoing calls to a registered number. Asked correct Positive Identifiers for incoming calls & calls to unregistered number.
                "
                >
                  Mentioned CH/ Valid CP/Y's Full Name for outgoing calls to a
                  registered number. Asked correct Positive Identifiers for
                  incoming calls & calls to unregistered number.
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("opening-fullname", callIdx, value)}
                  defectValue={6}
                />
              </div>
              <div className="h-full flex bg-gray-100 rounded-b-md shadow-md border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r "
                  title="  Properly identified self, mentioned first and last name to CH/Valid CP/Y"
                >
                  Properly identified self, mentioned first and last name to CH/
                  Valid CP/Y
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("opening-selfid", callIdx, value)}
                  defectValue={6}
                />
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
                  className="w-full pl-3 py-1 border-r truncate flex"
                  title="
                  Explained the status of the account*"
                >
                  Explained the status of the account
                  <div className="text-red-800 font-black ml-1">*</div>
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withContact-explainedStatus", callIdx, value)}
                  defectValue={1}
                />
              </div>

              <div className=" h-full flex border-x bg-gray-100 border-b ">
                <div className="w-full pl-3 py-1  border-r truncate flex">
                  Asked if CH received demand/ notification letter
                  <div className="text-red-800 font-black ml-1">*</div>
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withContact-askedNotification", callIdx, value)}
                  defectValue={1}
                />
              </div>
              <div className=" h-full flex border-x bg-gray-100 border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Showed empathy and compassion as appropriate.
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withContact-showedEmpathy", callIdx, value)}
                  inputClassName="whitespace-nowrap"
                  defectValue={2}
                />
              </div>

              <div className="w-full font-semibold bg-gray-300 px-3 py-1  border-x border-b">
                LISTENING SKILLS
              </div>
              <div
                className="h-full flex flex-row bg-gray-100 border-x border-b "
                title="
                Sought RFD in payment & RFBP*"
              >
                <div className="w-full pl-3 py-1 border-r truncate flex">
                  Sought RFD in payment & RFBP
                  <div className="text-red-800 font-black ml-1">*</div>
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withContact-soughtRFD", callIdx, value)}
                  defectValue={7}
                />
              </div>

              <div className="w-full uppercase font-semibold bg-gray-300 px-3 py-1  border-x border-b">
                negotiation SKILLS
              </div>
              <div className=" h-full flex border-x border-b bg-gray-100 ">
                <div
                  className="w-full pl-3 truncate py-1 border-r flex"
                  title=" Explained consequences of non-payment, if applicable (explained conseq of legal and BAP listing/explained side of the Bank and the contract signed/explained that the bank is serious in collecting legal obligations/possible negative listing of name/future credit facility will be closed/additional collection agency expenses/involvement of lawyer will also be CH's expense)*"
                >
                  Explained consequences of non-payment, if applicable
                  (explained conseq of legal and BAP listing/explained side of
                  the Bank and the contract signed/explained that the bank is
                  serious in collecting legal obligations/possible negative
                  listing of name/future credit facility will be
                  closed/additional collection agency expenses/involvement of
                  lawyer will also be CH's expense)
                  <div className="text-red-800 font-black ml-1">*</div>
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withContact-explainedConsequences", callIdx, value)}
                  defectValue={1}
                />
              </div>

              <div className=" h-full flex border-x border-b bg-gray-100 ">
                <div
                  className="w-full pl-3 py-1 border-r flex"
                  title=" Asked for CM's capacity to pay, if applicable"
                >
                  Asked for CM's capacity to pay, if applicable
                  <div className="text-red-800 font-black ml-1">*</div>
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withContact-askedCapacity", callIdx, value)}
                  defectValue={1}
                />
              </div>

              <div className=" h-full flex border-x border-b bg-gray-100 ">
                <div
                  className="w-full pl-3 py-1 border-r flex"
                  title=" Followed hierarchy of negotiation*"
                >
                  Followed hierarchy of negotiation
                  <div className="text-red-800 font-black ml-1">*</div>
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withContact-followedHierarchy", callIdx, value)}
                  defectValue={1}
                />
              </div>

              <div className="w-full uppercase font-semibold bg-gray-300 px-3 py-1  border-x border-b">
                OFFERING SOLUTIONS
              </div>

              <div className=" h-full flex border-x border-b bg-gray-100 ">
                <div
                  className="w-full pl-3 py-1 border-r flex"
                  title=" Followed hierarchy of negotiation*"
                >
                  Offered discount/ amnesty/ promo
                  <div className="text-red-800 font-black ml-1">*</div>
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withContact-offeredDiscount", callIdx, value)}
                  defectValue={1}
                />
              </div>

              <div className=" h-full flex border-x rounded-b-md bg-gray-100 shadow-md border-b ">
                <div
                  className="w-full pl-3 py-1 border-r flex"
                  title=" Followed hierarchy of negotiation*"
                >
                  Adviced CH to source out funds
                  <div className="text-red-800 font-black ml-1">*</div>
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withContact-advisedSourceFunds", callIdx, value)}
                  defectValue={1}
                />
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
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withoutContact-probedContactNumbers", callIdx, value)}
                  defectValue={7}
                />
              </div>

              <div className=" h-full bg-gray-100 flex border-x border-b ">
                <div className="w-full pl-3 py-1 border-r truncate">
                  Used time schedule and follow-up if applicable
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withoutContact-usedTimeSchedule", callIdx, value)}
                  defectValue={6}
                />
              </div>
              <div className=" h-full bg-gray-100 flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Asked for name of party, relation to client
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withoutContact-askedPartyName", callIdx, value)}
                  inputClassName="whitespace-nowrap"
                  defectValue={7}
                />
              </div>

              <div className=" h-full bg-gray-100 rounded-b-md shadow-md flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Left URGENT message ang gave correct contact number
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withoutContact-leftUrgentMessage", callIdx, value)}
                  inputClassName="whitespace-nowrap"
                  defectValue={6}
                />
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
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withOrWithoutContact-professionalTone", callIdx, value)}
                  defectValue={7}
                />
              </div>

              <div className=" h-full flex bg-gray-100 border-x border-b ">
                <div className="w-full pl-3 py-1 border-r truncate">
                  Did not use unacceptable words/phrases and maintained
                  polite/civil language
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withOrWithoutContact-politeLanguage", callIdx, value)}
                  defectValue={6}
                />
              </div>
              <div className=" h-full flex bg-gray-100 border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Updated correct information and payment details on info sheet,
                  if applicable
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withOrWithoutContact-updatedInfoSheet", callIdx, value)}
                  inputClassName="whitespace-nowrap"
                  defectValue={7}
                />
              </div>

              <div className=" h-full flex bg-gray-100 border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Adherence to Policy(BSP, Code of Conduct, etc.)
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withOrWithoutContact-adherenceToPolicy", callIdx, value)}
                  inputClassName="whitespace-nowrap"
                  defectValue={6}
                />
              </div>

              <div className=" h-full flex bg-gray-100 border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  GPP / INTEGRITY ISSUES (Revealed and Collected debt from
                  unauthorized CP)
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withOrWithoutContact-gppIntegrityIssues", callIdx, value)}
                  inputClassName="whitespace-nowrap"
                  defectValue={7}
                />
              </div>

              <div className=" h-full rounded-b-md bg-gray-100 shadow-md flex border-x border-b ">
                <div
                  className="w-full pl-3 py-1 border-r truncate "
                  title="Showed empathy and compassion as appropriate."
                >
                  Exercised sound judgment in determining the appropriate course
                  of action.
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("withOrWithoutContact-soundJudgment", callIdx, value)}
                  inputClassName="whitespace-nowrap"
                  defectValue={6}
                />
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
                  className="w-full pl-3 py-1 border-r truncate flex"
                  title="Summarized payment arrangement*"
                >
                  Summarized payment arrangement
                  <div className="text-red-800 font-black ml-1">*</div>
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("closing-summarizedPayment", callIdx, value)}
                  defectValue={1}
                />
              </div>

              <div className=" bg-gray-100 h-full flex border-x border-b rounded-b-md  ">
                <div
                  className="w-full pl-3 py-1 border-r truncate flex"
                  title="Request return call for payment confirmation*"
                >
                  Request return call for payment confirmation
                  <div className="text-red-800 font-black ml-1">*</div>
                </div>
                <ColumnInputGrid
                  onCallValueChange={(callIdx, value) => handleCallValueChange("closing-requestReturnCall", callIdx, value)}
                  defectValue={1}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse h-full gap-2">
              <div className="flex w-full h-auto flex-col overflow-hidden border rounded-md">
                <div className=" bg-gray-100 border-b h-full flex items-stretch">
                  <div
                    className="w-full pl-3 py-1 border-r truncate flex items-center"
                    title="Summarized payment arrangement*"
                  >
                    WITH CONTACT? (Y/N)
                  </div>
                  <ColumnInputGrid
                    isReadOnly
                    renderCell={(columnIndex) => {
                      const callNumber = columnIndex;
                      const callIdx = columnIndex - 1;
                      const hasContact = callContactStatuses[callIdx];
                      return (
                        <div className="flex w-full p-1 items-center justify-center gap-1">
                          <button
                            type="button"
                            className={`w-full h-full rounded border-2 text-xs py-1 font-black  transition-colors ${
                              hasContact
                                ? "bg-gray-200 border-gray-400 text-gray-400 cursor-not-allowed"
                                : "bg-green-600 border-green-900 text-white cursor-pointer"
                            }`}
                            aria-label={`Call ${callNumber} with contact`}
                            aria-pressed={hasContact}
                            onClick={() =>
                              handleContactStatusChange(callIdx, true)
                            }
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            className={`w-full h-full rounded border-2 text-xs py-1 font-black transition-colors ${
                              !hasContact
                                ? "bg-gray-200 border-gray-400 text-gray-400 cursor-not-allowed"
                                : "bg-red-600 border-red-900 text-white cursor-pointer"
                            }`}
                            aria-label={`Call ${callNumber} without contact`}
                            aria-pressed={!hasContact}
                            onClick={() =>
                              handleContactStatusChange(callIdx, false)
                            }
                          >
                            NO
                          </button>
                        </div>
                      );
                    }}
                  />
                </div>

                <div className=" bg-gray-100 items-center h-full flex border-b ">
                  <div
                    className="w-full pl-3 py-1 border-r truncate"
                    title="Request return call for payment confirmation*"
                  >
                    TOTAL DEFECTS
                  </div>
                  <ColumnInputGrid
                    defectValue={
                      Number.isFinite(totalDefectsSum)
                        ? totalDefectsSum.toString()
                        : "0"
                    }
                    defectCellClassName="font-black"
                    renderCell={(columnIndex) => {
                      const callIdx = columnIndex - 1;
                      const perCallTotal = Object.values(questionCallValues)
                        .map(arr => arr[callIdx] ?? 0)
                        .reduce((sum, v) => sum + v, 0);
                      return (
                        <div
                          className="w-full items-center flex rounded-sm border border-gray-300 bg-white px-2 py-1 text-center text-sm font-semibold"
                          aria-label={`Call ${columnIndex} total defects`}
                        >
                          {perCallTotal.toString()}
                        </div>
                      );
                    }}
                  />
                </div>
                <div className=" bg-gray-100 h-full flex  shadow-md ">
                  <div
                    className="w-full pl-3 py-1 border-r truncate"
                    title="Summarized payment arrangement*"
                  >
                    SCORE
                  </div>
                  <ColumnInputGrid
                    isReadOnly
                    renderCell={(columnIndex) => (
                      <div
                        className={`w-full h-full text-center transition-all duration-500 font-black text-sm flex items-center justify-center ${getScoreColorClasses(
                          callScores[columnIndex - 1] ?? 100
                        )}`}
                        aria-label={`Call ${columnIndex} score`}
                      >
                        {`${(callScores[columnIndex - 1] ?? 100).toFixed(0)}%`}
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="flex flex-col border rounded-sm overflow-auto justify-end font-black uppercase">
                <div className="bg-gray-400 px-3 py-1 text-lg border-b">
                  Total score
                </div>
                <div className="h-full flex text-center text-2xl w-full">
                  <span
                    className={`inline-block w-full transition-all duration-500  h-full px-4 py-3 font-black  ${getScoreColorClasses(
                      overallScore
                    )}`}
                  >
                    {`${overallScore.toFixed(0)}%`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex w-full h-auto gap-2 flex-col">
              {callLabels.map((_, idx) => (
                <CallCommentSection key={idx} callNumber={idx + 1} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UBScoreCard;
