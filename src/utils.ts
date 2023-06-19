import { FeatureCollection } from "geojson";

function getResource<T = FeatureCollection>(type: string): () => Promise<T> {
  return () => fetch(`/api/${type}`).then((res) => res.json());
}

export function getResourceWithParams<T = FeatureCollection>(
  type: string
): (args: {
  queryKey: [string, Record<string, string> | undefined];
}) => Promise<T> {
  return ({
    queryKey: [, params],
  }: {
    queryKey: [string, Record<string, string> | undefined];
  }) =>
    fetch(
      [
        `/api/${type}`,
        params ? new URLSearchParams(params).toString() : "",
      ].join("?")
    ).then((res) => res.json());
}

type EventType = { id: number; name: string; occupancy_factor: number };

export const getVenues = getResource("venues");
export const getEventTypes = getResource<EventType[]>("event-types");
export const getParkingOccupancy = getResourceWithParams(
  "parking-lots-occupancy"
);

export const scaleIconOnHover = (v: number) => v * 1.5;
