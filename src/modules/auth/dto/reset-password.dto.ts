import { IsNotEmpty, MinLength } from "class-validator";


export class ResetPasswordDto {
    @IsNotEmpty()
    code : string;

    @IsNotEmpty()
    @MinLength(6)
    password : string
}