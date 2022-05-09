import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';


/** This class represents the behavior for a prismatic component.  
 * A prismatic component allows only translation along an axis.
*/
export class KinematicsComponentBehaviorPrismatic {

    constructor(component) {
        this._component = component;
        this._type = componentType.prismatic;
    }

    getType() {
        return this._type;
    }

    async fromJson(def,version) {
    }

    toJson(def) {

    }

    jsonFixup()
    {
     
    }

    getCurrentValue() {
        return this._component._currentPosition;
    }

    set(value) {
        this._component._translate(value);
    }

    async execute() {
    }

}
