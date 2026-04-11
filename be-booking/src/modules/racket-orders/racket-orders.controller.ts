import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RacketOrdersService } from './racket-orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  RacketOrderStatus,
  RacketPaymentMethod,
  RacketPaymentStatus,
} from '../../entities/racket-order.entity';

interface CreateRacketOrderDto {
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
}

interface UpdateRacketOrderDto {
  orderStatus?: RacketOrderStatus;
  paymentStatus?: RacketPaymentStatus;
  note?: string;
}

interface OrderQueryDto {
  orderStatus?: RacketOrderStatus;
  paymentStatus?: RacketPaymentStatus;
  paymentMethod?: RacketPaymentMethod;
}

interface RequestWithUser {
  user?: {
    id?: string;
  };
}

@Controller('racket-orders')
export class RacketOrdersController {
  constructor(private svc: RacketOrdersService) {}

  @Post()
  create(@Req() req: RequestWithUser, @Body() body: CreateRacketOrderDto) {
    return this.svc.create({
      userId: req.user?.id,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      note: body.note,
      paymentMethod: body.paymentMethod,
      items: body.items || [],
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() q: OrderQueryDto) {
    return this.svc.findAll({
      orderStatus: q.orderStatus,
      paymentStatus: q.paymentStatus,
      paymentMethod: q.paymentMethod,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateRacketOrderDto) {
    return this.svc.update(id, {
      orderStatus: body.orderStatus,
      paymentStatus: body.paymentStatus,
      note: body.note,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateViaPut(@Param('id') id: string, @Body() body: UpdateRacketOrderDto) {
    return this.svc.update(id, {
      orderStatus: body.orderStatus,
      paymentStatus: body.paymentStatus,
      note: body.note,
    });
  }
}
