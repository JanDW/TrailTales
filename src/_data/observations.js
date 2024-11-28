import EleventyFetch from '@11ty/eleventy-fetch';
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 200;

const observationsUrl =
  'https://api.inaturalist.org/v1/observations?user_login=jan_de_wilde&order=desc&order_by=created_at';

async function getObservations() {
  try {
    const data = await EleventyFetch(observationsUrl, {
      duration: '*',
      type: 'json',
    });

    // Check the 'total_results' value and compare to 'per_page' to see if there are more pages of data

    const pages = Math.ceil(data.total_results / data.per_page);

    // If there are more pages, fetch them and add the results to the data object

    if (pages > 1) {
      for (let i = 2; i <= pages; i++) {
        const pageData = await EleventyFetch(`${observationsUrl}&page=${i}`, {
          duration: '*',
          type: 'json',
        });
        data.results = data.results.concat(pageData.results);
      }
    }

    return data.results;
  } catch (error) {
    console.error('Error reading observations:', error);
    return [];
  }
}

async function getWikipediaSummary(taxonId) {
  if (!taxonId) {
    return 'Wikipedia excerpt not available';
  }
  try {
    const url = `https://api.inaturalist.org/v1/taxa/${taxonId}`;
    const taxonData = await EleventyFetch(url, {
      duration: '300s',
      type: 'json',
    });
    return taxonData?.results[0]?.wikipedia_summary ?? null;
  } catch (error) {
    return 'Wikipedia excerpt not available';
  }
}

async function checkImageExists(url) {
  try {
    // Use HEAD request to check if image exists, this prevents downloading the image
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Check if extension is jpg or jpeg
async function getImageUrl(photoId, size = 'medium') {
  const jpegUrl = `https://inaturalist-open-data.s3.amazonaws.com/photos/${photoId}/${size}.jpeg`;
  const jpgUrl = `https://inaturalist-open-data.s3.amazonaws.com/photos/${photoId}/${size}.jpg`;

  if (await checkImageExists(jpegUrl)) {
    return jpegUrl;
  } else if (await checkImageExists(jpgUrl)) {
    return jpgUrl;
  } else {
    return '😵 borked image url!'; // @TODO return a placeholder image
  }
}

async function extractProperties(observations) {
  const results = await Promise.all(
    observations.map(async (observation) => {
      // console.log(observation);
      // use same key names as in the iNaturalist API
      const wikipedia_summary = await getWikipediaSummary(
        observation.taxon?.id
      );

      const image_urls = await Promise.all(
        observation.photos.map(async (photo) => {
          return await getImageUrl(photo.id);
        })
      );

      return {
        preferred_common_name: observation.taxon?.preferred_common_name ?? null,
        name: observation.taxon?.name ?? null,
        id: observation.taxon?.id ?? null,
        description: observation.description ?? null,
        place_guess: observation.place_guess ?? null,
        uri: observation.uri ?? null,
        wikipedia_url: observation.taxon?.wikipedia_url ?? null,
        time_observed_at: observation.time_observed_at ?? null,
        coordinates: observation.geojson?.coordinates ?? [null, null],
        ancestors: observation.identifications?.[0]?.taxon?.ancestors ?? [],
        wikipedia_summary: wikipedia_summary,
        image_urls: image_urls,
      };
    })
  );
  return results;
}

export default async function () {
  const all = await getObservations();
  const selected = await extractProperties(all);
  return { all, selected };
}
