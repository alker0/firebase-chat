import { User } from 'firebase'
import { createState } from 'solid-js'

export type UserState = User | null

export interface SessionState {
  isLoggedIn: boolean,
  currentUser: UserState
}

export const [sessionState, setSessionState] = createState({
  isLoggedIn: false,
  currentUser: null as UserState
})

export const sessionStateChangedHandler = (user: UserState) =>
  setSessionState({
    isLoggedIn: Boolean(user),
    currentUser: user,
  })

