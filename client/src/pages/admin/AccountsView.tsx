import { gql, useQuery } from "@apollo/client"
import { Link, useNavigate } from "react-router-dom"
import { FaCircle } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import Pagination from "../../components/Pagination";
import { setAdminUsersPage } from "../../redux/slices/authSlice";
import { BsFillUnlockFill, BsFillLockFill } from "react-icons/bs";


type DeptBranchBucket = {
  id: string
  name: string
}

const GET_DEPTS = gql`
  query getDepts {
    getDepts {
      id
      name
    }
  }
`
const GET_BRANCHES = gql`
  query getBranches {
    getBranches {
      id
      name
    }
  }
`
const GET_ALL_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      id
      name
    }
  }

`

const FIND_QUERY = gql` 
  query Query($search: String!, $page: Int!, $limit: Int!) {
    findUsers(search: $search, page:$page, limit: $limit ) {
      total
      users {
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
        isOnline
        buckets
        createdAt
        user_id
      }
    }
  }
`

type Users = {
  _id: string;
  type: "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION" | "MIS";
  branch: string;
  username: string;
  name: string;
  change_password: boolean
  departments: string[]
  buckets: string[]
  isOnline: boolean
  isLock: boolean
  active: boolean
  account_type: string
  createdAt: string
  user_id: string
}

const AccountsView = () => {
  const [page, setPage] = useState<string>('1')
  const [search, setSearch] = useState("")
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const {limit, adminUsersPage} = useSelector((state:RootState)=> state.auth)

  const {data:getDeptData} = useQuery<{getDepts:DeptBranchBucket[]}>(GET_DEPTS)
  const {data:getBranchData} = useQuery<{getBranches:DeptBranchBucket[]}>(GET_BRANCHES)
  const {data: getAllBucketsData} = useQuery<{getAllBucket:DeptBranchBucket[]}>(GET_ALL_BUCKET) 
  const [totalPage, setTotalPage] = useState<number>(1)

  const deptObject:{[key:string]:string} = useMemo(()=> {
    const deptData = getDeptData?.getDepts || []
    return Object.fromEntries(deptData.map((db)=> [db.id, db.name]))
  },[getDeptData])

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const allBucketData = getAllBucketsData?.getAllBucket || []
    return Object.fromEntries(allBucketData.map((adb)=> [adb.id, adb.name]))
  },[getAllBucketsData])

  const branchObject:{[key:string]:string} = useMemo(()=> {
    const branchData = getBranchData?.getBranches || []
    return Object.fromEntries(branchData.map((bd)=> [bd.id, bd.name]))
  },[getBranchData])

  const {data:searchData, refetch } = useQuery<{findUsers:{users:Users[],total:number}}>(FIND_QUERY,{variables: { search, page: adminUsersPage, limit}})

  const users = searchData?.findUsers.users || [];

  useEffect(()=> {
    setPage(adminUsersPage.toString())
  },[adminUsersPage])

  useEffect(()=> {  
    if(searchData) {
      const searchExistingPages = Math.ceil((searchData?.findUsers.total || 1) / limit)
      setTotalPage(searchExistingPages)
    }
  },[searchData])

  useEffect(()=> {
    refetch()
  },[navigate])

  return (
    <div className="h-full flex flex-col overflow-hidden p-2">
      <div className=" flex justify-between p-3">
        <h1 className="text-2xl font-medium text-slate-500">Accounts</h1>
        <Link to="/register">
          <button type="button" className="focus:outline-none text-white bg-green-700   hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 cursor-pointer">Create Account</button>
        </Link>
      </div>
      <div className="flex justify-center ">

        <label className="flex border border-slate-500 rounded-xl w-96">
            <div className=" inset-y-0 start-0 flex items-center px-2 pointer-events-none">
              <CiSearch />
            </div>
            <input 
            type="search" 
            id="default-search" 
            name="default-search"
            autoComplete="off"
            className="p-2 w-full focus:outline-none" 
            placeholder="Search . . ." 
            onChange={(e)=> {setSearch(e.target.value); dispatch(setAdminUsersPage(1)); setPage(adminUsersPage.toString())}}
            required />
        </label>
      </div>

      <div className=" h-full overflow-y-hidden flex flex-col mx-5 mt-2 ">
        <div className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 grid grid-cols-11 py-2 font-bold px-2">
          <div>Name</div>
          <div>Username</div>      
          <div>Agent ID</div>      
          <div>Type</div>
          <div>Branch</div>
          <div>Campaign</div>
          <div>Bucket</div>
          <div>Active</div>
          <div>Online</div>
          <div>Lock</div>
          <div></div>
        </div>
        <div className="overflow-y-auto">
          {
            users?.map((user)=> 
              <div key={user._id} className="grid grid-cols-11 text-xs py-2 hover:bg-blue-50 even:bg-gray-50">
                <div className="font-medium px-2 text-gray-900 whitespace-nowrap dark:text-white">
                  {user.name.toUpperCase()}
                </div>
                <div>
                  {user.username}
                </div>
                <div>
                  {user.user_id}
                </div>
                <div >
                  {user.type}
                </div>
                <div >
                  {branchObject[user.branch]}
                </div>
                <div >
                  {user.departments?.map((e)=> deptObject[e]?.toString()).join(', ')}
                </div>
                <div >
                  {user.buckets?.map(b => bucketObject[b]?.toString()).join(', ')}
                </div>
                <div >
                  <FaCircle className={`${user.active ? "text-green-400" : "text-gray-950"} `} />
                </div>
                <div >
                
                  <FaCircle className={`${user.isOnline ? "text-green-400" : "text-gray-950"} `} />
              
                </div>
                <div className="text-xl">
                  {
                    user.isLock ?
                    <BsFillLockFill className="text-red-400" />
                    :
                    <BsFillUnlockFill /> 
                  }
                </div>
                <div className="flex justify-center">
                  <Link to="/user-account" state={user} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">View</Link>
                </div>
              </div>
            )
          }
        </div>
      </div>
      <div className="">
        <Pagination value={page} onChangeValue={(e) => setPage(e)} onKeyDownValue={(e)=> dispatch(setAdminUsersPage(e))} totalPage={totalPage} currentPage={adminUsersPage}/>
      </div>
    </div>
  )
}

export default AccountsView
