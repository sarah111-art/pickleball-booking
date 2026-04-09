import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  async create(payload: Partial<Product>) {
    const e = this.repo.create(payload);
    return this.repo.save(e);
  }

  findAll(query?: Record<string, any>) {
    const qb = this.repo.createQueryBuilder('product');

    if (query?.category) qb.andWhere('product.category = :category', { category: query.category });
    if (query?.isActive !== undefined) qb.andWhere('product.isActive = :active', { active: Boolean(query.isActive) });
    if (query?.search) qb.andWhere('product.name LIKE :search', { search: `%${query.search}%` });

    return qb.orderBy('product.createdAt', 'DESC').getMany();
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Product not found');
    return e;
  }

  async update(id: string, payload: Partial<Product>) {
    const e = await this.findOne(id);
    Object.assign(e, payload);
    return this.repo.save(e);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repo.delete(id);
  }
}
