

const SearchCustomer = () => {
  return (
    <div className="w-full flex justify-center py-2 gap-5 mt-10">
      <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
      <div className="flex gap-5">

        <input 
          type="search" 
          id="fullName" 
          name="fullName"
          className="block w-50 p-1 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:ring outline-0 focus:border-blue-500 " 
          placeholder="Enter Full Name" 
          required 
        />

        <input 
          type="search" 
          id="contact_no" 
          name="contact_no"
          className="block w-50 p-1 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500  focus:ring outline-0 focus:border-blue-500 " 
          placeholder="Enter Contact No." 
          required
        />

        <input 
          type="date" 
          id="dob" 
          name="dob"
          className="block w-50 p-1 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500  focus:ring outline-0 focus:border-blue-500 " 
          placeholder="Enter Full Name" 
          required 
        />

        <input 
          type="email" 
          id="email" 
          name="email"
          className="block w-50 p-1 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500  focus:ring outline-0 focus:border-blue-500 " 
          placeholder="Enter Email" 
          required 
        />

        
      </div>
      <button type="button" className={` bg-blue-400 hover:bg-blue-500 focus:outline-none text-white  focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5  cursor-pointer`}>Search</button>
    </div>
  )
}

export default SearchCustomer
