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
  85: '☃️Snow showers: Slight intensity',
  86: '☃️ Snow showers: Heavy intensity',
  95: '⚡️ Thunderstorm: Slight or moderate',
  96: '⛈️ Thunderstorm with slight hail',
  99: '⛈️Thunderstorm with heavy hail',
};

export default (data) => ({
  layout: 'walks.webc',
  eleventyComputed: {
    permalink: (data) => getPermalink(data),
    gpxData: (data) => {
      const gpxMatch = data.gpx.filter(
        (gpxItem) => gpxItem.fileName === data.gpxFile
      )[0];
      return gpxMatch;
    },
    shots: (data) => {
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

      // console.log({ location });
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

      // take time from the gpxData.startWaypoint.time and use it to figure out which element in the hourly array to pick

      const date = new Date(gpxData.startWaypoint.time);
      const hour = date.getHours(); // 0 - 23
      const minutes = date.getMinutes(); // 0 - 59

      // if minutes are less than 30, pick the hour, otherwise pick the next hour
      let indexToPick;
      minutes < 30 ? indexToPick = hour : indexToPick = hour + 1;

      const weatherCode = weatherData.hourly.weather_code[indexToPick];
      
      // get the weather description from the weather codes object
      const description = wmoWeatherCodes[weatherCode];
      const temp = weatherData.hourly.temperature_2m[indexToPick];
      const tempUnit = weatherData.hourly_units.temperature_2m;
      const humidity = weatherData.hourly.relative_humidity_2m[indexToPick];
      const humidityUnit = weatherData.hourly_units.relative_humidity_2m;
      const dewPoint = weatherData.hourly.dew_point_2m[indexToPick];
      const dewPointUnit = weatherData.hourly_units.dew_point_2m;

      return {
        description,
        temp,
        tempUnit,
        humidity,
        humidityUnit,
        dewPoint,
        dewPointUnit,
      };
    }
  },
});
