import { injectable } from "inversify";
import { ICredentials } from "../types/credentials";
import { decryptText, encryptText } from "../utils/hash";

@injectable()
export class UserHashCredentialsService {
  public async encryptCredentials(
    credentials: ICredentials,
  ): Promise<ICredentials> {
    const encryptedCredentials: ICredentials = { ...credentials };
    const headers = {};

    if (this.isCredentialsEncrypted(credentials)) {
      return encryptedCredentials;
    }

    if (credentials.access_token) {
      encryptedCredentials.access_token = await encryptText(
        credentials.access_token,
        headers,
      );
    }
    if (credentials.refresh_token) {
      encryptedCredentials.refresh_token = await encryptText(
        credentials.refresh_token,
        headers,
      );
    }

    encryptedCredentials.is_internal_encrypted = true;

    return encryptedCredentials;
  }

  public async decryptCredentials(
    credentials: ICredentials,
  ): Promise<ICredentials> {
    const decryptCredentials: ICredentials = { ...credentials };

    if (!this.isCredentialsEncrypted(credentials)) {
      return decryptCredentials;
    }

    if (credentials.access_token) {
      decryptCredentials.access_token = await decryptText(
        credentials.access_token,
      );
    }
    if (credentials.refresh_token) {
      decryptCredentials.refresh_token = await decryptText(
        credentials.refresh_token,
      );
    }

    decryptCredentials.is_internal_encrypted = false;

    return decryptCredentials;
  }

  public isCredentialsEncrypted = (credentials: ICredentials): boolean =>
    !!credentials.is_internal_encrypted || false;
}
