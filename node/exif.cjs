const exifr = require('exifr');

async function readExif() {
  const exif = await exifr.parse(
    '../src/_data/images/11-09-24-fitzgerald-lake-sofie - 4.jpeg',
    true
  );
  console.log(exif);
}

readExif();
