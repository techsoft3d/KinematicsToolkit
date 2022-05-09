import { KinematicsComponent } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsUtility } from './KinematicsUtility.js';


/** This class represents the behavior for a pivot connector component.  
 * A pivot connector componments movement is based on a common pivot point.
*/
export class KinematicsComponentBehaviorPivotConnector {

    /**
    * Create a Kinematics Hierachy Object.    
    */
    constructor(component) {
        this._component = component;
        this._type = componentType.pivotConnector;
        this._extraComponent1 = null;
        this._extraPivot1 = null;
        this._isSlidePivot = false;
        this._targetPivot = null;
    }
   
    getType() {
        return this._type;
    }

    async fromJson(def,version) {
        if (def.extraComponent1) {
            this._extraComponent1 = def.extraComponent1;
        }

        if (def.extraPivot1) {
            this._extraPivot1 = Communicator.Point3.fromJson(def.extraPivot1);
        }
        this._isSlidePivot = def.isSlidePivot;
    }


    jsonFixup() {
        if (this._extraComponent1) {
            this._extraComponent1 = this._component.getHierachy().getComponentHash()[this._extraComponent1];
        }
    }

    toJson(def) {

        if (this._extraComponent1)
            def.extraComponent1 = this._extraComponent1._id;
        if (this._behavior._extraPivot1)
            def.extraPivot1 = this._extraPivot1.toJson();
        def.isSlidePivot = this._isSlidePivot;

    }

    getCurrentValue() {
        if (!this._isSlidePivot) {
            return this._component._currentAngle;
        }
        else {
            return this._component._currentPosition;
        }
    }

    set(value) {
        if (!this._isSlidePivot) {
            this._component._rotate(value);
        }
        else {
            this._component._translate(value);
        }
    }

    /**
        * Sets the extra pivot 1
        * @param  {Point3} pivot - Pivot Point
        */
    setExtraPivot1(pivot) {
        this._extraPivot1 = pivot;
    }


    /**
       * Retrieves the Extra Pivot 1 
       * @return {Point3} Pivot
       */
    getExtraPivot1() {
        return this._extraPivot1;
    }

    _calculatePivotConnectorRotation(component, targetpivot) {

        let pivot1trans = component._parent.transformlocalPointToWorldSpace(component._behavior._extraPivot1);
        let centertrans = component.transformlocalPointToWorldSpace(component._center);
        let pivotorigtrans = component._parent.transformlocalPointToWorldSpace(targetpivot);
        let transformedAxis = component.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center, component._axis));

        let rotaxis2 = Communicator.Point3.subtract(transformedAxis, centertrans).normalize();
        let plane = Communicator.Plane.createFromPointAndNormal(pivotorigtrans, rotaxis2);

        centertrans = KinematicsUtility.closestPointOnPlane(plane, centertrans);
        pivotorigtrans = KinematicsUtility.closestPointOnPlane(plane, pivotorigtrans);
        pivot1trans = KinematicsUtility.closestPointOnPlane(plane, pivot1trans);


        let v1 = Communicator.Point3.subtract(pivotorigtrans, centertrans).normalize();
        let v2 = Communicator.Point3.subtract(pivot1trans, centertrans).normalize();
        let angle = Communicator.Util.computeAngleBetweenVector(v1, v2);

        var armatrix = component._calculateAngleRotMatrix(angle);
        let p22 = component.transformlocalPointToWorldSpaceWithMatrix(component._behavior._extraPivot1, armatrix);
        let diff = Communicator.Point3.subtract(p22, targetpivot).length();
        armatrix = component._calculateAngleRotMatrix(-angle);
        p22 = component.transformlocalPointToWorldSpaceWithMatrix(component._behavior._extraPivot1, armatrix);
        let diff2 = Communicator.Point3.subtract(p22, targetpivot).length();
        if (diff2 > diff) {
            return angle;
        }
        else {
            return -angle;
        }
    }

    async execute() {
        let component = this._component;

        if (this._extraComponent1) {
            if (component._touched) {

                if (this._isSlidePivot) {
                    let extraPivot = this._extraComponent1._parent.transformlocalPointToWorldSpace(this._extraComponent1._behavior._extraPivot1);
                    let extraPivotCurrent = this._extraComponent1.transformlocalPointToWorldSpace(this._extraComponent1._behavior._extraPivot1);
                    let extraAxis = this._extraComponent1._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(this._extraComponent1._behavior._extraPivot1, this._extraComponent1._axis));
                    let extraCenter = this._extraComponent1._parent.transformlocalPointToWorldSpace(this._extraComponent1._center);

                    let center = component._parent.transformlocalPointToWorldSpace(component._center);
                    let axis = component._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center, component._axis));
                    let transformedPivot = component.transformlocalPointToWorldSpace(this._extraComponent1._behavior._extraPivot1);

                    axis = Communicator.Point3.subtract(axis, center).normalize();
                    extraAxis = Communicator.Point3.subtract(extraAxis, extraPivot).normalize();

                    let plane = Communicator.Plane.createFromPointAndNormal(extraPivot, extraAxis);
                    center = KinematicsUtility.closestPointOnPlane(plane, center);
                    extraCenter = KinematicsUtility.closestPointOnPlane(plane, extraCenter);

                    let xymatrix = KinematicsUtility.ComputeVectorToVectorRotationMatrix(extraAxis, new Communicator.Point3(0, 0, 1));
                    let xyinverse = Communicator.Matrix.inverse(xymatrix);

                    let tcenter = xymatrix.transform(center);
                    let tpivot = xymatrix.transform(transformedPivot);
                    let qcenter = xymatrix.transform(extraCenter);
                    let qpivot = xymatrix.transform(extraPivot);


                    let tr = Communicator.Point3.subtract(tpivot, tcenter).length();
                    let qr = Communicator.Point3.subtract(qpivot, qcenter).length();

                    let intersection = KinematicsUtility.circleIntersection(tcenter.x, tcenter.y, tr, qcenter.x, qcenter.y, qr);

                    intersection.p1.z = tcenter.z;
                    intersection.p2.z = qcenter.z;
                    let pp1 = xyinverse.transform(intersection.p1);
                    let pp2 = xyinverse.transform(intersection.p2);

                    let d1 = Communicator.Point3.subtract(pp1, extraPivotCurrent).length();
                    let d2 = Communicator.Point3.subtract(pp2, extraPivotCurrent).length();
                    if (d1 < d2) {
                        this._extraComponent1._behavior._targetPivot = pp1;
                    }
                    else {
                        this._extraComponent1._behavior._targetPivot = pp2;
                    }

                    let v1 = Communicator.Point3.subtract(extraPivot, center).normalize();
                    let v2 = Communicator.Point3.subtract(this._extraComponent1._behavior._targetPivot, center).normalize();
                    let angle = Communicator.Util.computeAngleBetweenVector(v1, v2);

                    var armatrix = component._calculateAngleRotMatrix(angle, undefined, extraAxis);
                    let p22 = component.transformlocalPointToWorldSpaceWithMatrix(extraPivot, armatrix);
                    let diff = Communicator.Point3.subtract(p22, this._extraComponent1._behavior._targetPivot).length();
                    armatrix = component._calculateAngleRotMatrix(-angle);
                    p22 = component.transformlocalPointToWorldSpaceWithMatrix(extraPivot, armatrix);
                    let diff2 = Communicator.Point3.subtract(p22, this._extraComponent1._behavior._targetPivot).length();
                    if (diff2 > diff) {
                        armatrix = component._calculateAngleRotMatrix(angle, undefined, extraAxis);
                    }

                    let localmatrix = KinematicsManager.viewer.model.getNodeMatrix(component._nodeid);
                    let final3 = Communicator.Matrix.multiply(localmatrix, armatrix);
                    KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, final3);

                }
                else {

                    let circlepivot = this._extraComponent1._parent.transformlocalPointToWorldSpace(this._extraComponent1._behavior._extraPivot1);
                    let circlecenter = this._extraComponent1._parent.transformlocalPointToWorldSpace(this._extraComponent1._center);
                    let transformedCenter = component._parent.transformlocalPointToWorldSpace(component._center);
                    let transformedAxis = component._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center, component._axis));


                    let rotaxis2 = Communicator.Point3.subtract(transformedAxis, transformedCenter).normalize();
                    let plane = Communicator.Plane.createFromPointAndNormal(transformedCenter, rotaxis2);

                    let cp = KinematicsUtility.closestPointOnPlane(plane, circlepivot);

                    let newpivot = component.transformlocalPointToWorldSpace(cp);

                    let cc = KinematicsUtility.closestPointOnPlane(plane, circlecenter);

                    let xymatrix = KinematicsUtility.ComputeVectorToVectorRotationMatrix(rotaxis2, new Communicator.Point3(0, 0, 1));
                    let xyinverse = Communicator.Matrix.inverse(xymatrix);

                    cp = xymatrix.transform(cp);
                    cc = xymatrix.transform(cc);
                    let np = xymatrix.transform(newpivot);

                    let tc = xymatrix.transform(transformedCenter);

                    // ViewerUtility.createDebugCube(KinematicsManager.viewer, transformedCenter, 10);
                    // ViewerUtility.createDebugCube(KinematicsManager.viewer, newpivot, 10);
                    // ViewerUtility.createDebugCube(KinematicsManager.viewer, circlepivot, 10, new Communicator.Color(0, 0, 1));


                    let circleRadius = Communicator.Point3.subtract(cp, cc).length();

                    let intersections = KinematicsUtility.circleLineIntersection(circleRadius, cc.x, cc.y, tc.x, tc.y, np.x, np.y);
                    if (!intersections) {
                        this._extraComponent1._behavior._targetPivot = circlepivot.copy();
                    }
                    else {
                        let respoint = new Communicator.Point3(intersections.x1, intersections.y1, tc.z);
                        respoint = xyinverse.transform(respoint);
                        let rot = this._calculatePivotConnectorRotation(this._extraComponent1, respoint);
                        if (rot < this._extraComponent1._minLimit) {
                            respoint = new Communicator.Point3(intersections.x2, intersections.y2, tc.z);
                            respoint = xyinverse.transform(respoint);
                        }

                        //                        ViewerUtility.createDebugCube(KinematicsManager.viewer, respoint);
                        this._extraComponent1._behavior._targetPivot = respoint;
                    }
                }
            }
            else {

                let pivot1aft;
                if (!this._extraComponent1._behavior._targetPivot)
                    pivot1aft = this._extraComponent1.transformlocalPointToWorldSpace(this._extraComponent1._behavior._extraPivot1);
                else
                    pivot1aft = this._extraComponent1._behavior._targetPivot.copy();
                let pivot1before = this._extraComponent1._parent.transformlocalPointToWorldSpace(this._extraComponent1._behavior._extraPivot1);
                let transformedCenter = component._parent.transformlocalPointToWorldSpace(component._center);
                let transformedAxis = component._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center, component._axis));

                let rotaxis2 = Communicator.Point3.subtract(transformedAxis, transformedCenter).normalize();
                let plane = Communicator.Plane.createFromPointAndNormal(transformedCenter, rotaxis2);

                let p1 = KinematicsUtility.closestPointOnPlane(plane, pivot1aft);
                let p2 = KinematicsUtility.closestPointOnPlane(plane, pivot1before);

                let v1 = Communicator.Point3.subtract(p1, transformedCenter).normalize();
                let v2 = Communicator.Point3.subtract(p2, transformedCenter).normalize();
                let angle = Communicator.Util.computeAngleBetweenVector(v1, v2);

                await component._rotate(angle);
                let p22 = component.transformlocalPointToWorldSpace(pivot1before);
                let diff = Communicator.Point3.subtract(p22, pivot1aft).length();
                await component._rotate(-angle);
                p22 = component.transformlocalPointToWorldSpace(pivot1before);
                let diff2 = Communicator.Point3.subtract(p22, pivot1aft).length();
                if (diff2 > diff) {
                    await component._rotate(angle);
                }
                if (this._isSlidePivot) {
                    let pivot1aft = this._extraComponent1.transformlocalPointToWorldSpace(this._extraComponent1._behavior._extraPivot1);
                    let pivot1bef = this._extraComponent1._parent.transformlocalPointToWorldSpace(this._extraComponent1._behavior._extraPivot1);

                    let delta = Communicator.Point3.subtract(pivot1aft, pivot1bef).length();

                    let moveaxis = Communicator.Point3.subtract(pivot1aft, transformedCenter).normalize();

                    let transmatrix = new Communicator.Matrix();
                    transmatrix = new Communicator.Matrix();
                    transmatrix.setTranslationComponent(-component._center.x, -component._center.y, -component._center.z);

                    let invtransmatrix = new Communicator.Matrix();
                    invtransmatrix.setTranslationComponent(component._center.x, component._center.y, component._center.z);

                    let deltamatrix = new Communicator.Matrix();
                    deltamatrix.setTranslationComponent(moveaxis.x * delta, moveaxis.y * delta, moveaxis.z * delta);

                    let result = Communicator.Matrix.multiply(transmatrix, deltamatrix);
                    let result2 = Communicator.Matrix.multiply(result, invtransmatrix);

                    let localmatrix = KinematicsManager.viewer.model.getNodeMatrix(component._nodeid);
                    let final3 = Communicator.Matrix.multiply(localmatrix, result2);
                    KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, final3);
                }

            }

        }
        else {
            if (component._behavior._extraPivot1) {
                if (component._behavior._targetPivot) {
                    let angle = this._calculatePivotConnectorRotation(component, component._behavior._targetPivot);
                    await component._rotate(angle);
                    component._behavior._targetPivot = null;
                }
            }
        }
        component._touched = false;

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
        * Retrieves if component is slide pivot
        * @return {bool} Is Slide Pivot
        */
    getIsSlidePivot() {
        return this._isSlidePivot;
    }



    /**
       * Sets if component is slide pivot
       * @param  {bool} isSlidePivot - Is component slide pivot\
       */
    setIsSlidePivot(isSlidePivot) {
        this._isSlidePivot = isSlidePivot;
    }


    /**
        * Aligns the component related to the piston controller to its plane
        */
    adjustExtraComponentToPistonController() {
        let component = this._component;

        let naxis = component._axis;
        let plane = Communicator.Plane.createFromPointAndNormal(component._center, naxis);
        let pol = KinematicsUtility.closestPointOnPlane(plane, this._extraComponent1._center);

        this._extraComponent1._axis = this._extraComponent1._axis.copy();
        this._extraComponent1._center = pol;
    }


}
