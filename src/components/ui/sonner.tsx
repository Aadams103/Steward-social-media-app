import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	let theme = "system";
	try {
		const themeHook = useTheme();
		theme = themeHook?.theme || "system";
	} catch (error) {
		// ThemeProvider not set up, use default
		console.warn("[Toaster] ThemeProvider not found, using default theme");
	}

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
