import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class AccessProgramService {
  constructor(private prisma: PrismaService) {}

  // Get all access programs (using products as programs)
  async getAllAccessPrograms() {
    // Get products that represent access programs
    // In this implementation, we'll consider products as access programs
    const products = await this.prisma.products.findMany({
      where: { 
        is_active: true 
      },
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
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform products to access program format
    return products.map(product => ({
      id: product.id,
      name: product.product_translations[0]?.name || 'Unnamed Program',
      company: product.brand_id ? `Brand #${product.brand_id}` : 'Unknown Company',
      status: product.is_active ? 'Accepting new patients' : 'Closed',
      description: product.product_translations[0]?.description || '',
      estimatedDelivery: 'Available at checkout',
      slug: product.slug,
      price: product.price?.toString() || '0',
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));
  }

  // Get access program by ID
  async getAccessProgramById(id: number) {
    const product = await this.prisma.products.findUnique({
      where: { id },
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
    });

    if (!product) {
      throw new NotFoundException('Access program not found');
    }

    return {
      id: product.id,
      name: product.product_translations[0]?.name || 'Unnamed Program',
      company: product.brand_id ? `Brand #${product.brand_id}` : 'Unknown Company',
      status: product.is_active ? 'Accepting new patients' : 'Closed',
      description: product.product_translations[0]?.description || '',
      estimatedDelivery: 'Available at checkout',
      slug: product.slug,
      price: product.price?.toString() || '0',
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  }

  // Get patients for an access program (using orders with customer_id)
  async getPatientsForProgram(programId: number) {
    // This is a simplified implementation
    // In a real system, you might have a more direct relationship between programs and patients
    // For now, we'll return orders that might be related to the program
    
    // Get orders that contain products related to this program
    const orders = await this.prisma.orders.findMany({
      where: {
        order_products: {
          some: {
            product_id: programId
          }
        }
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
      }
    });

    // Extract patient information from orders
    const patients = orders.map(order => ({
      id: order.id,
      patientId: `ORD-${order.id}`, // Using order ID as patient ID
      firstName: order.customer_first_name,
      lastName: order.customer_last_name,
      email: order.customer_email,
      phone: order.customer_phone,
      programId: programId,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));

    return patients;
  }

  // Create a patient (create an order that represents a patient enrollment)
  async createPatient(createPatientDto: CreatePatientDto) {
    // In this implementation, creating a patient means creating an order
    // that represents their enrollment in a program
    
    // First, verify the program (product) exists
    const product = await this.prisma.products.findUnique({
      where: { id: createPatientDto.programId }
    });

    if (!product) {
      throw new NotFoundException('Program not found');
    }

    // Create an order that represents the patient enrollment
    const order = await this.prisma.orders.create({
      data: {
        customer_email: createPatientDto.email || `${createPatientDto.firstName}.${createPatientDto.lastName}@example.com`,
        customer_phone: createPatientDto.phone || '',
        customer_first_name: createPatientDto.firstName,
        customer_last_name: createPatientDto.lastName,
        billing_first_name: createPatientDto.firstName,
        billing_last_name: createPatientDto.lastName,
        billing_address_1: createPatientDto.address || 'N/A',
        billing_city: createPatientDto.city || 'N/A',
        billing_state: createPatientDto.state || 'N/A',
        billing_zip: createPatientDto.zip || 'N/A',
        billing_country: createPatientDto.country || 'N/A',
        shipping_first_name: createPatientDto.firstName,
        shipping_last_name: createPatientDto.lastName,
        shipping_address_1: createPatientDto.address || 'N/A',
        shipping_city: createPatientDto.city || 'N/A',
        shipping_state: createPatientDto.state || 'N/A',
        shipping_zip: createPatientDto.zip || 'N/A',
        shipping_country: createPatientDto.country || 'N/A',
        sub_total: 0,
        shipping_cost: 0,
        discount: 0,
        total: 0,
        payment_method: 'N/A',
        currency: 'USD',
        currency_rate: 1,
        locale: 'en',
        status: 'pending',
        note: `Patient enrollment for ${createPatientDto.firstName} ${createPatientDto.lastName}`,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    // Add the product to the order
    await this.prisma.order_products.create({
      data: {
        order_id: order.id,
        product_id: createPatientDto.programId,
        unit_price: product.price || 0,
        qty: 1,
        line_total: product.price || 0,
      }
    });

    return {
      id: order.id,
      patientId: `ORD-${order.id}`,
      firstName: order.customer_first_name,
      lastName: order.customer_last_name,
      email: order.customer_email,
      phone: order.customer_phone,
      programId: createPatientDto.programId,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }

  // Get all patients
  async getAllPatients() {
    const orders = await this.prisma.orders.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    return orders.map(order => ({
      id: order.id,
      patientId: `ORD-${order.id}`,
      firstName: order.customer_first_name,
      lastName: order.customer_last_name,
      email: order.customer_email,
      phone: order.customer_phone,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));
  }

  // Get patient by ID
  async getPatientById(id: number) {
    const order = await this.prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      throw new NotFoundException('Patient not found');
    }

    return {
      id: order.id,
      patientId: `ORD-${order.id}`,
      firstName: order.customer_first_name,
      lastName: order.customer_last_name,
      email: order.customer_email,
      phone: order.customer_phone,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }
}