const ENDPOINT = `${window.location.protocol}//${process.env.APP_API_ENDPOINT}`;

export default function makeRequest(name: string) {
  console.log(ENDPOINT);
  return fetch(ENDPOINT + name, {
    method: 'GET',
  }).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json();
  });
}
