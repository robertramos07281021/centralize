import gql from "graphql-tag"
import Uploader from "../../components/Uploader"
import { useQuery } from "@apollo/client"
import { useEffect, useState } from "react"
import {  useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import { setProductionManagerPage } from "../../redux/slices/authSlice";

import Pagination from "../../components/Pagination";
import CallfilesViews from "./CallfilesViews";

interface Bucket {
  id: string
  name: string
}

const BUCKETS = gql`
  query GetTLBucket {
    getTLBucket {
      id
      name
    }
  }

`
enum Status {
  all = "all",
  active = "active",
  finished = "finished"
}

const ProductionManagerView = () => {
  const dispatch = useAppDispatch()
  const {productionManagerPage} = useSelector((state:RootState)=> state.auth)
  const {data:bucketData, refetch} = useQuery<{getTLBucket:Bucket[]}>(BUCKETS)
  const [bucketObject, setBucketObject] = useState<{[key:string]:string}>({})
  const [callfileBucket, setCallfileBucket] = useState<string>("")
  const [required, setRequired] = useState(false)
  const [page, setPage] = useState<string>("1")
  const [status, setStatus] = useState<Status>(Status.all)
  const [totalPage, setTotalPage] = useState<number>(1)
  const [canUpload, setCanUpload] = useState<boolean>(false)

  useEffect(()=> {
    if(bucketData) {
      const newObject:{[key:string]:string} = {}
      bucketData.getTLBucket.map(e=> {
        newObject[e.name] = e.id
      })
      setBucketObject(newObject)
    }
  },[bucketData])

  useEffect(()=> {
    setPage(productionManagerPage.toString())
  },[productionManagerPage])

  useEffect(()=>{
    refetch()
  },[refetch])


  return (
    <div className="p-2 h-full overflow-y-auto">
      <div className="h-full flex flex-col ">
        <div className="p-5 flex gap-20 ">
          <div className="w-1/2 flex flex-col gap-2">
            <h1 className="lg:text-sm 2xl:text-sm font-medium text-gray-600 text-center">Call files</h1>
            <div className="flex gap-10 h-full items-end">
               <label className="flex flex-col w-1/2 gap-2">
                <p className="lg:text-xs 2xl:text-sm font-bold text-gray-400">Bucket</p>
                <select 
                  name="bucket" 
                  id="bucket" 
                  onChange={(e)=> setCallfileBucket(e.target.value)}
                  value={callfileBucket}
                  className={`${required ? "bg-red-50 border-red-500" : "border-slate-400"} lg:text-[0.6em] 2xl:text-xs w-full p-2  border rounded-lg`}>
                  <option value="">Select Bucket</option>
                  {
                    bucketData?.getTLBucket.map(e=> 
                      <option key={e.id} value={e.name}>
                        {
                          e.name.toUpperCase()
                        }
                      </option>
                    )
                  }
                </select>
              </label>
              <fieldset className="flex border rounded-xl p-2 gap-5 border-slate-400 ">
                <legend className="lg:text-xs 2xl:text-sm font-bold text-gray-400 px-2">Status</legend>
                <label className="lg:text-[0.6em] 2xl:text-xs flex gap-1 text-gray-600">
                  <input 
                    type="radio" 
                    name="status" 
                    id="all" 
                    checked={status === Status.all}
                    onChange={(e)=> setStatus(e.target.value as Status)}
                    value={Status.all}
                  />
                  <span>All</span>
                </label>
                <label className="lg:text-[0.6em] 2xl:text-xs flex gap-1 text-gray-600">
                  <input 
                    type="radio" 
                    name="status" 
                    id="active" 
                    checked={status === Status.active}
                    onChange={(e)=> setStatus(e.target.value as Status)}
                    value={Status.active} />
                  <span>Active</span>
                </label>
                <label className="lg:text-[0.6em] 2xl:text-xs flex gap-1 text-gray-600">
                  <input 
                    type="radio" 
                    name="status" 
                    id="finished" 
                    checked={status === Status.finished}
                    onChange={(e)=> setStatus(e.target.value as Status)}
                    value={Status.finished}
                  />
                  <span>Finished</span>
                </label>
              </fieldset>

            </div>
          </div>
    
          <div className="w-1/2 flex flex-col gap-2">
            <h1 className="lg:text-sm 2xl:text-sm font-medium text-gray-600 text-center">{ canUpload && "Uploader"}</h1>
            <div className=" h-full flex items-end">
              <Uploader width="w-full" bucket={bucketObject[callfileBucket]} bucketRequired={(e:boolean)=> setRequired(e)} onSuccess={()=> setCallfileBucket("")} canUpload={canUpload} />
            </div>
          </div>
          
        </div>
        <div className="sticky w-full top-0 text-gray-500 uppercase font-medium bg-blue-50 lg:text-xs 2xl:text-sm grid grid-cols-12 px-2 py-2">
          <div>Name</div>
          <div>Bucket</div>
          <div>Date</div>
          <div>Endo</div>
          <div>Work Days</div>
          <div>Accounts</div>
          <div>Connected</div>
          <div>Target</div>
          <div>Collected</div>
          <div>Status</div>
          <div>Finished By</div>
          <div className="text-center">Action</div>
        </div>
        <CallfilesViews bucket={bucketObject[callfileBucket]} status={status} setTotalPage={(e)=> setTotalPage(e)} setCanUpload={(e)=> setCanUpload(e)}/>
        <Pagination value={page} onChangeValue={(e) => setPage(e)} onKeyDownValue={(e)=> dispatch(setProductionManagerPage(e))} totalPage={totalPage} currentPage={productionManagerPage}/>
      </div> 
    </div>
  )
}

export default ProductionManagerView