"use client";
import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  visited: string[]; 
}

export default function WorldMap({ visited }: WorldMapProps) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ComposableMap projectionConfig={{ scale: 145 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const isVisited = visited.some(
                (v) => v.toLowerCase() === geo.properties.name.toLowerCase()
              );

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { 
                      fill: isVisited ? "#2563EB" : "#E2E8F0", 
                      outline: "none" 
                    },
                    hover: { 
                      fill: isVisited ? "#1D4ED8" : "#CBD5E1", 
                      outline: "none",
                      cursor: "pointer"
                    },
                    pressed: { fill: "#1E40AF", outline: "none" },
                  }}
                  className="transition-colors duration-300"
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}