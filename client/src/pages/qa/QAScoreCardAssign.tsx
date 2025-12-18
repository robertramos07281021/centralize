import DefaultScoreCard from "../../components/ScoreCard";
import UBMortgageScoreCard from "../../components/UBMortgageScoreCard";
import UBScoreCard from "../../components/UBScoreCard";
import EastwestScoreCard from "../../components/EastwestScoreCard";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const QAScoreCardAssign = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);

  const resolvedScoreCardType = (userLogged?.scoreCardType ?? "Default Score Card").trim();
  const normalizedScoreCardType = resolvedScoreCardType.toLowerCase();

  const renderScoreCard = () => {
    switch (normalizedScoreCardType) {
      case "UB MORTGAGE":
        return <UBMortgageScoreCard />;
      case "ub cards score card":
        return <UBScoreCard />;
      case "eastwest score card":
        return <EastwestScoreCard />;
      default:
        return <DefaultScoreCard scoreCardType={resolvedScoreCardType} />;
    }
  };

  return (
    <div className="h-full flex flex-col ">
      <div className="flex-1 min-h-0">{renderScoreCard()}</div>
    </div>
  );
};

export default QAScoreCardAssign;
