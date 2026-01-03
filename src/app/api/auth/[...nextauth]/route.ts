import NextAuth from "next-auth";
import type { AuthOptions } from "next-auth";
// Tutaj importujesz providerów, których chcesz użyć.
import GithubProvider from "next-auth/providers/github";

export const authOptions: AuthOptions = {
  // Przykładowy provider: GitHub
  // W wersji produkcyjnej musisz dodać też CredentialsProvider (email/hasło)
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    // Możesz dodać GoogleProvider, FacebookProvider itp.
  ],
  // ... Dodatkowe opcje: strony logowania, bazy danych itp.
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };