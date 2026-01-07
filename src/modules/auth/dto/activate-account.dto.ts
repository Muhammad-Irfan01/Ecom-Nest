import { IsNotEmpty } from "class-validator";


export class ActivateAccountDto {
    @IsNotEmpty()
    code : string;
}