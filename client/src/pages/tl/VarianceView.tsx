
type DivitionType = {
  label: string
  value: number
  target: number
  color: keyof typeof colorsObject
}


const colorsObject:{[key:string]:string} = {
  purple: 'border-purple-500 text-purple-500 bg-purple-200',
  teal: 'border-teal-500 text-teal-500 bg-teal-200',
  yellow: 'border-yellow-500 text-yellow-500 bg-yellow-200'
}

const CollectionDiv = ({label, value, target, color}:DivitionType) => {

  const valuePercentage = (value / target) * 100
  const theVariance = target - value
  const variancePercentage = (theVariance / target) *100
  return (
    <div className={`rounded-xl border ${colorsObject[color]} p-2 shadow shadow-black/20 flex flex-col`}>
      <h1 className="text-xs lg:text-sm font-bold">
      {label}
      </h1>
      <div className="flex justify-between pt-2 items-center">
        <h1>C</h1>
        <h1 className="text-4xl">{valuePercentage}%</h1>
      </div>
      <h1 className="text-xs flex justify-end">V - {variancePercentage}%</h1>
      <div className="h-full flex flex-col justify-center">
        <div className="flex justify-between item-center">
          <h1 className="text-sm font-medium">Target</h1>
          <h1 className="text-sm">{target.toLocaleString('en-PH',{style: 'currency', currency: "PHP" })}</h1>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium">Collected</h1>
        <div className="flex">
            <h1 className="lg:text-sm">{value.toLocaleString('en-PH',{style: 'currency', currency: "PHP" })}</h1>
        </div>
        </div>
        <div className="flex justify-between item-center">
          <h1 className="text-sm font-medium">Variance</h1>
          <div className="flex items-center">
            <h1 className="text-sm">{theVariance.toLocaleString('en-PH',{style: 'currency', currency: "PHP" })}</h1>
          </div>
        </div>
      </div>
    </div>
  )
}

const VarianceView = () => {
  return (
    <div className='grid grid-rows-3 gap-y-2'>
      <CollectionDiv label="Daily" value={10000} target={50000} color='yellow'/>
      <CollectionDiv label="Weekly" value={10000} target={50000} color='teal'/>
      <CollectionDiv label="Monthly" value={10000} target={50000} color='purple'/>
    </div>
  )
}

export default VarianceView