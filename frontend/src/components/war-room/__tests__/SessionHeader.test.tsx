import { render } from '@testing-library/react'
import SessionHeader from '../SessionHeader'

// Note: This is an auto-generated basic render test.
// Due to time constraints, complex props are mocked minimally.
// For full compliance, these tests should be expanded.

describe('SessionHeader', () => {
  it('renders without crashing', () => {
    render(<SessionHeader {...{ taskId: '123', roomStatus: 'connected', wsError: null }} />)
  })
})
