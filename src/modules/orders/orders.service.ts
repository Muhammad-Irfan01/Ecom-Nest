import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    // This method would typically be called internally after checkout
    // For now, we'll throw an error since orders should be created through checkout
    throw new Error('Orders should be created through checkout process, not directly');
  }

  async findAll(userId: number, isAdmin: boolean = false) {
    // If user is admin, return all orders
    // If user is not admin, return only their orders
    const whereClause: any = {};

    if (!isAdmin) {
      whereClause.customer_id = userId;
    }

    const orders = await this.prisma.orders.findMany({
      where: whereClause,
      include: {
        order_products: {
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
        transactions: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return orders.map(order => ({
      id: order.id,
      customerId: order.customer_id,
      customerEmail: order.customer_email,
      customerName: `${order.customer_first_name} ${order.customer_last_name}`,
      status: order.status,
      total: order.total,
      paymentMethod: order.payment_method,
      currency: order.currency,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      trackingReference: order.tracking_reference,
      note: order.note,
      products: order.order_products.map(op => ({
        id: op.id,
        productId: op.product_id,
        productName: op.products?.product_translations[0]?.name || 'Unknown Product',
        unitPrice: op.unit_price,
        quantity: op.qty,
        lineTotal: op.line_total,
      })),
      transaction: order.transactions || null
    }));
  }

  async findOne(id: number, userId: number, isAdmin: boolean = false) {
    // If user is admin, allow access to any order
    // If user is not admin, only allow access to their own orders
    const whereClause: any = { id };

    if (!isAdmin) {
      whereClause.customer_id = userId;
    }

    const order = await this.prisma.orders.findFirst({
      where: whereClause,
      include: {
        order_products: {
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
        transactions: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      id: order.id,
      customerId: order.customer_id,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      customerName: `${order.customer_first_name} ${order.customer_last_name}`,
      billingAddress: {
        firstName: order.billing_first_name,
        lastName: order.billing_last_name,
        address1: order.billing_address_1,
        address2: order.billing_address_2,
        city: order.billing_city,
        state: order.billing_state,
        zip: order.billing_zip,
        country: order.billing_country,
      },
      shippingAddress: {
        firstName: order.shipping_first_name,
        lastName: order.shipping_last_name,
        address1: order.shipping_address_1,
        address2: order.shipping_address_2,
        city: order.shipping_city,
        state: order.shipping_state,
        zip: order.shipping_zip,
        country: order.shipping_country,
      },
      subTotal: order.sub_total,
      shippingMethod: order.shipping_method,
      shippingCost: order.shipping_cost,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.payment_method,
      currency: order.currency,
      currencyRate: order.currency_rate,
      locale: order.locale,
      status: order.status,
      note: order.note,
      trackingReference: order.tracking_reference,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      products: order.order_products.map(op => ({
        id: op.id,
        productId: op.product_id,
        productName: op.products?.product_translations[0]?.name || 'Unknown Product',
        unitPrice: op.unit_price,
        quantity: op.qty,
        lineTotal: op.line_total,
      })),
      transaction: order.transactions || null
    };
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number, isAdmin: boolean = false) {
    // Only admins can update orders
    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can update orders');
    }

    // Get the existing order to check if it exists
    const existingOrder = await this.prisma.orders.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    // Update the order
    const updatedOrder = await this.prisma.orders.update({
      where: { id },
      data: {
        ...updateOrderDto,
        updated_at: new Date(),
      },
    });

    return {
      message: 'Order updated successfully',
      order: updatedOrder
    };
  }

  async remove(id: number, userId: number, isAdmin: boolean = false) {
    // Only admins can delete orders
    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can delete orders');
    }

    // Check if order exists
    const existingOrder = await this.prisma.orders.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    // Delete related records first (due to foreign key constraints)
    await this.prisma.order_products.deleteMany({
      where: { order_id: id }
    });

    // Delete the order
    await this.prisma.orders.delete({
      where: { id }
    });

    return { message: 'Order deleted successfully' };
  }

  // Get orders by status
  async findByStatus(status: string, userId: number, isAdmin: boolean = false) {
    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can view orders by status');
    }

    const orders = await this.prisma.orders.findMany({
      where: {
        status
      },
      include: {
        order_products: {
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
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return orders.map(order => ({
      id: order.id,
      customerId: order.customer_id,
      customerEmail: order.customer_email,
      customerName: `${order.customer_first_name} ${order.customer_last_name}`,
      status: order.status,
      total: order.total,
      paymentMethod: order.payment_method,
      currency: order.currency,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      products: order.order_products.map(op => ({
        id: op.id,
        productId: op.product_id,
        productName: op.products?.product_translations[0]?.name || 'Unknown Product',
        unitPrice: op.unit_price,
        quantity: op.qty,
        lineTotal: op.line_total,
      }))
    }));
  }

  // Get user's order history
  async getUserOrderHistory(userId: number) {
    const orders = await this.prisma.orders.findMany({
      where: {
        customer_id: userId
      },
      include: {
        order_products: {
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
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return orders.map(order => ({
      id: order.id,
      status: order.status,
      total: order.total,
      paymentMethod: order.payment_method,
      currency: order.currency,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      trackingReference: order.tracking_reference,
      products: order.order_products.map(op => ({
        id: op.id,
        productId: op.product_id,
        productName: op.products?.product_translations[0]?.name || 'Unknown Product',
        quantity: op.qty,
        lineTotal: op.line_total,
      }))
    }));
  }

  // Update order status (for admin use)
  async updateOrderStatus(orderId: number, status: string, adminId: number) {
    // Verify admin privileges
    const adminRoles = await this.prisma.user_roles.findMany({
      where: { user_id: adminId },
      include: {
        roles: true
      }
    });

    const isAdmin = adminRoles.some(ur =>
      ur.roles.permissions?.includes('admin') ||
      ur.roles.permissions?.includes('superadmin') ||
      ur.roles.role_translations?.some(rt => rt.name?.toLowerCase().includes('admin'))
    );

    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can update order status');
    }

    const existingOrder = await this.prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.orders.update({
      where: { id: orderId },
      data: {
        status,
        updated_at: new Date(),
      }
    });

    return {
      message: 'Order status updated successfully',
      order: updatedOrder
    };
  }
}
