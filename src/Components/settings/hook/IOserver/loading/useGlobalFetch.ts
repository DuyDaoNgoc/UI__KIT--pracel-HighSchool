// src/hooks/useGlobalFetch.ts
import { useState, useEffect } from "react";

export const useGlobalFetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const globalFetch = async <T>(fetchFunc: Promise<T>): Promise<T | null> => {
    if (!navigator.onLine) {
      setError("Không có kết nối mạng");
      setLoading(true);
      return null;
    }

    setLoading(true);
    setError(null);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Server quá lâu không phản hồi")),
        60000,
      ),
    );

    try {
      const res = await Promise.race([fetchFunc, timeoutPromise]);
      return res;
    } catch (err: any) {
      if (!navigator.onLine) setError("Không có kết nối mạng");
      else setError(err.message || "Lỗi server");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading: loading || isOffline, error, globalFetch };
};
