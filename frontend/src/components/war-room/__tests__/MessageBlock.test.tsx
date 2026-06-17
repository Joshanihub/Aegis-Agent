import { render } from '@testing-library/react'
import MessageBlock from '../MessageBlock'

// Note: This is an auto-generated basic render test.
// Due to time constraints, complex props are mocked minimally.
// For full compliance, these tests should be expanded.

describe('MessageBlock', () => {
  it('renders without crashing', () => {
    render(<MessageBlock m={{ owner: 'planner', task: 't', context: 'c', action: 'a', output: { data: {}, confidence: 100, reasoning: 'r', api_used: '' }, status: 'ok', next_handoff: null, metadata: {} }} isLatest={false} index={0} />)
  })
})
