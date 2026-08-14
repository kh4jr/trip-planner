import fs from "fs";
import path from "path";

export interface GeocodeResult {
  coordinates: [number, number];
  countryCode: string;
}

const cacheFilePath = path.join(process.cwd(), "src/lib/geocoding-cache.json");

// In-memory local cache copy to avoid reading from disk constantly
let inMemoryCache: Record<string, GeocodeResult | null> | null = null;

function getCache(): Record<string, GeocodeResult | null> {
  if (inMemoryCache) {
    return inMemoryCache;
  }
  try {
    if (fs.existsSync(cacheFilePath)) {
      const content = fs.readFileSync(cacheFilePath, "utf-8");
      inMemoryCache = JSON.parse(content);
      return inMemoryCache || {};
    }
  } catch (error) {
    console.error("Error loading geocoding cache:", error);
  }
  inMemoryCache = {};
  return inMemoryCache;
}

function saveCache(cache: Record<string, GeocodeResult | null>) {
  inMemoryCache = cache;
  try {
    const dir = path.dirname(cacheFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving geocoding cache:", error);
  }
}

export async function geocode(query: string): Promise<GeocodeResult | null> {
  if (!query) return null;
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery || cleanQuery === "brak lokalizacji") return null;

  const cache = getCache();
  if (cache[cleanQuery] !== undefined) {
    return cache[cleanQuery];
  }

  // Make external API request to OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "trip-planner-agent-antigravity/1.0",
      },
    });

    if (!res.ok) {
      console.warn(`Geocoding request failed for "${query}" with status: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      const lat = Number(first.lat);
      const lon = Number(first.lon);
      const countryCode = (first.address?.country_code || "").toUpperCase();

      if (!isNaN(lat) && !isNaN(lon) && countryCode) {
        const result: GeocodeResult = {
          coordinates: [lon, lat],
          countryCode,
        };
        cache[cleanQuery] = result;
        saveCache(cache);
        return result;
      }
    }

    // Cache negative results as well to avoid repeating failed external API requests
    cache[cleanQuery] = null;
    saveCache(cache);
  } catch (error) {
    console.error(`Error during geocoding of "${query}":`, error);
  }

  return null;
}
