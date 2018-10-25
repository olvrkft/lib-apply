
import Isoline from '../lib/Isoline.js';

// Handle change events
let eventHander = function(event)
{
  let no        = parseInt(this.dataset.example)
    , threshold = parseInt(document.getElementById('threshold' + no).value)
    , image     = document.getElementById('image' + no)
    , canvas    = document.getElementById('canvas' + no);

  if ( ! Number.isFinite(threshold)) {
    throw new Error("No threshold found!");
  }

  if ( ! canvas) {
    throw new Error("No canvas found!");
  }

  contour(threshold, image, canvas);
}

// Create isoline
let contour = function(threshold = 128, image = null, canvas = null)
{
  console.log("Isolinie mit Schwellwert: " + threshold + ".");

  let iso  = new Isoline();

  iso.fromImage(image, threshold);
  iso.toCanvas(canvas, 2);
}

window.addEventListener('load', (event) => {

  let img1, input1;

  // IE detection:
  if (detectedID > 0) {
    $('div.alert-ie').css('display','inline-block');
  }

  img1 = document.getElementById('image1');
  img1.addEventListener('load', eventHander.bind(img1));
  //img1.src = "./original.png"
  // HACK to prevent corss origin problems:
  img1.src = "data:image/png;base64,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";

  input1 = document.getElementById('threshold1');
  input1.addEventListener('change', eventHander.bind(img1));
});
