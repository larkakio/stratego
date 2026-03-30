import { Attribution } from "ox/erc8021";
import type { Hex } from "viem";

/** ERC-8021 suffix for Builder Code attribution on writeContract calls. */
export function getBuilderDataSuffix(): Hex | undefined {
  const override = process.env.NEXT_PUBLIC_BUILDER_CODE_SUFFIX;
  if (override?.startsWith("0x") && override.length > 2) {
    return override as Hex;
  }
  const code = process.env.NEXT_PUBLIC_BUILDER_CODE?.trim();
  if (!code) return undefined;
  return Attribution.toDataSuffix({ codes: [code] }) as Hex;
}
