'use client'

import { SessionProvider } from 'next-auth/react'

interface Props {
  children: React.ReactNode
}

export default function AuthProider({ children, ...rest }: Props) {
  return <SessionProvider>{children}</SessionProvider>
}
