import { useQuery } from "@apollo/client";
import { ChartOptions } from "chart.js";
import gql from "graphql-tag";
import { useEffect, useMemo } from "react";
import { Doughnut } from "react-chartjs-2"
import { useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";
import { GoDotFill } from "react-icons/go";


type Target = {
  bucket: string
  collected: number
  totalPrincipal: number
  target:number
}

const TARGET_PER_BUCKET = gql`
  query GetTargetPerCampaign($id:ID) {
    getTargetPerCampaign(id:$id) {
      bucket
      collected
      totalPrincipal
      target
    }
  }
`

type Bucket = {
  id:string
  name: string
}

const TL_BUCKET = gql`
  query GetDeptBucket {
    getDeptBucket {
      id
      name
    }
  }
`

type ComponentProps = {
  bucket: string | null | undefined
}

const Targets:React.FC<ComponentProps> = ({bucket}) => {
  const {data:targetsData, refetch} = useQuery<{getTargetPerCampaign:Target[]}>(TARGET_PER_BUCKET,{variables: {id: bucket}})
  const {data:tlBucketData, refetch:deptBucketRefetch} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET)
  const dispatch = useAppDispatch()
  const selectedBucket = targetsData?.getTargetPerCampaign?.filter(x=> x.bucket === bucket)

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const tlBuckets = tlBucketData?.getDeptBucket || []
    return Object.fromEntries(tlBuckets.map(e=> [e.id, e.name]))
  },[tlBucketData])

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await refetch()
        await deptBucketRefetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })
    return () => clearTimeout(timer)
  },[deptBucketRefetch,refetch])

  return targetsData && (
    <div className='col-span-2 flex bg-white rounded-xl border-slate-400 border'>
      <div className="flex-wrap flex items-center w-full h-full justify-center">

        {
          selectedBucket?.map((e,index) => {
            const variance = e.target - e.collected  
            const callfileVariance = (e.collected/e.totalPrincipal) * 100
            const data = {
              labels: ['Collected', 'Target Variance','Endorsement Variance'],
              datasets: [
                {
                  label: 'Amount',
                  data: [e.collected,variance],
                  backgroundColor: [
                    'oklch(54.6% 0.245 262.881)',
                    'oklch(70.5% 0.213 47.604)',
                    'oklch(63.7% 0.237 25.331)',
                  ],
                  borderColor: [
                    'oklch(54.6% 0.245 262.881)',
                    'oklch(70.5% 0.213 47.604)',
                    'oklch(63.7% 0.237 25.331)',
                  ],
                  borderWidth: 1,
                },
              ],
            };

            const options:ChartOptions<'doughnut'> = {
              plugins: {
                datalabels: {
                  color: 'oklch(0 0 0)',
                  font: {
                    weight: "bold", 
                    size: 14,
                  } as const,
                  formatter: (value: number) => {
                    const percent = (value/e.target) * 100
                    return (
                      (isNaN(percent) || value < 1)  ?  "" : (percent.toFixed(2) + '%') 
                    )
                   }
                },
                legend: {
                  position: 'bottom' as const,
                  display: false
                },
                title: {
                  display: true,
                   font: {
                    size: 12,
                    family: 'Arial',
                    weight: 'bold',
                  },
                  text: [
                    `${bucketObject[e.bucket]}`,
                    `${e.collected.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})} / ${e.totalPrincipal.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) || e.collected.toLocaleString('en-PH',{style: 'currency',currency: 'PHP',})} - ${callfileVariance.toFixed(2)}%`,
                    `Target - ${e.target.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}    Variance - ${variance.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}`
                  ],
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const currentValue = context.raw as number;
                      const percentage = ((currentValue/e.totalPrincipal) * 100).toFixed(2);
                      return `Value: ${currentValue.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})} - ${percentage}%`;
                    }
                  }
                }
              },
              responsive: true,
              maintainAspectRatio: false,
            };

            return (
              <div key={index} className={`flex justify-center w-full h-full py-2 px-5 relative`} >
                <GoDotFill className={`absolute top-0 left-0 text-5xl ${isNaN(callfileVariance) ? "" : callfileVariance >= 50 ? "text-green-500" : "text-red-500"} `}/>
                <Doughnut data={data} options={options} />
              </div>
            )
          }) 
        }

      </div>
    </div>
  )
}

export default Targets