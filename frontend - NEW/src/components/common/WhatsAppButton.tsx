import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { cn, getWhatsAppUrl } from "@/lib/utils";
import { toast } from "sonner";

interface WhatsAppButtonProps extends React.ComponentProps<typeof Button> {
    message?: string; // The text message to send
    phoneNumber?: string; // Target phone number (optional)
    label?: string; // Button text
    isLoading?: boolean;
    onBeforeSend?: () => Promise<void> | void; // Callback before opening WA
    skipDirectLink?: boolean; // If true, only executes onClick/onBeforeSend (for custom handling)
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
    message = "",
    phoneNumber = "",
    label = "",
    isLoading = false,
    className,
    onBeforeSend,
    skipDirectLink = false,
    onClick,
    disabled,
    variant,
    size,
    ...props
}) => {

    const handleSend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (onClick) {
            onClick(e);
        }

        if (onBeforeSend) {
            await onBeforeSend();
        }

        if (skipDirectLink) return;

        try {
            const url = getWhatsAppUrl(phoneNumber, message);

            if (message) {
                try {
                    await navigator.clipboard.writeText(message);
                } catch (err) {
                    console.error("Clipboard copy failed", err);
                }
            }

            window.open(url, "_blank", "noopener,noreferrer");
            toast.success("טוען צ'אט לוואטסאפ...", { duration: 1500 });

        } catch (error) {
            console.error("WhatsApp Error:", error);
            toast.error("שגיאה בפתיחת וואטסאפ");
        }
    };

    const isCustomVariant = variant && variant !== "default";
    const defaultClasses = cn(
        "bg-[#25D366] hover:bg-[#128C7E] text-white font-bold transition-all active:scale-95 ",
        label ? "rounded-xl gap-2 px-4 h-10" : "rounded-full w-9 h-9 flex items-center justify-center p-0"
    );

    return (
        <Button
            onClick={handleSend}
            disabled={disabled || isLoading}
            variant={variant}
            size={size || (label ? "default" : "icon")}
            className={cn(
                !isCustomVariant && defaultClasses,
                className
            )}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <FaWhatsapp className={cn("shrink-0", label ? "w-5 h-5" : "w-5.5 h-5.5")} />
            )}
            {label && <span>{label}</span>}
        </Button>
    );
};
