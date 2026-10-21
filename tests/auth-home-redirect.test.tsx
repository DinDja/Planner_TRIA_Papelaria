import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

const state = vi.hoisted(() => ({
  user: null as { uid: string } | null,
  loading: true,
  replace: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: state.replace }),
}))

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({ user: state.user, loading: state.loading }),
}))

import { AuthHomeRedirect } from '@/components/auth/auth-home-redirect'

describe('AuthHomeRedirect', () => {
  beforeEach(() => {
    state.user = null
    state.loading = true
    state.replace.mockReset()
  })

  it('sends a restored session from the home route to the dashboard', async () => {
    state.user = { uid: 'test-user' }
    state.loading = false
    render(React.createElement(AuthHomeRedirect))

    await waitFor(() => expect(state.replace).toHaveBeenCalledWith('/dashboard'))
  })

  it('waits for Firebase before revealing the landing page to signed-out visitors', () => {
    const { rerender } = render(React.createElement(AuthHomeRedirect))
    expect(screen.getByRole('status')).toBeTruthy()
    expect(state.replace).not.toHaveBeenCalled()

    state.loading = false
    rerender(React.createElement(AuthHomeRedirect))
    expect(screen.queryByRole('status')).toBeNull()
    expect(state.replace).not.toHaveBeenCalled()
  })
})
