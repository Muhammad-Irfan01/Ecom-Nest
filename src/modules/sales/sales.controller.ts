import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly authService: AuthService,
  ) {}

  // Flash Sales Endpoints
  @Post('flash-sales')
  @UseGuards(JwtAuthGuard)
  async createFlashSale(@Request() req, @Body() createSaleDto: CreateSaleDto) {
    const adminId = req.user.sub;
    const isAdmin = await this.authService.isAdmin(adminId);
    if (!isAdmin) {
      throw new Error('Only admins can create flash sales');
    }
    return this.salesService.createFlashSale(createSaleDto, adminId);
  }

  @Get('flash-sales')
  async findAllFlashSales() {
    return this.salesService.findAllFlashSales();
  }

  @Get('flash-sales/active')
  async findActiveFlashSales() {
    return this.salesService.findActiveFlashSales();
  }

  @Get('flash-sales/:id')
  async findOneFlashSale(@Param('id') id: string) {
    return this.salesService.findOneFlashSale(+id);
  }

  @Patch('flash-sales/:id')
  @UseGuards(JwtAuthGuard)
  async updateFlashSale(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto, @Request() req) {
    const adminId = req.user.sub;
    const isAdmin = await this.authService.isAdmin(adminId);
    if (!isAdmin) {
      throw new Error('Only admins can update flash sales');
    }
    return this.salesService.updateFlashSale(+id, updateSaleDto, adminId);
  }

  @Delete('flash-sales/:id')
  @UseGuards(JwtAuthGuard)
  async removeFlashSale(@Param('id') id: string, @Request() req) {
    const adminId = req.user.sub;
    const isAdmin = await this.authService.isAdmin(adminId);
    if (!isAdmin) {
      throw new Error('Only admins can delete flash sales');
    }
    return this.salesService.removeFlashSale(+id, adminId);
  }

  // Coupon Endpoints
  @Post('coupons')
  @UseGuards(JwtAuthGuard)
  async createCoupon(@Request() req, @Body() createCouponDto: CreateCouponDto) {
    const adminId = req.user.sub;
    const isAdmin = await this.authService.isAdmin(adminId);
    if (!isAdmin) {
      throw new Error('Only admins can create coupons');
    }
    return this.salesService.createCoupon(createCouponDto, adminId);
  }

  @Get('coupons')
  @UseGuards(JwtAuthGuard)
  async findAllCoupons(@Request() req) {
    const adminId = req.user.sub;
    const isAdmin = await this.authService.isAdmin(adminId);
    if (!isAdmin) {
      throw new Error('Only admins can view all coupons');
    }
    return this.salesService.findAllCoupons();
  }

  @Get('coupons/:id')
  @UseGuards(JwtAuthGuard)
  async findOneCoupon(@Param('id') id: string, @Request() req) {
    const adminId = req.user.sub;
    const isAdmin = await this.authService.isAdmin(adminId);
    if (!isAdmin) {
      throw new Error('Only admins can view specific coupons');
    }
    return this.salesService.findOneCoupon(+id);
  }

  @Get('coupons/code/:code')
  async findCouponByCode(@Param('code') code: string) {
    return this.salesService.findCouponByCode(code);
  }

  @Patch('coupons/:id')
  @UseGuards(JwtAuthGuard)
  async updateCoupon(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto, @Request() req) {
    const adminId = req.user.sub;
    const isAdmin = await this.authService.isAdmin(adminId);
    if (!isAdmin) {
      throw new Error('Only admins can update coupons');
    }
    return this.salesService.updateCoupon(+id, updateCouponDto, adminId);
  }

  @Delete('coupons/:id')
  @UseGuards(JwtAuthGuard)
  async removeCoupon(@Param('id') id: string, @Request() req) {
    const adminId = req.user.sub;
    const isAdmin = await this.authService.isAdmin(adminId);
    if (!isAdmin) {
      throw new Error('Only admins can delete coupons');
    }
    return this.salesService.removeCoupon(+id, adminId);
  }

  // Apply coupon endpoint (for users)
  @Post('coupons/apply')
  @UseGuards(JwtAuthGuard)
  async applyCoupon(@Body() applyCouponDto: ApplyCouponDto, @Request() req) {
    const userId = req.user.sub;
    return this.salesService.validateCoupon(applyCouponDto.code, userId, applyCouponDto.orderTotal);
  }
}
