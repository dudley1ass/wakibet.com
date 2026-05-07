-- CreateEnum
CREATE TYPE "ArticleReactionType" AS ENUM ('HOT_TAKE', 'TERRIBLE_TAKE', 'SHARP', 'SLEEPER');

-- CreateEnum
CREATE TYPE "ArticlePollOption" AS ENUM ('OVERRATED', 'FAIR_VALUE', 'SLEEPER');

-- CreateTable
CREATE TABLE "ArticleReaction" (
    "id" TEXT NOT NULL,
    "articleSlug" TEXT NOT NULL,
    "reactionType" "ArticleReactionType" NOT NULL,
    "userId" TEXT,
    "anonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticlePollVote" (
    "id" TEXT NOT NULL,
    "articleSlug" TEXT NOT NULL,
    "option" "ArticlePollOption" NOT NULL,
    "userId" TEXT,
    "anonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticlePollVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleReaction_articleSlug_userId_key" ON "ArticleReaction"("articleSlug", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleReaction_articleSlug_anonId_key" ON "ArticleReaction"("articleSlug", "anonId");

-- CreateIndex
CREATE INDEX "ArticleReaction_articleSlug_reactionType_idx" ON "ArticleReaction"("articleSlug", "reactionType");

-- CreateIndex
CREATE UNIQUE INDEX "ArticlePollVote_articleSlug_userId_key" ON "ArticlePollVote"("articleSlug", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticlePollVote_articleSlug_anonId_key" ON "ArticlePollVote"("articleSlug", "anonId");

-- CreateIndex
CREATE INDEX "ArticlePollVote_articleSlug_option_idx" ON "ArticlePollVote"("articleSlug", "option");

-- AddForeignKey
ALTER TABLE "ArticleReaction" ADD CONSTRAINT "ArticleReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticlePollVote" ADD CONSTRAINT "ArticlePollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
