import { useEffect, useState, useCallback } from "react";
import { Map } from "./Map/Map";
import {
  GeoJSONSource,
  LngLatBoundsLike,
  MapLayerMouseEvent,
  MapboxGeoJSONFeature,
  Map as MapboxMap,
  Popup,
} from "mapbox-gl"; // unused-eslint-disable-line import/no-webpack-loader-syntax
import { useQuery } from "@tanstack/react-query";
import { FeatureCollection, Point } from "geojson";
import { useClickOnLayer, useLayoutOrPaintPropertyOnHover } from "./Map/utils";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { getVenues, scaleIconOnHover } from "./utils";
import bbox from "@turf/bbox";
import { NumberParam, useQueryParams } from "use-query-params";

function addPopup(map: MapboxMap, layerId: string) {
  const popup = new Popup({
    closeButton: false,
    closeOnClick: false,
  });

  map.on("mouseenter", layerId, (e: MapLayerMouseEvent) => {
    map.getCanvas().style.cursor = "pointer";
    const featureProps = e.features?.[0]?.properties;
    const content = featureProps
      ? `${featureProps.name}: ${Math.round(
          featureProps.occupancy
        )}/${Math.round(featureProps.capacity)} [${Math.round(
          (featureProps.occupancy / featureProps.capacity) * 100
        )}%]`
      : "no info";

    popup.setLngLat(e.lngLat).setHTML(content).addTo(map);
  });

  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
  });
}

function createSources(map: MapboxMap, venues: FeatureCollection) {
  map.addSource("venues", {
    type: "geojson",
    data: venues,
  });
  map.addSource("parking", {
    type: "geojson",
    data: undefined,
  });
}

function createLayers(map: MapboxMap) {
  map.addLayer({
    id: "venues",
    type: "symbol",
    source: "venues",
    layout: {
      "icon-image": "stadium-marker",
      "icon-allow-overlap": true,
      "icon-size": 2,
      "text-field": "{name}",
      "text-anchor": "center",
      "text-allow-overlap": true,
      "text-offset": [0, -2.5],
    },
    paint: {
      "text-color": "#ffff00",
      "text-opacity": 0,
    },
  });
  map.addLayer({
    id: "parking",
    type: "fill",
    source: "parking", // reference the data source
    layout: {},
    paint: {
      "fill-color": [
        "interpolate",
        ["linear"],
        ["/", ["get", "occupancy"], ["get", "capacity"]],
        0,
        "hsl(120, 100%, 50%)",
        1,
        "hsl(0, 100%, 50%)",
      ],
    },
  });
}

function App() {
  const [map, setMap] = useState<MapboxMap>();
  const { id } = useParams();
  const { data: venues } = useQuery({
    queryKey: ["venues"],
    queryFn: getVenues,
  });

  useEffect(() => {
    if (!(map && venues && !map.getLayer("venues"))) {
      return;
    }

    map.once("idle", () => {
      createSources(map, venues);
      createLayers(map);
      addPopup(map, "parking");
    });
  }, [map, venues]);
  useEffect(() => {
    if (map && venues && !id) {
      map.once("idle", () => {
        setTimeout(() => {
          map.fitBounds(bbox(venues) as LngLatBoundsLike, { maxZoom: 15 });
        }, 0);
      });
    }
  }, [map, venues, id]);

  const navigate = useNavigate();
  const onVenueClick = useCallback(
    (features: MapboxGeoJSONFeature[] | undefined) => {
      const id = features?.[0]?.id;
      if (map && id) {
        map
          .panTo(
            (features[0]?.geometry as Point)?.coordinates as [number, number],
            {
              duration: 1000,
            }
          )
          .once("moveend", () => {
            map.zoomTo(13);
          });
        navigate({
          pathname: `/venue/${id}/`,
          search: window.location.search,
          hash: window.location.hash,
        });
      }
    },
    [navigate, map]
  );

  useLayoutOrPaintPropertyOnHover(map, "venues", "icon-size", scaleIconOnHover);
  useLayoutOrPaintPropertyOnHover(map, "venues", "text-opacity", 1, "paint");
  useClickOnLayer(map, "venues", onVenueClick);

  const { id: venueId } = useParams();
  const [{ eventTime, occupancy, offset, eventType }] = useQueryParams({
    eventTime: NumberParam,
    occupancy: NumberParam,
    offset: NumberParam,
    eventType: NumberParam,
  });
  useEffect(() => {
    if (!map) {
      return;
    }
    if (
      [eventTime, offset, occupancy, venueId, eventType].some(
        (v) => v === undefined
      )
    ) {
      (map.getSource("parking") as GeoJSONSource)?.setData("");
    } else {
      const query = Object.entries({
        venue_id: venueId,
        event_start_ms: eventTime,
        event_end_ms: (eventTime ?? 0) + 60 * 60 * 1000,
        actual_occupancy: occupancy,
        time_to_check_ms: (eventTime ?? 0) + (offset ?? 0),
        event_type: eventType,
      })
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
      const url = ["/api/parking-lots-occupancy", query].join("?");
      const updateSource = () => {
        const source = map.getSource("parking") as GeoJSONSource;
        if (source) {
          source.setData(url);
          map.off("idle", updateSource);
          return true;
        }
        return false;
      };
      if (!updateSource()) {
        map.on("idle", updateSource);
      }
    }
  }, [map, eventTime, offset, occupancy, venueId, eventType]);

  return (
    <>
      <Outlet />
      <Map onMap={setMap} />
    </>
  );
}

export default App;
