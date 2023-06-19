import {
  MapLayerMouseEvent,
  MapboxGeoJSONFeature,
  Map as MapboxMap,
} from "mapbox-gl"; // unused-eslint-disable-line import/no-webpack-loader-syntax
import { useCallback, useEffect } from "react";

export function useLayoutOrPaintPropertyOnHover(
  map: MapboxMap | undefined,
  layerId: string,
  property: string,
  value: ((v: unknown) => unknown) | unknown,
  type: "layout" | "paint" = "layout"
) {
  useEffect(() => {
    if (map) {
      const getPropertyValue = (
        type === "layout" ? map.getLayoutProperty : map.getPaintProperty
      ).bind(map);
      const setPropertyValue = (
        type === "layout" ? map.setLayoutProperty : map.setPaintProperty
      ).bind(map);
      let baseValue: number | undefined = undefined;
      let hoverValue: number;
      const getBaseValue = () => {
        baseValue = map && getPropertyValue(layerId, property);
        if (baseValue !== undefined) {
          hoverValue = typeof value === "function" ? value(baseValue) : value;
          map?.off("sourcedata", getBaseValue);
        }
      };
      getBaseValue();
      if (!baseValue) {
        map.on("sourcedata", getBaseValue);
      }
      const onMouseEnter = (e: MapLayerMouseEvent) => {
        const ids = e.features?.map(({ id }) => id);
        if (ids?.length) {
          setPropertyValue(layerId, property, [
            "case",
            ["in", ["id"], ["literal", ids]],
            hoverValue,
            baseValue,
          ]);
        }
      };
      const onMouseLeave = () => {
        setPropertyValue(layerId, property, baseValue);
      };

      map.on("mouseenter", layerId, onMouseEnter);
      map.on("mouseleave", layerId, onMouseLeave);
      map.on("movestart", onMouseLeave);

      return () => {
        map.off("mouseenter", layerId, onMouseEnter);
        map.off("mouseleave", layerId, onMouseLeave);
        map.off("movestart", onMouseLeave);
      };
    } else {
      return undefined;
    }
  }, [map, layerId, property, value, type]);
}

export function useScaleOnHover(
  map: MapboxMap | undefined,
  layerId: string,
  scale = 1.5
) {
  const scaleFN = useCallback((value: number) => value * scale, [scale]);
  return useLayoutOrPaintPropertyOnHover(map, layerId, "icon-size", scaleFN);
}

export function useClickOnLayer(
  map: MapboxMap | undefined,
  layerId: string,
  onClick: (features: MapboxGeoJSONFeature[] | undefined) => void
) {
  useEffect(() => {
    if (map) {
      const handler = (e: MapLayerMouseEvent) => onClick(e.features);
      map.on("click", layerId, handler);
      return () => {
        map.off("click", layerId, handler);
      };
    } else {
      return undefined;
    }
  }, [map, layerId, onClick]);
}
