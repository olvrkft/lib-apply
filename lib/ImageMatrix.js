
const WORD = 4;

/**
 * Wrapper around ImageData object to grant easy access.
 */
class ImageMatrix
{
  /**
   * Constructor.
   * @param  {ImageData} imageData ImageData object to be wrapped.
   */
  constructor(imageData)
  {
    if (! (imageData instanceof ImageData)) {
      throw new Error("[ImageMatrix] First argument must be an instance of ImageData");
    }

    this.imageData = imageData;
    this.data      = this.imageData.data;
  }

  /**
   * Word width for a pixel in the Uint8ClampedArray.
   */
  static WORD() {
    return WORD;
  }

  /**
   * Getter for the image width.
   * @return {Number} Width of the image.
   */
  get width() {
    return this.imageData.width;
  }

  /**
   * Getter for the image height.
   * @return {Number} Height of the image.
   */
  get height() {
    return this.imageData.height;
  }

  /**
   * Get an 32bit integer for
   * @param  {Number} x x-coords of the pixel.
   * @param  {Number} y y-coords of the pixel.
   * @return {Number}   32bit color.
   */
  get(x, y)
  {
   let i;

   if (x > this.width - 1 || y > this.height - 1) {
     throw new Error("[ImageMatrix] Coords out of image dimensions.");
   }

   i = x * WORD + y * this.width * WORD;

   return ( (this.data[i] * (1 << 24)) + // R
            (this.data[i + 1] << 16) +   // G
            (this.data[i + 2] <<  8) +   // B
            (this.data[i + 3] <<  0) );  // A
  }

  /**
   * Getter for specified coordinates in the Uint8ClampedArray.
   * @param  {Number} x [description]
   * @param  {Number} y [description]
   * @return {Number} [description]
   */
  getArray(x, y)
  {
    let i;

    if (x > this.width - 1 || y > this.height - 1) {
      throw new Error("[ImageMatrix] Coords out of image dimensions.");
    }

    i = x * WORD + y * this.width * WORD;

   	return [ this.data[i],
             this.data[i + 1],
             this.data[i + 2],
             this.data[i + 3] ];
  }

  /**
   * Setter for specified coordingates int the Uint8ClampedArray.
   *  If r,g and b are set they are interpreted as 8bit values and set. If only
   *  r is set r is interpreted as 32bit value, containing r,g,b,a informations.
   * @param {Number} x X coordingate.
   * @param {Number} y Y coordingate.
   * @param {Number} r 8-Bit color value or 32-Bit value.
   * @param {Number} g 8-Bit color value.
   * @param {Number} b 8-Bit color value.
   * @param {Number} [a=255] [description]
   */
  set(x, y, r, g, b, a = 255)
  {
    let i = x * WORD + y * this.width * WORD;

    if (undefined === g && undefined === b)
    {
     this.data[i]     = r >>> 24 & 0xFF;
     this.data[i + 1] = r >>> 16 & 0xFF;
     this.data[i + 2] = r >>>  8 & 0xFF;
     this.data[i + 3] = r >>>  0 & 0xFF;
    }
    else {
      this.data[i]     = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = a;
    }
  }

  /**
   * Get x value for a specified data index.
   * @param  {Number} n Data index.
   * @return {Number} Corresponding x-coord for a data index.
   */
  x(n) {
    return Math.floor( (n % this.width) / WORD );
  }

  /**
   * Get y
   * @param  {Number} n Data index.
   * @return {Number}   Corresponding y-coord for a data index.
   */
  y(n) {
    return Math.floor( n / (this.width * WORD) );
  }
}

// -----------------------------------------------------------------------------
//
module.exports = ImageMatrix;
