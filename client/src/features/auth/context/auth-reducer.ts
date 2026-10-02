import type { AuthAction, AuthState } from '../types'

export const initialAuthState: AuthState = {
  status: 'loading',
}

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'session_restored':
    case 'logged_in':
      return {
        status: 'authenticated',
        user: action.user,
      }
    case 'session_not_found':
      return {
        status: 'anonymous',
      }
    case 'logged_out':
      return {
        status: 'anonymous',
      }
    case 'balance_updated':
      if (state.status !== 'authenticated') {
        return state
      }

      return {
        ...state,
        user: {
          ...state.user,
          balanceCents: action.balanceCents,
        },
      }

    default: {
      const exhaustiveCheck: never = action
      return exhaustiveCheck
    }
  }
}
