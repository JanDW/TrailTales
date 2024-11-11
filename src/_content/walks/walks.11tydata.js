const getPermalink = (data) => {
  // console.log(data);
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
      const test = data.gpx.filter(
        (gpxItem) => gpxItem.fileName === data.gpxFile
      )[0];
      return test;
    },
    shots: (data) => {
      console.log(data.images[data.photos[0].src].exif.Caption);
      data.photos.map((photo) => {
        if (photo) {
          photo.lat = data.images[photo.src]?.exif.latitude;
          photo.lon = data.images[photo.src]?.exif.longitude;
          photo.caption = data.images[photo.src]?.exif.Caption;
          photo.dateTime = data.images[photo.src]?.exif.DateTimeOriginal;
          photo.lens = data.images[photo.src]?.exif.LensModel;
        }
        return photo;
      });
    },
  },
});
