import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiArrowDropDownFill } from "react-icons/ri";
import Confirmation from "../../components/Confirmation";
import { useAppDispatch } from "../../redux/store";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { FaEdit } from "react-icons/fa";
import ActivationButton from "./ActivationButton";
import { motion, AnimatePresence } from "framer-motion";

type Bucket = {
  _id: string;
  name: string;
  dept: string;
};

const GET_ALL_BUCKET = gql`
  query GetBuckets {
    getAllBucket {
      _id
      name
      dept
    }
  }
`;

const CREATE_DISPO_TYPE = gql`
  mutation createDispositionType($input: CreatingDispo) {
    createDispositionType(input: $input) {
      success
      message
    }
  }
`;

enum Method {
  skipper = "skipper",
  caller = "caller",
  field = "field",
}

type inpuValueState = {
  name: string;
  code: string;
  status: number;
  rank: number;
};

const GET_ALL_DISPO_TYPE = gql`
  query getDispositionTypes {
    getDispositionTypes {
      contact_methods {
        skipper
        caller
        field
      }
      rank
      status
      id
      name
      buckets
      code
      active
    }
  }
`;
type CA = {
  skipper: boolean;
  caller: boolean;
  field: boolean;
};

type Dispotype = {
  id: string;
  name: string;
  code: string;
  buckets: string[];
  active: boolean;
  status: number;
  rank: number;
  contact_methods: CA;
};

const UPDATE_DISPO = gql`
  mutation updateDispositionType($id: ID!, $input: CreatingDispo) {
    updateDispositionType(id: $id, input: $input) {
      success
      message
    }
  }
`;

const DispositionConfigurationView = () => {
  const dispatch = useAppDispatch();
  const [openDisposition, setOpenDisposition] = useState(false);
  const { data: bucketsData } = useQuery<{ getAllBucket: Bucket[] }>(
    GET_ALL_BUCKET
  );
  const bucketObject: { [key: string]: string } = useMemo(() => {
    const buckets = bucketsData?.getAllBucket || [];
    return Object.fromEntries(buckets.map((b) => [b._id, b.name]));
  }, [bucketsData]);

  const { data: dispotypeData, refetch } = useQuery<{
    getDispositionTypes: Dispotype[];
  }>(GET_ALL_DISPO_TYPE);
  const [selectingBuckets, setSelectingBuckets] = useState<boolean>(false);
  const [selectedBuckets, setSelectedBuckets] = useState<string[]>([]);
  const [selectingContactMethod, setSelectingContactMethod] =
    useState<boolean>(false);
  const [selectedContactMethod, setSelectedContactMethod] = useState<Method[]>(
    []
  );
  const [confirm, setConfirm] = useState<boolean>(false);
  const [toUpdateDispo, setToUpdateDispo] = useState<Dispotype | null>(null);
  const [dispoData, setDispoData] = useState<Dispotype[]>([]);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (dispotypeData) {
      if (search) {
        const filterDispotype = dispotypeData?.getDispositionTypes.filter(
          (e) =>
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.code.toLowerCase().includes(search.toLowerCase())
        );
        setDispoData(filterDispotype);
      } else {
        setDispoData(dispotypeData.getDispositionTypes);
      }
    }
  }, [dispotypeData, search]);

  const [required, setRequired] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<inpuValueState>({
    name: "",
    code: "",
    status: 1,
    rank: 0,
  });

  const [isUpdate, setIsUpdate] = useState<boolean>(false);
  const form = useRef<HTMLFormElement | null>(null);

  // mutations =====================================
  const [createDispositionType] = useMutation<{
    createDispositionType: { success: boolean; message: string };
  }>(CREATE_DISPO_TYPE, {
    onCompleted: (res) => {
      refetch();
      dispatch(
        setSuccess({
          success: res.createDispositionType.success,
          message: res.createDispositionType.message,
          isMessage: false,
        })
      );
      setInputValue({
        name: "",
        code: "",
        status: 1,
        rank: 0,
      });
      setConfirm(false);
      setSelectedBuckets([]);
      setSelectedContactMethod([]);
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [updateDispositionType] = useMutation<{
    updateDispositionType: { success: boolean; message: string };
  }>(UPDATE_DISPO, {
    onCompleted: (res) => {
      refetch();
      dispatch(
        setSuccess({
          success: res.updateDispositionType.success,
          message: res.updateDispositionType.message,
          isMessage: false,
        })
      ),
        setInputValue({
          name: "",
          code: "",
          status: 1,
          rank: 0,
        });
      setIsUpdate(false);
      setConfirm(false);
      setSelectedBuckets([]);
      setSelectedContactMethod([]);
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  // =======================

  const contact_methods: Method[] = [
    Method.caller,
    Method.field,
    Method.skipper,
  ] as const;

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "ACTIVATE" | "DEACTIVATE",
    yes: () => {},
    no: () => {},
  });

  const creatingDispoType = useCallback(async () => {
    await createDispositionType({
      variables: {
        input: {
          ...inputValue,
          buckets: selectedBuckets,
          contact_method: selectedContactMethod,
        },
      },
    });
  }, [
    inputValue,
    selectedBuckets,
    selectedContactMethod,
    createDispositionType,
  ]);

  const updatingDispoType = useCallback(async () => {
    await updateDispositionType({
      variables: {
        id: toUpdateDispo?.id,
        input: {
          ...inputValue,
          buckets: selectedBuckets,
          contact_method: selectedContactMethod,
        },
      },
    });
  }, [
    selectedBuckets,
    selectedContactMethod,
    updateDispositionType,
    inputValue,
    toUpdateDispo,
  ]);

  const submitActions: Record<string, { message: string; yes: () => void }> = {
    CREATE: {
      message: "Do you want to add new disposition type?",
      yes: creatingDispoType,
    },
    UPDATE: {
      message: "Do you want to update this disposition type?",
      yes: updatingDispoType,
    },
    ACTIVATE: {
      message: "Do you want to activate this disposition type?",
      yes: () => {},
    },
    DEACTIVATE: {
      message: "Do you want to deactivate this disposition type?",
      yes: () => {},
    },
  };

  const onSubmit = useCallback(
    (e: React.FormEvent, submitToggle: keyof typeof submitActions) => {
      e.preventDefault();
      if (
        !form.current?.checkValidity() ||
        selectedBuckets.length < 1 ||
        selectedContactMethod.length < 1
      ) {
        setRequired(true);
      } else {
        setConfirm(true);
        setModalProps({
          message: submitActions[submitToggle].message,
          toggle: submitToggle as
            | "CREATE"
            | "UPDATE"
            | "ACTIVATE"
            | "DEACTIVATE",
          yes: submitActions[submitToggle].yes,
          no: () => {
            setConfirm(false);
          },
        });
      }
    },
    [
      form,
      selectedBuckets,
      selectedContactMethod,
      setRequired,
      setConfirm,
      setModalProps,
      submitActions,
    ]
  );

  const bucketRef = useRef<HTMLDivElement | null>(null);
  const contachMethodRef = useRef<HTMLDivElement | null>(null);

  const handleOnUpdate = useCallback(
    (dispo: Dispotype) => {
      setToUpdateDispo(dispo);
      setIsUpdate(true);
    },
    [setToUpdateDispo, setIsUpdate]
  );

  useEffect(() => {
    if (toUpdateDispo) {
      const selectedCA = [];
      setInputValue({
        code: toUpdateDispo.code,
        name: toUpdateDispo.name,
        status: toUpdateDispo.status,
        rank: toUpdateDispo.rank ?? 0,
      });
      setSelectedBuckets(toUpdateDispo.buckets);
      if (toUpdateDispo.contact_methods?.caller) {
        selectedCA.push(Method.caller);
      }
      if (toUpdateDispo.contact_methods?.field) {
        selectedCA.push(Method.field);
      }
      if (toUpdateDispo.contact_methods?.skipper) {
        selectedCA.push(Method.skipper);
      }
      setSelectedContactMethod(selectedCA);
    } else {
      setInputValue({ name: "", code: "", status: 1, rank: 0 });
      setSelectedBuckets([]);
      setSelectedContactMethod([]);
    }
  }, [toUpdateDispo]);

  const handleCheckAll = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        const bucketsIds: string[] =
          bucketsData?.getAllBucket.map((e) => e._id) || [];
        setSelectedBuckets(bucketsIds);
      } else {
        setSelectedBuckets([]);
      }
    },
    [setSelectedBuckets, bucketsData]
  );

  return (
    <>
      <div
        className="h-full relative w-full flex flex-col overflow-hidden p-2"
        onMouseDown={(e) => {
          if (!bucketRef.current?.contains(e.target as Node)) {
            setSelectingBuckets(false);
          }
          if (!contachMethodRef.current?.contains(e.target as Node)) {
            setSelectingContactMethod(false);
          }
        }}
      >
        <div className="w-full h-full flex overflow-hidden">
          <AnimatePresence>
            {openDisposition && (
              <div className="absolute top-0 left-0 w-full h-full flex-col gap-10 flex items-center justify-center">
                <motion.div
                  onClick={() => {
                    setOpenDisposition(false);
                    setIsUpdate(false);
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full cursor-pointer absolute top-0 left-0 z-30 h-full bg-black/40 backdrop-blur-sm"
                ></motion.div>
                <motion.div
                  className="z-40 bg-gray-100 border-2 border-green-900 rounded-md shadow-md overflow-hidden"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <div className="bg-green-600 px-10 text-2xl font-black  uppercase text-center py-2 text-white">
                    {isUpdate ? (
                      <h1 className="">Update Disposition</h1>
                    ) : (
                      <h1 className="">Create Disposition</h1>
                    )}
                  </div>
                  <form
                    className="flex flex-col p-5 gap-1 2xl:w-96 lg:w-80"
                    ref={form}
                    noValidate
                    onSubmit={(e) =>
                      onSubmit(e, isUpdate ? "UPDATE" : "CREATE")
                    }
                  >
                    <label className="flex flex-col ">
                      <span className="font-black uppercase text-gray-800">
                        Name:{" "}
                      </span>
                      <input
                        type="text"
                        name="name"
                        autoComplete="off"
                        required
                        id="name"
                        value={inputValue.name}
                        onChange={(e) =>
                          setInputValue((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className={`${
                          required && !inputValue.name
                            ? "border-red-500 bg-red-50"
                            : "border-slate-500"
                        } border px-2 py-2 rounded-md text-sm outline-none`}
                      />
                    </label>

                    <label className="flex flex-col">
                      <span className="font-black text-gray-900 uppercase ">
                        Code:
                      </span>
                      <input
                        type="text"
                        name="code"
                        autoComplete="off"
                        id="code"
                        required
                        value={inputValue.code}
                        onChange={(e) =>
                          setInputValue((prev) => ({
                            ...prev,
                            code: e.target.value,
                          }))
                        }
                        className={`${
                          required && !inputValue.code
                            ? "border-red-500 bg-red-50"
                            : "border-slate-500"
                        } border px-2 py-2 rounded-md text-sm outline-none`}
                      />
                    </label>

                    <div className="flex gap-5">
                      <fieldset className="border border-slate-500 text-gray-500 rounded-md py-2 px-4 flex gap-2 w-full">
                        <legend className="px-1 uppercase font-black text-slate-800">
                          Status:
                        </legend>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="status"
                            checked={inputValue.status === 1}
                            value={1}
                            onChange={(e) =>
                              setInputValue((prev) => ({
                                ...prev,
                                status: Number(e.target.value),
                              }))
                            }
                          />
                          <p className="font-normal">Positive</p>
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="status"
                            checked={inputValue.status === 0}
                            value={0}
                            id="status"
                            onChange={(e) =>
                              setInputValue((prev) => ({
                                ...prev,
                                status: Number(e.target.value),
                              }))
                            }
                          />
                          <p>Negative</p>
                        </label>
                      </fieldset>

                      <label className="w-full">
                        <p className="uppercase font-black">Rank:</p>
                        <select
                          name="rank"
                          id="rank"
                          className="border w-full p-2 rounded-md border-slate-500  text-gray-500"
                          value={inputValue.rank ?? ""}
                          onChange={(e) =>
                            setInputValue((prev) => ({
                              ...prev,
                              rank: Number(e.target.value),
                            }))
                          }
                        >
                          <option value="">0</option>
                          {Array.from({ length: 20 }).map((_, index) => {
                            return (
                              <option
                                className=""
                                value={index + 1}
                                key={index}
                              >
                                {index + 1}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    </div>

                    <div
                      className="flex flex-col relative cursor-default"
                      ref={bucketRef}
                    >
                      <span className="text-gray-800 font-black uppercase">
                        Buckets:{" "}
                      </span>
                      <div
                        className={`${
                          required && selectedBuckets.length < 1
                            ? "bg-red-50 border-red-500"
                            : "border-slate-500"
                        } border py-0.5  rounded-md items-center pl-2.5 flex justify-between`}
                        onClick={() => setSelectingBuckets(!selectingBuckets)}
                      >
                        {selectedBuckets.length < 1 ? (
                          <p className="text-sm select-none cursor-default">
                            Select Buckets
                          </p>
                        ) : (
                          <p className="truncate capitalize">
                            {selectedBuckets
                              .map((e) => bucketObject[e])
                              .join(", ")}
                          </p>
                        )}
                        <RiArrowDropDownFill className="text-3xl" />
                      </div>
                      {selectingBuckets && (
                        <div className="absolute max-h-32 mt-1 rounded-md overflow-y-auto bg-white border w-full top-15 border-slate-500 shadow-md shadow-black/50 flex z-50 flex-col px-2 py-1">
                          <label className="flex items-center gap-2 select-none">
                            <input
                              type="checkbox"
                              name="all"
                              id="all"
                              onChange={handleCheckAll}
                            />
                            <span className="text-sm text-gray-600">
                              Select All
                            </span>
                          </label>
                          {bucketsData?.getAllBucket.map((ab) => {
                            const onClick = (
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              if (e.target.checked) {
                                setSelectedBuckets((prev) => [...prev, ab._id]);
                              } else {
                                setSelectedBuckets((prev) =>
                                  prev.includes(ab._id)
                                    ? prev.filter((id) => id !== ab._id)
                                    : [...prev, ab._id]
                                );
                              }
                            };

                            return (
                              <label
                                key={ab._id}
                                className="flex items-center gap-2 select-none"
                              >
                                <input
                                  type="checkbox"
                                  name={ab.name}
                                  id={ab.name}
                                  onChange={onClick}
                                  checked={selectedBuckets.includes(ab._id)}
                                />
                                <span className="text-sm text-gray-600">
                                  {ab.name} - {ab.dept}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div
                      className="flex flex-col pt-2 pb-5 relative cursor-default"
                      ref={contachMethodRef}
                    >
                      <span className="font-black uppercase  text-gray-800">
                        Contact Method:
                      </span>
                      <div
                        className={`${
                          required && selectedContactMethod.length < 1
                            ? "bg-red-50 border-red-500"
                            : "border-slate-500"
                        } border py-0.5  rounded-md items-center pl-2.5 flex justify-between`}
                        onClick={() =>
                          setSelectingContactMethod(!selectingContactMethod)
                        }
                      >
                        {selectedContactMethod.length < 1 ? (
                          <p className="text-sm select-none cursor-default">
                            Select Contact Method
                          </p>
                        ) : (
                          <p className="truncate capitalize">
                            {selectedContactMethod.join(", ")}
                          </p>
                        )}
                        <RiArrowDropDownFill className="text-3xl" />
                      </div>
                      {selectingContactMethod && (
                        <div className="absolute max-h-50 mt-3 rounded-md overflow-y-auto bg-white border w-full top-15 border-slate-500 shadow-md shadow-black/50 flex flex-col px-2 py-1">
                          {contact_methods.map((cm: Method, index) => {
                            const onClick = (
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              if (e.target.checked) {
                                setSelectedContactMethod((prev) => [
                                  ...prev,
                                  cm,
                                ]);
                              } else {
                                setSelectedContactMethod((prev: Method[]) =>
                                  prev.includes(cm)
                                    ? prev.filter((method) => method !== cm)
                                    : [...prev, cm]
                                );
                              }
                            };
                            return (
                              <label
                                key={index}
                                className="flex items-center gap-2 h-3 my-1 z-50 select-none"
                              >
                                <input
                                  type="checkbox"
                                  name={cm}
                                  id={cm}
                                  onChange={onClick}
                                  checked={selectedContactMethod.includes(cm)}
                                />
                                <span className="capitalize text-gray-600">
                                  {cm}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-5">
                      <button
                        type="submit"
                        className={`${
                          isUpdate
                            ? "border-orange-500 bg-orange-500 hover:bg-orange-700"
                            : "hover:bg-blue-700 bg-blue-500 border-blue-500"
                        } border   rounded-lg px-5 py-1.5 text-white  font-bold`}
                      >
                        {isUpdate ? "Update" : "Submit"}
                      </button>
                      {isUpdate && (
                        <button
                          type="submit"
                          className={` border border-slate-500 bg-slate-500 hover:bg-slate-700   rounded-lg px-5 py-1.5 text-white  font-bold`}
                          onClick={() => {
                            setToUpdateDispo(null);
                            setIsUpdate(false);
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <motion.div className="w-6/4 overflow-hidden flex items-end justify-end px-5 flex-col">
            <div className="flex justify-between w-full gap-2 pt-5 pb-1">
              <h1 className="text-2xl font-black uppercase px-3 ">
                Disposition Configuration
              </h1>
              <div className="flex gap-3">
                <motion.div
                  onClick={() => {
                    setOpenDisposition(true);
                  }}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <div className="bg-green-500 h-full px-3 items-center flex cursor-pointer hover:bg-green-600 transition-all uppercase font-black rounded-md shadow-md text-white   border-2 border-green-800">
                    create disposition
                  </div>
                </motion.div>
                <motion.div
                  className="border flex shadow-md items-center px-3 rounded-md"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    className="size-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>

                  <input
                    type="search"
                    name="search"
                    id="search"
                    className="focus:outline-none rounded-md rouned text-sm py-2 px-2"
                    placeholder="Search"
                    autoComplete="off"
                    onChange={(e) => setSearch(e.target.value)}
                    value={search}
                  />
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col overflow-auto"
            >
              <div className="grid grid-cols-9 border-b border-gray-400 gap-2 font-black uppercase bg-gray-300 px-2 py-2 text-gray-800 rounded-t-md w-full mt-2">
                <div className="col-span-2">Name</div>
                <div>Code</div>
                <div>Rank</div>
                <div>Status</div>
                <div>Buckets</div>
                <div className="col-span-2">Contact Method</div>
                <div>Action</div>
              </div>
              <div className="w-full h-full rounded-b-md overflow-y-auto cursor-default select-none">
                {dispoData.map((dispo, index) => {
                  const dispoCA = [];
                  if (dispo.contact_methods?.caller) {
                    dispoCA.push(Method.caller);
                  }
                  if (dispo.contact_methods?.field) {
                    dispoCA.push(Method.field);
                  }
                  if (dispo.contact_methods?.skipper) {
                    dispoCA.push(Method.skipper);
                  }

                  return (
                    <motion.div
                      key={dispo.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="grid grid-cols-9 gap-2 text-sm py-2 px-2 hover:bg-gray-300 bg-gray-200 even:bg-gray-100 text-gray-600 items-center"
                    >
                      <div className="nowrap truncate col-span-2">
                        {dispo.name}
                      </div>
                      <div>{dispo.code}</div>
                      <div>{dispo.rank}</div>
                      <div>{dispo.status === 1 ? "Positive" : "Negative"}</div>
                      <div
                        className="truncate"
                        title={dispo.buckets
                          .map((e) => bucketObject[e])
                          .join(", ")}
                      >
                        {dispo.buckets.map((e) => bucketObject[e]).join(", ")}
                      </div>
                      <div
                        className="truncate capitalize col-span-2"
                        title={dispoCA?.join(", ")}
                      >
                        {dispoCA?.join(", ")}
                      </div>

                      <div className="flex gap-5 items-center">
                        <div
                          onClick={() => {
                            handleOnUpdate(dispo);
                            setOpenDisposition(true);
                          }}
                          title="UPDATE"
                          className="bg-blue-600 shadow-md cursor-pointer hover:bg-blue-700 transition-all p-1 text-white rounded-sm border border-blue-800 "
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
                              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                          </svg>
                        </div>
                        {/* <FaEdit
                        onClick={() => handleOnUpdate(dispo)}
                        className="text-xl text-orange-500 cursor-pointer"
                      /> */}
                        <ActivationButton
                          id={dispo.id}
                          active={dispo.active}
                          refetch={() => refetch()}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      {confirm && <Confirmation {...modalProps} />}
    </>
  );
};

export default DispositionConfigurationView;
