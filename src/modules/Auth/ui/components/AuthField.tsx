import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/** Labelled input with an inline error; `type="password"` gets a show/hide toggle. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, type = "text", className, ...props }, ref) => {
    const id = useId();
    const [visible, setVisible] = useState(false);
    const isPassword = type === "password";

    return (
      <div className="space-y-2.5">
        <Label htmlFor={id} className="block text-start leading-normal">{label}</Label>
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            type={isPassword && visible ? "text" : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn("placeholder:text-muted-foreground", isPassword && "pe-10", className)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={label}
              aria-pressed={visible}
              className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          )}
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);
AuthField.displayName = "AuthField";
