import { useState, useEffect } from "react";
import apiClient from "@/config/api.client";
import { Button } from "@/components/ui/button";
import {
  Save,
  User as UserIcon,
  Phone,
  Heart,
  Building2,
  Settings2,
  ShieldCheck,
  Fingerprint,
  CheckCircle2,
  ShieldOff,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cleanUnitName, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ProfileSettingsProps {
  user: any;
  formData: any;
  setFormData: (data: any) => void;
  emergencyDetails: any;
  setEmergencyDetails: (data: any) => void;
  relations: string[];
  isSaving: boolean;
  handleSaveProfile: () => void;
  readOnly?: boolean;
}

export function ProfileSettings({
  user,
  formData,
  setFormData,
  emergencyDetails,
  setEmergencyDetails,
  relations,
  isSaving,
  handleSaveProfile,
  readOnly = false,
}: ProfileSettingsProps) {
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [biometricPassword, setBiometricPassword] = useState("");
  const [showBioPassword, setShowBioPassword] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricError, setBiometricError] = useState("");
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const stored = localStorage.getItem(`biometric_registered_${user?.username}`);
    setBiometricRegistered(!!stored);
  }, [user?.username]);

  const tabs = [
    { id: "personal", label: "פרטים", icon: UserIcon },
    { id: "service", label: "שירות", icon: Settings2 },
    { id: "emergency", label: "חירום", icon: Heart },
    { id: "biometrics", label: "ביומטריה", icon: Fingerprint },
  ];

  // WebAuthn Helpers
  const base64urlToBytes = (base64url: string): Uint8Array => {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const binary = window.atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const bufferToBase64url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  // Simple hash function (better than base64, but still client-side)
  const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + user.username); // Salt with username
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleVerifyPassword = async () => {
    setBiometricError("");
    if (!biometricPassword.trim()) {
      setBiometricError("יש להזין את הסיסמה כדי לאמת את זהותך");
      return;
    }
    
    setBiometricLoading(true);
    
    try {
      // Verify password with server before proceeding
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          password: biometricPassword,
        }),
      });

      if (!response.ok) {
        setBiometricError("הסיסמה שהוזנה שגויה");
        setBiometricLoading(false);
        return;
      }

      // Password verified, show PIN setup
      setShowPinSetup(true);
      setBiometricLoading(false);
    } catch (err: any) {
      console.error("Password verification error:", err);
      setBiometricError(err.message || "שגיאה באימות סיסמה");
      setBiometricLoading(false);
    }
  };

  const handleCreatePin = async () => {
    setBiometricError("");
    
    // Validate PIN
    if (!newPin || newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      setBiometricError("יש להזין קוד PIN תקין (4-6 ספרות)");
      return;
    }

    if (newPin !== confirmPin) {
      setBiometricError("הקודים אינם תואמות");
      return;
    }

    setBiometricLoading(true);
    
    try {
      // Hash the PIN
      const pinHash = await hashPin(newPin);

      // Request refresh token from server
      const refreshResp = await apiClient.post("/auth/refresh-token", {
        username: user.username,
        password: biometricPassword,
      });

      if (!refreshResp.data || !refreshResp.data.refreshToken) {
        throw new Error("לא ניתן לקבל טוקן רענון מהשרת");
      }

      const refreshToken = refreshResp.data.refreshToken;

      // Store PIN hash and refresh token
      localStorage.setItem(`biometric_pin_${user.username}`, pinHash);
      localStorage.setItem(`biometric_refresh_${user.username}`, refreshToken);
      localStorage.setItem(`biometric_registered_${user.username}`, "1");
      localStorage.setItem("biometric_last_user", user.username);

      setBiometricRegistered(true);
      setNewPin("");
      setConfirmPin("");
      setShowPinSetup(false);
      
      toast.success("קוד PIN הוגדר בהצלחה!");
      
      // Check if we can also register with browser Credential Manager
      if ("credentials" in navigator && (window as any).PasswordCredential) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: user.username,
            password: biometricPassword,
            name: `${user.first_name} ${user.last_name}`,
          });
          await navigator.credentials.store(cred);
          toast.success("המכשיר סונכרן לזיהוי ביומטרי");
        } catch (e) {
          console.warn("Credential storage failed", e);
        }
      }
      
      setBiometricPassword("");
    } catch (err: any) {
      console.error("PIN registration error:", err);
      setBiometricError(err.message || "שגיאה בהפעלת כניסה מהירה");
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleRegisterBiometricsOnly = async () => {
    setBiometricLoading(true);
    setBiometricError("");

    try {
      // Step 1: Get registration options from server
      const optionsResp = await apiClient.get("/auth/webauthn/register/options");
      const options = optionsResp.data;

      // Transform from base64url to ArrayBuffers where needed
      const creationOptions: CredentialCreationOptions = {
        publicKey: {
          ...options,
          challenge: base64urlToBytes(options.challenge),
          user: {
            ...options.user,
            id: base64urlToBytes(options.user.id),
          },
          excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
            ...cred,
            id: base64urlToBytes(cred.id),
          })),
        },
      };

      // Step 2: Trigger the OS biometric prompt
      const credential = await navigator.credentials.create(creationOptions) as any;

      if (!credential) {
        throw new Error("לא התקבלו פרטי זיהוי מהמכשיר");
      }

      // Step 3: Prepare response for server verification
      const verifyData = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          attestationObject: bufferToBase64url(credential.response.attestationObject),
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
          transports: credential.getTransports ? credential.getTransports() : undefined,
        },
      };

      // Step 4: Verify with server
      await apiClient.post("/auth/webauthn/register/verify", verifyData);

      localStorage.setItem(`biometric_registered_${user.username}`, "1");
      localStorage.setItem("biometric_last_user", user.username);
      setBiometricRegistered(true);
      setBiometricPassword("");
      toast.success("המכשיר נרשם לזיהוי ביומטרי (Passkey) בהצלחה!");
    } catch (err: any) {
      console.error("Passkey registration failed:", err);
      if (err.name === "NotAllowedError") {
        setBiometricError("הרישום בוטל על ידי המשתמש");
      } else {
        setBiometricError(err.message || "שגיאה ברישום הביומטרי. וודא שהדפדפן תומך.");
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleRemoveBiometric = () => {
    const username = user?.username;
    if (username) {
      localStorage.removeItem(`biometric_pin_${username}`);
      localStorage.removeItem(`biometric_refresh_${username}`);
      localStorage.removeItem(`biometric_registered_${username}`);
    }
    setBiometricRegistered(false);
    setBiometricPassword("");
    setNewPin("");
    setConfirmPin("");
    setShowPinSetup(false);
    setBiometricError("");
    toast.success("כניסה מהירה בוטלה");
  };

  return (
    <div className="w-full pb-24 lg:pb-0">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        
        {/* ── DESKTOP SIDEBAR: PROFILE CARD (HERO) ── */}
        <div className="hidden lg:block lg:w-80 xl:w-[360px] shrink-0 lg:sticky lg:top-24">
          <div className="bg-card/40 backdrop-blur-xl rounded-3xl p-6 border border-border/40 flex flex-col items-center text-center relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent -z-10" />

            <div className="relative group mt-4">
              <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-4xl font-black border-[6px] border-white dark:border-slate-950 ring-1 ring-slate-100 dark:ring-slate-800 transition-all relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                {formData.first_name?.[0]}
                {formData.last_name?.[0]}
              </div>
            </div>

            <div className="mt-5 space-y-1.5 w-full">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {user?.first_name} {user?.last_name}
              </h1>
            </div>

            <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-6" />

            <div className="w-full space-y-3">
              <div className="flex justify-center mt-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-lg border border-primary/20">
                  {user?.username}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Settings Area */}
        <div className="flex-1 w-full min-w-0 space-y-6 lg:space-y-8">
          
          {/* Mobile Tab Selector */}
          <div className="block lg:hidden w-full sticky top-0 z-30 pt-2 pb-3 bg-background/90 backdrop-blur-md mb-6">
            <div className="flex items-center justify-between gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 flex-1 rounded-xl transition-all duration-300 gap-1.5 font-bold text-[11px]",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-slate-500/5"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 1: Personal Details */}
          <div className={cn(activeTab === "personal" ? "block animate-in fade-in duration-200" : "hidden lg:block")}>
            <SectionCard icon={UserIcon} title="פרטים אישיים">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
                <div className="col-span-1">
                  <InputItem label="שם פרטי" required>
                    <Input
                      disabled={readOnly}
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="h-11 sm:h-13 bg-background/30 rounded-xl border-border/40 pl-4 font-bold text-sm sm:text-base focus:bg-background/80 transition-all"
                      placeholder="ישראל"
                    />
                  </InputItem>
                </div>

                <div className="col-span-1">
                  <InputItem label="שם משפחה" required>
                    <Input
                      disabled={readOnly}
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="h-11 sm:h-13 bg-background/30 rounded-xl border-border/40 pl-4 font-bold text-sm sm:text-base focus:bg-background/80 transition-all"
                      placeholder="ישראלי"
                    />
                  </InputItem>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <InputItem label="עיר מגורים">
                    <Input
                      disabled={readOnly}
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="h-11 sm:h-13 bg-background/30 rounded-xl border-border/40 pl-4 font-bold text-sm sm:text-base focus:bg-background/80 transition-all"
                      placeholder="תל אביב"
                    />
                  </InputItem>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <InputItem label="מספר טלפון">
                    <Input
                      disabled={readOnly}
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_number: e.target.value })
                      }
                      className="h-11 sm:h-13 bg-background/30 rounded-xl border-border/40 pl-4 font-bold text-sm sm:text-base focus:bg-background/80 transition-all"
                      placeholder="050-0000000"
                    />
                  </InputItem>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <InputItem label="כתובת אימייל">
                    <Input
                      disabled={readOnly}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="h-11 sm:h-13 bg-background/30 rounded-xl border-border/40 pl-4 font-bold text-sm sm:text-base focus:bg-background/80 transition-all"
                      placeholder="israel@example.com"
                    />
                  </InputItem>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <InputItem label="תאריך לידה">
                    <Input
                      disabled={readOnly}
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) =>
                        setFormData({ ...formData, birth_date: e.target.value })
                      }
                      className="h-11 sm:h-13 bg-background/30 rounded-xl border-border/40 pl-4 font-bold text-sm sm:text-base text-right focus:bg-background/80 transition-all"
                    />
                  </InputItem>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Section 2: Service & Identifiers */}
          <div className={cn(activeTab === "service" ? "block animate-in fade-in duration-200" : "hidden lg:block")}>
            <SectionCard icon={Settings2} title="פרטי שירות ומזהים">
              <div className="grid grid-cols-2 gap-3.5 sm:gap-6">
                <div className="col-span-1">
                  <InputItem label="שם משתמש" required>
                    <div className="relative group">
                      <Input
                        disabled={true}
                        value={formData.username || user?.username || ""}
                        className="h-11 sm:h-13 bg-background/30 rounded-xl border-border/40 pl-4 pr-10 font-bold text-sm sm:text-base opacity-70"
                        placeholder="username"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 text-primary">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </InputItem>
                </div>

                <div className="col-span-1">
                  <InputItem label="תאריך גיוס">
                    <Input
                      disabled={readOnly}
                      type="date"
                      value={formData.enlistment_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          enlistment_date: e.target.value,
                        })
                      }
                      className="h-11 sm:h-13 bg-background/30 rounded-xl border-border/40 pl-4 font-bold text-sm sm:text-base text-right focus:bg-background/80 transition-all"
                    />
                  </InputItem>
                </div>
              </div>

              {/* Organizational Context */}
              <div className="mt-6 pt-5 border-t border-border/40">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> שיוך ארגוני
                </h4>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <UnitBadge
                    label="מחלקה"
                    value={cleanUnitName(user?.department_name)}
                  />
                  <UnitBadge
                    label="מדור"
                    value={cleanUnitName(user?.section_name)}
                  />
                  <UnitBadge
                    label="חוליה"
                    value={cleanUnitName(user?.team_name)}
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Section 3: Emergency Contact */}
          <div className={cn(activeTab === "emergency" ? "block animate-in fade-in duration-200" : "hidden lg:block")}>
            <SectionCard icon={Heart} title="איש קשר לחירום">
              <div className="grid grid-cols-2 gap-3.5 sm:gap-6 text-right">
                <div className="col-span-2">
                  <InputItem label="שם מלא של איש הקשר">
                    <Input
                      disabled={readOnly}
                      value={emergencyDetails.name}
                      onChange={(e) =>
                        setEmergencyDetails({
                          ...emergencyDetails,
                          name: e.target.value,
                        })
                      }
                      className="h-11 sm:h-13 bg-background/30 rounded-xl border-border/40 pl-4 font-bold text-sm sm:text-base focus:bg-background/80 transition-all"
                      placeholder="לדוגמה: משה כהן"
                    />
                  </InputItem>
                </div>

                <div className="col-span-1">
                  <InputItem label="קרבה">
                    <select
                      disabled={readOnly}
                      value={emergencyDetails.relation}
                      onChange={(e) =>
                        setEmergencyDetails({
                          ...emergencyDetails,
                          relation: e.target.value,
                        })
                      }
                      className="w-full h-11 sm:h-13 bg-background/30 rounded-xl border border-border/40 px-3 font-bold text-sm sm:text-base appearance-none cursor-pointer focus:bg-background/80 transition-all outline-none"
                    >
                      <option value="">בחר קרבה...</option>
                      {relations.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </InputItem>
                </div>

                <div className="col-span-1">
                  <InputItem label="מספר טלפון לחירום">
                    <div className="relative group">
                      <Input
                        disabled={readOnly}
                        value={emergencyDetails.phone}
                        onChange={(e) =>
                          setEmergencyDetails({
                            ...emergencyDetails,
                            phone: e.target.value,
                          })
                        }
                        className="h-11 sm:h-13 bg-background/30 rounded-xl border-border/40 pl-4 pr-10 font-bold text-sm sm:text-base focus:bg-background/80 transition-all"
                        placeholder="05X-XXXXXXX"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-red-500/10 text-red-600">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </InputItem>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Section 4: Biometrics */}
          <div className={cn(activeTab === "biometrics" ? "block animate-in fade-in duration-200" : "hidden lg:block")}>
            {!readOnly && (
              <SectionCard
                icon={Fingerprint}
                title="כניסה ביומטרית וזיהוי פנים"
                badge={
                  biometricRegistered ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                      <CheckCircle2 className="w-3 h-3" /> מופעל
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-black text-muted-foreground bg-muted/40 border border-border/40 rounded-full px-2.5 py-1">
                      <ShieldOff className="w-3 h-3" /> לא מופעל
                    </span>
                  )
                }
              >
                <div className="flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Fingerprint className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-foreground">כניסה מהירה ומאובטחת</p>
                      <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                        מאפשר להתחבר למערכת באמצעות טביעת אצבע, זיהוי פנים או קוד PIN, ללא צורך בהקשת סיסמה בכל פעם.
                      </p>
                    </div>
                  </div>

                  {biometricRegistered ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        המכשיר שלך רשום לכניסה מהירה.
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveBiometric}
                        className="w-full h-12 rounded-xl border-red-500/20 bg-red-500/5 text-red-600 hover:bg-red-500/10 font-black text-sm gap-2"
                      >
                        <ShieldOff className="w-4 h-4" />
                        בטל כניסה מהירה במכשיר זה
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!showPinSetup ? (
                        <>
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider pr-1">
                              אימות סיסמה להפעלה
                            </Label>
                            <div className="relative">
                              <Input
                                type={showBioPassword ? "text" : "password"}
                                placeholder="הזן את סיסמת המערכת שלך"
                                value={biometricPassword}
                                onChange={(e) => { setBiometricPassword(e.target.value); setBiometricError(""); }}
                                className="h-12 rounded-xl border-border/40 bg-background/40 font-bold pr-4 pl-12"
                              />
                              <button
                                type="button"
                                onClick={() => setShowBioPassword(v => !v)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showBioPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {biometricError && (
                            <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs font-bold">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              {biometricError}
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-3 mt-2">
                            <Button
                              type="button"
                              onClick={handleRegisterBiometricsOnly}
                              disabled={biometricLoading || !biometricPassword}
                              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm gap-2"
                            >
                              {biometricLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Fingerprint className="w-4 h-4" />
                              )}
                              רשום ביומטרי (טביעת אצבע)
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleVerifyPassword}
                              disabled={biometricLoading || !biometricPassword}
                              className="flex-1 h-12 rounded-xl border-primary/20 hover:bg-primary/5 font-black text-sm gap-2 text-primary"
                            >
                              {biometricLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-4 h-4" />
                              )}
                              הגדר קוד PIN לגיבוי
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-blue-600 text-[11px] font-bold leading-relaxed">
                            כעת הגדר קוד PIN לגיבוי. בפעם הבאה שתתחבר, תוכל להשתמש גם בזיהוי ביומטרי של המכשיר.
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider pr-1 text-center block">
                                קוד PIN
                              </Label>
                              <Input
                                type="password"
                                inputMode="numeric"
                                placeholder="4-6 ספרות"
                                value={newPin}
                                onChange={(e) => { 
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  setNewPin(val); 
                                  setBiometricError(""); 
                                }}
                                className="h-12 rounded-xl border-border/40 bg-background/40 font-mono tracking-widest text-center text-xl"
                                maxLength={6}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider pr-1 text-center block">
                                אימות קוד
                              </Label>
                              <Input
                                type="password"
                                inputMode="numeric"
                                placeholder="חזור על הקוד"
                                value={confirmPin}
                                onChange={(e) => { 
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  setConfirmPin(val); 
                                  setBiometricError(""); 
                                }}
                                className="h-12 rounded-xl border-border/40 bg-background/40 font-mono tracking-widest text-center text-xl"
                                maxLength={6}
                              />
                            </div>
                          </div>

                          {biometricError && (
                            <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs font-bold">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              {biometricError}
                            </div>
                          )}

                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowPinSetup(false);
                                setNewPin("");
                                setConfirmPin("");
                                setBiometricError("");
                              }}
                              className="flex-1 h-12 rounded-xl font-black text-sm"
                            >
                              ביטול
                            </Button>
                            <Button
                              type="button"
                              onClick={handleCreatePin}
                              disabled={biometricLoading || !newPin || !confirmPin}
                              className="flex-2 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm gap-2"
                            >
                              {biometricLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              הפעל כניסה מהירה
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>
            )}
          </div>

          {!readOnly && (
            <div className="flex justify-end pt-2 sm:pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-12 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md bg-primary text-primary-foreground"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent animate-spin rounded-full ml-3" />
                ) : (
                  <Save className="w-5 h-5 ml-3" />
                )}
                שמור שינויים במערכת
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Uniform UI Components for Settings ---

function SectionCard({ title, children, badge, icon: Icon }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-border/40 overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4 border-b border-border/40 bg-slate-500/[0.02]">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-4.5 h-4.5 text-primary shrink-0" />}
          <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className="p-3 sm:p-6">{children}</div>
    </motion.div>
  );
}

function InputItem({ label, required, children }: any) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Label className="flex items-center gap-1 text-[11px] text-muted-foreground font-black uppercase tracking-widest pl-1">
        {label}
        {required && <span className="text-rose-500/80 mr-0.5">*</span>}
      </Label>
      <div className="relative">{children}</div>
    </div>
  );
}

function UnitBadge({ label, value }: any) {
  return (
    <div className="p-3 rounded-xl bg-primary/[0.03] border border-border/30 text-center">
      <span className="text-[10px] font-black text-primary/50 block mb-1.5 uppercase tracking-widest leading-none">
        {label}
      </span>
      <span className="font-bold text-xs sm:text-sm text-foreground block truncate">
        {value || "—"}
      </span>
    </div>
  );
}


