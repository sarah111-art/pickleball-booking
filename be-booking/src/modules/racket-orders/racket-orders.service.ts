import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RacketOrder,
  RacketPaymentMethod,
  RacketPaymentStatus,
  RacketOrderStatus,
} from '../../entities/racket-order.entity';

@Injectable()
export class RacketOrdersService {
  constructor(
    @InjectRepository(RacketOrder) private repo: Repository<RacketOrder>,
  ) {}

  private buildOrderCode() {
    return `RO${Date.now().toString().slice(-10)}`;
  }

  async create(payload: {
    userId?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    note?: string;
    paymentMethod?: RacketPaymentMethod;
    items: Array<{
      racketId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  }) {
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    const cleanedItems = payload.items
      .filter((item) => item.racketId && item.quantity > 0)
      .map((item) => ({
        racketId: item.racketId,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
      }));

    if (cleanedItems.length === 0) {
      throw new BadRequestException('Dữ liệu sản phẩm không hợp lệ');
    }

    const total = cleanedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const paymentMethod: RacketPaymentMethod =
      payload.paymentMethod === 'sepay' ? 'sepay' : 'cod';
    const paymentStatus: RacketPaymentStatus =
      paymentMethod === 'cod' ? 'cod_pending' : 'pending';

    const entity = this.repo.create({
      orderCode: this.buildOrderCode(),
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      deliveryAddress: payload.deliveryAddress,
      note: payload.note,
      paymentMethod,
      paymentStatus,
      orderStatus: 'new',
      items: cleanedItems,
      total,
      userId: payload.userId,
    });

    return this.repo.save(entity);
  }

  async findAll(query?: {
    orderStatus?: RacketOrderStatus;
    paymentStatus?: RacketPaymentStatus;
    paymentMethod?: RacketPaymentMethod;
  }) {
    const qb = this.repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user');

    if (query?.orderStatus) {
      qb.andWhere('order.orderStatus = :orderStatus', {
        orderStatus: query.orderStatus,
      });
    }
    if (query?.paymentStatus) {
      qb.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }
    if (query?.paymentMethod) {
      qb.andWhere('order.paymentMethod = :paymentMethod', {
        paymentMethod: query.paymentMethod,
      });
    }

    qb.orderBy('order.createdAt', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string) {
    const order = await this.repo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!order) throw new NotFoundException('Racket order not found');
    return order;
  }

  async update(
    id: string,
    patch: {
      orderStatus?: RacketOrderStatus;
      paymentStatus?: RacketPaymentStatus;
      note?: string;
    },
  ) {
    const order = await this.findOne(id);

    if (patch.orderStatus) order.orderStatus = patch.orderStatus;
    if (patch.paymentStatus) order.paymentStatus = patch.paymentStatus;
    if (patch.note !== undefined) order.note = patch.note;

    return this.repo.save(order);
  }
}
