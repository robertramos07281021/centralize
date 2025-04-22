import { FaPlusCircle } from "react-icons/fa";

const GroupSection = () => {
  return (
    <div className=" flex justify-end  gap-20 items-end">
    <div className="flex gap-5">
      <input 
        type="text" 
        name="name" 
        id="name" 
        className="border border-slate-300 rounded-md py-1.5 px-2 w-70 text-xs"
        placeholder="Enter Group Name..."/>
      <input 
        type="text" 
        name="discription" 
        id="discription"
        className="border border-slate-300 rounded-md py-1.5 px-2 w-96 text-xs"
        placeholder="Enter Group Description..."/>
      <button type="button" className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-xs px-5 h-10 me-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">Add Group</button>
    </div>
    <div className="flex items-center gap-5">
      <FaPlusCircle  className="text-3xl transition-transform "/>
      <label className="text-xs">

        <select id="group" name="group" className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
          <option value="">Select Group</option>
          <option>Canada</option>
          <option>France</option>
          <option>Germany</option>
        </select>

      </label>
    </div>
    
  </div>
  )
}

export default GroupSection