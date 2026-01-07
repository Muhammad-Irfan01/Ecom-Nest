import { IsNumber, IsPositive, IsString, IsOptional, IsBoolean } from 'class-validator';

export class AddToCartDto {
  @IsNumber()
  @IsPositive()
  productId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  productVariantId?: string;

  @IsOptional()
  @IsString()
  options?: string;
}