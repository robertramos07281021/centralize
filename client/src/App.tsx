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
import AgentDashboard from "./pages/agent/AgentDashboard"
import AomDashboard from "./pages/aom/AomDashboard"
import CeoDashboard from "./pages/ceo/CeoDashboard"
import TlDashboard from "./pages/tl/TlDashboard"
import OperationDashboard from "./pages/operation/OperationDashboard"
import AccountsView from "./pages/admin/AccountsView"
import RegisterView from "./pages/admin/RegisterView"
import SetupView from "./pages/admin/SetupView"
import UserView from "./pages/admin/UserView"

import CustomerDisposition from "./pages/CustomerDisposition"
import TaskView from "./pages/agent/TaskView"
import StatisticsView from "./pages/agent/StatisticsView"
import BacklogManagementView from "./pages/tl/BacklogManagementView"
import TaskManagerView from "./pages/tl/TaskManagerView"

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
        </Route>
        <Route element={<AgentRoute/>}>
          <Route path="/agent-dashboard" element={<AgentDashboard/>}/>
          {/* <Route path="/agent-production-area" element={<Disposition/>}/> */}
          <Route path="/agent-production-area" element={<CustomerDisposition/>}/>
          <Route path="/agent-tasks" element={<TaskView/>}/>
          <Route path="/agent-statistics" element={<StatisticsView/>}/>

        </Route>
        <Route element={<AomRoute/>}>
          <Route path="/aom-dashboard" element={<AomDashboard/>}/>

        </Route>
        <Route element={<OpsRoute/>}>
          <Route path="/operation-dashboard" element={<OperationDashboard/>}/>

        </Route>
        <Route element={<TlRoute/>}>
          <Route path="/tl-dashboard" element={<TlDashboard/>}/>
          <Route path="/tl-task-manager" element={<TaskManagerView/>}/>
          <Route path="/tl-production-area" element={<CustomerDisposition/>}/>
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
