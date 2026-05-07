import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";

const ErrorMessage = z.object({ message: z.string() });
const ReactionType = z.enum(["HOT_TAKE", "TERRIBLE_TAKE", "SHARP", "SLEEPER"]);
const PollOption = z.enum(["OVERRATED", "FAIR_VALUE", "SLEEPER"]);
type ReactionTypeValue = z.infer<typeof ReactionType>;
type PollOptionValue = z.infer<typeof PollOption>;

const ArticleSlug = z
  .string()
  .trim()
  .min(3)
  .max(160)
  .regex(/^[a-z0-9-]+$/);

const ActorBody = z.object({
  anon_id: z.string().trim().min(8).max(128).optional(),
});

const ReactionBody = ActorBody.extend({
  reaction_type: ReactionType,
});

const PollVoteBody = ActorBody.extend({
  option: PollOption,
});

async function optionalUserIdFromBearer(authorization: string | undefined): Promise<string | null> {
  if (!authorization?.startsWith("Bearer ")) return null;
  try {
    const { sub } = verifyAccessToken(authorization.slice(7));
    const row = await prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, isBanned: true },
    });
    if (!row || row.isBanned) return null;
    return row.id;
  } catch {
    return null;
  }
}

function actorWhere(articleSlug: string, userId: string | null, anonId: string | null) {
  if (userId) return { articleSlug_userId: { articleSlug, userId } } as const;
  if (anonId) return { articleSlug_anonId: { articleSlug, anonId } } as const;
  return null;
}

export const articlesRoutes: FastifyPluginAsync = async (app) => {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    "/api/v1/articles/:slug/engagement",
    {
      schema: {
        tags: ["articles"],
        params: z.object({ slug: ArticleSlug }),
        response: {
          200: z.object({
            article_slug: z.string(),
            poll: z.object({
              question: z.string(),
              options: z.array(
                z.object({
                  option: PollOption,
                  label: z.string(),
                  votes: z.number().int(),
                  pct: z.number(),
                }),
              ),
            }),
            reactions: z.array(
              z.object({
                reaction_type: ReactionType,
                label: z.string(),
                votes: z.number().int(),
              }),
            ),
            my_reaction: ReactionType.nullable(),
            my_poll_option: PollOption.nullable(),
          }),
        },
      },
    },
    async (req) => {
      const { slug } = req.params;
      const userId = await optionalUserIdFromBearer(req.headers.authorization);
      const anonId = req.headers["x-wakibet-anon-id"]?.toString().trim() || null;
      const actor = actorWhere(slug, userId, anonId);

      const [reactionsGrouped, pollGrouped, myReaction, myVote] = await Promise.all([
        prisma.articleReaction.groupBy({
          by: ["reactionType"],
          where: { articleSlug: slug },
          _count: { _all: true },
        }),
        prisma.articlePollVote.groupBy({
          by: ["option"],
          where: { articleSlug: slug },
          _count: { _all: true },
        }),
        actor ? prisma.articleReaction.findUnique({ where: actor, select: { reactionType: true } }) : null,
        actor ? prisma.articlePollVote.findUnique({ where: actor, select: { option: true } }) : null,
      ]);

      const reactionCounts = {
        HOT_TAKE: 0,
        TERRIBLE_TAKE: 0,
        SHARP: 0,
        SLEEPER: 0,
      };
      for (const row of reactionsGrouped) reactionCounts[row.reactionType] = row._count._all;

      const pollCounts = {
        OVERRATED: 0,
        FAIR_VALUE: 0,
        SLEEPER: 0,
      };
      for (const row of pollGrouped) pollCounts[row.option] = row._count._all;
      const pollTotal = pollCounts.OVERRATED + pollCounts.FAIR_VALUE + pollCounts.SLEEPER;

      return {
        article_slug: slug,
        poll: {
          question: "Community sentiment for this take",
          options: [
            {
              option: "OVERRATED" as const,
              label: "Overrated",
              votes: pollCounts.OVERRATED,
              pct: pollTotal > 0 ? Math.round((pollCounts.OVERRATED / pollTotal) * 1000) / 10 : 0,
            },
            {
              option: "FAIR_VALUE" as const,
              label: "Fair value",
              votes: pollCounts.FAIR_VALUE,
              pct: pollTotal > 0 ? Math.round((pollCounts.FAIR_VALUE / pollTotal) * 1000) / 10 : 0,
            },
            {
              option: "SLEEPER" as const,
              label: "Sleeper",
              votes: pollCounts.SLEEPER,
              pct: pollTotal > 0 ? Math.round((pollCounts.SLEEPER / pollTotal) * 1000) / 10 : 0,
            },
          ],
        },
        reactions: [
          { reaction_type: "HOT_TAKE" as const, label: "Hot take", votes: reactionCounts.HOT_TAKE },
          {
            reaction_type: "TERRIBLE_TAKE" as const,
            label: "Terrible take",
            votes: reactionCounts.TERRIBLE_TAKE,
          },
          { reaction_type: "SHARP" as const, label: "Sharp", votes: reactionCounts.SHARP },
          { reaction_type: "SLEEPER" as const, label: "Sleeper", votes: reactionCounts.SLEEPER },
        ],
        my_reaction: (myReaction?.reactionType as ReactionTypeValue | undefined) ?? null,
        my_poll_option: (myVote?.option as PollOptionValue | undefined) ?? null,
      };
    },
  );

  typed.post(
    "/api/v1/articles/:slug/reaction",
    {
      schema: {
        tags: ["articles"],
        params: z.object({ slug: ArticleSlug }),
        body: ReactionBody,
        response: {
          200: z.object({ ok: z.literal(true) }),
          400: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const { slug } = req.params;
      const { anon_id, reaction_type } = req.body;
      const userId = await optionalUserIdFromBearer(req.headers.authorization);
      const anonId = anon_id?.trim() || req.headers["x-wakibet-anon-id"]?.toString().trim() || null;
      const actor = actorWhere(slug, userId, anonId);
      if (!actor) {
        return reply.code(400).send({ message: "Missing actor identity." } as const);
      }

      await prisma.articleReaction.upsert({
        where: actor,
        create: {
          articleSlug: slug,
          reactionType: reaction_type,
          userId: userId ?? undefined,
          anonId: userId ? null : anonId,
        },
        update: { reactionType: reaction_type },
      });
      return { ok: true as const };
    },
  );

  typed.post(
    "/api/v1/articles/:slug/poll-vote",
    {
      schema: {
        tags: ["articles"],
        params: z.object({ slug: ArticleSlug }),
        body: PollVoteBody,
        response: {
          200: z.object({ ok: z.literal(true) }),
          400: ErrorMessage,
        },
      },
    },
    async (req, reply) => {
      const { slug } = req.params;
      const { anon_id, option } = req.body;
      const userId = await optionalUserIdFromBearer(req.headers.authorization);
      const anonId = anon_id?.trim() || req.headers["x-wakibet-anon-id"]?.toString().trim() || null;
      const actor = actorWhere(slug, userId, anonId);
      if (!actor) {
        return reply.code(400).send({ message: "Missing actor identity." } as const);
      }

      await prisma.articlePollVote.upsert({
        where: actor,
        create: {
          articleSlug: slug,
          option,
          userId: userId ?? undefined,
          anonId: userId ? null : anonId,
        },
        update: { option },
      });
      return { ok: true as const };
    },
  );
};
