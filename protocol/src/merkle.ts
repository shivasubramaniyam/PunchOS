/**
 * @punch/protocol — Merkle transparency-log primitives (RFC 6962 style).
 *
 * Isomorphic: uses WebCrypto SHA-256 (available in Node 19+, browsers,
 * and workers) so the same code verifies logs in the PWA, the dashboard,
 * and CI.
 */

import { MERKLE_LEAF_PREFIX, bytesToHex, leafToBytes, type PunchLeaf } from "./core";

const encoder = new TextEncoder();

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return new Uint8Array(digest);
}

export async function leafHash(leaf: Uint8Array): Promise<Uint8Array> {
  const prefixed = new Uint8Array(leaf.length + 1);
  prefixed[0] = MERKLE_LEAF_PREFIX;
  prefixed.set(leaf, 1);
  return sha256(prefixed);
}

export async function nodeHash(left: Uint8Array, right: Uint8Array): Promise<Uint8Array> {
  const buf = new Uint8Array(1 + left.length + right.length);
  buf[0] = 0x01;
  buf.set(left, 1);
  buf.set(right, 1 + left.length);
  return sha256(buf);
}

export interface MerkleTreeResult {
  root: string; // hex
  size: number;
  /** Inclusion path per leaf, as hex strings. */
  paths: string[][];
}

/** Build a Merkle tree over the leaves and compute inclusion paths. */
export async function merkleTree(leaves: PunchLeaf[]): Promise<MerkleTreeResult> {
  const paths: string[][] = leaves.map(() => []);
  if (leaves.length === 0) {
    return { root: bytesToHex(await sha256(new Uint8Array(0))), size: 0, paths };
  }

  let level = await Promise.all(leaves.map((l) => leafHash(leafToBytes(l))));
  // idxs[k] = index of leaf k's current node at this level.
  const idxs = leaves.map((_, i) => i);
  while (level.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : level[i]; // RFC 6962 odd rule
      next.push(await nodeHash(left, right));
    }
    for (let k = 0; k < leaves.length; k++) {
      const i = idxs[k];
      const siblingIdx = i % 2 === 0 ? i + 1 : i - 1;
      const sib = siblingIdx < level.length ? level[siblingIdx] : level[i]; // odd: itself
      paths[k].push(bytesToHex(sib));
      idxs[k] = Math.floor(i / 2);
    }
    level = next;
  }
  return { root: bytesToHex(level[0]), size: leaves.length, paths };
}

export interface SignedTreeHead {
  treeSize: number;
  rootHex: string;
  timestamp: string; // ISO
  /** Ed25519/CV P-256 signature over `${treeSize}|${rootHex}|${timestamp}` */
  signature: string;
  keyId: string;
}

/** Canonical signing input for a signed tree head. */
export function sthSigningInput(sth: Omit<SignedTreeHead, "signature">): Uint8Array {
  return encoder.encode(`${sth.treeSize}|${sth.rootHex}|${sth.timestamp}`);
}

export interface InclusionProof {
  index: number;
  treeSize: number;
  rootHex: string;
  path: string[]; // hex sibling hashes, bottom-up
}

/** Verify an inclusion proof for a leaf against a known signed tree head. */
export async function verifyInclusion(
  leaf: PunchLeaf,
  proof: InclusionProof
): Promise<boolean> {
  let h = await leafHash(leafToBytes(leaf));
  let idx = proof.index;
  for (const sibHex of proof.path) {
    const sib = hexToSibling(sibHex);
    if (idx % 2 === 0) {
      h = await nodeHash(h, sib);
    } else {
      h = await nodeHash(sib, h);
    }
    idx = Math.floor(idx / 2);
  }
  return bytesToHex(h) === proof.rootHex;
}

function hexToSibling(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** Convenience: build leaves + tree for a day's attendance. */
export async function buildDailyLog(leaves: PunchLeaf[]): Promise<MerkleTreeResult> {
  return merkleTree(leaves);
}
