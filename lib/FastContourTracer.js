"use strict";

import ImageMatrix from '../lib/ImageMatrix.js';

const SAME      = 0;
const FRONT     = 1;
const FRONTLEFT = 2;
const LEFT      = 3;
const LEFTREAR  = 4;

const END_NOT          = 0;
const END_REACHEDSTART = 1;
const END_IDLE         = 2;

const TRACED = 0x0000CCFF;

/**
 * Objects grants access to the neighbour pixels depending to the tracers
 *  current direction.
 *
 * Direction to position translation table:
 * -----------
 * | N3 | N4 | N3: front-left, N4: front
 * -----------
 * | N2 | N0 | N2: left, N0: tracer-position
 * -----------
 * | N1 |    | N1: rear-left
 * -----------
 * (northern direction)
 *
 * @see "Fast Contour-Tracing Algorithm Based on a Pixel-Following Method for
 *       Image Sensors" (Seo ETAL, 11, 2016)
 */
let DIRECTION = {
  0:  { N1: {x:-1,y: 1}, N2: {x:-1,y: 0}, N3: {x:-1,y:-1}, N4: {x: 0,y:-1} }, // N
  1:  { N1: {x:-1,y:-1}, N2: {x: 0,y:-1}, N3: {x: 1,y:-1}, N4: {x: 1,y: 0} }, // E
  2:  { N1: {x: 1,y:-1}, N2: {x: 1,y: 0}, N3: {x: 1,y: 1}, N4: {x: 0,y: 1} }, // S
  3:  { N1: {x: 1,y: 1}, N2: {x: 0,y: 1}, N3: {x:-1,y: 1}, N4: {x:-1,y: 0} }  // W
}

/**
 *
 */
class FastContourTracer
{
  /**
   * Constructor
   * @param  {ImageMatrix,ImageData} data  [description]
   * @param  {Number} tracingColor [description]
   */
  constructor(data, tracingColor)
  {
    let size   = null
      , matrix = null;

    // Create a copy of clampedArray, since tracer manipulates data.
    if (data instanceof ImageData)
    {
      matrix = new ImageMatrix(data.data);
    }
    else if (data instanceof ImageMatrix)
    {
      matrix = new ImageMatrix( new ImageData(data.imageData.data.slice(0),
                                              data.imageData.width,
                                              data.imageData.height) );
    }
    else {
      throw new Error("[ImageMatrix] First argument must be an instance of ImageData");
    }

    this.i            = 0;
    this.d            = 1;               // key for the current DIRECTION
    this.idle         = 0;               // Count idle iterations.
    this.end          = END_NOT;         // State of the end condition.
    this.start        = {'x': 0, 'y': 0};
    this.position     = {'x': 0, 'y': 0};
    this.imageMatrix  = matrix;
    this.tracingColor = tracingColor;
  }

  /**
   * Create paths.
   * @return {Array} Array containing arrays of numbers.
   */
  createPaths()
  {
    let path
      , start
      , paths = [];

    while (null !== (start = this.nextStart())) {
      paths.push( this.createPath(start) );
    }

    return paths;
  }

  /**
   * Get the next starting point for the tracing algorithm.
   * @return {Object} Return an object containing the starting position ({x,y}).
   */
  nextStart()
  {
    let c
      , x
      , y = this.start.y
      , position = null
      , matrix   = this.imageMatrix;

    // Looking direction is always 1 (east).
    this.d = 1;

    for ( ; y < matrix.height - 1; ++y) {
      for (x = 0; x < matrix.width - 1; ++x)
      {
        c = matrix.get(x, y);
        if (c === this.tracingColor) {
          if (this.tracingColor !== this.leftRearValue) // check if neighbours are not left-rear inner-outer colored
          {
            position = {"x": x, "y": y};
            break;
          }
        }
      }

      // Do not iterate, if a starting position is reached.
      if (null !== position)
      {
        this.start.x = position.x;
        this.start.y = position.y;
        break;
      }
    }

    return position;
  }

  /**
   *
   */
  createPath(start)
  {
    let result = {'path': null, 'closed': true}
      , path   = [];

    // Reset i and end condition.
    this.i    = 0;
    this.idle = 0;
    this.end  = END_NOT;

    // Set current position to starting position.
    this.position.x = start.x;
    this.position.y = start.y;

    do
    {
      // Stage 1
      if (this.leftRearValue === this.tracingColor) {
        if (this.leftValue === this.tracingColor) {
          // Case 1
          // T(P,d) <- T(P_left, d_left) and code(i) <- "inner"
          // T(P,d) <- T(P_left, d_left)
          //console.log('(C1) inner');
          this.update(LEFT, this.leftDirection, path);
          this.update(LEFT, this.leftDirection, path);
        } else {
          // Case 2
          // code(i) <- "inner-outer"
          // T(P,d) <- T(P_left-rear, d_rear) and Code(i) <- "inner-outer"
          //console.log('(C2) inner-outer', this.d);
          this.update(LEFTREAR , this.rearDirection, path);
        }
      }
      else {
        if (this.leftValue === this.tracingColor) {
          // Case 3
          // T(P,d) <- T(P_left, d_left) and code(i) <- "straight"
          //console.log('(C3) straight');
          this.update(LEFT, this.leftDirection, path);
        } else {
          // Case 4
          // code(i) <- "outer"
          //console.log('(C4) outer');
          this.idle += 1;
        }
      }

      // Stage 2
      if (this.frontLeftValue === this.tracingColor) {
        if (this.frontValue === this.tracingColor) {
          // Case 6
          // T(P,d) <- T(P_front, d_left) and code(i) <- "inner"
          // T(P,d) <- T(P_front, d_right)
          //console.log('(C6) inner');
          this.update(FRONT, this.leftDirection, path);
          this.update(FRONT, this.rightDirection, path);
        } else {
          // Case 5
          // T(P,d) <- T(P_front-left, d) and code(i) <- "inner-outer"
          //console.log('(C5) inner-outer');
          this.update(FRONTLEFT, this.d, path);
        }
      }
      else if (this.frontValue === this.tracingColor) {
        // Case 7
        // T(P,d) <- T(P_front, d_right)
        //console.log('(C7) no code');
        this.update(FRONT, this.rightDirection, path);
      }
      else {
        // Case 8
        // T(P,d) <- T(P,d_rear) and i <- i - 1 and code(i) <- "outer"
        //console.log('(C8) outer :', this.d);
        this.update(SAME, this.rearDirection);
      }
    }
    while ( !(this.end = this.doStop(start)) );

    // Add last postion to the path, if end condition is idle ending.
    if (END_IDLE === this.end)
    {
      result.closed = false;

      path.push(this.position.x);
      path.push(this.position.y);

      // Set the starting position to traced to avoid endless iterations.
      this.imageMatrix.set(start.x, start.y, TRACED);
    }

    if (path.length < 3) {
      this.imageMatrix.set(this.position.x, this.position.y, 0xCC00CCFF);
    }

    result.path = path;

    return result;
  }

  /**
   * Update position (p) and direction (d). Positon altered to SAME, FRONT, LEFT
   *  and LEFTREAR.
   * @param  {const} p Constant indicating the moving direction.
   * @param  {Number} d New looking direction.
   * @param  {Array} path Array containing x- and y-coords.
   */
  update(p, d, path)
  {
    let move;

    // Get position malipulators.
    if (FRONT === p) {
      move = DIRECTION[this.d].N4;
    }
    else if (FRONTLEFT === p) {
      move = DIRECTION[this.d].N3;
    }
    else if (LEFT === p) {
      move = DIRECTION[this.d].N2;
    }
    else if (LEFTREAR === p) {
      move = DIRECTION[this.d].N1;
    }

    // Update position
    if (SAME === p)
    {
      this.i    -= 1;
      this.idle += 1;
    }
    else {
      this.idle = 0;

      path[this.i * 2]     = this.position.x;
      path[this.i * 2 + 1] = this.position.y;

      this.position.x += move.x;
      this.position.y += move.y;
    }

    // Set new direction after updating position.
    this.d = d;

    // Update iteration counter.
    this.i += 1;

    if (this.i > 0) {
      this.imageMatrix.set(this.position.x, this.position.y, TRACED);
    }
  }

  /**
   * Indicates to stop the algorithm if starting position is reached or if the
   *  if counter exceeds 2 idle iterations.
   * @param  {Object} start Contains starting position {x,y}.
   * @return {Boolean}      Indicates whether to stop or not.
   */
  doStop(start)
  {
    let result = END_NOT;

    // Check if starting position is reached.
    if (this.position.x === start.x &&
        this.position.y === start.y &&
        this.i > 1)
    {
      result = END_REACHEDSTART;
    }

    // Check if position did not change for more than 2 iterations.
    if (this.idle > 2) {
      result = END_IDLE;
    }

    return result;
  }

  /**
   * Get tracers current position RGBA value.
   * @return {Number} Number representing the 32-bit color of the pixel
   */
  get currentValue() {
    return this.imageMatrix.get(this.position.x, this.position.y);
  }

  /**
   * Get front RGBA value.
   * @return {Number} Number representing the 32-bit color of the pixel
   */
  get frontValue()
  {
    let x = this.position.x + this.direction.N4.x
      , y = this.position.y + this.direction.N4.y;

    return this.imageMatrix.get(x, y);
  }

  /**
   * Get front-left RGBA value.
   * @return {Number} Number representing the 32-bit color of the pixel
   */
  get frontLeftValue()
  {
    let x = this.position.x + this.direction.N3.x
      , y = this.position.y + this.direction.N3.y;

    return this.imageMatrix.get(x, y);
  }

  /**
   * Get left RGBA value.
   * @return {Number} Number representing the 32-bit color of the pixel
   */
  get leftValue()
  {
    let x = this.position.x + this.direction.N2.x
      , y = this.position.y + this.direction.N2.y;

    return this.imageMatrix.get(x, y);
  }

  /**
   * Get left-rear RGBA value.
   * @return {Number} Number representing the 32-bit color of the pixel
   */
  get leftRearValue()
  {
    let x = this.position.x + this.direction.N1.x
      , y = this.position.y + this.direction.N1.y;

    return this.imageMatrix.get(x, y);
  }

  /**
   * Current directional object with manipulators for N0...N4
   * @return {Object} Containing directional manipulator values.
   */
  get direction() {
    return DIRECTION[this.d];
  }

  /**
   * The current front directional key.
   * @return {Number} Number from [0...3].
   */
  get frontDirection() {
    return this.d;
  }

  /**
   * The current right directional key.
   * @return {Number} Number from [0...3].
   */
  get rightDirection() {
    return (this.d + 1) & 0b11;
  }

  /**
   * The current rear directional key.
   * @return {Number} Number from [0...3].
   */
  get rearDirection() {
    return (this.d + 2) & 0b11;
  }

  /**
   * The current left directional key.
   * @return {Number} Number from [0...3].
   */
  get leftDirection() {
    return (this.d - 1) & 0b11;
  }
}

// -----------------------------------------------------------------------------
//
export default FastContourTracer;
