import React from "react";
import Badge from "../../components/Badge.jsx";

/**
 * Tableau des employés RH.
 * Props :
 *   employees    — fiches employés
 *   formatMoney  — formateur des montants (salaire)
 *   onEdit       — (employee) => void
 *   onDeactivate — (employee) => void
 */
export default function EmployeeTable({ employees = [], formatMoney = (value) => value, onEdit, onDeactivate }) {
  return (
    <div className="employee-table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Matricule</th>
            <th>Employé</th>
            <th>Département</th>
            <th>Poste</th>
            <th>Salaire</th>
            <th>Statut</th>
            <th className="employee-actions-heading">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id || employee.matricule} className="row-hover">
              <td><code className="code-tag">{employee.matricule}</code></td>
              <td>
                <strong>{employee.first_name} {employee.last_name}</strong>
                <br />
                <small className="muted">{employee.email}</small>
              </td>
              <td>{employee.department}</td>
              <td>{employee.position}</td>
              <td><strong>{formatMoney(employee.base_salary)}</strong></td>
              <td><Badge status={employee.is_active ? "Active" : "Inactive"} /></td>
              <td>
                <div className="employee-actions">
                  {onEdit && (
                    <button className="btn ghost sm" type="button" onClick={() => onEdit(employee)}>
                      Modifier
                    </button>
                  )}
                  {onDeactivate && employee.is_active && (
                    <button className="btn ghost sm" type="button" onClick={() => onDeactivate(employee)}>
                      Désactiver
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
