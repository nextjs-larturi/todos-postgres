import NextAuth, { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { Adapter } from 'next-auth/adapters'
import prisma from '@/lib/prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import { signinWithEmailAndPassword } from '@/auth/actions/auth-actions'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? '',
      clientSecret: process.env.GOOGLE_SECRET ?? ''
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? ''
    }),
    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@email.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        const user = await signinWithEmailAndPassword(credentials!.email, credentials!.password)

        if (user) return user

        return null
      }
    })
  ],

  session: {
    strategy: 'jwt'
  },

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true
    },

    async jwt({ token, user, account, profile }) {
      const dbUser = await prisma.user.findUnique({
        where: {
          email: token.email!
        }
      })

      if (dbUser?.isActive === false) {
        throw Error('User is not active')
      }

      token.roles = dbUser?.roles!
      token.id = dbUser?.id!
      token.isActive = dbUser?.isActive!

      return token
    },

    async session({ session, token, user }) {
      if (session && session.user) {
        session.user.roles = token.roles
        session.user.id = token.id
        session.user.isActive = token.isActive
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
