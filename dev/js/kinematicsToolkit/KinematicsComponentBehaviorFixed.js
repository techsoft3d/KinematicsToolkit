import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';

/** This class represents the behavior for a fixed component.
 * Fixed components are moving only relative to their parent component.
*/
export class KinematicsComponentBehaviorFixed {

    
    constructor(component) {
        this._component = component;
        this._type = componentType.fixed;
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

    getMovementType()
    {
        return componentType.fixed;
    }

    getCurrentValue() {      
    }

    set(value) {
    }

    async execute() {
    }

}
