import xhr from "@dojo/core/request/providers/xhr";
import { FeatureSet, Extent } from "./arcgis";

interface Model {
  extent: Extent;
  featureSet: FeatureSet;
}

export function query(scale?: number) {
  const extent = {
    xmin: -20037508.342787,
    ymin: -20037508.342780,
    xmax: 20037508.342780,
    ymax: 20037508.342787,
    spatialReference: {
      latestWkid: 3857,
      wkid: 102100
    }
  };
  const quantizationParameters = scale == null ? {} : {
    quantizationParameters: JSON.stringify({
      mode: "view",
      originPosition: "upperLeft",
      extent: extent,
      tolerance: (extent.xmax - extent.xmin) / 512 * scale
    })
  };

  return xhr("http://services.arcgis.com/BG6nSlhZSAWtExvp/arcgis/rest/services/EnergyUse_countries/FeatureServer/0/query", {
    query: {
      f: "json",
      where: "1=1",
      ...quantizationParameters,
      outSR: "102100",
      resultType: "tile",
      maxRecordCountFactor: "5"
    },
    includeRequestedWithHeader: false
  })
  .then(response => response.json<FeatureSet>())
  .then(featureSet => {
    return {
      featureSet,
      extent: {
        xmin: -20037508.342787,
        ymin: -20037508.342780,
        xmax: 20037508.342780,
        ymax: 20037508.342787
      }
    } as Model;
  })
}
