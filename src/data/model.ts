import xhr from "@dojo/core/request/providers/xhr";
import { FeatureSet, Extent } from "./arcgis";

interface Model {
  extent: Extent;
  featureSet: FeatureSet;
}

function getUrlParams(search: string): { [key: string]: string } {
  let hashes = search.slice(search.indexOf('?') + 1).split('&');
  let params: { [key: string]: string } = {};

  hashes.map((hash) => {
    let [key, val] = hash.split('=');
    params[key] = decodeURIComponent(val);
  })

  return params;
}

const {
  serviceUrl = "https://services.arcgis.com/BG6nSlhZSAWtExvp/arcgis/rest/services/EnergyUse_countries/FeatureServer/0"
} = getUrlParams(window.location.search);

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

  return xhr(serviceUrl + "/query", {
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
    if (quantizationParameters.quantizationParameters && !featureSet.transform) {
      throw new Error("invalid server-side quantization - missing tranform");
    }

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
