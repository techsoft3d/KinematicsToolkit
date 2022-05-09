import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsUtility } from './KinematicsUtility.js';


/** This class represents the behavior for a prismatic aggregate component.  
 * A prismatic aggregate components position is calculated based on the position of two components.
*/
export class KinematicsComponentBehaviorPrismaticAggregate {


    constructor(component) {
        this._component = component;
        this._type = componentType.prismaticAggregate;
        this._extraComponent1 = null;
        this._extraComponent2 = null;

    }

    getType() {
        return this._type;
    }

    async fromJson(def, version) {
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

    getMovementType()
    {
        return componentType.fixed;
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
    setExtraComponent2(component) {
        this._extraComponent2 = component;
    }

    async execute() {
        let component = this._component;
        let matrix1 = KinematicsManager.viewer.model.getNodeMatrix(this._extraComponent1._nodeid);
        let matrix2 = KinematicsManager.viewer.model.getNodeMatrix(this._extraComponent2._nodeid);
        let resmatrix = Communicator.Matrix.multiply(matrix1, matrix2);
        await KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, resmatrix);
    }

}
