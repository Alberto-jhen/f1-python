import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "#22c55e",
          "--success-text": "#ffffff",
          "--success-border": "#16a34a",
          "--error-bg": "#ef4444",
          "--error-text": "#ffffff",
          "--error-border": "#dc2626",
          "--warning-bg": "#f59e0b",
          "--warning-text": "#ffffff",
          "--warning-border": "#d97706",
          "--info-bg": "#3b82f6",
          "--info-text": "#ffffff",
          "--info-border": "#2563eb",
          "--border-radius": "var(--radius)"
        }
      }
      {...props} />
  );
}

export { Toaster }
