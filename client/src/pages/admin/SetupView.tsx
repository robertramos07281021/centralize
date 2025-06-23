import BranchSection from "./BranchSection"
import BucketSection from "./BucketSection"
import DepartmentSection from "./DepartmentSection"


const SetupView = () => {

  return (
    <div className="w-full flex flex-col h-full overflow-y-auto p-5">
      <div className="flex p-5">
        <h1 className="text-xl font-medium text-slate-500">Branch & Department</h1>
      </div>
      <BranchSection/>
      <DepartmentSection/>
      <BucketSection/>
    </div>
  )
}

export default SetupView
