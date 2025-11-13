
const AgentAttendanceLogs = () => {
  return (
    <div className="px-10 pt-2 pb-5 flex w-full h-full">
      <div className="w-full flex flex-col gap-2 h-full">
        <div>das</div>
        <div>
          <div className="grid grid-cols-8 gap-4 font-black uppercase rounded-t-md border px-4 bg-gray-300 py-2 roou">
            <div>No. Agent</div>
            <div>Agent</div>
            <div>Type</div>
            <div>Call Answered</div>
            <div>Duration</div>
            <div>Average</div>
            <div>Longest Call</div>
          </div>
          <div className="py-2 text-center font-black text-gray-400 italic border-x border-b rounded-b-md shadow-md border-black  bg-gray-200 overflow-y-auto">
            No agent found
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentAttendanceLogs;
