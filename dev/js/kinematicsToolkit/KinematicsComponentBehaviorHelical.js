import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsUtility } from './KinematicsUtility.js';

/** This class represents the behavior for a helical component.
 * A helical component performs a rotation when the component is translated.
*/
export class KinematicsComponentBehaviorHelical {

   
    constructor(component) {
        this._component = component;
        this._type = componentType.helical;

        this._helicalFactor = 1.0;

    }

    getType() {
        return this._type;
    }

    async fromJson(def, version) {
        this._helicalFactor = def.helicalFactor;
    }

    jsonFixup() {

    }

    toJson(def) {
        def.helicalFactor = this._helicalFactor;
    }
   
    getCurrentValue() {
        return this._component._currentPosition;
    }

    set(value) {
        this._component._translate(value);
    }

    
    /**
        * Retrieves the helical factor (applicable to componentType.mapped and componentType.helical)
        * @return {number}  Helical Factor
        */
     getHelicalFactor() {
        return this._helicalFactor;
    }


    /**
        * Sets the helical factor (applicable to componentType.mapped and componentType.helical)
        * @param  {number} helicalFactor - Helical Factor
        */
    setHelicalFactor(helicalFactor) {
        this._helicalFactor = helicalFactor;
    }

    getMovementType()
    {
        return componentType.prismatic;
    }


    async execute() {
        let component = this._component;
        let p1 = component._parent.transformlocalPointToWorldSpace(component._center);
        let p2 = component.transformlocalPointToWorldSpace(component._center);
        let length = Communicator.Point3.subtract(p2, p1).length();
        component._translate(length);
        let p3 = component.transformlocalPointToWorldSpace(component._center);
        component._translate(-length);
        let p4 = component.transformlocalPointToWorldSpace(component._center);
        if (Communicator.Point3.subtract(p3, p2).length() < Communicator.Point3.subtract(p4, p2).length()) {
            component._translate(length);
            length = -length;
        }
        component._rotate(length * this._helicalFactor, true, true);
    }

}
