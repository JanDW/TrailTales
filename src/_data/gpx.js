import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser, XMLSerializer } from 'xmldom';

// Function to remove <extensions> elements
function removeExtensions(gpxDoc) {
  const extensions = gpxDoc.getElementsByTagName('extensions');
  Array.from(extensions).forEach((extension) => {
    extension.parentNode.removeChild(extension);
  });
}

// Function to remove <wpt> elements except start and end
function removeWaypoints(gpxDoc) {
  const waypoints = gpxDoc.getElementsByTagName('wpt');
  Array.from(waypoints).forEach((waypoint, index) => {
    if (index !== 0 && index !== waypoints.length - 1) {
      waypoint.parentNode.removeChild(waypoint);
    }
  });
}

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function () {
  try {
    const gpxFilesPath = path.resolve(__dirname, '../assets/files/gpx');
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

      removeExtensions(gpxDoc);
      removeWaypoints(gpxDoc);

      const serializer = new XMLSerializer();
      const gpxStringClean = serializer.serializeToString(gpxDoc);

      // write to json file in current directory

      const outputPath = '/assets/files/gpx/';
      //@TODO How do I reference the output dir configured in eleventy? eleventy.directories.output
      const outputDir = './www' + outputPath;

      fs.writeFileSync(path.join(outputDir, gpxFile), gpxStringClean);

      // Extract the start and end waypoints
      const waypoints = gpxDoc.getElementsByTagName('wpt');
      const startWaypoint = waypoints[0];
      const endWaypoint = waypoints[waypoints.length - 1];

      // Prepare the data
      return {
        fileName: gpxFile,
        // gpxString: gpxStringClean,
        name: gpxDoc
          .getElementsByTagName('trk')[0]
          ?.getElementsByTagName('name').textContent,
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

    // console.log(gpxData[0].fileName);

    return gpxData;
  } catch (error) {
    console.error('Error reading GPX files:', error);
    return [];
  }
}
