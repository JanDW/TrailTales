const exifr = require('exifr');

async function readExif() {
  const exif = await exifr.parse(
    '../src/_data/images/11-17-24-buffam-falls - 6.jpeg',
    true
  );
  console.log(exif);
}

readExif();
