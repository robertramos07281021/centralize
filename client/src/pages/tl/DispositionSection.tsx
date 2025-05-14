import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaArrowUp, FaArrowDown, FaMinus   } from "react-icons/fa";

interface DispoData {
  id: string
  code: string
  name: string
  count: string
}

interface Agent {
  _id: string
  name: string
  buckets: string[]
}

interface BucketDisposition {
  bucket: string
  amount: number
  users: Agent[]
  dispositions: DispoData[]
} 

interface Bucket {
  name: string
  dept: string
  id: string
}

const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

const BUCKET_DISPOSITIONS = gql`
  query getBucketDisposition {
    getBucketDisposition {
      bucket
      amount
      users {
        _id
        name
        buckets
      }
      dispositions {
        code
        name
        count
      }
    }
  }
`

const DEPT_BUCKET_QUERY = gql`
  query getDeptBucket {
    getDeptBucket {
      id
      name
      dept
    }
  }
`

interface Yesterday {
  bucket: string
  count: number
}
const YESTERDAY_COLLECTION = gql`
  query Query {
    getDispositionCountYesterday {
      bucket
      count
    }
  }
`

const DispositionSection = () => {
  const navigate = useNavigate()
  const {data:bucketDispoData, refetch:bucketDispoRefetch } = useQuery<{getBucketDisposition:BucketDisposition[]}>(BUCKET_DISPOSITIONS)

  const {data:yesterday} = useQuery<{getDispositionCountYesterday:Yesterday[]}>(YESTERDAY_COLLECTION)

  const {data:deptBucket, refetch:deptBucketRefetch} = useQuery<{getDeptBucket:Bucket[]}>(DEPT_BUCKET_QUERY)

  const [existsDispo, setExistsDispo] = useState<string[]>([])
 

  useEffect(()=> {
    const newArray = bucketDispoData?.getBucketDisposition.map((bd) => bd.dispositions.map((d)=> d.code) )
    const flatArray = newArray?.flat()
    setExistsDispo([...new Set(flatArray)])
  },[bucketDispoData])

  const {data:disposition, refetch:dispoTypeRefetch} = useQuery<{getDispositionTypes:DispoData[]}>(GET_DISPOSITION_TYPES)

  useEffect(()=> {
    dispoTypeRefetch()
    deptBucketRefetch()
    bucketDispoRefetch()
  },[navigate, dispoTypeRefetch, deptBucketRefetch, bucketDispoRefetch])

  return (
    <div className={`row-span-3 col-span-4 overflow-y-auto grid gap-5`}>
      <div className=" border rounded-md bg-white border-slate-400 p-1.5 ">
        <table className='w-full border-collapse '>
          <thead className='sticky top-0 '>
            <tr className='text-slate-500  '>
              <th className='w-auto 2xl:text-sm lg:text-[0.7rem] p-2'>BUCKET</th>
              {
                disposition?.getDispositionTypes.map((dt) => {
                  return  existsDispo.includes(dt.code) && (
                    <th key={dt.id} className="2xl:text-xs lg:text-[0.6rem] font-medium p-2 ">
                      {dt.code}
                    </th>
                  )
                })
              }
            </tr>
          </thead>
          <tbody>
            { deptBucket?.getDeptBucket.map((db) => { 
                const matchBucket = bucketDispoData?.getBucketDisposition.find(
                  (bd) => bd.bucket === db.name 
                );
              return  (
              <tr key={db.id} className='even:bg-gray-200 text-center text-sm text-slate-500'>
                <th className="py-1.5 w-24 font-medium 2xl:text-sm lg:text-xs">{db.name}</th>
                {
                  disposition?.getDispositionTypes.map((dispo)=> {
                    const found = matchBucket?.dispositions.find((d)=> d.code === dispo.code);
                    return found && (
                      <td key={dispo.code} className="2xl:text-xs lg:text-[0.6rem] ">
                        {found && found.count}
                      </td>
                    )
                  })
                }
              </tr>
            )})}
        
      
          </tbody>
        </table>

      </div>
      <div className={`row-span-4 grid grid-cols-${deptBucket?.getDeptBucket.length} gap-5 `}>
        {
         deptBucket?.getDeptBucket.map((db)=> {
          const findBucket = bucketDispoData?.getBucketDisposition.find((bd)=> bd.bucket === db.name)
          const findYesterdayBucketCount = yesterday?.getDispositionCountYesterday.find(dcy => dcy.bucket === db.id)

          const diff = (findBucket?.amount || 8000) - (findYesterdayBucketCount?.count || 18000);
          const percentage = Math.abs(diff / Math.max((findYesterdayBucketCount?.count || 18000), 1)) * 100;
          const trend = diff > 0 ? <FaArrowUp className="text-green-400" /> : diff < 0 ? <FaArrowDown className="text-red-400"/> : <FaMinus className="text-blue-500" />;
          return (
            <div key={db.id} className="border border-slate-400 bg-white rounded-md p-5 flex flex-col justify-between">
              <h1 className="font-medium text-slate-600 ">{db.dept} - {db.name}</h1>
              <div className="">
                <div className="flex justify-between">
                  <div className="flex flex-col lg:text-base 2xl:text-2xl items-center gap-2">
                    <div className="flex items-center ">
                      <p>
                        {trend}
                      </p>
                      <p>
                        {percentage.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-sm">Yesterday: <span>{findYesterdayBucketCount?.count ? findYesterdayBucketCount?.count.toLocaleString('en-ph',{ style: 'currency', currency: 'PHP' }) : `P18,000`}</span></div>
                  </div>
               
                  <div className={` lg:text-[1.5em] 2xl:text-[2.5em] text-end font-medium text-gray-600`}>{findBucket?.amount ? findBucket?.amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) : 8000}</div>
                </div>
                <div className={` lg:text-[0.8em] 2xl:text-[1em] text-end`} >
                  Today Collections
                </div>
              </div>
              <div className="flex justify-between">
                <p className="font-bold text-slate-500">
                  No. of FTE 
                </p>
                <p className="text-slate-500 font-bold">
                  {[...new Set(findBucket?.users)].length}
                </p>
              </div>
            </div>
          )
         })
        }

      </div>

    </div>
  )
}

export default DispositionSection
