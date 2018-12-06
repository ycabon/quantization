import Promise from "@dojo/shim/Promise";
import { quantize, cleanup, QuantizationResult } from "../data/quantize";
import { FeatureSet, Extent } from "../data/arcgis";

import draw from "./support/draw";

export interface QuantizerProperties {
  featureSet: FeatureSet;
  extent: Extent;
  scale: number;
  removeCollinearVertices: boolean;
  isClientSide: boolean;
}

class Quantizer {

  constructor() {
    this.statistics.className = "statistics";
  }

  addTo(element: Element) {
    element.appendChild(this.canvas);
    element.appendChild(this.statistics);
  }

  statistics = document.createElement("div");

  canvas = document.createElement("canvas");

  context = this.canvas.getContext("2d");

  properties: QuantizerProperties;

  setProperties(props: Partial<QuantizerProperties>) {
    this.properties = { ...this.properties, ...props };
    this.render();
  }

  render(): void {
    const { extent, featureSet, scale, removeCollinearVertices, isClientSide } = this.properties;
    const canvas = this.canvas;
    const context = this.context;
    const size = canvas.clientWidth;

    let promise: Promise<QuantizationResult>;

    if (featureSet.transform) {
      if (removeCollinearVertices) {
        promise = cleanup(featureSet);
      }
      else if (featureSet.geometryType === "esriGeometryPolygon") {
        const vertexCount = featureSet.features.reduce((count, feature) => {
          return count + feature.geometry.rings.reduce((count, ring) => {
            return count + ring.length;
          }, 0);
        }, 0);

        promise = Promise.resolve<QuantizationResult>({
          statistics: {
            inputFeatureCount: featureSet.features.length,
            outputFeatureCount: featureSet.features.length,
            inputVertexCount: vertexCount,
            outputVertexCount: vertexCount,
            collinearVertextCount: 0,
            time: 0
          },
          featureSet
        });
      }
      else if (featureSet.geometryType === "esriGeometryPoint") {
        promise = Promise.resolve<QuantizationResult>({
          statistics: {
            inputFeatureCount: featureSet.features.length,
            outputFeatureCount: featureSet.features.length,
            inputVertexCount: NaN,
            outputVertexCount: NaN,
            collinearVertextCount: 0,
            time: 0
          },
          featureSet
        });
      }
    }
    else {
      promise = quantize(featureSet, {
        extent: { ...extent },
        tolerance: (extent.xmax - extent.xmin) / size * scale,
        removeCollinearVertices
      })
    }

    promise.then(results => {
      const { featureSet, statistics } = results;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      if (featureSet.geometryType === "esriGeometryPoint") {
        context.fillStyle = "black";
      }
      else {
        context.fillStyle = "rgb(245,245,245)";
      }
      context.lineWidth = 1;

      draw(context, featureSet, {
        scale: scale,
        fill: true,
        stroke: true
      });


      this.statistics.innerHTML = `
      <div><span class="title">
        <span class="value mode">${ isClientSide ? "CLIENT" : "SERVER"}</span> - Quantization: <span class="value">${scale}px</span>, remove collinar: <span class="value">${removeCollinearVertices}</span></span></div>
      <hr />
      <div><span class="label">input features: </span><span class="value">${statistics.inputFeatureCount}</span></div>
      <div><span class="label">output features: </span><span class="value">${statistics.outputFeatureCount}</span></div>
      <div><span class="label">input vertices: </span><span class="value">${isNaN(statistics.inputVertexCount) ? "N/A" : statistics.inputVertexCount}</span></div>
      <div><span class="label">output vertices: </span><span class="value">${isNaN(statistics.outputVertexCount) ? "N/A" : statistics.outputVertexCount}</span></div>
      <div><span class="label">collinear vertices removed: </span><span class="value">${ removeCollinearVertices ? statistics.collinearVertextCount : "-"}</span></div>
      <div><span class="label">percent removed: </span><span class="value">${Math.round(100 - statistics.outputVertexCount / statistics.inputVertexCount * 100)}%</span></div>
      <div><span class="label">time: </span><span class="value">${statistics.time}ms</span></div>
      `
    });
  }
}

export function quantizer(node: Element): Quantizer {
  const q = new Quantizer();
  q.addTo(node);
  return q;
}
