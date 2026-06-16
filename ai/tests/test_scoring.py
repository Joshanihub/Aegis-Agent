from ai.scoring.risk_scorer import calculate_weighted_risk_index
from ai.evaluation.output_validator import (
    validate_planner_output,
    validate_analyst_output,
    validate_reviewer_output,
    validate_finalizer_output
)

def test_risk_scorer():
    score1 = calculate_weighted_risk_index(100, 0, 5, 5)
    assert score1 == 100
    
    score2 = calculate_weighted_risk_index(0, 100, 0, 0)
    assert score2 == 0
    
    score3 = calculate_weighted_risk_index(50, 80, 1, 1)
    assert score3 == 32

def test_validators():
    assert validate_planner_output({"subtasks": [], "confidence": 90}) == True
    assert validate_planner_output({"subtasks": []}) == False
    
    assert validate_analyst_output({"findings": [], "overall_confidence": 80}) == True
    assert validate_analyst_output({"findings": []}) == False
    
    assert validate_reviewer_output({"risk_score": 50, "approved": True, "critical_issues": []}) == True
    assert validate_reviewer_output({"risk_score": 50}) == False
    
    assert validate_finalizer_output({"risk_score": 50, "verdict": "caution", "executive_summary": "summary", "key_vulnerabilities": []}) == True
    assert validate_finalizer_output({"risk_score": 50, "verdict": "unknown", "executive_summary": "summary", "key_vulnerabilities": []}) == False
