import { useState } from "react"


const AgentView = () => {
  const [search,setSearch] = useState<string>("")


  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-2">
      <h1 className="p-2 text-xl font-medium text-gray-500">Agent Production</h1>
      <div className="flex justify-center">
        <input 
          type="search" 
          name="search" 
          id="search" 
          value={search}
          onChange={(e)=> setSearch(e.target.value)}
          className="border px-2 rounded-md text-gray-500 py-1.5 w-1/5 text-sm"
          placeholder="Search here..." 
          autoComplete="off"/>
      </div>
      <div className="mt-2">
        asdasd
      </div>
      <div className="border h-full overflow-y-auto mt-2">
        
      </div>


    </div>
  )
}

export default AgentView