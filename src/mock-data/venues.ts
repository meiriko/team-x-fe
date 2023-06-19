import { FeatureCollection } from "geojson";

export function getVenues(): Promise<FeatureCollection> {
  return fetch("/api/venues").then((res) => res.json());
}
