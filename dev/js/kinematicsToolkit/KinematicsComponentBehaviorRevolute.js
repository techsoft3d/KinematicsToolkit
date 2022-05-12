import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsUtility } from './KinematicsUtility.js';


/** This class represents the behavior for a revolute component.  
 *  A prismatic component allows only rotation around an axis.
*/
export class KinematicsComponentBehaviorRevolute {

    constructor(component) {
        this._component = component;
        this._type = componentType.revolute;

        this._fixedAxis = null;
        this._fixedAxisTarget = null;
    }

    getType() {
        return this._type;
    }

    /**
        * Sets the fixed axis for this component 
        * This defines the axis that is fixed in the component
        * @param  {Point3} axis - Fixed Axis
        */
    setFixedAxis(axis) {
        this._fixedAxis = axis;
    }

    /**
       * Sets the fixed axis target for this component 
       * This defines the axis that the fixed axis will be rotated to.
       * @param  {Point3} axis - Fixed Axis Target
       */
    setFixedAxisTarget(axis) {
        this._fixedAxisTarget = axis;
    }

    /**
       * Retrieves the fixed axis for this component 
       * @return {Poin3} Fixed Axis
       */
    getFixedAxis() {
        return this._fixedAxis;
    }



    /**
        * Calculates Fixed Axis and Fixed Axis Target from matrix
        */
    setFixedAxisFromMatrix(matrix) {
        let handleOperator = KinematicsManager.viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        if (KinematicsManager.getHandleOperator().getPosition()) {
            if (!KinematicsManager.getHandleOperator().getSecondAxis())
                return;


            let pivotaxis = Communicator.Point3.add(handleOperator.getPosition(), KinematicsManager.getHandleOperator().getSecondAxis());
            let pivot = matrix.transform(handleOperator.getPosition());
            pivotaxis = matrix.transform(pivotaxis);

            this._fixedAxis = Communicator.Point3.subtract(pivotaxis, this.center).normalize();
            this._fixedAxisTarget = new Communicator.Point3(0, -1, 0);


        }
    }

    async fromJson(def, version) {
        if (def.fixedAxis) {

            if (version == undefined) {
                let axis = Communicator.Point3.fromJson(def.fixedAxis);
                this._fixedAxis = Communicator.Point3.subtract(axis, this._component._center).normalize();
            }
            else
                this._fixedAxis = Communicator.Point3.fromJson(def.fixedAxis);
            this._fixedAxisTarget = Communicator.Point3.fromJson(def.fixedAxisTarget);
        }
    }

    jsonFixup() {

    }

    toJson(def) {
        if (this._fixedAxis) {
            def.fixedAxis = this._fixedAxis.toJson();
            def.fixedAxisTarget = this._fixedAxisTarget.toJson();
        }
    }

    getCurrentValue() {
        return this._component._currentAngle;
    }

    set(value) {
        this._component._rotate(value);
    }

    getMovementType() {
        return componentType.revolute;
    }

    async execute() {
        let component = this._component;
        if (this._fixedAxis) {
            let centerworld = component.transformlocalPointToWorldSpace(component._center);
            let fixedworld = component.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center, this._fixedAxis));

            let axis1 = Communicator.Point3.subtract(fixedworld, centerworld).normalize();


            let axis2 = this._fixedAxisTarget;

            let rotaxis = component.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center, component._axis));
            let rotaxis2 = Communicator.Point3.subtract(rotaxis, centerworld).normalize();

            let plane = Communicator.Plane.createFromPointAndNormal(centerworld, rotaxis2);
            let dist = plane.distanceToPoint(new Communicator.Point3.add(centerworld, axis2));
            let res = KinematicsUtility.closestPointOnPlane(plane, new Communicator.Point3.add(centerworld, axis2));
            axis2 = new Communicator.Point3.subtract(res, centerworld).normalize();
            let angle = Communicator.Util.computeAngleBetweenVector(axis1, axis2);
            await component._rotate(angle, true, true);


            centerworld = component.transformlocalPointToWorldSpace(component._center);
            fixedworld = component.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center, this._fixedAxis));
            let axis1x = Communicator.Point3.subtract(fixedworld, centerworld).normalize();

            let delta = Communicator.Point3.subtract(axis1x, axis2).length();
            if (delta > 0.001)
                await component._rotate(-angle * 2, true, true);
        }
    }

}
