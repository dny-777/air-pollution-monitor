import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Popup,
  Marker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import L from "leaflet";
import { getCoordinatesFromCity, getCoordinatesForArea } from "./utils/geocodecity";

// Custom styles for Leaflet popups
const popupStyles = `
  .leaflet-popup-content-wrapper {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(20px) !important;
    color: #1e293b !important;
    border-radius: 16px !important;
    box-shadow: 0 12px 32px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1) !important;
    border: none !important;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
  }
  
  .leaflet-popup-content {
    margin: 16px 20px !important;
    font-size: 14px !important;
    line-height: 1.6 !important;
    font-weight: 400 !important;
    color: #1e293b !important;
  }
  
  .leaflet-popup-content strong {
    font-weight: 600 !important;
    color: #0f172a !important;
    font-size: 16px !important;
  }
  
  .leaflet-popup-content small {
    color: #64748b !important;
    font-style: italic !important;
  }
  
  .leaflet-popup-tip {
    background: rgba(255, 255, 255, 0.95) !important;
    box-shadow: none !important;
    border: none !important;
  }
  
  .leaflet-popup-close-button {
    color: #64748b !important;
    font-size: 18px !important;
    font-weight: bold !important;
    padding: 8px !important;
    transition: all 0.2s ease !important;
  }
  
  .leaflet-popup-close-button:hover {
    color: #1e293b !important;
    background: rgba(100, 116, 139, 0.1) !important;
    border-radius: 50% !important;
  }

  .leaflet-container {
    background: rgba(245, 245, 220, 0.95) !important;
    background-color: rgba(245, 245, 220, 0.95) !important;
  }

  .leaflet-container .leaflet-map-pane {
    background: rgba(245, 245, 220, 0.95) !important;
    background-color: rgba(245, 245, 220, 0.95) !important;
  }

  .leaflet-container .leaflet-tile-pane {
    background: rgba(245, 245, 220, 0.95) !important;
    background-color: rgba(245, 245, 220, 0.95) !important;
  }

  body {
    background: #001e00 !important;
    background-color: #001e00 !important;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-30px) rotate(5deg); }
    66% { transform: translateY(-20px) rotate(-5deg); }
  }

  @keyframes floatSlow {
    0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
    33% { transform: translateY(-40px) translateX(20px) scale(1.05); }
    66% { transform: translateY(-10px) translateX(-15px) scale(0.95); }
  }

  @keyframes leafFloat {
    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
    50% { transform: translateY(-50px) rotate(180deg); opacity: 1; }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = popupStyles;
  document.head.appendChild(styleSheet);
}

const INDIA_BOUNDS = [
  [6, 68],
  [38, 98],
];

const AQI_COLORS = {
  Good: "green",
  Satisfactory: "yellow",
  Moderate: "orange",
  Poor: "red",
  "Very Poor": "purple",
  Severe: "maroon",
};

const FlyToCity = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 11, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [position, map]);
  return null;
};

const FlyToMarkers = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 1) {
      const bounds = markers.map(marker => [marker.lat, marker.lon]);
      
      // Calculate bounds with extra padding to ensure all markers are visible
      const latitudes = bounds.map(coord => coord[0]);
      const longitudes = bounds.map(coord => coord[1]);
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLon = Math.min(...longitudes);
      const maxLon = Math.max(...longitudes);
      
      // Add extra padding for better visibility
      const latPadding = (maxLat - minLat) * 0.2 || 0.01; // 20% padding or minimum 0.01
      const lonPadding = (maxLon - minLon) * 0.2 || 0.01;
      
      const paddedBounds = [
        [minLat - latPadding, minLon - lonPadding],
        [maxLat + latPadding, maxLon + lonPadding]
      ];
      
      map.fitBounds(paddedBounds, {
        padding: [50, 50], // Increased padding
        animate: true,
        duration: 1.5,
      });
    } else if (markers && markers.length === 1) {
      map.flyTo([markers[0].lat, markers[0].lon], 11, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [markers, map]);
  return null;
};

const ResetMapView = ({ shouldReset, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (shouldReset) {
      map.fitBounds(bounds, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [shouldReset, bounds, map]);
  return null;
};

const MapView = () => {
  const [data, setData] = useState([]);
  const [aggregatedData, setAggregatedData] = useState([]);
  const [searchCity, setSearchCity] = useState("");
  const [cityMarker, setCityMarker] = useState(null);
  const [cityMarkers, setCityMarkers] = useState([]); // For multiple markers
  const [shouldResetMap, setShouldResetMap] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // New states for tabs and search
  const [activeTab, setActiveTab] = useState('welcome'); // 'welcome' or 'map'
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  
  const popupRef = useRef();

  useEffect(() => {
    fetch("/updated_pm25_data.json")
      .then((res) => res.json())
      .then((rawData) => {
        console.log("✅ Data loaded:", rawData.length, "records");
        console.log("Sample data:", rawData[0]);
        setData(rawData);
        
        // Use ALL data points without aggregation to show real pollution variations
        const validData = rawData.filter(point => {
          // Ensure coordinates are numbers
          if (typeof point.lat !== 'number' || typeof point.lon !== 'number') {
            console.warn("Invalid coordinates for:", point.city, point.lat, point.lon);
            return false;
          }
          return true;
        });
        
        console.log("✅ Using all data points:", validData.length, "records");
        console.log("Sample data point:", validData[0]);
        setAggregatedData(validData); // Use all data, not aggregated
        
        // Extract unique city names for autocomplete
        const cityNames = new Set();
        validData.forEach(point => {
          // Extract main city name from full location string
          const cityParts = point.city.toLowerCase().split(/[-,]/);
          const mainCity = cityParts.find(part => 
            part.includes('delhi') || part.includes('mumbai') || part.includes('bangalore') || 
            part.includes('kolkata') || part.includes('chennai') || part.includes('hyderabad') ||
            part.includes('pune') || part.includes('ahmedabad') || part.includes('jaipur') ||
            part.includes('lucknow') || part.includes('kanpur') || part.includes('nagpur') ||
            part.includes('indore') || part.includes('bhopal') || part.includes('visakhapatnam') ||
            part.includes('pimpri') || part.includes('patna') || part.includes('vadodara') ||
            part.includes('agra') || part.includes('nashik') || part.includes('faridabad') ||
            part.includes('meerut') || part.includes('rajkot') || part.includes('kalyan') ||
            part.includes('vasai') || part.includes('varanasi') || part.includes('srinagar') ||
            part.includes('aurangabad') || part.includes('dhanbad') || part.includes('amritsar') ||
            part.includes('allahabad') || part.includes('gwalior') || part.includes('jabalpur') ||
            part.includes('coimbatore') || part.includes('madurai') || part.includes('jodhpur')
          );
          
          if (mainCity) {
            cityNames.add(mainCity.trim());
          }
          
          // Also add the original city for broader search
          const originalCity = point.city.toLowerCase();
          if (originalCity.length > 0) {
            cityNames.add(originalCity);
          }
        });
        
        const sortedCities = Array.from(cityNames).sort();
        console.log("✅ Available cities for autocomplete:", sortedCities.length);
        setAvailableCities(sortedCities);
      })
      .catch((err) => console.error("❌ Error fetching JSON:", err));
  }, []);

  // Add keypress event listener for welcome screen
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (activeTab === 'welcome') {
        setActiveTab('map');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTab]);

  const calculateAQI = (pm25) => {
    // AQI breakpoints for PM2.5 (Indian standards)
    const breakpoints = [
      { cLow: 0, cHigh: 30, aqiLow: 0, aqiHigh: 50 },      // Good
      { cLow: 30.1, cHigh: 60, aqiLow: 51, aqiHigh: 100 }, // Satisfactory
      { cLow: 60.1, cHigh: 90, aqiLow: 101, aqiHigh: 200 }, // Moderate
      { cLow: 90.1, cHigh: 120, aqiLow: 201, aqiHigh: 300 }, // Poor
      { cLow: 120.1, cHigh: 250, aqiLow: 301, aqiHigh: 400 }, // Very Poor
      { cLow: 250.1, cHigh: 500, aqiLow: 401, aqiHigh: 500 }  // Severe
    ];

    // Find the correct breakpoint
    let bp = null;
    for (let i = 0; i < breakpoints.length; i++) {
      if (pm25 >= breakpoints[i].cLow && pm25 <= breakpoints[i].cHigh) {
        bp = breakpoints[i];
        break;
      }
    }
    
    if (!bp) {
      // If PM2.5 is beyond 500, use severe category
      if (pm25 > 500) {
        bp = breakpoints[breakpoints.length - 1];
      } else {
        // Should not happen, but fallback to first category
        bp = breakpoints[0];
      }
    }

    // Linear interpolation formula for AQI
    const aqi = ((bp.aqiHigh - bp.aqiLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.aqiLow;
    
    return Math.round(aqi);
  };

  const getAQICategory = (pm25) => {
    const aqi = calculateAQI(pm25);
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Satisfactory";
    if (aqi <= 200) return "Moderate";
    if (aqi <= 300) return "Poor";
    if (aqi <= 400) return "Very Poor";
    return "Severe";
  };

  const aqiColorMap = {
    Good: "green",
    Satisfactory: "yellow", 
    Moderate: "orange",
    Poor: "red",
    "Very Poor": "darkred",
    Severe: "brown"
  };

  const getColorIcon = (category) =>
    new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${aqiColorMap[category] || "blue"}.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

  // Handle search input change for autocomplete
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchCity(value);
    
    if (value.length > 0) {
      const suggestions = availableCities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); // Limit to 8 suggestions
      
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion) => {
    setSearchCity(suggestion);
    setShowSuggestions(false);
    setSearchSuggestions([]);
    
    // Automatically trigger search when suggestion is selected
    setTimeout(async () => {
      await performSearch(suggestion);
    }, 100);
  };

  // Extracted search logic to be reusable
  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    
    console.log(`🔍 Starting search for: "${searchTerm}"`);
    setShowSuggestions(false); // Hide suggestions when searching

    try {
      // Search through data points for the city
      const allCityDataPoints = aggregatedData.filter(point => 
        point.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      console.log(`🔍 Found ${allCityDataPoints.length} data points for "${searchTerm}"`);
      
      if (allCityDataPoints.length > 0) {
        console.log("Sample data points:", allCityDataPoints.slice(0, 3).map(p => ({ city: p.city, pm25: p.pm25, lat: p.lat, lon: p.lon })));
        
        // Determine search type: broad city search vs specific location search
        const searchTerms = searchTerm.toLowerCase().split(' ');
        const isBroadSearch = searchTerms.length <= 2 && !searchTerms.some(term => 
          ['area', 'station', 'sector', 'zone', 'park', 'road', 'airport', 'railway'].includes(term)
        );
        
        // Always try to show multiple markers for broad search with 2+ data points
        if (isBroadSearch && allCityDataPoints.length >= 2) {
          // Check if we have genuinely different monitoring areas first
          const uniqueAreaNames = new Set();
          const areaToDataPoints = new Map();
          
          allCityDataPoints.forEach(point => {
            // Extract area name (everything before city name)
            const cityName = searchTerm.toLowerCase();
            const fullCityName = point.city.toLowerCase();
            let areaName = point.city;
            
            // Find the city name in the full location string
            const cityIndex = fullCityName.indexOf(cityName);
            if (cityIndex > 0) {
              // Extract everything before the city name as the area
              areaName = point.city.substring(0, cityIndex).trim();
              // Remove trailing spaces and dashes
              areaName = areaName.replace(/\s*-\s*$/, '').trim();
            } else if (cityIndex === 0) {
              // If city name is at the start, use the full name as area
              areaName = point.city;
            } else {
              // Fallback: split by common separators and use first meaningful part
              const parts = point.city.split(/[-,]/);
              if (parts.length > 1) {
                areaName = parts[0].trim();
              } else {
                areaName = point.city;
              }
            }
            
            console.log(`📍 Point: "${point.city}" -> Area: "${areaName}"`);
            uniqueAreaNames.add(areaName);
            
            if (!areaToDataPoints.has(areaName)) {
              areaToDataPoints.set(areaName, []);
            }
            areaToDataPoints.get(areaName).push(point);
          });
          
          console.log(`🔍 ${searchTerm} - Found ${uniqueAreaNames.size} unique areas:`, Array.from(uniqueAreaNames));
          
          if (uniqueAreaNames.size > 1) {
            // MULTIPLE AREAS: Create markers for each unique area
            setIsGeocoding(true);
            const markers = [];
            
            for (const [areaName, areaDataPoints] of areaToDataPoints.entries()) {
              const avgPm25 = areaDataPoints.reduce((sum, point) => sum + point.pm25, 0) / areaDataPoints.length;
              const avgPm10 = areaDataPoints.reduce((sum, point) => sum + point.pm10, 0) / areaDataPoints.length;
              const avgLat = areaDataPoints.reduce((sum, point) => sum + point.lat, 0) / areaDataPoints.length;
              const avgLon = areaDataPoints.reduce((sum, point) => sum + point.lon, 0) / areaDataPoints.length;
              const minPm25 = Math.min(...areaDataPoints.map(p => p.pm25));
              const maxPm25 = Math.max(...areaDataPoints.map(p => p.pm25));
              
              let coordinates = { lat: avgLat, lon: avgLon };
              let isGeocoded = false;
              
              // Check if multiple areas have the same coordinates (generic coordinates)
              const areasWithSameCoords = Array.from(areaToDataPoints.entries()).filter(([otherAreaName, otherDataPoints]) => {
                if (otherAreaName === areaName) return false;
                const otherAvgLat = otherDataPoints.reduce((sum, point) => sum + point.lat, 0) / otherDataPoints.length;
                const otherAvgLon = otherDataPoints.reduce((sum, point) => sum + point.lon, 0) / otherDataPoints.length;
                return Math.abs(otherAvgLat - avgLat) < 0.001 && Math.abs(otherAvgLon - avgLon) < 0.001;
              });
              
              // If this area shares coordinates with others, geocode it
              if (areasWithSameCoords.length > 0 && areaName !== searchTerm && areaName !== areaDataPoints[0].city) {
                try {
                  coordinates = await getCoordinatesForArea(areaName, searchTerm, avgLat, avgLon);
                  isGeocoded = coordinates.lat !== avgLat || coordinates.lon !== avgLon;
                } catch (error) {
                  console.log(`⚠️ Using fallback coordinates for ${areaName}`);
                }
              }
              
              markers.push({
                lat: coordinates.lat,
                lon: coordinates.lon,
                city: areaDataPoints[0].city, // Use full location name for popup
                areaName: areaName, // Store area name separately
                pm25: avgPm25,
                pm10: avgPm10,
                category: getAQICategory(avgPm25),
                dataPoints: areaDataPoints.length,
                minPm25,
                maxPm25,
                isGeocoded
              });
            }
            
            setIsGeocoding(false);
            setCityMarkers(markers);
            setCityMarker(null);
            console.log(`🏙️ ${searchTerm} - Found ${markers.length} different monitoring areas`);
            
            // Log geocoded areas
            const geocodedCount = markers.filter(m => m.isGeocoded).length;
            if (geocodedCount > 0) {
              console.log(`📍 Geocoded ${geocodedCount} areas to their actual locations`);
            }
          } else {
            // SINGLE AREA: Show one comprehensive marker for the area
            const avgPm25 = allCityDataPoints.reduce((sum, point) => sum + point.pm25, 0) / allCityDataPoints.length;
            const avgPm10 = allCityDataPoints.reduce((sum, point) => sum + point.pm10, 0) / allCityDataPoints.length;
            const avgLat = allCityDataPoints.reduce((sum, point) => sum + point.lat, 0) / allCityDataPoints.length;
            const avgLon = allCityDataPoints.reduce((sum, point) => sum + point.lon, 0) / allCityDataPoints.length;
            const category = getAQICategory(avgPm25);
            
            const pm25Values = allCityDataPoints.map(p => p.pm25);
            const minPm25 = Math.min(...pm25Values);
            const maxPm25 = Math.max(...pm25Values);
            
            // Use the actual monitoring area name, not the search term
            const areaName = allCityDataPoints[0].city;
            
            console.log(`📍 ${searchTerm} - Single monitoring area: ${areaName}`);
            
            setCityMarker({ 
              lat: avgLat, 
              lon: avgLon, 
              city: areaName, // Use full area name for clarity
              pm25: avgPm25,
              pm10: avgPm10,
              category,
              dataPoints: allCityDataPoints.length,
              minPm25,
              maxPm25
            });
            setCityMarkers([]);
          }
        } else {
          // Single marker for specific searches or single data point
          const avgPm25 = allCityDataPoints.reduce((sum, point) => sum + point.pm25, 0) / allCityDataPoints.length;
          const avgPm10 = allCityDataPoints.reduce((sum, point) => sum + point.pm10, 0) / allCityDataPoints.length;
          const avgLat = allCityDataPoints.reduce((sum, point) => sum + point.lat, 0) / allCityDataPoints.length;
          const avgLon = allCityDataPoints.reduce((sum, point) => sum + point.lon, 0) / allCityDataPoints.length;
          const category = getAQICategory(avgPm25);
          
          const pm25Values = allCityDataPoints.map(p => p.pm25);
          const minPm25 = Math.min(...pm25Values);
          const maxPm25 = Math.max(...pm25Values);
          
          console.log(`✅ Setting single marker for ${searchTerm} at lat: ${avgLat}, lon: ${avgLon}, PM2.5: ${avgPm25.toFixed(1)}`);
          
          setCityMarker({ 
            lat: avgLat, 
            lon: avgLon, 
            city: searchTerm, 
            pm25: avgPm25,
            pm10: avgPm10,
            category,
            dataPoints: allCityDataPoints.length,
            minPm25,
            maxPm25
          });
          setCityMarkers([]); // Clear multiple markers
        }
        
      } else {
        console.log(`❌ No data found for "${searchTerm}", trying API fallback...`);
        // Fallback to API prediction if city not found in data
        const coords = await getCoordinatesFromCity(searchTerm);
        console.log(`📍 Got coordinates from API: lat: ${coords.lat}, lon: ${coords.lon}`);
        
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
          
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ PM10: 100, Latitude: coords.lat, Longitude: coords.lon }),
        });

        const pm25Data = await res.json();
        const pm25 = pm25Data["predicted_PM2.5"] ?? 0;
        const category = getAQICategory(pm25);

        console.log(`🤖 API prediction: PM2.5 = ${pm25}, category = ${category}`);

        setCityMarker({ 
          lat: coords.lat, 
          lon: coords.lon, 
          city: searchTerm, 
          pm25, 
          category,
          dataPoints: 0
        });
        setCityMarkers([]); // Clear multiple markers
      }
      
    } catch (err) {
      console.error("❌ Search failed:", err);
      alert("City not found or data unavailable.");
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    console.log(`🚀 Manual search triggered for: "${searchCity}"`);
    await performSearch(searchCity);
  };

  return (
    <>
      <style>
        {`
          .search-dropdown {
            z-index: 9999999 !important;
            position: absolute !important;
          }
          .leaflet-control-container {
            z-index: 1000 !important;
          }
          .leaflet-popup-pane {
            z-index: 9999998 !important;
          }
          
          @keyframes treeSwaying {
            0%, 100% { 
              transform: rotate(0deg) scale(1); 
              opacity: 0.8; 
            }
            50% { 
              transform: rotate(2deg) scale(1.02); 
              opacity: 1; 
            }
          }
          
          @keyframes trunkSway {
            0%, 100% { 
              transform: rotate(0deg); 
            }
            50% { 
              transform: rotate(1deg); 
            }
          }
          
          @keyframes cloudDrift {
            0% { 
              transform: translateX(-20px); 
              opacity: 0.6; 
            }
            50% { 
              opacity: 1; 
            }
            100% { 
              transform: translateX(20px); 
              opacity: 0.6; 
            }
          }
          
          @keyframes leafRustle {
            0%, 100% { 
              transform: rotate(45deg) scale(1); 
              opacity: 0.8; 
            }
            50% { 
              transform: rotate(50deg) scale(1.1); 
              opacity: 1; 
            }
          }
          
          @keyframes branchSway {
            0%, 100% { 
              transform: rotate(25deg); 
            }
            50% { 
              transform: rotate(30deg); 
            }
          }
          
          @keyframes leafFlutter {
            0%, 100% { 
              transform: rotate(20deg) translateY(0px); 
              opacity: 0.9; 
            }
            50% { 
              transform: rotate(25deg) translateY(-3px); 
              opacity: 1; 
            }
          }
          
          @keyframes grassWave {
            0%, 100% { 
              transform: rotate(-5deg); 
            }
            50% { 
              transform: rotate(5deg); 
            }
          }
          
          @keyframes mountainHaze {
            0%, 100% { 
              opacity: 0.6; 
              transform: scale(1); 
            }
            50% { 
              opacity: 1; 
              transform: scale(1.02); 
            }
          }
          
          @keyframes leafFloat {
            0% { 
              transform: rotate(135deg) translateY(0px) translateX(0px); 
              opacity: 0.7; 
            }
            25% { 
              transform: rotate(140deg) translateY(-15px) translateX(10px); 
              opacity: 1; 
            }
            50% { 
              transform: rotate(130deg) translateY(-8px) translateX(-5px); 
              opacity: 0.9; 
            }
            75% { 
              transform: rotate(145deg) translateY(-20px) translateX(15px); 
              opacity: 1; 
            }
            100% { 
              transform: rotate(135deg) translateY(0px) translateX(0px); 
              opacity: 0.7; 
            }
          }
          
          @keyframes flowerBlossom {
            0% { 
              transform: scale(0.8) rotate(0deg); 
              opacity: 0.6; 
            }
            25% { 
              transform: scale(1.1) rotate(5deg); 
              opacity: 0.9; 
            }
            50% { 
              transform: scale(1.0) rotate(-3deg); 
              opacity: 1; 
            }
            75% { 
              transform: scale(1.05) rotate(2deg); 
              opacity: 0.8; 
            }
            100% { 
              transform: scale(0.8) rotate(0deg); 
              opacity: 0.6; 
            }
          }
          
          @keyframes pollenFloat {
            0% { 
              transform: translateY(0px) translateX(0px); 
              opacity: 0.4; 
            }
            20% { 
              transform: translateY(-30px) translateX(15px); 
              opacity: 0.8; 
            }
            40% { 
              transform: translateY(-10px) translateX(-8px); 
              opacity: 1; 
            }
            60% { 
              transform: translateY(-45px) translateX(25px); 
              opacity: 0.7; 
            }
            80% { 
              transform: translateY(-20px) translateX(-12px); 
              opacity: 0.9; 
            }
            100% { 
              transform: translateY(0px) translateX(0px); 
              opacity: 0.4; 
            }
          }
        `}
      </style>
      <div style={{ 
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: activeTab === 'welcome' ? "center" : "flex-start",
        justifyContent: "center",
        background: "#001e00",

        position: "relative",
        boxSizing: "border-box",
        margin: "0",
        overflow: "hidden",
        zIndex: 0
      }}>
      {/* Ultra-Realistic Environmental Monitoring Background */}
      {/* Realistic atmospheric overlays and particles */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% 10%, rgba(180,220,140,0.08) 0%, transparent 100%), radial-gradient(ellipse 60% 40% at 60% 80%, rgba(139,188,143,0.10) 0%, transparent 100%)"
      }}></div>
  {/* ...existing code for tab content... */}
      

      

      
      

      {activeTab === 'welcome' ? (
        // Welcome Tab - BEIGE DESIGN
        <div style={{ 
          textAlign: "center", 
          maxWidth: "1000px", 
          width: "100%",
          margin: "0 auto",
          padding: "80px 60px",
          background: "rgba(245, 245, 220, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "32px",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.3), 0 10px 40px rgba(0, 0, 0, 0.2)",
          border: "2px solid rgba(245, 245, 220, 0.8)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          zIndex: 2
        }}>
          {/* Royal floating background elements */}
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            background: "rgba(245, 245, 220, 0.2)",
            filter: "blur(40px)",
            zIndex: 1
          }}></div>
          <div style={{
            position: "absolute",
            bottom: "-30px",
            left: "-30px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(139, 188, 143, 0.15)",
            filter: "blur(50px)",
            zIndex: 1
          }}></div>
          
          <div style={{ 
            marginBottom: "50px",
            width: "100%",
            textAlign: "center",
            position: "relative",
            zIndex: 2
          }}>
            <h1 style={{ 
              fontSize: "4rem", 
              fontWeight: "800", 
              color: "#001e00", 
              marginBottom: "40px",
              textShadow: "none",
              lineHeight: "1.1",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              letterSpacing: "-0.02em",
              zIndex: 2,
              position: "relative"
            }}>
              Air Quality Monitor
            </h1>
            {/* Features Grid - Block-wise layout */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "30px",
              marginBottom: "50px",
              maxWidth: "900px",
              width: "100%",
              zIndex: 2,
              position: "relative"
            }}>
              <div style={{
                background: "rgba(0, 30, 0, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "25px 20px",
                borderRadius: "16px",
                textAlign: "center",
                border: "2px solid rgba(0, 30, 0, 0.2)"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "15px" }}>📊</div>
                <p style={{
                  fontSize: "1.3rem",
                  color: "#001e00",
                  fontWeight: "600",
                  lineHeight: "1.5",
                  margin: "0",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
                }}>
                  Monitor PM2.5 and PM10 levels
                </p>
              </div>
              
              <div style={{
                background: "rgba(0, 30, 0, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "25px 20px",
                borderRadius: "16px",
                textAlign: "center",
                border: "2px solid rgba(0, 30, 0, 0.2)"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "15px" }}>🏥</div>
                <p style={{
                  fontSize: "1.3rem",
                  color: "#001e00",
                  fontWeight: "600",
                  lineHeight: "1.5",
                  margin: "0",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
                }}>
                  View AQI classifications
                </p>
              </div>
              
              <div style={{
                background: "rgba(0, 30, 0, 0.1)",
                backdropFilter: "blur(10px)",
                padding: "25px 20px",
                borderRadius: "16px",
                textAlign: "center",
                border: "2px solid rgba(0, 30, 0, 0.2)"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "15px" }}>🗺️</div>
                <p style={{
                  fontSize: "1.3rem",
                  color: "#001e00",
                  fontWeight: "600",
                  lineHeight: "1.5",
                  margin: "0",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
                }}>
                  Explore 28,000+ stations
                </p>
              </div>
            </div>
          </div>
          
          <div style={{ 
            padding: "25px 40px", 
            background: "rgba(245, 245, 220, 0.95)", 
            borderRadius: "20px",
            border: "2px solid rgba(0, 30, 0, 0.3)",
            cursor: "pointer",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            textAlign: "center",
            maxWidth: "450px",
            margin: "0 auto",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 40px rgba(45, 90, 39, 0.2)",
            position: "relative",
            zIndex: 2
          }}
          onClick={() => setActiveTab('map')}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-5px) scale(1.02)";
            e.target.style.boxShadow = "0 30px 60px rgba(45, 90, 39, 0.3)";
            e.target.style.background = "rgba(245, 245, 220, 1)";
            e.target.style.borderColor = "rgba(139, 188, 143, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0) scale(1)";
            e.target.style.boxShadow = "0 20px 40px rgba(45, 90, 39, 0.2)";
            e.target.style.background = "rgba(245, 245, 220, 0.95)";
            e.target.style.borderColor = "rgba(139, 188, 143, 0.3)";
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "15px"
            }}>
              <span style={{
                fontSize: "1.8rem"
              }}>🍃</span>
              <p style={{ 
                fontSize: "1.3rem", 
                color: "#001e00", 
                margin: "0",
                fontWeight: "600",
                lineHeight: "1.4",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                textShadow: "none"
              }}>
                Enter the Air Quality Map
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Map Tab - ROYAL GREEN GLASSMORPHISM DESIGN
        <div style={{
          width: "100vw", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          gap: "0",
          margin: "0",
          padding: "0",
          background: "transparent",
          minHeight: "100vh",
          position: "relative",
          zIndex: 2
        }}>
          {/* Header Card - GREEN DESIGN */}
          <div style={{ 
            width: "100%",
            background: "#001e00", 
            backdropFilter: "blur(20px)",
            borderRadius: "0",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            padding: "30px",
            textAlign: "center",
            position: "relative",
            borderBottom: "2px solid rgba(0, 30, 0, 0.8)",
            zIndex: 999998
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "15px",
              marginBottom: "15px"
            }}>
              <h1 style={{ 
                fontSize: "2.8rem", 
                fontWeight: "700", 
                color: "rgba(245, 245, 220, 0.95)", 
                margin: "0",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                textShadow: "none",
                letterSpacing: "-0.02em"
              }}>
                Air Quality Monitor
              </h1>
            </div>
            
            {/* Back to Welcome Button */}
            <button
              onClick={() => setActiveTab('welcome')}
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                padding: "12px 20px",
                background: "rgba(245, 245, 220, 0.95)",
                backdropFilter: "blur(20px)",
                color: "#001e00",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                fontWeight: "500"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(245, 245, 220, 1)";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "rgba(245, 245, 220, 0.95)";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
              }}
            >
              ← Back
            </button>
            
            {/* Search Bar - PERFECTLY CENTERED */}
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center",
              width: "100%",
              margin: "15px 0"
            }}>
              <form onSubmit={handleSearch} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "20px", 
                flexWrap: "wrap", 
                justifyContent: "center",
                position: "relative",
                zIndex: 999999
              }}>
                <div style={{ position: "relative", zIndex: 999999 }}>
                  <input
                    type="text"
                    placeholder="🔍 Search for cities"
                    value={searchCity}
                    onChange={handleSearchInputChange}
                    style={{
                      padding: "18px 24px",
                      width: "450px",
                      maxWidth: "90vw",
                      borderRadius: "16px",
                      border: "none",
                      backgroundColor: "rgba(245, 245, 220, 0.95)",
                      backdropFilter: "blur(20px)",
                      color: "#001e00",
                      fontSize: "16px",
                      outline: "none",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)",
                      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                      letterSpacing: "0.02em",
                      fontWeight: "400"
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = "rgba(245, 245, 220, 1)";
                      e.target.style.boxShadow = "0 12px 40px rgba(245, 245, 220, 0.25), 0 4px 16px rgba(0,0,0,0.1)";
                      e.target.style.transform = "translateY(-2px)";
                      if (searchCity) setShowSuggestions(searchSuggestions.length > 0);
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = "rgba(245, 245, 220, 0.95)";
                      e.target.style.boxShadow = "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)";
                      e.target.style.transform = "translateY(0)";
                      setTimeout(() => setShowSuggestions(false), 300);
                    }}
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div 
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "0",
                        right: "0",
                        backgroundColor: "rgba(245, 245, 220, 0.95)",
                        backdropFilter: "blur(20px)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 12px 32px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1)",
                        zIndex: 9999999,
                        maxHeight: "300px",
                        overflowY: "auto",
                        marginTop: "4px"
                      }}
                      className="search-dropdown"
                      onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking suggestions
                    >
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          style={{
                            padding: "14px 20px",
                            cursor: "pointer",
                            borderBottom: index < searchSuggestions.length - 1 ? "1px solid rgba(226, 232, 240, 0.5)" : "none",
                            backgroundColor: "transparent",
                            fontSize: "15px",
                            color: "#001e00",
                            textTransform: "capitalize",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                            fontWeight: "400",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "rgba(0, 30, 0, 0.1)";
                            e.target.style.color = "#001e00";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#001e00";
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>📍</span>
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={isGeocoding}
                  style={{
                    padding: "18px 32px",
                    borderRadius: "16px",
                    border: "none",
                    background: isGeocoding 
                      ? "rgba(156, 163, 175, 0.9)" 
                      : "rgba(245, 245, 220, 0.95)",
                    backdropFilter: "blur(20px)",
                    color: isGeocoding ? "white" : "#001e00",
                    cursor: isGeocoding ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "600",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: isGeocoding 
                      ? "0 4px 16px rgba(0,0,0,0.1)" 
                      : "0 8px 24px rgba(74, 124, 89, 0.3), 0 2px 8px rgba(0,0,0,0.1)",
                    whiteSpace: "nowrap",
                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                    letterSpacing: "0.02em"
                  }}
                  onMouseOver={(e) => {
                    if (!isGeocoding) {
                      e.target.style.background = "rgba(245, 245, 220, 1)";
                      e.target.style.transform = "translateY(-2px) scale(1.02)";
                      e.target.style.boxShadow = "0 12px 32px rgba(245, 245, 220, 0.6), 0 4px 16px rgba(0,0,0,0.1)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isGeocoding) {
                      e.target.style.background = "rgba(245, 245, 220, 0.95)";
                      e.target.style.transform = "translateY(0) scale(1)";
                      e.target.style.boxShadow = "0 8px 24px rgba(245, 245, 220, 0.3), 0 2px 8px rgba(0,0,0,0.1)";
                    }
                  }}
                >
                  {isGeocoding ? "🔍 Searching..." : "Search"}
                </button>
                
                {(cityMarker || cityMarkers.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCityMarker(null);
                      setCityMarkers([]);
                      setSearchCity("");
                      setShouldResetMap(true);
                      setTimeout(() => setShouldResetMap(false), 100);
                    }}
                    style={{
                      padding: "16px 24px",
                      borderRadius: "12px",
                      border: "none",
                      background: "#dc2626",
                      backdropFilter: "blur(20px)",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: "600",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 6px 20px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(0,0,0,0.1)",
                      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "#dc2626";
                      e.target.style.transform = "translateY(-2px) scale(1.02)";
                      e.target.style.boxShadow = "0 8px 24px rgba(239, 68, 68, 0.4), 0 4px 16px rgba(0,0,0,0.1)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#dc2626";
                      e.target.style.transform = "translateY(0) scale(1)";
                      e.target.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(0,0,0,0.1)";
                    }}
                  >
                    Clear
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Map Container - FULL DESKTOP WIDTH */}
          <div style={{ 
            width: "100%",
            height: "calc(100vh - 180px)",
            backgroundColor: "rgba(245, 245, 220, 0.95)",
            borderRadius: "0",
            overflow: "hidden",
            position: "relative"
          }}>
            <MapContainer
              center={[22.9734, 78.6569]}
              zoom={6.5}
              minZoom={5}
              maxBounds={INDIA_BOUNDS}
              maxBoundsViscosity={1.0}
              scrollWheelZoom={true}
              zoomControl={true}
              style={{ height: "100%", width: "100%", backgroundColor: "rgba(245, 245, 220, 0.95)" }}
              whenCreated={(map) => map.fitBounds(INDIA_BOUNDS)}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <ResetMapView shouldReset={shouldResetMap} bounds={INDIA_BOUNDS} />
              
              <FlyToMarkers markers={cityMarkers} />

              <HeatmapLayer
                fitBoundsOnLoad
                fitBoundsOnUpdate
                points={aggregatedData.map((point) => [
                  point.lat, 
                  point.lon, 
                  point.pm25  // Use raw PM2.5 values instead of AQI
                ])}
                longitudeExtractor={(m) => m[1]}
                latitudeExtractor={(m) => m[0]}
                intensityExtractor={(m) => m[2]}
                radius={45}
                blur={60}
                max={250}  // Adjusted max for PM2.5 scale
                minOpacity={0.4}
                maxOpacity={1.0}
                gradient={{
                  0.0: '#e2d32bff',   // (0-30 µg/m³ - Good)
                  0.12: '#c2aa0bff',  // (30-60 µg/m³ - Satisfactory) 
                  0.24: '#ba8529ff',  // (60-90 µg/m³ - Moderate)
                  0.36: '#be7a14ff',  // (90-120 µg/m³ - Poor)
                  0.48: '#b45831ff',  // (120-150 µg/m³ - Very Poor)
                  0.6: '#a23f1eff',   // (150-180 µg/m³)
                  0.72: '#952d42ff',  // (180-210 µg/m³)
                  0.84: '#741b2fff',  // (210-240 µg/m³)
                  1.0: '#632493ff'    // (240+ µg/m³ - Severe)
                }}
              />

              {/* Show marker only for searched city */}
              {cityMarker && (
                <>
                                   <FlyToCity position={[cityMarker.lat, cityMarker.lon]} />
                  <Marker
                    position={[cityMarker.lat, cityMarker.lon]}
                    icon={getColorIcon(cityMarker.category)}
                  >
                    <Popup ref={popupRef}>
                      <strong>{cityMarker.city}</strong>
                      <br />
                      {cityMarker.pm10 && (
                        <>
                          PM10: {cityMarker.pm10.toFixed(1)} µg/m³
                          <br />
                        </>
                      )}
                      PM2.5: {cityMarker.pm25.toFixed(1)} µg/m³ (Average)
                      {cityMarker.minPm25 !== undefined && cityMarker.maxPm25 !== undefined && (
                        <>
                          <br />
                          Range: {cityMarker.minPm25.toFixed(1)} - {cityMarker.maxPm25.toFixed(1)} µg/m³
                        </>
                      )}
                      <br />
                      AQI: {calculateAQI(cityMarker.pm25)} ({cityMarker.category})
                      {cityMarker.dataPoints > 0 && (
                        <>
                          <br />
                          <small>Based on {cityMarker.dataPoints} readings</small>
                        </>
                      )}
                      {cityMarker.dataPoints === 0 && (
                        <>
                          <br />
                          <small>ML Predicted Data</small>
                        </>
                      )}
                    </Popup>
                  </Marker>
                </>
              )}

              {/* Show multiple markers for city-wide searches */}
              {cityMarkers.map((marker, index) => (
                <Marker
                  key={`${marker.lat}_${marker.lon}_${index}`}
                  position={[marker.lat, marker.lon]}
                  icon={getColorIcon(marker.category)}
                >
                  <Popup>
                    <strong>{marker.city}</strong>
                    <br />
                    {marker.pm10 && (
                      <>
                        PM10: {marker.pm10.toFixed(1)} µg/m³
                        <br />
                      </>
                    )}
                    PM2.5: {marker.pm25.toFixed(1)} µg/m³ (Average)
                    {marker.minPm25 !== undefined && marker.maxPm25 !== undefined && (
                      <>
                        <br />
                        Range: {marker.minPm25.toFixed(1)} - {marker.maxPm25.toFixed(1)} µg/m³
                      </>
                    )}
                    <br />
                    AQI: {calculateAQI(marker.pm25)} ({marker.category})
                    {marker.dataPoints > 0 && (
                      <>
                        <br />
                        <small>Based on {marker.dataPoints} readings</small>
                        {marker.isGeocoded && (
                          <>
                            <br />
                            <small style={{color: '#059669'}}>📍 Geocoded to actual location</small>
                          </>
                        )}
                      </>
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default MapView;

