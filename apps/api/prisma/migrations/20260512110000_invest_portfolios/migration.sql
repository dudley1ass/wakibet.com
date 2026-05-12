-- CreateTable
CREATE TABLE "InvestPortfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestKey" TEXT NOT NULL,
    "lockAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "settledReturnPct" DOUBLE PRECISION,
    "startingValueUsd" DOUBLE PRECISION,
    "endingValueUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestPortfolioPosition" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "allocationPct" DOUBLE PRECISION NOT NULL,
    "lockPriceUsd" DOUBLE PRECISION,
    "endPriceUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestPortfolioPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestPriceSnapshot" (
    "id" TEXT NOT NULL,
    "contestKey" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "sourceTs" INTEGER,
    "provider" TEXT NOT NULL DEFAULT 'finnhub',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestPriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestPortfolio_userId_contestKey_key" ON "InvestPortfolio"("userId", "contestKey");

-- CreateIndex
CREATE INDEX "InvestPortfolio_contestKey_idx" ON "InvestPortfolio"("contestKey");

-- CreateIndex
CREATE INDEX "InvestPortfolio_userId_idx" ON "InvestPortfolio"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestPortfolioPosition_portfolioId_symbol_key" ON "InvestPortfolioPosition"("portfolioId", "symbol");

-- CreateIndex
CREATE INDEX "InvestPortfolioPosition_portfolioId_idx" ON "InvestPortfolioPosition"("portfolioId");

-- CreateIndex
CREATE INDEX "InvestPortfolioPosition_symbol_idx" ON "InvestPortfolioPosition"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "InvestPriceSnapshot_contestKey_symbol_kind_key" ON "InvestPriceSnapshot"("contestKey", "symbol", "kind");

-- CreateIndex
CREATE INDEX "InvestPriceSnapshot_contestKey_idx" ON "InvestPriceSnapshot"("contestKey");

-- AddForeignKey
ALTER TABLE "InvestPortfolio" ADD CONSTRAINT "InvestPortfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestPortfolioPosition" ADD CONSTRAINT "InvestPortfolioPosition_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "InvestPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
