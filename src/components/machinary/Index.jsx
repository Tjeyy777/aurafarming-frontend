// Route exports for machinery module
// Usage in your router:
//
// import { MachineryDashboard, MachineDetail, ServiceAlerts, MachineryReports } from './machinery';
//
// <Route path="/machinery"          element={<MachineryDashboard />} />
// <Route path="/machinery/alerts"   element={<ServiceAlerts />} />
// <Route path="/machinery/reports"  element={<MachineryReports />} />
// <Route path="/machinery/:id"      element={<MachineDetail />} />

export { default as MachineryDashboard } from './MachineryDashboard';
export { default as MachineDetail }      from './Machinedetail';
export { default as ServiceAlerts }      from './Servicealerts';
export { default as MachineryReports }   from './MachineryReports';