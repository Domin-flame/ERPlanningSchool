# Diagramme de classes

Reflète les classes de domaine réellement définies dans le code
(`app/models.py` de chaque service), regroupées par contexte borné
(bounded context = microservice). Les attributs listés sont un sous-ensemble
représentatif ; le code source reste la référence exhaustive.

```mermaid
classDiagram
    %% ───────────── Auth ─────────────
    class UserAccount {
      +int id
      +string fullName
      +string email
      +string hashedPassword
      +Role role
      +bool isActive
    }
    class Role {
      <<enumeration>>
      academic
      professeur
      student
      rh
      finance
      marketing
    }
    UserAccount --> Role

    %% ───────────── Académique ─────────────
    class Faculty {
      +int facultyId
      +string name
      +string code
    }
    class Department {
      +int departmentId
      +string name
    }
    class Programs {
      +int programId
      +string name
      +string level
    }
    class ModuleUE {
      +int moduleId
      +string code
      +string title
      +int creditsEcts
    }
    class Course {
      +int courseId
      +string code
      +string title
      +int credits
    }
    class Teacher {
      +int teacherId
      +string employeeCode
      +string speciality
    }
    class Student {
      +int studentId
      +string matricule
      +date enrollmentDate
      +string status
    }
    class CourseOffering {
      +int courseOfferingId
      +string name
    }
    class Enrollment {
      +int enrollmentId
      +string status
      +date enrollmentDate
    }
    class AcademicYear {
      +int academicYearId
      +string yearLabel
    }
    class Semester {
      +int semesterId
      +string termName
      +bool isLocked
    }

    Faculty "1" --> "many" Department
    Department "1" --> "many" Programs
    Programs "1" --> "many" ModuleUE : via Group
    ModuleUE "1" --> "many" Course
    AcademicYear "1" --> "many" Semester
    Course "1" --> "many" CourseOffering
    Semester "1" --> "many" CourseOffering
    Teacher "1" --> "many" CourseOffering
    Student "1" --> "many" Enrollment
    CourseOffering "1" --> "many" Enrollment
    UserAccount <.. Student : lié par email
    UserAccount <.. Teacher : lié par email

    %% ───────────── Finance & Marketing ─────────────
    class StudentRef {
      +int idStudent
      +string matricule
      +string nomCompletCache
    }
    class Invoice {
      +int idInvoice
      +string numeroFacture
      +date dateEmission
      +date dateEcheance
      +decimal montantTotal
      +string statut
    }
    class InvoiceLine {
      +int idLine
      +string description
      +int quantite
      +decimal prixUnitaire
    }
    class Payment {
      +int idPayment
      +decimal montant
      +datetime datePaiement
      +string methode
      +string reference
      +string statut
    }
    class Campaign {
      +int idCampaign
      +string nom
      +string canal
      +decimal budget
    }
    class Lead {
      +int idLead
      +string nom
      +string contact
      +string statut
    }

    StudentRef "1" --> "many" Invoice
    Invoice "1" --> "many" InvoiceLine
    Invoice "1" --> "many" Payment
    Campaign "1" --> "many" Lead

    %% ───────────── RH ─────────────
    class Employee {
      +UUID id
      +string matricule
      +string firstName
      +string lastName
      +string email
      +decimal baseSalary
      +bool isActive
    }
    class LeaveBalance {
      +UUID id
      +LeaveType leaveType
      +int year
      +int daysAllocated
      +int daysUsed
    }
    class LeaveRequest {
      +UUID id
      +date startDate
      +date endDate
      +LeaveStatus status
    }
    class Payslip {
      +UUID id
      +int periodMonth
      +int periodYear
      +decimal netSalary
      +decimal irpp
      +decimal cnpsEmployee
    }

    Employee "1" --> "many" LeaveBalance
    Employee "1" --> "many" LeaveRequest
    Employee "1" --> "many" Payslip
    UserAccount <.. Employee : lié par authUserId
```

## Notes de lecture
- Les liens en pointillés (`<..`) entre `UserAccount` (service Auth) et
  `Student` / `Teacher` / `Employee` (autres services) sont des références
  **logiques par email ou identifiant externe**, pas des clés étrangères
  SQL — chaque service possède sa propre base (pattern
  *database-per-service*, voir `docs/uml/deployment-diagram.md`).
- `StudentRef` (Finance) est une copie allégée de `Student` (Académique),
  volontairement dénormalisée pour éviter un appel synchrone
  inter-services à chaque facturation.
