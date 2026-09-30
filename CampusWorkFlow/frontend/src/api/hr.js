import http, { asList, unwrap } from "./http.js";

export const hrApi = {
  employees: (department) =>
    unwrap(http.get("/hr/employees/", { params: department ? { department } : {} })).then(asList),
  createEmployee: (payload) => unwrap(http.post("/hr/employees/", payload)),
  updateEmployee: (id, payload) => unwrap(http.patch(`/hr/employees/${id}`, payload)),
  deactivateEmployee: (id) => unwrap(http.delete(`/hr/employees/${id}`)),

  leaveRequests: (status) =>
    unwrap(http.get("/hr/leave/requests", { params: status ? { status_filter: status } : {} })).then(asList),
  /** payload: { employee_id, leave_type, start_date, end_date, reason? } */
  createLeaveRequest: (payload) => unwrap(http.post("/hr/leave/requests", payload)),
  decideLeave: (id, approve) => unwrap(http.patch(`/hr/leave/requests/${id}`, { approve })),

  payslips: (employeeId) => unwrap(http.get(`/hr/payroll/${employeeId}`)).then(asList),
  generatePayslip: (employeeId, month, year) =>
    unwrap(http.post(`/hr/payroll/generate/${employeeId}`, null, { params: { month, year } })),

  attendance: (employeeId) => unwrap(http.get(`/hr/attendance/${employeeId}`)).then(asList),
  attendanceQr: (employeeId) => unwrap(http.get(`/hr/attendance/qr/${employeeId}`)),
};
