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
  COMPLIANCE = "COMPLIANCE",
  FIELD = "FIELD",
}

enum AccountType {
  CALLER = "caller",
  SKIPER = "skiper",
  FIELD = "field",
}

type Data = {
  type: Type | null;
  name: string | null;
  username: string | null;
  branch: string | null;
  departments: string[];
  user_id: string | null;
  buckets: string[];
  account_type: AccountType | null;
  callfile_id: string | null;
  vici_id: string | null;
  softphone: string | null;
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

const GET_BUCKET_VICIIDS = gql`
  query getBucketViciIds($bucketIds: [ID]) {
    getBucketViciIds(bucketIds: $bucketIds)
  }
`;

const validForCampaignAndBucket = ["TL", "AGENT", "MIS", "QA", "COMPLIANCE"];

type RegisterProps = {
  setCancel: () => void;
};

const RegisterView: React.FC<RegisterProps> = ({ setCancel }) => {
  const [selectDept, setSelectDept] = useState<boolean>(false);
  const [selectBucket, setSelectBucket] = useState<boolean>(false);
  const [data, setData] = useState<Data>({
    type: null,
    name: null,
    username: null,
    branch: null,
    departments: [],
    user_id: null,
    buckets: [],
    callfile_id: null,
    account_type: null,
    vici_id: null,
    softphone: null,
  });
  const dispatch = useAppDispatch();

  const [viciIdsAccounts, setViciIdsAccounts] = useState<
    { name: string; vici_id: string }[]
  >([]);

  const { refetch } = useQuery<{ getBucketViciIds: string[] }>(
    GET_BUCKET_VICIIDS,
    { variables: { bucketIds: data.buckets } }
  );

  useEffect(() => {
    if (data.buckets.length > 0) {
      const refetching = async () => {
        const res = await refetch({
          variables: { bucketIds: data?.buckets },
        });
        const newRes = res.data.getBucketViciIds.map((x) => {
          const resultSplit = x.split("|");
          const name = resultSplit[1];
          const viciId = resultSplit[0];
          return {
            name: name,
            vici_id: viciId,
          };
        });
        setViciIdsAccounts(newRes);
      };
      refetching();
    }
  }, [data.buckets]);
  console.log(viciIdsAccounts);

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
      name: null,
      username: null,
      branch: null,
      departments: [],
      user_id: null,
      buckets: [],
      callfile_id: null,
      account_type: null,
      vici_id: null,
      softphone: null,
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
      console.log(error);
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
    data.branch &&
    data.name &&
    data.username &&
    data.departments.length > 0 &&
    data.buckets.length > 0 &&
    data.vici_id &&
    data.softphone;

  const validateOther = () => data.name && data.username;

  const handleCreateUser = useCallback(async () => {
    try {
      await createUser({ variables: { createInput: data } });
    } catch (err) {
      console.error("createUser mutation failed:", err);
    }
  }, [data, createUser]);

  const submitForm = useCallback(() => {
    const isAgent = validForCampaignAndBucket.includes(data?.type as string);
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
      setData((prev) => ({ ...prev, departments: check, buckets: [] }));
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
    if (!data.type) {
      setData((prev) => ({
        ...prev,
        name: null,
        username: null,
        branch: null,
        departments: [],
        buckets: [],
        user_id: null,
        callfile_id: null,
        account_type: null,
        vici_id: null,
        softphone: null,
      }));
    } else {
      setSelectDept(false);
      setSelectBucket(false);
      setData((prev) => ({
        ...prev,
        name: null,
        username: null,
        branch: null,
        departments: [],
        buckets: [],
        user_id: null,
        callfile_id: null,
        account_type: null,
        vici_id: null,
        softphone: null,
      }));
    }
  }, [data.type]);

  const refForm = useRef<HTMLFormElement | null>(null);

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
        <form
          className=" px-5 w-full py-2 flex flex-col gap-2 items-center justify-center "
          ref={refForm}
          noValidate
        >
          {required && (
            <div className="text-center text-xs text-red-500">
              Some fields are required.
            </div>
          )}
          <label className="w-full">
            <p className="w-full text-base font-black uppercase text-slate-800">
              Type:{" "}
              <span className="text-red-500">
                {required && !data.type ? "*" : ""}
              </span>
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
                Name:{" "}
                <span className="text-red-500">
                  {data.type && required && !data.name ? "*" : ""}
                </span>
              </p>
              <input
                type="text"
                id="name"
                name="name"
                autoComplete="off"
                value={data.name || ""}
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
                Username:{" "}
                <span className="text-red-500">
                  {data.type && required && !data.username ? "*" : ""}
                </span>
              </p>
              <input
                type="text"
                name="username"
                id="username"
                autoComplete="off"
                value={data.username || ""}
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
                value={data.user_id || ""}
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
                Softphone ID:{" "}
                <span className="text-red-500">
                  {data.type && required && !data.softphone ? "*" : ""}
                </span>
              </p>
              <input
                type="text"
                name="id_number"
                id="id_number"
                autoComplete="off"
                aria-disabled="true"
                value={data.softphone || ""}
                disabled={
                  !data.type ||
                  !validForCampaignAndBucket.toString().includes(data.type)
                }
                onChange={(e) => {
                  const value =
                    e.target.value.trim() === "" ? null : e.target.value;
                  setData((prev) => ({ ...prev, softphone: value }));
                }}
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
                value={data.callfile_id || ""}
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
                  value={data.account_type || ""}
                  disabled={data.type !== "AGENT"}
                  onChange={(e) => {
                    const value =
                      e.target.value.trim() === ""
                        ? null
                        : (e.target.value as AccountType);
                    setData((prev) => ({ ...prev, account_type: value }));
                  }}
                  className={`${
                    data.type !== "AGENT" ? "bg-gray-200" : "bg-gray-50"
                  } border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                >
                  <option value="">Choose a account type</option>
                  <option value={AccountType.CALLER}>Caller</option>
                  <option value={AccountType.FIELD}>Field</option>
                  <option value={AccountType.SKIPER}>Skipper</option>
                </select>
              </label>
            </div>

            <label className="w-full">
              <p className="w-full text-base font-black uppercase text-slate-800">
                Branch:{" "}
                <span className="text-red-500">
                  {data.type && required && !data.branch ? "*" : ""}
                </span>
              </p>
              <select
                id="branch"
                name="branch"
                value={data.branch || ""}
                onChange={(e) => {
                  const value =
                    e.target.value.trim() === "" ? null : e.target.value;
                  setData((prev) => ({
                    ...prev,
                    branch: value,
                    departments: [],
                    buckets: [],
                  }));
                }}
                disabled={
                  !data.type ||
                  !validForCampaignAndBucket?.toString().includes(data.type)
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
                  <option key={branch.id} value={branch.id}>
                    {branch.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="w-full relative" ref={campaignDiv}>
            <p className="w-full text-base font-black uppercase text-slate-800">
              Campaign:{" "}
              <span className="text-red-500">
                {data.branch &&
                data.type &&
                required &&
                data.departments.length <= 0
                  ? "*"
                  : ""}
              </span>
            </p>
            <div
              className={`${
                (!data.branch ||
                  !validForCampaignAndBucket
                    .toString()
                    .includes(data.type as Type)) &&
                "bg-gray-200"
              } max-w-full text-sm border rounded-lg flex justify-between ${
                selectDept && data.branch
                  ? "border-blue-500"
                  : "border-slate-300"
              }`}
            >
              <div
                className="w-full p-2.5 text-nowrap truncate cursor-default capitalize"
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
              Bucket:{" "}
              <span className="text-red-500">
                {data.departments.length > 0 &&
                data.type &&
                required &&
                data.buckets.length <= 0
                  ? "*"
                  : ""}
              </span>
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
                className="w-full p-2.5 text-nowrap truncate cursor-default"
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
            <div>
              <label className="flex flex-col">
                <p className="font-black text-slate-800 ">
                  VICI ID:{" "}
                  <span className="text-red-500">
                    {data.type && required && !data.vici_id ? "*" : ""}
                  </span>
                </p>

                <input
                  id="vici_id"
                  name="vici_id"
                  list="viciIds"
                  disabled={
                    !data.type ||
                    !validForCampaignAndBucket.toString().includes(data.type) ||
                    data?.buckets?.length < 1
                  }
                  className={` ${
                    !data.type ||
                    !validForCampaignAndBucket.toString().includes(data.type) ||
                    data?.buckets?.length < 1
                      ? "bg-gray-200"
                      : "bg-gray-50"
                  } w-full bg-gray-100 px-5 py-2 pr-1 rounded-md focus:outline-none border border-slate-300 `}
                  value={data.vici_id || ""}
                  onChange={(e) => {
                    const value =
                      e.target.value.trim() === "" ? null : e.target.value;
                    setData((prev) => ({ ...prev, vici_id: value }));
                  }}
                />
                <datalist id="viciIds">
                  {viciIdsAccounts.map((via, index) => {
                    return (
                      <option value={via.vici_id} key={index}>
                        {via.name}
                      </option>
                    );
                  })}
                </datalist>
              </label>
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
