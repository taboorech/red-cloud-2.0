import { z as zod } from "zod";
import { SearchType } from "../constants/search";

const searchSchema = zod.object({
  query: zod.string().min(1, "Search query can't be empty"),
  type: zod.enum(SearchType).default(SearchType.ALL),
});

export { searchSchema };
