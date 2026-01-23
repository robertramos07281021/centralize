import { gql, useMutation, useQuery } from "@apollo/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Users } from "../../middleware/types";
import Confirmation from "../../components/Confirmation";
import { useLocation, useNavigate } from "react-router-dom";

import { MdKeyboardArrowDown } from "react-icons/md";
import UserOptionSettings from "./UserOptionSettings";
import { useAppDispatch } from "../../redux/store";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import Loading from "../Loading.tsx";
// import { useSelector } from "react-redux";

type modalProps = {
  state: Users;
};

type SuccessUpdate = {
  user: Users;
  success: boolean;
  message: string;
};

type Bucket = {
  name: string;
  dept: string;
  _id: string;
};

type Branch = {
  id: string;
  name: string;
};

type Dept = {
  id: string;
  name: string;
  branch: string;
  aom: string;
};

type DeptBucket = {
  dept: string;
  buckets: Bucket[];
};

const DEPT_BUCKET_QUERY = gql`
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
    }
  }
`;

const RESET_PASSWORD = gql`
  mutation resetPassword($id: ID!) {
    resetPassword(id: $id) {
      success
      message
      user {
        _id
        name
        username
        type
        departments
        branch
        change_password
        buckets
        isLock
        callfile_id
        account_type
        active
        _id
        user_id
        softphone
      }
    }
  }
`;

const UPDATE_USER = gql`
  mutation updateUser($updateInput: UpdateAccount) {
    updateUser(updateInput: $updateInput) {
      success
      message
      user {
        _id
        name
        username
        type
        departments
        branch
        active
        account_type
        isLock
        callfile_id
        change_password
        buckets
        _id
        user_id
        vici_id
        softphone
      }
    }
  }
`;

const STATUS_UPDATE = gql`
  mutation Mutation($id: ID!) {
    updateActiveStatus(id: $id) {
      success
      message
      user {
        _id
        name
        username
        type
        departments
        branch
        isLock
        account_type
        change_password
        active
        callfile_id
        isOnline
        buckets
        softphone
        targets {
          daily
          weekly
          monthly
        }
        createdAt
        user_id
        vici_id
      }
    }
  }
`;

const UNLOCK_USER = gql`
  mutation unlockUser($id: ID!) {
    unlockUser(id: $id) {
      message
      success
      user {
        _id
        name
        username
        type
        departments
        branch
        isLock
        account_type
        change_password
        active
        callfile_id
        isOnline
        buckets
        softphone
        targets {
          daily
          weekly
          monthly
        }
        createdAt
        user_id
        vici_id
      }
    }
  }
`;

const LOGOUT_USER = gql`
  mutation adminLogout($id: ID) {
    adminLogout(id: $id) {
      message
      success
      user {
        _id
        name
        username
        type
        departments
        branch
        isLock
        account_type
        change_password
        active
        callfile_id
        isOnline
        buckets
        softphone
        targets {
          daily
          weekly
          monthly
        }
        createdAt
        user_id
        vici_id
      }
    }
  }
`;

type UserType =
  | "AGENT"
  | "ADMIN"
  | "AOM"
  | "TL"
  | "CEO"
  | "OPERATION"
  | "QA"
  | "QASUPERVISOR";

enum Types {
  AGENT = "AGENT",
  AGENTFIELD = "AGENTFIELD",
  TL = "TL",
  TLFIELD = "TLFIELD",
  AOM = "AOM",
  MIS = "MIS",
  CEO = "CEO",
  ADMIN = "ADMIN",
  OPERATION = "OPERATION",
  QA = "QA",
  QASUPERVISOR = "QASUPERVISOR",
}

type Data = {
  username: string;
  type: UserType;
  name: string;
  branch: string;
  departments: string[];
  buckets: string[];
  account_type: string;
  callfile_id: string;
  user_id: string;
  vici_id: string;
  softphone: string;
};

const UpdateUserForm: React.FC<modalProps> = ({ state }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const validForCampaignAndBucket = [
    "AGENT",
    "TL",
    "MIS",
    "ADMIN",
    "QA",
    "QASUPERVISOR",
  ];

  const { data: branchesData, refetch: branchRefetch } = useQuery<{
    getBranches: Branch[];
  }>(BRANCH_QUERY, {
    notifyOnNetworkStatusChange: true,
  });
  const [isUpdate, setIsUpdate] = useState(false);
  const [required, setRequired] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [selectionDept, setSelectionDept] = useState<boolean>(false);
  const [selectionBucket, setSelectionBucket] = useState<boolean>(false);

  const isValidUserType = (value: string): value is UserType => {
    return [
      "AGENT",
      "ADMIN",
      "AOM",
      "TL",
      "CEO",
      "OPERATION",
      "QA",
      "QASUPERVISOR",
    ].includes(value);
  };

  const safeType = isValidUserType(state?.type) ? state.type : "AGENT";

  const [check, setCheck] = useState<boolean>(state?.active);

  const [data, setData] = useState<Data>({
    username: state?.username,
    type: "AGENT" as
      | "AGENT"
      | "ADMIN"
      | "AOM"
      | "TL"
      | "CEO"
      | "OPERATION"
      | "QA"
      | "QASUPERVISOR",
    name: "",
    branch: "",
    departments: [],
    buckets: [],
    callfile_id: "",
    account_type: "",
    user_id: "",
    softphone: "",
    vici_id: "",
  });

  useEffect(() => {
    if (state) {
      setData({
        username: state?.username,
        type: safeType,
        name: state?.name,
        branch: state?.branch,
        departments: state?.departments || [],
        buckets: state?.buckets || [],
        callfile_id: state?.callfile_id || "",
        account_type: state?.account_type,
        user_id: state?.user_id || "",
        vici_id: state.vici_id || "",
        softphone: state.softphone || "",
      });
    }
  }, [state]);

  const branchObject: { [key: string]: string } = useMemo(() => {
    const branchArray = branchesData?.getBranches || [];
    return Object.fromEntries(branchArray.map((ba) => [ba.id, ba.name]));
  }, [branchesData]);

  const { data: branchDeptData, refetch: branchDeptRefetch } = useQuery<{
    getBranchDept: Dept[];
  }>(BRANCH_DEPARTMENT_QUERY, {
    variables: { branch: branchObject[data.branch] },
    skip: String(data?.branch).trim() === "",
    notifyOnNetworkStatusChange: true,
  });

  const { data: deptBucket } = useQuery<{ getBuckets: DeptBucket[] }>(
    DEPT_BUCKET_QUERY,
    {
      variables: { dept: data.departments },
      skip: String(data.departments).trim() === "",
      notifyOnNetworkStatusChange: true,
    }
  );

  const dept: { [key: string]: string } = useMemo(() => {
    const deptArray = branchDeptData?.getBranchDept || [];
    return Object.fromEntries(deptArray.map((da) => [da.name, da.id]));
  }, [branchDeptData]);

  const objectBranch: { [key: string]: string } = useMemo(() => {
    const branchArray = branchesData?.getBranches || [];
    return Object.fromEntries(branchArray.map((ba) => [ba.name, ba.id]));
  }, [branchesData]);

  const bucketObject: { [key: string]: string } = useMemo(() => {
    const bucketArray = deptBucket?.getBuckets || [];
    return Object.fromEntries(
      bucketArray.flatMap((ba) => ba.buckets.map((e) => [e.name, e._id]))
    );
  }, [deptBucket]);

  // ================ mutations ===================================
  const [updateUser, { loading: updateUserLoading }] = useMutation<{
    updateUser: SuccessUpdate;
  }>(UPDATE_USER, {
    onCompleted: (res) => {
      navigate(location.pathname, {
        state: { ...res.updateUser.user, newKey: "newKey" },
      });
      dispatch(
        setSuccess({
          success: res.updateUser.success,
          message: res.updateUser.message,
          isMessage: false,
        })
      );
      setIsUpdate(false);
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [resetPassword, { loading: resetPassLoading }] = useMutation<{
    resetPassword: SuccessUpdate;
  }>(RESET_PASSWORD, {
    onCompleted: (res) => {
      navigate(location.pathname, {
        state: { ...res.resetPassword.user, newKey: "newKey" },
      });
      dispatch(
        setSuccess({
          success: res.resetPassword.success,
          message: res.resetPassword.message,
          isMessage: false,
        })
      );
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [updateActiveStatus, { loading: updateActiveStatusLoading }] =
    useMutation<{
      updateActiveStatus: SuccessUpdate;
    }>(STATUS_UPDATE, {
      onCompleted: (res) => {
        navigate(location.pathname, {
          state: { ...res.updateActiveStatus.user, newKey: "newKey" },
        });
        dispatch(
          setSuccess({
            success: res.updateActiveStatus.success,
            message: res.updateActiveStatus.message,
            isMessage: false,
          })
        );
      },
      onError: () => {
        dispatch(setServerError(true));
      },
    });

  const [unlockUser, { loading: unlockUserLoading }] = useMutation<{
    unlockUser: SuccessUpdate;
  }>(UNLOCK_USER, {
    onCompleted: (res) => {
      navigate(location.pathname, {
        state: { ...res.unlockUser.user, newKey: "newKey" },
      });
      dispatch(
        setSuccess({
          success: res.unlockUser.success,
          message: res.unlockUser.message,
          isMessage: false,
        })
      );
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [adminLogout, { loading: adminLogoutLoading }] = useMutation<{
    adminLogout: SuccessUpdate;
  }>(LOGOUT_USER, {
    onCompleted: (res) => {
      navigate(location.pathname, {
        state: { ...res.adminLogout.user, newKey: "newKey" },
      });
      dispatch(
        setSuccess({
          success: res.adminLogout.success,
          message: res.adminLogout.message,
          isMessage: false,
        })
      );
    },
    onError: (err) => {
      console.log(err);
      dispatch(setServerError(true));
    },
  });

  //  ======================================================================

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "UNLOCK" | "LOGOUT",
    yes: () => {},
    no: () => {},
  });

  const handleCancel = () => {
    setIsUpdate(false);
    setRequired(false);
    setData({
      username: state?.username,
      type: safeType,
      name: state?.name,
      branch: state?.branch,
      departments: state?.departments,
      buckets: state?.buckets,
      account_type: state?.account_type,
      callfile_id: state?.callfile_id,
      user_id: state?.user_id,
      vici_id: state?.vici_id,
      softphone: state?.softphone,
    });
  };

  const submitValue: Record<string, () => Promise<void>> = {
    UPDATE: async () => {
      if (data.type === "AGENT") {
        if (!data.branch || !data.name || !data.departments || !data.buckets) {
          setRequired(true);
          return;
        } else {
          setRequired(false);
        }
      }
      setConfirm(true);
      setModalProps({
        no: () => setConfirm(false),
        yes: async () => {
          const { username, ...others } = data;
          await updateUser({
            variables: { updateInput: { ...others, id: state._id } },
          });
          setConfirm(false);
        },
        message: "Are you sure you want to update this user?",
        toggle: "UPDATE",
      });
    },
    RESET: async () => {
      setConfirm(true);
      setModalProps({
        no: () => setConfirm(false),
        yes: async () => {
          await resetPassword({ variables: { id: state._id } });
          setConfirm(false);
        },
        message: "Are you sure you want to reset password of this user?",
        toggle: "UPDATE",
      });
    },
    STATUS: async () => {
      setConfirm(true);
      setModalProps({
        no: () => {
          setConfirm(false);
          setCheck(state.active);
        },
        yes: async () => {
          await updateActiveStatus({ variables: { id: state._id } });
          setConfirm(false);
        },
        message: `Are you sure you want to ${
          state.active ? "Deactivate" : "Activate"
        } of this user?`,
        toggle: "UPDATE",
      });
    },
    UNLOCK: async () => {
      setConfirm(true);
      setModalProps({
        no: () => {
          setConfirm(false);
          setCheck(state.active);
        },
        yes: async () => {
          await unlockUser({ variables: { id: state._id } });
          setConfirm(false);
        },
        message: `Are you sure you want to unlock this user?`,
        toggle: "UNLOCK",
      });
    },
    LOGOUT: async () => {
      setConfirm(true);
      setModalProps({
        no: () => {
          setConfirm(false);
        },
        yes: async () => {
          await adminLogout({ variables: { id: state._id } });
          setConfirm(false);
        },
        message: `Are you sure you want to logout this user?`,
        toggle: "LOGOUT",
      });
    },
  };

  const handleSubmit = useCallback(
    (
      action: "UPDATE" | "RESET" | "STATUS" | "UNLOCK" | "LOGOUT",
      status: boolean
    ) => {
      submitValue[action]?.();
      if (action === "STATUS") {
        setCheck(status);
      }
    },
    [setCheck, submitValue]
  );

  const handleCheckedDept = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, value: string) => {
      const check = e.target.checked
        ? [...data.departments, dept[value]]
        : data.departments.filter((d) => d !== dept[value]);
      setData((prev) => ({ ...prev, departments: check, buckets: [] }));
    },
    [data, setData, dept]
  );

  const handleCheckedBucket = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, value: string) => {
      const check = e.target.checked
        ? [...data.buckets, bucketObject[value]]
        : data.buckets.filter((d) => d !== bucketObject[value]);
      setData((prev) => ({ ...prev, buckets: check }));
    },
    [setData, bucketObject, data]
  );

  useEffect(() => {
    const timer = async () => {
      await branchDeptRefetch();
      await branchRefetch();
    };
    timer();
  }, [data.branch]);

  const campaignDiv = useRef<HTMLDivElement | null>(null);
  const bucketDiv = useRef<HTMLDivElement | null>(null);

  const isLoading =
    updateUserLoading ||
    resetPassLoading ||
    updateActiveStatusLoading ||
    unlockUserLoading ||
    adminLogoutLoading;

  if (isLoading) return <Loading />;

  return (
    <>
      <div
        className=" w-full grid grid-cols-2 gap-10 col-span-2"
        onMouseDown={(e) => {
          if (!campaignDiv.current?.contains(e.target as Node)) {
            setSelectionDept(false);
          }
          if (!bucketDiv.current?.contains(e.target as Node)) {
            setSelectionBucket(false);
          }
        }}
      >
        <div className=" w-full flex flex-col gap-2 py-5 text-slate-600">
          {required && (
            <div className="text-center text-xs text-red-500">
              All fields are required.
            </div>
          )}
          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Type</p>
            <select
              id="type"
              name="type"
              value={data?.type}
              disabled={!isUpdate}
              onChange={(e) => {
                const newType = e.target.value as UserType;
                setData((prev) => ({ ...prev, type: newType }));
              }}
              className={`bg-slate-50 border-slate-300 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            >
              <option value="">--Choose a Type--</option>
              {Object.entries(Types).map(([key, value]) => (
                <option value={value} key={key}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Username</p>
            <input
              type="text"
              name="username"
              id="username"
              autoComplete="off"
              value={data?.username}
              disabled
              className={`${
                data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"
              }  border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}
            />
          </label>

          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Name</p>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="off"
              value={data?.name}
              onChange={(e) =>
                setData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={!isUpdate}
              className={`${
                data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"
              }  border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full in-disabled:bg-gray-200 capitalize`}
            />
          </label>

          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            <label className="w-full">
              <p className=" text-base font-medium text-slate-500">SIP ID</p>
              <input
                type="text"
                id="sip_id"
                name="sip_id"
                autoComplete="off"
                value={data?.user_id}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, user_id: e.target.value }))
                }
                disabled={!isUpdate}
                className={`${
                  data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"
                }  border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full in-disabled:bg-gray-200`}
              />
            </label>
            <label className="w-full">
              <p className=" text-base font-medium text-slate-500">
                Callfile ID
              </p>
              <input
                type="text"
                id="callfile_id"
                name="callfile_id"
                autoComplete="off"
                value={data?.callfile_id}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, callfile_id: e.target.value }))
                }
                disabled={!isUpdate}
                className={`${
                  data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"
                }  border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full in-disabled:bg-gray-200`}
              />
            </label>

            <label className="w-full">
              <p className=" text-base font-medium text-slate-500">
                Softphone ID
              </p>
              <input
                type="text"
                id="callfile_id"
                name="callfile_id"
                autoComplete="off"
                disabled={!isUpdate}
                value={data.softphone}
                onChange={(e)=> {
                  setData((prev)=> ({...prev, softphone: e.target.value}))
                }}
                className={`${
                  data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"
                }  border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full in-disabled:bg-gray-200`}
              />
            </label>

            <label className="w-full">
              <p className=" text-base font-medium text-slate-500">VICI ID</p>
              <input
                type="text"
                id="vici_id"
                name="vici_id"
                autoComplete="off"
                value={data?.vici_id}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, vici_id: e.target.value }))
                }
                disabled={!isUpdate}
                className={`${
                  data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"
                }  border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full in-disabled:bg-gray-200`}
              />
            </label>
          </div>
          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">
              Account Type
            </p>
            <select
              id="branch"
              name="branch"
              value={data.account_type || ""}
              onChange={(e) =>
                setData((prev) => ({ ...prev, account_type: e.target.value }))
              }
              disabled={!isUpdate}
              className={`${
                data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"
              } border-slate-300 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            >
              <option value="">Choose account type</option>
              <option value="caller">Caller</option>
              <option value="field">Field</option>
              <option value="skipper">Skipper</option>
            </select>
          </label>
          <label className="w-full">
            <p className=" text-base font-medium text-slate-500">Branch</p>
            <select
              id="branch"
              name="branch"
              value={branchObject[data.branch]}
              onChange={(e) => {
                setData((prev) => ({
                  ...prev,
                  branch: objectBranch[e.target.value],
                  departments: [],
                  buckets: [],
                }));
              }}
              disabled={!isUpdate}
              className={`${
                data?.type?.trim() === "" ? "bg-gray-200" : "bg-gray-50"
              } border-slate-300 border  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            >
              <option value="">Choose a branch</option>
              {branchesData?.getBranches.map((branch) => (
                <option key={branch.id} value={branch.name}>
                  {branch.name.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <div className="w-full relative" ref={campaignDiv}>
            <p className="w-full text-base font-medium text-slate-500">
              Campaign
            </p>
            <div
              className={`${
                data?.departments?.length === 0 && "bg-gray-200"
              } w-full text-sm border rounded-lg flex justify-between ${
                selectionDept && data.departments.length > 0
                  ? "border-blue-500"
                  : "border-slate-300"
              }`}
            >
              <div
                className="w-full p-2.5 text-nowrap truncate cursor-default"
                title={data?.departments
                  ?.map(
                    (deptId) =>
                      Object.entries(dept).find(
                        ([, val]) => val.toString() === deptId
                      )?.[0]
                  )
                  .join(", ")
                  .replace(/_/g, " ")}
                onClick={() => {
                  if (
                    validForCampaignAndBucket.toString().includes(data.type) &&
                    isUpdate
                  ) {
                    setSelectionDept(!selectionDept);
                    setSelectionBucket(false);
                  }
                }}
              >
                {data?.departments?.length < 1
                  ? "Select Department"
                  : data?.departments
                      ?.map(
                        (deptId) =>
                          Object.entries(dept).find(
                            ([, val]) => val.toString() === deptId
                          )?.[0]
                      )
                      .join(", ")
                      .replace(/_/g, " ")}
              </div>
              <MdKeyboardArrowDown
                className="text-lg absolute right-0 top-9"
                onClick={() => {
                  if (
                    validForCampaignAndBucket.toString().includes(data.type) &&
                    isUpdate
                  ) {
                    setSelectionDept(!selectionDept);
                    setSelectionBucket(false);
                  }
                }}
              />
            </div>
            {selectionDept && data.branch && (
              <div className="w-full absolute left-0 grid grid-cols-2 gap-1 bottom-11 bg-white rounded-md border-gray-600 p-1.5 max-h-[400px] overflow-y-auto border z-40">
                {branchDeptData?.getBranchDept.map((e) => {
                  const isSelected = data.departments.includes(e.id);
                  return (
                    e.name !== "ADMIN" && (
                      <label
                        key={e.id}
                        className={`flex gap-2 cursor-pointer px-3 py-1 rounded-sm shadow border border-gray-600 ${
                          isSelected ? "bg-gray-300" : "bg-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={e.name}
                          id={e.name}
                          value={e.name}
                          onChange={(event) => handleCheckedDept(event, e.name)}
                          checked={isSelected}
                        />
                        <span>{e.name.replace(/_/g, " ")}</span>
                      </label>
                    )
                  );
                })}
              </div>
            )}
          </div>
          <div className="w-full relative" ref={bucketDiv}>
            <p className="w-full text-base font-medium text-slate-500">
              Bucket
            </p>
            <div
              className={`${
                data?.departments?.length === 0 && "bg-gray-200"
              } w-full text-sm border rounded-lg flex justify-between ${
                selectionBucket && data?.departments?.length > 0
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
                      ?.toString()
                      .includes(data?.type) &&
                    isUpdate
                  )
                    setSelectionBucket(!selectionBucket);
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
                    validForCampaignAndBucket.toString().includes(data.type) &&
                    isUpdate
                  )
                    setSelectionBucket(!selectionBucket);
                }}
              />
            </div>
            {selectionBucket && data.departments.length > 0 && (
              <div className="w-full absolute left-0 bottom-11 grid grid-cols-2  gap-1 bg-white border-slate-300 p-1.5 max-h-50 overflow-y-auto border z-40">
                {deptBucket?.getBuckets.map((dept, index) => (
                  <div key={index} className="py-0.5">
                    <div className="uppercase text-sm">{dept.dept}</div>
                    {dept.buckets.map((bucket) => {
                      const isSelected = data.buckets.includes(bucket._id);
                      return (
                        <label
                          key={bucket._id}
                          className={`flex mb-1 gap-2 cursor-pointer px-3 py-1 rounded-sm shadow border border-gray-600 ${
                            isSelected ? "bg-gray-300" : "bg-gray-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            name={bucket.name}
                            id={bucket.name}
                            value={bucket.name}
                            onChange={(e) =>
                              handleCheckedBucket(e, e.target.value)
                            }
                            checked={isSelected}
                          />
                          <span className="uppercase">
                            {bucket.name.replace(/_/g, " ")}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            {isUpdate ? (
              <div className="flex">
                <button
                  type="button"
                  className="bg-orange-500  border-2 border-orange-800 transition-all hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 font-black uppercase rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5"
                  onClick={() => handleSubmit("UPDATE", false)}
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="bg-slate-500   border-2 border-gray-800 transition-all hover:bg-slate-600 focus:outline-none text-white focus:ring-4 focus:ring-slate-400 font-black uppercase rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="bg-orange-500 border-2 border-orange-800 font-black uppercase hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 shadow-md transition-all rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5"
                onClick={() => setIsUpdate(true)}
              >
                Update
              </button>
            )}
          </div>
        </div>

        <UserOptionSettings
          Submit={(
            action: "UPDATE" | "RESET" | "STATUS" | "UNLOCK" | "LOGOUT",
            status
          ) => handleSubmit(action, status)}
          check={check}
          isLock={state.isLock}
          isOnline={state.isOnline}
        />
      </div>
      {confirm && <Confirmation {...modalProps} />}
    </>
  );
};

export default UpdateUserForm;
