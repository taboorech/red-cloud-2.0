import { z as zod } from "zod";
import { idValidation, paginationValidation } from "./main.scheme";

const getGenresValidation = zod.object({}).extend(paginationValidation.shape);

const titleValidation = zod.object({
  title: zod.string().min(1, "Genre title is required"),
});

const createGenreValidation = titleValidation;

const updateGenreValidation = titleValidation.extend(idValidation.shape);

const deleteGenreValidation = idValidation;

export {
  getGenresValidation,
  createGenreValidation,
  updateGenreValidation,
  deleteGenreValidation,
};
