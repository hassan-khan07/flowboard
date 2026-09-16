"use client";

import { useState } from "react";

export default function UpgradeButton({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/checkout`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Stripe ka URL ek poori tarah alag domain hai (checkout.stripe.com), Next.js ka router sirf apni hi app ke andar navigate karta hai. External URL ke liye window.location.href zaroori hai.

      window.location.href = data.url;
    } catch (error) {
      console.error("Upgrade failed:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-orange-400 disabled:opacity-50"
    >
      {loading ? "Redirecting..." : "Upgrade to Pro"}
    </button>
  );
}
