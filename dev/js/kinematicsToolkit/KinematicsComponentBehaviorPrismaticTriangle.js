import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsUtility } from './KinematicsUtility.js';


/** This class represents the behavior for a prismatic triangle component.  
 *  The movemenet of a prismatic triangle component calculates hinge movement based on a static and variable component.
*/
export class KinematicsComponentBehaviorPrismaticTriangle {

    constructor(component) {
        this._component = component;
        this._type = componentType.prismaticTriangle;
        this._extraComponent1 = null;
        this._extraComponent2 = null;
    }

    getType() {
        return this._type;
    }

    async fromJson(def,version) {
        this._extraComponent1 = def.extraComponent1;
        this._extraComponent2 = def.extraComponent2;
    }

    jsonFixup() {
        this._extraComponent1 = this._component.getHierachy().getComponentHash()[this._extraComponent1];
        this._extraComponent2 = this._component.getHierachy().getComponentHash()[this._extraComponent2];
    }

    toJson(def) {
        def.extraComponent1 = this._extraComponent1._id;
        def.extraComponent2 = this._extraComponent2._id;

    }

    getCurrentValue() {
    }

    set(value) {
    }

    async execute() {
        let component = this._component;

        let p1 = this._extraComponent1.transformlocalPointToWorldSpace(component._center);
        let p2 = this._extraComponent2.transformlocalPointToWorldSpace(this._extraComponent2._center);
        let p3 = this._extraComponent2._parent.transformlocalPointToWorldSpace(component._center);


        let delta = Communicator.Point3.subtract(p2, p1);
        let delta2 = Communicator.Point3.subtract(p2, p3);
        let ld1 = delta.length();
        let ld2 = delta2.length();

        delta.normalize();
        delta2.normalize();

        let angle = Communicator.Util.computeAngleBetweenVector(delta, delta2);

        await this._extraComponent2._rotate(-angle, true);
        let p1x = this._extraComponent2.transformlocalPointToWorldSpace(component._center);

        let delta3 = Communicator.Point3.subtract(p1x, p1);
        let ld3 = delta3.length();

        await this._extraComponent2._rotate(angle, true);
        p1x = this._extraComponent2.transformlocalPointToWorldSpace(component._center);
        let delta4 = Communicator.Point3.subtract(p1x, p1);
        let ld4 = delta4.length();

        if (ld4 > ld3)
            await this._extraComponent2._rotate(-angle, true);

        await this._extraComponent2._updateReferenceNodeMatrices();

        await component._translate(ld1 - ld2);


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
         * Retrieves the Extra Component 2 
         * @return {KinematicsComponent} Component
         */
    getExtraComponent2() {
        return this._extraComponent2;
    }

/**
  * Sets the extra component 2
  * @param  {KinematicsComponent} component - Component
  */     
 setExtraComponent2(component)
 {
     this._extraComponent2 = component;
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
