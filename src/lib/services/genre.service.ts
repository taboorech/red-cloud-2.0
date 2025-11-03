import z from "zod";
import { GenreModel } from "../db/models/genres.model";
import { getGenresValidation } from "../validation/genre.scheme";

export default class GenreService {
  constructor() {}

  public async getAllGenres({
    offset,
    limit,
    search,
    ids,
  }: z.infer<typeof getGenresValidation>): Promise<GenreModel[]> {
    const genres = await GenreModel.query()
      .modify((builder) => {
        if (ids?.length) builder.whereIn("id", ids);

        if (offset) builder.offset(offset);

        if (limit) builder.limit(limit);

        if (search) builder.whereILike("title", `%${search}%`);
      })
      .orderBy("id");

    return genres;
  }

  public async createGenre(title: string): Promise<void> {
    await GenreModel.query().insert({
      title,
    });
  }

  public async updateGenre(id: number, title: string) {
    await GenreModel.query().findById(id).patch({
      title,
    });
  }

  public async deleteGenre(id: number) {
    await GenreModel.query().delete().where({ id });
  }
}
