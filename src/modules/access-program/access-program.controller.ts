import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccessProgramService } from './access-program.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('access-program')
export class AccessProgramController {
  constructor(private readonly accessProgramService: AccessProgramService) {}

  // Get all access programs
  @Get()
  getAllAccessPrograms() {
    return this.accessProgramService.getAllAccessPrograms();
  }

  // Get access program by ID
  @Get(':id')
  getAccessProgramById(@Param('id') id: string) {
    return this.accessProgramService.getAccessProgramById(+id);
  }

  // Get patients for a specific program
  @Get(':id/patients')
  @UseGuards(JwtAuthGuard)
  getPatientsForProgram(@Param('id') id: string) {
    return this.accessProgramService.getPatientsForProgram(+id);
  }

  // Get all patients
  @Get('patients/all')
  @UseGuards(JwtAuthGuard)
  getAllPatients() {
    return this.accessProgramService.getAllPatients();
  }

  // Get patient by ID
  @Get('patients/:id')
  @UseGuards(JwtAuthGuard)
  getPatientById(@Param('id') id: string) {
    return this.accessProgramService.getPatientById(+id);
  }

  // Create a patient (enroll in a program)
  @Post('patients')
  @UseGuards(JwtAuthGuard)
  createPatient(@Request() req, @Body() createPatientDto: CreatePatientDto) {
    return this.accessProgramService.createPatient(createPatientDto, req.user);
  }
}