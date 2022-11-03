import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsUtility } from './KinematicsUtility.js';


/** This class represents the behavior for a revolute component.  
 *  A prismatic component allows only rotation around an axis.
*/
export class KinematicsComponentBehaviorSplineMovement {

    constructor(component) {
        this._component = component;
        this._type = componentType.splineMovement;

        this._splineSegment = null;
    }

    getType() {
        return this._type;
    }


    async fromJson(def, version) {
        if (def.splineSegment) {
            this._splineSegment = new hcBspline.CurveSegments();
            this._splineSegment.fromJson(def.splineSegment);
            this._splineSegment.enableGeometry();
        }
    }

    jsonFixup() {

    }

    toJson(def) {
        if (this._splineSegment) {
            def.splineSegment = this._splineSegment.toJson();
        }
    }

    getCurrentValue() {
        return this._component._currentPosition;
    }

    set(value) {
        this._component._currentPosition = value;
    }

    setSplineSegment(splineSegment) {
        this._splineSegment = splineSegment;
    }

    getMovementType()
    {
        return componentType.fixed;
    }


    async execute() {
        let component = this._component;
        if (this._splineSegment) {           
            let res =  this._splineSegment.getPointAt(this._component._currentPosition, true);       
            KinematicsManager.viewer.model.setNodeMatrix(component.getNodeId(), res.matrix);
    
        }
    }

}
