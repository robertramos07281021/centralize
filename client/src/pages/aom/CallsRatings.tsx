import { ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2"

const color = [
  "oklch(63.7% 0.237 25.331)",    
  "oklch(70.7% 0.165 254.624)",     
  "oklch(84.1% 0.238 128.85)",     
  "oklch(90.5% 0.182 98.111)",
  "oklch(79.2% 0.209 151.711)",
  "oklch(71.8% 0.202 349.761)"     
]

const CallsRatings = () => {
  const options:ChartOptions<'bar'> = {

    plugins: {
      title: {
        display: true,
        text: 'Monthly Summary',
      },
      datalabels: {
        color: '#000',       
        font: {
          size: 7,            
          weight: 'bold'       
        },
        formatter: (value: number) => {
          return value + `%`
        }
      },
      legend: {
        display: true,
        labels: {
          font: {
            size: 8,
            family: 'Arial',
            weight: 'bold',
          },
          boxWidth: 20,
          boxHeight: 8,
        },
        
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  const labels = ['Shopee M2', 'Shopee M3', 'Shopee M4'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Successful Rate',
        data: [8,9,12],
        backgroundColor: color[3],
        stack: 'Stack 1',
      },
      {
        label: 'Positive Rate',
        data: [15,15,24,],
        backgroundColor: color[1],
        stack: 'Stack 1',
      },

      {
        label: 'Unconnected Rate',
        data: [-60,-60,-60],
        backgroundColor: color[0],
        stack: 'Stack 2',
      },

    ],
  };

  return (
    <Bar options={options} data={data} />
  )
}

export default CallsRatings