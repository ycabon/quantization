
import { query } from "./data/model";
import { quantizer } from "./controls/quantizer";

const ungeneralize = query();
const items = document.querySelectorAll(".quantizer");

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const isClientSide = item.getAttribute("data-mode") === "client";
  const scale = parseInt(item.getAttribute("data-scale"));
  const removeCollinearVertices = item.getAttribute("data-remove-collinear-vertices") === "true";
  const q = quantizer(item);

  const promise = (isClientSide || scale == null) ? ungeneralize : query(scale);

  promise.then(model => {
    q.setProperties({
      ...model,
      scale,
      removeCollinearVertices,
      isClientSide
    });
  })
  .catch(error => {
    console.error(error);
  });
}