import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Fingerprint,
  Smartphone,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerBiometric,
  getCredentials,
  deleteCredential,
  renameCredential,
  getDeviceInfo,
  type WebAuthnCredential,
} from "@/services/webauthn.service";

export function BiometricSettings() {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    checkSupport();
    loadCredentials();
  }, []);

  const checkSupport = async () => {
    const supported = isWebAuthnSupported();
    setIsSupported(supported);

    if (supported) {
      const platformAvailable = await isPlatformAuthenticatorAvailable();
      setIsPlatformAvailable(platformAvailable);
    }
  };

  const loadCredentials = async () => {
    setIsLoading(true);
    const creds = await getCredentials();
    setCredentials(creds);
    setIsLoading(false);
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    const deviceName = getDeviceInfo();
    
    const result = await registerBiometric(deviceName);
    
    if (result.success) {
      toast.success("מכשיר נרשם בהצלחה!");
      await loadCredentials();
    } else {
      toast.error(result.error || "שגיאה ברישום המכשיר");
    }
    
    setIsRegistering(false);
  };

  const handleDelete = async (credentialId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק מכשיר זה?")) {
      return;
    }

    const success = await deleteCredential(credentialId);
    
    if (success) {
      toast.success("המכשיר הוסר בהצלחה");
      await loadCredentials();
    } else {
      toast.error("שגיאה בהסרת המכשיר");
    }
  };

  const handleStartEdit = (credential: WebAuthnCredential) => {
    setEditingId(credential.id);
    setEditName(credential.device_name);
  };

  const handleSaveEdit = async (credentialId: string) => {
    if (!editName.trim()) {
      toast.error("יש להזין שם למכשיר");
      return;
    }

    const success = await renameCredential(credentialId, editName.trim());
    
    if (success) {
      toast.success("שם המכשיר עודכן");
      setEditingId(null);
      await loadCredentials();
    } else {
      toast.error("שגיאה בעדכון שם המכשיר");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  if (!isSupported) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-sm text-amber-900 dark:text-amber-100 mb-1">
              אימות ביומטרי לא נתמך
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              הדפדפן שלך אינו תומך באימות ביומטרי. נסה דפדפן מודרני יותר כמו Chrome, Edge, או Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isPlatformAvailable) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black text-sm text-blue-900 dark:text-blue-100 mb-1">
              אימות ביומטרי לא זמין
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              המכשיר שלך אינו תומך באימות ביומטרי מובנה. ודא שיש לך טביעת אצבע או זיהוי פנים מוגדר במכשיר.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-foreground">מכשירים רשומים</h3>
          <p className="text-xs text-muted-foreground font-medium mt-1">
            נהל את המכשירים שיכולים להיכנס עם אימות ביומטרי
          </p>
        </div>
        <Button
          onClick={handleRegister}
          disabled={isRegistering}
          className="h-10 rounded-xl bg-primary hover:bg-primary/90 font-black text-sm gap-2"
        >
          {isRegistering ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          הוסף מכשיר
        </Button>
      </div>

      {/* Credentials List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground mt-3 font-medium">טוען מכשירים...</p>
        </div>
      ) : credentials.length === 0 ? (
        <div className="bg-muted/30 border border-border/40 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Fingerprint className="w-8 h-8 text-primary" />
          </div>
          <h4 className="font-black text-foreground mb-2">אין מכשירים רשומים</h4>
          <p className="text-sm text-muted-foreground font-medium mb-4">
            הוסף מכשיר כדי להתחיל להשתמש בכניסה ביומטרית
          </p>
          <Button
            onClick={handleRegister}
            disabled={isRegistering}
            className="h-11 rounded-xl bg-primary hover:bg-primary/90 font-black text-sm gap-2"
          >
            {isRegistering ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            הוסף מכשיר ראשון
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {credentials.map((credential) => (
              <motion.div
                key={credential.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card border border-border/40 rounded-2xl p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Smartphone className="w-6 h-6 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {editingId === credential.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 rounded-lg font-bold text-sm"
                        placeholder="שם המכשיר"
                        autoFocus
                      />
                    ) : (
                      <>
                        <h4 className="font-black text-sm text-foreground truncate">
                          {credential.device_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            נוצר: {new Date(credential.created_at).toLocaleDateString('he-IL')}
                          </span>
                          {credential.last_used_at && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                שימוש אחרון: {new Date(credential.last_used_at).toLocaleDateString('he-IL')}
                              </span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {editingId === credential.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveEdit(credential.id)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-muted"
                        >
                          ✕
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(credential)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-blue-500/10 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(credential.id)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-sm text-blue-900 dark:text-blue-100 mb-1">
              אבטחה מקסימלית
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              אימות ביומטרי משתמש בחומרת האבטחה של המכשיר שלך (טביעת אצבע, זיהוי פנים) ומספק את רמת האבטחה הגבוהה ביותר. המפתחות הקריפטוגרפיים נשמרים במכשיר ולעולם לא עוזבים אותו.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
