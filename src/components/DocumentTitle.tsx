import { useLocation } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { APP_NAME, APP_SHORT_TAGLINE } from "@/config/brand";

const TITLE_MAP: Record<string, string> = {
	"/": `${APP_NAME} — Home`,
	"/product": `${APP_NAME} — Product`,
	"/how-it-works": `${APP_NAME} — How it Works`,
	"/pricing": `${APP_NAME} — Pricing`,
	"/security-privacy": `${APP_NAME} — Security & Privacy`,
	"/docs": `${APP_NAME} — Docs`,
	"/contact": `${APP_NAME} — Contact`,
	"/app": `${APP_NAME} — Dashboard`,
};

const DEFAULT_TITLE = `${APP_NAME} — ${APP_SHORT_TAGLINE}`;

export function DocumentTitle() {
	const { pathname } = useLocation();
	const title = useMemo(() => {
		const base = pathname.replace(/\/$/, "") || "/";
		return TITLE_MAP[base] ?? DEFAULT_TITLE;
	}, [pathname]);

	useEffect(() => {
		document.title = title;
	}, [title]);

	return null;
}
