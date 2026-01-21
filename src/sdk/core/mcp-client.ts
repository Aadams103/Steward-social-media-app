/**
 * MCP Client for making MCP calls with automatic reporting to parent window
 * Reports all MCP requests and responses to the parent window via postMessage
 *
 * IMPORTANT: MCP tools return wrapped responses in MCPToolResponse format
 * Use callMCPTool<MCPToolResponse, InputParams>() and parse content[0].text JSON
 */

import { MCP_SERVERS, type McpServerId } from "../constants/mcp-server";
import { getAuthTokenAsync, isAuthenticatedSync } from "./auth";
import { APP_CONFIG } from "./global";
import { platformRequest } from "./request";

const API_BASE_PATH = import.meta.env.VITE_MCP_API_BASE_PATH;

export interface MCPRequest {
	jsonrpc: "2.0";
	id: string;
	method: string;
	params?: unknown;
}

export interface MCPResponse {
	jsonrpc: "2.0";
	id: string;
	result?: unknown;
	error?: {
		code: number;
		message: string;
		data?: unknown;
	};
}

/**
 * Standard MCP tool response format that wraps actual tool data
 * CRITICAL: MCP tools return data wrapped in content[0].text as JSON string
 */
export interface MCPToolResponse {
	content: Array<{
		type: "text";
		text: string; // JSON string containing actual tool data
	}>;
}

/**
 * Make a raw MCP call
 */
async function internalCallService(
	serverUrl: string,
	mcpId: string,
	request: MCPRequest,
	transportType = "streamable_http",
): Promise<unknown> {
	// #region agent log
	fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-client.ts:48',message:'MCP call start',data:{mcpId,method:request.method},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'C'})}).catch(()=>{});
	// #endregion
	const token = await getAuthTokenAsync();
	const isAuthenticated = isAuthenticatedSync();

	// #region agent log
	fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-client.ts:55',message:'MCP auth check',data:{hasToken:!!token,isAuthenticated},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'C'})}).catch(()=>{});
	// #endregion
	if (!isAuthenticated) {
		// #region agent log
		fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-client.ts:58',message:'MCP call failed - not authenticated',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'C'})}).catch(()=>{});
		// #endregion
		throw new Error("User not authenticated");
	}

	try {
		// Build headers object, conditionally adding task and project IDs when they're not null
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			"X-MCP-ID": mcpId,
		};

		const { taskId, projectId } = APP_CONFIG;
		if (taskId) headers["X-API-TASK-ID"] = taskId;
		if (projectId) headers["X-API-PROJECT-ID"] = projectId;

		const response = await platformRequest("/execute-mcp/v2", {
			method: "POST",
			headers,
			body: JSON.stringify({
				transportType,
				serverUrl,
				request,
			}),
		});

		// #region agent log
		fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-client.ts:83',message:'MCP response received',data:{ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'C'})}).catch(()=>{});
		// #endregion
		if (!response.ok) {
			const errorMessage = `HTTP error! status: ${response.status}`;
			// #region agent log
			fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-client.ts:85',message:'MCP response error',data:{status:response.status,errorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'C'})}).catch(()=>{});
			// #endregion
			throw new Error(errorMessage);
		}

		const data: MCPResponse = await response.json();

		if (data.error) {
			const errorMessage = data.error.message || "MCP request failed";
			// #region agent log
			fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-client.ts:92',message:'MCP data error',data:{errorMessage,errorCode:data.error.code},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'C'})}).catch(()=>{});
			// #endregion
			throw new Error(errorMessage);
		}

		// #region agent log
		fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-client.ts:95',message:'MCP call success',data:{hasResult:!!data.result},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'C'})}).catch(()=>{});
		// #endregion
		return data.result;
	} catch (error) {
		// Log error but don't report to parent window (legacy integration removed)
		if (error instanceof Error) {
			// #region agent log
			fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mcp-client.ts:99',message:'MCP call exception',data:{error:error.message,method:request.method},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'C'})}).catch(()=>{});
			// #endregion
			console.error("MCP request error:", {
				message: error.message,
				serverUrl,
				method: request.method,
				params: request.params,
				url: `${API_BASE_PATH}/execute-mcp/v2`,
				transportType,
			});
		}
		throw error;
	}
}

/**
 * List available tools from an MCP server
 * @param serverUrl - MCP server URL
 * @param mcpId - MCP server ID
 * @returns Promise with list of available tools
 */
export async function listMCPTools(
	mcpId: McpServerId,
): Promise<unknown> {
	const { url, id } = MCP_SERVERS[mcpId] || findServerByUrl(mcpId);
	return internalCallService(url, id, {
		jsonrpc: "2.0",
		id: `list-tools-${Date.now()}`,
		method: "tools/list",
	});
}

/**
 * Call a specific tool on an MCP server
 * @param serverUrl - MCP server URL
 * @param mcpId - MCP server ID
 * @param toolName - Name of the tool to call
 * @param args - Arguments to pass to the tool
 * @returns Promise with tool execution result
 *
 * @example
 * // For tools that return MCPToolResponse, parse the content
 * const response = await callMCPTool<MCPToolResponse>(
 *   serverUrl,
 *   mcpId,
 *   "my-tool",
 *   { arg1: "value1" }
 * );
 * const actualData = JSON.parse(response.content[0].text);
 */
export async function callMCPTool<
	TOutput = unknown,
	TInput = Record<string, unknown>,
>(
	mcpId: McpServerId,
	toolName: string,
	args: TInput,
): Promise<TOutput> {
	const { url, id } = MCP_SERVERS[mcpId] || findServerByUrl(mcpId);
	return internalCallService(url, id, {
		jsonrpc: "2.0",
		id: `call-tool-${Date.now()}`,
		method: "tools/call",
		params: {
			name: toolName,
			arguments: args,
		},
	}) as Promise<TOutput>;
}

// back compatibility for old server-prompt format
function findServerByUrl(expected: string) {
	const lowerExpected = expected.toLowerCase().trim();
	const items = Object.values(MCP_SERVERS) as { url: string, name: string, id: string }[]
	for (const item of items) {
		if (
			item.url.toLowerCase().trim() === lowerExpected ||
			item.id.toLowerCase().trim() === lowerExpected ||
			item.name.toLowerCase() === lowerExpected
		) {
			return item;
		}
	}
	throw new Error(`Server not found for URL: ${expected}`);
}
