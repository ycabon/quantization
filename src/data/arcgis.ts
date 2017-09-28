export interface Extent {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface Polygon {
  rings: number[][][];
}

export type Geometry = Polygon | Extent;

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

export interface PolygonFeatureSet extends FeatureSetBase {
  geometryType: "esriGeometryPolygon";
  features: Feature<Polygon>[];
}

export type FeatureSet = PolygonFeatureSet;