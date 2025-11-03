import GenreService from "@app/lib/services/genre.service";
import {
  createGenreValidation,
  deleteGenreValidation,
  getGenresValidation,
  updateGenreValidation,
} from "@app/lib/validation/genre.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export default class GenreController {
  constructor(@inject(GenreService) private genreService: GenreService) {
    this.getGenres = this.getGenres.bind(this);
    this.createGenre = this.createGenre.bind(this);
    this.updateGenre = this.updateGenre.bind(this);
    this.deleteGenre = this.deleteGenre.bind(this);
  }

  public async getGenres(req: Request, res: Response) {
    const validationData = getGenresValidation.parse(req.query);

    const genres = await this.genreService.getAllGenres(validationData);

    res.json({ status: "OK", data: genres });
  }

  public async createGenre(req: Request, res: Response) {
    const { title } = createGenreValidation.parse(req.body);

    await this.genreService.createGenre(title);

    res.json({ status: "OK" });
  }

  public async updateGenre(req: Request, res: Response) {
    const { id, title } = updateGenreValidation.parse({
      ...req.params,
      ...req.body,
    });

    await this.genreService.updateGenre(id, title);

    res.json({ status: "OK" });
  }

  public async deleteGenre(req: Request, res: Response) {
    const { id } = deleteGenreValidation.parse(req.params);

    await this.genreService.deleteGenre(id);

    res.json({ status: "OK" });
  }
}
