import { gql, useMutation, useQuery } from "@apollo/client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Confirmation from "../../components/Confirmation"
import { MdKeyboardArrowDown } from "react-icons/md";
import { useAppDispatch } from "../../redux/store";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";

type Dept = {
  id: string;
  name: string;
  branch: string;
}

type Branch = {
  id: string;
  name: string;
}

type Bucket = {
  id:string
  name: string
}

type DeptBucket = {
  dept: string
  buckets: Bucket[]
}

enum Type {
  AGENT = 'AGENT',
  TL = 'TL',
  AOM = 'AOM',
  MIS = "MIS",
  CEO = 'CEO',
  ADMIN = 'ADMIN',
  OPERATION = 'OPERATION'
}

enum AccountType {
  CALLER = 'caller',
  SKIPER = 'skiper',
  FIELD = 'field'
}

type Data = {
  type: Type | null,
  name: string,
  username: string,
  branch: string,
  departments: string[],
  user_id: string,
  buckets: string[],
  account_type: AccountType | null
}


const CREATE_ACCOUNT = gql`
  mutation createUser($name: String!, $username: String!, $type: String!, $departments: [ID], $branch: ID!, $user_id: String, $buckets:[ID], $account_type: String) {
    createUser(name: $name, username: $username, type: $type, departments: $departments, branch: $branch, user_id: $user_id, buckets:$buckets, account_type:$account_type) {
      success
      message
    }
  }
`

const BRANCH_QUERY = gql`
  query branchQuery {
    getBranches {
      id
      name
    }
  } 
`

const BRANCH_DEPARTMENT_QUERY = gql`
  query getBranchDept($branch: String) {
    getBranchDept(branch: $branch){
      id
      name
      branch
    }
  }
`

const GET_DEPT_BUCKET = gql`
  query getBuckets($dept: [ID]) {
    getBuckets(dept: $dept) {
      dept
      buckets {
        id
        name
      }
    }
  }
`

const validForCampaignAndBucket = ['TL','AGENT','MIS']

const RegisterView = () => {

  const [selectDept, setSelectDept] = useState<boolean>(false)
  const [selectBucket, setSelectBucket] = useState<boolean>(false)
  const [data, setData] = useState<Data>({
    type: null,
    name: "",
    username: "",
    branch: "",
    departments: [],
    user_id: "",
    buckets: [],
    account_type: null
  })
  const dispatch = useAppDispatch()

  const {data:branchQuery} = useQuery<{getBranches:Branch[]}>(BRANCH_QUERY)
  const {data:getDeptBucketData} = useQuery<{getBuckets:DeptBucket[]}>(GET_DEPT_BUCKET,{variables: {dept: data.departments}})
  
  const branchObject:{[key:string]:string} = useMemo(()=> {
    const bqd = branchQuery?.getBranches || []
    return Object.fromEntries(bqd.map(e=>[e.name, e.id] ))
  },[branchQuery])

  const {data:branchDeptData} = useQuery<{getBranchDept:Dept[]}>(
    BRANCH_DEPARTMENT_QUERY, {variables: {branch: Object.keys(branchObject).find((key) => branchObject[key] === data.branch)}})

  const deptObject:{[key:string]:string} = useMemo(()=> {
    const bdd = branchDeptData?.getBranchDept || []
    return Object.fromEntries(bdd.map(e=> [e.name, e.id]))
  },[branchDeptData])
    
  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const dbd = getDeptBucketData?.getBuckets || []
    return Object.fromEntries(dbd.flatMap(e=> e.buckets.map(y=> [y.name, y.id])))
  },[getDeptBucketData])

  const [createUser] = useMutation(CREATE_ACCOUNT, {
    onCompleted: () => {
      setData({
        type: null,
        name: "",
        username: "",
        branch: "",
        departments: [],
        user_id: "",
        buckets: [],
        account_type: null
      })
      dispatch(setSuccess({
        success: true,
        message: "Account created"
      }))
      setConfirm(false)
    },
    onError: (error) => {
      const errorMessage = error?.message;
      if (errorMessage?.includes("E11000")) {
        dispatch(setSuccess({
          success: true,
          message: "Username already exists",
        }))
        setData({
          type: null,
          name: "",
          username: "",
          branch: "",
          departments: [],
          user_id: "",
          buckets: [],
          account_type: null
        });
      } else {
        dispatch(setServerError(true))
      }
    }
  })

  const [required, setRequired] = useState(false)
  const [confirm,setConfirm] = useState(false)

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE",
    yes: () => {},
    no: () => {}
  })

  const validateAgent = () =>
    data.branch && data.name && data.username && data.departments.length > 0;
  
  const validateOther = () =>
    data.name && data.username;

  const handleCreateUser = useCallback(async () => {
    await createUser({ variables: { ...data } });
  },[data, createUser]);

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
    })
  },[data,setRequired, setConfirm, setModalProps ,handleCreateUser])

  const handleCheckedDept = useCallback((e:React.ChangeEvent<HTMLInputElement>,value:string) => {
    const check = e.target.checked ? [...data.departments, deptObject[value]] : data.departments.filter((d) => d !== deptObject[value] )
    setData({...data, departments: check})
  },[data,deptObject])

  const handleCheckedBucket = useCallback((e:React.ChangeEvent<HTMLInputElement>,value:string) => {
    const check = e.target.checked ? [...data.buckets, bucketObject[value]] : data.buckets.filter((d) => d !== bucketObject[value] )
    setData({...data, buckets: check})
  },[data, bucketObject, setData])


  useEffect(() => {
    if (data.type === null && (data.name || data.username || data.branch || data.departments.length > 0 || data.user_id)) {
      setData(prev => ({
        ...prev,
        name: "",
        username: "",
        branch: "",
        department: [],
        buckets: [],
        user_id: "",
        account_type: null
      }));
    }
  }, [data.type, data])

  const bucketDiv  = useRef<HTMLDivElement | null>(null)
  const campaignDiv  = useRef<HTMLDivElement | null>(null)


  return (
    <>
      <div className="w-full justify-center items-center flex flex-col bg-[]" onMouseDown={(e)=>{
        if(!bucketDiv.current?.contains(e.target as Node)){
          setSelectBucket(false)
        }
        if(!campaignDiv.current?.contains(e.target as Node)){
          setSelectDept(false)
        }
      }}>
        <div className="p-5 text-2xl font-medium text-slate-500 ">Create Account</div>
        <form className=" lg:w-3/8 2xl:w-2/8 px-5 py-2 flex flex-col gap-2 items-center justify-center ">
          {
            required && 
          <div className="text-center text-xs text-red-500">All fields are required.</div>
          }
          <label className="w-full">
            <p className="w-full text-base font-medium text-slate-500">Type</p>
            <select
              id="type"
              name="type"
              value={data.type === null ? "" : data.type as Type}
              onChange={(e)=> {
                const value = e.target.value === "" ? null : e.target.value as Type
                setData(prev => ({...prev, type: value}))}}
              className={`bg-slate-50 border-slate-300 border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
              >
              <option value="">Choose a type</option>
              <option value={Type.AGENT}>AGENT</option>
              <option value={Type.TL}>TL</option>
              <option value={Type.AOM}>AOM</option>
              <option value={Type.MIS}>MIS</option>
              <option value={Type.CEO}>CEO</option>
              <option value={Type.ADMIN}>ADMIN</option>
              <option value={Type.OPERATION}>OPERATION</option>
            </select>
          </label>
          <label className="w-full">
            <p className="w-full text-base font-medium text-slate-500">Name</p>
            <input 
              type="text" 
              id="name" 
              name="name" 
              autoComplete="off"
              value={data.name}
              onChange={(e)=> setData({...data, name: e.target.value})}
              disabled={!data.type}
              className={`${!data.type ? "bg-gray-200" : "bg-gray-50"}  border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full in-disabled:bg-gray-200`}  
              />
          </label>
          
          <label className="w-full">
            <p className="w-full text-base font-medium text-slate-500">Username</p>
            <input 
              type="text" 
              name="username" 
              id="username" 
              autoComplete="off"
              value={data.username}
              onChange={(e)=> setData({...data,username: e.target.value})}
              disabled={!data.type}
              className={`${!data.type ? "bg-gray-200" : "bg-gray-50"} bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}  
              />
          </label>
          <label className="w-full">
            <p className="w-full text-base font-medium text-slate-500">SIP Id</p>
            <input 
              type="text" 
              name="id_number" 
              id="id_number" 
              autoComplete="off"
              value={data.user_id}
              onChange={(e)=> setData({...data,user_id: e.target.value})}
              disabled={!data.type || !validForCampaignAndBucket.toString().includes(data.type)  }
              className={`${!data.type || !validForCampaignAndBucket.toString().includes(data.type)  ? "bg-gray-200" : "bg-gray-50"} bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5`}  
              />
          </label>

          <label className="w-full">
            <p className="w-full text-base font-medium text-slate-500">Account Type</p>
            <select
              id="account_type"
              name="account"
              disabled={!data.type}
              onChange={(e)=> {
                const value = e.target.value === "" ? null : e.target.value as AccountType
                setData({...data, account_type: value})}}
              className={`${!data.type ? "bg-gray-200" : "bg-gray-50"} border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            >
              <option value="">Choose a account type</option>
              <option value={AccountType.CALLER}>Caller</option>
              <option value={AccountType.FIELD}>Field</option>
              <option value={AccountType.SKIPER}>Skipper</option>
            </select>
          </label>

          <label className="w-full">
            <p className="w-full text-base font-medium text-slate-500">Branch</p>
            <select
              id="branch"
              name="branch"
              value={data.branch ? Object.keys(branchObject).find((key) => branchObject[key] === data.branch) : ""}
              onChange={(e)=> setData({...data, branch: branchObject[e.target.value]})}
              disabled={!data.type || !validForCampaignAndBucket.toString().includes(data.type)}
              className={`${!data.type|| !validForCampaignAndBucket.toString().includes(data.type) ? "bg-gray-200" : "bg-gray-50"} border-slate-300 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
            >
              <option value="">Choose a branch</option>
              {
                branchQuery?.getBranches.map((branch)=> 
                  <option key={branch.id} value={branch.name}>{branch.name.toUpperCase()}</option>
                )
              }
            </select>
          </label>
    
          <div className="w-full relative" ref={campaignDiv}>
            <p className="w-full text-base font-medium text-slate-500">Campaign</p>
            <div className={`${(!data.branch || !validForCampaignAndBucket.toString().includes(data.type as Type)) && "bg-gray-200"} w-full text-sm border rounded-lg flex justify-between ${selectDept && data.branch ? "border-blue-500" : "border-slate-300"}`}>
              <div className="w-full p-2.5 text-nowrap truncate cursor-default capitalize" title={data.departments.map(deptId => Object.entries(deptObject).find(([, val]) => val.toString() === deptId)?.[0]).join(', ').replace(/_/g, " ")} onClick={()=> {if(validForCampaignAndBucket.toString().includes(data.type as Type)) {setSelectDept(!selectDept); setSelectBucket(false)} }}>
                {
                  (() => {
                    const haveCampaign = branchDeptData && branchDeptData?.getBranchDept?.length > 0
                    const findDept = branchQuery?.getBranches.find( e => e.id === data.branch)
                    const campaignSelection = haveCampaign ? data.departments.length < 1 ? 'Select Campaign' : data.departments.map(deptId => Object.entries(deptObject).find(([, val]) => val.toString() === deptId)?.[0]).join(', ').replace(/_/g, " ") : data.branch ? `No Campaign on ${findDept?.name}`: "Select Campaign"
                    return campaignSelection
                  })()
                }
              </div>
              <MdKeyboardArrowDown className="text-lg absolute right-0 top-9" onClick={()=> {if(validForCampaignAndBucket.toString().includes(data.type as Type)) {setSelectDept(!selectDept); setSelectBucket(false)}}}/>
            </div>
            {
              ( selectDept && data.branch && branchDeptData && branchDeptData?.getBranchDept?.length > 0) &&
              <div className="w-full absolute left-0 top-16.5 bg-white border-slate-300 p-1.5 max-h-70 overflow-y-auto border z-40">
                {
                  branchDeptData?.getBranchDept.map((e)=> 
                    <label key={e.id} className="flex gap-2">
                      <input 
                      type="checkbox"
                      name={e.name} 
                      id={e.name} 
                      value={e.name}
                      onChange={(e)=> handleCheckedDept(e, e.target.value)} 
                      checked={data.departments.toString().includes(e.id)} />
                      <span>{e.name.replace(/_/g," ")}</span>
                    </label>
                  )
                }
              </div>
            }
          </div>
          <div className="w-full relative" ref={bucketDiv}>
            <p className="w-full text-base font-medium text-slate-500">Bucket</p>
            <div className={`${data.departments.length === 0 && "bg-gray-200"} w-full text-sm border rounded-lg flex justify-between ${selectBucket && data.departments.length > 0 ? "border-blue-500" : "border-slate-300"}`}>
              <div className="w-full p-2.5 text-nowrap truncate cursor-default" title={data.buckets.map(bucketId => Object.entries(bucketObject).find(([, val]) => val.toString() === bucketId)?.[0]).join(', ').replace(/_/g, " ")} onClick={()=> {if(validForCampaignAndBucket.toString().includes(data.type as Type)) setSelectBucket(prev => !prev)}}>
                {
                  data.buckets.length < 1 ? "Select Bucket" : data.buckets.map(bucketId => Object.entries(bucketObject).find(([, val]) => val.toString() === bucketId)?.[0]).join(', ').replace(/_/g, " ")
                }
              </div>
              <MdKeyboardArrowDown className="text-lg absolute right-0 top-9" onClick={()=> {if(validForCampaignAndBucket.toString().includes(data.type as Type)) setSelectBucket(prev => !prev)}}/>
            </div>
            {
              (selectBucket && data.departments.length > 0) &&
              <div className="w-full absolute left-0 top-16.5 bg-white border-slate-300 p-1.5 max-h-50 overflow-y-auto border z-40">
                {
                  getDeptBucketData?.getBuckets.map((e,index)=> 
                  
                    <div key={index} className="py-0.5">
                      <div className="uppercase text-sm">{e.dept}</div>
                      {
                        e.buckets.map(e => 
                        <label key={e.id} className="flex gap-2 text-xs">
                          <input 
                          type="checkbox"
                          name={e.name} 
                          id={e.name} 
                          value={e.name}
                          onChange={(e)=> handleCheckedBucket(e, e.target.value)} 
                          checked={data.buckets.toString().includes(e.id)} />
                          <span className="uppercase">{e.name.replace(/_/g," ")}</span>
                        </label>
                        )
                      }
                    </div>
                  
                  )

                }
              </div>
            }
          </div>
          <div>
            <button type="button" className="bg-blue-500 hover:bg-blue-600 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer mt-5" 
            onClick={submitForm}
            >Submit</button>
          </div>
        </form>
      </div>

      { confirm &&
      <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default RegisterView
