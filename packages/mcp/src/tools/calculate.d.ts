import type { CalculateBuyResponse, CalculateSellResponse } from "../types/api.js";
/**
 * Calculate how many tokens would be received for a given FET spend amount.
 *
 * Calls GET /tokens/calculate-buy?address=...&fetAmount=...
 *
 * @param args.address   Token contract address
 * @param args.fetAmount Amount of FET to spend (as a decimal string, e.g. "100")
 */
export declare function calculateBuy(args: {
    address: string;
    fetAmount: string;
}): Promise<CalculateBuyResponse>;
/**
 * Calculate how much FET would be received for selling a given token amount.
 *
 * Calls GET /tokens/calculate-sell?address=...&tokenAmount=...
 *
 * @param args.address     Token contract address
 * @param args.tokenAmount Number of tokens to sell (as a decimal string, e.g. "500")
 */
export declare function calculateSell(args: {
    address: string;
    tokenAmount: string;
}): Promise<CalculateSellResponse>;
/** Handler map consumed by the tool dispatcher in index.ts. */
export declare const calculateHandlers: {
    calculate_buy: typeof calculateBuy;
    calculate_sell: typeof calculateSell;
};
//# sourceMappingURL=calculate.d.ts.map