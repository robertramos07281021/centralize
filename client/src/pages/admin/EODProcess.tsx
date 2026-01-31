import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const GET_CAMPAIGNS = gql`
  query Aom {
    getDepts {
      branch
      id
      name
    }
  }
`;

const GET_EODS = gql`
  query GetEODs {
    getEODs {
      _id
      campaign {
        _id
        name
      }
      ticketNo
      description
      status
      recommendation
      createdBy {
        _id
        name
      }
      finishedAt
      createdAt
    }
  }
`;

const CREATE_EOD = gql`
  mutation CreateEOD($input: CreateEODInput!) {
    createEOD(input: $input) {
      _id
      campaign {
        _id
        name
      }
      ticketNo
      description
      status
      recommendation
      createdAt
    }
  }
`;

const DELETE_EOD = gql`
  mutation DeleteEOD($id: ID!) {
    deleteEOD(id: $id) {
      _id
    }
  }
`;

const UPDATE_EOD = gql`
  mutation UpdateEOD($id: ID!, $input: UpdateEODInput!) {
    updateEOD(id: $id, input: $input) {
      _id
      campaign {
        _id
        name
      }
      ticketNo
      description
      status
      recommendation
    }
  }
`;

const FINISH_EODS = gql`
  mutation FinishEODs {
    finishEODs {
      _id
      user
      name
      createdAt
    }
  }
`;

const GET_EOD_FILES = gql`
  query GetEODFiles {
    getEODFiles {
      _id
      user
      name
      createdAt
    }
  }
`;

type EODFile = {
  _id: string;
  user: string;
  name: string;
  createdAt: string;
};

type Campaign = {
  _id: string;
  id: string;
  name: string;
  branch: string;
};

type EODItem = {
  _id: string;
  campaign: {
    _id: string;
    name: string;
  };
  ticketNo: string;
  description: string;
  status: string;
  recommendation: string;
  createdBy: {
    _id: string;
    name: string;
  };
  finishedAt: string;
  createdAt: string;
};

const EOD = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [isNA, setIsNA] = useState(false);
  const [isEODOpen, setIsEODOpen] = useState(false);
  const [selectedEOD, setSelectedEOD] = useState<EODItem | null>(null);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [isUpdateCampaignOpen, setIsUpdateCampaignOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [campaignSearch, setCampaignSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [ticketNo, setTicketNo] = useState("");
  const [description, setDescription] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [isEODUpdateOpen, setIsEODUpdateOpen] = useState(false);
  const [selectedEODFile, setSelectedEODFile] = useState<EODFile | null>(null);

  // Update form states
  const [updateTicketNo, setUpdateTicketNo] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateRecommendation, setUpdateRecommendation] = useState("");
  const [updateCampaign, setUpdateCampaign] = useState<Campaign | null>(null);
  const [updateCampaignSearch, setUpdateCampaignSearch] = useState("");

  const {
    data: campaignData,
    loading,
    error,
  } = useQuery<{ getDepts: Campaign[] }>(GET_CAMPAIGNS);

  console.log(campaignData);

  const { data: eodData, refetch: refetchEODs } = useQuery<{
    getEODs: EODItem[];
  }>(GET_EODS);
  console.log(eodData);

  const { data: eodFilesData, refetch: refetchEODFiles } = useQuery<{
    getEODFiles: EODFile[];
  }>(GET_EOD_FILES);

  const [createEOD, { loading: creating }] = useMutation(CREATE_EOD, {
    onCompleted: () => {
      refetchEODs();
      resetForm();
    },
  });

  const [deleteEOD] = useMutation(DELETE_EOD, {
    onCompleted: () => {
      refetchEODs();
    },
  });

  const [updateEOD, { loading: updating }] = useMutation(UPDATE_EOD, {
    onCompleted: () => {
      refetchEODs();
      resetUpdateForm();
      setIsEODUpdateOpen(false);
    },
  });

  const [finishEODs, { loading: finishing }] = useMutation(FINISH_EODS, {
    onCompleted: () => {
      refetchEODs();
      refetchEODFiles();
    },
  });

  const handleFinish = async () => {
    if (todayEODs.length === 0) {
      alert("No EOD entries to finish");
      return;
    }

    if (window.confirm("Are you sure you want to finish today's EOD? This will mark all entries as completed.")) {
      try {
        await finishEODs();
      } catch (err) {
        console.error("Error finishing EODs:", err);
      }
    }
  };

  const openEODFileModal = (eodFile: EODFile) => {
    setSelectedEODFile(eodFile);
    setIsEODOpen(true);
  };

  // Get EODs that match the selected EOD file's createdAt
  const selectedFileEODs = selectedEODFile
    ? eodData?.getEODs?.filter((eod) => {
        const eodFinishedAt = eod.finishedAt;
        const fileCreatedAt = selectedEODFile.createdAt;
        return eodFinishedAt === fileCreatedAt;
      }) ?? []
    : [];

  // Filter EOD files to show only the current user's files
  const userEODFiles =
    eodFilesData?.getEODFiles?.filter(
      (file) => file.user === userLogged?._id
    ) ?? [];

  const resetUpdateForm = () => {
    setSelectedEOD(null);
    setUpdateCampaign(null);
    setUpdateCampaignSearch("");
    setUpdateTicketNo("");
    setUpdateDescription("");
    setUpdateStatus("");
    setUpdateRecommendation("");
  };

  const openUpdateModal = (eod: EODItem) => {
    setSelectedEOD(eod);
    setUpdateTicketNo(eod.ticketNo || "");
    setUpdateDescription(eod.description || "");
    setUpdateStatus(eod.status || "");
    setUpdateRecommendation(eod.recommendation || "");
    // Find matching campaign from campaignData
    const matchingCampaign = campaignData?.getDepts.find(
      (c) => c.id === eod.campaign?._id || c.name === eod.campaign?.name
    );
    setUpdateCampaign(matchingCampaign || null);
    setIsEODUpdateOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedEOD || !updateStatus) {
      alert("Please select a status");
      return;
    }

    try {
      await updateEOD({
        variables: {
          id: selectedEOD._id,
          input: {
            campaign: updateCampaign?.id || selectedEOD.campaign?._id,
            ticketNo: updateTicketNo,
            description: updateDescription,
            status: updateStatus,
            recommendation: updateRecommendation,
          },
        },
      });
    } catch (err) {
      console.error("Error updating EOD:", err);
    }
  };

  const resetForm = () => {
    setSelectedCampaign(null);
    setCampaignSearch("");
    setTicketNo("");
    setDescription("");
    setSelectedStatus("");
    setRecommendation("");
    setIsNA(false);
  };

  const handleAdd = async () => {
    if (!selectedCampaign || !selectedStatus) {
      alert("Please select a campaign and status");
      return;
    }

    try {
      await createEOD({
        variables: {
          input: {
            campaign: selectedCampaign.id,
            ticketNo: isNA ? "N/A" : ticketNo,
            description,
            status: selectedStatus,
            recommendation,
          },
        },
      });
    } catch (err) {
      console.error("Error creating EOD:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this EOD?")) {
      try {
        await deleteEOD({ variables: { id } });
      } catch (err) {
        console.error("Error deleting EOD:", err);
      }
    }
  };

  const todayEODs =
    eodData?.getEODs?.filter((eod) => {
      const today = new Date();
      const eodDate = new Date(parseInt(eod.createdAt));
      const isToday =
        eodDate.getDate() === today.getDate() &&
        eodDate.getMonth() === today.getMonth() &&
        eodDate.getFullYear() === today.getFullYear();
      const isOwnEOD = eod.createdBy?._id === userLogged?._id;
      const isNotFinished = !eod.finishedAt;
      return isToday && isOwnEOD && isNotFinished;
    }) ?? [];

  const filteredCampaigns =
    campaignData?.getDepts.filter((campaign) =>
      campaign.name.toLowerCase().includes(campaignSearch.toLowerCase()),
    ) ?? [];

  const filteredUpdateCampaigns =
    campaignData?.getDepts.filter((campaign) =>
      campaign.name.toLowerCase().includes(updateCampaignSearch.toLowerCase()),
    ) ?? [];

  return (
    <div className="p-4 max-h-[90dvh] h-full relative">
      <div className="grid h-full grid-cols-3 gap-2 grid-rows-2">
        <div className="border-2 border-blue-800 flex flex-col overflow-hidden rounded-md">
          <div className="text-2xl font-black uppercase bg-blue-500 text-white py-2  border-b-2 border-blue-800 text-center">
            Create eod
          </div>
          <div className="bg-blue-200 p-4 flex flex-col justify-between h-full font-semibold">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative flex flex-col ">
                <div>Campaign:</div>
                <div className="flex h-full gap-2">
                  <input
                    className="w-full outline-none px-3 border bg-blue-100 rounded-sm shadow-md"
                    placeholder={
                      selectedCampaign
                        ? "Selected: " + selectedCampaign.name
                        : "Select Campaign"
                    }
                    value={campaignSearch}
                    onChange={(e) => {
                      setCampaignSearch(e.target.value);
                      if (!isCampaignOpen) setIsCampaignOpen(true);
                    }}
                    onFocus={() => setIsCampaignOpen(true)}
                  />
                  <div
                    onClick={() => setIsCampaignOpen(!isCampaignOpen)}
                    className="flex cursor-pointer hover:bg-blue-150 items-center shadow-md rounded-sm justify-between bg-blue-100 border h-full px-2"
                  >
                    <div
                      className={` ${isCampaignOpen ? "rotate-90" : ""} transition-all `}
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
                          d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {isCampaignOpen && (
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -5, opacity: 0 }}
                      className="absolute z-10 top-16 w-full bg-blue-100 max-h-52 shadow-md overflow-auto left-0 border rounded-sm"
                    >
                      <div className="h-full">
                        {filteredCampaigns.length === 0 ? (
                          <div className="px-3 py-2 text-gray-500 text-center italic">
                            No campaigns found
                          </div>
                        ) : (
                          filteredCampaigns.map((campaign) => (
                            <div
                              key={campaign._id}
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setCampaignSearch("");
                                setIsCampaignOpen(false);
                              }}
                              className="odd:bg-blue-100 cursor-pointer hover:bg-blue-200 transition-all even:bg-blue-50 px-3 py-1 border-b border-blue-200"
                            >
                              <div>{campaign.name}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <div>Ticket No.:</div>
                <div className="flex gap-2 items-center">
                  <input
                    disabled={isNA}
                    value={ticketNo}
                    onChange={(e) => setTicketNo(e.target.value)}
                    className={` ${isNA ? "border-gray-400 bg-gray-100" : " bg-blue-100 shadow-md"} border w-full outline-none py-1 px-3 rounded-sm  `}
                  />
                  <div
                    onClick={() => setIsNA(!isNA)}
                    className={`bg-blue-100 px-3 py-1 border shadow-md rounded-sm cursor-pointer hover:bg-blue-150 flex `}
                  >
                    N/A
                  </div>
                </div>
              </div>

              <div>
                <div>Description:</div>
                <div className="flex gap-2 items-center">
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`  bg-blue-100 shadow-md border w-full outline-none py-1 px-3 rounded-sm  `}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <div>Status:</div>
                <div className="grid grid-cols-3 font-black uppercase text-center justify-center text-xs gap-2 w-full h-full items-center">
                  <div
                    onClick={() => setSelectedStatus("on going")}
                    className={` ${selectedStatus === "on going" ? "border-gray-400 text-gray-400 bg-gray-300" : "border-yellow-600 hover:bg-yellow-400 text-yellow-800 bg-yellow-300 shadow-md cursor-pointer"} transition-all h-full border-2 px-1 rounded-sm truncate  w-full items-center flex justify-center `}
                  >
                    <div className="truncate">on going</div>
                  </div>
                  <div
                    onClick={() => setSelectedStatus("solved")}
                    className={` ${selectedStatus === "solved" ? "border-gray-400 text-gray-400 bg-gray-300" : "border-green-600 hover:bg-green-400 text-green-800 bg-green-300 shadow-md cursor-pointer "} transition-all h-full border-2 px-1 justify-center  rounded-sm truncate w-full items-center flex justify-center"`}
                  >
                    <div className="truncate">Solved</div>
                  </div>
                  <div
                    onClick={() => setSelectedStatus("pending")}
                    className={`  ${selectedStatus === "pending" ? "border-gray-400 text-gray-400 bg-gray-300" : "border-red-600 hover:bg-red-400 text-red-800 bg-red-300 shadow-md cursor-pointer"} h-full border-2 px-1 rounded-sm  w-full items-center flex justify-center`}
                  >
                    <div className="truncate">pending</div>
                  </div>
                </div>
              </div>

              <div className="flex col-span-2 flex-col">
                <div>Recommendation/Remarks:</div>
                <input
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full shadow-md bg-blue-100 px-3 py-1 border rounded-sm outline-none"
                />
              </div>
            </div>

            <div className="flex w-full justify-end">
              <div
                onClick={handleAdd}
                className={` ${creating ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-green-700"} bg-green-600 border-2 border-green-800 rounded-sm shadow-md px-3 py-1 text-white font-black uppercase`}
              >
                {creating ? "Adding..." : "Add"}
              </div>
            </div>
          </div>
        </div>
        <div className="border-2 border-blue-800 flex flex-col overflow-hidden rounded-md">
          <div className="text-2xl font-black uppercase bg-blue-500 text-white py-2  border-b-2 border-blue-800 text-center">
            EOD HISTORY
          </div>
          <div className="p-4 bg-blue-200 flex flex-col gap-2 w-full h-full overflow-auto">
            {userEODFiles.length === 0 ? (
              <div className="text-center py-4 text-gray-500 italic items-center h-full flex justify-center">
                No EOD history
              </div>
            ) : (
              userEODFiles.map((eodFile) => (
                <div key={eodFile._id} className="flex w-full gap-2">
                  <div
                    onClick={() => openEODFileModal(eodFile)}
                    className="bg-blue-500 cursor-pointer shadow-md w-full py-2 px-4 border-2 rounded-md border-blue-800 hover:bg-blue-600 transition-all"
                  >
                    <div className="text-base truncate font-semibold text-white text-shadow-2xs">
                      {eodFile.name} -{" "}
                      {new Date(parseInt(eodFile.createdAt)).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </div>
                    <div className="text-sm text-white truncate text-shadow-2xs">
                      Finished at:{" "}
                      {new Date(parseInt(eodFile.createdAt)).toLocaleString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col h-full gap-1">
                    <div
                      className="bg-green-600 shadow-md text-white h-full border-2 border-green-800 hover:bg-green-700 transition-all cursor-pointer rounded-md flex py-2 justify-center items-center px-3"
                      title="Export"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.125 3C3.089 3 2.25 3.84 2.25 4.875V18a3 3 0 0 0 3 3h15a3 3 0 0 1-3-3V4.875C17.25 3.839 16.41 3 15.375 3H4.125ZM12 9.75a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5H12Zm-.75-2.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75ZM6 12.75a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5H6Zm-.75 3.75a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5H6a.75.75 0 0 1-.75-.75ZM6 6.75a.75.75 0 0 0-.75.75v3c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75v-3A.75.75 0 0 0 9 6.75H6Z"
                          clipRule="evenodd"
                        />
                        <path d="M18.75 6.75h1.875c.621 0 1.125.504 1.125 1.125V18a1.5 1.5 0 0 1-3 0V6.75Z" />
                      </svg>
                    </div>
                    <div
                      className="bg-red-600 shadow-md text-white h-full border-2 border-red-800 hover:bg-red-700 transition-all cursor-pointer rounded-md flex justify-center py-2 items-center px-3"
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="border-2 col-start-2 row-start-1 row-span-2 flex flex-col h-full col-span-2 rounded-sm border-blue-800">
          <div className="py-2 text-2xl border-b-2 border-blue-800 bg-blue-500 text-white text-center w-full font-black uppercase">
            EOD
          </div>
          <div className="h-full flex flex-col p-4 bg-blue-200">
            <div className="flex justify-between">
              <div className="px-3 bg-blue-600 hover:bg-blue-700 border-2 border-blue-800 font-black uppercase text-white rounded-sm py-1 cursor-pointer">
                View Charts
              </div>

              <div className="px-3 font-black uppercase text-blue-900 rounded-sm py-1 cursor-default">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div
                onClick={handleFinish}
                className={`${finishing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-green-700"} px-3 bg-green-600 border-2 border-green-800 font-black uppercase text-white rounded-sm py-1`}
              >
                {finishing ? "Finishing..." : "FINISH"}
              </div>
            </div>
            <div className="font-black mt-2 grid grid-cols-12 gap-2 uppercase text-white bg-blue-500 px-3 py-2 border-2 border-blue-800 rounded-t-sm">
              <div>no</div>
              <div className="col-span-2">Campaign</div>
              <div className="col-span-2">Ticket No.</div>
              <div className="col-span-2">Description</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">remarks</div>
              <div></div>
            </div>
            <div className="bg-blue-100 h-full border-x-2 border-b-2 rounded-b-md border-blue-800 shadow-md overflow-auto">
              {todayEODs.length === 0 ? (
                <div className="text-center py-4 text-gray-500 italic items-center h-full flex justify-center">
                  No EOD entries for today
                </div>
              ) : (
                todayEODs.map((eod, index) => (
                  <div
                    key={eod._id}
                    className="grid grid-cols-12 odd:bg-blue-100 even:bg-blue-50 items-center py-1 gap-2 px-3 border-b border-blue-200"
                  >
                    <div>{index + 1}</div>
                    <div className="col-span-2 truncate">
                      {eod.campaign?.name || "N/A"}
                    </div>
                    <div className="col-span-2 truncate">
                      {eod.ticketNo || "N/A"}
                    </div>
                    <div className="col-span-2 truncate">
                      {eod.description || "N/A"}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`px-2 py-1 border-2 font-black text-white max-w-24 text-center justify-center flex rounded-sm text-xs uppercase ${
                          eod.status === "solved"
                            ? "bg-green-600 border-green-800"
                            : eod.status === "pending"
                              ? "bg-red-600 border-red-800"
                              : "bg-yellow-600 border-yellow-800"
                        }`}
                      >
                        {eod.status}
                      </span>
                    </div>
                    <div className="col-span-2 truncate">
                      {eod.recommendation || "N/A"}
                    </div>
                    <div className="flex justify-end gap-1">
                      <div
                        className="bg-blue-600 border-2 border-blue-800 cursor-pointer hover:bg-blue-700 transition-all text-white rounded-sm p-1"
                        onClick={() => openUpdateModal(eod)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-6"
                        >
                          <path
                            fillRule="evenodd"
                            d="M11.828 2.25c-.916 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 0 1-.517.608 7.45 7.45 0 0 0-.478.198.798.798 0 0 1-.796-.064l-.453-.324a1.875 1.875 0 0 0-2.416.2l-.243.243a1.875 1.875 0 0 0-.2 2.416l.324.453a.798.798 0 0 1 .064.796 7.448 7.448 0 0 0-.198.478.798.798 0 0 1-.608.517l-.55.092a1.875 1.875 0 0 0-1.566 1.849v.344c0 .916.663 1.699 1.567 1.85l.549.091c.281.047.508.25.608.517.06.162.127.321.198.478a.798.798 0 0 1-.064.796l-.324.453a1.875 1.875 0 0 0 .2 2.416l.243.243c.648.648 1.67.733 2.416.2l.453-.324a.798.798 0 0 1 .796-.064c.157.071.316.137.478.198.267.1.47.327.517.608l.092.55c.15.903.932 1.566 1.849 1.566h.344c.916 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 0 1 .517-.608 7.52 7.52 0 0 0 .478-.198.798.798 0 0 1 .796.064l.453.324a1.875 1.875 0 0 0 2.416-.2l.243-.243c.648-.648.733-1.67.2-2.416l-.324-.453a.798.798 0 0 1-.064-.796c.071-.157.137-.316.198-.478.1-.267.327-.47.608-.517l.55-.091a1.875 1.875 0 0 0 1.566-1.85v-.344c0-.916-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 0 1-.608-.517 7.507 7.507 0 0 0-.198-.478.798.798 0 0 1 .064-.796l.324-.453a1.875 1.875 0 0 0-.2-2.416l-.243-.243a1.875 1.875 0 0 0-2.416-.2l-.453.324a.798.798 0 0 1-.796.064 7.462 7.462 0 0 0-.478-.198.798.798 0 0 1-.517-.608l-.091-.55a1.875 1.875 0 0 0-1.85-1.566h-.344ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isEODOpen && selectedEODFile && (
          <div className="absolute justify-center flex items-center top-0 left-0 z-20 w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEODOpen(false);
                setSelectedEODFile(null);
              }}
              className="bg-black/40 cursor-pointer z-10 absolute top-0 left-0 w-full h-full backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-md border-2 border-blue-800 overflow-auto z-20 max-w-4xl w-full max-h-[80vh]"
            >
              <div className="bg-blue-500 text-2xl text-center font-black uppercase text-white px-3 py-2 border-b-2 border-blue-800">
                {selectedEODFile.name} -{" "}
                {new Date(parseInt(selectedEODFile.createdAt)).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </div>
              <div>
                <div className="grid bg-blue-400 border-blue-800 border-b-2 font-semibold grid-cols-6 px-3 py-2 gap-2">
                  <div>No.</div>
                  <div>Campaign</div>
                  <div>Ticket No.</div>
                  <div>Description</div>
                  <div>Status</div>
                  <div>Remarks</div>
                </div>
                <div className="bg-blue-100 max-h-96 overflow-auto">
                  {selectedFileEODs.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 italic">
                      No EOD entries found
                    </div>
                  ) : (
                    selectedFileEODs.map((eod, index) => (
                      <div
                        key={eod._id}
                        className="grid grid-cols-6 odd:bg-blue-100 even:bg-blue-50 py-2 gap-2 px-3 border-b border-blue-200"
                      >
                        <div>{index + 1}</div>
                        <div className="truncate">
                          {eod.campaign?.name || "N/A"}
                        </div>
                        <div className="truncate">
                          {eod.ticketNo || "N/A"}
                        </div>
                        <div className="truncate">
                          {eod.description || "N/A"}
                        </div>
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              eod.status === "solved"
                                ? "bg-green-300 text-green-800"
                                : eod.status === "pending"
                                  ? "bg-red-300 text-red-800"
                                  : "bg-yellow-300 text-yellow-800"
                            }`}
                          >
                            {eod.status}
                          </span>
                        </div>
                        <div className="truncate">
                          {eod.recommendation || "N/A"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEODUpdateOpen && (
          <div className="absolute justify-center flex items-center top-0 left-0 z-20 w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEODUpdateOpen(false)}
              className="bg-black/40 cursor-pointer z-10 absolute top-0 left-0 w-full h-full backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white flex flex-col rounded-md max-h-96 h-full border-2 border-blue-800 overflow-auto z-20"
            >
              <div className="bg-blue-500 text-2xl text-center font-black uppercase text-white px-3 py-2 border-b-2 border-blue-800">
                Update the information
              </div>
              <div className="bg-blue-200 h-full flex flex-col">
                <div className="grid font-semibold grid-cols-2 p-3 gap-2">
                  <div className="relative flex flex-col ">
                    <div>Campaign:</div>
                    <div className="flex h-full gap-2">
                      <input
                        className="w-full outline-none px-3 border bg-blue-100 rounded-sm shadow-md"
                        placeholder={
                          updateCampaign
                            ? "Selected: " + updateCampaign.name
                            : selectedEOD?.campaign?.name || "Select Campaign"
                        }
                        value={updateCampaignSearch}
                        onChange={(e) => {
                          setUpdateCampaignSearch(e.target.value);
                          if (!isUpdateCampaignOpen) setIsUpdateCampaignOpen(true);
                        }}
                        onFocus={() => setIsUpdateCampaignOpen(true)}
                      />
                      <div
                        onClick={() =>
                          setIsUpdateCampaignOpen(!isUpdateCampaignOpen)
                        }
                        className="flex cursor-pointer hover:bg-blue-150 items-center shadow-md rounded-sm justify-between bg-blue-100 border h-full px-2"
                      >
                        <div
                          className={` ${isUpdateCampaignOpen ? "rotate-90" : ""} transition-all `}
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
                              d="m8.25 4.5 7.5 7.5-7.5 7.5"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isUpdateCampaignOpen && (
                        <motion.div
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -5, opacity: 0 }}
                          className="absolute z-10 top-16 w-full bg-blue-100 max-h-52 shadow-md overflow-auto left-0 border rounded-sm"
                        >
                          <div className="h-full">
                            {filteredUpdateCampaigns.length === 0 ? (
                              <div className="px-3 py-2 text-gray-500 text-center italic">
                                No campaigns found
                              </div>
                            ) : (
                              filteredUpdateCampaigns.map((campaign) => (
                                <div
                                  key={campaign._id}
                                  onClick={() => {
                                    setUpdateCampaign(campaign);
                                    setUpdateCampaignSearch("");
                                    setIsUpdateCampaignOpen(false);
                                  }}
                                  className="odd:bg-blue-100 cursor-pointer hover:bg-blue-200 transition-all even:bg-blue-50 px-3 py-1 border-b border-blue-200"
                                >
                                  <div>{campaign.name}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col">
                    <div>Ticket No.:</div>
                    <input
                      value={updateTicketNo}
                      onChange={(e) => setUpdateTicketNo(e.target.value)}
                      className="bg-blue-100 outline-none px-3 py-1 border rounded-sm shadow-md"
                    />
                  </div>

                  <div className="flex flex-col">
                    <div>Description:</div>
                    <input
                      value={updateDescription}
                      onChange={(e) => setUpdateDescription(e.target.value)}
                      className="bg-blue-100 outline-none px-3 py-1 border rounded-sm shadow-md"
                    />
                  </div>

                  <div className="flex flex-col">
                    <div>Status:</div>
                    <div className="grid grid-cols-3 font-black uppercase text-center justify-center text-xs gap-2 w-full h-full items-center">
                      <div
                        onClick={() => setUpdateStatus("on going")}
                        className={` ${updateStatus === "on going" ? "border-gray-400 text-gray-400 bg-gray-300" : "border-yellow-600 hover:bg-yellow-400 text-yellow-800 bg-yellow-300 shadow-md cursor-pointer"} transition-all h-full border-2 px-1 rounded-sm truncate  w-full items-center flex justify-center `}
                      >
                        <div className="truncate">on going</div>
                      </div>
                      <div
                        onClick={() => setUpdateStatus("solved")}
                        className={` ${updateStatus === "solved" ? "border-gray-400 text-gray-400 bg-gray-300" : "border-green-600 hover:bg-green-400 text-green-800 bg-green-300 shadow-md cursor-pointer "} transition-all h-full border-2 px-1 justify-center  rounded-sm truncate w-full items-center flex justify-center"`}
                      >
                        <div className="truncate">Solved</div>
                      </div>
                      <div
                        onClick={() => setUpdateStatus("pending")}
                        className={`  ${updateStatus === "pending" ? "border-gray-400 text-gray-400 bg-gray-300" : "border-red-600 hover:bg-red-400 text-red-800 bg-red-300 shadow-md cursor-pointer"} h-full border-2 px-1 rounded-sm  w-full items-center flex justify-center`}
                      >
                        <div className="truncate">pending</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col col-span-2">
                    <div>Remarks:</div>
                    <input
                      value={updateRecommendation}
                      onChange={(e) => setUpdateRecommendation(e.target.value)}
                      className="bg-blue-100 outline-none px-3 py-1 border rounded-sm shadow-md"
                    />
                  </div>
                </div>
                <div className=" flex px-4 pb-4 justify-end items-end h-full">
                  <div
                    onClick={handleUpdate}
                    className={`${updating ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-green-600"} px-3 py-1 border-2 border-green-800 bg-green-500 font-black uppercase text-white rounded-md shadow-md transition-all`}
                  >
                    {updating ? "Updating..." : "Update"}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EOD;
