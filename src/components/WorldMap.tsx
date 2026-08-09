"use client";
import React from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  visited: string[]; 
  planned?: string[]; 
  pins?: {
    name: string;
    coordinates: [number, number];
  }[];
}

export default function WorldMap({
  visited,
  planned = [],
  pins = [],
}: WorldMapProps) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ComposableMap projectionConfig={{ scale: 145 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const code = geo.properties.ISO_A2;

              const isVisited = visited.includes(code);
              const isPlanned = planned.includes(code);

              let fill = "#E2E8F0"; 
              if (isVisited) fill = "#2563EB";
              else if (isPlanned) fill = "#93C5FD";

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill, outline: "none" },
                    hover: {
                      fill: isVisited ? "#1D4ED8" : "#CBD5E1",
                      outline: "none",
                      cursor: "pointer",
                    },
                    pressed: { fill: "#1E40AF", outline: "none" },
                  }}
                  className="transition-colors duration-300"
                />
              );
            })
          }
        </Geographies>
        {pins.map(({ name, coordinates }) => (
          <Marker key={name} coordinates={coordinates}>
            <circle r={5} fill="#EF4444" stroke="#FFF" strokeWidth={2} className="animate-pulse" />
            <text
              textAnchor="middle"
              y={-10}
              className="font-black text-blue-900 bg-white"
              style={{ fontFamily: "inherit", fontSize: "10px", fill: "#1E3A8A" }}
            >
              {name}
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}
