import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhoopAccess } from 'src/whoop/models/whoop_access.model';
import { CryptoUtil } from 'src/utils';
import { AddWhoopAccessDto } from 'src/whoop/dtos';

@Injectable()
export class WhoopAccessService {
  constructor(
    private readonly cryptoUtil: CryptoUtil,
    @InjectModel(WhoopAccess)
    private readonly whoopAccessModel: typeof WhoopAccess,
  ) {}

  async addAccess(data: AddWhoopAccessDto): Promise<{ ok: boolean; id: number }> {
    const encryptedClientId = this.cryptoUtil.simpleEncrypt(data.client_id);
    const encryptedClientSecret = this.cryptoUtil.simpleEncrypt(data.client_secret);

    const whoopAccess = await this.whoopAccessModel.create({
      client_id_encrypted: encryptedClientId,
      client_secret_encrypted: encryptedClientSecret,
    } as WhoopAccess);

    return { ok: true, id: whoopAccess.id };
  }
}

