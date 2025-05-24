import { gql, useQuery } from "@apollo/client"
import { Link, useNavigate } from "react-router-dom"
import { Users } from "../../middleware/types"
import { FaCircle } from "react-icons/fa";
import { useEffect, useState } from "react";
import { CiSearch } from "react-icons/ci";

interface DeptBranchBucket {
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

const GET_ALL_USERS = gql`
  query Query($page: Int!) {
    getUsers(page:$page) {
      total
      users {
        _id
        name
        username
        type
        departments
        branch
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
const FIND_QUERY = gql` 
  query Query($search: String!, $page: Int!) {
    findUsers(search: $search, page:$page ) {
      total
      users {
        _id
        name
        username
        type
        departments
        branch
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

const AccountsView = () => {

  const {data:getDeptData} = useQuery<{getDepts:DeptBranchBucket[]}>(GET_DEPTS)
  const {data:getBranchData} = useQuery<{getBranches:DeptBranchBucket[]}>(GET_BRANCHES)
  const {data: getAllBucketsData} = useQuery<{getAllBucket:DeptBranchBucket[]}>(GET_ALL_BUCKET) 
  const [deptObject, setDeptObject] = useState<{[key:string]:string}>({})
  const [branchObject, setBranchObject] = useState<{[key:string]:string}>({})
  const [bucketObject, setBucketObject] = useState<{[key:string]:string}>({})



  useEffect(()=> {
    if(getDeptData) {
      const newObject:{[key:string]:string} = {}
      getDeptData.getDepts.map((e)=> {
        newObject[e.id] = e.name
      })
      setDeptObject(newObject)
    }
    if(getBranchData) {
      const newObject:{[key:string]:string} = {}
      getBranchData.getBranches.map((e)=> {
        newObject[e.id] = e.name
      })
      setBranchObject(newObject)
    }
    if(getAllBucketsData) {
      const newObject:{[key:string]:string} = {}
      getAllBucketsData.getAllBucket.map((e)=> {
        newObject[e.id] = e.name
      })
      setBucketObject(newObject)
    }
  },[getDeptData, getBranchData, getAllBucketsData])


  const [page] = useState<number>(1)
  const [search, setSearch] = useState("")
  const navigate = useNavigate()

  const {data, refetch, } = useQuery<{getUsers:{users:Users[],total:number}}>(GET_ALL_USERS,{variables: {page: page},skip: !!search })
  const {data:searchData, } = useQuery<{findUsers:{users:Users[],total:number}}>(FIND_QUERY,{variables: { search, page}, skip: !search})
  const users = search ? searchData?.findUsers?.users || [] : data?.getUsers?.users || [];
  


  useEffect(()=> {
    refetch()
  },[navigate,refetch])


  return (
    <div className="h-full">
      <div className="p-5 flex justify-between">
        <h1 className="text-2xl font-medium text-slate-500">Account</h1>
        <Link to="/register">
          <button type="button" className="focus:outline-none text-white bg-green-700   hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 cursor-pointer">Create Account</button>
        </Link>
      </div>
      <form className="max-w-md mx-auto">   
        <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
        <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <CiSearch />
            </div>
            <input 
            type="search" 
            id="default-search" 
            name="default-search"
            className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
            placeholder="Search . . ." 
            onChange={(e)=> setSearch(e.target.value)}
            required />
        </div>
      </form>
      <div className=" p-5">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Name
              </th>
              <th scope="col" className="px-6 py-3">
                Username
              </th>
              <th scope="col" className="px-6 py-3">
                Type
              </th>
              <th scope="col" className="px-6 py-3">
                Branch
              </th>
              <th scope="col" className="px-6 py-3">
                Campaign
              </th>
              <th scope="col" className="px-6 py-3">
                Bucket
              </th>
              <th scope="col" className="px-6 py-3">
                Active
              </th>
              <th scope="col" className="px-6 py-3">
                Online
              </th>
              <th scope="col" className="px-6 py-3">
                  
              </th>
            </tr>
          </thead>
          <tbody>
          {
            users?.map((user)=> 
              <tr key={user._id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 border-gray-200 hover:bg-slate-200 hover:text-black">
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {user.name.toUpperCase()}
                </th>
                <td className="px-6 py-4">
                  {user.username}
                </td>
                <td className="px-6 py-4">
                  {user.type}
                </td>
                <td className="px-6 py-4 uppercase">
                  {branchObject[user.branch]}
                </td>
                <td className="px-6 py-4">
                  {user.departments?.map((e)=> deptObject[e]?.toString()).join(', ')}
                </td>
                <td className="px-6 py-4">
                  {user.buckets?.map(b => bucketObject[b]?.toString()).join(', ')}
                </td>
                <td className="px-6 py-4">
                  <FaCircle className={`${user.active ? "text-green-400" : "text-gray-950"} `} />
                </td>
                <td className="px-6 py-4">
                
                  <FaCircle className={`${user.isOnline ? "text-green-400" : "text-gray-950"} `} />
              
                </td>
                <td className="px-6 py-4">
                  <Link to="/user-account" state={user} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">View</Link>
                </td>
              </tr>
            )
          }
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AccountsView
