import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    // Implementation for creating a product
    // This would typically be for admin use
    throw new Error('Admin functionality not implemented in this scope');
  }

  async findAll() {
    return await this.prisma.products.findMany({
      where: { is_active: true },
      include: {
        product_translations: {
          where: { locale: 'en' }, // Default to English
          take: 1
        },
        product_categories: {
          include: {
            categories: true
          }
        }
      }
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.products.findUnique({
      where: { id },
      include: {
        product_translations: {
          where: { locale: 'en' }, // Default to English
          take: 1
        },
        product_categories: {
          include: {
            categories: true
          }
        },
        product_variations: true,
        product_options: true,
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // Implementation for updating a product
    // This would typically be for admin use
    throw new Error('Admin functionality not implemented in this scope');
  }

  async remove(id: number) {
    // Implementation for removing a product
    // This would typically be for admin use
    throw new Error('Admin functionality not implemented in this scope');
  }

  // Product Search Functionality
  async searchProducts(searchDto: SearchProductsDto) {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = searchDto;

    // Build where clause
    const whereClause: any = {
      is_active: true,
    };

    // Add search query condition
    if (q) {
      whereClause.OR = [
        {
          product_translations: {
            some: {
              name: { contains: q, mode: 'insensitive' },
            },
          },
        },
        {
          product_translations: {
            some: {
              description: { contains: q, mode: 'insensitive' },
            },
          },
        },
        {
          slug: { contains: q, mode: 'insensitive' },
        },
      ];
    }

    // Add category condition
    if (category) {
      whereClause.product_categories = {
        some: {
          categories: {
            slug: { equals: category }
          }
        }
      };
    }

    // Add price range condition
    if (minPrice !== undefined) {
      whereClause.price = {
        gte: minPrice,
        ...(whereClause.price ? { ...whereClause.price } : {}),
      };
    }
    if (maxPrice !== undefined) {
      whereClause.price = {
        ...(whereClause.price || {}),
        lte: maxPrice,
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build include clause for translations and categories
    const includeClause = {
      product_translations: {
        where: { locale: 'en' }, // Default to English
        take: 1
      },
      product_categories: {
        include: {
          categories: true
        }
      }
    };

    // Execute query
    const [products, total] = await Promise.all([
      this.prisma.products.findMany({
        where: whereClause,
        include: includeClause,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.products.count({ where: whereClause }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Cart Management Functionality
  async getCart(userId: number) {
    // Get user's cart from the carts table
    const cart = await this.prisma.carts.findUnique({
      where: { id: userId.toString() },
    });

    if (!cart) {
      return { items: [], total: 0, count: 0 };
    }

    // Parse cart data from JSON string
    const cartData = JSON.parse(cart.data || '{}');
    const cartItems = cartData.items || [];

    // Get product details for each item in the cart
    const detailedCartItems = await Promise.all(
      cartItems.map(async (item: any) => {
        const product = await this.prisma.products.findUnique({
          where: { id: item.productId },
          include: {
            product_translations: {
              where: { locale: 'en' },
              take: 1
            }
          }
        });

        if (!product) {
          return null;
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: product.id,
            name: product.product_translations[0]?.name || 'Unknown Product',
            price: product.price,
            slug: product.slug,
            image: product.product_translations[0]?.description?.includes('img')
              ? product.product_translations[0]?.description
              : null,
          },
          subtotal: Number(product.price || 0) * item.quantity,
        };
      })
    );

    // Filter out null items (products that were deleted)
    const validItems = detailedCartItems.filter(item => item !== null);

    // Calculate total
    const total = validItems.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      items: validItems,
      total,
      count: validItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  async addToCart(userId: number, addToCartDto: AddToCartDto) {
    const { productId, quantity, productVariantId, options } = addToCartDto;

    // Verify product exists and is active
    const product = await this.prisma.products.findUnique({
      where: {
        id: productId,
        is_active: true
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not available');
    }

    // Check if product has enough stock
    if (product.manage_stock && product.qty !== null && product.qty < quantity) {
      throw new BadRequestException('Insufficient stock for this product');
    }

    // Get existing cart or create new one
    let cart = await this.prisma.carts.findUnique({
      where: { id: userId.toString() },
    });

    let cartData: any = { items: [] };
    if (cart) {
      cartData = JSON.parse(cart.data || '{}');
    }

    // Check if product already exists in cart
    const existingItemIndex = cartData.items.findIndex(
      (item: any) => item.productId === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cartData.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cartData.items.push({
        productId,
        quantity,
        productVariantId,
        options,
      });
    }

    // Update or create cart
    if (cart) {
      await this.prisma.carts.update({
        where: { id: userId.toString() },
        data: {
          data: JSON.stringify(cartData),
          updated_at: new Date(),
        },
      });
    } else {
      await this.prisma.carts.create({
        data: {
          id: userId.toString(),
          data: JSON.stringify(cartData),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return { message: 'Product added to cart successfully' };
  }

  async updateCartItem(userId: number, productId: number, updateCartItemDto: UpdateCartItemDto) {
    const { quantity, productVariantId } = updateCartItemDto;

    // Get existing cart
    const cart = await this.prisma.carts.findUnique({
      where: { id: userId.toString() },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartData = JSON.parse(cart.data || '{}');

    // Find the item to update
    const itemIndex = cartData.items.findIndex(
      (item: any) => item.productId === productId
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    // Verify product exists and has enough stock if quantity is increasing
    const product = await this.prisma.products.findUnique({
      where: {
        id: productId,
        is_active: true
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not available');
    }

    if (quantity && product.manage_stock && product.qty !== null && product.qty < quantity) {
      throw new BadRequestException('Insufficient stock for this product');
    }

    // Update the item
    if (quantity !== undefined) {
      cartData.items[itemIndex].quantity = quantity;
    }

    if (productVariantId !== undefined) {
      cartData.items[itemIndex].productVariantId = productVariantId;
    }

    // Remove item if quantity is 0
    if (quantity === 0) {
      cartData.items.splice(itemIndex, 1);
    }

    // Update cart
    await this.prisma.carts.update({
      where: { id: userId.toString() },
      data: {
        data: JSON.stringify(cartData),
        updated_at: new Date(),
      },
    });

    return { message: 'Cart item updated successfully' };
  }

  async removeFromCart(userId: number, productId: number) {
    // Get existing cart
    const cart = await this.prisma.carts.findUnique({
      where: { id: userId.toString() },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartData = JSON.parse(cart.data || '{}');

    // Find the item to remove
    const itemIndex = cartData.items.findIndex(
      (item: any) => item.productId === productId
    );

    if (itemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    // Remove the item
    cartData.items.splice(itemIndex, 1);

    // Update cart
    await this.prisma.carts.update({
      where: { id: userId.toString() },
      data: {
        data: JSON.stringify(cartData),
        updated_at: new Date(),
      },
    });

    return { message: 'Product removed from cart successfully' };
  }

  async clearCart(userId: number) {
    await this.prisma.carts.delete({
      where: { id: userId.toString() },
    });

    return { message: 'Cart cleared successfully' };
  }

  // Bookmark/Wishlist Functionality
  async addBookmark(userId: number, productId: number) {
    // Verify product exists and is active
    const product = await this.prisma.products.findUnique({
      where: {
        id: productId,
        is_active: true
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not available');
    }

    // Check if already bookmarked
    const existingBookmark = await this.prisma.wish_lists.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId
        }
      }
    });

    if (existingBookmark) {
      throw new BadRequestException('Product already bookmarked');
    }

    // Add to wishlist
    await this.prisma.wish_lists.create({
      data: {
        user_id: userId,
        product_id: productId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return { message: 'Product added to bookmarks successfully' };
  }

  async removeBookmark(userId: number, productId: number) {
    // Remove from wishlist
    const result = await this.prisma.wish_lists.delete({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId
        }
      }
    });

    if (!result) {
      throw new NotFoundException('Bookmark not found');
    }

    return { message: 'Product removed from bookmarks successfully' };
  }

  async getUserBookmarks(userId: number) {
    // Get user's bookmarked products with details
    const bookmarks = await this.prisma.wish_lists.findMany({
      where: {
        user_id: userId
      },
      include: {
        products: {
          include: {
            product_translations: {
              where: { locale: 'en' },
              take: 1
            },
            product_categories: {
              include: {
                categories: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      items: bookmarks.map(bookmark => ({
        id: bookmark.products.id,
        name: bookmark.products.product_translations[0]?.name || 'Unknown Product',
        price: bookmark.products.price,
        slug: bookmark.products.slug,
        image: bookmark.products.product_translations[0]?.description?.includes('img')
          ? bookmark.products.product_translations[0]?.description
          : null,
        createdAt: bookmark.created_at,
      })),
      count: bookmarks.length
    };
  }

  async isBookmarked(userId: number, productId: number): Promise<boolean> {
    const bookmark = await this.prisma.wish_lists.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId
        }
      }
    });

    return !!bookmark;
  }

  // Checkout Functionality
  async checkout(userId: number, checkoutDto: CheckoutDto) {
    const { paymentMethod, shippingAddress, billingAddress, notes, sameAsShipping } = checkoutDto;

    // Get user details
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user's cart
    const cart = await this.prisma.carts.findUnique({
      where: { id: userId.toString() },
    });

    if (!cart || !JSON.parse(cart.data || '{}').items?.length) {
      throw new BadRequestException('Cart is empty');
    }

    const cartData = JSON.parse(cart.data);
    const cartItems = cartData.items;

    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Get product details and calculate totals
    let subTotal = 0;
    const orderProducts: any = [];

    for (const item of cartItems) {
      const product = await this.prisma.products.findUnique({
        where: {
          id: item.productId,
          is_active: true
        },
        include: {
          product_translations: {
            where: { locale: 'en' },
            take: 1
          }
        }
      });

      if (!product) {
        throw new BadRequestException(`Product with ID ${item.productId} not found or not available`);
      }

      // Check stock availability
      if (product.manage_stock && product.qty !== null && product.qty < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.product_translations[0]?.name || 'product'}`);
      }

      const itemTotal = Number(product.price || 0) * item.quantity;
      subTotal += itemTotal;

      orderProducts.push({
        product_id: product.id,
        unit_price: product.price || 0,
        qty: item.quantity,
        line_total: itemTotal,
      });
    }

    // Calculate shipping cost (simplified - in real app this would be more complex)
    const shippingCost = 0; // Could be calculated based on weight, distance, etc.

    // Calculate discount (simplified - could apply coupon codes here)
    const discount = 0; // Could apply coupon logic here

    // Calculate total
    const total = subTotal + shippingCost - discount;

    // Create order
    const order = await this.prisma.orders.create({
      data: {
        customer_id: userId,
        customer_email: user.email,
        customer_phone: user.phone,
        customer_first_name: user.first_name,
        customer_last_name: user.last_name,
        billing_first_name: user.first_name, // Using user's name as default
        billing_last_name: user.last_name,
        billing_address_1: billingAddress || 'Default Billing Address',
        billing_address_2: '',
        billing_city: 'Default City',
        billing_state: 'Default State',
        billing_zip: 'Default ZIP',
        billing_country: 'Default Country',
        shipping_first_name: user.first_name,
        shipping_last_name: user.last_name,
        shipping_address_1: shippingAddress || 'Default Shipping Address',
        shipping_address_2: '',
        shipping_city: 'Default City',
        shipping_state: 'Default State',
        shipping_zip: 'Default ZIP',
        shipping_country: 'Default Country',
        sub_total: subTotal,
        shipping_method: 'Standard',
        shipping_cost: shippingCost,
        discount: discount,
        total: total,
        payment_method: paymentMethod,
        currency: 'USD', // Could be dynamic based on user's locale
        currency_rate: 1, // Could be dynamic
        locale: 'en',
        status: 'pending', // Order status - could be 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
        note: notes || '',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Create order products
    for (const orderProduct of orderProducts) {
      await this.prisma.order_products.create({
        data: {
          order_id: order.id,
          product_id: orderProduct.product_id,
          unit_price: orderProduct.unit_price,
          qty: orderProduct.qty,
          line_total: orderProduct.line_total,
        },
      });

      // Update product stock if applicable
      const product = await this.prisma.products.findUnique({
        where: { id: orderProduct.product_id },
      });

      if (product && product.manage_stock && product.qty !== null) {
        await this.prisma.products.update({
          where: { id: orderProduct.product_id },
          data: {
            qty: product.qty - orderProduct.qty,
            updated_at: new Date(),
          },
        });
      }
    }

    // Clear the cart after successful checkout
    await this.prisma.carts.delete({
      where: { id: userId.toString() },
    });

    // Return order details
    return {
      message: 'Order placed successfully',
      orderId: order.id,
      total: order.total,
      status: order.status,
    };
  }
}
