import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      try {
        await dbConnect();
        
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name,
            balanceBDT: 0,
            balanceUSD: 0
          });
        }
        
        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: session.user.email });
          
          if (dbUser) {
            session.user.balanceBDT = dbUser.balanceBDT;
            session.user.balanceUSD = dbUser.balanceUSD;
            session.user.dbId = dbUser._id.toString();
          }
        } catch (error) {
          console.error("Session error:", error);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };