interface User {
  name: string
  user_id: string
}

interface DispoReport {
  disposition: string
  users: User[]
  count: number
}

interface Buckets  { 
  bucket: string
  totalAmount: number
  dispositions: DispoReport[]
}

type HighDispositionReport = {
  dept: string
  buckets : Buckets[]
}


interface modalProps {
  reportHighData:HighDispositionReport[] 
}

const HighReports:React.FC<modalProps> = ({reportHighData}) => {
  console.log(reportHighData)
  return (
    <div className="w-10/12 h-full overflow-y-auto">HighReports</div>
  )
}

export default HighReports