import CallLogsBase from "../../components/CallLogsBase";

const QASVCallAllAgentLogs = () => {
  return (
    <CallLogsBase
      bucketSource="all"
      allowAllOption
      showViciIp
      paddingXClass="p-5"
      emptyAllMessage="Select a bucket to view agents"
    />
  );
};

export default QASVCallAllAgentLogs;
