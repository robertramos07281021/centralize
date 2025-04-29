export const dateAndTime = (dateValue:string) => {
  const newDate = new Date(dateValue).toDateString()
  const formattedTime = new Date(dateValue).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }); 
  return `${newDate} - ${formattedTime}`
}