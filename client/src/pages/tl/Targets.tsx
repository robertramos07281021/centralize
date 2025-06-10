import { useQuery } from "@apollo/client";
import { ChartOptions } from "chart.js";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2"

interface Target {
  bucket: string
  collected: number
  target:number
}

const TARGET_PER_BUCKET = gql`
  query GetTargetPerCampaign {
    getTargetPerCampaign {
      bucket
      collected
      target
    }
  }
`

interface Bucket {
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

const Targets = () => {
  const {data:targetsData} = useQuery<{getTargetPerCampaign:Target[]}>(TARGET_PER_BUCKET)

  const [bucketObject, setBucketObject]= useState<{[key:string]:string}>({})

  const {data:tlBucketData} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET)
  useEffect(()=> {
    if(tlBucketData) {
      const newObject:{[key: string]:string} = {}
      tlBucketData.getDeptBucket.map(e=> {
        newObject[e.id] = e.name
      })
      setBucketObject(newObject)
    }
  },[tlBucketData])

  const [width, setWidth] = useState<string>('w-1/1')
  const [height, setHeight] = useState<string>('h-1/1')

  useEffect(()=> {
    if(targetsData) {
      const length = targetsData.getTargetPerCampaign.length 
      setWidth(length < 4 ? 'w-full' : 'w-1/2');
      if(length == 1 ) {
        setHeight('100%')
      } else if(length < 2 ) {
        setHeight('50%')
      } else {
        setHeight('33.33%')
      }
    }
  },[targetsData])


  return (
    <div className='col-span-2 flex bg-white rounded-xl border-slate-400 border'>
      <div className="flex-wrap flex items-center w-full h-full justify-center">

        {
          targetsData?.getTargetPerCampaign.map((e,index) => {
            const curring = e.target - e.collected
            const data = {
              labels: ['Collected', 'Missing Target'],
              datasets: [
                {
                  label: 'Amount',
                  data: [e.collected,curring],
                  backgroundColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
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
                    size: 8,
                  } as const,
                  formatter: (value: number) => {
                    const percent = (value/e.target) * 100
                    
                    return (
                      percent.toFixed(2) + '%' 
                  )}
                },
                legend: {
                  position: 'bottom' as const,
                  display: false
                },
                title: {
                  display: true,
                   font: {
                    size: 10,
                    family: 'Arial',
                    weight: 'bold',
                  },
                  text: [bucketObject[e.bucket],`${e.collected.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})} / ${e.target.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}`],
                },
              },
              responsive: true,
              maintainAspectRatio: false,
            };

            return (
              <div key={index} style={{height:`${height}`}} className={`flex justify-center ${width} py-2 px-5`} >
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