import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import { Error } from "./pages/Error";
import { AdminRoute } from "./routes/AdminRoute";
import ChangePassword from "./pages/ChangePassword";
import { AgentRoute } from "./routes/AgentRoute";
import AomRoute from "./routes/AomRoute";
import { OpsRoute } from "./routes/OpsRoute";
import { TlRoute } from "./routes/TlRoute";
import { CeoRoute } from "./routes/CeoRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CeoDashboard from "./pages/ceo/CeoDashboard";
import TlDashboard from "./pages/tl/TlDashboard";
import OperationDashboard from "./pages/operation/OperationDashboard";
import AccountsView from "./pages/admin/AccountsView";
import SetupView from "./pages/admin/SetupView";
import UserView from "./pages/admin/UserView";
import CustomerDisposition from "./pages/CustomerDisposition";
import StatisticsView from "./pages/agent/StatisticsView";
import BacklogManagementView from "./pages/tl/BacklogManagementView";
import TaskManagerView from "./pages/tl/TaskManagerView";
import Reports from "./pages/aom/Reports";
import AgentReport from "./pages/agent/AgentReport";
import ProductionManagerView from "./pages/tl/ProductionManagerView";
import BreakView from "./pages/agent/BreakView";
import AgentView from "./pages/tl/AgentView";
import AgentRecordingView from "./pages/tl/AgentRecordingView";
import DispositionConfigurationView from "./pages/admin/DispositionConfigurationView";

import {
  Chart,
  registerables,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import ChartDataLabels from "chartjs-plugin-datalabels";
import MISDashboard from "./pages/tl/MISDashboard";
import FTEUserView from "./pages/aom/FTEUserView";
import QARoute from "./routes/QARoute.tsx";
import QAAgentViews from "./pages/qa/QAAgentViews.tsx";
import QADashboard from "./pages/qa/QADashboard.tsx";
import CallfilesConfig from "./pages/admin/CallfilesConfig.tsx";
import QASVRoute from "./routes/QASVRoute.tsx";
import QASVSupervisor from "./pages/qasupervisor/QASVSupervisor.tsx";
import QASupervisorDashboard from "./pages/qasupervisor/QASupervisorDashboard.tsx";
import CallLogs from "./pages/tl/CallLogs.tsx";
import CallAllAgentLogs from "./pages/admin/CallAllAgentLogs.tsx";
import AgentAttendanceLogs from "./pages/admin/AgentAttendanceLogs.tsx";
import Selectives from "./pages/admin/Selectives.tsx";
import CallQALogs from "./pages/qa/QACallLogs.tsx";
import QAAgentReportLogs from "./components/QAAgentReportLogs.tsx";
import QACallfileReport from "./components/QACallfileReport.tsx";
import DefaultScoreCard from "./components/ScoreCard.tsx";
import UBScoreCard from "./components/UBScoreCard.tsx";
import EastwestScoreCard from "./components/EastwestScoreCard.tsx";
import QACallAllAgentLogs from "./pages/qa/QACallAllAgentLogs.tsx";
import QASVCallAllAgentLogs from "./pages/qasupervisor/QASVCallAllAgentLogs.tsx";
import UBMortgageScoreCard from "./components/UBMortgageScoreCard.tsx";
import Guidlines from "./components/Guidlines.tsx";
Chart.register(
  ...registerables,
  ChartDataLabels,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Error />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/agent-recordings" element={<AgentRecordingView />} />
        <Route path="/break-view" element={<BreakView />} />
        <Route element={<AdminRoute />}>
          <Route path="/selectives" element={<Selectives />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/setup" element={<SetupView />} />
          <Route path="/accounts" element={<AccountsView />} />
          <Route path="/user-account" element={<UserView />} />
          <Route path="/all-call-logs" element={<CallAllAgentLogs />} />
          <Route
            path="/agent-attendance-logs"
            element={<AgentAttendanceLogs />}
          />
          <Route
            path="/callfile-configurations"
            element={<CallfilesConfig />}
          />
          <Route
            path="/disposition-settings"
            element={<DispositionConfigurationView />}
          />
        </Route>
        <Route element={<AgentRoute />}>
          <Route path="/agent-dashboard" element={<StatisticsView />} />
          <Route path="/agent-cip" element={<CustomerDisposition />} />
          <Route path="/agent-report" element={<AgentReport />} />
        </Route>
        <Route element={<AomRoute />}>
          <Route path="/aom-dashboard" element={<TlDashboard />} />
          <Route path="/aom-reports" element={<Reports />} />
          <Route path="/aom-fte-user" element={<FTEUserView />} />
        </Route>
        <Route element={<OpsRoute />}>
          <Route path="/operation-dashboard" element={<OperationDashboard />} />
          <Route path="/operation-reports" element={<Reports />} />
        </Route>
        <Route element={<TlRoute />}>
          <Route path="/tl-dashboard" element={<TlDashboard />} />
          <Route path="/mis-dashboard" element={<MISDashboard />} />
          <Route
            path="/tl-production-manager"
            element={<ProductionManagerView />}
          />
          <Route path="/agent-production" element={<AgentView />} />
          <Route path="/tl-task-manager" element={<TaskManagerView />} />
          <Route path="/tl-cip" element={<CustomerDisposition />} />
          <Route path="/tl-reports" element={<BacklogManagementView />} />
          <Route path="/call-agents-logs" element={<CallLogs />} />
        </Route>
        <Route element={<CeoRoute />}>
          <Route path="/ceo-dashboard" element={<CeoDashboard />} />
        </Route>

        <Route element={<QARoute />}>
          <Route path="/qa-agents-dashboard" element={<QAAgentViews />} />
          <Route path="/qa-dashboard" element={<QADashboard />} />
          <Route path="/agent-call-logs" element={<CallQALogs />} />
          <Route path="/qa-agent-reports" element={<QAAgentReportLogs />} />
          <Route path="/qa-callfile-reports" element={<QACallfileReport />} />
          <Route
            path="/qa-call-all-agent-logs"
            element={<QACallAllAgentLogs />}
          />
          <Route
            path="/qa-agent-attendance"
            element={<AgentAttendanceLogs />}
          />
          <Route path="/score-card" element={<DefaultScoreCard />} />
        </Route>

        <Route element={<QASVRoute />}>
          <Route
            path="/qasv-call-all-agent-logs"
            element={<QASVCallAllAgentLogs />}
          />
          <Route 
            path="/qasv-agent-attendance"
            element={<AgentAttendanceLogs />}
          />
          <Route path="/qasv-agent-reports" element={<QAAgentReportLogs />} />
          <Route path="/qasv-accounts" element={<QASVSupervisor />} />
          <Route path="/qasv-dashboard" element={<QASupervisorDashboard />} />
          <Route path="/qasv-callfile-reports" element={<QACallfileReport />} />
          <Route path="/default-score-card" element={<DefaultScoreCard />} />
          <Route path="/eastwest-score-card" element={<EastwestScoreCard />} />
          <Route path="/ub-score-card" element={<UBScoreCard />} />
          <Route path="/ub-mortgage-score-card" element={<UBMortgageScoreCard />} />
          <Route path="/guidlines" element={<Guidlines />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
