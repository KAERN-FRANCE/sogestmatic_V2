"use client"

import { useState, useEffect } from "react"
import { AuthService, type AuthState } from "@/lib/auth"

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, isLoading: true })
  const authService = AuthService.getInstance()

  useEffect(() => {
    setAuthState(authService.getState())

    const unsubscribe = authService.subscribe(setAuthState)
    return unsubscribe
  }, [authService])

  return {
    ...authState,
    login: authService.login.bind(authService),
    register: authService.register.bind(authService),
    logout: authService.logout.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    isAdmin: authService.isAdmin.bind(authService),
  }
}
