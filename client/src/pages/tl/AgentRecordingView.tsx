import { useMutation, useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { RootState, useAppDispatch } from "../../redux/store"
import { useEffect, useState } from "react"
import { setAgentRecordingPage, setServerError, setSuccess } from "../../redux/slices/authSlice"
import { FaDownload } from "react-icons/fa6";
import { CgSpinner } from "react-icons/cg";
import Pagination from "../../components/Pagination"
import Loading from "../Loading"

const AGENT_RECORDING = gql`
  query getAgentDispositionRecords($agentID: ID, $limit: Int, $page: Int, $from: String, $to: String, $search: String) {
    getAgentDispositionRecords(agentID: $agentID, limit: $limit, page: $page, from: $from, to: $to, search:$search ) {
      dispositions {
        _id
        customer_name
        payment
        amount
        dispotype
        payment_date
        ref_no
        comment
        contact_no
        createdAt
      }
      total
    }
  }
`

type Diposition = {
  _id: string
  customer_name: string
  payment: string
  amount: number
  dispotype: string
  payment_date: string
  ref_no: string
  comment: string
  contact_no: string[]
  createdAt: string
}

type Record = {
  dispositions: Diposition[]
  total: number
}

const AGENT_INFO = gql`
  query GetUser($id: ID) {
    getUser(id: $id) {
      name
      user_id
    }
  }
`
type Agent = {
  name: string
  user_id: string
}


const DL_RECORDINGS = gql`
  mutation findRecordings($id: ID) {
    findRecordings(id: $id) {
      success
      message
      url
    }
  }
`

const DELETE_RECORDING = gql`
  mutation deleteRecordings($filename: String) {
    deleteRecordings(filename: $filename) {
      message
      success
    }
  }
`

type Success = {
  success: boolean
  message: string,
  url: string
}

type SearchRecordings = {
  from: string
  to: string
  search: string
}

const AgentRecordingView = () => {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const {limit, agentRecordingPage} = useSelector((state:RootState) => state.auth)
  const [page, setPage] = useState<string>("1")

  const [dataSearch, setDataSearch] = useState<SearchRecordings>({
    search: "",
    from: "",
    to: ""
  })

  const [triggeredSearch, setTriggeredSearch] = useState<SearchRecordings>({
    search: "",
    from: "",
    to: ""
  })

  const {data: recordings, loading:recordingsLoading, refetch} = useQuery<{getAgentDispositionRecords:Record}>(AGENT_RECORDING,{variables: {
    agentID: location.state, limit: limit, page:parseInt(page), from: triggeredSearch.from, to: triggeredSearch.to, search: triggeredSearch.search
  }})

  const {data: agentInfoData} = useQuery<{getUser:Agent}>(AGENT_INFO,{variables: {id: location.state}})

  const [isLoading, setIsLoading] = useState<string>('')
  
  const [totalPage, setTotalPage] = useState<number>(1)
  
  useEffect(()=> {
    setPage(agentRecordingPage.toString())
  },[agentRecordingPage])

  useEffect(()=> {
    dispatch(setAgentRecordingPage(1))
  },[location.pathname])

  useEffect(()=> {
    if(recordings) {
      const totalPage = Math.ceil(recordings?.getAgentDispositionRecords?.total/limit)
      setTotalPage(totalPage)
    }
  },[recordings])

  const [deleteRecordings] = useMutation(DELETE_RECORDING,{
    onError:()=> {
      dispatch(setServerError(true))
    }
  })

  const [findRecordings,{loading}] = useMutation<{findRecordings:Success}>(DL_RECORDINGS,{
    onCompleted: async(res)=> {
      dispatch(setSuccess({
        success: res.findRecordings.success,
        message: res.findRecordings.message
      }))
      const url = res.findRecordings.url
      setIsLoading('')
      if(url) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch file');
          const blob = await response.blob();
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = url.split('/').pop()  || "recording.mp3";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          await deleteRecordings({ variables: { filename: link.download } });
        } catch (error) {
          console.log(error)
        }
      }
    },
    onError: (error) => {
      console.log(error)
      // dispatch(setServerError(true))
    }
  })

  const onDLRecordings = async(id:string) => {
    setIsLoading(id)
    await findRecordings({variables: {id}})
  }

  const onClickSearch = () => {
    setTriggeredSearch(dataSearch)
    refetch()
  }


  if(recordingsLoading) return <Loading/>
 
  return (
    <div className="w-full h-full flex flex-col overflow-hidden p-2">

      <h1 className="capitalize text-2xl font-bold text-gray-500 mb-5">{agentInfoData?.getUser?.name}</h1>
      <div className=" flex justify-end px-10 gap-5">

        <input type="search"
          name="search" 
          id="search" 
          value={dataSearch.search}
          onChange={(e)=> setDataSearch({...dataSearch,search:  e.target.value})}
          className="border rounded border-slate-300 px-2 text-sm w-50 py-1"
        />
        <label>
        <span className="text-gray-600 font-medium text-sm">From: </span>
          <input 
            type="date" 
            name="from" 
            id="from" 
            value={dataSearch.from}
            onChange={(e) => setDataSearch({...dataSearch, from: e.target.value})}
            className="border rounded border-slate-300 px-2 text-sm w-50 py-1" 
          />     

        </label>
        <label >
          <span className="text-gray-600 font-medium text-sm">To: </span>
          <input 
            type="date" 
            name="to"
            id="to"
            value={dataSearch.to}
            onChange={(e) => setDataSearch({...dataSearch, to: e.target.value})}
            className="border rounded border-slate-300 px-2 text-sm w-50 py-1" 
          />           
      
        </label>      
        <button 
          className="bg-blue-500 text-white font-bold  rounded px-5 text-xs hover:bg-blue-800"
          onClick={onClickSearch}
          >Search</button>
      </div>
      <div className="h-full overflow-hidden w-full px-10 pt-3">

        <div className="grid grid-cols-11 2xl:text-base lg:text-sm text-gray-600 font-medium bg-slate-100 py-1">
          <div className="pl-5 col-span-2">Name</div>
          <div className="col-span-2">Contact No</div>
          <div>Amount</div>
          <div>Payment Date</div>
          <div>Referrence No.</div>
          <div>Comment</div>
          <div>Disposition Date</div>
          <div>Disposition</div>
          <div>Action</div>
        </div>
        <div className="flex flex-col h-full overflow-y-auto">
          {
            recordings?.getAgentDispositionRecords.dispositions.map(e=> {
              return (
                <div key={e._id} className="grid grid-cols-11 lg:text-[0.6em] 2xl:text-xs py-1 items-center text-gray-600 even:bg-slate-50 hover:bg-blue-50">
                  <div className="pl-2 text-wrap truncate cursor-default col-span-2">{e.customer_name}</div>
                  <div className="cursor-default truncate text-nowrap col-span-2">{e.contact_no.join(', ')}</div>
                  <div className="cursor-default">{e.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</div>
                  <div className="cursor-default">{e.payment_date ? new Date(e.payment_date).toLocaleDateString() : "-"}</div>
                  <div className="relative">
                    <p className="truncate peer cursor-default">
                      {e.ref_no || "-"}
                    </p>
                    {
                      e.ref_no.length > 0 &&
                      <p className="hidden peer-hover:block border-slate-500 shadow shadow-black/80 absolute bg-white w-60 text-center min-h-20 border p-2 font-medium text-gray-800 z-50">{e.ref_no}
                      </p>
                    }
                  </div>
                  <div className="relative">
                    <p className="peer truncate cursor-default pr-2">
                      {e.comment || "-"}
                    </p>
                    {
                      e.comment.length > 0 &&
                      <p className="hidden peer-hover:block border-slate-500 shadow shadow-black/80 absolute bg-white w-60 text-center min-h-20 border p-2 font-medium text-gray-800 z-50">{e.comment}
                      </p>
                    }
                  </div>
                  <div>{new Date(e.createdAt).toLocaleDateString()}</div>
                  <div>{e.dispotype}</div>
                  {
                    (isLoading === e._id && loading) ?
                    <div className="cursor-progress">
                      <CgSpinner className="text-xl animate-spin"/>
                    </div> 
                      : 
                    <div onClick={()=> onDLRecordings(e._id)} className="cursor-pointer relative">
                      <FaDownload className="text-lg text-fuchsia-700 peer"/>
                      <div className="absolute text-nowrap bg-white z-50 left-5 top-0 ml-2 peer-hover:block hidden border px-1">Download Recordings</div>
                      
                    </div> 
                  }
      
                </div>
              ) 
            })
          }
        </div>
      </div>
      <div className="text-end">
        <Pagination value={page} onChangeValue={(e) => setPage(e)} onKeyDownValue={(e)=> dispatch(setAgentRecordingPage(e))} totalPage={totalPage} currentPage={agentRecordingPage}/>
      </div>
    </div>
 
  )
}

export default AgentRecordingView