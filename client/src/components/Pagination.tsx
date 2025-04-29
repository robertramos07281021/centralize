import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../redux/store"
import { setPage } from "../redux/slices/authSlice"

interface modalProps {
  totalPage:number
}

const Pagination:React.FC<modalProps> = ({totalPage}) => {
  const {page,limit} = useSelector((state:RootState)=> state.auth)
  const dispatch = useAppDispatch()
  function getPagination(currentPage: number, totalPages: number): number[] {
    
    const maxPagesToShow = 5;
 

    let startPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);

    let endPage = startPage + maxPagesToShow - 1;
  
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }
  
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
  return (
    <div className="p-2 flex justify-center mt-5">
      <ul className="flex items-center -space-x-px h-8 text-sm">
        <li>
          <p className="cursor-pointer flex items-center justify-center px-3 h-8 ms-0 leading-tight text-gray-500 bg-white border me-0.5 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white" onClick={()=>dispatch(setPage(Math.max(page - 1, 1)))}>
            <span className="sr-only">Previous</span>
            <svg className="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4"/>
            </svg>
          </p>
        </li>
        
         {getPagination(page, Math.ceil(totalPage/limit)).map(p => (
          <li  
            key={p}
            onClick={() => dispatch(setPage(p))}
          >
            <p className={`${p === page ? "text-blue-600 border-blue-300 bg-blue-50 border border-e-1" : "text-slate-500 border-gray-300 border border-l-0"} cursor-pointer z-10 flex items-center justify-center px-3 h-8 leading-tight hover:border-blue-500 hover:border-l-1 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white`}>{p}</p>
          </li>
        ))}
        <li>
          <p className="cursor-pointer flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 ml-0.5 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white" 
          onClick={()=> dispatch(setPage(Math.min(page + 1, Math.ceil(totalPage/limit))))}>
            <span className="sr-only">Next</span>
            <svg className="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
            </svg>
          </p>
        </li>
      </ul>
    </div>
  )
}

export default Pagination