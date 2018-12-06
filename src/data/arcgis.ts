export interface Extent {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface Polygon {
  rings: number[][][];
}
export interface Polyline {
  paths: number[][][];
}
export interface Point {
  x: number;
  y: number;
}

export type Geometry = Extent | Polygon | Polyline;

export interface Feature<G = Geometry> {
  geometry: G;
}

interface FeatureSetBase {
  transform?: {
    originPosition: "upperLeft";
    scale: [number, number];
    translate: [number, number];
  };
}

export interface PointFeatureSet extends FeatureSetBase {
  geometryType: "esriGeometryPoint";
  features: Feature<Point>[];
}

export interface PolygonFeatureSet extends FeatureSetBase {
  geometryType: "esriGeometryPolygon";
  features: Feature<Polygon>[];
}

export interface PolylineFeatureSet extends FeatureSetBase {
  geometryType: "esriGeometryPolyline";
  features: Feature<Polyline>[];
}

export type FeatureSet = PointFeatureSet | PolygonFeatureSet | PolylineFeatureSet;