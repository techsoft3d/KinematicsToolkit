import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsUtility } from './KinematicsUtility.js';

/** This class represents a Hierachy of Kinematics Components*/
export class KinematicsComponentBehaviorRevoluteSlide {

    /**
    * Create a Kinematics Hierachy Object.    
    */
    constructor(component) {
        this._component = component;
        this._type = componentType.revoluteSlide;
        this._extraComponent1 = null;
        this._extraPivot1 = null;
    }

    getType() {
        return this._type;
    }


    async fromJson(def, version) {
        this._extraComponent1 = def.extraComponent1;
        this._extraPivot1 = Communicator.Point3.fromJson(def.extraPivot1);
    }

    jsonFixup() {
        this._extraComponent1 = this._component.getHierachy().getComponentHash()[this._extraComponent1];
    }

    toJson(def) {
        def.extraComponent1 = this._extraComponent1._id;
        def.extraPivot1 = this._extraPivot1.toJson();
    }

    /**
        * Retrieves the value of the current component (angle or relative position)
        * @return {number} Current Value
        */
    getCurrentValue() {
     
    }

    set(value) {
    }

    /**
          * Retrieves the Extra Component 1 (not applicable to all component types)
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
            * Sets the extra pivot 1 (applicable to componentType.revoluteSlide and componentType.mate)
            * @param  {Point3} pivot - Pivot Point
            */
    setExtraPivot1(pivot) {
        this._extraPivot1 = pivot;
    }


    /**
       * Retrieves the Extra Pivot 1 (applicable to componentType.revoluteSlide and componentType.mate)
       * @return {Point3} Pivot
       */
    getExtraPivot1() {
        return this._extraPivot1;
    }



    async execute() {
        let component = this._component;


        let pivot1trans = component._extraComponent1.transformlocalPointToWorldSpace(this._extraPivot1);
        let centertrans = component._parent.transformlocalPointToWorldSpace(component._center);
        let pivotorigtrans = component._parent.transformlocalPointToWorldSpace(this._extraPivot1);

        let v1 = Communicator.Point3.subtract(pivotorigtrans, centertrans).normalize();
        let v2 = Communicator.Point3.subtract(pivot1trans, centertrans).normalize();
        let angle = Communicator.Util.computeAngleBetweenVector(v1, v2);
        await component._rotate(angle);

        let r = component.transformlocalPointToWorldSpace(this._extraPivot1);
        let pray = new Communicator.Point3(centertrans.x + v2.x * 10000, centertrans.y + v2.y * 10000, centertrans.z + v2.z * 10000);

        let outpoint = new Communicator.Point3(0, 0, 0);
        let ldist = Communicator.Util.computePointToLineDistance(r, centertrans, pray, outpoint);

        if (ldist > 0.0001)
            await component._rotate(-angle);

    }

}
