/******************************************************************************
 * Simple quad tree for spatial indexing.
 *
 * Spatial partition:
 *
 *  x1 width  x2
 *  ----------- y1
 *  | nw | ne |
 *  ----------- height
 *  | sw | se |
 *  ----------- y2
 *
 */

/**
 *
 *
 */
let QuadTree = function(x, y, width, height, depth)
{
  this.depth = depth || 0;

  this.width  = Math.round(width) || 0;
  this.height = Math.round(height) || 0;

  this.widthHalf  = Math.round(this.width / 2);
  this.heightHalf = Math.round(this.height / 2);

  if (1 > this.widthHalf || 1 > this.heightHalf) {
    throw new Error("[QuadTree] At least one dimension is lower than 1.");
  }

  this.x1 = Math.round(x) || 0; // upper left
  this.y1 = Math.round(y) || 0;

  this.x2 = this.x1 + this.width; // lower right
  this.y2 = this.y1 + this.height;

  this.value = null; // value placeholder

  this.ne = null; // subdivision placeholder
  this.se = null;
  this.sw = null;
  this.nw = null;
}

/**
 * Count child nodes.
 * @return {int} Number of child nodes in this tree.
 */
QuadTree.prototype.count = function()
{
  let result = 1;

  if (null !== this.nw) {
    result += this.nw.count();
    result += this.ne.count();
    result += this.se.count();
    result += this.sw.count();
  }

  return result;
}

/**
 * Checks if x and y are inside northeastern region.
 * @return {boolean} True if inside NE.
 */
QuadTree.prototype.inNE = function(x, y)
{
  //console.log(`NE ${x},${y} in d=${this.depth} (${this.x1},${this.y1}),(${this.x2},${this.y2})`);
  return (x >= (this.x1 + this.widthHalf) && x <= this.x2) && (y >= this.y1 && y <= (this.y2 - this.heightHalf));
}

/**
 * Checks if x and y are inside southeastern region.
 * @return {boolean} True if inside SE.
 */
QuadTree.prototype.inSE = function(x, y)
{
  //console.log(`SE ${x},${y} in d=${this.depth} (${this.x1},${this.y1}),(${this.x2},${this.y2})`);
  return (x >= (this.x1 + this.widthHalf) && x <= this.x2) && (y >= (this.y1 + this.heightHalf) && y <= this.y2);
}

/**
 * Checks if x and y are inside southwestern region.
 * @return {boolean} True if inside NE.
 */
QuadTree.prototype.inSW = function(x, y)
{
  //console.log(`SW ${x},${y} in d=${this.depth} (${this.x1},${this.y1}),(${this.x2},${this.y2})`);
  return (x >= this.x1 && x <= (this.x1 + this.widthHalf)) && (y >= (this.y2 - this.heightHalf) && y <= this.y2);
}

/**
 * Checks if x and y are inside northwestern region.
 * @return {boolean} True if inside NE.
 */
QuadTree.prototype.inNW = function(x, y)
{
  //console.log(`NW ${x},${y} in d=${this.depth} (${this.x1},${this.y1}),(${this.x2},${this.y2})`);
  return (x >= this.x1 && x <= (this.x1 + this.widthHalf)) && (y >= this.y1 && y <= (this.y2 - this.heightHalf));
}

/**
 * Check if a point is inside this region.
 * @param  {int} x X coords.
 * @param  {int} y Y coords.
 * @return {boolean}   True if coords are inside, otherwise false.
 */
QuadTree.prototype.containsPoint = function(x, y)
{
  return (x >= this.x1 && x <= this.x2) && (y >= this.y1 && y <= this.y2);
}

/**
 * Check wheather a box is fully inside this QuadTree or not.
 * @param  {int} x1 Upper left x position.
 * @param  {int} y1 Upper left y position.
 * @param  {int} w Width of the box.
 * @param  {int} h Height of the box.
 * @return {boolean}  True if the box is inside this QuadTree.
 */
QuadTree.prototype.containsBox = function(x1, y1, w, h)
{
  let x2 = x1 + w
    , y2 = y1 + h;

  // Only check diagonal of the box.
  return (x1 >= this.x1) && (y1 >= this.y1) &&
         (x2 <= this.x2) && (y2 <= this.y2);
}

/**
 * Get the leaf containing the point.
 * @param  {int} x X coords.
 * @param  {int} y Y coords.
 * @return {QuadTree}   Leaf containing the coords.
 */
QuadTree.prototype.queryPoint = function(x, y)
{
  let leaf = null;

  // Have we reached a leaf?
  if (null === this.nw)
  {
    leaf = this;
  }
  else {
    // Go deeper down ...
    if (this.inNW(x, y)) {
      leaf = this.nw.queryPoint(x, y);
    }
    else if (this.inNE(x, y)) {
      leaf = this.ne.queryPoint(x, y);
    }
    else if (this.inSE(x, y)) {
      leaf = this.se.queryPoint(x, y);
    }
    else if (this.inSW(x, y)) {
      leaf = this.sw.queryPoint(x, y);
    }
  }

  return leaf;
}

// -----------------------------------------------------------------------------

export default QuadTree;
