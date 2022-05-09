import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';


/** This class represents the behavior for a target component.  
 *  A target components position is based on other components. Functionally equivalent to fixed component.
*/
export class KinematicsComponentBehaviorTarget {

    constructor(component) {
        this._component = component;
        this._type = componentType.target;
    }

    getType() {
        return this._type;
    }

    async fromJson(def, version) {
    }

    toJson(def) {
        
    }

    jsonFixup()
    {
     
    }

    getCurrentValue() {      
    }

    set(value) {
    }

    async execute() {
    }

}
