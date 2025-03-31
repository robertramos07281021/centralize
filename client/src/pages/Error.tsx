import { useNavigate } from "react-router-dom"


export const Error = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/")
  }

  return (
    <div className="w-screen h-screen bg-white flex items-center justify-center  gap-10 flex-col">
      <h1 className="text-8xl font-bold">Error 404. Not Found</h1>
      <button className="text-5xl font-bold bg-red-500 px-10 py-5 text-white border-4 border-red-500 hover:text-red-500 hover:bg-white duration-200 ease-in-out rounded-xl cursor-pointer" onClick={handleBack}>Back</button>
    </div>
  )
}
