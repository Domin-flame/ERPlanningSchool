"""
Tests unitaires du moteur de paie (CNPS/PAYE) — app/services/payroll_calculator.py.

C'est le cœur métier du module RH noté dans le cahier des charges
("payroll computation that accounts for standard Cameroonian statutory
deductions"), donc la cible prioritaire pour des tests unitaires solides.
Fonctions pures : aucune base de données requise.
"""
from app.config import (
    CAC_RATE,
    CFC_EMPLOYEE_RATE,
    CFC_EMPLOYER_RATE,
    CNPS_EMPLOYEE_PENSION_RATE,
    CNPS_MONTHLY_CEILING,
    FNE_EMPLOYER_RATE,
)
from app.services.payroll_calculator import calculate_payslip, compute_irpp


def test_compute_irpp_is_zero_below_first_bracket():
    # Base imposable positive mais bien inférieure au premier palier (166 667)
    assert compute_irpp(50_000) == 5_000.0  # 10% du premier palier


def test_compute_irpp_is_zero_for_non_positive_base():
    assert compute_irpp(0) == 0.0
    assert compute_irpp(-100) == 0.0


def test_compute_irpp_progressive_across_multiple_brackets():
    """200 000 FCFA imposables traversent 2 tranches :
    166 667 * 10% + (200 000 - 166 667) * 15%."""
    expected = round(166_667 * 0.10 + (200_000 - 166_667) * 0.15, 2)
    assert compute_irpp(200_000) == expected


def test_compute_irpp_last_bracket_has_no_ceiling():
    """Une base imposable très élevée doit utiliser le taux de la dernière
    tranche (35%) au-delà de 416 667, sans jamais lever d'erreur."""
    result = compute_irpp(1_000_000)
    assert result > 0
    # Le dernier FCFA doit être taxé à 35%, pas moins
    delta = compute_irpp(1_000_001) - compute_irpp(1_000_000)
    assert round(delta, 2) == 0.35


def test_calculate_payslip_basic_shape():
    payslip = calculate_payslip(300_000)
    expected_keys = {
        "base_salary", "cnps_employee", "cnps_employer_total", "cfc_employee",
        "cfc_employer", "fne_employer", "taxable_base", "irpp", "cac",
        "total_employee_deductions", "net_salary", "total_employer_cost",
    }
    assert expected_keys.issubset(payslip.keys())
    assert payslip["base_salary"] == 300_000


def test_calculate_payslip_net_salary_is_gross_minus_deductions():
    payslip = calculate_payslip(300_000)
    assert payslip["net_salary"] == round(
        payslip["base_salary"] - payslip["total_employee_deductions"], 2
    )
    assert payslip["net_salary"] < payslip["base_salary"]


def test_calculate_payslip_employer_cost_exceeds_gross_salary():
    """Le coût employeur total doit toujours dépasser le salaire brut
    (il inclut les charges patronales CNPS + CFC + FNE)."""
    payslip = calculate_payslip(300_000)
    assert payslip["total_employer_cost"] > payslip["base_salary"]


def test_calculate_payslip_respects_cnps_ceiling():
    """Au-delà du plafond CNPS, la cotisation salariale CNPS ne doit plus
    augmenter — elle est plafonnée à CNPS_MONTHLY_CEILING."""
    below_ceiling = calculate_payslip(CNPS_MONTHLY_CEILING)
    above_ceiling = calculate_payslip(CNPS_MONTHLY_CEILING + 500_000)
    assert below_ceiling["cnps_employee"] == above_ceiling["cnps_employee"]
    assert above_ceiling["cnps_employee"] == round(
        CNPS_MONTHLY_CEILING * CNPS_EMPLOYEE_PENSION_RATE, 2
    )


def test_calculate_payslip_cfc_scales_with_full_gross_salary():
    """La CFC salariale (1%) s'applique au salaire brut TOTAL, sans
    plafond — contrairement à la CNPS."""
    payslip = calculate_payslip(1_000_000)
    assert payslip["cfc_employee"] == round(1_000_000 * CFC_EMPLOYEE_RATE, 2)


def test_calculate_payslip_zero_salary_does_not_crash():
    payslip = calculate_payslip(0)
    assert payslip["net_salary"] == 0
    assert payslip["irpp"] == 0.0
    assert payslip["cac"] == 0.0


def test_calculate_payslip_cac_is_ten_percent_of_irpp():
    payslip = calculate_payslip(400_000)
    assert payslip["cac"] == round(payslip["irpp"] * CAC_RATE, 2)


def test_calculate_payslip_employer_charges_breakdown():
    payslip = calculate_payslip(500_000)
    assert payslip["cfc_employer"] == round(500_000 * CFC_EMPLOYER_RATE, 2)
    assert payslip["fne_employer"] == round(500_000 * FNE_EMPLOYER_RATE, 2)
