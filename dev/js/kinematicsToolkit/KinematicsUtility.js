export class KinematicsUtility {

     
    static nearestPointOnLine(linePnt, lineDir, pnt)
    {
        lineDir.normalize();//this needs to be a unit vector
        var v = Communicator.Point3.subtract(pnt,linePnt);
        var d = Communicator.Point3.dot(v, lineDir);
        var pol =  Communicator.Point3.add(linePnt,Communicator.Point3.scale(lineDir,d))
        var delta = Communicator.Point3.subtract(pol,pnt);
        return pol;
    }


    static closestPointOnPlane(plane, point) {
        
        let distance = Communicator.Point3.dot(plane.normal, point) + plane.d;      
        return Communicator.Point3.subtract(point,new Communicator.Point3(distance * plane.normal.x, distance * plane.normal.y, distance * plane.normal.z));
    }

    static signedAngle(Va,Vb, Vn)
    {
        return Math.atan2(Communicator.Point3.dot(Communicator.Point3.cross(Va,Vb), Vn), Communicator.Point3.dot(Va, Vb)) * (180/Math.PI);
    }

    static ComputeVectorToVectorRotationMatrix(p1, p2) {
        var outmatrix;
        const EPSILON = 0.0000001;
        p1.normalize();
        p2.normalize();
        let p3 = Communicator.Point3.cross(p1, p2);

        let dprod = Communicator.Point3.dot(p1, p2);
        let l = p3.length();

        // Construct a perpendicular vector for anti-parallel case
        if (l > -EPSILON && l < EPSILON) {
            if (dprod < 0) {
                if (p1.x < -EPSILON || p1.x > EPSILON) {
                    p3.x = p1.y;
                    p3.y = -p1.x;
                    p3.z = 0;
                } else if (p1.y < -EPSILON || p1.y > EPSILON) {
                    p3.x = -p1.y;
                    p3.y = p1.x;
                    p3.z = 0;
                } else if (p1.z < -EPSILON || p1.z > EPSILON) {
                    p3.x = -p1.z;
                    p3.z = p1.x;
                    p3.y = 0;
                } else {
                    return new Communicator.Matrix();
                }
            } else {
                return new Communicator.Matrix();
            }
        }
        
        var ang = Math.atan2(l, dprod);
        ang *= (180 / Math.PI);

        return Communicator.Matrix.createFromOffAxisRotation(p3, ang);
    }      
    static generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    
    static computeOffaxisRotationMatrix(center,axis, angle)
    {
        let offaxismatrix = new Communicator.Matrix();
        let transmatrix = new Communicator.Matrix();

        transmatrix = new Communicator.Matrix();
        transmatrix.setTranslationComponent(-center.x, -center.y, -center.z);

        let invtransmatrix = new Communicator.Matrix();
        invtransmatrix.setTranslationComponent(center.x,center.y, center.z);

        Communicator.Util.computeOffaxisRotation(axis, angle, offaxismatrix);

        let result = Communicator.Matrix.multiply(transmatrix, offaxismatrix);
        
        return (Communicator.Matrix.multiply(result, invtransmatrix));

    }

    static circleIntersection(x0, y0, r0, x1, y1, r1) {
        let a, dx, dy, d, h, rx, ry;
        let x2, y2;

        dx = x1 - x0;
        dy = y1 - y0;

       
        d = Math.sqrt((dy*dy) + (dx*dx));
   
        if (d > (r0 + r1)) {
            return false;
        }
        if (d < Math.abs(r0 - r1)) {
            return false;
        }


        a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

        x2 = x0 + (dx * a/d);
        y2 = y0 + (dy * a/d);

        h = Math.sqrt((r0*r0) - (a*a));

        rx = -dy * (h/d);
        ry = dx * (h/d);

        let xi = x2 + rx;
        let xi_prime = x2 - rx;
        let yi = y2 + ry;
        let yi_prime = y2 - ry;
        return { p1: new Communicator.Point3(xi, yi, 0), p2: new Communicator.Point3(xi_prime, yi_prime, 0) };
    }


    // Constructor of the coordinates of the intersection points of a line and a circle:
    static circleLineIntersection(r,xm,ym,x1,y1,x2,y2) {
        let x_1 = null;	// x coordinate of first intersection point.
        let y_1 = null;	// y coordinate of first intersection point.
        let x_2 = null;	// x coordinate of second intersection point.
        let y_2 = null;	// y coordinate of second intersection point.

        let a = y1 - y2;
        let b = x2 - x1;
        let c = x1 * y2 - y1 * x2;

        if (b == 0) {	// The line is a vertical line
            let B = -2 * ym,
                C = xm * xm + ym * ym + 2 * xm * c / a + c * c / (a * a) - r * r;
            let D = B * B - 4 * C;
            if (D < 0) { return; }	// if no intersections, bail out
            x_1 = -c / a;
            y_1 = (-B + Math.sqrt(D)) / 2;
            if (D > 0) { 	 // if ( D == 0 ) line is tangent to circle; only one touch point, ie. x2 = x1 and y2 = y1.
                x_2 = x_1;
                y_2 = (-B - Math.sqrt(D)) / 2;
            }
        } else {
            let A = (a * a / (b * b)) + 1,
                B = 2 * (a * c / (b * b) - xm + a * ym / b),
                C = xm * xm + ym * ym + 2 * ym * c / b + c * c / (b * b) - r * r;
            let D = B * B - 4 * A * C;
            if (D < 0) { return; }	// if no intersections, bail out
            x_1 = (-B + Math.sqrt(D)) / (2 * A);
            y_1 = (-a / b) * x_1 - c / b;
            if (D > 0) {		 // if ( D == 0 ) line is tangent to circle; only one touch point, ie. x2 = x1 and y2 = y1.	
                x_2 = (-B - Math.sqrt(D)) / (2 * A);
                y_2 = (-a / b) * x_2 - c / b;
            }
        }
        return {x1:x_1, y1:y_1, x2:x_2, y2:y_2};
    }



}