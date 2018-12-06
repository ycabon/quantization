import Task from "@dojo/core/async/Task";
import { FeatureSet, PolygonFeatureSet, Extent, Polygon, PointFeatureSet, Point } from "./arcgis";

export interface QuantizationParameters {
  tolerance: number;
  extent: Extent;
  removeCollinearVertices: boolean;
}

export interface QuantizationStatistics {
  inputFeatureCount: number;
  outputFeatureCount: number;
  inputVertexCount: number;
  outputVertexCount: number;
  collinearVertextCount: number;
  time: number;
}

export interface QuantizationResult {
  featureSet: FeatureSet;
  statistics: QuantizationStatistics;
}

export function quantize(featureSet: FeatureSet, quantizationParameters: QuantizationParameters): Task<QuantizationResult> {
  return new Task<QuantizationResult>(resolve => {
    const statistics: QuantizationStatistics = {
      inputFeatureCount: featureSet.features.length,
      outputFeatureCount: 0,
      inputVertexCount: 0,
      outputVertexCount: 0,
      collinearVertextCount: 0,
      time: 0
    };

    const now = Date.now();

    const results: QuantizationResult = {
      featureSet: null,
      statistics
    };

    switch (featureSet.geometryType) {
      case "esriGeometryPoint":
        results.featureSet = quantizePointFeatureSet(featureSet, quantizationParameters, statistics);
        break;
      case "esriGeometryPolygon":
        results.featureSet = quantizePolygonFeatureSet(featureSet, quantizationParameters, statistics);
        break;
    }

    statistics.outputFeatureCount = results.featureSet.features.length;
    statistics.time = Date.now() - now;

    resolve(results);
  });
}

function quantizePointFeatureSet(featureSet: PointFeatureSet, quantizationParameters: QuantizationParameters, statistics: QuantizationStatistics): PointFeatureSet {
  const output: PointFeatureSet = {
    geometryType: "esriGeometryPoint",
    features: [],
    transform: {
      originPosition: "upperLeft",
      scale: [quantizationParameters.tolerance, quantizationParameters.tolerance],
      translate: [
        quantizationParameters.extent.xmin,
        quantizationParameters.extent.ymax
      ]
    }
  };

  for (const feature of featureSet.features) {
    const quantized = quantizePoint(feature.geometry, quantizationParameters, statistics);

    if (quantized) {
      output.features.push({
        geometry: quantized
      });
    }
  }

  return output;
}

function quantizePolygonFeatureSet(featureSet: PolygonFeatureSet, quantizationParameters: QuantizationParameters, statistics: QuantizationStatistics): PolygonFeatureSet {
  const output: PolygonFeatureSet = {
    geometryType: "esriGeometryPolygon",
    features: [],
    transform: {
      originPosition: "upperLeft",
      scale: [quantizationParameters.tolerance, quantizationParameters.tolerance],
      translate: [
        quantizationParameters.extent.xmin,
        quantizationParameters.extent.ymax
      ]
    }
  };

  for (const feature of featureSet.features) {
    const quantized = quantizePolygon(feature.geometry, quantizationParameters, statistics);

    if (quantized) {
      output.features.push({
        geometry: quantized
      });
    }
  }

  return output;
}

function quantizePoint(geometry: Point, quantizationParameters: QuantizationParameters, statistics: QuantizationStatistics): Point {
  const tx = quantizationParameters.extent.xmin;
  const ty = quantizationParameters.extent.ymax;
  const s = quantizationParameters.tolerance;

  return {
    x: Math.floor((geometry.x - tx) / s),
    y: Math.floor((ty - geometry.y) / s)
  };
}

function quantizePolygon(geometry: Polygon, quantizationParameters: QuantizationParameters, statistics: QuantizationStatistics): Polygon | null {
  const rings: number[][][] = [];
  const tx = quantizationParameters.extent.xmin;
  const ty = quantizationParameters.extent.ymax;
  const s = quantizationParameters.tolerance;

  for (const ring of geometry.rings) {
    const newRing: number[][] = [];

    statistics.inputVertexCount += ring.length;

    newRing[0] = [
      Math.floor((ring[0][0] - tx) / s),
      Math.floor((ty - ring[0][1]) / s)
    ];
    let iNewRing = 1;

    let [prevX, prevY] = newRing[0];
    let delta: number[] = null;

    for (var i = 1, n = ring.length; i < n; i++) {
      const x = Math.round((ring[i][0] - tx) / s);
      const y = Math.round((ty - ring[i][1]) / s);

      if (x !== prevX || y !== prevY) {
        const dx = x - prevX;
        const dy = y - prevY;

        if (quantizationParameters.removeCollinearVertices && delta && ((delta[0] === 0 && dx === 0) || (delta[1] === 0 && dy === 0))) {
          delta[0] += dx;
          delta[1] += dy;
          statistics.collinearVertextCount++;
        }
        else {
          delta = [dx, dy];
          newRing[iNewRing] = delta;
          iNewRing++;
        }

        prevX = x;
        prevY = y;
      }
    }

    if (newRing.length >= 3) {
      rings.push(newRing);
      statistics.outputVertexCount += newRing.length;
    }
  }

  if (rings.length > 0) {
    return {
      rings: rings
    };
  }
  else {
    return null;
  }
}


export function cleanup(featureSet: FeatureSet): Task<QuantizationResult> {
  return new Task<QuantizationResult>(resolve => {
    const statistics: QuantizationStatistics = {
      inputFeatureCount: featureSet.features.length,
      outputFeatureCount: 0,
      inputVertexCount: 0,
      outputVertexCount: 0,
      collinearVertextCount: 0,
      time: 0
    };

    const now = Date.now();

    const results: QuantizationResult = {
      featureSet: null,
      statistics
    };

    switch (featureSet.geometryType) {
      case "esriGeometryPolygon":
        results.featureSet = cleanupPolygonFeatureSet(featureSet, statistics);
        break;
      default:
        results.featureSet = featureSet;
        break;
    }

    statistics.outputFeatureCount = results.featureSet.features.length;
    statistics.time = Date.now() - now;

    resolve(results);
  });
}

function cleanupPolygonFeatureSet(featureSet: PolygonFeatureSet, statistics: QuantizationStatistics): PolygonFeatureSet {
  const output: PolygonFeatureSet = {
    geometryType: "esriGeometryPolygon",
    features: [],
    transform: { ...featureSet.transform }
  };

  for (const feature of featureSet.features) {
    const clean = cleanupPolygon(feature.geometry, statistics);

    if (clean) {
      output.features.push({
        geometry: clean
      });
    }
  }

  return output;
}


function cleanupPolygon(geometry: Polygon, statistics: QuantizationStatistics): Polygon | null {
  const rings: number[][][] = [];

  for (const ring of geometry.rings) {
    const newRing: number[][] = [];

    statistics.inputVertexCount += ring.length;

    newRing[0] = [
      ring[0][0],
      ring[0][1]
    ];
    let iNewRing = 1;

    let delta: number[] = null;

    for (var i = 1, n = ring.length; i < n; i++) {
      const dx = ring[i][0];
      const dy = ring[i][1];

      if (delta && ((delta[0] === 0 && dx === 0) || (delta[1] === 0 && dy === 0))) {
        delta[0] += dx;
        delta[1] += dy;
        statistics.collinearVertextCount++;
      }
      else {
        delta = [dx, dy];
        newRing[iNewRing] = delta;
        iNewRing++;
      }
    }

    if (newRing.length >= 3) {
      rings.push(newRing);
      statistics.outputVertexCount += newRing.length;
    }
  }

  if (rings.length > 0) {
    return {
      rings: rings
    };
  }
  else {
    return null;
  }
}
