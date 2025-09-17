import { useMutation, useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useSelector } from "react-redux"
import { Navigate, useLocation } from "react-router-dom"
import { RootState, useAppDispatch } from "../../redux/store"
import {  useCallback, useEffect, useRef, useState } from "react"
import { RiArrowDropDownFill } from "react-icons/ri";
import { setAgentRecordingPage, setServerError, setSuccess } from "../../redux/slices/authSlice"
import { FaDownload } from "react-icons/fa6";
import { CgSpinner } from "react-icons/cg";
import Pagination from "../../components/Pagination"
import Loading from "../Loading"
import { FaBoxArchive } from "react-icons/fa6";
import Wrapper from "../../components/Wrapper.tsx"
import Navbar from "../../components/Navbar.tsx"

const AGENT_RECORDING = gql`
  query getAgentDispositionRecords($agentID: ID, $limit: Int, $page: Int, $from: String, $to: String, $search: String, $dispotype: [String]) {
    getAgentDispositionRecords(agentID: $agentID, limit: $limit, page: $page, from: $from, to: $to, search:$search, dispotype: $dispotype ) {
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
        dialer
        recordings {
          name
          size
        }
      }
      total
      dispocodes
    }
  }
`

type Recording = {
  name: string
  size: number
}

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
  dialer: string,
  recordings : Recording[]
}

type Record = {
  dispositions: Diposition[]
  total: number
  dispocodes: string[]
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
  mutation findRecordings($_id: ID!, $name: String!) {
    findRecordings(_id: $_id, name: $name) {
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
  dispotype: string[]
}

const AgentRecordingView = () => {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const {limit, agentRecordingPage, userLogged} = useSelector((state:RootState) => state.auth)
  const [page, setPage] = useState<string>("1")

  const [dataSearch, setDataSearch] = useState<SearchRecordings>({
    search: "",
    from: "",
    to: "",
    dispotype: []
  })

  const [triggeredSearch, setTriggeredSearch] = useState<SearchRecordings>({
    search: "",
    from: "",
    to: "",
    dispotype: []
  })

  const searchPage = triggeredSearch.search ? 1 : agentRecordingPage

  const isAgentRecordings = location.pathname !== '/agent-recordings'

  const {data: recordings, loading:recordingsLoading, refetch} = useQuery<{getAgentDispositionRecords:Record}>(AGENT_RECORDING,{
    variables: {
      agentID: location.state, 
      limit: limit, 
      page:searchPage, 
      from: triggeredSearch.from, 
      to: triggeredSearch.to, 
      search: triggeredSearch.search, 
      dispotype: triggeredSearch.dispotype
    },
    notifyOnNetworkStatusChange: true,
    skip: isAgentRecordings
  })


  
  const [openRecordingsBox, setOpenRecordingsBox] = useState<string | null>(null)

  const {data: agentInfoData} = useQuery<{getUser:Agent}>(AGENT_INFO,{variables: {id: location.state}})

  const [isLoading, setIsLoading] = useState<string>('')
  
  const [totalPage, setTotalPage] = useState<number>(1)
  
  useEffect(()=> {
    setPage(agentRecordingPage.toString())
  },[agentRecordingPage])

  useEffect(()=> {
    if(triggeredSearch.search) {
      setPage("1")
      dispatch(setAgentRecordingPage(1))
    }
  },[triggeredSearch.search])

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
          dispatch(setSuccess({
            success: res.findRecordings.success,
            message: res.findRecordings.message,
            isMessage: false
          }))
          await deleteRecordings({ variables: { filename: link.download } });
        } catch (error) {
          dispatch(setServerError(true))
        }
      } else {
        dispatch(setSuccess({
          success: res.findRecordings.success,
          message: res.findRecordings.message,
          isMessage: false
        }))
      }
    },
    onError: () => {
      dispatch(setServerError(true))
    }
  })

  const onDLRecordings = useCallback(async(_id:string, name:string) => {
    setIsLoading(_id)
    await findRecordings({variables: {_id, name}})
  },[setIsLoading,findRecordings])


  const onClickSearch = useCallback(() => {
    setTriggeredSearch(dataSearch)
    setDataSearch(prev => ({...prev, dispotype: []}))
    setPage("1")
    dispatch(setAgentRecordingPage(1))
    refetch()
  },[setTriggeredSearch,refetch,dataSearch,setDataSearch ])

  const [selectingDispotype, setSelectingDispotype] = useState<boolean>(false)
  const dispotypeRef = useRef<HTMLDivElement | null>(null)
  const recordingsRef = useRef<HTMLDivElement | null>(null)


  const handleOnCheck = useCallback((e:React.ChangeEvent<HTMLInputElement>, value:string)=> {
    if(e.target.checked) {
      setDataSearch(prev => ({...prev, dispotype:[...prev.dispotype, value]}))
    } else {
      setDataSearch(prev => ({...prev, dispotype: prev.dispotype.filter(y=> y !== value)}))
    }
  },[setDataSearch])

  function fileSizeToDuration(fileSizeBytes:number) {
    const bytesPerSecond = (16 * 1000) / 8;
    const seconds = Math.floor(fileSizeBytes / bytesPerSecond);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }


  if(recordingsLoading) return <Loading/>
 
  return ["QA","TL",'MIS'].includes(userLogged?.type || "")  ? (
    <Wrapper>
      <Navbar/>
      <div className="w-full h-full flex flex-col overflow-hidden p-2" onMouseDown={(e)=> {
        if(!dispotypeRef.current?.contains(e.target as Node)) {
          setSelectingDispotype(false)
        }
        if(!recordingsRef.current?.contains(e.target as Node)) {
          setOpenRecordingsBox(null)
        }
      }}>
        <h1 className="capitalize text-2xl font-bold text-gray-500 mb-5">{agentInfoData?.getUser?.name}</h1>
        <div className=" flex justify-end px-10 gap-5">
          <div className="w-60 h-8 relative" ref={dispotypeRef} >
            <div className="w-full rounded border-slate-300 border flex items-center px-2 h-full justify-between" onClick={()=> {setSelectingDispotype(!selectingDispotype)}}>
              {
                triggeredSearch.dispotype.length > 0 ? <p className="text-xs text-gray-500 cursor-default select-none">{triggeredSearch.dispotype.join(', ')}</p> :
                <>
                  <p className="text-xs text-gray-500 cursor-default select-none truncate" title={dataSearch.dispotype.join(', ')}>{dataSearch.dispotype.length > 0 ? dataSearch.dispotype.join(', ') : "Filter Disposition type"}</p>
                  <RiArrowDropDownFill className="text-2xl"/>
                </>
                }
            </div>
            {
              selectingDispotype && triggeredSearch.dispotype.length === 0 &&
              <div className="absolute top-8 left-0 w-full border px-2 py-1 text-xs text-gray-500 flex flex-col max-h-80 overflow-y-auto bg-white z-50 border-slate-300 shadow-md shadow-black/20 select-none">
              {
                recordings?.getAgentDispositionRecords.dispocodes.map((e, index)=> 
                  <label key={index} className="py-1 flex gap-1 items-center">
                    <input type="checkbox" 
                      name={e} 
                      id={e} 
                      value={e}
                      checked={dataSearch.dispotype.includes(e)}
                      onChange={(e)=> handleOnCheck(e,e.target.value)}
                    />
                    <span>{e}</span>
                  </label>
                )
              }
              </div>
            }
          </div>

          <input type="search"
            name="search" 
            id="search" 
            autoComplete="off"
            value={dataSearch.search}
            placeholder="Search . . ."
            onChange={(e)=> setDataSearch({...dataSearch,search:  e.target.value})}
            className="border rounded border-slate-300 px-2 text-sm w-50 py-1 outline-none"
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
        <div className="h-full overflow-auto w-full px-10 mt-3">
          <table className="w-full table-fixed">
            <thead className="lg:text-sm 2xl:text-lg sticky top-0 z-20 bg-blue-100 text-gray-600">
              <tr className="text-left">
                <th className="pl-5 py-1.5 col-span-2 w-55">Name</th>
                <th >Contact No</th>
                <th >Dialer</th>
                <th>Amount</th>
                <th className="text-nowrap">Payment Date</th>
                <th>Ref No.</th>
                <th>Comment</th>
                <th className="text-nowrap">Dispo Date</th>
                <th>Disposition</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {
                recordings?.getAgentDispositionRecords.dispositions.map(e=> {
                  const callRecord  = [...e.recordings].sort((a,b) => b.size - a.size)
                  


                  return (
                    <tr key={e._id} className="lg:text-xs 2xl:text-sm cursor-default even:bg-slate-100">
                      <td  className="pl-5 py-1.5 w-55 truncate">{e.customer_name}</td>
                      <td className="truncate pr-2" title={e.contact_no.join(', ')}>{e.contact_no.join(', ')}</td>
                      <td>{e.dialer}</td>
                      <td>{e.amount ? e.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) : "-"}</td>
                      <td>{e.payment_date ? new Date(e.payment_date).toLocaleDateString() : "-"}</td>
                      <td title={e.ref_no}>{e.ref_no || "-"}</td>
                      <td className="truncate" title={e.comment}>{e.comment || "-"}</td>
                      <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                      <td>{e.dispotype}</td>
                      <td>
                      {
                        (isLoading === e._id && loading) ?
                        <div className="cursor-progress">
                          <CgSpinner className="text-xl animate-spin"/>
                        </div> 
                          : 
                        <div className="">
                          {
                            e.recordings.length > 0 ? 
                            <div className="relative flex gap-5" >
                                <div title={callRecord[0]?.name} className="flex gap-2" onClick={()=> onDLRecordings(e._id, callRecord[0]?.name)}>
                                  <p className="mr-">{fileSizeToDuration(callRecord[0].size)} </p>
                                  <FaDownload />
                                </div>
                                {
                                  callRecord?.length > 1 &&
                                  (()=> {
                                    const others = callRecord.slice(1)
                                    return (
                                      <div>
                                        <FaBoxArchive className="text-lg text-fuchsia-700 peer cursor-pointer" title="Others" onClick={()=> {
                                          if(openRecordingsBox === e._id) {
                                            setOpenRecordingsBox(null)
                                          } else {
                                            setOpenRecordingsBox(e._id)
                                          }
                                        }}/>
                                        {openRecordingsBox === e._id &&
                                          <div className="absolute border border-slate-500 text-gray-700 right-full w-auto mr-2 shadow shadow-black/40 bg-white" ref={recordingsRef}>
                                            {
                                              others.map((o,index) => 
                                                <div key={index} onClick={()=> onDLRecordings(e._id, o.name)} className="text-nowrap flex p-2 bg-white rouned items-center cursor-pointer gap-2">
                                                  <p className="mr-">{fileSizeToDuration(o.size)} </p>
                                                  <div>{o.name}</div>  
                                                  <FaDownload />
                                                </div>
                                              )
                                            }
                                          </div>
                                        }
                                      </div>
                                    )
                                    
                                  })()
                                }
                            </div>
                            :
                            "No Recordings"
                          }
      
                        </div> 
                      }
                      </td>
                    </tr>
                  )
                }

                )
              }
            </tbody>
          </table>
        </div>
        <div className="text-end">
          <Pagination value={page} onChangeValue={(e) => setPage(e)} onKeyDownValue={(e)=> dispatch(setAgentRecordingPage(e))} totalPage={totalPage} currentPage={agentRecordingPage}/>
        </div>
      </div>
    </Wrapper>
  ) : (
    <Navigate to="/"/>
  )
}

export default AgentRecordingView
