import { ReactNode } from "react";

type WrapperProps = {
  children: ReactNode;
}

const Wrapper:React.FC<WrapperProps> = ({children}) => {
  return (
    <div className="w-full h-screen flex flex-col relative" >
      {children}     
    </div>
  )
}

export default Wrapper
