
import QuadTree from '../lib/QuadTree.js';

/**
 *
 *
 */
class RegionQuadTree extends QuadTree
{
  constructor(x, y, width, height, depth, number = 1)
  {
    let maxDepth = Number.MAX_SAFE_INTEGER.toString().length;

    super(x, y, width, height, depth);

    if (depth > maxDepth) {
      throw new Error("[RegionQuadTree] Unsupported depth. " +
                      "Maximum supported depth is " + maxDepth + ".");
    }

    // Set numeric identifier for this tree.
    this.number = number;

    if (0 < this.depth)
    {
      // Create new branches:
      this.nw = new RegionQuadTree(this.x1, this.y1, this.widthHalf, this.heightHalf,
                                   this.depth - 1, this.number * 10 + 1);

      this.ne = new RegionQuadTree(this.x1 + this.widthHalf, this.y1, this.widthHalf, this.heightHalf,
                                   this.depth - 1, this.number * 10 + 2);

      this.se = new RegionQuadTree(this.x1 + this.widthHalf, this.y1 + this.heightHalf, this.widthHalf, this.heightHalf,
                                   this.depth - 1, this.number * 10 + 3);

      this.sw = new RegionQuadTree(this.x1, this.y1 + this.heightHalf, this.widthHalf, this.heightHalf,
                                   this.depth - 1, this.number * 10 + 4);
    }
  }

  /**
   * Get all leafs of a tree.
   * @param  {Array} array Array that will be filled width leafs.
   * @return {Array} An array of leafs.
   */
  getLeafs(array)
  {
    if ( ! array) {
      array = new Array();
    }

    if (null !== this.nw)
    {
      this.nw.getLeafs(array);
      this.ne.getLeafs(array);
      this.se.getLeafs(array);
      this.sw.getLeafs(array);
    }
    else {
      array.push(this);
    }

    return array;
  }
}

// -----------------------------------------------------------------------------

export default RegionQuadTree;
