import React, { useMemo, useState, useEffect } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import Confirmation from "../../components/Confirmation";
import { useAppDispatch } from "../../redux/store";
import { setSuccess } from "../../redux/slices/authSlice";

const SOF = [
  "Manila City",
  "North Luzon",
  "Quezon City",
  "Makati",
  "Taguig",
  "Pasay City",
  "Mandaluyong",
  "Pasig",
  "San Juan",
  "Marikina",
  "Tondo",
  "Others",
] as const;

const ALL_BUCKETS = gql`
  query getAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`;

const GET_BRANCHES = gql`
  query getBranches {
    getBranches {
      id
      name
    }
  }
`;

const CREATE_USER_FIELD = gql`
  mutation CreateUserField($input: CreateFieldUserInput!) {
    createUserField(input: $input) {
      success
      message
      user {
        _id
      }
    }
  }
`;

const UPDATE_USER_FIELD = gql`
  mutation UpdateUserField($input: UpdateFieldUserInput!) {
    updateUserField(input: $input) {
      success
      message
      user {
        _id
        name
        username
        contactNumber
        plateNumber
        area
        branch
        buckets
      }
    }
  }
`;

const GET_FIELD_USERS = gql`
  query getFieldUsers {
    getFieldUsers {
      _id
      name
      username
      contactNumber
      plateNumber
      area
      branch
      bucketDetails {
        _id
        name
      }
    }
  }
`;

const TLFieldEnrollment = () => {
  const dispatch = useAppDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE",
    yes: () => {},
    no: () => {},
  });
  const [isAssign, setIsAssign] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [otherArea, setOtherArea] = useState("");
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [selectedBucketIds, setSelectedBucketIds] = useState<string[]>([]);
  const [frontIdImage, setFrontIdImage] = useState<string | null>(null);
  const [backIdImage, setBackIdImage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    _id: string;
    name: string;
    username: string;
    contactNumber: string;
    plateNumber: string;
    area: string;
    branch: string;
    bucketDetails: { _id: string; name: string }[];
  } | null>(null);

  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editContactNumber, setEditContactNumber] = useState("");
  const [editPlateNumber, setEditPlateNumber] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editBranchId, setEditBranchId] = useState<string | null>(null);
  const [editBucketIds, setEditBucketIds] = useState<string[]>([]);
  const [editFrontIdImage, setEditFrontIdImage] = useState<string | null>(null);
  const [editBackIdImage, setEditBackIdImage] = useState<string | null>(null);
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
  const [isEditBucketOpen, setIsEditBucketOpen] = useState(false);
  const [imageReloadKey, setImageReloadKey] = useState(0);
  const [resolvedFrontUrl, setResolvedFrontUrl] = useState<string | null>(null);
  const [resolvedBackUrl, setResolvedBackUrl] = useState<string | null>(null);
  const { data: bucketData } = useQuery<{
    getAllBucket: { _id: string; name: string }[];
  }>(ALL_BUCKETS);
  const { data: branchData } = useQuery<{
    getBranches: { id: string; name: string }[];
  }>(GET_BRANCHES);
  const { data: fieldUsersData, refetch: refetchFieldUsers } = useQuery<{
    getFieldUsers: {
      _id: string;
      name: string;
      username: string;
      contactNumber: string;
      plateNumber: string;
      area: string;
      branch: string;
      bucketDetails: { _id: string; name: string }[];
    }[];
  }>(GET_FIELD_USERS);
  const [createUserField, { loading: isSubmitting }] =
    useMutation(CREATE_USER_FIELD);
  const [updateUserField, { loading: isUpdating }] =
    useMutation(UPDATE_USER_FIELD);
  // Handler for updating field user
  const handleUpdateFieldUser = async () => {
    if (!selectedUser?._id) return;
    try {
      const result = await updateUserField({
        variables: {
          input: {
            id: selectedUser._id,
            name: editName,
            username: editUsername,
            branch: editBranchId,
            buckets: editBucketIds,
            area: editArea,
            contactNumber: editContactNumber,
            plateNumber: editPlateNumber,
            frontIdImage: editFrontIdImage,
            backIdImage: editBackIdImage,
          },
        },
      });
      if (result.data?.updateUserField?.success) {
        dispatch(
          setSuccess({
            success: true,
            message:
              result.data.updateUserField.message || "Field user updated!",
            isMessage: false,
          }),
        );
        setIsSettingsOpen(false);
        setEditFrontIdImage(null);
        setEditBackIdImage(null);
        setImageReloadKey(Date.now());
        refetchFieldUsers();
      }
    } catch (error) {
      dispatch(
        setSuccess({
          success: false,
          message: (error as Error).message,
          isMessage: false,
        }),
      );
    }
  };
  const bucketOptions = bucketData?.getAllBucket || [];
  const branchOptions = branchData?.getBranches || [];
  const fieldUsers = fieldUsersData?.getFieldUsers || [];
  const selectedBucketNames = useMemo(
    () =>
      bucketOptions
        .filter((bucket) => selectedBucketIds.includes(bucket._id))
        .map((bucket) => bucket.name),
    [bucketOptions, selectedBucketIds],
  );

  const handleFileToBase64 = (file: File, setter: (value: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let cancelled = false;
    const tryLoad = (url: string) =>
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = url;
      });

    const resolveUrls = async () => {
      if (!selectedUser?._id) {
        setResolvedFrontUrl(null);
        setResolvedBackUrl(null);
        return;
      }
      const exts = ["png", "jpg", "jpeg", "webp"];
      for (const ext of exts) {
        const frontUrl = `/fieldimages/${selectedUser._id}_front.${ext}?t=${imageReloadKey}`;
        try {
          // eslint-disable-next-line no-await-in-loop
          await tryLoad(frontUrl);
          if (!cancelled) setResolvedFrontUrl(frontUrl);
          break;
        } catch {
          if (!cancelled) setResolvedFrontUrl(null);
        }
      }
      for (const ext of exts) {
        const backUrl = `/fieldimages/${selectedUser._id}_back.${ext}?t=${imageReloadKey}`;
        try {
          // eslint-disable-next-line no-await-in-loop
          await tryLoad(backUrl);
          if (!cancelled) setResolvedBackUrl(backUrl);
          break;
        } catch {
          if (!cancelled) setResolvedBackUrl(null);
        }
      }
    };

    resolveUrls();
    return () => {
      cancelled = true;
    };
  }, [selectedUser?._id, imageReloadKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameInput = fullName.trim();
    const usernameInput = username.trim();

    if (backIdImage === null || frontIdImage === null) {
      dispatch(
        setSuccess({
          success: false,
          message: "Picture of Back or front of the id is required",
          isMessage: false,
        }),
      );
      return;
    }

    if (!nameInput) {
      dispatch(
        setSuccess({
          success: false,
          message: "Full name is required",
          isMessage: false,
        }),
      );
      return;
    }
    if (!usernameInput) {
      dispatch(
        setSuccess({
          success: false,
          message: "Username is required",
          isMessage: false,
        }),
      );
      return;
    }

    // Show confirmation dialog
    setConfirm(true);
    setModalProps({
      message: `Are you sure you want to create field user "${nameInput}" (${usernameInput})?`,
      toggle: "CREATE",
      yes: handleConfirmCreate,
      no: () => setConfirm(false),
    });
  };

  const handleConfirmCreate = async () => {
    setConfirm(false);
    try {
      const areaValue =
        selectedArea === "Others" ? otherArea.trim() : selectedArea;
      const result = await createUserField({
        variables: {
          input: {
            name: fullName.trim(),
            username: username.trim(),
            branch: selectedBranchId,
            buckets: selectedBucketIds,
            frontIdImage,
            backIdImage,
            area: areaValue,
            contactNumber: contactNumber.trim(),
            plateNumber: plateNumber.trim(),
          },
        },
      });
      if (result.data?.createUserField?.success) {
        dispatch(
          setSuccess({
            success: true,
            message:
              result.data.createUserField.message ||
              "Field user created successfully!",
            isMessage: false,
          }),
        );
        setFullName("");
        setUsername("");
        setContactNumber("");
        setPlateNumber("");
        setSelectedBranchId(null);
        setSelectedBucketIds([]);
        setFrontIdImage(null);
        setBackIdImage(null);
        setSelectedArea(null);
        setOtherArea("");
        refetchFieldUsers();
      }
    } catch (error) {
      dispatch(
        setSuccess({
          success: false,
          message: (error as Error).message,
          isMessage: false,
        }),
      );
    }
  };

  return (
    <div className="bg-blue-100 gap-2 flex flex-col md:grid grid-cols-3 w-full h-full max-h-[90dvh] p-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-2 border-blue-800 h-[50%] md:h-full flex flex-col rounded-md overflow-hidden bg-blue-200"
      >
        <div className="bg-blue-500 py-2 flex justify-center font-black border-b-2 border-blue-800 uppercase text-white">
          Enrollment Form
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-blue-200 overflow-auto flex flex-col h-full justify-between p-4"
        >
          <div className="grid grid-cols-2  gap-2">
            <div className="flex font-black uppercase flex-col">
              <div className="flex gap-1">
                <div className=" truncate ">Full name:</div>
                <div className="text-red-700">*</div>
              </div>
              <div>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="bg-blue-100 font-normal outline-none w-full border-2 border-blue-800 rounded-sm shadow-md px-3 py-1"
                  required
                />
              </div>
            </div>

            <div className="flex font-black uppercase flex-col">
              <div className="flex gap-1">
                <div className=" truncate ">Username:</div>
                <div className="text-red-700">*</div>
              </div>
              <div>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., JDoe"
                  className="bg-blue-100 font-normal outline-none w-full border-2 border-blue-800 rounded-sm shadow-md px-3 py-1"
                  required
                />
              </div>
            </div>
            <div className="flex font-black uppercase flex-col">
              <div className="flex gap-1">
                <div className=" truncate ">Contact Number:</div>
                <div className="text-red-700">*</div>
              </div>
              <div>
                <input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  minLength={10}
                  maxLength={11}
                  placeholder="e.g., 09123456789"
                  className="bg-blue-100 font-normal outline-none w-full border-2 border-blue-800 rounded-sm shadow-md px-3 py-1"
                  required
                />
              </div>
            </div>
            <div className="flex font-black uppercase flex-col">
              <div className=" truncate">PLATE Number:</div>
              <div>
                <input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  className="bg-blue-100 font-normal outline-none w-full border-2 border-blue-800 rounded-sm shadow-md px-3 py-1"
                />
              </div>
            </div>

            <div className="flex font-black z-20 relative uppercase flex-col">
              <div className="flex gap-1">
                <div className=" truncate ">Area to be assigned:</div>
                <div className="text-red-700">*</div>
              </div>
              <div className="flex gap-2">
                <div
                  onClick={() => setIsAssign(!isAssign)}
                  className="px-3 py-1 flex w-full cursor-pointer items-center justify-between font-semibold bg-blue-100 border-2 border-blue-800 rounded-sm shadow-md"
                >
                  <div className="truncate">
                    {selectedArea ? selectedArea : "Select Area"}
                  </div>
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
                {selectedArea === "Others" && (
                  <div className="w-full h-full flex">
                    <input
                      value={otherArea}
                      onChange={(e) => setOtherArea(e.target.value)}
                      placeholder="Specify area"
                      className="bg-blue-100 font-normal outline-none w-full border-2 border-blue-800 rounded-sm shadow-md px-3 py-1"
                      required
                    />
                  </div>
                )}
              </div>
              <AnimatePresence>
                {isAssign && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="absolute w-full h-52 overflow-auto border-2 font-semibold border-blue-800  rounded-sm top-16 bg-blue-100"
                  >
                    {SOF.map((sof) => (
                      <div
                        key={sof}
                        onClick={() => {
                          setSelectedArea(sof);
                          setIsAssign(false);
                        }}
                        className="cursor-pointer hover:bg-blue-300 even:bg-blue-100 odd:bg-blue-200 transition-all px-4 py-2 border-b border-blue-300 last:border-b-0"
                      >
                        {sof}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex font-black uppercase flex-col relative">
              <div className="flex  gap-1">Branch:</div>
              <div
                onClick={() => setIsBranchOpen(!isBranchOpen)}
                className="px-3 py-1 flex cursor-pointer items-center justify-between font-semibold bg-blue-100 border-2 border-blue-800 rounded-sm shadow-md"
              >
                <div className="truncate">
                  {selectedBranchId
                    ? branchOptions.find((b) => b.id === selectedBranchId)?.name
                    : "Select Branch"}
                </div>
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
              <AnimatePresence>
                {isBranchOpen && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="absolute w-full h-52 overflow-auto border-2 font-semibold border-blue-800 rounded-sm top-16 bg-blue-100"
                  >
                    {branchOptions.map((branch) => (
                      <div
                        key={branch.id}
                        onClick={() => {
                          setSelectedBranchId(branch.id);
                          setIsBranchOpen(false);
                        }}
                        className="cursor-pointer hover:bg-blue-300 even:bg-blue-100 odd:bg-blue-200 transition-all px-4 py-2 border-b border-blue-300 last:border-b-0"
                      >
                        {branch.name}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex font-black uppercase flex-col relative">
              <div className="flex  gap-1">Campaign:</div>
              <div
                onClick={() => setIsCampaignOpen(!isCampaignOpen)}
                className="px-3 py-1 flex cursor-pointer items-center justify-between font-semibold bg-blue-100 border-2 border-blue-800 rounded-sm shadow-md"
              >
                <div className="truncate">
                  {selectedBucketNames.length > 0
                    ? selectedBucketNames.join(", ")
                    : "Select buckets"}
                </div>
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
              <AnimatePresence>
                {isCampaignOpen && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="absolute w-full h-52 overflow-auto border-2 font-semibold border-blue-800 rounded-sm top-16 bg-blue-100"
                  >
                    {bucketOptions.map((bucket) => (
                      <div
                        key={bucket._id}
                        onClick={() => {
                          setSelectedBucketIds((prev) =>
                            prev.includes(bucket._id)
                              ? prev.filter((id) => id !== bucket._id)
                              : [...prev, bucket._id],
                          );
                        }}
                        className={`cursor-pointer hover:bg-blue-300 transition-all px-4 py-2 border-b border-blue-300 last:border-b-0 ${
                          selectedBucketIds.includes(bucket._id)
                            ? "bg-blue-300"
                            : "even:bg-blue-100 odd:bg-blue-200"
                        }`}
                      >
                        {bucket.name}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="row-start-5 col-span-2 flex font-black flex-col ">
              <div className="flex gap-1 uppercase">
                Upload the front of the valid id:
                <div className="text-red-700">*</div>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileToBase64(file, (value) =>
                        setFrontIdImage(value),
                      );
                    }
                  }}
                  required
                  className="bg-blue-100 cursor-pointer font-semibold outline-none w-full border-2 border-blue-800 rounded-sm shadow-md px-3 py-1"
                />
                <div
                  className="h-full px-3 shadow-md border-blue-800 text-white border-2 bg-blue-600 rounded-sm flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all"
                  title="Take a photo"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                    <path
                      fillRule="evenodd"
                      d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="row-start-6 col-span-2 flex font-black flex-col ">
              <div className="flex gap-1 uppercase">
                Upload the back of the valid id:
                <div className="text-red-700">*</div>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileToBase64(file, (value) =>
                        setBackIdImage(value),
                      );
                    }
                  }}
                  required
                  className="bg-blue-100 cursor-pointer font-semibold outline-none w-full border-2 border-blue-800 rounded-sm shadow-md px-3 py-1"
                />
                <div
                  className="h-full px-3 shadow-md border-blue-800 text-white border-2 bg-blue-600 rounded-sm flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all"
                  title="Take a photo"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                    <path
                      fillRule="evenodd"
                      d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="font-normal text-xs my-1 text-blue-800">
                Ensure that the valid ID provided is a driver’s license.
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1 border-2 border-green-800 bg-green-600 font-black uppercase text-white rounded-sm shadow-md cursor-pointer hover:bg-green-700 transition-all disabled:opacity-60"
            >
              Submit
            </button>
          </div>
        </form>
      </motion.div>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="border-2 col-span-2 h-[50%] md:h-full border-blue-800 flex flex-col rounded-md overflow-hidden bg-blue-200"
      >
        <div className="bg-blue-500 py-2 flex flex-col border-b-2 border-blue-800 justify-between ">
          <div className="grid grid-cols-5 font-black uppercase text-white px-3 gap-2">
            <div>Name</div>
            <div className="truncate">Contact Number</div>
            <div>AREA</div>
            <div>Buckets</div>
          </div>
        </div>
        <div className="overflow-auto flex-1">
          {fieldUsers.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500 font-semibold">
              No field users found
            </div>
          ) : (
            fieldUsers.map((fieldUser, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={fieldUser._id}
                className="px-3 py-2 border-b border-blue-400 last:border-b-0 grid grid-cols-5 font-semibold uppercase items-center text-black gap-2 even:bg-blue-100 odd:bg-blue-200"
              >
                <div className="truncate">{fieldUser.name}</div>
                <div className="truncate">
                  {fieldUser.contactNumber || (
                    <div className="text-xs italic truncate text-gray-500/40 lowercase first-letter:uppercase">
                      No contact number
                    </div>
                  )}
                </div>
                <div className="truncate">
                  {fieldUser.area || (
                    <div className="text-xs italic text-gray-500/40 lowercase first-letter:uppercase">
                      No area assigned
                    </div>
                  )}
                </div>
                <div className="truncate">
                  {fieldUser.bucketDetails?.map((b) => b.name).join(", ") ||
                    "-"}
                </div>
                <div
                  onClick={() => {
                    setSelectedUser(fieldUser);
                    setEditName(fieldUser.name);
                    setEditUsername(fieldUser.username || "");
                    setEditContactNumber(fieldUser.contactNumber || "");
                    setEditPlateNumber(fieldUser.plateNumber || "");
                    setEditArea(fieldUser.area || "");
                    setEditBranchId(fieldUser.branch || null);
                    setEditBucketIds(
                      fieldUser.bucketDetails?.map((b) => b._id) || [],
                    );
                    setEditFrontIdImage(null);
                    setEditBackIdImage(null);
                    setImageReloadKey(Date.now());
                    setIsSettingsOpen(true);
                  }}
                  className="flex gap-2 justify-end"
                >
                  <div
                    className="p-1 hover:bg-blue-700 transition-all cursor-pointer rounded-sm text-white shadow-md bg-blue-600 border-2 border-blue-800"
                    title="Settings"
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
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="absolute z-30 top-0 left-0 p-5 md:p-0 items-center flex justify-center w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="bg-black/20 cursor-pointer w-full h-full absolute backdrop-blur-sm top-0 left-0"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-blue-100 z-20 border-2 border-blue-800 shadow-md rounded-md overflow-auto"
            >
              <div className="py-2 md:py-4 border-b-2 text-shadow-2xs border-blue-800 px-6 bg-blue-500 font-black uppercase text-white text-sm text-center  md:text-2xl">
                UPDATE FIELD MEMBER INFORMATION
              </div>
              <div className="p-4">
                <div className="grid gap-2 font-black uppercase grid-cols-2">
                  <div>
                    <div>FullName:</div>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white outline-none px-3 py-1 rounded-sm shadow-md border-2 border-blue-800"
                    />
                  </div>
                  <div>
                    <div>Username:</div>
                    <input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full bg-white outline-none px-3 py-1 rounded-sm shadow-md border-2 border-blue-800"
                    />
                  </div>

                  <div>
                    <div className="truncate">Contact Number:</div>
                    <input
                      value={editContactNumber}
                      onChange={(e) => setEditContactNumber(e.target.value)}
                      className="w-full bg-white outline-none px-3 py-1 rounded-sm shadow-md border-2 border-blue-800"
                    />
                  </div>

                  <div>
                    <div>Plate Number:</div>
                    <input
                      value={editPlateNumber}
                      onChange={(e) => setEditPlateNumber(e.target.value)}
                      className="w-full bg-white outline-none px-3 py-1 rounded-sm shadow-md border-2 border-blue-800"
                    />
                  </div>
                  <div>
                    <div>Area:</div>
                    <input
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      className="w-full bg-white outline-none px-3 py-1 rounded-sm shadow-md border-2 border-blue-800"
                    />
                  </div>

                  <div className="relative">
                    <div>Branch:</div>
                    <div
                      onClick={() => setIsEditBranchOpen(!isEditBranchOpen)}
                      className="px-3 py-1 flex cursor-pointer items-center justify-between font-semibold bg-white border-2 border-blue-800 rounded-sm shadow-md"
                    >
                      <div className="truncate">
                        {editBranchId
                          ? branchOptions.find((b) => b.id === editBranchId)
                              ?.name
                          : "Select Branch"}
                      </div>
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
                    <AnimatePresence>
                      {isEditBranchOpen && (
                        <motion.div
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -10, opacity: 0 }}
                          className="absolute w-full max-h-40 overflow-auto border-2 font-semibold border-blue-800 rounded-sm top-16 bg-white z-10"
                        >
                          {branchOptions.map((branch) => (
                            <div
                              key={branch.id}
                              onClick={() => {
                                setEditBranchId(branch.id);
                                setIsEditBranchOpen(false);
                              }}
                              className={`cursor-pointer hover:bg-blue-300 transition-all px-4 py-2 border-b border-blue-300 last:border-b-0 ${
                                editBranchId === branch.id
                                  ? "bg-blue-300"
                                  : "even:bg-blue-50 odd:bg-white"
                              }`}
                            >
                              {branch.name}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative col-span-2">
                    <div>Buckets:</div>
                    <div
                      onClick={() => setIsEditBucketOpen(!isEditBucketOpen)}
                      className="px-3 py-1 flex cursor-pointer items-center justify-between font-semibold bg-white border-2 border-blue-800 rounded-sm shadow-md"
                    >
                      <div className="truncate">
                        {editBucketIds.length > 0
                          ? bucketOptions
                              .filter((b) => editBucketIds.includes(b._id))
                              .map((b) => b.name)
                              .join(", ")
                          : "Select Buckets"}
                      </div>
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
                    <AnimatePresence>
                      {isEditBucketOpen && (
                        <motion.div
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -10, opacity: 0 }}
                          className="absolute w-full max-h-40 overflow-auto border-2 font-semibold border-blue-800 rounded-sm top-16 bg-white z-10"
                        >
                          {bucketOptions.map((bucket) => (
                            <div
                              key={bucket._id}
                              onClick={() => {
                                setEditBucketIds((prev) =>
                                  prev.includes(bucket._id)
                                    ? prev.filter((id) => id !== bucket._id)
                                    : [...prev, bucket._id],
                                );
                              }}
                              className={`cursor-pointer hover:bg-blue-300 transition-all px-4 py-2 border-b border-blue-300 last:border-b-0 ${
                                editBucketIds.includes(bucket._id)
                                  ? "bg-blue-300"
                                  : "even:bg-blue-50 odd:bg-white"
                              }`}
                            >
                              {bucket.name}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <div>Front ID:</div>
                    <label className="bg-gray-400 border-2 border-blue-800 w-full items-center justify-center flex shadow-md h-32 md:h-40 rounded-md relative cursor-pointer overflow-hidden">
                      {editFrontIdImage ? (
                        <>
                          <img
                            src={editFrontIdImage}
                            alt="Front ID"
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded shadow">
                            New
                          </div>
                        </>
                      ) : resolvedFrontUrl ? (
                        <img
                          src={`${resolvedFrontUrl}?t=${Date.now()}`}
                          className="w-full h-full object-cover"
                          alt="Front ID"
                        />
                      ) : null}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileToBase64(file, setEditFrontIdImage);
                          }
                        }}
                      />
                      <div className="font-semibold h-full w-full flex justify-center items-center text-xs md:text-base hover:bg-gray-400/20 text-gray-500 text-shadow-2xs transition-all absolute  px-3 py-1 ">
                        Click to change
                      </div>
                    </label>
                  </div>

                  <div>
                    <div>Back ID:</div>
                    <label className="bg-gray-400 border-2 border-blue-800 w-full items-center justify-center flex shadow-md h-32 md:h-40 rounded-md relative cursor-pointer overflow-hidden">
                      {editBackIdImage ? (
                        <>
                          <img
                            src={editBackIdImage}
                            alt="Back ID"
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded shadow">
                            New
                          </div>
                        </>
                      ) : resolvedBackUrl ? (
                        <img
                          src={`${resolvedBackUrl}?t=${Date.now()}`}
                          className="w-full h-full object-cover"
                          alt="Back ID"
                        />
                      ) : null}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileToBase64(file, setEditBackIdImage);
                          }
                        }}
                      />
                      <div className="font-semibold h-full w-full flex justify-center text-xs md:text-base items-center hover:bg-gray-400/20 text-gray-500 text-shadow-2xs transition-all absolute  px-3 py-1 ">
                        Click to change
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end col-span-2 my-2">
                    <button
                      type="button"
                      className="bg-green-500 hover:bg-green-600 px-3 text-white border-2 border-green-800 rounded-sm shadow-md cursor-pointer py-1 transition-all disabled:opacity-60"
                      onClick={handleUpdateFieldUser}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Updating..." : "Submit"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {confirm && <Confirmation {...modalProps} />}
    </div>
  );
};

export default TLFieldEnrollment;
