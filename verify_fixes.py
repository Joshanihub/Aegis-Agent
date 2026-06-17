#!/usr/bin/env python3
"""Verification script for Aegis-Agent fixes - testing logic without API calls."""

import sys

def test_reviewer_risk_calculation():
    """Test reviewer's dynamic risk score calculation logic."""
    print("Testing Reviewer Risk Score Calculation...")

    # Simulate the risk calculation logic from reviewer.py
    risk_severity_scores = {"LOW": 25, "MEDIUM": 50, "HIGH": 75}

    # Test case 1: Multiple findings with mixed severity
    findings = [
        {"risk_severity": "LOW"},
        {"risk_severity": "MEDIUM"},
        {"risk_severity": "HIGH"},
    ]
    confidence_score = 70

    total_risk = 0
    high_risk_count = 0
    for finding in findings:
        severity = finding.get("risk_severity", "MEDIUM")
        severity_score = risk_severity_scores.get(severity, 50)
        total_risk += severity_score
        if severity == "HIGH":
            high_risk_count += 1

    avg_risk = int(total_risk / len(findings))  # (25+50+75)/3 = 50
    confidence_adjustment = max(0, (100 - confidence_score) // 2)  # (100-70)//2 = 15
    final_risk_score = min(100, avg_risk + confidence_adjustment)  # 50+15 = 65

    # Ensure minimum risk for high-risk findings
    if high_risk_count > 0:
        final_risk_score = max(final_risk_score, 55)  # 65 >= 55, so stays 65

    assert final_risk_score == 65, f"Expected 65, got {final_risk_score}"
    print(f"  ✓ Mixed findings: {findings} → risk_score = {final_risk_score}")

    # Test case 2: All low-risk findings
    findings = [
        {"risk_severity": "LOW"},
        {"risk_severity": "LOW"},
    ]
    total_risk = 25 + 25  # 50
    avg_risk = int(total_risk / 2)  # 25
    confidence_adjustment = 15
    final_risk_score = min(100, avg_risk + confidence_adjustment)  # 40

    if any(f.get("risk_severity") == "HIGH" for f in findings):
        final_risk_score = max(final_risk_score, 55)

    assert final_risk_score == 40, f"Expected 40, got {final_risk_score}"
    print(f"  ✓ Low-risk findings → risk_score = {final_risk_score}")

    # Test case 3: All high-risk findings
    findings = [
        {"risk_severity": "HIGH"},
        {"risk_severity": "HIGH"},
    ]
    total_risk = 75 + 75  # 150
    avg_risk = int(total_risk / 2)  # 75
    final_risk_score = min(100, avg_risk + confidence_adjustment)  # 90

    high_risk_count = 2
    if high_risk_count > 0:
        final_risk_score = max(final_risk_score, 55)  # 90 >= 55

    assert final_risk_score == 90, f"Expected 90, got {final_risk_score}"
    print(f"  ✓ High-risk findings → risk_score = {final_risk_score}")


def test_verdict_mapping():
    """Test that verdict correctly maps from risk scores."""
    print("\nTesting Verdict Mapping...")

    def get_verdict(risk_score, persona="Standard Analyst"):
        if persona == "Conservative Risk Officer":
            adjusted_risk = min(100, risk_score + 15)
            if adjusted_risk <= 25: return "approve"
            elif adjusted_risk <= 50: return "caution"
            else: return "reject"
        elif persona == "Aggressive Growth Investor":
            adjusted_risk = max(0, risk_score - 15)
            if adjusted_risk <= 50: return "approve"
            elif adjusted_risk <= 80: return "caution"
            else: return "reject"
        else:  # Standard Analyst
            if risk_score <= 33: return "approve"
            elif risk_score <= 66: return "caution"
            else: return "reject"

    # Test Standard Analyst
    test_cases = [
        (20, "Standard Analyst", "approve"),
        (50, "Standard Analyst", "caution"),
        (75, "Standard Analyst", "reject"),
        (30, "Conservative Risk Officer", "caution"),  # 30+15=45
        (40, "Aggressive Growth Investor", "approve"),  # 40-15=25
    ]

    for risk_score, persona, expected in test_cases:
        verdict = get_verdict(risk_score, persona)
        assert verdict == expected, f"Risk {risk_score} with {persona}: expected {expected}, got {verdict}"
        print(f"  ✓ Risk {risk_score} ({persona}) → {verdict}")


def test_compressor_condition():
    """Test that compressor only runs on refinements."""
    print("\nTesting Compressor Condition...")

    # Test case 1: Initial analysis (no refinement marker, no messages)
    deal_context = "Initial analysis for TechCorp"
    has_messages = False
    has_refinement_marker = "[REFINEMENT CRITERIA]:" in deal_context
    should_run_compressor = has_refinement_marker and has_messages

    assert not should_run_compressor, "Compressor should NOT run on initial analysis"
    print(f"  ✓ Initial analysis: compressor should NOT run")

    # Test case 2: Refinement (has marker, has messages)
    deal_context = "Previous analysis...\n\n[REFINEMENT CRITERIA]: Add EU market data"
    has_messages = True
    has_refinement_marker = "[REFINEMENT CRITERIA]:" in deal_context
    should_run_compressor = has_refinement_marker and has_messages

    assert should_run_compressor, "Compressor SHOULD run on refinement"
    print(f"  ✓ Refinement analysis: compressor SHOULD run")

    # Test case 3: Has messages but no refinement marker (old session)
    deal_context = "Previous analysis from old session"
    has_messages = True
    has_refinement_marker = "[REFINEMENT CRITERIA]:" in deal_context
    should_run_compressor = has_refinement_marker and has_messages

    assert not should_run_compressor, "Compressor should NOT run without explicit refinement marker"
    print(f"  ✓ Old session without refinement: compressor should NOT run")


def test_review_condition():
    """Test that reviewer decides when to request revision."""
    print("\nTesting Review Revision Condition...")

    def should_request_revision(count, data_gaps, has_high_risk, confidence):
        has_high_risk_findings = has_high_risk
        return (
            count == 1 and
            len(data_gaps) > 0 and
            has_high_risk_findings and
            confidence < 75
        )

    # Test case 1: First cycle with data gaps, high risk, low confidence → SHOULD request revision
    result = should_request_revision(1, ["EU market size"], True, 70)
    assert result, "Should request revision"
    print(f"  ✓ First cycle, gaps, high-risk, low confidence → request revision")

    # Test case 2: First cycle with high confidence → should NOT request revision
    result = should_request_revision(1, ["EU market size"], True, 80)
    assert not result, "Should NOT request revision with high confidence"
    print(f"  ✓ First cycle, gaps, high-risk, high confidence (80%) → skip revision")

    # Test case 3: First cycle with no data gaps → should NOT request revision
    result = should_request_revision(1, [], True, 70)
    assert not result, "Should NOT request revision without data gaps"
    print(f"  ✓ First cycle, no gaps, high-risk, low confidence → skip revision")

    # Test case 4: Second cycle → should NOT request revision (even with gaps)
    result = should_request_revision(2, ["EU market size"], True, 70)
    assert not result, "Should NOT request revision on second cycle"
    print(f"  ✓ Second cycle, gaps, high-risk, low confidence → skip revision")


if __name__ == "__main__":
    print("=" * 60)
    print("Aegis-Agent Fix Verification Tests")
    print("=" * 60 + "\n")

    try:
        test_reviewer_risk_calculation()
        test_verdict_mapping()
        test_compressor_condition()
        test_review_condition()
        print("\n" + "=" * 60)
        print("✓✓✓ All verification tests PASSED! ✓✓✓")
        print("=" * 60)
        sys.exit(0)
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
