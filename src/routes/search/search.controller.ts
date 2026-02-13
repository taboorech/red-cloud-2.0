import SearchService from "@app/lib/services/search.service";
import { searchSchema } from "@app/lib/validation/search.scheme";
import { Request, Response } from "express";
import { inject } from "inversify";

export class SearchController {
  constructor(@inject(SearchService) private searchService: SearchService) {
    this.search = this.search.bind(this);
  }

  public async search(req: Request, res: Response) {
    const parse = searchSchema.parse(req.query);
    const results = await this.searchService.search(parse);

    res.json({
      status: "OK",
      data: results,
    });
  }
}
