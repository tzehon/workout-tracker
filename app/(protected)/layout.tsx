"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <LoadingPage />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <Header user={session.user} />
      <main className="flex-1 overflow-x-hidden pb-20 pt-4 md:pb-4">
        <div className="container mx-auto max-w-full px-4">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
