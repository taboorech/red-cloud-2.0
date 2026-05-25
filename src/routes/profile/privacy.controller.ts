import { PrivacyService } from "@app/lib/services/privacy.service";
import {
  exclusionParamsValidation,
  updatePrivacyValidation,
} from "@app/lib/validation/privacy.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class PrivacyController {
  constructor(@inject(PrivacyService) private privacyService: PrivacyService) {
    this.getPrivacy = this.getPrivacy.bind(this);
    this.updatePrivacy = this.updatePrivacy.bind(this);
    this.hideFrom = this.hideFrom.bind(this);
    this.unhideFrom = this.unhideFrom.bind(this);
  }

  public async getPrivacy(req: Request, res: Response) {
    const userId = req.user!.id;
    const [settings, hidden_presence_user_ids, hidden_listening_user_ids] =
      await Promise.all([
        this.privacyService.getSettings(userId),
        this.privacyService.listHiddenFrom(userId, "presence"),
        this.privacyService.listHiddenFrom(userId, "listening"),
      ]);
    res.json({
      status: "OK",
      data: {
        ...settings,
        hidden_presence_user_ids,
        hidden_listening_user_ids,
      },
    });
  }

  public async updatePrivacy(req: Request, res: Response) {
    const parsed = updatePrivacyValidation.parse(req.body);
    const updated = await this.privacyService.updateSettings(req.user!.id, parsed);
    res.json({ status: "OK", data: updated });
  }

  public async hideFrom(req: Request, res: Response) {
    const { friendId, scope } = exclusionParamsValidation.parse(req.params);
    await this.privacyService.hideFrom(req.user!.id, friendId, scope);
    res.json({ status: "OK" });
  }

  public async unhideFrom(req: Request, res: Response) {
    const { friendId, scope } = exclusionParamsValidation.parse(req.params);
    await this.privacyService.unhideFrom(req.user!.id, friendId, scope);
    res.json({ status: "OK" });
  }
}
