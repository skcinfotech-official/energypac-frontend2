import { useState, useEffect } from "react";
import { verificationService } from "../services/verificationService";

export const usePendingVerifications = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadPendingCount = async () => {
    setLoading(true);
    try {
      const count = await verificationService.getTotalPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error("Failed to load pending count:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load immediately
    loadPendingCount();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(loadPendingCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return { pendingCount, loading, refresh: loadPendingCount };
};
