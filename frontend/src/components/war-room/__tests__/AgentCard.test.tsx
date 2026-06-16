import { render } from '@testing-library/react'
import AgentCard from '../AgentCard'

// Note: This is an auto-generated basic render test.
// Due to time constraints, complex props are mocked minimally.
// For full compliance, these tests should be expanded.

describe('AgentCard', () => {
  it('renders without crashing', () => {
    render(<AgentCard {...{ agent: { agent_id: 'planner', name: 'Planner', role: 'test', status: 'idle', last_action: '', api_used: '', confidence: 100, updated_at: '' }, isActive: true }} />)
  })
})
