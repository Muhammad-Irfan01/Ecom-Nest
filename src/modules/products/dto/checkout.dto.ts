import { IsNumber, IsPositive, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CheckoutDto {
  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  sameAsShipping?: boolean = true;
}