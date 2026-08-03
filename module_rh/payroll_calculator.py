"""
Moteur de calcul de paie.

Logique (simplifiée, à des fins pédagogiques — voir config.py pour les
taux et la note importante sur leur exactitude légale) :

1. CNPS part salariale = base cotisable × taux pension salarié
   (base cotisable = min(salaire brut, plafond CNPS))
2. CFC part salariale = salaire brut × 1%
3. Base imposable IRPP = salaire brut - CNPS employé - CFC employé
4. IRPP = barème progressif appliqué à la base imposable
5. CAC = 10% de l'IRPP
6. Net à payer = salaire brut - (CNPS emp. + CFC emp. + IRPP + CAC)
7. Coût employeur total = salaire brut + charges patronales (CNPS, CFC, FNE)
"""
from app.config import (
    CNPS_EMPLOYEE_PENSION_RATE, CNPS_EMPLOYER_PENSION_RATE,
    CNPS_EMPLOYER_FAMILY_ALLOWANCE_RATE, CNPS_EMPLOYER_WORK_INJURY_RATE,
    CNPS_MONTHLY_CEILING, CFC_EMPLOYEE_RATE, CFC_EMPLOYER_RATE,
    FNE_EMPLOYER_RATE, CAC_RATE, IRPP_BRACKETS,
)


def compute_irpp(taxable_base: float) -> float:
    """Applique le barème progressif tranche par tranche."""
    if taxable_base <= 0:
        return 0.0

    irpp = 0.0
    lower_bound = 0.0

    for bracket_ceiling, rate in IRPP_BRACKETS:
        if bracket_ceiling is None:
            # dernière tranche, sans plafond
            taxable_in_bracket = max(0.0, taxable_base - lower_bound)
            irpp += taxable_in_bracket * rate
            break

        if taxable_base > bracket_ceiling:
            taxable_in_bracket = bracket_ceiling - lower_bound
            irpp += taxable_in_bracket * rate
            lower_bound = bracket_ceiling
        else:
            taxable_in_bracket = taxable_base - lower_bound
            irpp += max(0.0, taxable_in_bracket) * rate
            break

    return round(irpp, 2)


def calculate_payslip(base_salary: float) -> dict:
    cnps_base = min(base_salary, CNPS_MONTHLY_CEILING)

    # --- Part salariale (retenue sur le salaire) ---
    cnps_employee = round(cnps_base * CNPS_EMPLOYEE_PENSION_RATE, 2)
    cfc_employee = round(base_salary * CFC_EMPLOYEE_RATE, 2)

    taxable_base = max(0.0, base_salary - cnps_employee - cfc_employee)
    irpp = compute_irpp(taxable_base)
    cac = round(irpp * CAC_RATE, 2)

    total_employee_deductions = round(cnps_employee + cfc_employee + irpp + cac, 2)
    net_salary = round(base_salary - total_employee_deductions, 2)

    # --- Part patronale (coût employeur, n'affecte pas le net) ---
    cnps_employer_total = round(
        cnps_base * (CNPS_EMPLOYER_PENSION_RATE
                      + CNPS_EMPLOYER_FAMILY_ALLOWANCE_RATE
                      + CNPS_EMPLOYER_WORK_INJURY_RATE),
        2,
    )
    cfc_employer = round(base_salary * CFC_EMPLOYER_RATE, 2)
    fne_employer = round(base_salary * FNE_EMPLOYER_RATE, 2)

    total_employer_cost = round(
        base_salary + cnps_employer_total + cfc_employer + fne_employer, 2
    )

    return {
        "base_salary": base_salary,
        "cnps_employee": cnps_employee,
        "cnps_employer_total": cnps_employer_total,
        "cfc_employee": cfc_employee,
        "cfc_employer": cfc_employer,
        "fne_employer": fne_employer,
        "taxable_base": round(taxable_base, 2),
        "irpp": irpp,
        "cac": cac,
        "total_employee_deductions": total_employee_deductions,
        "net_salary": net_salary,
        "total_employer_cost": total_employer_cost,
    }
