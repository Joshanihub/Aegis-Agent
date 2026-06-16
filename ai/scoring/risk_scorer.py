def calculate_weighted_risk_index(
    reviewer_risk_score: int,      # weight: 0.40
    analyst_confidence: int,       # inverted: (100 - confidence) * weight 0.30
    critical_issue_count: int,     # weight: 0.20
    data_gap_count: int            # weight: 0.10
) -> int:
    """
    Returns a final risk score 0-100.
    High score = high risk.
    """
    issue_score = min(critical_issue_count * 20, 100)
    gap_score = min(data_gap_count * 20, 100)
    
    reviewer_weighted = reviewer_risk_score * 0.40
    confidence_weighted = max(0, min(100, 100 - analyst_confidence)) * 0.30
    issue_weighted = issue_score * 0.20
    gap_weighted = gap_score * 0.10
    
    final_score = int(reviewer_weighted + confidence_weighted + issue_weighted + gap_weighted)
    
    return max(0, min(100, final_score))
