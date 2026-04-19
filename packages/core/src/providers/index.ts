import type { ProviderAdapter } from "./base";

export const providerRegistry: Record<string, ProviderAdapter> = {};

export function registerProvider(adapter: ProviderAdapter) {
  providerRegistry[adapter.provider] = adapter;
}

export function getProviderAdapter(provider: string) {
  return providerRegistry[provider];
}

export * from "./base";
