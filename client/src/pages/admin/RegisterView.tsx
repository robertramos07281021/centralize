import { gql, useMutation, useQuery } from "@apollo/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Confirmation from "../../components/Confirmation";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useAppDispatch } from "../../redux/store";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";

type Dept = {
  id: string;
  name: string;
  branch: string;
};

type Branch = {
  id: string;
  name: string;
};

type Bucket = {
  _id: string;
  name: string;
};

type DeptBucket = {
  dept: string;
  buckets: Bucket[];
};

enum Type {
  AGENT = "AGENT",
  TL = "TL",
  AOM = "AOM",
  MIS = "MIS",
  CEO = "CEO",
  ADMIN = "ADMIN",
  OPERATION = "OPERATION",
  QA = "QA",
  QASUPERVISOR = "QA SUPERVISOR",
}

enum AccountType {
  CALLER = "caller",
  SKIPER = "skiper",
  FIELD = "field",
}

type Data = {
  type: Type | null;
  name: string;
  username: string;
  branch: string;
  departments: string[];
  user_id: string;
  buckets: string[];
  account_type: AccountType | null;
  callfile_id: string;
  vici_id: string;
};

const CREATE_ACCOUNT = gql`
  mutation createUser($createInput: CreatingAccount) {
    createUser(createInput: $createInput) {
      success
      message
    }
  }
`;

const BRANCH_QUERY = gql`
  query branchQuery {
    getBranches {
      id
      name
    }
  }
`;

const BRANCH_DEPARTMENT_QUERY = gql`
  query getBranchDept($branch: String) {
    getBranchDept(branch: $branch) {
      id
      name
      branch
    }
  }
`;

const GET_DEPT_BUCKET = gql`
  query getBuckets($dept: [ID]) {
    getBuckets(dept: $dept) {
      dept
      buckets {
        _id
        name
      }
    }
  }
`;

const validForCampaignAndBucket = ["TL", "AGENT", "MIS", "QA"];

type RegisterProps = {
  cancel?: boolean;
  setCancel: () => void;
};

const RegisterView: React.FC<RegisterProps> = ({ cancel, setCancel }) => {
  const [selectDept, setSelectDept] = useState<boolean>(false);
  const [selectBucket, setSelectBucket] = useState<boolean>(false);
  const [data, setData] = useState<Data>({
    type: null,
    name: "",
    username: "",
    branch: "",
    departments: [],
    user_id: "",
    buckets: [],
    callfile_id: "",
    account_type: null,
    vici_id: "",
  });
  const dispatch = useAppDispatch();

  const { data: branchQuery } = useQuery<{ getBranches: Branch[] }>(
    BRANCH_QUERY
  );
  const { data: getDeptBucketData } = useQuery<{ getBuckets: DeptBucket[] }>(
    GET_DEPT_BUCKET,
    { variables: { dept: data.departments } }
  );

  const branchObject: { [key: string]: string } = useMemo(() => {
    const bqd = branchQuery?.getBranches || [];
    return Object.fromEntries(bqd.map((e) => [e.name, e.id]));
  }, [branchQuery]);

  const { data: branchDeptData } = useQuery<{ getBranchDept: Dept[] }>(
    BRANCH_DEPARTMENT_QUERY,
    {
      variables: {
        branch: Object.keys(branchObject).find(
          (key) => branchObject[key] === data.branch
        ),
      },
    }
  );

  const deptObject: { [key: string]: string } = useMemo(() => {
    const bdd = branchDeptData?.getBranchDept || [];
    return Object.fromEntries(bdd.map((e) => [e.name, e.id]));
  }, [branchDeptData]);

  const bucketObject: { [key: string]: string } = useMemo(() => {
    const dbd = getDeptBucketData?.getBuckets || [];
    return Object.fromEntries(
      dbd.flatMap((e) => e.buckets.map((y) => [y.name, y._id]))
    );
  }, [getDeptBucketData]);

  const reset = useCallback(() => {
    setData({
      type: null,
      name: "",
      username: "",
      branch: "",
      departments: [],
      user_id: "",
      buckets: [],
      callfile_id: "",
      account_type: null,
      vici_id: "",
    });
  }, [setData]);

  const [createUser] = useMutation(CREATE_ACCOUNT, {
    onCompleted: (res) => {
      if (res?.createUser?.success) {
        reset();
        dispatch(
          setSuccess({
            success: true,
            message: res.createUser.message || "Account created",
            isMessage: false,
          })
        );
        setConfirm(false);
      } else {
        dispatch(
          setSuccess({
            success: false,
            message: res?.createUser?.message || "Failed to create user",
            isMessage: false,
          })
        );
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      const errorMessage = error?.message;
      if (errorMessage?.includes("E11000")) {
        reset();
        dispatch(
          setSuccess({
            success: false,
            message: "Username already exists",
            isMessage: false,
          })
        );
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const [required, setRequired] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE",
    yes: () => {},
    no: () => {},
  });

  const validateAgent = () =>
    data.branch && data.name && data.username && data.departments.length > 0;

  const validateOther = () => data.name && data.username;

  const handleCreateUser = useCallback(async () => {
    try {
      await createUser({ variables: { createInput: data } });
    } catch (err) {
      console.error("createUser mutation failed:", err);
    }
  }, [data, createUser]);

  const submitForm = useCallback(() => {
    const isAgent = data.type === "AGENT";
    const isValid = isAgent ? validateAgent() : validateOther();

    if (!isValid) {
      setRequired(true);
      return;
    }

    setRequired(false);
    setConfirm(true);
    setModalProps({
      no: () => setConfirm(false),
      yes: handleCreateUser,
      message: "Are you sure you want to add this user?",
      toggle: "CREATE",
    });
  }, [data, setRequired, setConfirm, setModalProps, handleCreateUser]);

  const handleCheckedDept = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, value: string) => {
      const check = e.target.checked
        ? [...data.departments, deptObject[value]]
        : data.departments.filter((d) => d !== deptObject[value]);
      setData((prev) => ({ ...prev, departments: check }));
    },
    [data, deptObject]
  );

  const handleCheckedBucket = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, value: string) => {
      const check = e.target.checked
        ? [...data.buckets, bucketObject[value]]
        : data.buckets.filter((d) => d !== bucketObject[value]);
      setData((prev) => ({ ...prev, buckets: check }));
    },
    [data, bucketObject, setData]
  );

  useEffect(() => {
    if (
      data.type === null &&
      (data.name ||
        data.username ||
        data.branch ||
        data.departments.length > 0 ||
        data.user_id ||
        data.vici_id)
    ) {
      setData((prev) => ({
        ...prev,
        name: "",
        username: "",
        branch: "",
        department: [],
        buckets: [],
        user_id: "",
        callfile_id: "",
        account_type: null,
        vici_id: "",
      }));
    }
  }, [data.type, data]);

  useEffect(() => {
    if (!cancel) {
      setSelectDept(false);
      setSelectBucket(false);
    }
  }, [cancel]);

  const bucketDiv = useRef<HTMLDivElement | null>(null);
  const campaignDiv = useRef<HTMLDivElement | null>(null);

  return (
    <div className="w-full">
      <div
        className="w-full flex flex-col"
        onMouseDown={(e) => {
          if (!bucketDiv.current?.contains(e.target as Node)) {
            setSelectBucket(false);
          }
          if (!campaignDiv.current?.contains(e.target as Node)) {
            setSelectDept(false);
          }
        }}
      >
        <div className="p-5 w-full flex text-2xl font-black uppercase text-slate-800 ">
          Create Account
        </div>
        <form className=" px-5 w-full py-2 flex flex-col gap-2 items-center justify-center ">
          {required && (
            <div className="text-center text-xs text-red-500">
              All fields are required.
            </div>
          )}
          <label className="w-full">
            <p className="w-full text-base font-black uppercase text-slate-800">
              Type:
            </p>
            <select
              id="type"
              name="type"
              value={data.type || ""}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? null : (e.target.value as Type);
                setData((prev) => ({ ...prev, type: value }));
              }}
              // onClick={() => {
              //   if (!cancel) {
              //     setCancel?.(true);
              //   }
              // }}
              className={`bg-slate-50  border-slate-300 border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            >
              <option value="">Choose a type</option>
              {Object.entries(Type).map(([key, value]) => (
                <option value={key} key={key}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3 w-full">
            <label className="w-full">
              <p className="w-full text-base font-black uppercase text-slate-800">
                Name:
              </p>
              <input
                type="text"
                id="name"
                name="name"
                autoComplete="off"
                value={data.name}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={!data.type}
                className={`${
                  !data.type ? "bg-gray-200" : "bg-gray-50"
                }  border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full in-disabled:bg-gray-200`}
              />
            </label>

            <label className="w-full">
              <p className="w-full text-base font-black uppercase text-slate-800">
                Username:
              </p>
              <input
                type="text"
                name="username"
                id="username"
                autoComplete="off"
                value={data.username}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, username: e.target.value }))
                }
                disabled={!data.type}
                className={`${
                  !data.type ? "bg-gray-200" : "bg-gray-50"
                } bg-gray-50 w-full border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  p-2.5`}
              />
            </label>
          </div>
          <div className="flex gap-3 w-full">
            <label className="w-full">
              <p className="w-full text-base font-black uppercase text-slate-800">
                SIP Id:
              </p>
              <input
                type="text"
                name="id_number"
                id="id_number"
                autoComplete="off"
                value={data.user_id}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, user_id: e.target.value }))
                }
                disabled={
                  !data.type ||
                  !validForCampaignAndBucket.toString().includes(data.type)
                }
                className={`${
                  !data.type ||
                  !validForCampaignAndBucket.toString().includes(data.type)
                    ? "bg-gray-200"
                    : "bg-gray-50"
                } bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}
              />
            </label>

            <label className="w-full">
              <p className="w-full text-base font-black uppercase text-slate-800">
                Softphone ID:
              </p>
              <input
                type="text"
                name="id_number"
                id="id_number"
                autoComplete="off"
                aria-disabled="true"
                disabled={true}
                placeholder="Under Construction"
                className={`${
                  !data.type ||
                  !validForCampaignAndBucket.toString().includes(data.type)
                    ? "bg-gray-200"
                    : "bg-gray-50"
                } bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}
              />
            </label>

            <label className="w-full">
              <p className="w-full text-base font-black uppercase text-slate-800">
                Callfile ID:
              </p>
              <input
                type="text"
                name="callfile_id"
                id="callfile_id"
                autoComplete="off"
                value={data.callfile_id}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, callfile_id: e.target.value }))
                }
                disabled={
                  !data.type ||
                  !validForCampaignAndBucket.toString().includes(data.type)
                }
                className={`${
                  !data.type ||
                  !validForCampaignAndBucket.toString().includes(data.type)
                    ? "bg-gray-200"
                    : "bg-gray-50"
                } bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}
              />
            </label>
          </div>

          <div className="flex flex-col w-full gap-3">
            <div className="flex gap-2 ">
              <label className="w-full">
                <p className="w-full text-base font-black uppercase text-slate-800">
                  Account Type:
                </p>
                <select
                  id="account_type"
                  name="account"
                  disabled={!data.type}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? null
                        : (e.target.value as AccountType);
                    setData((prev) => ({ ...prev, account_type: value }));
                  }}
                  // onClick={() => setCancel?.(true)}
                  className={`${
                    !data.type ? "bg-gray-200" : "bg-gray-50"
                  } border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                >
                  <option value="">Choose a account type</option>
                  <option value={AccountType.CALLER}>Caller</option>
                  <option value={AccountType.FIELD}>Field</option>
                  <option value={AccountType.SKIPER}>Skipper</option>
                </select>
              </label>
              <div className="flex flex-col">
                <div className="font-black text-slate-800 ">VICI ID:</div>
                <div className="flex border border-slate-300  rounded-md ">
                  <input
                    id="vici_id"
                    disabled={!data.type}
                    className={`" ${
                      !data.type ||
                      !validForCampaignAndBucket.toString().includes(data.type)
                        ? "bg-gray-200"
                        : "bg-gray-50"
                    } w-full bg-gray-100 px-5 py-2 pr-1 rounded-sm focus:outline-none "`}
                    value={data.vici_id}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, vici_id: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <label className="w-full">
              <p className="w-full text-base font-black uppercase text-slate-800">
                Branch:
              </p>
              <select
                id="branch"
                name="branch"
                value={
                  data.branch
                    ? Object.keys(branchObject).find(
                        (key) => branchObject[key] === data.branch
                      )
                    : ""
                }
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    branch: branchObject[e.target.value],
                  }))
                }
                // onClick={() => setCancel?.(true)}
                disabled={
                  !data.type ||
                  !validForCampaignAndBucket.toString().includes(data.type)
                }
                className={`${
                  !data.type ||
                  !validForCampaignAndBucket.toString().includes(data.type)
                    ? "bg-gray-200"
                    : "bg-gray-50"
                } border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
              >
                <option value="">Choose a branch</option>
                {branchQuery?.getBranches.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="w-full relative" ref={campaignDiv}>
            <p className="w-full text-base font-black uppercase text-slate-800">
              Campaign:
            </p>
            <div
              className={`${
                (!data.branch ||
                  !validForCampaignAndBucket
                    .toString()
                    .includes(data.type as Type)) &&
                "bg-gray-200"
              } max-w-full text-sm border  rounded-lg flex justify-between ${
                selectDept && data.branch
                  ? "border-blue-500"
                  : "border-slate-300"
              }`}
            >
              <div
                className="w-full p-2.5 max-w-[350px] text-nowrap truncate cursor-default capitalize"
                title={data.departments
                  .map(
                    (deptId) =>
                      Object.entries(deptObject).find(
                        ([, val]) => val.toString() === deptId
                      )?.[0]
                  )
                  .join(", ")
                  .replace(/_/g, " ")}
                onClick={() => {
                  if (
                    validForCampaignAndBucket
                      .toString()
                      .includes(data.type as Type)
                  ) {
                    setSelectDept(!selectDept);
                    // setCancel?.(true);
                  }
                }}
              >
                {(() => {
                  const haveCampaign =
                    branchDeptData && branchDeptData?.getBranchDept?.length > 0;
                  const findDept = branchQuery?.getBranches.find(
                    (e) => e.id === data.branch
                  );
                  const campaignSelection = haveCampaign
                    ? data.departments.length < 1
                      ? "Select Campaign"
                      : data.departments
                          .map(
                            (deptId) =>
                              Object.entries(deptObject).find(
                                ([, val]) => val.toString() === deptId
                              )?.[0]
                          )
                          .join(", ")
                          .replace(/_/g, " ")
                    : data.branch
                    ? `No Campaign on ${findDept?.name}`
                    : "Select Campaign";
                  return campaignSelection;
                })()}
              </div>
              <MdKeyboardArrowDown
                className="text-lg absolute right-0 top-9"
                onClick={() => {
                  if (
                    validForCampaignAndBucket
                      .toString()
                      .includes(data.type as Type)
                  ) {
                    setSelectDept(!selectDept);

                    setSelectBucket(false);
                  }
                }}
              />
            </div>
            {selectDept &&
              data.branch &&
              branchDeptData &&
              branchDeptData?.getBranchDept?.length > 0 && (
                <div className="w-full absolute  left-0 h-36 top-16.5 bg-white border-slate-300 gap-1 grid grid-cols-2 p-1.5 rounded-md mt-1 shadow-md overflow-y-auto border z-40">
                  {branchDeptData?.getBranchDept.map((e) => (
                    <label
                      key={e.id}
                      className="flex bg-gray-100 items-center px-2 py-1 rounded-md shadow-sm border border-gray-500 cursor-pointer hover:bg-gray-200 gap-2 text-base "
                    >
                      <input
                        type="checkbox"
                        name={e.name}
                        id={e.name}
                        value={e.name}
                        onChange={(e) => handleCheckedDept(e, e.target.value)}
                        checked={data.departments.toString().includes(e.id)}
                        className="w-5 h-5"
                      />
                      <span>{e.name.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
              )}
          </div>
          <div className="w-full relative" ref={bucketDiv}>
            <p className="w-full text-base font-black uppercase text-slate-800">
              Bucket:
            </p>
            <div
              className={`${
                data.departments.length === 0 && "bg-gray-200"
              } w-full text-sm border rounded-lg flex justify-between ${
                selectBucket && data.departments.length > 0
                  ? "border-blue-500"
                  : "border-slate-300"
              }`}
            >
              <div
                className="w-full p-2.5 max-w-[350px] text-nowrap truncate cursor-default"
                title={data.buckets
                  .map(
                    (bucketId) =>
                      Object.entries(bucketObject).find(
                        ([, val]) => val.toString() === bucketId
                      )?.[0]
                  )
                  .join(", ")
                  .replace(/_/g, " ")}
                onClick={() => {
                  if (
                    validForCampaignAndBucket
                      .toString()
                      .includes(data.type as Type)
                  )
                    setSelectBucket((prev) => !prev);
                  // setCancel?.(true);
                }}
              >
                {data.buckets.length < 1
                  ? "Select Bucket"
                  : data.buckets
                      .map(
                        (bucketId) =>
                          Object.entries(bucketObject).find(
                            ([, val]) => val.toString() === bucketId
                          )?.[0]
                      )
                      .join(", ")
                      .replace(/_/g, " ")}
              </div>
              <MdKeyboardArrowDown
                className="text-lg absolute right-0 top-9"
                onClick={() => {
                  if (
                    validForCampaignAndBucket
                      .toString()
                      .includes(data.type as Type)
                  )
                    setSelectBucket((prev) => !prev);
                }}
              />
            </div>
            {selectBucket && data.departments.length > 0 && (
              <div className="w-full  absolute left-0 top-[70px] bg-white border-slate-300 p-1.5 max-h-28 rounded-b-md overflow-y-auto border z-40">
                {getDeptBucketData?.getBuckets.map((e, index) => (
                  <div
                    key={index}
                    className="py-0.5 grid grid-cols-2 gap-1 items-center justify-center"
                  >
                    {e.buckets.map((e) => (
                      <label
                        key={e._id}
                        className=" flex bg-gray-200 border border-gray-500 gap-2 pl-2 cursor-pointer hover:bg-gray-300 transition-all py-1 rounded-sm items-center text-base "
                      >
                        <input
                          className="w-5 h-5"
                          type="checkbox"
                          name={e.name}
                          id={e.name}
                          value={e.name}
                          onChange={(e) =>
                            handleCheckedBucket(e, e.target.value)
                          }
                          checked={data.buckets.toString().includes(e._id)}
                        />
                        <span className="uppercase">
                          {e.name.replace(/_/g, " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end w-full">
            <button
              className="bg-blue-500 border-2 border-blue-900 hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-black  rounded-md uppercase text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5"
              onClick={setCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-orange-500 border-2 border-orange-900 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 font-black rounded-md uppercase text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5"
              onClick={submitForm}
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      {confirm && <Confirmation {...modalProps} />}
    </div>
  );
};

export default RegisterView;
