import PaidProd from "./PaidProd"
import PTPBarProd from "./PTPBarProd"
import PTPKeptProd from "./PTPKeptProd"


const ProductionToday = () => {
  return (
    <div className='row-span-6 col-span-3 grid grid-rows-3 gap-2'>
      <PTPBarProd/>
      <PTPKeptProd/>
      <PaidProd/>
    </div>
  )
}

export default ProductionToday