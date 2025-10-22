import { ReactNode } from "react";

type WrapperProps = {
  children: ReactNode;
}

const Wrapper:React.FC<WrapperProps> = ({children}) => {
  return (
    <div className="w-screen h-screen flex flex-col relative overflow-hidden" >
      {children}     
    </div>
  )
}

export default Wrapper
