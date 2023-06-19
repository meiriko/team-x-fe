import { useState, useEffect } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { Map as MapboxMap } from "mapbox-gl"; // unused-eslint-disable-line import/no-webpack-loader-syntax

import "mapbox-gl/dist/mapbox-gl.css";
// import { FeatureCollection } from "geojson";

const { VITE_APP_MAPBOX_TOKEN } = import.meta.env;

export function Map({
  onMap,
  ...props
}: { onMap?: (map: MapboxMap) => void } & BoxProps) {
  const [container, setContainer] = useState<HTMLDivElement>();
  // const [map, setMap] = useState<MapboxMap>();

  useEffect(() => {
    if (container) {
      const map = new MapboxMap({
        accessToken: VITE_APP_MAPBOX_TOKEN,
        container,
        style:
          "mapbox://styles/controlcenterdev/clix6ipea00gu01qyaa4zf16e?fresh=true",
        zoom: 10,
        maxPitch: 75,
        hash: true,
        // bounds: camsBox,
        // fitBoundsOptions: {
        //   padding: 50,
        // },
        // center: [0, 51.5],
        attributionControl: false,
      });

      // setMap(map);
      onMap?.(map);
    }
  }, [container, onMap]);

  return (
    <Box
      css={{
        ".mapboxgl-popup-content": {
          color: "black",
          "font-size": "1.5rem",
          "font-weight": "bold",
          "white-space": "nowrap",
          width: "fit-content",
        },
      }}
      ref={setContainer}
      w="full"
      h="full"
      {...props}
    ></Box>
  );
}
