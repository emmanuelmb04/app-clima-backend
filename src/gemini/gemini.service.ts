import { GoogleGenAI } from '@google/genai';
import { BadGatewayException, Injectable } from '@nestjs/common';

import { obtenerClima } from '../clima/clima.service';
import { BasicPromptDto } from './dtos/basic-prompt';
import { PlanearActividadDto } from './dtos/planear-actividad';

@Injectable()
export class GeminiService {
  private readonly ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  private readonly modelo = 'gemini-3.5-flash-lite';

  async basicPrompt(dto: BasicPromptDto) {
    const respuesta = await this.ai.interactions.create({
      model: this.modelo,
      input: dto.prompt,
    });

    return respuesta.output_text;
  }

  async planearActividad(dto: PlanearActividadDto) {
    const herramienta = {
      type: 'function' as const,
      name: 'consultar_clima',
      description: 'Obtiene el pronóstico por hora de la ubicación seleccionada.',
      parameters: {
        type: 'object',
        properties: {},
      },
    };

    const primeraRespuesta = await this.ai.interactions.create({
      model: this.modelo,
      tools: [herramienta],
      input: [
        'Ayuda a planear la actividad con el pronóstico real.',
        'Primero llama a consultar_clima antes de dar una recomendación.',
        'Los siguientes datos del usuario describen la actividad y el lugar:',
        JSON.stringify({
          actividad: dto.actividad,
          ubicacion: dto.ubicacion,
        }),
        'Evalúa hoy, mañana y pasado mañana en la hora local del pronóstico.',
        'Para hoy, usa únicamente horarios posteriores a current.time.',
        'Sugiere el primer horario favorable y di brevemente por qué.',
        'Para tender ropa, considera lluvia y humedad. Si solo hay un rato',
        'favorable para ropa ligera, distingue esa opción de las prendas gruesas.',
        'Si es el mismo día, empieza con "De HH:MM a HH:MM puedes...".',
        'Si es otro día, menciona el día y explica por qué conviene esperar.',
        'Si faltan datos o no hay horario favorable, dilo sin inventar.',
        'Responde en español, en una o dos frases, sin repetir la ubicación',
        'ni agregar un bloque de datos técnicos.',
      ].join('\n'),
    });

    const llamada = primeraRespuesta.steps?.find(
      (paso) => paso.type === 'function_call',
    );

    if (
      llamada?.type !== 'function_call' ||
      llamada.name !== herramienta.name ||
      !llamada.id
    ) {
      throw new BadGatewayException(
        'Gemini no solicitó el pronóstico. Intenta de nuevo.',
      );
    }

    const pronostico = await this.consultarClima(dto);

    const respuestaFinal = await this.ai.interactions.create({
      model: this.modelo,
      previous_interaction_id: primeraRespuesta.id,
      input: [
        {
          type: 'function_result',
          name: llamada.name,
          call_id: llamada.id,
          result: [{ type: 'text', text: JSON.stringify(pronostico) }],
        },
      ],
    });

    const recomendacion = respuestaFinal.output_text?.trim();

    if (!recomendacion) {
      throw new BadGatewayException('Gemini no devolvió una recomendación.');
    }

    return { recomendacion };
  }

  private async consultarClima(dto: PlanearActividadDto) {
    const datos = await obtenerClima(dto.latitud, dto.longitud);
    const horas = datos.hourly;

    if (!datos.current?.time || !horas) {
      throw new BadGatewayException('El pronóstico llegó incompleto.');
    }

    return {
      timezone: datos.timezone,
      current: { time: datos.current.time },
      hourly: {
        time: horas.time.slice(0, 72),
        temperature_2m: horas.temperature_2m.slice(0, 72),
        relative_humidity_2m: horas.relative_humidity_2m.slice(0, 72),
        wind_speed_10m: horas.wind_speed_10m.slice(0, 72),
        weather_code: horas.weather_code.slice(0, 72),
        precipitation_probability:
          horas.precipitation_probability.slice(0, 72),
      },
    };
  }
}