import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useSelector } from "react-redux"
import { RootState } from "../../redux/store"
import { useEffect, useState } from "react"


interface DispoData {
  id: string
  code: string
  name: string
  count: string
}

interface BucketDisposition {
  bucket: string
  dispositions: [DispoData]
} 

interface Bucket {
  name: string
  dept: string
  id: string
}

const GET_DISPOSITION_TYPES = gql`
  query Query {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

const BUCKET_DISPOSITIONS = gql`
  query Query($dept: String!) {
    getBucketDisposition(dept: $dept) {
      bucket
      dispositions {
        code
        name
        count
      }
    }
  }
`

const DEPT_BUCKET_QUERY = gql`
  query Query($dept: String) {
    getDeptBucket(dept: $dept) {
      id
      name
      dept
    }
  }
`



const DispositionSection = () => {
  const {userLogged} = useSelector((state:RootState)=>state.auth)
  const {data:bucketDispoData} = useQuery<{getBucketDisposition:BucketDisposition[]}>(BUCKET_DISPOSITIONS,{variables: {dept: userLogged.department}})

  const {data:deptBucket} = useQuery<{getDeptBucket:Bucket[]}>(DEPT_BUCKET_QUERY,{variables: {dept: userLogged.department}})


  const [existsDispo, setExistsDispo] = useState<string[]>([])

  useEffect(()=> {
    const newArray = bucketDispoData?.getBucketDisposition.map((bd) => bd.dispositions.map((d)=> d.code) )
    const flatArray = newArray?.flat()
    setExistsDispo([...new Set(flatArray)])

  },[bucketDispoData])

  const {data:disposition} = useQuery<{getDispositionTypes:DispoData[]}>(GET_DISPOSITION_TYPES)


  return (
    <div className=" row-span-3 col-span-4 flex flex-col border border-slate-300 rounded-lg overflow-y-auto bg-white px-2">
      <table className='w-full border-collapse'>
        <thead className='sticky top-0 bg-white'>
          <tr className='text-slate-500'>
            <th className='w-auto 2xl:text-sm lg:text-[0.7rem] p-2'>BUCKET</th>
            {
              disposition?.getDispositionTypes.map((dt) => {
                return  existsDispo.includes(dt.code) &&(
                  <th key={dt.id} className="2xl:text-xs lg:text-[0.6rem] font-medium ">
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
            return (
            <tr key={db.id} className='odd:bg-gray-100 even:bg-white text-center text-sm text-slate-500 '>
              <th className="py-1.5 w-24 font-medium 2xl:text-sm lg:text-xs">{db.name}</th>
              {
                disposition?.getDispositionTypes.map((dispo)=> {
                  const found = matchBucket?.dispositions.find((d)=> d.code === dispo.code);
                  return  existsDispo.includes(dispo.code) && (
                    <td key={dispo.code} className="2xl:text-xs lg:text-[0.6rem]">
                      {found && found.count}
                    </td>
                  )
                } )
              }
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  )
}

export default DispositionSection
