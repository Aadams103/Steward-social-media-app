import {
	BookOpen,
	CircleDot,
	Facebook,
	Instagram,
	Linkedin,
	MessageSquare,
	Music,
	Pin,
} from "lucide-react";
import type { Platform } from "@/types/app";

export function PlatformIcon({
	platform,
	className,
}: {
	platform: Platform;
	className?: string;
}) {
	switch (platform) {
		case "facebook":
			return <Facebook className={className} />;
		case "instagram":
			return <Instagram className={className} />;
		case "linkedin":
			return <Linkedin className={className} />;
		case "tiktok":
			return <Music className={className} />;
		case "pinterest":
			return <Pin className={className} />;
		case "reddit":
			return <CircleDot className={className} />;
		case "slack":
			return <MessageSquare className={className} />;
		case "notion":
			return <BookOpen className={className} />;
		default:
			return <CircleDot className={className} />;
	}
}
