import { BrowserRouter, Route, Routes } from "react-router-dom"
import  Login  from "./pages/Login"
import { Error } from "./pages/Error"
import { AdminRoute } from "./routes/AdminRoute"
import ChangePassword from "./pages/ChangePassword"
import { AgentRoute } from "./routes/AgentRoute"
import AomRoute from "./routes/AomRoute"
import { OpsRoute } from "./routes/OpsRoute"
import { TlRoute } from "./routes/TlRoute"
import { CeoRoute } from "./routes/CeoRoute"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AomDashboard from "./pages/aom/AomDashboard"
import CeoDashboard from "./pages/ceo/CeoDashboard"
import TlDashboard from "./pages/tl/TlDashboard"
import OperationDashboard from "./pages/operation/OperationDashboard"
import AccountsView from "./pages/admin/AccountsView"
import RegisterView from "./pages/admin/RegisterView"
import SetupView from "./pages/admin/SetupView"
import UserView from "./pages/admin/UserView"
import CustomerDisposition from "./pages/CustomerDisposition"
import StatisticsView from "./pages/agent/StatisticsView"
import BacklogManagementView from "./pages/tl/BacklogManagementView"
import TaskManagerView from "./pages/tl/TaskManagerView"
import Reports from "./pages/aom/Reports"
import AgentReport from "./pages/agent/AgentReport"
import ProductionManagerView from "./pages/tl/ProductionManagerView"
import BreakView from "./pages/agent/BreakView"
import AgentView from "./pages/tl/AgentView"
import AgentRecordingView from "./pages/tl/AgentRecordingView"
import DispositionConfigurationView from "./pages/admin/DispositionConfigurationView"


import { Chart,
  registerables, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend 
} from 'chart.js';

import ChartDataLabels from 'chartjs-plugin-datalabels';
import MISDashboard from "./pages/tl/MISDashboard"
import FTEUserView from "./pages/aom/FTEUserView"

Chart.register(...registerables,
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
        <Route path="/" element={<Login/>}/>
        <Route path="*" element={<Error/>}/>
        <Route path="/change-password" element={<ChangePassword/>}/>
    
        <Route element={<AdminRoute/>}>
          <Route path="/admin-dashboard" element={<AdminDashboard/>}/>
          <Route path="/setup" element={<SetupView/>}/>
          <Route path="/accounts" element={<AccountsView/>}/>
          <Route path="/register" element={<RegisterView/>}/>
          <Route path="/user-account" element={<UserView/>}/>
          <Route path="/disposition-settings" element={<DispositionConfigurationView/>}/>

        </Route>
        <Route element={<AgentRoute/>}>
          <Route path="/agent-dashboard" element={<StatisticsView/>}/>
          <Route path="/break-view" element={<BreakView/>}/>
          <Route path="/agent-cip" element={<CustomerDisposition/>}/>
          <Route path="/agent-report" element={<AgentReport/>}/>
        </Route>
        <Route element={<AomRoute/>}>
          <Route path="/aom-dashboard" element={<AomDashboard/>}/>
          <Route path="/aom-reports" element={<Reports/>} />
          <Route path="/aom-fte-user" element={<FTEUserView/>}/>
        </Route>
        <Route element={<OpsRoute/>}>
          <Route path="/operation-dashboard" element={<OperationDashboard/>}/>
          <Route path="/operation-reports" element={<Reports/>} />

        </Route>
        <Route element={<TlRoute/>}>
          <Route path="/tl-dashboard" element={<TlDashboard/>}/>
          <Route path="/mis-dashboard" element={<MISDashboard/>}/>
          <Route path="/tl-production-manager" element={<ProductionManagerView/>}/>
          <Route path="/agent-production" element={<AgentView/>}/>
          <Route path="/agent-recordings" element={<AgentRecordingView/>}/>
          <Route path="/tl-task-manager" element={<TaskManagerView/>}/>
          <Route path="/tl-cip" element={<CustomerDisposition/>}/>
          <Route path="/tl-reports" element={<BacklogManagementView/>}/>
        </Route>
        <Route element={<CeoRoute/>}>
          <Route path="/ceo-dashboard" element={<CeoDashboard/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App


