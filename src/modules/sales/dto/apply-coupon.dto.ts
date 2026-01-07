import { IsString, IsNumber } from 'class-validator';

export class ApplyCouponDto {
  @IsString()
  code: string;

  @IsNumber()
  orderTotal: number;
}