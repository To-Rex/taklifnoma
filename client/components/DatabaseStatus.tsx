import { useState, useEffect } from "react";
import { AlertCircle, Database, CheckCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkDatabaseSetup, testDatabaseConnection } from "@/lib/supabase";

interface DatabaseStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function DatabaseStatus({
  className = "",
  showDetails = false,
}: DatabaseStatusProps) {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    latency: number;
    error?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const [setupResult, connectionResult] = await Promise.all([
        checkDatabaseSetup(),
        testDatabaseConnection(),
      ]);

      setIsSetup(setupResult);
      setConnectionStatus(connectionResult);
    } catch (error) {
      console.error("Database status check failed:", error);
      setIsSetup(false);
      setConnectionStatus({
        connected: false,
        latency: 0,
        error: "Connection failed",
      });
    } finally {
      setChecking(false);
    }
  };

  if (isSetup === null) {
    return null; // Don't show anything while checking
  }

  if (isSetup && connectionStatus?.connected) {
    // Database is working fine, don't show anything
    return null;
  }

  return (
    <div className={className}>
      <Alert
        className={`${isSetup ? "border-orange-200 bg-orange-50" : "border-red-200 bg-red-50"}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isSetup ? (
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            ) : (
              <Database className="h-5 w-5 text-red-600 mt-0.5" />
            )}
          </div>

          <div className="flex-grow">
            <AlertDescription
              className={isSetup ? "text-orange-800" : "text-red-800"}
            >
              <div className="font-medium mb-1">
                {isSetup
                  ? "Ma'lumotlar bazasi qisman ishlayapti"
                  : "Ma'lumotlar bazasi sozlanmagan"}
              </div>

              <div className="text-sm">
                {!isSetup && (
                  <>
                    Default shablonlar va offline rejim ishlatilmoqda. To'liq
                    funksionallik uchun ma'lumotlar bazasini sozlang.
                  </>
                )}

                {isSetup && !connectionStatus?.connected && (
                  <>
                    Ba'zi xususiyatlar cheklangan bo'lishi mumkin. Internet
                    ulanishini tekshiring.
                  </>
                )}
              </div>

              {showDetails && connectionStatus && (
                <div className="mt-2 text-xs space-y-1">
                  <div>
                    <strong>Ulanish:</strong>{" "}
                    {connectionStatus.connected ? "✅ Ulangan" : "❌ Ulanmagan"}
                  </div>
                  {connectionStatus.connected && (
                    <div>
                      <strong>Kechikish:</strong> {connectionStatus.latency}ms
                    </div>
                  )}
                  {connectionStatus.error && (
                    <div>
                      <strong>Xatolik:</strong> {connectionStatus.error}
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </div>

          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
              disabled={checking}
              className="h-8 px-3"
            >
              <RefreshCw
                className={`h-3 w-3 ${checking ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}
