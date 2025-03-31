import BranchSection from "../../components/BranchSection"
import BucketSection from "../../components/BucketSection"
import DepartmentSection from "../../components/DepartmentSection"


const SetupView = () => {

  return (
    <div className="w-full p-5">
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
