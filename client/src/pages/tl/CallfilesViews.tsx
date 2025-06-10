import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { FaTrash } from "react-icons/fa";
import { FaSquareCheck, FaDownload} from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import React, { useEffect } from "react";

  interface Callfile {
    _id: string
    name: string
    createdAt: string
    active: boolean
    endo: string
  }

  interface Result {
    callfile: Callfile
    accounts: number
    connected: number
    target: number
    collected: number
  }
  
  interface CallFilesResult {
    result: [Result]
    count: number
  }

const GET_CALLFILES = gql`
  query GetCallfiles($limit: Int!, $page: Int!, $status: String!, $bucket: ID) {
    getCallfiles(limit: $limit, page: $page, status: $status, bucket: $bucket) {
      result {
        callfile {
          _id
          name
          createdAt
          active
          endo
        }
        accounts
        connected
        target
        collected
      }
      count
    }
  }
`
interface Props {
  bucket: string
  status: string
  setTotalPage: (e:number) => void
}


const CallfilesViews:React.FC<Props> = ({bucket, status, setTotalPage}) => {
  const {limit, productionManagerPage } = useSelector((state:RootState)=> state.auth)

  const {data} = useQuery<{getCallfiles:CallFilesResult}>(GET_CALLFILES,{
    variables: {
      bucket,
      status: status,
      limit,
      page: productionManagerPage
    }
  })
 
  useEffect(()=> {
    if(data) {
     setTotalPage(Math.ceil(data.getCallfiles.count/20) ) 
    }
  },[data,setTotalPage])

  return (
    <div className=" h-full overflow-y-auto flex flex-col relative">
      {
        data?.getCallfiles.result.map((res,index) => {
          const date = new Date(res.callfile.createdAt);
          const today = new Date();
      
          const diffTime = today.getTime() - date.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          const checkStatus = res.callfile.active && !res.callfile.endo
          const status = checkStatus ? "Active" : "Finished"
          
                    


          return (
            <div key={index} className="w-full text-gray-500 uppercase font-medium even:bg-slate-100/80 2xl:text-xs lg:text-[0.6em] grid grid-cols-10 px-2 py-2">
              <div>{res.callfile.name}</div>
              <div>{new Date(res.callfile.createdAt).toLocaleDateString()}</div>
              <div>{res.callfile.endo ? new Date(res.callfile.endo).toLocaleDateString() : "-" }</div>
              <div>{diffDays}</div>
              <div>{res.accounts}</div>
              <div>{res.connected}</div>
              <div>{res.target.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
              <div>{res.collected.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</div>
              <div>{status}</div>
              <div className="flex lg:gap-3 2xl:gap-5 justify-center">
                {
                  checkStatus &&
                  <FaSquareCheck className="hover:scale-110 text-green-500 lg:text-xs 2xl:text-lg cursor-pointer"/>
                }

                <FaTrash className=" text-red-500 lg:text-xs 2xl:text-lg cursor-pointer hover:scale-110"/>

                <FaDownload className="text-blue-500 lg:text-xs 2xl:text-lg cursor-pointer hover:scale-110"/>

              </div>
            </div>
            
          )
        })
      }
      
    </div> 
  )
}

export default CallfilesViews