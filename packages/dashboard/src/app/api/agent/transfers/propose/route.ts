import { NextRequest } from 'next/server';
import { z } from 'zod';
import { keccak256, toBytes, encodeFunctionData } from 'viem';
import { withAgentAuth } from '@/lib/agent-api/auth';
import { requireAgent, listLinkedWallets, isLinkedWallet } from '@/lib/agent-api/context';
import { hasServerSigner, getServerSignerPrivateKey } from '@/lib/agent-api/env';
import { createServerPublicClient, createServerWalletClient } from '@/lib/agent-api/chain';
import { ok, fail, status } from '@/lib/agent-api/response';
import { agentWalletAbi } from '@agentos/sdk';
import type { Address } from 'viem';

const ZERO = '0x0000000000000000000000000000000000000000' as const;

const bodySchema = z.object({
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  token: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().min(1),
  context: z.record(z.unknown()).optional(),
});

function computeContextHash(context: Record<string, unknown> | undefined): `0x${string}` {
  const json = JSON.stringify(context ?? {});
  return keccak256(toBytes(json)) as `0x${string}`;
}

/**
 * POST /api/agent/transfers/propose — Lexa asks AgentOS to create a governed-wallet proposal.
 * Auth required. wallet_address must be linked to agent.
 * If AGENTOS_SERVER_SIGNER_PRIVATE_KEY is set: server signs and submits (mode: "submitted").
 * Else: returns prepared calldata for client to submit (mode: "prepared").
 */
export async function POST(req: NextRequest) {
  const auth = await withAgentAuth(req);
  if (auth instanceof Response) return auth;
  const { address, bodyText } = auth;
  let body: unknown = {};
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    return fail('VALIDATION_ERROR', 'invalid JSON body', undefined, status.badRequest);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return fail('VALIDATION_ERROR', 'invalid body', parsed.error.flatten(), status.badRequest);
  }
  const { wallet_address, to, amount, token, context } = parsed.data;
  const amountBigInt = BigInt(amount);
  const contextHash = computeContextHash(context);
  const walletAddress = wallet_address as Address;
  const toAddress = to as Address;
  const tokenAddress = (token === ZERO ? '0x0000000000000000000000000000000000000000' : token) as Address;

  try {
    const agent = await requireAgent(address);
    if (agent instanceof Response) return agent;
    const wallets = await listLinkedWallets(agent.id);
    if (!isLinkedWallet(wallets, wallet_address)) {
      return fail('VALIDATION_ERROR', 'wallet_address must be a linked wallet for this agent', undefined, status.badRequest);
    }

    if (hasServerSigner()) {
      const pk = getServerSignerPrivateKey();
      if (!pk || !/^0x[a-fA-F0-9]{64}$/.test(pk)) {
        return fail('CONFIG_ERROR', 'invalid AGENTOS_SERVER_SIGNER_PRIVATE_KEY', undefined, status.serverError);
      }
      const publicClient = createServerPublicClient();
      const walletClient = createServerWalletClient(pk as `0x${string}`);
      const txHash = await walletClient.writeContract({
        address: walletAddress,
        abi: agentWalletAbi as readonly unknown[],
        functionName: 'proposeTransfer',
        args: [toAddress, amountBigInt, tokenAddress, contextHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      const proposalCounter = (await publicClient.readContract({
        address: walletAddress,
        abi: agentWalletAbi as readonly unknown[],
        functionName: 'proposalCounter',
      })) as bigint;
      return ok({
        mode: 'submitted' as const,
        proposalId: String(proposalCounter),
        txHash,
      });
    }

    const calldata = encodeFunctionData({
      abi: agentWalletAbi as readonly unknown[],
      functionName: 'proposeTransfer',
      args: [toAddress, amountBigInt, tokenAddress, contextHash],
    });
    return ok({
      mode: 'prepared' as const,
      contractAddress: wallet_address,
      calldata,
      functionName: 'proposeTransfer',
      args: { to: toAddress, amount, token: tokenAddress, contextHash },
      contextHash,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return fail('INTERNAL_ERROR', e instanceof Error ? e.message : 'unknown', undefined, status.serverError);
  }
}
