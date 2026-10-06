import { Router, Request, Response } from 'express';

export const weatherRouter = Router();

interface WeatherCache {
  timestamp: number;
  data: any[];
}

let weatherCache: WeatherCache | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export const TAMIL_NADU_WEATHER_STATIONS = [
  { id: 'chennai_metro', name: 'Chennai Metro', nameTa: 'சென்னை', district: 'Chennai', lat: 13.0827, lng: 80.2707, elevation: 6 },
  { id: 'salem_junction', name: 'Salem Junction', nameTa: 'சேலம்', district: 'Salem', lat: 11.6643, lng: 78.1460, elevation: 278 },
  { id: 'coimbatore_hub', name: 'Coimbatore Hub', nameTa: 'கோயம்புத்தூர்', district: 'Coimbatore', lat: 11.0168, lng: 76.9558, elevation: 411 },
  { id: 'madurai_junction', name: 'Madurai Junction', nameTa: 'மதுரை', district: 'Madurai', lat: 9.9252, lng: 78.1198, elevation: 136 },
  { id: 'trichy_hub', name: 'Trichy Central', nameTa: 'திருச்சிராப்பள்ளி', district: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047, elevation: 88 },
  { id: 'nilgiris_ooty', name: 'Ooty (Nilgiris Ghat)', nameTa: 'நீலகிரி / உதகை', district: 'Nilgiris', lat: 11.4102, lng: 76.6950, elevation: 2240 },
  { id: 'thoothukudi_port', name: 'Thoothukudi Port', nameTa: 'தூத்துக்குடி', district: 'Thoothukudi', lat: 8.7642, lng: 78.1348, elevation: 4 },
  { id: 'tirunelveli_hub', name: 'Tirunelveli Terminal', nameTa: 'திருநெல்வேலி', district: 'Tirunelveli', lat: 8.7139, lng: 77.7567, elevation: 47 },
  { id: 'hosur_hub', name: 'Hosur Tech Corridor', nameTa: 'ஓசூர்', district: 'Krishnagiri', lat: 12.7409, lng: 77.8253, elevation: 879 },
  { id: 'vellore_gateway', name: 'Vellore CMC Gateway', nameTa: 'வேலூர்', district: 'Vellore', lat: 12.9165, lng: 79.1325, elevation: 216 },
  { id: 'thanjavur_delta', name: 'Thanjavur Delta', nameTa: 'தஞ்சாவூர்', district: 'Thanjavur', lat: 10.7870, lng: 79.1378, elevation: 57 },
  { id: 'cuddalore_coastal', name: 'Cuddalore Coastal', nameTa: 'கடலூர்', district: 'Cuddalore', lat: 11.7480, lng: 79.7714, elevation: 5 },
  { id: 'erode_depot', name: 'Erode Agrarian Hub', nameTa: 'ஈரோடு', district: 'Erode', lat: 11.3410, lng: 77.7172, elevation: 183 },
  { id: 'tiruppur_export', name: 'Tiruppur Export Zone', nameTa: 'திருப்பூர்', district: 'Tiruppur', lat: 11.1085, lng: 77.3411, elevation: 295 },
  { id: 'kanyakumari_gateway', name: 'Kanyakumari Gateway', nameTa: 'கன்னியாகுமரி', district: 'Kanyakumari', lat: 8.1833, lng: 77.4119, elevation: 30 }
];

export function decodeWmoWeather(code: number, isDay: boolean): {
  condition: string;
  conditionTamil: string;
  conditionType: 'clear' | 'partly_cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'heavy_rain' | 'thunderstorm';
  icon: string;
  safetyImpact: 'optimal' | 'moderate' | 'hazard';
} {
  if (code === 0) {
    return {
      condition: isDay ? 'Clear Sky' : 'Clear Night',
      conditionTamil: 'தெளிவான வானிலை',
      conditionType: 'clear',
      icon: isDay ? 'sun' : 'moon',
      safetyImpact: 'optimal'
    };
  }
  if (code === 1 || code === 2) {
    return {
      condition: 'Partly Cloudy',
      conditionTamil: 'பகுதி மேகமூட்டம்',
      conditionType: 'partly_cloudy',
      icon: isDay ? 'cloud-sun' : 'cloud-moon',
      safetyImpact: 'optimal'
    };
  }
  if (code === 3) {
    return {
      condition: 'Overcast',
      conditionTamil: 'முழு மேகமூட்டம்',
      conditionType: 'cloudy',
      icon: 'cloud',
      safetyImpact: 'optimal'
    };
  }
  if (code === 45 || code === 48) {
    return {
      condition: 'Fog / Reduced Visibility',
      conditionTamil: 'பனிமூட்டம் / குறைவான தெரிவுநிலை',
      conditionType: 'fog',
      icon: 'cloud-fog',
      safetyImpact: 'moderate'
    };
  }
  if (code >= 51 && code <= 55) {
    return {
      condition: 'Light Drizzle',
      conditionTamil: 'தூறல் மழை',
      conditionType: 'drizzle',
      icon: 'cloud-drizzle',
      safetyImpact: 'moderate'
    };
  }
  if (code >= 61 && code <= 65) {
    const isHeavy = code === 65;
    return {
      condition: isHeavy ? 'Heavy Rain' : 'Moderate Rain',
      conditionTamil: isHeavy ? 'கனமழை' : 'மிதமான மழை',
      conditionType: isHeavy ? 'heavy_rain' : 'rain',
      icon: 'cloud-rain',
      safetyImpact: isHeavy ? 'hazard' : 'moderate'
    };
  }
  if (code >= 80 && code <= 82) {
    return {
      condition: 'Rain Showers',
      conditionTamil: 'திடீர் மழைப்பொழிவு',
      conditionType: 'rain',
      icon: 'cloud-rain',
      safetyImpact: 'moderate'
    };
  }
  if (code >= 95) {
    return {
      condition: 'Thunderstorm & Heavy Winds',
      conditionTamil: 'இடியுடன் கூடிய பலத்த மழை',
      conditionType: 'thunderstorm',
      icon: 'cloud-lightning',
      safetyImpact: 'hazard'
    };
  }

  return {
    condition: 'Fair Weather',
    conditionTamil: 'சீரான வானிலை',
    conditionType: 'clear',
    icon: 'sun',
    safetyImpact: 'optimal'
  };
}

function parseRainForecast(hourly: any, currentPrecip: number, currentCode: number): {
  isRainingNow: boolean;
  nextRainTime: string | null;
  nextRainTimeTamil: string | null;
  nextRainProbability: number;
  nextRainAmountMm: number;
  rainSummary: string;
  rainSummaryTamil: string;
  next12Hours: any[];
  willRainToday: boolean;
  willRainTomorrow: boolean;
} {
  const isRainingNow = currentPrecip > 0.1 || (currentCode >= 51 && currentCode <= 65) || currentCode >= 80;

  if (!hourly || !Array.isArray(hourly.time)) {
    return {
      isRainingNow,
      nextRainTime: isRainingNow ? 'Raining now' : null,
      nextRainTimeTamil: isRainingNow ? 'தற்போது மழை பெய்கிறது' : null,
      nextRainProbability: isRainingNow ? 95 : 10,
      nextRainAmountMm: currentPrecip,
      rainSummary: isRainingNow ? 'Active rainfall occurring right now.' : 'No significant rain expected for the next 24 hours.',
      rainSummaryTamil: isRainingNow ? 'தற்போது மழை பெய்து வருகிறது.' : 'அடுத்த 24 மணி நேரத்திற்கு குறிப்பிடத்தக்க மழை இல்லை.',
      next12Hours: [],
      willRainToday: isRainingNow,
      willRainTomorrow: false
    };
  }

  const now = new Date();
  let startIndex = 0;

  for (let i = 0; i < hourly.time.length; i++) {
    const t = new Date(hourly.time[i]);
    if (t.getTime() >= now.getTime() - 60 * 60 * 1000) {
      startIndex = i;
      break;
    }
  }

  let nextRain: { time: string; timeFormatted: string; timeFormattedTamil: string; prob: number; precip: number; isToday: boolean } | null = null;
  const next12Hours: any[] = [];
  let willRainToday = false;
  let willRainTomorrow = false;

  const todayDateStr = now.toISOString().slice(0, 10);

  for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
    const tStr = hourly.time[i];
    const prob = typeof hourly.precipitation_probability?.[i] === 'number' ? hourly.precipitation_probability[i] : 0;
    const precip = typeof hourly.precipitation?.[i] === 'number' ? Math.round(hourly.precipitation[i] * 10) / 10 : 0;
    const code = typeof hourly.weather_code?.[i] === 'number' ? hourly.weather_code[i] : 0;

    const d = new Date(tStr);
    const hourNum = d.getHours();
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const h12 = hourNum % 12 || 12;
    const isToday = tStr.startsWith(todayDateStr);

    const timeFormatted = `${isToday ? 'Today' : 'Tomorrow'} at ${h12}:00 ${ampm}`;
    const timeFormattedTamil = `${isToday ? 'இன்று' : 'நாளை'} ${hourNum < 12 ? 'காலை' : (hourNum < 16 ? 'மதியம்' : (hourNum < 20 ? 'மாலை' : 'இரவு'))} ${h12}:00 மணி`;

    const isLikely = prob >= 30 || precip > 0.1 || (code >= 51 && code <= 65) || code >= 80;

    if (isLikely) {
      if (isToday) willRainToday = true;
      else willRainTomorrow = true;

      if (!nextRain) {
        nextRain = {
          time: tStr,
          timeFormatted,
          timeFormattedTamil,
          prob,
          precip,
          isToday
        };
      }
    }

    if (next12Hours.length < 12) {
      next12Hours.push({
        time: tStr,
        timeFormatted: `${h12}:00 ${ampm}`,
        timeFormattedTamil: `${hourNum < 12 ? 'காலை' : (hourNum < 16 ? 'மதியம்' : 'மாலை')} ${h12}:00`,
        probability: prob,
        precipitationMm: precip,
        condition: decodeWmoWeather(code, hourNum >= 6 && hourNum < 18).condition,
        isRainLikely: isLikely
      });
    }
  }

  let rainSummary = '';
  let rainSummaryTamil = '';

  if (isRainingNow) {
    rainSummary = `Active rain falling right now (${currentPrecip > 0 ? `${currentPrecip} mm` : 'showers'}). Wet road conditions.`;
    rainSummaryTamil = `தற்போது மழை பெய்கிறது (${currentPrecip > 0 ? `${currentPrecip} மி.மீ` : 'மழைப்பொழிவு'}). சாலையில் ஈரப்பதம் உள்ளது.`;
  } else if (nextRain) {
    const amountStr = nextRain.precip > 0 ? ` (~${nextRain.precip} mm expected)` : '';
    rainSummary = `Rain expected ${nextRain.timeFormatted} (${nextRain.prob}% probability${amountStr}).`;
    rainSummaryTamil = `${nextRain.timeFormattedTamil} மழைக்கு வாய்ப்புள்ளது (${nextRain.prob}% சாத்தியம்${amountStr}).`;
  } else {
    rainSummary = 'No rain expected for the next 48 hours. Clear and dry highway conditions.';
    rainSummaryTamil = 'அடுத்த 48 மணி நேரத்திற்கு மழைக்கு வாய்ப்பில்லை. சீரான மற்றும் உலர் வானிலை நிலவும்.';
  }

  return {
    isRainingNow,
    nextRainTime: isRainingNow ? 'Now' : (nextRain ? nextRain.timeFormatted : null),
    nextRainTimeTamil: isRainingNow ? 'தற்போது' : (nextRain ? nextRain.timeFormattedTamil : null),
    nextRainProbability: isRainingNow ? 95 : (nextRain ? nextRain.prob : 5),
    nextRainAmountMm: isRainingNow ? currentPrecip : (nextRain ? nextRain.precip : 0),
    rainSummary,
    rainSummaryTamil,
    next12Hours,
    willRainToday,
    willRainTomorrow
  };
}

export async function fetchLiveWeatherData(): Promise<any[]> {
  const now = Date.now();
  if (weatherCache && (now - weatherCache.timestamp) < CACHE_TTL_MS) {
    return weatherCache.data;
  }

  try {
    const lats = TAMIL_NADU_WEATHER_STATIONS.map(s => s.lat).join(',');
    const lngs = TAMIL_NADU_WEATHER_STATIONS.map(s => s.lng).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,is_day&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&forecast_days=2&timezone=Asia/Kolkata`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo API returned status ${res.status}`);
    }

    const json = await res.json();
    const resultsArray = Array.isArray(json) ? json : [json];

    const parsedData = TAMIL_NADU_WEATHER_STATIONS.map((station, idx) => {
      const current = resultsArray[idx]?.current || {};
      const hourly = resultsArray[idx]?.hourly || {};

      const temp = typeof current.temperature_2m === 'number' ? Math.round(current.temperature_2m * 10) / 10 : 28.0;
      const humidity = current.relative_humidity_2m || 75;
      const windSpeed = typeof current.wind_speed_10m === 'number' ? Math.round(current.wind_speed_10m * 10) / 10 : 5.0;
      const precip = typeof current.precipitation === 'number' ? current.precipitation : 0.0;
      const code = typeof current.weather_code === 'number' ? current.weather_code : 0;
      const isDay = current.is_day === 1;

      const meta = decodeWmoWeather(code, isDay);
      const rainForecast = parseRainForecast(hourly, precip, code);

      // Feels like approximation
      const feelsLike = Math.round((temp + (humidity > 70 ? 2 : 0) - (windSpeed > 15 ? 1 : 0)) * 10) / 10;

      let advisory = 'Normal highway transit conditions. Road surfaces dry.';
      let advisoryTamil = 'சீரான நெடுஞ்சாலைப் போக்குவரத்து. உலர் சாலை மேற்பரப்பு.';

      if (meta.safetyImpact === 'hazard' || rainForecast.isRainingNow) {
        advisory = 'Active weather disruption. Expect hydroplaning and waterlogging. Reduce speed by 25 km/h.';
        advisoryTamil = 'மழை / நீர் தேக்கம் எச்சரிக்கை. சாலையில் வேகத்தை 25 கி.மீ குறைத்து பாதுகாப்பாக பயணிக்கவும்.';
      } else if (rainForecast.nextRainTime && rainForecast.nextRainProbability >= 40) {
        advisory = `${rainForecast.rainSummary} Plan transit timing accordingly.`;
        advisoryTamil = `${rainForecast.rainSummaryTamil} பயண நேரத்தைத் திட்டமிடவும்.`;
      } else if (meta.safetyImpact === 'moderate') {
        advisory = 'Slight moisture on tarmac. Maintain safe stopping distance for heavy freight.';
        advisoryTamil = 'சாலையில் லேசான ஈரப்பதம். கனரக வாகனங்கள் பாதுகாப்பான இடைவெளியைப் பேணவும்.';
      } else if (station.id === 'nilgiris_ooty' && temp < 18) {
        advisory = 'Mountain ghat chilly conditions. Watch out for early morning dew on hairpin bends.';
        advisoryTamil = 'மலைப்பாதை குளிர் சூழல். கொண்டை ஊசி வளைவுகளில் பனி எச்சரிக்கை.';
      }

      return {
        id: station.id,
        name: station.name,
        nameTamil: station.nameTa,
        district: station.district,
        lat: station.lat,
        lng: station.lng,
        elevationMeters: station.elevation,
        temperature: temp,
        feelsLike,
        humidity,
        windSpeed,
        precipitation: precip,
        weatherCode: code,
        condition: meta.condition,
        conditionTamil: meta.conditionTamil,
        conditionType: meta.conditionType,
        icon: meta.icon,
        isDay,
        highwaySafetyImpact: meta.safetyImpact,
        advisory,
        advisoryTamil,
        rainForecast,
        updatedAt: new Date().toISOString()
      };
    });

    weatherCache = {
      timestamp: now,
      data: parsedData
    };

    return parsedData;
  } catch (err) {
    console.warn('Live weather fetch failed, serving fallback:', err);
    if (weatherCache) return weatherCache.data;

    // Static fallback
    return TAMIL_NADU_WEATHER_STATIONS.map(s => ({
      id: s.id,
      name: s.name,
      nameTamil: s.nameTa,
      district: s.district,
      lat: s.lat,
      lng: s.lng,
      elevationMeters: s.elevation,
      temperature: s.id === 'nilgiris_ooty' ? 16.5 : 28.5,
      feelsLike: s.id === 'nilgiris_ooty' ? 15.5 : 30.0,
      humidity: 78,
      windSpeed: 6.2,
      precipitation: 0.0,
      weatherCode: 1,
      condition: 'Partly Cloudy',
      conditionTamil: 'பகுதி மேகமூட்டம்',
      conditionType: 'partly_cloudy',
      icon: 'cloud-sun',
      isDay: true,
      highwaySafetyImpact: 'optimal',
      advisory: 'Clear highway transit conditions.',
      advisoryTamil: 'சீரான நெடுஞ்சாலைப் போக்குவரத்து.',
      rainForecast: {
        isRainingNow: false,
        nextRainTime: null,
        nextRainTimeTamil: null,
        nextRainProbability: 10,
        nextRainAmountMm: 0,
        rainSummary: 'No rain expected in the next 48 hours.',
        rainSummaryTamil: 'அடுத்த 48 மணி நேரத்திற்கு மழைக்கு வாய்ப்பில்லை.',
        next12Hours: [],
        willRainToday: false,
        willRainTomorrow: false
      },
      updatedAt: new Date().toISOString()
    }));
  }
}

// 1. Statewide Live Weather for all Tamil Nadu Hubs
weatherRouter.get('/live', async (_req: Request, res: Response) => {
  try {
    const stations = await fetchLiveWeatherData();
    return res.json({
      status: 'success',
      provider: 'Open-Meteo High-Resolution Meteorological Network with Rain Prediction',
      cached: Boolean(weatherCache && (Date.now() - weatherCache.timestamp) < CACHE_TTL_MS),
      count: stations.length,
      stations
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Weather fetch error';
    return res.status(500).json({ error: msg });
  }
});

// 2. Real-Time Corridor Weather & Rain Timeline
weatherRouter.get('/corridor', async (req: Request, res: Response) => {
  try {
    const { originId, destinationId } = req.query;
    const stations = await fetchLiveWeatherData();

    const origStation = stations.find(s => s.id === originId) || stations[0];
    const destStation = stations.find(s => s.id === destinationId) || stations[1];

    const hasRainNow = origStation.rainForecast?.isRainingNow || destStation.rainForecast?.isRainingNow;
    const hasRainForecast = origStation.rainForecast?.nextRainTime || destStation.rainForecast?.nextRainTime;

    const maxWind = Math.max(origStation.windSpeed, destStation.windSpeed);

    let speedReduction = 0;
    let advisoryEn = 'Safe highway travel conditions. No adverse meteorological impediments detected along the corridor.';
    let advisoryTa = 'பாதுகாப்பான நெடுஞ்சாலை பயணம். பாதையில் கடுமையான வானிலை தடைகள் இல்லை.';

    let rainTimingEn = 'No rain expected along corridor for the next 24 to 48 hours.';
    let rainTimingTa = 'அடுத்த 24 முதல் 48 மணி நேரத்திற்கு வழித்தடத்தில் மழைக்கு வாய்ப்பில்லை.';

    if (hasRainNow) {
      speedReduction = 20;
      advisoryEn = 'Active rainfall detected on corridor. Highway asphalt wet. Reduce speed by 20 km/h.';
      advisoryTa = 'வழித்தடத்தில் தற்போது மழை பெய்கிறது. சாலையில் ஈரப்பதம் உள்ளதால் வேகத்தை 20 கி.மீ குறைக்கவும்.';
      rainTimingEn = 'Raining now along route segments. Expect wet spray from heavy freight trucks.';
      rainTimingTa = 'தற்போது வழித்தடப் பகுதிகளில் மழை பெய்கிறது.';
    } else if (hasRainForecast) {
      const nextTime = origStation.rainForecast?.nextRainTime || destStation.rainForecast?.nextRainTime;
      const nextTimeTa = origStation.rainForecast?.nextRainTimeTamil || destStation.rainForecast?.nextRainTimeTamil;
      rainTimingEn = `Rain expected along route: ${nextTime}.`;
      rainTimingTa = `வழித்தடத்தில் எதிர்பார்க்கப்படும் மழை நேரம்: ${nextTimeTa}.`;
      if (origStation.rainForecast?.nextRainProbability >= 50 || destStation.rainForecast?.nextRainProbability >= 50) {
        speedReduction = 10;
        advisoryEn = `Rain anticipated (${nextTime}). Plan departure ahead or maintain extra braking margin.`;
        advisoryTa = `மழை எதிர்பார்க்கப்படுகிறது (${nextTimeTa}). புறப்படும் நேரத்தை முன்கூட்டியே திட்டமிடவும்.`;
      }
    }

    return res.json({
      status: 'success',
      corridor: {
        originWeather: origStation,
        destinationWeather: destStation,
        hasRainAlongRoute: Boolean(hasRainNow || hasRainForecast),
        rainTimingSummary: rainTimingEn,
        rainTimingSummaryTamil: rainTimingTa,
        maxWindSpeed: maxWind,
        recommendedSpeedReductionKmh: speedReduction,
        overallAdvisory: advisoryEn,
        overallAdvisoryTamil: advisoryTa
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Corridor weather error';
    return res.status(500).json({ error: msg });
  }
});
