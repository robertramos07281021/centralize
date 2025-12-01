import React, { useMemo, useState } from "react";
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
    }
  }
`;

type ScoreEntry = {
  scores?: number | null;
  points?: number | null;
  missedGuidlines?: string | null;
};

type ScoreSection = Record<string, ScoreEntry>;

type ScoreDetails = {
  opening?: ScoreSection | null;
  negotiationSkills?: ScoreSection | null;
  closing?: ScoreSection | null;
  regulatoryAndCompliance?: ScoreSection | null;
  comments?: {
    highlights?: string | null;
    comments?: string | null;
  } | null;
};

type ScoreCardSummary = {
  _id: string;
  typeOfScoreCard: string;
  totalScore?: number | null;
  dateAndTimeOfCall?: string;
  createdAt?: string;
  updatedAt?: string;
  scoreDetails?: ScoreDetails | null;
  agent?: {
    _id: string;
    name: string;
  } | null;
};

const ScoreCardOverview = () => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedScoreCard, setSelectedScoreCard] =
    useState<ScoreCardSummary | null>(null);

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

  console.log(data, "<<");

  const scorecards: ScoreCardSummary[] = data?.getScoreCardSummaries ?? [];

  const overviewStats = useMemo(() => {
    if (scorecards.length === 0) {
      return {
        avgScore: 0,
        highestScore: 0,
        passRate: 0,
      };
    }
    const scores = scorecards
      .map((entry) => entry.totalScore ?? null)
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value)
      );
    const totalScore = scores.reduce((sum, value) => sum + value, 0);
    const highestScore = scores.length ? Math.max(...scores) : 0;
    const passCount = scores.filter((score) => score >= 87).length;
    return {
      avgScore: scores.length ? totalScore / scores.length : 0,
      highestScore,
      passRate: scores.length ? (passCount / scores.length) * 100 : 0,
    };
  }, [scorecards]);

  const getStatusBadge = (score?: number | null) => {
    if (score == null) {
      return { label: "Pending", className: "bg-gray-200 text-gray-600" };
    }
    if (score >= 87) {
      return { label: "Pass", className: "bg-green-100 text-green-700" };
    }
    if (score >= 75) {
      return { label: "Coach", className: "bg-yellow-100 text-yellow-700" };
    }
    return { label: "Fail", className: "bg-red-100 text-red-700" };
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

  const renderSection = (title: string, section?: ScoreSection | null) => {
    if (!section || Object.keys(section).length === 0) {
      return null;
    }
    return (
      <div key={title} className="mt-2">
        <div className="font-black bg-gray-300 rounded-t-md py-1 w-full border text-center uppercase text-xl text-black">
          {title}
        </div>
        <div className="divide-y">
          {Object.entries(section).map(([key, entry]) => (
            <div
              key={key}
              className="grid grid-cols-1 even:bg-gray-100 odd:bg-gray-200 last:border-b last:rounded-b-md border-x md:grid-cols-3 gap-2 px-3 py-2 text-xs md:text-sm"
            >
              <div className="font-semibold uppercase text-black">
                {formatFieldLabel(key)}:
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
                    entry.points < 5
                      ? "bg-red-600 border-red-900"
                      : entry.points < 10
                      ? "bg-amber-600 border-amber-900"
                      : entry.points < 1
                      ? "bg-green-600 border-green-900"
                      : "bg-green-600 border-green-900"
                  } font-black text-white text-shadow-2xs shadow-md px-3 border-2 rounded-sm py-1 `}
                >
                  {entry?.points === 1 ?  "Failed" : entry?.points === 2 ? "Passed"  ? entry?.scores : formatPoints(entry?.points): 0}
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
          ))}
        </div>
      </div>
    );
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedScoreCard(null);
  };

  return (
    <div className="p-10 flex w-full h-[90vh] relative gap-2">
      <motion.div
        className="w-[30%] bg-gray-100 text-gray-700 border-black rounded-md shadow-md h-full border flex flex-col"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="border-b px-4 text-black py-3 text-2xl font-black uppercase text-center bg-gray-400">
          Overview
        </div>
        <div className="p-4 flex flex-col bg-gray-300 h-full gap-4 text-sm overflow-auto">
          <div className="bg-white border rounded-md shadow-sm p-4">
            <div className="uppercase text-xs text-gray-500">average score</div>
            <div className="text-3xl font-black text-gray-800">
              {overviewStats.avgScore.toFixed(1)}
            </div>
          </div>
          <div className="bg-white border rounded-md shadow-sm p-4">
            <div className="uppercase text-xs text-gray-500">highest score</div>
            <div className="text-3xl font-black text-gray-800">
              {overviewStats.highestScore.toFixed(1)}
            </div>
          </div>
          <div className="bg-white border rounded-md shadow-sm p-4">
            <div className="uppercase text-xs text-gray-500">pass rate</div>
            <div className="text-3xl font-black text-gray-800">
              {overviewStats.passRate.toFixed(0)}%
            </div>
          </div>
          <div className="bg-white border rounded-md shadow-sm p-4">
            <div className="uppercase text-xs text-gray-500">records shown</div>
            <div className="text-3xl font-black text-gray-800">
              {scorecards.length}
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="w-[70%] flex flex-col bg-gray-300 overflow-auto rounded-md shadow-md border"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
      >
        <div className="bg-gray-400 py-3 font-black uppercase text-center border-b text-2xl">
          Score card overview
        </div>
        <div className="p-3 h-full flex flex-col gap-2">
          <div className="flex justify-between gap-3 flex-wrap">
            <div className="border bg-gray-100 rounded-sm flex items-center px-3">
              <input
                className="text-shadow px-3 py-1 outline-none bg-transparent"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
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
          <div className="w-full h-full border flex flex-col bg-gray-100 rounded-sm overflow-hidden">
            <div className="grid grid-cols-4 uppercase gap-4 p-3 font-black border-b bg-gray-200">
              <div>Name</div>
              <div>Score Card Type</div>
              <div className="text-center">Total Score</div>
              <div className="text-center">Status</div>
            </div>
            {error && (
              <div className="flex justify-center items-center h-full text-red-600 font-semibold">
                {error.message}
              </div>
            )}
            {!error && (
              <div className="flex-1 overflow-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-full text-gray-500 italic">
                    Loading...
                  </div>
                ) : scorecards.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    No data available
                  </div>
                ) : (
                  <div className="flex flex-col divide-y">
                    {scorecards.map((entry, index) => {
                      const badge = getStatusBadge(entry.totalScore);
                      return (
                        <motion.div
                          key={entry._id}
                          className="grid grid-cols-4 hover:bg-gray-200 even:bg-gray-100 cursor-pointer odd:bg-white gap-4 px-4 py-3 text-sm items-center bg-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                          onClick={() => {
                            setSelectedScoreCard(entry);
                            setIsOpen(true);
                          }}
                        >
                          <div>
                            <div className="font-semibold first-letter:uppercase text-gray-800">
                              {entry.agent?.name || "Unknown Agent"}
                            </div>
                          </div>
                          <div className="text-gray-700 font-medium">
                            {entry.typeOfScoreCard}
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
        {isOpen && selectedScoreCard && (
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
              className="bg-white relative z-20 border rounded-md p-6 max-w-3xl  max-h-[80vh] overflow-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className=" flex sticky top-0 right-0 justify-end">
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
                    class="size-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScoreCardOverview;
