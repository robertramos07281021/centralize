import { CiSearch } from "react-icons/ci";

const SearchCustomer = () => {
  return (
    <div className="w-full flex justify-center py-2 gap-5">
      <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
        <CiSearch />
        </div>
        <input 
          type="search" 
          id="default-search" 
          name="default-search"
          className="block w-96 p-3 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
          placeholder="Search . . ." 
          required />
      </div>
      <button type="button" className={` bg-blue-400 hover:bg-blue-500 focus:outline-none text-white  focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5  cursor-pointer`}>Submit</button>
    </div>
  )
}

export default SearchCustomer
