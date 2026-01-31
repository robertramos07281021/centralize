import CallLogsBase from "./CallLogsBase";

const CallAllAgentLogs = () => {
  return (
    <CallLogsBase
      bucketSource="all"
      paddingXClass="px-10"
      showViciIp
      allowBargeWhenSession
      bargeRefetchOnComplete
    />
  );
};

export default CallAllAgentLogs;
