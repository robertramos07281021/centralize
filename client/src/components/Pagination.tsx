import { FaChevronRight, FaChevronLeft  } from "react-icons/fa";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../redux/store";
import { setPage } from "../redux/slices/authSlice";

interface PaginationProps {
  totalCustomers: number
}


const Pagination:React.FC<PaginationProps> = ({totalCustomers}) => {
  const {page} = useSelector((state:RootState)=> state.auth)
  const dispatch = useAppDispatch()
  const totalPages = Math.ceil(totalCustomers/20)
  
  const previous = () => {
    if(page > 1) {
      dispatch(setPage(page - 1))
    }
  }  

  const next = () => {
    if(page < totalPages) {
      dispatch(setPage(page + 1))
    }
  }  

  const handleOnclick = (number:number) => {
    dispatch(setPage(number))
  }

  return (
    <nav>
      <ul className="flex items-center -space-x-px h-10 text-base">
        <li onClick={previous}>
          <p className="flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer">
            <FaChevronLeft />
          </p>
        </li>
        {
           page <= totalPages && page == totalPages && page - 4 !== 0 &&
          <li onClick={()=>handleOnclick(page - 4)}>
            <p className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer">{page - 4}</p>
          </li>
        }
        {
          page <= totalPages && page >= totalPages - 1 && page - 3 !== 0 && 
          <li onClick={()=>handleOnclick(page - 3)}>
            <p className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer">{page - 3}</p>
          </li>
        }
        {
          (page - 2) > 0 &&
          <li onClick={()=>handleOnclick(page - 2)}>
            <p className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer">{page - 2}</p>
          </li>
        }
        {
          (page - 1) > 0 &&
          <li onClick={()=>handleOnclick(page - 1)}>
            <p className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer">{page - 1}</p>
          </li>
        }

        <li onClick={()=>handleOnclick(page)}>
          <p className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-blue-200 border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer ">{page}</p>
        </li>
        {
          page <= totalPages && page < totalPages &&
        <li onClick={()=>handleOnclick(page + 1)}>
          <p className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer">{page + 1}</p>
        </li>
        }
        {    
          page <= totalPages &&  page < totalPages - 1  &&
          <li onClick={()=>handleOnclick(page + 2)}>
            <p className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer">{page + 2}</p>
          </li>
        }
        {    
          page < 3 && page + 3 <= totalPages &&
          <li onClick={()=>handleOnclick(page + 3)}>
            <p className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer">{page + 3}</p>
          </li>
        }
        {    
          page < 2 && page + 4 <= totalPages &&
          <li onClick={()=>handleOnclick(page + 4)}>
            <p className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer">{page + 4}</p>
          </li>
        }
        <li onClick={next}>
          <p className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white cursor-pointer">
            <FaChevronRight/>
          </p>
        </li>
      </ul>
    </nav>
  )
}

export default Pagination