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

    // //sort data reverse chronological order by date recorded
    // data.results.sort((a, b) => {
    //   return new Date(b.created_at) - new Date(a.created_at);
    // });

    return data.results;
  } catch (error) {
    console.error('Error reading observations:', error);
    return [];
  }
}

export default async function () {
  return await getObservations();
}
