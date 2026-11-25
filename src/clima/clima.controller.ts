import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
} from '@nestjs/common';

import { buscarCiudades, obtenerClima } from './clima.service';

@Controller()
export class ClimaController {
  @Get('ciudades')
  async ciudades(@Query('nombre') nombre?: string) {
    const consulta = typeof nombre === 'string' ? nombre.trim() : '';

    if (consulta.length < 2) {
      throw new BadRequestException('Escribe al menos dos letras de la ciudad.');
    }

    const ciudades = await buscarCiudades(consulta);

    if (ciudades.length === 0) {
      throw new NotFoundException('No se encontró la ciudad.');
    }

    return ciudades;
  }

  @Get('clima')
  clima(
    @Query('latitud') latitud?: string,
    @Query('longitud') longitud?: string,
  ) {
    const lat =
      typeof latitud === 'string' && latitud.trim() ? Number(latitud) : NaN;
    const lon =
      typeof longitud === 'string' && longitud.trim() ? Number(longitud) : NaN;

    if (
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lon) ||
      lon < -180 ||
      lon > 180
    ) {
      throw new BadRequestException('Las coordenadas no son válidas.');
    }

    return obtenerClima(lat, lon);
  }
}