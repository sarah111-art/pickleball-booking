import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../../entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Setting) private repo: Repository<Setting>) {}

  async get() {
    let r = await this.repo.find();
    if (!r || r.length === 0) {
      const created = this.repo.create({ fee: 0, policy: 'Default', cancelTimeLimit: 60 });
      r = [await this.repo.save(created)];
    }
    return r[0];
  }

  async update(payload: Partial<Setting>) {
    const s = await this.get();
    Object.assign(s, payload);
    return this.repo.save(s);
  }
}
