// Cache for geocoded coordinates to avoid repeated API calls
const geocodeCache = new Map();

export async function getCoordinatesFromCity(cityName) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`);
  const data = await response.json();
  if (data.length === 0) {
    throw new Error("City not found");
  }
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}

export async function getCoordinatesForArea(areaName, cityName, fallbackLat, fallbackLon) {
  const cacheKey = `${areaName}_${cityName}`;
  
  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }
  
  try {
    // Try geocoding the specific area within the city
    const searchQuery = `${areaName}, ${cityName}, India`;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
    const data = await response.json();
    
    if (data.length > 0) {
      const coordinates = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
      
      // Cache the result
      geocodeCache.set(cacheKey, coordinates);
      console.log(`✅ Geocoded ${areaName} in ${cityName}:`, coordinates);
      return coordinates;
    } else {
      // Fallback to original coordinates
      const fallbackCoords = { lat: fallbackLat, lon: fallbackLon };
      geocodeCache.set(cacheKey, fallbackCoords);
      console.log(`⚠️ Could not geocode ${areaName}, using fallback coordinates`);
      return fallbackCoords;
    }
  } catch (error) {
    // Fallback to original coordinates on error
    const fallbackCoords = { lat: fallbackLat, lon: fallbackLon };
    geocodeCache.set(cacheKey, fallbackCoords);
    console.log(`❌ Geocoding error for ${areaName}:`, error.message);
    return fallbackCoords;
  }
}
