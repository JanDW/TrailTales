import EleventyFetch from '@11ty/eleventy-fetch';
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 200;

const observationsUrl =
  'https://api.inaturalist.org/v1/observations?user_login=jan_de_wilde&order=desc&order_by=created_at';

async function getObservations() {
  try {
    const data = structuredClone(
      await EleventyFetch(observationsUrl, {
        duration: '*',
        type: 'json',
      })
    );

    // Check the 'total_results' value and compare to 'per_page' to see if there are more pages of data

    const pages = Math.ceil(data.total_results / data.per_page);

    // If there are more pages, fetch them and add the results to the data object

    if (pages > 1) {
      for (let i = 2; i <= pages; i++) {
        const pageData = structuredClone(
          await EleventyFetch(`${observationsUrl}&page=${i}`, {
            duration: '*',
            type: 'json',
          })
        );
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
  }

  if (await checkImageExists(jpgUrl)) {
    return jpgUrl;
  }
  return '😵 borked image url!'; // @TODO return a placeholder image
}

async function extractProperties(observations) {
  const results = await Promise.all(
    observations.map(async (observation) => {
      // use same key names as in the iNaturalist API
      const wikipedia_summary = await getWikipediaSummary(
        observation.taxon?.id
      );

      const photos = await Promise.all(
        observation.photos.map(async (photo) => {
          const url = await getImageUrl(photo.id);
          const alt =
            observation.taxon?.preferred_common_name ?? observation.taxon?.name;
          return { url, alt };
        })
      );

      return {
        preferred_common_name: observation.taxon?.preferred_common_name ?? null,
        name: observation.taxon?.name ?? null,
        id: observation.id,
        taxon_id: observation.taxon?.id ?? null,
        description: observation.description ?? null,
        place_guess: observation.place_guess ?? null,
        uri: observation.uri ?? null,
        wikipedia_url: observation.taxon?.wikipedia_url ?? null,
        time_observed_at: observation.time_observed_at ?? null,
        coordinates: observation.geojson?.coordinates ?? [null, null],
        ancestors: observation.identifications?.[0]?.taxon?.ancestors ?? [],
        wikipedia_summary: wikipedia_summary,
        taxon_photo: observation.taxon?.default_photo?.medium_url ?? null,
        photos,
      };
    })
  );
  return results;
}

const all = await getObservations();
const selected = await extractProperties(all);
const species = Object.values(
  selected.reduce((acc, observation) => {
    const {
      taxon_id,
      preferred_common_name,
      name,
      id,
      ancestors,
      wikipedia_url,
      wikipedia_summary,
      taxon_photo,
      place_guess,
      photos,
    } = observation;
    if (!acc[taxon_id]) {
      acc[taxon_id] = {
        taxon_id,
        preferred_common_name,
        name,
        place_guess,
        observation_ids: [],
        ancestors,
        wikipedia_url,
        wikipedia_summary,
        taxon_photo,
        photos: [],
      };
    }
    acc[taxon_id].observation_ids.push(id);
    acc[taxon_id].photos = acc[taxon_id].photos.concat(photos);
    return acc;
  }, {})
);

export default { all, selected, species };
