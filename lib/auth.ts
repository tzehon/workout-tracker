import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getCollection } from "@/lib/mongodb";
import { User, UserSettings } from "@/types";
import { ObjectId } from "mongodb";

const defaultSettings: UserSettings = {
  currentPhase: 1,
  currentWeek: 1,
  weightUnit: "kg",
  defaultRestTime: 90,
  darkMode: true,
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const usersCollection = await getCollection<User>("users");

        // Check if user exists
        const existingUser = await usersCollection.findOne({
          email: user.email!,
        });

        if (!existingUser) {
          // Create new user
          await usersCollection.insertOne({
            _id: new ObjectId(),
            email: user.email!,
            name: user.name!,
            image: user.image || undefined,
            googleId: account.providerAccountId,
            createdAt: new Date(),
            updatedAt: new Date(),
            settings: defaultSettings,
          });
        } else if (user.email) {
          // Update last login
          await usersCollection.updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name || undefined,
                image: user.image || undefined,
                updatedAt: new Date(),
              },
            }
          );
        }
      }
      return true;
    },
    async session({ session }) {
      if (session.user) {
        const usersCollection = await getCollection<User>("users");
        const dbUser = await usersCollection.findOne({
          email: session.user.email!,
        });

        if (dbUser) {
          session.user.id = dbUser._id.toString();
          session.user.settings = dbUser.settings;
        }
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const usersCollection = await getCollection<User>("users");
        const dbUser = await usersCollection.findOne({ email: user.email! });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.settings = dbUser.settings;
        }
      }

      // Handle session updates
      if (trigger === "update" && session?.settings) {
        token.settings = session.settings;
      }

      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Type augmentation for next-auth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      settings: UserSettings;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    settings: UserSettings;
  }
}
