import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	AlertTriangle,
	HelpCircle,
	Mail,
	RefreshCw,
	Sparkles,
	Zap,
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { APP_NAME } from "@/config/brand";

export function HomepagePlaceholder() {
	return (
		<div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800 flex items-center justify-center p-4">
			{/* Fancy animated background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-400/15 to-gray-600/15 rounded-full blur-3xl animate-pulse" />
				<div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-gray-300/15 to-gray-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
				<div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-br from-gray-200/20 to-gray-400/20 rounded-full blur-2xl animate-bounce delay-500" />
				<div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-gray-100/20 to-gray-300/20 rounded-full blur-2xl animate-bounce delay-700" />
			</div>

			{/* Floating sparkle elements */}
			<div className="absolute inset-0 pointer-events-none">
				<Sparkles className="absolute top-1/4 left-1/6 h-4 w-4 text-gray-400/60 animate-pulse delay-300" />
				<Sparkles className="absolute top-2/3 right-1/5 h-3 w-3 text-gray-500/60 animate-pulse delay-700" />
				<Sparkles className="absolute bottom-1/4 left-2/5 h-5 w-5 text-gray-300/60 animate-pulse delay-1000" />
				<Zap className="absolute top-1/3 right-1/3 h-4 w-4 text-gray-600/60 animate-pulse delay-500" />
			</div>

			<div className="w-full max-w-lg mx-auto relative z-10">
				<div className="text-center space-y-10 animate-in fade-in-0 slide-in-from-bottom-8 duration-1000">
					<div className="flex justify-center">
						<AppLogo variant="lockup" theme="dark" size={40} />
					</div>
					{/* Icon Section */}
					<div className="flex justify-center">
						<div className="relative group">
							<div className="absolute inset-0 bg-muted/20 rounded-full blur-3xl animate-pulse opacity-40" />
							<div className="relative bg-muted/30 p-12 rounded-full border border-border/40 shadow-sm group-hover:shadow-md transition-all duration-500">
								<AlertTriangle className="h-16 w-16 text-destructive group-hover:scale-110 transition-transform duration-500 relative z-10" />
							</div>
						</div>
					</div>

					<div className="space-y-6">
						<h1 className="text-5xl font-black bg-gradient-to-r from-black via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent animate-pulse drop-shadow-sm">
							Build Error
						</h1>
						<div className="relative">
							<p className="text-xl text-gray-800 dark:text-gray-200 leading-relaxed max-w-md mx-auto font-medium backdrop-blur-sm bg-white/20 dark:bg-gray-800/20 rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
								There are some issues while building {APP_NAME}. Don&apos;t worry, we
								can fix this together.
							</p>
						</div>
					</div>

					{/* Ultra Enhanced Info Cards with glassmorphism */}
					<div className="bg-gradient-to-br from-white/60 via-white/40 to-white/20 dark:from-gray-800/60 dark:via-gray-900/40 dark:to-black/20 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-2xl backdrop-blur-xl space-y-6">
						{/* Rebuild card with enhanced effects */}
						<div className="group flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50/80 via-white/80 to-gray-100/80 dark:from-gray-800/50 dark:via-gray-900/50 dark:to-black/50 border border-gray-300/50 dark:border-gray-600/50 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
							<div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700/70 dark:to-gray-800/70 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
								<RefreshCw className="h-6 w-6 text-gray-700 dark:text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
							</div>
							<span className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
								Try to rebuild the app again
							</span>
						</div>

						{/* Help section with enhanced styling */}
						<div className="space-y-4">
							<div className="group flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-100/80 via-white/80 to-gray-50/80 dark:from-gray-700/50 dark:via-gray-800/50 dark:to-gray-900/50 border border-gray-300/50 dark:border-gray-600/50 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
								<div className="p-3 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600/70 dark:to-gray-700/70 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
									<HelpCircle className="h-6 w-6 text-gray-700 dark:text-gray-300 group-hover:rotate-12 transition-transform duration-300" />
								</div>
								<span className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
									Need help? We're here for you!
								</span>
							</div>

							{/* Support links with muted styling */}
							<div className="flex items-center justify-center gap-8 pt-2">
								<a
									href="https://discord.gg/VPNExXcP9W"
									target="_blank"
									rel="noopener noreferrer"
									className="group flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all duration-200"
								>
									<FontAwesomeIcon
										icon={faDiscord}
										className="h-5 w-5"
									/>
									<span>Discord Community</span>
								</a>
								<a
									href="mailto:hello@steward.app"
									className="group flex items-center gap-3 px-4 py-3 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-all duration-200"
								>
									<Mail className="h-5 w-5" />
									<span>{APP_NAME} Support</span>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
