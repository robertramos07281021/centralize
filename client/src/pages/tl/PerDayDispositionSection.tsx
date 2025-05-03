import { useQuery, useSubscription } from '@apollo/client';
import gql from 'graphql-tag';
import { Bar } from 'react-chartjs-2';
import { date, month, options } from '../../middleware/exports';
import { Success } from '../../middleware/types';
import { useApolloClient } from '@apollo/client';

type PerDay = {
  day: string
  amount: string
}

type DispositionPerDay = {
  month: string
  dispositionsCount: PerDay[]
}

type PerMonth = {
  month: string
  amount: string
}

type DispositionPerMonth = {
  year: string
  dispositionsCount: PerMonth[]
}

const PER_DAY_DISPOSITION = gql`
  query getDispositionPerDay {
    getDispositionPerDay {
      dispositionsCount {
        day
        amount
      }
      month
    }
  }
`

const PER_MONTH_DISPOSITION = gql`
  query getDispositionPerMonth {
    getDispositionPerMonth {
      dispositionsCount {
        month
        amount
      }
      year
    }
  }

`
const SOMETHING_NEW_IN_TASK  = gql`
  subscription Subscription {
    somethingChanged {
      message
      success
    }
  }
`

const PerDayDispositionSection = () => {
  const client = useApolloClient()
  useSubscription<{somethingChange:Success}>(SOMETHING_NEW_IN_TASK, {
    onData: ({data}) => {
      if(data.data?.somethingChange?.message === "NEW_DISPOSITION") {
        client.refetchQueries({
          include: ['getDispositionPerMonth','getDispositionPerDay']
        })
      }
    }
  });

  const {data:perDayDispostiion} = useQuery<{getDispositionPerDay:DispositionPerDay}>(PER_DAY_DISPOSITION)
  const {data:perMonthDisposition } = useQuery<{getDispositionPerMonth:DispositionPerMonth}>(PER_MONTH_DISPOSITION)
  
  const todayMonth = new Date().getMonth()


  const dataPerMonth = {
    labels: month.map((element)=> {return element.slice(0,3)}),
    datasets: [
      {
        label: `${new Date().getFullYear()}`,
        data: (() => {
            const data = new Array(month.length).fill("")
            perMonthDisposition?.getDispositionPerMonth.dispositionsCount.forEach((e)=> {
              const monthIndex = parseInt(e.month) - 1
              if(monthIndex >= 0 && monthIndex < month.length) {
                data[monthIndex] = (parseFloat(e.amount).toFixed(2)).toString()
              }
            })
            return data
          }
        )(),
        backgroundColor: "rgba(255,0,22,.6)"
      },
    ]
  }

  const monthlyDate = (month:string) => {
    const days = [];
    for (let x = 1; x <= date[month as keyof typeof date]; x++) {
      days.push(x);
    }
    return days;
  };

  const dataPerDay = {
    labels: monthlyDate(month[todayMonth]),
    datasets: [
      {
        label: month[todayMonth],
        data: (() => {
          const data = new Array(date[month[todayMonth]]).fill("");
          perDayDispostiion?.getDispositionPerDay.dispositionsCount.forEach((e) => {
            const dayIndex = parseInt(e.day) - 1; 
            if (dayIndex >= 0 && dayIndex < date[month[todayMonth]]) {
              data[dayIndex] = e.amount === '0' ? "" : (parseFloat(e.amount).toFixed(2)).toString() ;
            }
          })
          return data
          }
        )(),
        backgroundColor: "rgba(255,0,22,.6)"
      },
    ]
  }



  return (
      <div className="row-start-4 row-span-3 col-span-4 grid grid-rows-2 gap-5 ">
      
        <div className=' bg-white rounded-md border border-slate-300 p-2'>
          <Bar options={options}
            data={dataPerDay}
          />
        </div>
        <div className='bg-white rounded-md border border-slate-300 p-2'>
        <Bar options={options}
            data={dataPerMonth}
          />
        </div>
      </div>
  )
}

export default PerDayDispositionSection
