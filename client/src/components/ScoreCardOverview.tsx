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
  call: number;
  agent: string;
  tl: string;
  actionPlan: string;
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

const ScoreCardOverview = () => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isOpenDefaultScoreCard, setIsOpenDefaultScoreCard] =
    useState<boolean>(false);
  const [isOpenUBScoreCard, setIsOpenUBScoreCard] = useState<boolean>(false);
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
                  <span className="font-medium text-black">Poindts:</span>
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

  const closeModal = () => {
    setIsOpenDefaultScoreCard(false);
    setSelectedScoreCard(null);
  };

  console.log(selectedScoreCard?.typeOfScoreCard, "<<");

  const openScoreCardModal = (scoreCardType: string) => {
    if (scoreCardType === "UB Score Card") {
      setIsOpenDefaultScoreCard(false);
      setIsOpenUBScoreCard(true);
    } else {
      setIsOpenUBScoreCard(false);
      setIsOpenDefaultScoreCard(true);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedScoreCard || isExportingExcel) {
      if (!selectedScoreCard) {
        window.alert("Select a score card to export.");
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
        <div className="p-4 flex flex-col bg-gray-300 h-full gap-4 text-sm overflow-auto">
          <div className="bg-white border border-black rounded-md shadow-sm p-4">
            <div className="uppercase text-xs text-gray-500">average score</div>
            <div className="text-3xl font-black text-gray-800">
              {overviewStats.avgScore.toFixed(1)}
            </div>
          </div>
          <div className="bg-white border border-black rounded-md shadow-sm p-4">
            <div className="uppercase text-xs text-gray-500">highest score</div>
            <div className="text-3xl font-black text-gray-800">
              {overviewStats.highestScore.toFixed(1)}
            </div>
          </div>
          <div className="bg-white border border-black rounded-md shadow-sm p-4">
            <div className="uppercase text-xs text-gray-500">pass rate</div>
            <div className="text-3xl font-black text-gray-800">
              {overviewStats.passRate.toFixed(0)}%
            </div>
          </div>
          <div className="bg-white border border-black rounded-md shadow-sm p-4">
            <div className="uppercase text-xs text-gray-500">records shown</div>
            <div className="text-3xl font-black text-gray-800">
              {scorecards.length}
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
          <div className="w-full border flex flex-col bg-gray-100 rounded-sm overflow-hidden">
            <div className="grid grid-cols-6  uppercase gap-4 p-3 font-black border-b bg-gray-200">
              <div>QA Name</div>
              <div>Agent Name</div>
              <div>Score Card Type</div>
              <div>Date</div>
              <div className="text-center">Total Score</div>
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
                ) : scorecards.length === 0 ? (
                  <div className="flex justify-center items-center h-full py-2 text-gray-400">
                    No data available
                  </div>
                ) : (
                  <div className="flex flex-col divide-y overflow-auto">
                    {scorecards.map((entry, index) => {
                      const badge = getStatusBadge(entry.totalScore);
                      const formattedDate = formatDate(
                        entry.dateAndTimeOfCall || entry.createdAt
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
                            {entry.typeOfScoreCard}
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

                {Array.isArray(selectedScoreCard.scoreDetails?.callComments) &&
                  selectedScoreCard.scoreDetails.callComments.filter(Boolean)
                    .length > 0 && (
                    <div className="mt-2 shadow-md">
                      <div className="font-black bg-gray-300 rounded-t-md py-1 w-full border text-center uppercase text-xl text-black">
                        Call Comments
                      </div>
                      <div className="border-x border-b overflow-hidden rounded-b-md border-black text-sm text-gray-700 bg-gray-50 divide-y">
                        {selectedScoreCard.scoreDetails.callComments
                          .filter(Boolean)
                          .map((comment: any, idx: number) => {
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
                                    {comment?.agent ? (
                                      String(comment.agent)
                                    ) : (
                                      <div className="italic  ml-1 text-xs text-gray-400">
                                        No comment
                                      </div>
                                    )}
                                  </div>
                                  <div className="col-span-1 flex items-center">
                                    <span className="font-semibold">
                                      {" "}
                                      Comments of Agency TL:
                                    </span>{" "}
                                    {comment?.tl ? (
                                      String(comment.tl)
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
                                    {comment?.actionPlan ? (
                                      String(comment.actionPlan)
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
    </div>
  );
};

export default ScoreCardOverview;
