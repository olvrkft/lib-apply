
# lib-apply

Die Bibliothek enthält einige Codebeispiele aus meinen Projekten. Hier sind nicht die gesamten Projekte zu sehen, sondern nur einige beispielhafte Ausschnitte, die Bewerbungszwecken dienen. 

Der Ordner `/example` enthält Beispiele, die am besten im Firefox oder Chrome funktionieren. Der Code wurde ursprünglich entwickelt, um im [node.js](https://nodejs.org/)- und im [electron](https://electronjs.org/)-Framework zu laufen und ist hier in leicht angepasster Form zu finden.

In `/lib`  sind die implementierten Klassen und Algorithmen, die grundsätzlich dem objektorientierten Paradigma folgen.

`/src` enthält den Quellcode, der für das Erstellen der Bundles mit [webpack](https://webpack.js.org/) und das Funktionieren der Beispiele nötig ist.

# Die Beispiele

Im Moment sind hier zwei Beispiele zu finden. Im Folgenden wird nur kurz der zentrale Punkt eines jeden Projekts dargestellt. Etwas mehr Informationen und ein dynamisches Beispiel befindet sich im `/example`-Ordner, nicht zuletzt steht der eigentliche Quellcode in `/lib` zur Verfügung.

## QuadTree

Der Trick im QuadTree ist die Verwendung von Integer Dilation (Schrack 1992). Dabei wird in der Binärdarstellung einer Zahl vor jedem Bit eine Null eingefügt, so dass es möglich ist in die leeren Stellen des "geweitete" Integer eine zweite Zahl zu schreiben. Mit einer logischen Formel und relativen Positionsangaben (bspw. (0,0) für eine Position selber oder (0,1) für den südlichen Nachbarn) kann die jeweilige 8-Feld-Nachbarschaft (Moore-Nachbarschaft) berechnet werden.

Die Funktion mit der Formel ist in `/lib/QDilate.js` zu finden:
```javascript
addLocations(nq, dnq)
  {
    let TX = this.TX
      , TY = this.TY;

    return (((nq|TY) + (dnq & TX)) & TX) | (((nq|TX) + (dnq & TY)) & TY);
  }
```
Mit dieser Herangehensweise ist es möglich, die Nachbarn eines Knotens in einem QuadTree in O(1) zu berechnen, obwohl der Knoten und seine Nachbarknoten unterschiedliche Eltern haben.

## Fast Contour-Tracing

Das Umwandeln einer Kontur aus einem Pixelbild in einen Pfad ist immer mal nötig. Hier wird es am Beispiel der Berechnung von Höhenlinien dargestellt, welches auf den Algorithmus von Seo et al. (2016) zurückgreift. Kernstück bei diesem Algorithmus ist, dass die Autoren das Abfahren der Kontur Pixel für Pixel auf insgesamt zwei Zustände und acht Fälle begrenzt haben.

Der Kernalgorithmus ist in `/lib/FastContourTracer.js` zu finden:
```javascript
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
```
## Literatur
Natürlich habe ich die Algorithmen nicht alle selber entwickelt.  Hier ist noch die Liste mit der verwendeten und weiterführenden Literatur zu finden:

### Algorithmen
+ Birdal, T., & Bala, E. (2014). A Novel Method for Vectorization. arXiv preprint arXiv:1403.0728.
+ Schrack, G. (1992). Finding neighbors of equal size in linear quadtrees and octrees in constant time. DOI: 10.1016/1049-9660(92)90022-U.
+ Seo, J., Chae, S., Shim, J., Kim, D., Cheong, C., & Han, T. D. (2016). Fast contour-tracing algorithm based on a pixel-following method for image sensors. Sensors, 16(3), 353.

### weiterführende Literatur
+ Aizawa, K., Motomura, K., Kimura, S., Kadowaki, R., & Fan, J. (2008, March). Constant time neighbor finding in quadtrees: An experimental result. In Communications, Control and Signal Processing, 2008. ISCCSP 2008. 3rd International Symposium on (pp. 505-510). IEEE.
+ Aizawa, K., & Tanaka, S. (2009). A constant-time algorithm for finding neighbors in quadtrees. IEEE transactions on pattern analysis and machine intelligence, 31(7), 1178-1183.

