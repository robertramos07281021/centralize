
import { Bar } from 'react-chartjs-2'


  const color = [
  "oklch(0.75 0.15 0)",     // Red
  "oklch(0.75 0.15 18)",     // Orange-red
  "oklch(0.75 0.15 36)",     // Orange
  "oklch(0.75 0.15 54)",     // Yellow-orange
  "oklch(0.75 0.15 72)",     // Yellow
  "oklch(0.75 0.15 90)",     // Yellow-green
  "oklch(0.75 0.15 108)",     // Lime green
  "oklch(0.75 0.15 126)",     // Green
  "oklch(0.75 0.15 144)",     // Emerald
  "oklch(0.75 0.15 162)",     // Cyan-green
  "oklch(0.75 0.15 180)",     // Cyan
  "oklch(0.75 0.15 198)",     // Aqua
  "oklch(0.75 0.15 216)",     // Sky Blue
  "oklch(0.75 0.15 234)",     // Blue
  "oklch(0.75 0.15 252)",     // Indigo
  "oklch(0.75 0.15 270)",     // Violet
  "oklch(0.75 0.15 288)",     // Purple
  "oklch(0.75 0.15 306)",     // Magenta
  "oklch(0.75 0.15 324)",     // Pink
  "oklch(0.75 0.15 342)", 
]



const PTPKept = () => {

  const labels = ['Shopee M2','Shopee M3','Shopee M4','Shopee M5','Shopee M7','Shopee M8','Shopee M9','Shopee M10','Shopee M11','Shopee M12','Shopee M13','Shopee M15','Shopee M16','Shopee M17','Shopee M18','Shopee M19','Shopee M20']

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Collection',
        data: Array.from({ length: labels.length }, () => Math.floor(Math.random() * 100) + 5),
        backgroundColor: color[0],
      },
    ],
  };


  const option = { 
    plugins: {
      datalabels:{
        display:false
      },
        legend: {
        display: false
      },
      title: {
        display: true,
        text: 'PTP Kept',
      },
    },
    responsive: true, 
    maintainAspectRatio: false
  }

  return (
    
    <>
      <Bar data={data} options={option}/>
    </>
  )
}

export default PTPKept