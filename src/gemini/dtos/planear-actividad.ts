import { IsLatitude, IsLongitude, IsString, Length } from 'class-validator';

export class PlanearActividadDto {
  @IsString()
  @Length(2, 80)
  actividad: string;

  @IsString()
  @Length(2, 250)
  ubicacion: string;

  @IsLatitude()
  latitud: number;

  @IsLongitude()
  longitud: number;
}