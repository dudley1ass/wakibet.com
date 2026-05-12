/**
 * Starter eligible universe for the Invest sport's Weekly Stock Pick'em.
 *
 * This is a hand-curated set of well-known US large-cap stocks + broad ETFs.
 * It is intentionally small while we evaluate the market-data API and stand up
 * a real symbol catalog. Excluded by design: OTC, sub-$5 names, leveraged /
 * inverse ETFs, and crypto.
 */

import type { InvestAssetType } from "./weeklyPickemContest.js";

export type InvestEligibleAsset = {
  symbol: string;
  name: string;
  asset_type: InvestAssetType;
  sector: string;
};

export const INVEST_ELIGIBLE_UNIVERSE_STARTER: ReadonlyArray<InvestEligibleAsset> = [
  // Mega-cap tech
  { symbol: "AAPL", name: "Apple Inc.", asset_type: "stock", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corp.", asset_type: "stock", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc. Class A", asset_type: "stock", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", asset_type: "stock", sector: "Consumer Discretionary" },
  { symbol: "META", name: "Meta Platforms Inc.", asset_type: "stock", sector: "Communication Services" },
  { symbol: "NVDA", name: "NVIDIA Corp.", asset_type: "stock", sector: "Technology" },
  { symbol: "TSLA", name: "Tesla Inc.", asset_type: "stock", sector: "Consumer Discretionary" },
  { symbol: "AVGO", name: "Broadcom Inc.", asset_type: "stock", sector: "Technology" },
  { symbol: "ORCL", name: "Oracle Corp.", asset_type: "stock", sector: "Technology" },
  { symbol: "ADBE", name: "Adobe Inc.", asset_type: "stock", sector: "Technology" },
  { symbol: "CRM", name: "Salesforce Inc.", asset_type: "stock", sector: "Technology" },
  { symbol: "AMD", name: "Advanced Micro Devices Inc.", asset_type: "stock", sector: "Technology" },
  { symbol: "INTC", name: "Intel Corp.", asset_type: "stock", sector: "Technology" },
  { symbol: "NFLX", name: "Netflix Inc.", asset_type: "stock", sector: "Communication Services" },
  // Financials
  { symbol: "JPM", name: "JPMorgan Chase & Co.", asset_type: "stock", sector: "Financials" },
  { symbol: "BAC", name: "Bank of America Corp.", asset_type: "stock", sector: "Financials" },
  { symbol: "WFC", name: "Wells Fargo & Co.", asset_type: "stock", sector: "Financials" },
  { symbol: "GS", name: "Goldman Sachs Group Inc.", asset_type: "stock", sector: "Financials" },
  { symbol: "MS", name: "Morgan Stanley", asset_type: "stock", sector: "Financials" },
  { symbol: "V", name: "Visa Inc.", asset_type: "stock", sector: "Financials" },
  { symbol: "MA", name: "Mastercard Inc.", asset_type: "stock", sector: "Financials" },
  { symbol: "BRK.B", name: "Berkshire Hathaway Class B", asset_type: "stock", sector: "Financials" },
  // Healthcare
  { symbol: "LLY", name: "Eli Lilly & Co.", asset_type: "stock", sector: "Healthcare" },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", asset_type: "stock", sector: "Healthcare" },
  { symbol: "JNJ", name: "Johnson & Johnson", asset_type: "stock", sector: "Healthcare" },
  { symbol: "PFE", name: "Pfizer Inc.", asset_type: "stock", sector: "Healthcare" },
  { symbol: "MRK", name: "Merck & Co. Inc.", asset_type: "stock", sector: "Healthcare" },
  { symbol: "ABBV", name: "AbbVie Inc.", asset_type: "stock", sector: "Healthcare" },
  // Industrials / Energy
  { symbol: "XOM", name: "Exxon Mobil Corp.", asset_type: "stock", sector: "Energy" },
  { symbol: "CVX", name: "Chevron Corp.", asset_type: "stock", sector: "Energy" },
  { symbol: "COP", name: "ConocoPhillips", asset_type: "stock", sector: "Energy" },
  { symbol: "CAT", name: "Caterpillar Inc.", asset_type: "stock", sector: "Industrials" },
  { symbol: "BA", name: "Boeing Co.", asset_type: "stock", sector: "Industrials" },
  { symbol: "GE", name: "GE Aerospace", asset_type: "stock", sector: "Industrials" },
  { symbol: "UBER", name: "Uber Technologies Inc.", asset_type: "stock", sector: "Industrials" },
  // Consumer
  { symbol: "WMT", name: "Walmart Inc.", asset_type: "stock", sector: "Consumer Staples" },
  { symbol: "COST", name: "Costco Wholesale Corp.", asset_type: "stock", sector: "Consumer Staples" },
  { symbol: "PG", name: "Procter & Gamble Co.", asset_type: "stock", sector: "Consumer Staples" },
  { symbol: "KO", name: "Coca-Cola Co.", asset_type: "stock", sector: "Consumer Staples" },
  { symbol: "PEP", name: "PepsiCo Inc.", asset_type: "stock", sector: "Consumer Staples" },
  { symbol: "HD", name: "Home Depot Inc.", asset_type: "stock", sector: "Consumer Discretionary" },
  { symbol: "MCD", name: "McDonald's Corp.", asset_type: "stock", sector: "Consumer Discretionary" },
  { symbol: "NKE", name: "Nike Inc.", asset_type: "stock", sector: "Consumer Discretionary" },
  { symbol: "DIS", name: "Walt Disney Co.", asset_type: "stock", sector: "Communication Services" },
  // Broad ETFs
  { symbol: "SPY", name: "SPDR S&P 500 ETF", asset_type: "etf", sector: "Broad Market" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", asset_type: "etf", sector: "Broad Market" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", asset_type: "etf", sector: "Broad Market" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF", asset_type: "etf", sector: "Broad Market" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", asset_type: "etf", sector: "Broad Market" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", asset_type: "etf", sector: "Broad Market" },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund", asset_type: "etf", sector: "Financials" },
  { symbol: "XLE", name: "Energy Select Sector SPDR Fund", asset_type: "etf", sector: "Energy" },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund", asset_type: "etf", sector: "Technology" },
  { symbol: "XLV", name: "Health Care Select Sector SPDR Fund", asset_type: "etf", sector: "Healthcare" },
];
