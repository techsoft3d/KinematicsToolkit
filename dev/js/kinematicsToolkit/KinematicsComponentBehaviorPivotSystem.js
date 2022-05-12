import { KinematicsComponent } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsUtility } from './KinematicsUtility.js';

export class KinematicsComponentBehaviorPivotSystem {

    constructor(component) {
        this._component = component;
        this._type = componentType.pivotSystem;
      
    }
   
    getType() {
        return this._type;
    }

    async fromJson(def,version) {
     
    }

    jsonFixup() {
        
    }

    toJson(def) {

    }

    getCurrentValue() {
     
    }

    set(value) {
       
    }

    getMovementType()
    {
      
    }

    async execute() {
        let component = this._component;
    }

}
