import { IsNumber, IsPositive } from 'class-validator';

export class BookmarkProductDto {
  @IsNumber()
  @IsPositive()
  productId: number;
}