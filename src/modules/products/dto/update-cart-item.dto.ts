import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsString()
  productVariantId?: string;
}