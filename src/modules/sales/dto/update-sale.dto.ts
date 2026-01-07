import { IsString, IsNumber, IsBoolean, IsOptional, IsDate, ValidateNested, IsArray, IsPositive, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSaleDto } from './create-sale.dto';

export class UpdateSaleDto extends CreateSaleDto {
  // Extends CreateSaleDto to include all the same fields
  // but makes them optional for updates
}