import { FeatureSet, PolygonFeatureSet } from "../../data/arcgis";

export interface Options {
  scale: number;
  fill: boolean;
  stroke: boolean;
}

export default function draw(context: CanvasRenderingContext2D, featureSet: FeatureSet, options: Options): void {
  switch (featureSet.geometryType) {
    case "esriGeometryPolygon":
      drawPolygons(context, featureSet, options);
      break;
    default:
      return;
  }
}

function drawPolygons(context: CanvasRenderingContext2D, featureSet: PolygonFeatureSet, options: Options): void {
  const {features} = featureSet;
  const {scale} = options;

  for (const { geometry } of features) {
    context.beginPath();

    for (const ring of geometry.rings) {
      let [x, y] = ring[0];

      x *= scale;
      y *= scale;

      context.moveTo(x, y);

      for (let i = 1; i < ring.length; i++) {
        x += ring[i][0] * scale;
        y += ring[i][1] * scale;

        context.lineTo(x, y);
      }
    }

    if (options.stroke) {
      context.stroke();
    }

    if (options.fill) {
      context.fill();
    }
  }
}
