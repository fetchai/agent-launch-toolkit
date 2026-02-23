export interface TokenListResponse {
  tokens: TokenSummary[];
  total: number;
  hasMore: boolean;
}

export interface TokenSummary {
  id: number;
  name: string;
  symbol: string;
  address: string | null;
  status: "pending" | "bonding" | "listed";
  price: string;
  marketCap: string;
  progress: number;
  chainId: number;
  createdAt: string;
}

export interface TokenDetails extends TokenSummary {
  description: string;
  logo: string;
  category: { id: number; name: string };
  creator: { address: string };
  bondingCurve: {
    currentPrice: string;
    totalRaised: string;
    targetLiquidity: string;
    progress: number;
    tokensRemaining: string;
    priceAtTarget: string;
  };
  stats: {
    holders: number;
    transactions: number;
    volume24h: string;
  };
  links: {
    platform: string;
    explorer: string;
    dex: string | null;
  };
}

export interface CalculateBuyResponse {
  tokensReceived: string;
  pricePerToken: string;
  priceImpact: number;
  fee: string;
  netFetSpent: string;
}

export interface CalculateSellResponse {
  fetReceived: string;
  pricePerToken: string;
  priceImpact: number;
  fee: string;
  netFetReceived: string;
}

export interface PlatformStats {
  totalTokens: number;
  totalVolume: string;
  volume24h: string;
  tokensListed: number;
  activeUsers: number;
  trending: Array<{
    name: string;
    symbol: string;
    address: string;
    volume24h: string;
  }>;
}

export interface CreateTokenResponse {
  tokenId: number;
  handoffLink: string;
  expiresAt: string;
}
