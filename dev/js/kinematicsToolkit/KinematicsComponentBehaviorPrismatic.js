import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';

/** This class represents a Hierachy of Kinematics Components*/
export class KinematicsComponentBehaviorPrismatic {

    /**
    * Create a Kinematics Hierachy Object.    
    */
    constructor(component) {
        this._component = component;
        this._type = componentType.prismatic;
    }


    /**
    * Sets type of component
    * @param  {componentType} type - Component Type
    */
    setType(type) {
        this._type = type;
    }

    /**
      * Retrieves type of component
      * @return {componentType} Component Type
      */
    getType() {
        return this._type;
    }

    async fromJson(def) {
    }

    toJson(def) {
        
    }


    jsonFixup()
    {
     
    }

    /**
        * Retrieves the value of the current component (angle or relative position)
        * @return {number} Current Value
        */
    getCurrentValue() {
        return this._component._currentPosition;
    }

    set(value) {
        this._component._translate(value);
    }

    async execute() {
    }

}
