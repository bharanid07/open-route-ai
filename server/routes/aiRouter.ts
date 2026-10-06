import { Router, Request, Response } from 'express';
import { RealRoadProvider } from '../services/realRoadProvider';
import { fetchLiveWeatherData } from './weatherRouter';

export const aiRouter = Router();

interface LocationDef {
  id: string;
  name: string;
  nameTa: string;
  district: string;
  coords: [number, number];
  aliases: string[];
}

// Comprehensive registry of Tamil Nadu hubs & 38 districts with English and Tamil aliases
const TN_LOCATIONS: LocationDef[] = [
  {
    id: 'chennai_metro',
    name: 'Chennai',
    nameTa: 'சென்னை',
    district: 'Chennai',
    coords: [13.0827, 80.2707],
    aliases: ['chennai', 'madras', 'சென்னை']
  },
  {
    id: 'sriperumbudur_cluster',
    name: 'Sriperumbudur',
    nameTa: 'ஸ்ரீபெரும்புதூர்',
    district: 'Kanchipuram',
    coords: [12.9863, 79.9484],
    aliases: ['sriperumbudur', 'oragadam', 'kanchipuram', 'kanchi', 'ஸ்ரீபெரும்புதூர்', 'ஒரகடம்', 'காஞ்சிபுரம்']
  },
  {
    id: 'ennore_port',
    name: 'Ennore',
    nameTa: 'எண்ணூர்',
    district: 'Tiruvallur',
    coords: [13.2929, 80.3308],
    aliases: ['ennore', 'kattupalli', 'tiruvallur', 'எண்ணூர்', 'திருவள்ளூர்']
  },
  {
    id: 'hosur_hub',
    name: 'Hosur',
    nameTa: 'ஓசூர்',
    district: 'Krishnagiri',
    coords: [12.7409, 77.8253],
    aliases: ['hosur', 'krishnagiri', 'dharmapuri', 'ஓசூர்', 'ஓசூரி', 'கிருஷ்ணகிரி', 'தருமபுரி']
  },
  {
    id: 'vellore_gateway',
    name: 'Vellore',
    nameTa: 'வேலூர்',
    district: 'Vellore',
    coords: [12.9165, 79.1325],
    aliases: ['vellore', 'ranipet', 'tirupattur', 'வேலூர்', 'வேலூரி', 'ராணிப்பேட்டை', 'திருப்பத்தூர்']
  },
  {
    id: 'salem_junction',
    name: 'Salem',
    nameTa: 'சேலம்',
    district: 'Salem',
    coords: [11.6643, 78.1460],
    aliases: ['salem', 'சேலம்', 'சேலத்', 'சேலத்து']
  },
  {
    id: 'erode_depot',
    name: 'Erode',
    nameTa: 'ஈரோடு',
    district: 'Erode',
    coords: [11.3410, 77.7172],
    aliases: ['erode', 'ஈரோடு', 'ஈரோட்டி']
  },
  {
    id: 'tiruppur_export',
    name: 'Tiruppur',
    nameTa: 'திருப்பூர்',
    district: 'Tiruppur',
    coords: [11.1085, 77.3411],
    aliases: ['tiruppur', 'திருப்பூர்', 'திருப்பூரி']
  },
  {
    id: 'coimbatore_hub',
    name: 'Coimbatore',
    nameTa: 'கோயம்புத்தூர்',
    district: 'Coimbatore',
    coords: [11.0168, 76.9558],
    aliases: ['coimbatore', 'kovai', 'கோயம்புத்தூர்', 'கோவை', 'கோயமுத்தூர்', 'பொள்ளாச்சி', 'pollachi']
  },
  {
    id: 'trichy_hub',
    name: 'Tiruchirappalli (Trichy)',
    nameTa: 'திருச்சிராப்பள்ளி (திருச்சி)',
    district: 'Tiruchirappalli',
    coords: [10.7905, 78.7047],
    aliases: ['trichy', 'tiruchirappalli', 'perambalur', 'ariyalur', 'pudukkottai', 'திருச்சி', 'திருச்சிராப்பள்ளி', 'பெரம்பலூர்', 'அரியலூர்', 'புதுக்கோட்டை']
  },
  {
    id: 'karur_cluster',
    name: 'Karur',
    nameTa: 'கரூர்',
    district: 'Karur',
    coords: [10.9601, 78.0766],
    aliases: ['karur', 'namakkal', 'கரூர்', 'கரூரி', 'நாமக்கல்']
  },
  {
    id: 'dindigul_hub',
    name: 'Dindigul',
    nameTa: 'திண்டுக்கல்',
    district: 'Dindigul',
    coords: [10.3673, 77.9803],
    aliases: ['dindigul', 'theni', 'திண்டுக்கல்', 'திண்டுக்கல்லி', 'தேனி']
  },
  {
    id: 'madurai_junction',
    name: 'Madurai',
    nameTa: 'மதுரை',
    district: 'Madurai',
    coords: [9.9252, 78.1198],
    aliases: ['madurai', 'sivaganga', 'ramanathapuram', 'மதுரை', 'மதுரையி', 'சிவகங்கை', 'ராமநாதபுரம்']
  },
  {
    id: 'virudhunagar_node',
    name: 'Virudhunagar',
    nameTa: 'விருதுநகர்',
    district: 'Virudhunagar',
    coords: [9.5680, 77.9624],
    aliases: ['virudhunagar', 'sivakasi', 'விருதுநகர்', 'சிவகாசி']
  },
  {
    id: 'thoothukudi_port',
    name: 'Thoothukudi',
    nameTa: 'தூத்துக்குடி',
    district: 'Thoothukudi',
    coords: [8.7642, 78.1348],
    aliases: ['thoothukudi', 'tuticorin', 'தூத்துக்குடி', 'தூத்துக்குடியி']
  },
  {
    id: 'tirunelveli_hub',
    name: 'Tirunelveli',
    nameTa: 'திருநெல்வேலி',
    district: 'Tirunelveli',
    coords: [8.7139, 77.7567],
    aliases: ['tirunelveli', 'nellai', 'tenkasi', 'திருநெல்வேலி', 'நெல்லை', 'தென்காசி']
  },
  {
    id: 'kanyakumari_gateway',
    name: 'Kanyakumari (Nagercoil)',
    nameTa: 'கன்னியாகுமரி (நாகர்கோவில்)',
    district: 'Kanyakumari',
    coords: [8.1833, 77.4119],
    aliases: ['kanyakumari', 'nagercoil', 'கன்னியாகுமரி', 'நாகர்கோவில்']
  },
  {
    id: 'thanjavur_delta',
    name: 'Thanjavur',
    nameTa: 'தஞ்சாவூர்',
    district: 'Thanjavur',
    coords: [10.7870, 79.1378],
    aliases: ['thanjavur', 'tanjore', 'tiruvarur', 'kumbakonam', 'தஞ்சாவூர்', 'தஞ்சை', 'தஞ்சாவூரி', 'திருவாரூர்', 'கும்பகோணம்']
  },
  {
    id: 'cuddalore_coastal',
    name: 'Cuddalore',
    nameTa: 'கடலூர்',
    district: 'Cuddalore',
    coords: [11.7480, 79.7714],
    aliases: ['cuddalore', 'nagapattinam', 'villupuram', 'kallakurichi', 'mayiladuthurai', 'கடலூர்', 'கடலூரி', 'நாகப்பட்டினம்', 'விழுப்புரம்', 'கள்ளக்குறிச்சி', 'மயிலாடுதுறை']
  },
  {
    id: 'nilgiris_ooty',
    name: 'Nilgiris (Ooty)',
    nameTa: 'நீலகிரி (உதகை)',
    district: 'Nilgiris',
    coords: [11.4102, 76.6950],
    aliases: ['nilgiris', 'ooty', 'udhagamandalam', 'coonoor', 'நீலகிரி', 'உதகை', 'ஊட்டி', 'குன்னூர்']
  }
];

function findLocationsInQuery(text: string): Array<{ loc: LocationDef; index: number; length: number }> {
  const lower = text.toLowerCase();
  const matches: Array<{ loc: LocationDef; index: number; length: number }> = [];

  for (const loc of TN_LOCATIONS) {
    for (const alias of loc.aliases) {
      let idx = lower.indexOf(alias.toLowerCase());
      while (idx !== -1) {
        matches.push({ loc, index: idx, length: alias.length });
        idx = lower.indexOf(alias.toLowerCase(), idx + 1);
      }
    }
  }

  // Sort by start index ascending, then length descending
  matches.sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    return b.length - a.length;
  });

  // Filter overlapping matches
  const filtered: Array<{ loc: LocationDef; index: number; length: number }> = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.index >= lastEnd) {
      filtered.push(m);
      lastEnd = m.index + m.length;
    }
  }

  return filtered;
}

function resolveQueryEndpoints(
  text: string,
  contextOriginName?: string
): { origin: LocationDef; destination: LocationDef } | null {
  const lower = text.toLowerCase();
  const matches = findLocationsInQuery(text);

  if (matches.length >= 2) {
    const first = matches[0];
    const second = matches[1];

    // English: "to <dest> from <origin>"
    const beforeFirst = lower.substring(Math.max(0, first.index - 15), first.index);
    const beforeSecond = lower.substring(first.index + first.length, second.index);

    if (/\bto\s+$/i.test(beforeFirst) && /\bfrom\s+$/i.test(beforeSecond)) {
      return { origin: second.loc, destination: first.loc };
    }

    // Tamil: "Xக்கு Yலிருந்து" (to X from Y)
    const afterFirst = lower.substring(first.index + first.length, first.index + first.length + 12);
    const afterSecond = lower.substring(second.index + second.length, second.index + second.length + 12);

    if (/க்கு|கு/.test(afterFirst) && /லிருந்து|இருந்து/.test(afterSecond)) {
      return { origin: second.loc, destination: first.loc };
    }

    return { origin: first.loc, destination: second.loc };
  } else if (matches.length === 1) {
    // Only destination matched (e.g., "directions to Madurai" or "take me to Salem")
    const dest = matches[0].loc;
    let orig = TN_LOCATIONS.find(l => l.id === 'chennai_metro') || TN_LOCATIONS[0];

    if (contextOriginName) {
      const ctxMatches = findLocationsInQuery(contextOriginName);
      if (ctxMatches.length > 0 && ctxMatches[0].loc.id !== dest.id) {
        orig = ctxMatches[0].loc;
      }
    }

    if (orig.id !== dest.id) {
      return { origin: orig, destination: dest };
    }
  }

  return null;
}

aiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const message = req.body.message || req.body.prompt || req.body.query || req.body.text;
    const { context } = req.body;
    const apiKey = process.env.GROQ_API_KEY || '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';

    if (!message) {
      return res.status(400).json({ error: 'Message or prompt is required' });
    }

    const isTamilUser = /[\u0B80-\u0BFF]/.test(message);
    const endpoints = resolveQueryEndpoints(message, context?.origin);

    let realRoadSummaryInfo = '';
    let realRoadRouteData: any = null;

    // Ground route calculation using real road network provider
    if (endpoints) {
      try {
        const routeResult = await RealRoadProvider.calculateRoute({
          origin: endpoints.origin.coords,
          destination: endpoints.destination.coords,
          originName: endpoints.origin.name,
          destName: endpoints.destination.name
        });

        if (routeResult && routeResult.status === 'success') {
          realRoadRouteData = routeResult.activeRoute || routeResult.routes[0];
          const hwList = realRoadRouteData.primaryHighways?.length > 0
            ? realRoadRouteData.primaryHighways.join(', ')
            : 'Primary National Highway';

          realRoadSummaryInfo = `
VERIFIED REAL ROAD HIGHWAY DATA:
- Route: ${endpoints.origin.name} (${endpoints.origin.nameTa}) to ${endpoints.destination.name} (${endpoints.destination.nameTa})
- Distance: ${realRoadRouteData.distanceKm} km
- Duration: ${realRoadRouteData.durationFormatted} (${realRoadRouteData.durationHours} hours)
- Highway Corridors: ${hwList}
- Summary: ${realRoadRouteData.summary || `${realRoadRouteData.distanceKm} km via ${hwList}`}
CRITICAL NAVIGATION RULE:
You MUST provide the user with this exact highway route (${hwList}). Under NO circumstances should you suggest arbitrary diversions or claim unrelated corridors (for example, NEVER route Salem to Madurai via Coimbatore). NH 44 runs North-South directly from Salem through Namakkal, Karur, Dindigul to Madurai.
`;
        }
      } catch (err) {
        console.warn('RealRoadProvider calculation error in AI router:', err);
      }
    }

    // Live Meteorological & Rain Timing Telemetry Integration
    let liveWeatherSnippet = '';
    let targetStationForWeather: any = null;
    let liveStationsList: any[] = [];

    try {
      liveStationsList = await fetchLiveWeatherData();
      const queryLocations = findLocationsInQuery(message);
      if (queryLocations.length > 0) {
        targetStationForWeather = liveStationsList.find(s => s.id === queryLocations[0].loc.id) || liveStationsList[0];
      } else if (endpoints) {
        targetStationForWeather = liveStationsList.find(s => s.id === endpoints.origin.id) || liveStationsList[0];
      } else {
        targetStationForWeather = liveStationsList.find(s => s.id === 'chennai_metro') || liveStationsList[0];
      }

      if (endpoints && liveStationsList.length > 0) {
        const origW = liveStationsList.find(s => s.id === endpoints.origin.id) || liveStationsList[0];
        const destW = liveStationsList.find(s => s.id === endpoints.destination.id) || liveStationsList[1];
        
        liveWeatherSnippet = `
LIVE METEOROLOGICAL TELEMETRY & RAIN TIMELINE (REAL-TIME GROUND TRUTH):
- Origin (${endpoints.origin.name} / ${endpoints.origin.nameTa}):
  * Current Temperature: ${origW.temperature}°C (${origW.condition})
  * Humidity: ${origW.humidity}%, Wind Speed: ${origW.windSpeed} km/h, Feels Like: ${origW.feelsLike}°C
  * Rain Status Now: ${origW.rainForecast.isRainingNow ? 'Active rain currently falling' : 'No rain falling right now'}
  * Exact Next Rain Timing: ${origW.rainForecast.nextRainTime ? `${origW.rainForecast.nextRainTime} (${origW.rainForecast.nextRainProbability}% probability, ~${origW.rainForecast.nextRainAmountMm} mm)` : 'No rain forecast in next 48h'}
  * Rain Summary: ${origW.rainForecast.rainSummary}
  * Rain Summary (Tamil): ${origW.rainForecast.rainSummaryTamil}
  * Next 6 Hours Rain Probabilities: ${origW.rainForecast.next12Hours.slice(0, 6).map((h: any) => `${h.timeFormatted}: ${h.probability}%`).join(', ')}

- Destination (${endpoints.destination.name} / ${endpoints.destination.nameTa}):
  * Current Temperature: ${destW.temperature}°C (${destW.condition})
  * Humidity: ${destW.humidity}%, Wind Speed: ${destW.windSpeed} km/h, Feels Like: ${destW.feelsLike}°C
  * Rain Status Now: ${destW.rainForecast.isRainingNow ? 'Active rain currently falling' : 'No rain falling right now'}
  * Exact Next Rain Timing: ${destW.rainForecast.nextRainTime ? `${destW.rainForecast.nextRainTime} (${destW.rainForecast.nextRainProbability}% probability, ~${destW.rainForecast.nextRainAmountMm} mm)` : 'No rain forecast in next 48h'}
  * Rain Summary: ${destW.rainForecast.rainSummary}
  * Rain Summary (Tamil): ${destW.rainForecast.rainSummaryTamil}
  * Next 6 Hours Rain Probabilities: ${destW.rainForecast.next12Hours.slice(0, 6).map((h: any) => `${h.timeFormatted}: ${h.probability}%`).join(', ')}
`;
      } else if (targetStationForWeather) {
        liveWeatherSnippet = `
LIVE METEOROLOGICAL TELEMETRY & RAIN TIMELINE FOR ${targetStationForWeather.name.toUpperCase()} (${targetStationForWeather.nameTamil}):
- Current Temperature: ${targetStationForWeather.temperature}°C (Feels like: ${targetStationForWeather.feelsLike}°C)
- Current Condition: ${targetStationForWeather.condition} (${targetStationForWeather.conditionTamil})
- Humidity: ${targetStationForWeather.humidity}%, Wind: ${targetStationForWeather.windSpeed} km/h
- Is Raining Right Now: ${targetStationForWeather.rainForecast.isRainingNow ? 'YES - active rainfall occurring right now' : 'NO - not raining currently'}
- EXACT NEXT RAIN TIMING: ${targetStationForWeather.rainForecast.nextRainTime ? `${targetStationForWeather.rainForecast.nextRainTime} (Probability: ${targetStationForWeather.rainForecast.nextRainProbability}%, Expected Rain: ~${targetStationForWeather.rainForecast.nextRainAmountMm} mm)` : 'No rain expected for the next 24 to 48 hours'}
- Rain Summary (English): ${targetStationForWeather.rainForecast.rainSummary}
- Rain Summary (Tamil): ${targetStationForWeather.rainForecast.rainSummaryTamil}
- Next 6 Hours Rain Probabilities: ${targetStationForWeather.rainForecast.next12Hours.slice(0, 6).map((h: any) => `${h.timeFormatted}: ${h.probability}% (${h.condition})`).join(', ')}
`;
      }
    } catch {
      // ignore
    }

    const systemPrompt = `You are OPENROUTE AI (தமிழ்நாடு அணுகல் & சரக்கு தளம்), an expert AI geospatial architect, logistics dispatcher, and universal accessibility intelligence assistant for the state of Tamil Nadu.
You have comprehensive knowledge of:
1. All 38 districts of Tamil Nadu, key industrial hubs (Chennai, Sriperumbudur, Hosur, Tiruppur, Coimbatore), ports (Ennore, Chennai Port, Thoothukudi VOC Port), and delta agricultural regions (Thanjavur, Dindigul, Erode).
2. Major highway corridors:
   - NH 44 (North-South Golden Corridor): Hosur -> Dharmapuri -> Salem -> Namakkal -> Karur -> Dindigul -> Madurai -> Virudhunagar -> Tirunelveli -> Kanyakumari.
   - NH 544: Salem -> Erode -> Tiruppur -> Coimbatore.
   - NH 45 (GST Road): Chennai -> Chengalpattu -> Villupuram -> Trichy -> Dindigul.
   - NH 83: Coimbatore -> Pollachi -> Dindigul -> Trichy -> Thanjavur.
   - East Coast Road (ECR): Chennai -> Cuddalore -> Nagapattinam -> Thoothukudi.
   - Mountain Ghat Passes: Mettupalayam to Ooty / Coonoor (36 hairpin bends, steep slope > 9%).
3. Universal Accessibility (RPwD Act 2016): Wheelchair ramp slope limits (optimal <= 4.0%, max 5.0%), tactile paving, universal highway rest stops with disabled-friendly restrooms, and tertiary hospital corridors (RGGGH Chennai, CMC Vellore, GRH Madurai, Coimbatore CMC).
4. Dynamic disruptions: Coastal monsoon flooding around Cuddalore/ECR, toll plaza freight backlogs (Paranur, Samayapuram), and ghat mudslides.

CRITICAL WEATHER & RAIN TIMING PROTOCOL (MANDATORY):
Whenever the user asks about the weather, current temperature, or WHEN IT WILL RAIN (or asks in Tamil: மழை எப்போது வரும், மழை பெய்யுமா, வானிலை):
1. You MUST explicitly state the real-time temperature, condition, humidity, and wind.
2. You MUST convey EXACTLY WHEN IT WILL RAIN using the live rain timeline provided below (state whether it is raining now, or the specific time like "Today at 12:00 PM" with its probability percentage, or explicitly state that no rain is expected in the next 24 to 48 hours).
3. Do NOT speak vaguely about rain; provide the precise time window, probability, and road safety advice for drivers and wheelchair commuters.
4. If the user writes in Tamil, respond in clear Tamil with the exact rain timing (e.g. "இன்று மதியம் 12:00 மணிக்கு மழைக்கு வாய்ப்புள்ளது (33% சாத்தியம்)").

Guidelines:
- Answer concisely, authoritatively, and actionably with exact highway codes and distances.
- If the user writes in Tamil or asks in Tamil, reply in clear, professional Tamil with English highway codes in parentheses.
- If real road highway data is provided below, you MUST adhere strictly to it.
${realRoadSummaryInfo}
${liveWeatherSnippet}
${context ? `Current Context on map: Origin: ${context.origin || 'N/A'}, Destination: ${context.destination || 'N/A'}, Active Profile: ${context.profile || 'N/A'}, Disruptions: ${context.hazardsCount || 0}` : ''}

AGENT ACTION TRIGGER PROTOCOL (MANDATORY):
When a route or map visualization is discussed, append a structured action tag:
[ACTION: SWITCH_TAB, target: "State Map", origin: "<origin_id>", destination: "<dest_id>"]`;

    const modelsToTry = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
    let aiResponseText = '';

    for (const model of modelsToTry) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            temperature: 0.5,
            max_tokens: 650
          })
        });

        if (!groqRes.ok) {
          const errBody = await groqRes.text();
          throw new Error(`Groq API Error (${model}): ${groqRes.status} ${errBody}`);
        }

        const data = await groqRes.json();
        aiResponseText = data.choices?.[0]?.message?.content || '';
        if (aiResponseText.trim()) break;
      } catch (err: unknown) {
        console.warn('Groq model failed:', err);
      }
    }

    // High quality fallback grounded in real road calculation
    if (!aiResponseText) {
      if (endpoints && realRoadRouteData) {
        const hwName = realRoadRouteData.primaryHighways?.length > 0
          ? realRoadRouteData.primaryHighways.join(', ')
          : 'NH Corridor';

        if (isTamilUser) {
          aiResponseText = `**${endpoints.origin.nameTa} முதல் ${endpoints.destination.nameTa} வரை உகந்த வழித்தடம்:**\n\n` +
            `• **பரிந்துரைக்கப்படும் நெடுஞ்சாலை:** ${hwName}\n` +
            `• **மொத்த தூரம்:** ${realRoadRouteData.distanceKm} கி.மீ\n` +
            `• **பயண நேரம்:** சுமார் ${realRoadRouteData.durationFormatted}\n` +
            `• **வழித்தட வழிகாட்டுதல்:** ${endpoints.origin.nameTa}-லிருந்து புறப்பட்டு ${hwName} வழியே தொடர்ந்து செல்லவும். அணுகல் மற்றும் சுங்கச்சாவடி நிலைமைகள் சீராக உள்ளன.\n\n` +
            `[ACTION: SWITCH_TAB, target: "State Map", origin: "${endpoints.origin.id}", destination: "${endpoints.destination.id}"]`;
        } else {
          aiResponseText = `**Recommended Highway Route: ${endpoints.origin.name} to ${endpoints.destination.name}**\n\n` +
            `• **Primary Corridor:** ${hwName}\n` +
            `• **Total Distance:** ${realRoadRouteData.distanceKm} km\n` +
            `• **Estimated Travel Time:** ${realRoadRouteData.durationFormatted}\n` +
            `• **Route Summary:** Depart ${endpoints.origin.name} and follow ${hwName} directly towards ${endpoints.destination.name}. Highway rest stops and accessibility facilities are available along this active corridor.\n\n` +
            `[ACTION: SWITCH_TAB, target: "State Map", origin: "${endpoints.origin.id}", destination: "${endpoints.destination.id}"]`;
        }
      } else {
        const lowerMsg = message.toLowerCase();
        const isWeatherQuery = /rain|weather|temperature|மழை|வானிலை|வெப்பநிலை|மழைக்காலம்|காற்றழுத்தம்/i.test(lowerMsg);
        if (isWeatherQuery && targetStationForWeather) {
          const st = targetStationForWeather;
          if (isTamilUser) {
            aiResponseText = `**${st.nameTamil} நேரலை வானிலை மற்றும் மழை முன்னறிவிப்பு:**\n\n` +
              `• **தற்போதைய வெப்பநிலை:** ${st.temperature}°C (${st.conditionTamil}, Feels: ${st.feelsLike}°C)\n` +
              `• **ஈரப்பதம்:** ${st.humidity}% | **காற்றின் வேகம்:** ${st.windSpeed} கி.மீ/மணி\n` +
              `• **மழை நிலை:** ${st.rainForecast.rainSummaryTamil}\n` +
              `• **மழை பெய்யும் நேரம்:** ${st.rainForecast.nextRainTimeTamil ? st.rainForecast.nextRainTimeTamil : 'அடுத்த 24 மணி நேரத்திற்கு மழை வாய்ப்பு இல்லை'}\n\n` +
              `[ACTION: SWITCH_TAB, target: "State Map"]`;
          } else {
            aiResponseText = `**${st.name} Real-Time Meteorological & Rain Forecast:**\n\n` +
              `• **Current Temperature:** ${st.temperature}°C (${st.condition}, Feels: ${st.feelsLike}°C)\n` +
              `• **Humidity:** ${st.humidity}% | **Wind Speed:** ${st.windSpeed} km/h\n` +
              `• **Rain Status:** ${st.rainForecast.rainSummary}\n` +
              `• **Next Expected Rain:** ${st.rainForecast.nextRainTime ? `${st.rainForecast.nextRainTime} (${st.rainForecast.nextRainProbability}% probability)` : 'No rain expected in the next 24 to 48 hours'}\n\n` +
              `[ACTION: SWITCH_TAB, target: "State Map"]`;
          }
        } else {
          aiResponseText = isTamilUser
            ? `OPENROUTE AI பகுப்பாய்வு: தமிழ்நாடு நெடுஞ்சாலைகளில் விரைவு சரக்கு போக்குவரத்திற்கு NH 44 (ஓசூர்-சேலம்-மதுரை) மற்றும் மத்திய விநியோகத்திற்கு NH 45 (GST சாலை) மிக உகந்தவை. வரைபடத்தில் பார்க்க கீழே உள்ள இணைப்பைப் பயன்படுத்தவும்.\n\n[ACTION: SWITCH_TAB, target: "State Map"]`
            : `OPENROUTE AI Analysis: For optimal travel across Tamil Nadu corridors, use NH 44 (Hosur-Salem-Madurai) for express freight or NH 45 (GST Road) for central distribution. Switching view to State Map for live telemetry.\n\n[ACTION: SWITCH_TAB, target: "State Map"]`;
        }
      }
    }

    // Guarantee that action tags with accurate origin & destination are attached
    if (endpoints) {
      // Clean up any coarse/hallucinated waypoints in the LLM's action tag
      aiResponseText = aiResponseText.replace(/\[ACTION:[\s\S]*?\]/gi, '').trim();
      aiResponseText += `\n\n[ACTION: SWITCH_TAB, target: "State Map", origin: "${endpoints.origin.id}", destination: "${endpoints.destination.id}"]`;
    } else {
      const lowerMsg = message.toLowerCase();
      const isMapQuery = /map|வரைபடம்|route|corridor|வழித்தடம்|show|open|view|display|visualize|switch|take me/i.test(lowerMsg);

      if (!aiResponseText.includes('[ACTION:') && isMapQuery) {
        const orig = context?.origin ? context.origin.toLowerCase().replace(/\s+/g, '_') : undefined;
        const dest = context?.destination ? context.destination.toLowerCase().replace(/\s+/g, '_') : undefined;
        if (orig && dest) {
          aiResponseText += `\n\n[ACTION: SWITCH_TAB, target: "State Map", origin: "${orig}", destination: "${dest}"]`;
        } else {
          aiResponseText += `\n\n[ACTION: SWITCH_TAB, target: "State Map"]`;
        }
      }
    }

    return res.json({
      status: 'success',
      reply: aiResponseText,
      poweredBy: 'OPENROUTE AI Intelligence Engine & Groq'
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown AI copilot error';
    return res.status(500).json({ error: errorMsg });
  }
});
