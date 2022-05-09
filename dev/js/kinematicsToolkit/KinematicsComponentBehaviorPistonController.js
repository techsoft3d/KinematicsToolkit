import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsUtility } from './KinematicsUtility.js';


/** This class represents the behavior for a piston controller component.  
 * A piston controller component drives piston movement.
*/
export class KinematicsComponentBehaviorPistonController {

    constructor(component) {
        this._component = component;
        this._type = componentType.pistonController;
        this._extraComponent1 = null;
    }

    getType() {
        return this._type;
    }

    async fromJson(def,version) {
        this._extraComponent1 = def.extraComponent1;
    }

    jsonFixup() {
        this._extraComponent1 = this._component.getHierachy().getComponentHash()[this._extraComponent1];
    }

    toJson(def) {
        def.extraComponent1 = this._extraComponent1._id;
    }
   
    getCurrentValue() {
    }

    set(value) {
    }

    async execute() {
        let component = this._component;

        let p1 = component._parent.transformlocalPointToWorldSpace(component._center);
        let p1a = component._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center, component._axis));

        let p2 = this._extraComponent1._parent.transformlocalPointToWorldSpace(this._extraComponent1._center);
        let p3 = this._extraComponent1._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(this._extraComponent1._center, this._extraComponent1._axis));

        let naxis = Communicator.Point3.subtract(p3, p2).normalize();
        let pol = KinematicsUtility.nearestPointOnLine(p2, naxis, p1);
        let delta = Communicator.Point3.subtract(pol, p1);
        let a = delta.length();

        let c = Communicator.Point3.subtract(this._extraComponent1._center, component._center).length();

        let b = Math.sqrt(c * c - a * a);
        let angle = Math.asin(b / c) * (180 / Math.PI);

        let offaxismatrix = new Communicator.Matrix();
        let transmatrix = new Communicator.Matrix();
        let resaxis = Communicator.Point3.subtract(p1a, p1).normalize();

        transmatrix = new Communicator.Matrix();
        transmatrix.setTranslationComponent(-p1.x, -p1.y, -p1.z);

        let invtransmatrix = new Communicator.Matrix();
        invtransmatrix.setTranslationComponent(p1.x, p1.y, p1.z);

        Communicator.Util.computeOffaxisRotation(resaxis, -angle, offaxismatrix);

        let result = Communicator.Matrix.multiply(transmatrix, offaxismatrix);
        let result2 = Communicator.Matrix.multiply(result, invtransmatrix);

        let temp1 = Communicator.Point3.subtract(pol, p1).normalize();
        temp1.scale(b);
        let pointonline = Communicator.Point3.add(p1, temp1);
        let pol2 = result2.transform(pointonline);

        offaxismatrix = new Communicator.Matrix();
        Communicator.Util.computeOffaxisRotation(resaxis, angle, offaxismatrix);


        result = Communicator.Matrix.multiply(transmatrix, offaxismatrix);
        result2 = Communicator.Matrix.multiply(result, invtransmatrix);

        temp1 = Communicator.Point3.subtract(pol, p1).normalize();
        temp1.scale(b);
        pointonline = Communicator.Point3.add(p1, temp1);
        let pol3 = result2.transform(pointonline);


        let ttt = this._extraComponent1._parent.transformlocalPointToWorldSpace(this._extraComponent1._center);
        let ttt1 = Communicator.Point3.subtract(pol2, ttt).length();
        let ttt2 = Communicator.Point3.subtract(pol3, ttt).length();

        if (ttt2 < ttt1)
            pol2 = pol3;

        let p22 = component._parent.transformlocalPointToWorldSpace(this._extraComponent1._center);

        let v1 = Communicator.Point3.subtract(p22, p1).normalize();
        let v2 = Communicator.Point3.subtract(pol2, p1).normalize();

        let fangle = Communicator.Util.computeAngleBetweenVector(v1, v2);
        await component._rotate(-fangle);

        p22 = component.transformlocalPointToWorldSpace(this._extraComponent1._center);
        let diff = Communicator.Point3.subtract(p22, pol2).length();
        await component._rotate(fangle);
        p22 = component.transformlocalPointToWorldSpace(this._extraComponent1._center);
        let diff2 = Communicator.Point3.subtract(p22, pol2).length();
        if (diff2 > diff)
            await component._rotate(-fangle);

        let deltafj = Communicator.Point3.subtract(this._extraComponent1._center, component.transformlocalPointToWorldSpace(this._extraComponent1._center)).length();
        await this._extraComponent1._translate(-deltafj);
        let dx = Communicator.Point3.subtract(this._extraComponent1.transformlocalPointToWorldSpace(this._extraComponent1._center), component.transformlocalPointToWorldSpace(this._extraComponent1._center)).length();
        await this._extraComponent1._translate(deltafj);
        let dx2 = Communicator.Point3.subtract(this._extraComponent1.transformlocalPointToWorldSpace(this._extraComponent1._center), component.transformlocalPointToWorldSpace(this._extraComponent1._center)).length();
        if (dx2 > dx)
            await this._extraComponent1._translate(-deltafj);

    }

    /**
        * Retrieves the Extra Component 1 
        * @return {KinematicsComponent} Component
        */
    getExtraComponent1() {
        return this._extraComponent1;
    }

    /**
      * Sets the extra component 1
      * @param  {KinematicsComponent} component - Component
      */
    setExtraComponent1(component) {
        this._extraComponent1 = component;
    }



    /**
        * Aligns the component related to the piston controller to its plane
        */
    adjustExtraComponentToPistonController() {
        let component = this._component;

        let naxis = component._axis;
        let plane = Communicator.Plane.createFromPointAndNormal(component._center, naxis);
        let pol = KinematicsUtility.closestPointOnPlane(plane, this._extraComponent1._center);

        this._extraComponent1._axis = this._extraComponent1._axis.copy();
        this._extraComponent1._center = pol;
    }


}
