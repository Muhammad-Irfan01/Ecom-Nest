import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
  status: string;
}