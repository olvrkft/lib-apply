"use strict";

import QDilate from '../lib/QDilate.js';
import RegionQuadTree from '../lib/RegionQuadTree.js'

/**
 * QuadTree base Level of Detail Strategy.
 */
class QTLoDStrategy
{
  constructor(canvas, depth)
  {
    let i
      , leaf
      , imgdata = null
      , context = canvas.getContext("2d");

    let x, y;

    this.depth = depth;
    this.leafs = new Array();

    this.rqt = new RegionQuadTree(0, 0, canvas.width, canvas.height, depth);
    this.rqt.getLeafs(this.leafs);

    this.dilate = new QDilate(this.depth);

    for (i = 0; i < this.leafs.length; i += 1)
    {
      // Create levels of detail only for leafs:
      leaf = this.leafs[i];

      // QDilate stuff
      leaf.position = {
        'x': Math.round(leaf.x1 / leaf.width),
        'y': Math.round(leaf.y1 / leaf.height)
      };

      leaf.number = this.dilate.encode(leaf.position.x , leaf.position.y);
      imgdata     = context.getImageData(leaf.x1, leaf.y1, leaf.width, leaf.height);

      leaf.lodLevel = 2;
      leaf.lod = [
        this.createLoD(leaf, 0, imgdata.data), // create level 0
        this.createLoD(leaf, 1, imgdata.data), // create level 1
        this.createLoD(leaf, 2, imgdata.data)  // create level 2
      ];
    }
  }

  /**
   * Get number of RegionQuadTree nodes.
   * @return {int} Number of nodes in RegionQuadTree.
   */
  count()
  {
    return this.rqt.count();
  }

  /**
   * Create level of detail.
   * @param  {RegionQuadTree} RegionQuadTree.
   * @param  {int} level Level of detail to create.
   * @param  {Array} data Basic data to create the level from.
   * @return {Array} Representing level of detail data.
   */
  createLoD(rqt, level, data)
  {
    // TODO: check if image is multipe of 2
    let i, c, v
      , detail    = Math.pow(2, level)
      , oneTile   = detail * 4
      , lineWidth = rqt.width * 4
      , lod       = new ImageData( Math.round(rqt.width),
                                   Math.round(rqt.height) );

    // iterate through data by tile
    for (i = 0, c = 0; i < data.length; i += oneTile, c += oneTile)
    {
      if (detail > 1 && c >= lineWidth) {
        i += lineWidth;
        c = 0;
      }

      v = this.avgValue(rqt, data, i, detail);
      //console.log("i("+i+"), c("+c+") -> v("+v+")");

      this.writeData(rqt, lod.data, i, detail, v);
    }

    return lod;
  }

  /**
   * Write data.
   * @param  {[type]} rqt    [description]
   * @param  {[type]} data   [description]
   * @param  {[type]} s      [description]
   * @param  {[type]} detail [description]
   * @param  {[type]} v      [description]
   * @return {[type]}        [description]
   */
  writeData(rqt, data, s, detail, v)
  {
    let i, l
      , next = (rqt.width * 4) // next line
      , end  = s + next * detail; // last line in the data rect to write

    // iterate rows
    for (l = s; l < end; l += next)
    {
      // iterate columns
      for (i = 0; i < (detail * 4); i += 4)
      {
        if ((l + i) >= data.length) {
          //throw new Error("[RegionQuadTree] Data position exceeds array dimension.");
          break;
        }

        data[l + i]     = v;
        data[l + i + 1] = v;
        data[l + i + 2] = v;
        data[l + i + 3] = 255;
      }
    }
  }

  /**
   * [avgValue description]
   * @param  {[type]} rqt    [description]
   * @param  {[type]} data   [description]
   * @param  {[type]} s      [description]
   * @param  {[type]} detail [description]
   * @return {[type]}        [description]
   */
  avgValue(rqt, data, s, detail)
  {
    let l, i
      , count = 0
      , next  = (rqt.width * 4)
      , end   = s + next * detail
      , total = 0;

    // iterate rows
    for (l = s; l < end; l += next)
    {
      // iterate columns by tile
      for (i = 0; i < (detail * 4); i += 4)
      {
        if ((l + i) >= data.length) {
          //throw new Error("[RegionQuadTree] Data position exceeds array dimension.");
          break;
        }

        total += data[l + i];
        total += data[l + i + 1];
        total += data[l + i + 2];

        count += 3;
      }
    }

    return Math.round( total / count );
  }
}

// -----------------------------------------------------------------------------

export default QTLoDStrategy;
