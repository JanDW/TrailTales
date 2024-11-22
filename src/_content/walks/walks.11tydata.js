const getPermalink = (data) => {
  let permalink;
  if (data.page.fileSlug === 'walks') {
    return (permalink = `/walks/index.html`);
  }
  return (permalink = `/walks/${data.page.fileSlug}/index.html`);
};

const wmoWeatherCodes = {
  0: '☀️ Clear sky',
  1: '☀️ Mainly clear',
  2: '⛅️ Partly cloudy',
  3: '☁️ Overcast',
  45: '🌫️ Fog',
  48: '🌫️ Depositing rime fog',
  51: '☔️ Drizzle: Light intensity',
  53: '☔️ Drizzle: Moderate intensity',
  55: '☔️ Drizzle: Dense intensity',
  56: '🌨️ Freezing Drizzle: Light intensity',
  57: '🌨️ Freezing Drizzle: Dense intensity',
  61: '🌧️ Rain: Slight intensity',
  63: '🌧️ Rain: Moderate intensity',
  65: '🌧️ Rain: Heavy intensity',
  66: '🌨️ Freezing Rain: Light intensity',
  67: '🌨️ Freezing Rain: Heavy intensity',
  71: '❄️ Snow fall: Slight intensity',
  73: '⛄️ Snow fall: Moderate intensity',
  75: '☃️ Snow fall: Heavy intensity',
  77: '❄️ Snow grains',
  80: '🌧️ Rain showers: Slight intensity',
  81: '🌧️ Rain showers: Moderate intensity',
  82: '🌧️ Rain showers: Violent intensity',
  85: '☃️ Snow showers: Slight intensity',
  86: '☃️ Snow showers: Heavy intensity',
  95: '⚡️ Thunderstorm: Slight or moderate',
  96: '⛈️ Thunderstorm with slight hail',
  99: '⛈️ Thunderstorm with heavy hail',
};

export default (data) => ({
  layout: 'walks.webc',
  tags: 'walks',
  eleventyComputed: {
    permalink: (data) => getPermalink(data),
    gpxData: (data) => {
      const gpxMatch = data.gpx.filter(
        (gpxItem) => gpxItem.fileName === data.gpxFile
      )[0];
      return gpxMatch;
    },
    shots: (data) => {
      if (!data.photos || data.photos.length === 0) return;
      data.photos.map((photo) => {
        if (photo) {
          photo.title = data.images[photo.src]?.exif.ObjectName;
          photo.caption = data.images[photo.src]?.exif.Caption;
          photo.lat = data.images[photo.src]?.exif.latitude;
          photo.lon = data.images[photo.src]?.exif.longitude;
          photo.dateTime = data.images[photo.src]?.exif.DateTimeOriginal;
          photo.lens = data.images[photo.src]?.exif.LensModel;
        }
        return photo;
      });
    },
    locationName: async function (data) {
      const gpxData = await data.eleventyComputed.gpxData(data);
      if (!gpxData?.startWaypoint) return;
      const location = await this.getLocation(
        gpxData.startWaypoint.lat,
        gpxData.startWaypoint.lon
      );

      // Returns either 'City, State' or 'City, Country'
      return `${location[0].name}, ${location[0].state}` || '';
    },
    weather: async function (data) {
      const gpxData = await data.eleventyComputed.gpxData(data);
      if (!gpxData?.startWaypoint) return;
      const weatherData = await this.getWeatherData(
        gpxData.startWaypoint.time,
        gpxData.startWaypoint.lat,
        gpxData.startWaypoint.lon
      );

      if (!weatherData || !weatherData.hourly) {
        throw new Error('Invalid weather data');
      }

      // take time from the gpxData.startWaypoint.time and use it to figure out which element in the hourly array to pick

      const date = new Date(gpxData.startWaypoint.time);

      // Floor date to nearest hour
      // Round the date to the nearest hour
      date.setMinutes(0, 0, 0);
      const nearestHour = new Date(date);

      // Find the index of the nearest hour
      const timeIndex = weatherData.hourly.time.indexOf(
        nearestHour.toISOString().slice(0, -8)
      );

      // get the weather code for weather description
      const weatherCode = weatherData.hourly.weather_code[timeIndex];

      // weather description
      const description = wmoWeatherCodes[weatherCode];

      // temperature
      const temp = weatherData.hourly.temperature_2m[timeIndex];
      const tempUnit = weatherData.hourly_units.temperature_2m;

      // humidity
      const humidity = weatherData.hourly.relative_humidity_2m[timeIndex];
      const humidityUnit = weatherData.hourly_units.relative_humidity_2m;

      // dew point
      const dewPoint = weatherData.hourly.dew_point_2m[timeIndex];
      const dewPointUnit = weatherData.hourly_units.dew_point_2m;

      // precipitation
      const precipitation = weatherData.hourly.precipitation[timeIndex];
      const precipitationUnit = weatherData.hourly_units.precipitation;

      // visibility · can be null
      const visibility = weatherData.hourly.visibility[timeIndex];
      const visibilityUnit = 'm';

      // wind speed
      const windSpeed = weatherData.hourly.wind_speed_10m[timeIndex];
      const windSpeedUnit = weatherData.hourly_units.wind_speed_10m;

      // wind direction
      const windDirection = weatherData.hourly.wind_direction_10m[timeIndex];
      const windDirectionUnit = weatherData.hourly_units.wind_direction_10m;

      // wind gusts
      const windGusts = weatherData.hourly.wind_gusts_10m[timeIndex];
      const windGustsUnit = weatherData.hourly_units.wind_gusts_10m;

      // soil temperature
      const soilTemperatureLevels = {
        '0cm': weatherData.hourly.soil_temperature_0cm[timeIndex],
        '6cm': weatherData.hourly.soil_temperature_6cm[timeIndex],
        '18cm': weatherData.hourly.soil_temperature_18cm[timeIndex],
        '54cm': weatherData.hourly.soil_temperature_54cm[timeIndex],
        unit: tempUnit,
      };

      // soil moisture
      const soilMoistureLevels = {
        '0to1cm': weatherData.hourly.soil_moisture_0_to_1cm[timeIndex],
        '1to3cm': weatherData.hourly.soil_moisture_1_to_3cm[timeIndex],
        '3to9cm': weatherData.hourly.soil_moisture_3_to_9cm[timeIndex],
        '9to27cm': weatherData.hourly.soil_moisture_9_to_27cm[timeIndex],
        '27to81cm': weatherData.hourly.soil_moisture_27_to_81cm[timeIndex],
        unit: 'm³/m³',
      };

      // Check for null values and undefined for units when rendering in templates
      return {
        description,
        temp,
        tempUnit,
        humidity,
        humidityUnit,
        dewPoint,
        dewPointUnit,
        precipitation,
        precipitationUnit,
        visibility,
        visibilityUnit,
        windSpeed,
        windSpeedUnit,
        windDirection,
        windDirectionUnit,
        windGusts,
        windGustsUnit,
        soilTemperatureLevels,
        soilMoistureLevels,
      };
    },
  },
});
