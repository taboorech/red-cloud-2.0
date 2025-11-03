import Model from "../knex-objection";

export interface IGenre {
  id: string;
  title: string;
}

export class GenreModel extends Model implements IGenre {
  static tableName = "genres";

  id!: string;
  title!: string;
}
