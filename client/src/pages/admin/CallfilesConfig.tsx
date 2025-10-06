import { useState } from "react"
import Pagination from "../../components/Pagination.tsx"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "../../redux/store.ts"
import { setCallfilesPages } from "../../redux/slices/authSlice.ts"


const CallfilesConfig = () => {
  const [page, setPage] = useState<string>('1')
  const [totalPage, setTotalPage] = useState<number>(1)
  const dispatch = useDispatch()
  const {callfilesPages} = useSelector((state:RootState) => state.auth)

  return (
    <div className=" h-full w-full flex flex-col">
      <div className="border h-full w-full">

      </div>
      <div className="py-1 px-2 ">
        <Pagination value={page} onChangeValue={(e) => setPage(e)} onKeyDownValue={(e)=> dispatch(setCallfilesPages(e))} totalPage={totalPage} currentPage={callfilesPages}/>
      </div>
    </div>
  )
}

export default CallfilesConfig