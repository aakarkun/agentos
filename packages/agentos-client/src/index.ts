/**
 * @agentos/client — Node client for AgentOS Agent API (Eliza/Lexa integration).
 */

export { AgentOSClient, createAgentOSClient, type AgentOSClientConfig, type AgentApiResponse } from './client';
export { buildCanonicalMessage, signRequest, type SignedRequestParams } from './sign';
export { sha256Hex } from './crypto';
