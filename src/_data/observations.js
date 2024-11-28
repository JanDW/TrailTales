import Fetch from '@11ty/eleventy-fetch';
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 200;

const observationsUrl =
  'https://api.inaturalist.org/v1/observations?user_id=jan_de_wilde&user_login=jan_de_wilde&order=desc&order_by=created_at';

async function getObservations() {
  try {
    const data = await Fetch(observationsUrl, {
      duration: '*',
      type: 'json',
    });

    // Check the 'total_results' value and compare to 'per_page' to see if there are more pages of data

    const pages = Math.ceil(data.total_results / data.per_page);

    // If there are more pages, fetch them and add the results to the data object

    if (pages > 1) {
      for (let i = 2; i <= pages; i++) {
        const pageData = await Fetch(`${observationsUrl}&page=${i}`, {
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

async function extractProperties(observations) {
  return observations.map((observation) => {
    // console.log(observation);
    // use same key names as in the iNaturalist API
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
    };
  });
}

export default async function () {
  const all = await getObservations();
  const selected = await extractProperties(all);
  return { all, selected };
}
