import { IsString, IsNumber, IsBoolean, IsOptional, IsDate, IsPositive, Min, Max } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsBoolean()
  isPercent?: boolean;

  @IsOptional()
  @IsBoolean()
  freeShipping?: boolean;

  @IsOptional()
  @IsNumber()
  minimumSpend?: number;

  @IsOptional()
  @IsNumber()
  maximumSpend?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  usageLimitPerCoupon?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  usageLimitPerCustomer?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;
}