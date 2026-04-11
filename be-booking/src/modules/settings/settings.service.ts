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
      const created = this.repo.create({
        fee: 0,
        policy: 'Default',
        cancelTimeLimit: 60,
        heroTitle: 'Đặt Sân Pickleball',
        heroHighlight: 'Nhanh Chóng & Dễ Dàng',
        heroDescription:
          'Pickleball hiện đại nhất Việt Nam. Đặt sân online 24/7, giá cả minh bạch, dịch vụ chuyên nghiệp.',
        footerBrandName: 'Pickleball Việt',
        footerDescription: 'Hệ thống đặt sân Pickleball hàng đầu Việt Nam',
        footerPhone: '0901 234 567',
        footerEmail: 'contact@pickleballviet.com',
        footerAddress: '123 Đường ABC, Quận 1, TP.HCM',
        footerCopyright: '© 2024 Pickleball Việt. All rights reserved.',
      });
      r = [await this.repo.save(created)];
    }
    const setting = r[0];
    return {
      ...setting,
      businessHours: setting.businessHours,
    };
  }

  async update(payload: {
    fee?: number;
    policy?: string;
    cancelTimeLimit?: number;
    businessHours?: any[];
    heroTitle?: string;
    heroHighlight?: string;
    heroDescription?: string;
    heroImageUrl?: string;
    footerBrandName?: string;
    footerDescription?: string;
    footerPhone?: string;
    footerEmail?: string;
    footerAddress?: string;
    footerCopyright?: string;
  }) {
    const s = await this.repo.findOne({ where: {} });
    if (!s) return;
    if (payload.fee !== undefined) s.fee = payload.fee;
    if (payload.policy !== undefined) s.policy = payload.policy;
    if (payload.cancelTimeLimit !== undefined) s.cancelTimeLimit = payload.cancelTimeLimit;
    if (payload.businessHours !== undefined) {
      s.businessHoursRaw = JSON.stringify(payload.businessHours);
    }
    if (payload.heroTitle !== undefined) s.heroTitle = payload.heroTitle;
    if (payload.heroHighlight !== undefined) s.heroHighlight = payload.heroHighlight;
    if (payload.heroDescription !== undefined) s.heroDescription = payload.heroDescription;
    if (payload.heroImageUrl !== undefined) s.heroImageUrl = payload.heroImageUrl;
    if (payload.footerBrandName !== undefined) s.footerBrandName = payload.footerBrandName;
    if (payload.footerDescription !== undefined) s.footerDescription = payload.footerDescription;
    if (payload.footerPhone !== undefined) s.footerPhone = payload.footerPhone;
    if (payload.footerEmail !== undefined) s.footerEmail = payload.footerEmail;
    if (payload.footerAddress !== undefined) s.footerAddress = payload.footerAddress;
    if (payload.footerCopyright !== undefined) s.footerCopyright = payload.footerCopyright;

    const saved = await this.repo.save(s);
    return { ...saved, businessHours: saved.businessHours };
  }
}
