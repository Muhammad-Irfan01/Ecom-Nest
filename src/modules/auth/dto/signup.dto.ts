import { IsEmail, isNotEmpty, IsNotEmpty, MinLength, IsOptional, IsString } from "class-validator";


export class SignupDto {
    @IsNotEmpty()
    firstName : string;

    @IsNotEmpty()
    lastName : string;

    @IsEmail()
    email : string;

    @IsNotEmpty()
    @MinLength(6)
    password : string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    jobRole?: string;

    @IsOptional()
    @IsString()
    licenseNumber?: string;

    @IsOptional()
    @IsString()
    extension?: string;

    @IsOptional()
    @IsString()
    instituteName?: string;

    @IsOptional()
    @IsString()
    addressLine1?: string;

    @IsOptional()
    @IsString()
    townCity?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    medicineSearch?: string;
}