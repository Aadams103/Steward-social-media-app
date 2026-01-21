import { initializeAuthIntegration } from "./auth";

// Parse URL and set global variables
declare global {
	interface Window {
		APP_CONFIG: GlobalAppConfig;
	}
}

export const APP_CONFIG = initializeAppConfig();

function initializeAppConfig() {
	// #region agent log
	fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'global.ts:12',message:'Config initialization start',data:{currentUrl:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'init',hypothesisId:'A'})}).catch(()=>{});
	// #endregion
	const config = parseCurrentUrl();
	window.APP_CONFIG = config;

	// #region agent log
	fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'global.ts:15',message:'Config parsed',data:{userId:config.userId,projectId:config.projectId,taskId:config.taskId,isValidBuildUrl:config.isValidBuildUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'init',hypothesisId:'A'})}).catch(()=>{});
	// #endregion
	console.log("App Configuration:", {
		userId: config.userId,
		projectId: config.projectId,
		taskId: config.taskId,
		workspaceId: config.workspaceId,
		uploadFolder: config.uploadFolder,
		baseUrl: config.baseUrl,
		isValidBuildUrl: config.isValidBuildUrl,
		currentUrl: window.location.href,
	});

	Promise.resolve().then(() => {
		// #region agent log
		fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'global.ts:28',message:'Auth integration init start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'init',hypothesisId:'A'})}).catch(()=>{});
		// #endregion
		initializeAuthIntegration();
	});

	return config;
}

interface GlobalAppConfig {
	userId: string | null;
	projectId: string | null;
	taskId: string | null;
	workspaceId: string | null; // Combined projectId-taskId
	uploadFolder: string | null; // Upload folder path
	baseUrl: string | null;
	isValidBuildUrl: boolean;
}

function parseCurrentUrl(): GlobalAppConfig {
	const currentUrl = window.location.href;

	// Pattern: {base_url}/builds/{userId}/{projectId}/{taskId}/dist
	const buildUrlRegex =
		/^(https?:\/\/[^\/]+)\/builds\/([^\/]+)\/([^\/]+)\/([^\/]+)\/dist/;
	const match = currentUrl.match(buildUrlRegex);

	if (match) {
		const [, baseUrl, userId, projectId, taskId] = match;
		const workspaceId = `${projectId}-${taskId}`;
		return {
			userId,
			projectId,
			taskId,
			workspaceId,
			uploadFolder: "resources",
			baseUrl,
			isValidBuildUrl: true,
		};
	}

	// If not a build URL, return nulls
	return {
		userId: null,
		projectId: null,
		taskId: null,
		workspaceId: null,
		uploadFolder: null,
		baseUrl: null,
		isValidBuildUrl: false,
	};
}
