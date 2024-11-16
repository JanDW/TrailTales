const getPermalink = (data) => {
  let permalink;
  if (data.page.fileSlug === 'walks') {
    return (permalink = `/walks/index.html`);
  }
  return (permalink = `/walks/${data.page.fileSlug}/index.html`);
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
        gpxData.startWaypoint.lon,
        gpxData.startWaypoint.time
      );
      return location[0].name || '';
    },
  },
});
