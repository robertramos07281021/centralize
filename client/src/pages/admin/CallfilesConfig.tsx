import { useEffect, useState } from "react"
import Pagination from "../../components/Pagination.tsx"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "../../redux/store.ts"
import { setCallfilesPages } from "../../redux/slices/authSlice.ts"
import gql from "graphql-tag"
import { useQuery } from "@apollo/client"


const Callifles = gql`
  query getCF($bucket: ID!, $limit: Int!, $page: Int!) {
    getCF(bucket: $bucket, limit: $limit, page: $page) {
      result {
        _id
        name
        totalPrincipal
        totalAccounts
        totalOB
        bucket
        createdAt
        active
        endo
        finished_by {
          _id
          name
        }
        target
      }
      total
    }
  }
`

type User = {
  _id: string
  name: string
}

type Callfile = {
  _id: string
  name: string
  totalPrincipal: number
  totalAccounts: number
  totalOB: number 
  bucket: string
  createdAt: string
  active: boolean
  endo: string
  finished_by: User
  target: number
}

type Results = {
  result: Callfile[],
  total: number
}

const ALL_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`


type Bucket ={
  _id: string
  name: string
}
const CallfilesConfig = () => {
  const [page, setPage] = useState<string>('1')
  const [totalPage, setTotalPage] = useState<number>(1)
  const dispatch = useDispatch()
  const {callfilesPages, limit} = useSelector((state:RootState) => state.auth)
  const [selectedBucket,setSelectedBucket] = useState<string | null>(null)
  console.log(callfilesPages)
  const {data, refetch} = useQuery<{getCF:Results}>(Callifles,{
    variables: { bucket: "685ccd9a88d8094e2dd39f7b", page: callfilesPages, limit: limit },
    // skip: !selectedBucket,
    notifyOnNetworkStatusChange: true
  })
  const {data:bucketsData, refetch:bucketRefetch} = useQuery<{getAllBucket:Bucket}>(ALL_BUCKET)

  useEffect(()=> {
    const refetching = async()=> {
      await refetch()
      await bucketRefetch()
    }
    refetching()
  },[])
  console.log(data)
  console.log(bucketsData)

  return (
    <div className=" h-full w-full flex flex-col py-1">
      <div className="border h-full w-full">

      </div>
      <div className="py-1 px-2 ">
        <Pagination value={page} onChangeValue={(e) => setPage(e)} onKeyDownValue={(e)=> dispatch(setCallfilesPages(e))} totalPage={totalPage} currentPage={callfilesPages}/>
      </div>
    </div>
  )
}

export default CallfilesConfig