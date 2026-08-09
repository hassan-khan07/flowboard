"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut({ redirect: false });
        router.push("/login");
      }}
    >
      Log out
    </button>
  );
}
