import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),

  // ✅ SESSION STORED IN DATABASE
  session: {
    strategy: 'database',
  },

  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
    }),

    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        login: { type: 'text' },
        password: { type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.login || !credentials.password) {
          return null;
        }

        // 1️⃣ Find user
        const user = await prisma.user.findUnique({
          where: { email: credentials.login },
        });

        if (!user || !user.password) {
          return null;
        }

        // 2️⃣ Verify password (ONE TIME)
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          return null;
        }

        // 3️⃣ Return SAFE user object
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  pages: {
    signIn: '/', // modal-based login
  },
});

export { handler as GET, handler as POST };
