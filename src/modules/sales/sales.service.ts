import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  // Flash Sales Management
  async createFlashSale(createSaleDto: CreateSaleDto, adminId: number) {
    // Verify admin privileges
    const adminRoles = await this.prisma.user_roles.findMany({
      where: { user_id: adminId },
      include: {
        roles: true
      }
    });

    const isAdmin = adminRoles.some(ur =>
      ur.roles.permissions?.includes('admin') ||
      ur.roles.permissions?.includes('superadmin')
    );

    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can create flash sales');
    }

    // Create flash sale
    const flashSale = await this.prisma.flash_sales.create({
      data: {
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    // Add products to the flash sale if provided
    if (createSaleDto.products && createSaleDto.products.length > 0) {
      for (const product of createSaleDto.products) {
        await this.prisma.flash_sale_products.create({
          data: {
            flash_sale_id: flashSale.id,
            product_id: product.productId,
            end_date: product.endDate,
            price: product.price,
            qty: product.quantity || 0,
            position: product.position || 0,
          }
        });
      }
    }

    // Add translations if provided
    if (createSaleDto.translations && createSaleDto.translations.length > 0) {
      for (const translation of createSaleDto.translations) {
        await this.prisma.flash_sale_translations.create({
          data: {
            flash_sale_id: flashSale.id,
            locale: translation.locale,
            campaign_name: translation.campaignName,
          }
        });
      }
    }

    return {
      message: 'Flash sale created successfully',
      flashSale
    };
  }

  async findAllFlashSales() {
    const flashSales = await this.prisma.flash_sales.findMany({
      include: {
        flash_sale_products: {
          include: {
            products: {
              include: {
                product_translations: {
                  where: { locale: 'en' },
                  take: 1
                }
              }
            }
          }
        },
        flash_sale_translations: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return flashSales.map(flashSale => ({
      id: flashSale.id,
      createdAt: flashSale.created_at,
      updatedAt: flashSale.updated_at,
      products: flashSale.flash_sale_products.map(fsp => ({
        id: fsp.id,
        productId: fsp.product_id,
        productName: fsp.products?.product_translations[0]?.name || 'Unknown Product',
        endDate: fsp.end_date,
        price: fsp.price,
        quantity: fsp.qty,
        position: fsp.position,
      })),
      translations: flashSale.flash_sale_translations
    }));
  }

  async findActiveFlashSales() {
    const now = new Date();

    const activeFlashSales = await this.prisma.flash_sale_products.findMany({
      where: {
        end_date: {
          gte: now,
        },
        flash_sales: {
          flash_sale_products: {
            some: {
              end_date: {
                gte: now,
              }
            }
          }
        }
      },
      include: {
        products: {
          include: {
            product_translations: {
              where: { locale: 'en' },
              take: 1
            }
          }
        },
        flash_sales: {
          include: {
            flash_sale_translations: true
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });

    return activeFlashSales.map(item => ({
      id: item.id,
      flashSaleId: item.flash_sale_id,
      productId: item.product_id,
      productName: item.products?.product_translations[0]?.name || 'Unknown Product',
      endDate: item.end_date,
      originalPrice: item.products?.price,
      salePrice: item.price,
      quantity: item.qty,
      position: item.position,
      campaignName: item.flash_sales.flash_sale_translations[0]?.campaign_name || 'Flash Sale',
    }));
  }

  async findOneFlashSale(id: number) {
    const flashSale = await this.prisma.flash_sales.findUnique({
      where: { id },
      include: {
        flash_sale_products: {
          include: {
            products: {
              include: {
                product_translations: {
                  where: { locale: 'en' },
                  take: 1
                }
              }
            }
          }
        },
        flash_sale_translations: true
      }
    });

    if (!flashSale) {
      throw new NotFoundException('Flash sale not found');
    }

    return {
      id: flashSale.id,
      createdAt: flashSale.created_at,
      updatedAt: flashSale.updated_at,
      products: flashSale.flash_sale_products.map(fsp => ({
        id: fsp.id,
        productId: fsp.product_id,
        productName: fsp.products?.product_translations[0]?.name || 'Unknown Product',
        endDate: fsp.end_date,
        price: fsp.price,
        quantity: fsp.qty,
        position: fsp.position,
      })),
      translations: flashSale.flash_sale_translations
    };
  }

  async updateFlashSale(id: number, updateSaleDto: UpdateSaleDto, adminId: number) {
    // Verify admin privileges
    const adminRoles = await this.prisma.user_roles.findMany({
      where: { user_id: adminId },
      include: {
        roles: true
      }
    });

    const isAdmin = adminRoles.some(ur =>
      ur.roles.permissions?.includes('admin') ||
      ur.roles.permissions?.includes('superadmin')
    );

    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can update flash sales');
    }

    // Check if flash sale exists
    const existingFlashSale = await this.prisma.flash_sales.findUnique({
      where: { id }
    });

    if (!existingFlashSale) {
      throw new NotFoundException('Flash sale not found');
    }

    // Update flash sale
    const updatedFlashSale = await this.prisma.flash_sales.update({
      where: { id },
      data: {
        updated_at: new Date(),
      }
    });

    // Update products if provided
    if (updateSaleDto.products) {
      // Delete existing products for this flash sale
      await this.prisma.flash_sale_products.deleteMany({
        where: { flash_sale_id: id }
      });

      // Add new products
      for (const product of updateSaleDto.products) {
        await this.prisma.flash_sale_products.create({
          data: {
            flash_sale_id: id,
            product_id: product.productId,
            end_date: product.endDate,
            price: product.price,
            qty: product.quantity || 0,
            position: product.position || 0,
          }
        });
      }
    }

    // Update translations if provided
    if (updateSaleDto.translations) {
      // Delete existing translations for this flash sale
      await this.prisma.flash_sale_translations.deleteMany({
        where: { flash_sale_id: id }
      });

      // Add new translations
      for (const translation of updateSaleDto.translations) {
        await this.prisma.flash_sale_translations.create({
          data: {
            flash_sale_id: id,
            locale: translation.locale,
            campaign_name: translation.campaignName,
          }
        });
      }
    }

    return {
      message: 'Flash sale updated successfully',
      flashSale: updatedFlashSale
    };
  }

  async removeFlashSale(id: number, adminId: number) {
    // Verify admin privileges
    const adminRoles = await this.prisma.user_roles.findMany({
      where: { user_id: adminId },
      include: {
        roles: true
      }
    });

    const isAdmin = adminRoles.some(ur =>
      ur.roles.permissions?.includes('admin') ||
      ur.roles.permissions?.includes('superadmin')
    );

    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can delete flash sales');
    }

    // Check if flash sale exists
    const existingFlashSale = await this.prisma.flash_sales.findUnique({
      where: { id }
    });

    if (!existingFlashSale) {
      throw new NotFoundException('Flash sale not found');
    }

    // Delete related records first (due to foreign key constraints)
    await this.prisma.flash_sale_products.deleteMany({
      where: { flash_sale_id: id }
    });

    await this.prisma.flash_sale_translations.deleteMany({
      where: { flash_sale_id: id }
    });

    // Delete the flash sale
    await this.prisma.flash_sales.delete({
      where: { id }
    });

    return { message: 'Flash sale deleted successfully' };
  }

  // Coupon Management
  async createCoupon(createCouponDto: any, adminId: number) {
    // Verify admin privileges
    const adminRoles = await this.prisma.user_roles.findMany({
      where: { user_id: adminId },
      include: {
        roles: true
      }
    });

    const isAdmin = adminRoles.some(ur =>
      ur.roles.permissions?.includes('admin') ||
      ur.roles.permissions?.includes('superadmin')
    );

    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can create coupons');
    }

    // Check if coupon code already exists
    const existingCoupon = await this.prisma.coupons.findFirst({
      where: { code: createCouponDto.code }
    });

    if (existingCoupon) {
      throw new BadRequestException('Coupon code already exists');
    }

    // Create coupon
    const coupon = await this.prisma.coupons.create({
      data: {
        code: createCouponDto.code,
        value: createCouponDto.value,
        is_percent: createCouponDto.isPercent || false,
        free_shipping: createCouponDto.freeShipping || false,
        minimum_spend: createCouponDto.minimumSpend || null,
        maximum_spend: createCouponDto.maximumSpend || null,
        usage_limit_per_coupon: createCouponDto.usageLimitPerCoupon || null,
        usage_limit_per_customer: createCouponDto.usageLimitPerCustomer || null,
        is_active: createCouponDto.isActive !== undefined ? createCouponDto.isActive : true,
        start_date: createCouponDto.startDate || null,
        end_date: createCouponDto.endDate || null,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    return {
      message: 'Coupon created successfully',
      coupon
    };
  }

  async findAllCoupons() {
    const coupons = await this.prisma.coupons.findMany({
      include: {
        coupon_translations: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return coupons.map(coupon => ({
      id: coupon.id,
      code: coupon.code,
      value: coupon.value,
      isPercent: coupon.is_percent,
      freeShipping: coupon.free_shipping,
      minimumSpend: coupon.minimum_spend,
      maximumSpend: coupon.maximum_spend,
      usageLimitPerCoupon: coupon.usage_limit_per_coupon,
      usageLimitPerCustomer: coupon.usage_limit_per_customer,
      used: coupon.used,
      isActive: coupon.is_active,
      startDate: coupon.start_date,
      endDate: coupon.end_date,
      createdAt: coupon.created_at,
      updatedAt: coupon.updated_at,
      translations: coupon.coupon_translations
    }));
  }

  async findOneCoupon(id: number) {
    const coupon = await this.prisma.coupons.findUnique({
      where: { id },
      include: {
        coupon_translations: true
      }
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      id: coupon.id,
      code: coupon.code,
      value: coupon.value,
      isPercent: coupon.is_percent,
      freeShipping: coupon.free_shipping,
      minimumSpend: coupon.minimum_spend,
      maximumSpend: coupon.maximum_spend,
      usageLimitPerCoupon: coupon.usage_limit_per_coupon,
      usageLimitPerCustomer: coupon.usage_limit_per_customer,
      used: coupon.used,
      isActive: coupon.is_active,
      startDate: coupon.start_date,
      endDate: coupon.end_date,
      createdAt: coupon.created_at,
      updatedAt: coupon.updated_at,
      translations: coupon.coupon_translations
    };
  }

  async findCouponByCode(code: string) {
    const coupon = await this.prisma.coupons.findFirst({
      where: {
        code,
        is_active: true,
        start_date: { lte: new Date() },
        end_date: { gte: new Date() }
      },
      include: {
        coupon_translations: true
      }
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found or not active');
    }

    // Check if coupon has reached usage limits
    if (coupon.usage_limit_per_coupon && coupon.used >= coupon.usage_limit_per_coupon) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    return {
      id: coupon.id,
      code: coupon.code,
      value: coupon.value,
      isPercent: coupon.is_percent,
      freeShipping: coupon.free_shipping,
      minimumSpend: coupon.minimum_spend,
      maximumSpend: coupon.maximum_spend,
      usageLimitPerCoupon: coupon.usage_limit_per_coupon,
      usageLimitPerCustomer: coupon.usage_limit_per_customer,
      used: coupon.used,
      isActive: coupon.is_active,
      startDate: coupon.start_date,
      endDate: coupon.end_date,
      createdAt: coupon.created_at,
      updatedAt: coupon.updated_at,
      translations: coupon.coupon_translations
    };
  }

  async updateCoupon(id: number, updateCouponDto: any, adminId: number) {
    // Verify admin privileges
    const adminRoles = await this.prisma.user_roles.findMany({
      where: { user_id: adminId },
      include: {
        roles: true
      }
    });

    const isAdmin = adminRoles.some(ur =>
      ur.roles.permissions?.includes('admin') ||
      ur.roles.permissions?.includes('superadmin')
    );

    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can update coupons');
    }

    // Check if coupon exists
    const existingCoupon = await this.prisma.coupons.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Update coupon
    const updatedCoupon = await this.prisma.coupons.update({
      where: { id },
      data: {
        ...updateCouponDto,
        updated_at: new Date(),
      }
    });

    return {
      message: 'Coupon updated successfully',
      coupon: updatedCoupon
    };
  }

  async removeCoupon(id: number, adminId: number) {
    // Verify admin privileges
    const adminRoles = await this.prisma.user_roles.findMany({
      where: { user_id: adminId },
      include: {
        roles: true
      }
    });

    const isAdmin = adminRoles.some(ur =>
      ur.roles.permissions?.includes('admin') ||
      ur.roles.permissions?.includes('superadmin')
    );

    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can delete coupons');
    }

    // Check if coupon exists
    const existingCoupon = await this.prisma.coupons.findUnique({
      where: { id }
    });

    if (!existingCoupon) {
      throw new NotFoundException('Coupon not found');
    }

    // Delete related records first (due to foreign key constraints)
    await this.prisma.coupon_translations.deleteMany({
      where: { coupon_id: id }
    });

    await this.prisma.coupon_products.deleteMany({
      where: { coupon_id: id }
    });

    await this.prisma.coupon_categories.deleteMany({
      where: { coupon_id: id }
    });

    // Delete the coupon
    await this.prisma.coupons.delete({
      where: { id }
    });

    return { message: 'Coupon deleted successfully' };
  }

  // Apply coupon to order (for validation)
  async validateCoupon(code: string, userId: number, orderTotal: number) {
    const coupon = await this.prisma.coupons.findFirst({
      where: {
        code,
        is_active: true,
        start_date: { lte: new Date() },
        end_date: { gte: new Date() }
      }
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found or not active');
    }

    // Check if coupon has reached usage limits
    if (coupon.usage_limit_per_coupon && coupon.used >= coupon.usage_limit_per_coupon) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // Check if user has reached personal usage limit
    if (coupon.usage_limit_per_customer) {
      const userCouponUsage = await this.prisma.orders.count({
        where: {
          customer_id: userId,
          coupon_id: coupon.id
        }
      });

      if (userCouponUsage >= coupon.usage_limit_per_customer) {
        throw new BadRequestException('Coupon usage limit reached for this user');
      }
    }

    // Check minimum spend requirement
    if (coupon.minimum_spend && orderTotal < Number(coupon.minimum_spend)) {
      throw new BadRequestException(`Minimum spend of ${coupon.minimum_spend} required for this coupon`);
    }

    // Check maximum spend requirement
    if (coupon.maximum_spend && orderTotal > Number(coupon.maximum_spend)) {
      throw new BadRequestException(`Maximum spend of ${coupon.maximum_spend} allowed for this coupon`);
    }

    return {
      id: coupon.id,
      code: coupon.code,
      value: coupon.value,
      isPercent: coupon.is_percent,
      freeShipping: coupon.free_shipping,
      discount: coupon.is_percent
        ? (orderTotal * Number(coupon.value)) / 100
        : Number(coupon.value)
    };
  }
}
