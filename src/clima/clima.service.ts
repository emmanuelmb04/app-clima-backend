import {
  BadGatewayException,
  GatewayTimeoutException,
} from '@nestjs/common';

export interface Pronostico  {
  timezone: string;
  current: { time: string };
  hourly: {
    time: string[];
    temperature_2m: Array<number | null>;
    relative_humidity_2m: Array<number | null>;
    wind_speed_10m: Array<number | null>;
    weather_code: Array<number | null>;
    precipitation_probability: Array<number | null>;
  };
}

async function consultarOpenMeteo<T>(
  direccion: string,
  parametros: Record<string, string>,
): Promise<T> {
  const url = new URL(direccion);
  url.search = new URLSearchParams(parametros).toString();

  try {
    const respuesta = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!respuesta.ok) {
      throw new Error(`Open-Meteo respondió con ${respuesta.status}`);
    }

    return (await respuesta.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new GatewayTimeoutException(
        'El servicio meteorológico tardó demasiado.',
      );
    }

    throw new BadGatewayException(
      'El servicio meteorológico no está disponible.',
    );
  }
}

export async function buscarCiudades(nombre: string) {
  const datos = await consultarOpenMeteo<{ results?: unknown[] }>(
    'https://geocoding-api.open-meteo.com/v1/search',
    { name: nombre, count: '8', language: 'es' },
  );

  return datos.results ?? [];
}

export function obtenerClima(latitud: number, longitud: number) {
  return consultarOpenMeteo<Pronostico>(
    'https://api.open-meteo.com/v1/forecast',
    {
      latitude: String(latitud),
      longitude: String(longitud),
      timezone: 'auto',
      current:
        'temperature_2m,apparent_temperature,relative_humidity_2m,' +
        'surface_pressure,wind_speed_10m,weather_code,is_day',
      hourly:
        'precipitation_probability,temperature_2m,relative_humidity_2m,' +
        'wind_speed_10m,weather_code',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,' +
        'precipitation_probability_max',
      forecast_days: '6',
    },
  );
}