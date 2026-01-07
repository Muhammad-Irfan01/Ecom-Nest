import { IsString, IsNumber, IsBoolean, IsOptional, IsDate, ValidateNested, IsArray, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

class FlashSaleProductDto {
  @IsNumber()
  @IsPositive()
  productId: number;

  @IsDate()
  endDate: Date;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  position?: number;
}

class FlashSaleTranslationDto {
  @IsString()
  locale: string;

  @IsString()
  campaignName: string;
}

export class CreateSaleDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashSaleProductDto)
  products?: FlashSaleProductDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashSaleTranslationDto)
  translations?: FlashSaleTranslationDto[];
}