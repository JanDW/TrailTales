import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser, XMLSerializer } from 'xmldom';

// Function to remove <extensions> elements, power and heart rate data are tracked in these tags, but we don't care
function removeExtensions(gpxDoc) {
  const extensions = gpxDoc.getElementsByTagName('extensions');
  Array.from(extensions).forEach((extension) => {
    extension.parentNode.removeChild(extension);
  });
}

// Function to remove <wpt> elements except start and end, we don't need mile markers
function removeWaypoints(gpxDoc) {
  const waypoints = gpxDoc.getElementsByTagName('wpt');
  console.log('Total waypoints:', waypoints.length);
  Array.from(waypoints).forEach((waypoint, index) => {
    waypoint.parentNode.removeChild(waypoint);
  });
}

// Haversine formula to calculate distance between two points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get the directory name of the current module (where is this file located)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function () {
  try {
    //@TODO need to extract the path to the gpx files from a central config
    const gpxFilesPath = path.resolve(__dirname, '../assets/gpx');
    console.log('Reading GPX files from:', gpxFilesPath);
    debugger;
    const gpxFiles = fs.readdirSync(gpxFilesPath);

    // Read and process the content of each file
    const gpxData = gpxFiles.map((gpxFile) => {
      const gpxFilePath = path.join(gpxFilesPath, gpxFile);
      const gpxString = fs.readFileSync(gpxFilePath, 'utf8');

      // Parse the GPX file
      const parser = new DOMParser();
      const gpxDoc = parser.parseFromString(gpxString, 'application/xml');

      // Ensure gpxDoc is a valid XML document
      if (!gpxDoc || !gpxDoc.documentElement) {
        throw new Error(`Failed to parse GPX file: ${gpxFile}`);
      }

      // Extract the start and end waypoints
      const waypoints = gpxDoc.getElementsByTagName('wpt');
      const startWaypoint = waypoints[0];
      const endWaypoint = waypoints[waypoints.length - 1];

      // Extract the name of the track
      const trkElement = gpxDoc.getElementsByTagName('trk')[0];
      const nameElement = trkElement?.getElementsByTagName('name')[0];
      const trkName = nameElement?.textContent;

      // Calculate the length of the route
      const trkpts = gpxDoc.getElementsByTagName('trkpt');
      let totalDistance = 0;
      for (let i = 1; i < trkpts.length; i++) {
        const lat1 = parseFloat(trkpts[i - 1].getAttribute('lat'));
        const lon1 = parseFloat(trkpts[i - 1].getAttribute('lon'));
        const lat2 = parseFloat(trkpts[i].getAttribute('lat'));
        const lon2 = parseFloat(trkpts[i].getAttribute('lon'));
        totalDistance += haversineDistance(lat1, lon1, lat2, lon2);
      }

      removeExtensions(gpxDoc);
      removeWaypoints(gpxDoc);

      const serializer = new XMLSerializer();
      const gpxStringClean = serializer.serializeToString(gpxDoc);

      // write to json file in current directory

      //@TODO How do I reference the output dir configured in eleventy? eleventy.directories.output

      const outputPath = path.join(__dirname, `../../www/assets/files/gpx`);

      console.log('Writing to:', outputPath);

      fs.mkdirSync(outputPath, { recursive: true });

      const filePath = path.join(outputPath, gpxFile);
      console.log('Writing to:', filePath);
      fs.writeFileSync(filePath, gpxStringClean);

      // Prepare the data
      return {
        fileName: gpxFile,
        // gpxString: gpxStringClean,
        trkName,
        totalDistance: totalDistance.toFixed(2),
        startWaypoint: {
          name: startWaypoint.getElementsByTagName('name')[0]?.textContent,
          lat: startWaypoint.getAttribute('lat'),
          lon: startWaypoint.getAttribute('lon'),
          ele: startWaypoint.getElementsByTagName('ele')[0]?.textContent,
          time: startWaypoint.getElementsByTagName('time')[0]?.textContent,
        },
        endWaypoint: {
          name: endWaypoint.getElementsByTagName('name')[0]?.textContent,
          lat: endWaypoint.getAttribute('lat'),
          lon: endWaypoint.getAttribute('lon'),
          ele: endWaypoint.getElementsByTagName('ele')[0]?.textContent,
          time: endWaypoint.getElementsByTagName('time')[0]?.textContent,
        },
      };
    });

    console.log(gpxData[0].fileName);

    // Sort the gpxData array in reverse chronological order by startWaypoint.time
    gpxData.sort(
      (a, b) => new Date(b.startWaypoint.time) - new Date(a.startWaypoint.time)
    );

    return gpxData;
  } catch (error) {
    console.error('Error reading GPX files:', error);
    return [];
  }
}
