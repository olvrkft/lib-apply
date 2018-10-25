"use strict";

/**
 * Some constants:
 *  MAX_SAFE_INTEGER: "11111111111111111111111111111111111111111111111111111" (#length: 53 bits)
 */

const W          = Number.MAX_SAFE_INTEGER.toString(2).length - 1;
const MAX_LENGTH = W / 2;

/**
 * QDilate
 */
class QDilate
{
  /**
   * Constructor
   * @param {Number} r Resolution of this dilated space.
   */
  constructor(r = 25, k = null)
  {
    let i, m, kb, lz, lo, end;

    if (r > 25) {
      throw new Error("[QDilate] Dimension out of bounds.");
    }

    if (null !== k && this.outOfBounds(k)) {
      throw new Error("[QDilate] k is out of range!");
    }

    // Set some static variables:
    lz = QDilate.W - (r + 1);
    lo = QDilate.W - (2 * r + 1);

    this.R             = r;
    this.LEADING_ZEROS = parseInt( "0".repeat(lo) + "1".repeat(QDilate.W - lo), 2);
    this.LEADING_ONES  = parseInt( "1".repeat(lz) + "0".repeat(QDilate.W - lz), 2);
    this.FLAG_NEGATIVE = parseInt( "1"+("00".repeat(r)), 2); // negative flag for this number
    this.NORMAL        = parseInt( "01".repeat(r + 1), 2); // gaps must be 0
    this.ANTI_NORMAL   = parseInt( "10".repeat(r + 1), 2); // gaps must be 1
    this.TS            = Math.pow(4, r);
    this.TX            = this.NORMAL;
    this.TY            = this.ANTI_NORMAL;

    this.args = {
      'r': r, // resolution
      'k': k  // number
    };

    this.k = this.expand(k);
  }

  /**
   * Dilate a number.
   * TODO: Fast expansion using binary operators. Has to be fixed for negative numbers.
   * @param  {Number} n Original number.
   * @param  {Number} r Dilated integer space.
   * @return {Number}   Dilated n.
   */
  static dilate(num = 0, r = 0)
  {
    throw new Error("[QDilate] Do not use this method until it is fixed for negative numbers!");

    let mask, n;
    let dilate = 0;

    for (mask = 1 << r, n = r; mask; mask >>= 1, --n)
    {
      if (num & mask) {
        dilate += 1 << (n * 2);
      }
    }

    return dilate;
  }

  /**
   * Encode two numbers.
   * @param  {Number} n1 [description]
   * @param  {Number} n2 [description]
   * @return {Number}    [description]
   */
  encode(n1, n2)
  {
    return this.expand(n1) | (this.expand(n2) << 1);
  }

  /**
   * Add two dilated integers.
   * @param {Number} d1 [description]
   * @param {Number} d2 [description]
   * @return {Number}
   */
  add(d1, d2)
  {
    return ((d1 | this.ANTI_NORMAL) + d2) & this.NORMAL;
  }

  /**
   * Subtract two dilated integers.
   * @param  {Number} s1 [description]
   * @param  {Number} s2 [description]
   * @return {Number}    [description]
   */
  sub(s1, s2)
  {
    return (s1 - s2) & this.NORMAL
  }

  /**
   * Expand a number k by transforming it into its string representation.
   * @param  {Number} k [description]
   * @return {Number}   [description]
   */
  expand(k)
  {
    let kb
      , end
      , i
      , m
      , exp = new Number(0);

      // convert number into its binary representation
      kb = (k >>> 0).toString(2);

      // set loop for negative and positive numbers
      if (k < 0) {
        end = kb.length - this.R;
      } else {
        end = 0;
      }

      // expand k; from right to left
      for (i = kb.length - 1, m = 0; i >= end; i -= 1, m += 2) {
        exp += Math.pow(2, m) * parseInt(kb[i], 10);
      }

      if (k < 0) {
        exp = exp + this.FLAG_NEGATIVE;
      }

      return exp;
  }

  /**
   * Contract
   * @param  {Number} n [description]
   * @return {Number}   [description]
   */
  contract(n)
  {
    let i
      , p
      , c
      , end
      , m     = (Number.isFinite(n)) ? n : this.k
      , power = Math.pow
      , r     = 0;

    // set parameter for negative values
    if (m > this.TS)
    {
      c   = m.toString(2);
      end = c.length - this.R * 2;
      r   = -parseInt(power(2, this.R)); // subtract least significant bit
    } else {
      c   = m.toString(2);
      end = 0;
    }

    // Read c from right to left
    for (i = c.length - 1, p = 0; i >= end; i -= 2, p += 1) {
      r += power(2, p) * parseInt(c[i], 2);
    }

    return r;
  }

  /**
   * Add location
   * @param {Number} nq  [description]
   * @param {Number} dnq [description]
   * @return {Number}
   */
  addLocations(nq, dnq)
  {
    let TX = this.TX
      , TY = this.TY;

    return (((nq|TY) + (dnq & TX)) & TX) | (((nq|TX) + (dnq & TY)) & TY);
  }

  /**
   * Check if n is out of bounds of this dilated integer.
   * @param  {Number} n [description]
   * @return {bool}   [description]
   */
  outOfBounds(n)
  {
    return n < this.TS ? false : true;
  }
}

// -----------------------------------------------------------------------------

export default QDilate;
