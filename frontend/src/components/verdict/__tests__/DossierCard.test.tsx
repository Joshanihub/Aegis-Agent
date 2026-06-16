import { render } from '@testing-library/react'
import DossierCard from '../DossierCard'

// Note: This is an auto-generated basic render test.
// Due to time constraints, complex props are mocked minimally.
// For full compliance, these tests should be expanded.

describe('DossierCard', () => {
  it('renders without crashing', () => {
    render(<DossierCard {...{ verdict: { risk_score: 50, verdict: 'approve', summary: 'test', vulnerabilities: [], reasoning_chain: [] } }} />)
  })
})
