import { IsNumber, IsPositive } from 'class-validator';

export class AssignRoleDto {
  @IsNumber()
  @IsPositive()
  userId: number;

  @IsNumber()
  @IsPositive()
  roleId: number;
}