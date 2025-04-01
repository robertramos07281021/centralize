import { ReactNode } from "react";

interface WrapperProps {
  children: ReactNode;
}

const Wrapper:React.FC<WrapperProps> = ({children}) => {
  return (
    <div className="w-full min-h-screen flex flex-col">
      {children}     
    </div>
  )
}

export default Wrapper
