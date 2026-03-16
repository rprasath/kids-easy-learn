"use client";

import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";

import countriesTopo from "world-atlas/countries-50m.json";
import landTopo from "world-atlas/land-110m.json";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

import { useStudyChrome } from "@/components/focus-shell";
import { LearningCardItem } from "@/lib/types";

type GeographyMapProps = {
  item: LearningCardItem;
  interactive?: boolean;
  mapLabel?: string;
  onSelectFeatureId?: (featureId: string) => void;
  selectedFeatureIds?: string[];
  title?: string;
  caption?: string;
};

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 540;
const countriesFeatureCollection = feature(
  countriesTopo as never,
  (countriesTopo as { objects: { countries: unknown } }).objects.countries as never,
) as unknown as {
  features: Array<{ id: string | number; properties?: { name?: string } }>;
};
const landFeature = feature(
  landTopo as never,
  (landTopo as { objects: { land: unknown } }).objects.land as never,
) as never;
const projection = geoMercator().fitExtent(
  [
    [24, 20],
    [VIEW_WIDTH - 24, VIEW_HEIGHT - 24],
  ],
  landFeature,
);
const pathGenerator = geoPath(projection);
const landPath = pathGenerator(landFeature) ?? "";
const WORLD_VIEWBOX = [0, 0, VIEW_WIDTH, VIEW_HEIGHT] as const;
const countryShapes = countriesFeatureCollection.features
  .map((shape) => ({
    id: String(shape.id).padStart(3, "0"),
    name: shape.properties?.name ?? "",
    feature: shape,
    d: pathGenerator(shape as never) ?? "",
  }))
  .filter((shape) => shape.d);
const countryShapeById = new Map(countryShapes.map((shape) => [shape.id, shape]));

function combineBoxes(boxes: number[][]): number[] | null {
  if (boxes.length === 0) {
    return null;
  }

  return boxes.reduce((current, box) => [
    Math.min(current[0], box[0]),
    Math.min(current[1], box[1]),
    Math.max(current[2], box[2]),
    Math.max(current[3], box[3]),
  ]);
}

function fitBoxToViewport(box: number[], zoomLevel: number): number[] {
  const [x0, y0, x1, y1] = box;
  const width = Math.max(80, x1 - x0);
  const height = Math.max(80, y1 - y0);
  const centerX = (x0 + x1) / 2;
  const centerY = (y0 + y1) / 2;
  const viewportRatio = VIEW_WIDTH / VIEW_HEIGHT;
  let nextWidth = width;
  let nextHeight = height;

  if (width / height > viewportRatio) {
    nextHeight = width / viewportRatio;
  } else {
    nextWidth = height * viewportRatio;
  }

  nextWidth = Math.max(120, nextWidth / zoomLevel);
  nextHeight = Math.max(120, nextHeight / zoomLevel);

  if (nextWidth >= VIEW_WIDTH || nextHeight >= VIEW_HEIGHT) {
    return [...WORLD_VIEWBOX];
  }

  let minX = centerX - nextWidth / 2;
  let minY = centerY - nextHeight / 2;

  minX = Math.max(WORLD_VIEWBOX[0], Math.min(minX, VIEW_WIDTH - nextWidth));
  minY = Math.max(WORLD_VIEWBOX[1], Math.min(minY, VIEW_HEIGHT - nextHeight));

  return [minX, minY, nextWidth, nextHeight];
}

function clampPan(baseViewBox: number[], panOffset: [number, number]): [number, number] {
  const [, , width, height] = baseViewBox;
  const minPanX = -baseViewBox[0];
  const maxPanX = VIEW_WIDTH - (baseViewBox[0] + width);
  const minPanY = -baseViewBox[1];
  const maxPanY = VIEW_HEIGHT - (baseViewBox[1] + height);

  return [
    Math.min(Math.max(panOffset[0], minPanX), maxPanX),
    Math.min(Math.max(panOffset[1], minPanY), maxPanY),
  ];
}

export function GeographyMap({
  item,
  interactive = false,
  mapLabel,
  onSelectFeatureId,
  selectedFeatureIds,
  title,
  caption,
}: GeographyMapProps) {
  const { theme } = useStudyChrome();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState<[number, number]>([0, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    panOffset: [number, number];
    moved: boolean;
  } | null>(null);
  const dragMovedRef = useRef(false);
  const featureIds = new Set(
    selectedFeatureIds ?? (item.map?.featureIds ?? (item.map?.featureId ? [item.map.featureId] : [])),
  );
  const fallbackPoint =
    item.map?.centroid && item.map.centroid.length === 2
      ? projection(item.map.centroid as [number, number])
      : null;
  const baseFill = theme === "dark" ? "#122033" : "#eef4f7";
  const countryFill = theme === "dark" ? "#21344f" : "#ffffff";
  const countryStroke = theme === "dark" ? "rgba(201, 214, 226, 0.22)" : "rgba(24, 50, 70, 0.16)";
  const highlightFill = item.skillId === "continents" ? "#64b98f" : "#f28b45";
  const highlightStroke = item.skillId === "continents" ? "#2b6d4a" : "#a44b11";
  const frameTone = theme === "dark" ? "bg-slate-900/80" : "bg-white/90";
  const captionTone = theme === "dark" ? "text-slate-300" : "text-slate-600";
  const titleTone = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const zoomButtonTone =
    theme === "dark"
      ? "bg-slate-800 text-slate-100 ring-slate-700"
      : "bg-white text-slate-900 ring-slate-200";
  const targetBox = useMemo(() => {
    const featureBoxes = Array.from(featureIds)
      .map((featureId) => {
        const shape = countryShapeById.get(featureId);
        if (!shape) {
          return null;
        }

        const [[x0, y0], [x1, y1]] = pathGenerator.bounds(shape.feature as never);
        return [x0, y0, x1, y1];
      })
      .filter((box): box is number[] => box !== null);
    const combinedFeatureBox = combineBoxes(featureBoxes);

    if (combinedFeatureBox) {
      const padding = item.skillId === "continents" ? 24 : 40;
      return [
        combinedFeatureBox[0] - padding,
        combinedFeatureBox[1] - padding,
        combinedFeatureBox[2] + padding,
        combinedFeatureBox[3] + padding,
      ];
    }

    if (fallbackPoint) {
      const radius = item.skillId === "continents" ? 140 : 90;
      return [
        fallbackPoint[0] - radius,
        fallbackPoint[1] - radius,
        fallbackPoint[0] + radius,
        fallbackPoint[1] + radius,
      ];
    }

    return [...WORLD_VIEWBOX];
  }, [fallbackPoint, featureIds, item.skillId]);
  const baseViewBox = useMemo(() => fitBoxToViewport(targetBox, zoomLevel), [targetBox, zoomLevel]);
  const viewBox = useMemo(() => {
    const [clampedPanX, clampedPanY] = clampPan(baseViewBox, panOffset);
    return [baseViewBox[0] + clampedPanX, baseViewBox[1] + clampedPanY, baseViewBox[2], baseViewBox[3]];
  }, [baseViewBox, panOffset]);

  useEffect(() => {
    setZoomLevel(1);
    setPanOffset([0, 0]);
  }, [item.id, item.skillId]);

  useEffect(() => {
    setPanOffset((current) => clampPan(baseViewBox, current));
  }, [baseViewBox]);

  function adjustZoom(nextZoomLevel: number) {
    setZoomLevel(Math.max(0.3, Math.min(5, Number(nextZoomLevel.toFixed(2)))));
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (interactive && event.target instanceof SVGPathElement) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      panOffset,
      moved: false,
    };
    dragMovedRef.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const svgRect = event.currentTarget.getBoundingClientRect();
    const deltaX = event.clientX - dragStateRef.current.clientX;
    const deltaY = event.clientY - dragStateRef.current.clientY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragStateRef.current.moved = true;
      dragMovedRef.current = true;
    }
    const scaledDeltaX = -(deltaX / svgRect.width) * baseViewBox[2];
    const scaledDeltaY = -(deltaY / svgRect.height) * baseViewBox[3];

    setPanOffset(
      clampPan(baseViewBox, [
        dragStateRef.current.panOffset[0] + scaledDeltaX,
        dragStateRef.current.panOffset[1] + scaledDeltaY,
      ]),
    );
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      setIsDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className={`rounded-[2rem] p-5 paper-shadow ${frameTone}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Map Focus</div>
          <div className={`mt-1 text-lg font-black ${titleTone}`}>{title ?? item.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjustZoom(zoomLevel / 1.25)}
            className={`rounded-full px-4 py-2 text-sm font-black ring-1 ${zoomButtonTone}`}
            aria-label="Zoom out map"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomLevel(1);
              setPanOffset([0, 0]);
            }}
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ring-1 ${zoomButtonTone}`}
            aria-label="Reset map zoom"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => adjustZoom(zoomLevel * 1.25)}
            className={`rounded-full px-4 py-2 text-sm font-black ring-1 ${zoomButtonTone}`}
            aria-label="Zoom in map"
          >
            +
          </button>
        </div>
      </div>
      <svg
        viewBox={viewBox.join(" ")}
        className={`h-auto min-h-[26rem] w-full rounded-[1.6rem] touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        role="img"
        aria-label={mapLabel ?? `Highlighted ${item.skillId === "continents" ? "continent" : "country"} map`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={(event) => {
          event.preventDefault();
          const next = event.deltaY < 0 ? zoomLevel * 1.18 : zoomLevel / 1.18;
          adjustZoom(next);
        }}
      >
        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} rx="24" fill={theme === "dark" ? "#09101c" : "#f8fbfd"} />
        <path d={landPath} fill={baseFill} stroke={countryStroke} strokeWidth="0.6" />
        {countryShapes.map((shape) => {
          const isHighlighted = featureIds.has(shape.id);
          const isHovered = hoveredFeatureId === shape.id;
          const isClickable = interactive && shape.id !== "010";
          const highlightScale = isHighlighted ? 1 : isHovered ? 0.82 : 0;
          const fill = isHighlighted
            ? highlightFill
            : isHovered
              ? theme === "dark"
                ? "#304c73"
                : "#dbeaf4"
              : countryFill;
          const stroke = isHighlighted ? highlightStroke : isHovered ? "#4d89b4" : countryStroke;

          return (
            <path
              key={shape.id}
              d={shape.d}
              fill={fill}
              stroke={stroke}
              strokeWidth={isHighlighted ? 1.6 : isHovered ? 1.15 : 0.75}
              vectorEffect="non-scaling-stroke"
              className={isClickable ? "cursor-pointer transition-colors" : undefined}
              role={isClickable ? "button" : undefined}
              aria-label={isClickable ? `Open details for ${shape.name}` : undefined}
              data-feature-id={shape.id}
              onMouseEnter={() => {
                if (isClickable) {
                  setHoveredFeatureId(shape.id);
                }
              }}
              onMouseLeave={() => {
                if (hoveredFeatureId === shape.id) {
                  setHoveredFeatureId(null);
                }
              }}
              onClick={() => {
                if (!isClickable || dragMovedRef.current) {
                  dragMovedRef.current = false;
                  return;
                }

                onSelectFeatureId?.(shape.id);
              }}
            />
          );
        })}
        {!Array.from(featureIds).some((featureId) => countryShapeById.has(featureId)) && fallbackPoint ? (
          <circle
            cx={fallbackPoint[0]}
            cy={fallbackPoint[1]}
            r="8"
            fill={highlightFill}
            stroke={highlightStroke}
            strokeWidth="2"
          />
        ) : null}
      </svg>
      <div className={`mt-3 text-sm font-semibold ${captionTone}`}>
        {caption ??
          (item.skillId === "continents"
            ? "The map zooms to the highlighted continent, and you can drag or zoom back out to the whole world."
            : "The map auto-focuses on the highlighted country, and you can drag or zoom back out for more context.")}
      </div>
    </div>
  );
}
