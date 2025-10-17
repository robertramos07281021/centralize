const Loading = () => {
  return (
    <div className="w-screen h-screen flex items-center absolute top-0 left-0 justify-center bg-white z-50">
      <div className="flex flex-col relative justify-center items-center ">
        <div className="border-t-2 rounded-full z-20 w-20 h-20 border-gray-800 animate-spin "></div>
        <div className="border-2 absolute top-0 left-0 rounded-full z-10 w-20 h-20 border-gray-200 "></div>
        <div className="absolute  z-10 text-xs text-gray-400">Loading...</div>
      </div>
    </div>
  );
};

export default Loading;
