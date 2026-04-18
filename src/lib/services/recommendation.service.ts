import { injectable } from "inversify";
import { SongModel } from "../db/models/song.model";
import { SongEmbeddingModel } from "../db/models/song-embedding.model";
import { SongListeningsModel } from "../db/models/song-listenings.model";
import { FavoriteSongsModel } from "../db/models/favorite-songs.model";
import { SongActionsModel, SongAction } from "../db/models/song-actions.model";
import { FriendModel, FriendStatus } from "../db/models/friends.model";
import { SongGenresModel } from "../db/models/song-genres.model";
import { openAIClient } from "../openai/openai.client";
import { logger } from "../logger";
import { AIModel } from "../constants/ai";
import { AppError } from "../errors/app.error";

@injectable()
export class RecommendationService {
  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0,
      magA = 0,
      magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  private async getUserInteractedSongIds(userId: number): Promise<{
    listenedIds: Set<number>;
    favoriteIds: Set<number>;
    dislikedIds: Set<number>;
  }> {
    const [listenings, favorites, actions] = await Promise.all([
      SongListeningsModel.query()
        .where("user_id", userId)
        .distinct("song_id")
        .select("song_id"),
      FavoriteSongsModel.query().where("user_id", userId).select("song_id"),
      SongActionsModel.query()
        .where("user_id", userId)
        .select("song_id", "action"),
    ]);

    return {
      listenedIds: new Set(listenings.map((l) => l.song_id)),
      favoriteIds: new Set(favorites.map((f) => f.song_id)),
      dislikedIds: new Set(
        actions
          .filter((a) => a.action === SongAction.DISLIKE)
          .map((a) => a.song_id),
      ),
    };
  }

  private async getUserGenreScores(
    userId: number,
  ): Promise<Map<number, number>> {
    const scores = new Map<number, number>();

    type GenreCountRow = { genre_id: number; cnt: string };

    const [listenGenres, favoriteGenres] = await Promise.all([
      SongGenresModel.query()
        .join(
          SongListeningsModel.tableName,
          `${SongListeningsModel.tableName}.song_id`,
          `${SongGenresModel.tableName}.song_id`,
        )
        .where(`${SongListeningsModel.tableName}.user_id`, userId)
        .select(`${SongGenresModel.tableName}.genre_id`)
        .count(`${SongGenresModel.tableName}.genre_id as cnt`)
        .groupBy(
          `${SongGenresModel.tableName}.genre_id`,
        ) as unknown as GenreCountRow[],

      SongGenresModel.query()
        .join(
          FavoriteSongsModel.tableName,
          `${FavoriteSongsModel.tableName}.song_id`,
          `${SongGenresModel.tableName}.song_id`,
        )
        .where(`${FavoriteSongsModel.tableName}.user_id`, userId)
        .select(`${SongGenresModel.tableName}.genre_id`)
        .count(`${SongGenresModel.tableName}.genre_id as cnt`)
        .groupBy(
          `${SongGenresModel.tableName}.genre_id`,
        ) as unknown as GenreCountRow[],
    ]);

    for (const row of listenGenres) {
      const id = Number(row.genre_id);
      scores.set(id, (scores.get(id) ?? 0) + Number(row.cnt) * 1);
    }
    for (const row of favoriteGenres) {
      const id = Number(row.genre_id);
      scores.set(id, (scores.get(id) ?? 0) + Number(row.cnt) * 3);
    }

    return scores;
  }

  private async getFriendSongScores(
    userId: number,
  ): Promise<Map<number, number>> {
    const scores = new Map<number, number>();

    const friends = await FriendModel.query()
      .where((builder) => {
        builder
          .where({ user_id: userId, status: FriendStatus.accepted })
          .orWhere({ friend_id: userId, status: FriendStatus.accepted });
      })
      .select("user_id", "friend_id");

    const friendIds = friends.map((f) =>
      f.user_id === userId ? f.friend_id : f.user_id,
    );

    if (!friendIds.length) return scores;

    const [friendListenings, friendFavorites] = await Promise.all([
      SongListeningsModel.query()
        .whereIn("user_id", friendIds)
        .distinct("song_id")
        .select("song_id"),
      FavoriteSongsModel.query()
        .whereIn("user_id", friendIds)
        .select("song_id"),
    ]);

    for (const l of friendListenings) {
      scores.set(l.song_id, (scores.get(l.song_id) ?? 0) + 2);
    }
    for (const f of friendFavorites) {
      scores.set(f.song_id, (scores.get(f.song_id) ?? 0) + 4);
    }

    return scores;
  }

  async generateSongEmbedding(songId: number): Promise<number[]> {
    const song = await SongModel.query()
      .findById(songId)
      .withGraphFetched("genres");

    if (!song) throw new AppError(404, `Song ${songId} not found`);

    const genreTitles = song.genres?.map((g) => g.title).join(", ") ?? "";
    const text = [
      song.title,
      genreTitles,
      song.description ?? "",
      song.text?.slice(0, 500) ?? "",
    ]
      .filter(Boolean)
      .join(". ");

    const response = await openAIClient().embeddings.create({
      model: AIModel.TEXT_EMBEDDING_3_SMALL,
      input: text,
    });

    const embedding = response.data[0].embedding;

    await SongEmbeddingModel.query()
      .insert({
        song_id: songId,
        embedding: JSON.stringify(embedding) as unknown as number[],
        model: AIModel.TEXT_EMBEDDING_3_SMALL,
      })
      .onConflict("song_id")
      .merge();

    logger().info(`Embedding generated for song ${songId}`);

    return embedding;
  }

  private async getOrCreateEmbedding(songId: number): Promise<number[] | null> {
    const existing = await SongEmbeddingModel.query()
      .where("song_id", songId)
      .first();

    if (existing) return existing.embedding;

    try {
      return await this.generateSongEmbedding(songId);
    } catch {
      return null;
    }
  }

  private async getContentScores(
    userTopSongIds: number[],
    candidateIds: number[],
  ): Promise<Map<number, number>> {
    const scores = new Map<number, number>();
    if (!userTopSongIds.length || !candidateIds.length) return scores;

    const userEmbeddings = (
      await Promise.all(
        userTopSongIds.slice(0, 10).map((id) => this.getOrCreateEmbedding(id)),
      )
    ).filter((e): e is number[] => e !== null);

    if (!userEmbeddings.length) return scores;

    const dim = userEmbeddings[0].length;
    const tasteVector = new Array(dim).fill(0) as number[];
    for (const emb of userEmbeddings) {
      for (let i = 0; i < dim; i++) tasteVector[i] += emb[i];
    }
    for (let i = 0; i < dim; i++) tasteVector[i] /= userEmbeddings.length;

    const candidateEmbeddings = await SongEmbeddingModel.query().whereIn(
      "song_id",
      candidateIds,
    );

    const embeddedIds = new Set(candidateEmbeddings.map((e) => e.song_id));
    const missingIds = candidateIds.filter((id) => !embeddedIds.has(id));
    if (missingIds.length) {
      Promise.all(
        missingIds.slice(0, 20).map((id) => this.generateSongEmbedding(id)),
      ).catch((err) =>
        logger().warn("Failed to pre-generate candidate embeddings", err),
      );
    }

    for (const ce of candidateEmbeddings) {
      const sim = this.cosineSimilarity(tasteVector, ce.embedding);
      scores.set(ce.song_id, sim);
    }

    return scores;
  }

  async getRecommendations({
    userId,
    limit = 20,
    offset = 0,
    strategy = "mixed",
  }: {
    userId: number;
    limit?: number;
    offset?: number;
    strategy?: "genre" | "social" | "content" | "mixed";
  }): Promise<SongModel[]> {
    logger().info(`Getting recommendations`, { userId, strategy, limit });

    const { listenedIds, favoriteIds, dislikedIds } =
      await this.getUserInteractedSongIds(userId);

    const excludeIds = new Set([...listenedIds, ...dislikedIds]);

    const [genreScores, socialScores] = await Promise.all([
      strategy !== "social"
        ? this.getUserGenreScores(userId)
        : Promise.resolve(new Map<number, number>()),
      strategy !== "genre" && strategy !== "content"
        ? this.getFriendSongScores(userId)
        : Promise.resolve(new Map<number, number>()),
    ]);

    const candidates = await SongModel.query()
      .where(`${SongModel.tableName}.is_public`, true)
      .modify((builder) => {
        if (excludeIds.size > 0) {
          builder.whereNotIn(`${SongModel.tableName}.id`, [...excludeIds]);
        }
      })
      .withGraphFetched("genres");

    const candidateIds = candidates.map((s) => s.id);

    const userTopSongIds = [
      ...[...favoriteIds],
      ...[...listenedIds].slice(0, 20),
    ];

    const contentScores =
      strategy === "content" || strategy === "mixed"
        ? await this.getContentScores(userTopSongIds, candidateIds)
        : new Map<number, number>();

    const maxGenre = Math.max(1, ...genreScores.values());
    const maxSocial = Math.max(1, ...socialScores.values());
    const maxContent = Math.max(1, ...contentScores.values());

    const scored = candidates.map((song) => {
      const genreRaw =
        song.genres?.reduce(
          (sum: number, g) =>
            sum + (genreScores.get(g.id as unknown as number) ?? 0),
          0,
        ) ?? 0;

      const genreNorm = genreRaw / maxGenre;
      const socialNorm = (socialScores.get(song.id) ?? 0) / maxSocial;
      const contentNorm = (contentScores.get(song.id) ?? 0) / maxContent;

      let score: number;
      if (strategy === "genre") score = genreNorm;
      else if (strategy === "social") score = socialNorm;
      else if (strategy === "content") score = contentNorm;
      else score = 0.5 * contentNorm + 0.3 * genreNorm + 0.2 * socialNorm;

      return { song, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(offset, offset + limit)
      .map((s) => s.song);
  }
}
