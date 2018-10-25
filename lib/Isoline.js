"use strict";

import ImageMatrix from '../lib/ImageMatrix.js';
import FastContourTracer from '../lib/FastContourTracer.js';

const BORDER_POINT   = 0xAA0000FF;
const JUNCTION_POINT = 0x0000CCFF;

/**
 * Trace regions of an image into its subpixel representation.
 * @param  {ImageMatrix} matrix [description]
 * @param  {ImageMatrix} subpixel  [description]
 * @param  {Number} threshold [description]
 * @see Tolga Birdal, Emrah Bala: "A Novel Method for Vectorization", 2014, https://arxiv.org/abs/1403.0728v1.
 */
let traceRegions = function(image, subpixel, threshold = 0)
{
  let x, y;
  let p0, p1;
  let I = image;
  let S = subpixel;
  let t = ( (threshold * (1 << 24)) + // R: Create a number that exceeds negative boundaries.
            (threshold << 16) +       // G
            (threshold <<  8) +       // B
            (threshold <<  0) );      // A

  for (y = 0; y < S.height - 1; ++y) {
    for (x = 0; x < S.width - 1; ++x)
    { // Calculate regional boundaries.
      if ( (1 === (x % 2) && 0 === (y % 2)) )                  // if (x is odd and y is even) and
      {                                                        //
        p0 = I.get((x + 1)/2, y/2);
        p1 = I.get((x - 1)/2, y/2);

        if ( p0 !== p1 && (p0 > t || p1 > t) )                 // if (I((x + 1)/2, y/2) !==
        {                                                      //     I((x - 1)/2, y/2)) )
          S.set(x, y, BORDER_POINT);                           //  S(x, y) = 1
        }                                                      //
      }                                                        // or
      if ( (0 === (x % 2) && 1 === (y % 2)) )                  // if (x is even and y is odd) and
      {                                                        //
        p0 = I.get(x/2, (y + 1)/2);
        p1 = I.get(x/2, (y - 1)/2);

        if ( p0 !== p1 && (p0 > t || p1 > t) )                 // if (I(x/2, (y + 1)/2) !==
        {                                                      //     I(x/2, (y - 1)/2) )
          S.set(x, y, BORDER_POINT);                           //  S(x, y) = 1
        }
      }
    }
  }

  // Fix missing boundary values and add junction points.
  for (y = 1; y < S.height - 1; y += 2) {
    for (x = 1; x < S.width - 1; x += 2)
    {
      if (S.get(x + 1, y) === BORDER_POINT && S.get(x - 1, y) === BORDER_POINT ||
          S.get(x, y + 1) === BORDER_POINT && S.get(x, y - 1) === BORDER_POINT)
      {
        if (S.get(x + 1, y) + S.get(x - 1, y) +
            S.get(x, y + 1) + S.get(x, y - 1) > BORDER_POINT * 2) // must be higher than 2 border points
        {
          //S.set(x, y, JUNCTION_POINT);
        } else {
          S.set(x, y, BORDER_POINT);
        }
      }
    }
  }
}

/**
 * Creats a black/white image for the tracer.
 * @param  {Image} image      Image object.
 * @param  {Number} threshold Threshold
 * @return {Image}            Manipulated image.
 */
let thresholdRegion = function(image, threshold)
{
  let x, y;
  let black = 0x000000FF, white = 0xFFFFFFFF;
  let I = image;
  let t = ( (threshold * (1 << 24)) + // R: Create a number that exceeds negative boundaries.
            (threshold << 16) +       // G
            (threshold <<  8) +       // B
            0xFF );      // A

  for (y = 0; y < I.height - 1; ++y) {
    for (x = 0; x < I.width - 1; ++x)
    {
      if (I.get(x, y) > t) {
        I.set(x, y, white);
      } else {
        I.set(x, y, black);
      }
    }
  }

  return image;
}

/**
 * Converts an image to isolines.
 */
class Isoline
{
  /**
   * Constructor.
   * @param  {Image} image Image to convert.
   */
  constructor(image)
  {
    console.log("[Isoline] Creating Isolines.");

    this.paths     = null;
    this.image     = null;
    this.imageData = null;
    this.canvas    = null;

    if (image) {
      this.fromImage(image);
    }
  }

  /**
   * Set the image to convert. Triggers conversion algorithms.
   */
  fromImage(imageElement, level = 128)
  {
    let context, image, subpixel;
    let tile = {
      'level': {},
      'width':  0,
      'height': 0
    };

    if (! (imageElement instanceof Image)) {
      throw new Error("[Isoline] Argument is not an Image.");
    }

    this.canvas = document.createElement('canvas');
    this.canvas.width  = imageElement.width;
    this.canvas.height = imageElement.height;

    context = this.canvas.getContext('2d');
    context.drawImage(imageElement, 0, 0);

    // Get image data.
    this.imageData = context.getImageData(0, 0, imageElement.width,
                                                imageElement.height);

    this.image = new ImageMatrix(this.imageData); // Image matrix of the original image.

    image    = this.image;
    image    = thresholdRegion(image, level);
    subpixel = this.toSubpixelMatrix(image);

    traceRegions(image, subpixel);
    this.paths = this.traceContours(subpixel);

    tile.width        = image.width;
    tile.height       = image.height;
    tile.level[level] = this.paths;

    this.S = subpixel;

    this.createCanvas(this.S.imageData);
  }

  /**
   * Stretch image data to get subpixels.
   * @param  {ImageData} imageData Original image data.
   * @return {ImageData}           Delated image data.
   */
  toSubpixelMatrix(matrix)
  {
    let i, j, k
      , data     = matrix.data
      , width    = matrix.width  * 2
      , height   = matrix.height * 2
      , subpixel = new ImageMatrix(new ImageData(width, height));

    for (i = 0; i < data.length; i += 4)
    {
      k = Math.floor(i / (matrix.width * 4)) * (width * 4); // row
      j = (i * 2); // column

      subpixel.data[k + j]     = data[i];
      subpixel.data[k + j + 1] = data[i + 1];
      subpixel.data[k + j + 2] = data[i + 2];
      subpixel.data[k + j + 3] = data[i + 3];
    }

    return subpixel;
  }

  /**
   * Create a subpixel image.
   * @param  {ImageData} data Image to create a subpixel representation from.
   * @return {Array}     Array containing a Uint32Arrays representing subpixel data.
   */
  convertTo32BitArray(imageData)
  {
    // Convert from Uint8ClampedArray to Array/Uint32Array.
    let i, j, k;
    let width  = imageData.width
      , height = imageData.height
      , data   = new Array( height );

    for (i = 0; i < data.length; ++i) {
      data[i] = new Uint32Array(width);
    }

    for (i = 0; i < height; ++i)
    {
      for (j = 0; j < width; ++j)
      {
        k = (i * 4 * (width - 1)) + (j * 4);

        // Create 32bit raw data array.
        data[i][j] = imageData.data[k]     << 24 |  // R
                     imageData.data[k + 1] << 16 |  // G
                     imageData.data[k + 2] <<  8 |  // B
                     imageData.data[k + 3] <<  0;   // A
      }
    }

    return data;
  }

  /**
   * Convert data into ImageData obejct.
   * @param  {Array} data [description]
   * @return {ImageData}  Data converted to an ImageData object.
   */
  dataToImageData(data, width, height)
  {
    let i, j, k;
    let clampedArray = new Uint8ClampedArray(width * height * 4);

    for (i = 0; i < height; ++i)
    {
      for (j = 0; j < width; ++j)
      {
        k = (i * 4 * (width - 1)) + (j * 4);

        clampedArray[k]     = data[i][j] >> 24 & 0x000000FF;
        clampedArray[k + 1] = data[i][j] >> 16 & 0x000000FF;
        clampedArray[k + 2] = data[i][j] >>  8 & 0x000000FF;
        clampedArray[k + 3] = data[i][j] >>  0 & 0x000000FF;
      }
    }

    return new ImageData(clampedArray, width, height);
  }

  /**
   * [subpixelToImageData description]
   * @return {ImageData} ImageData object containing image data from subpixels.
   */
  subpixelToImageData()
  {
    let i;
    let data   = this.subpixel;
    let width  = 2 * this.imageData.width  - 1;
    let height = 2 * this.imageData.height - 1;
    let clampedArray = new Uint8ClampedArray( width * height * 4 );

    for (i = 0; i < data.length; ++i)
    {
      clampedArray[i * 4]     = data[i] >> 24 & 0xFF;
      clampedArray[i * 4 + 1] = data[i] >> 16 & 0xFF;
      clampedArray[i * 4 + 2] = data[i] >>  8 & 0xFF;
      clampedArray[i * 4 + 3] = data[i] >>  0 & 0xFF;
    }

    this.imageData = new ImageData(clampedArray, width, height);
  }

  /**
   * Trace contours.
   * @param  {ImageMatrix} imageMatrix [description]
   * @return {Array}             [description]
   */
  traceContours(imageMatrix)
  {
    let tracer = new FastContourTracer(imageMatrix, BORDER_POINT);

    imageMatrix.imageData = tracer.imageMatrix.imageData; // HACK: display manipulated image matrix.

    return tracer.createPaths();
  }

  /**
   * Create a canvas displaying imageData.
   */
  createCanvas(imageData)
  {
    let context = this.canvas.getContext('2d');

    context.canvas.width  = imageData.width;
    context.canvas.height = imageData.height;
    context.canvas.imageSmoothingEnabled = false;
    context.canvas.setAttribute("style", "border: 1px solid black;");

    context.putImageData(imageData, 0, 0);
  }

  /**
   * Append element \w canvas displaying contour data.
   * @param  {HTMLElement} element [description]
   */
  toCanvas(canvas, scale = 1)
  {
    let i, j
      , cpx, cpy
      , path
      , context = canvas.getContext("2d");

    //canvas.width  = this.S.width * scale;
    //canvas.height = this.S.height * scale;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (i = 0; i < this.paths.length; ++i)
    {
      context.beginPath();
      path = this.paths[i].path;

      for (j = 0; j < path.length; j += 2)
      {
        if (0 === j) {
          context.moveTo(path[j] * scale, path[j + 1] * scale);
        } else {
          context.lineTo(path[j] * scale, path[j + 1] * scale);
        }
      }

      // Close path if path indicates to do so.
      if (true === this.paths[i].closed) {
        context.closePath();
      }

      context.stroke();
    }
  }
}

// -----------------------------------------------------------------------------
//
export default Isoline;
