import { KinematicsComponent } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsUtility } from './KinematicsUtility.js';

export class KinematicsComponentBehaviorPivotSystem {

    constructor(component) {
        this._component = component;
        this._type = componentType.pivotSystem;
        this._extraComponent1 = null;
        this._extraComponent2 = null;
        this._extraPivot1 = null;
        this._isSlidePivot = false;
        this._associatedComponentHash = null;
        this._processed = false;
    }

    getType() {
        return this._type;
    }

    addToHash(component) {
        if (!this._associatedComponentHash) {
            this._associatedComponentHash = [];
        }
        this._associatedComponentHash[component.getId()] = component;

    }

    async fromJson(def, version) {
        if (def.extraComponent1) {
            this._extraComponent1 = def.extraComponent1;
        }
        if (def.extraComponent2) {
            this._extraComponent2 = def.extraComponent2;
        }

        if (def.extraPivot1) {
            this._extraPivot1 = Communicator.Point3.fromJson(def.extraPivot1);
        }
        this._isSlidePivot = def.isSlidePivot;
    }

    jsonFixup() {
        if (this._extraComponent1) {
            this._extraComponent1 = this._component.getHierachy().getComponentHash()[this._extraComponent1];
            this._extraComponent1._behavior.addToHash(this._component);
        }
        if (this._extraComponent2) {
            this._extraComponent2 = this._component.getHierachy().getComponentHash()[this._extraComponent2];
            this._extraComponent2._behavior.addToHash(this._component);
        }
    }

    toJson(def) {
        if (this._extraComponent1)
            def.extraComponent1 = this._extraComponent1._id;
        if (this._extraComponent2)
            def.extraComponent2 = this._extraComponent2._id;

        if (this._extraPivot1)
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

    getMovementType() {
        if (!this._isSlidePivot) {
            return componentType.revolute;
        }
        else {
            return componentType.prismatic;
        }

    }


    async execute() {
        let component = this._component;
        if (component._touched) {
            let touchedHash = [];
            touchedHash[component._id] = true;

            let plane, xymatrix, xyinverse;

            if (!this._isSlidePivot) {
                plane = component.getWorldPlane();
                xymatrix = component.getXYMatrix();
            }
            else
            {
                plane = this._extraComponent1.getWorldPlane();
                xymatrix = this._extraComponent1.getXYMatrix();
            }


            xyinverse = Communicator.Matrix.inverse(xymatrix);

            if (this._associatedComponentHash)
            {
                for (let c in this._associatedComponentHash) {
                    this._associatedComponentHash[c]._behavior._resolve(this._component, plane, xymatrix, xyinverse, touchedHash);
                }
            }
            else
            {
                if (this._isSlidePivot)
                {
                    let centerWorld = component._parent.transformlocalPointToWorldSpace(component._center);
                    centerWorld = KinematicsUtility.closestPointOnPlane(plane, centerWorld);

                    let pivotOrigWorld = component._parent.transformlocalPointToWorldSpace(this._extraPivot1);
                    pivotOrigWorld = KinematicsUtility.closestPointOnPlane(plane, pivotOrigWorld);

                    let pivotWorld = component.transformlocalPointToWorldSpace(this._extraPivot1);
                    pivotWorld = KinematicsUtility.closestPointOnPlane(plane, pivotWorld);

                    let centerSecondWorld = this._extraComponent1._parent.transformlocalPointToWorldSpace(this._extraComponent1._center);
                    centerSecondWorld = KinematicsUtility.closestPointOnPlane(plane, centerSecondWorld);

                    let pivotSecondWorld = this._extraComponent1._parent.transformlocalPointToWorldSpace(this._extraPivot1);
                    pivotSecondWorld = KinematicsUtility.closestPointOnPlane(plane, pivotSecondWorld);
                    let intersect = this._circleIntersectionFromPoints(centerWorld, pivotWorld, centerSecondWorld, pivotSecondWorld, xymatrix, xyinverse);

                    let angle = this._calculateAngle(pivotOrigWorld, intersect, centerWorld);
                    let totalmatrix = this._findAngleSignMatrix(angle, this._extraComponent1._axis, component._center, new Communicator.Matrix(), pivotOrigWorld, intersect);

                    let localmatrix = KinematicsManager.viewer.model.getNodeMatrix(component._nodeid);
                    let final3 = Communicator.Matrix.multiply(localmatrix, totalmatrix);
                    KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, final3);

                }

                this._extraComponent1._behavior._resolve(this._component, plane, xymatrix, xyinverse, touchedHash);
            }

            component._touched = false;
        }
    }

    
    _circleLineIntersectionFromPoints(p1, p2, p3, p4, xymatrix, xyinverse) {


        let p1t = xymatrix.transform(p1);
        let p2t = xymatrix.transform(p2);
        let p3t = xymatrix.transform(p3);
        let p4t = xymatrix.transform(p4);

        let tr = Communicator.Point3.subtract(p2t, p1t).length();

        let intersections = KinematicsUtility.circleLineIntersection(tr, p1t.x, p1t.y, p3t.x, p3t.y, p4t.x, p4t.y);

        let i1 = new Communicator.Point3(intersections.x1,intersections.y1, p1t.z);
        let i2 = new Communicator.Point3(intersections.x2,intersections.y2, p1t.z);

        let pp1 = xyinverse.transform(i1);
        let pp2 = xyinverse.transform(i2);

        let l1 = Communicator.Point3.subtract(pp1, p2).length();
        let l2 = Communicator.Point3.subtract(pp2, p2).length();

        if (l1 < l2) {
            return pp1;
        }
        else {
            return pp2;
        }
    }


    _circleIntersectionFromPoints(p1, p2, p3, p4, xymatrix, xyinverse) {


        let p1t = xymatrix.transform(p1);
        let p2t = xymatrix.transform(p2);
        let p3t = xymatrix.transform(p3);
        let p4t = xymatrix.transform(p4);


        let tr = Communicator.Point3.subtract(p2t, p1t).length();
        let qr = Communicator.Point3.subtract(p4t, p3t).length();
        let intersection = KinematicsUtility.circleIntersection(p1t.x, p1t.y, tr, p3t.x, p3t.y, qr);

        intersection.p1.z = p1t.z;
        intersection.p2.z = p3t.z;

        let pp1 = xyinverse.transform(intersection.p1);
        let pp2 = xyinverse.transform(intersection.p2);

        let l1 = Communicator.Point3.subtract(pp1, p2).length();
        let l2 = Communicator.Point3.subtract(pp2, p2).length();

        if (l1 < l2) {
            return pp1;
        }
        else {
            return pp2;
        }
        
    }



    _calculateAngle(p1, p2, p3) {
        let v1 = Communicator.Point3.subtract(p1, p3).normalize();
        let v2 = Communicator.Point3.subtract(p2, p3).normalize();
        return Communicator.Util.computeAngleBetweenVector(v1, v2);
    }

    _findAngleSignMatrix(angle, normal, pivot, deltamatrix, outpivot, targetpoint) {
        let rotmatrix = this._component._calculateAngleRotMatrix(angle, undefined, normal, pivot);
        let totalmatrix = Communicator.Matrix.multiply(deltamatrix, rotmatrix);
        let test = this._component.transformlocalPointToWorldSpaceWithMatrix(outpivot, totalmatrix);
        let dist1 = Communicator.Point3.subtract(test, targetpoint).length();

        let rotmatrix2 = this._component._calculateAngleRotMatrix(-angle, undefined, normal, pivot);
        let totalmatrix2 = Communicator.Matrix.multiply(deltamatrix, rotmatrix2);
        let test2 = this._component.transformlocalPointToWorldSpaceWithMatrix(outpivot, totalmatrix2);
        let dist2 = Communicator.Point3.subtract(test2, targetpoint).length();

        if (dist1 < dist2) {
            return totalmatrix;
        }
        else {
            return totalmatrix2;
        }
    }

    async _resolve(incomponent, plane, xymatrix, xyinverse, touchedHash) {
        let component = this._component;
        if (touchedHash[component._id]) {
            return;
        }
        touchedHash[component._id] = true;
        if (!this._associatedComponentHash) {
            if (!this._extraComponent2) {
              
                let centerWorld = component._parent.transformlocalPointToWorldSpace(component._center);
                centerWorld = KinematicsUtility.closestPointOnPlane(plane, centerWorld);

                let startPivotWorld = component._parent.transformlocalPointToWorldSpace(this._extraPivot1);
                startPivotWorld = KinematicsUtility.closestPointOnPlane(plane, startPivotWorld);

                let currentPivotWorld = incomponent.transformlocalPointToWorldSpace(this._extraPivot1);
                currentPivotWorld = KinematicsUtility.closestPointOnPlane(plane, currentPivotWorld);

                let angle = this._calculateAngle(startPivotWorld, currentPivotWorld, centerWorld);

                if (!this._isSlidePivot)
                {

                    let totalmatrix = this._findAngleSignMatrix(angle, component._axis, component._center, new Communicator.Matrix(), startPivotWorld, currentPivotWorld);
                    KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, totalmatrix);
                }
                else
                {
                    let totalmatrix = this._findAngleSignMatrix(angle, incomponent._axis, component._center, new Communicator.Matrix(), startPivotWorld, currentPivotWorld);
                    KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, totalmatrix);

                    startPivotWorld = component.transformlocalPointToWorldSpace(this._extraPivot1);
                    startPivotWorld = KinematicsUtility.closestPointOnPlane(plane, startPivotWorld);

                    let delta = Communicator.Point3.subtract(currentPivotWorld, startPivotWorld).length();
                    
                    if (currentPivotWorld.equalsWithTolerance(startPivotWorld,0.0001))
                    {
                        return;
                    }
                    let moveaxis = Communicator.Point3.subtract(currentPivotWorld, startPivotWorld).normalize();
                    let ea1 = component._parent.transformPointToComponentSpace(centerWorld);
                    let ea2 = component._parent.transformPointToComponentSpace(Communicator.Point3.add(centerWorld,moveaxis));
                    moveaxis = Communicator.Point3.subtract(ea2,ea1).normalize();

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
            else {

                let inpivot, outpivot;
                let outcomponent;
               
                if (this._extraComponent1.getId() == incomponent.getId()) {
                    inpivot = component._center;
                    outcomponent = this._extraComponent2;
                    outpivot = this._extraPivot1;
                }
                else {
                    inpivot = this._extraPivot1;
                    outcomponent = this._extraComponent1;
                    outpivot = component._center;

                }

                let inpivotWorld = incomponent.transformlocalPointToWorldSpace(inpivot);
                let currentpivotWorld = component._parent.transformlocalPointToWorldSpace(inpivot);
                let outpivotWorld = component._parent.transformlocalPointToWorldSpace(outpivot);



                let outcenterWorld = outcomponent._parent.transformlocalPointToWorldSpace(outcomponent._center);

                inpivotWorld = KinematicsUtility.closestPointOnPlane(plane, inpivotWorld);
                currentpivotWorld = KinematicsUtility.closestPointOnPlane(plane, currentpivotWorld);
                outpivotWorld = KinematicsUtility.closestPointOnPlane(plane, outpivotWorld);
                outcenterWorld = KinematicsUtility.closestPointOnPlane(plane, outcenterWorld);

                let inpivotComponent = component._parent.transformPointToComponentSpace(inpivotWorld);
                let currentpivotComponent = component._parent.transformPointToComponentSpace(currentpivotWorld);
                let delta = Communicator.Point3.subtract(inpivotComponent, currentpivotComponent);

                let deltamatrix = new Communicator.Matrix();
                deltamatrix.setTranslationComponent(delta.x, delta.y, delta.z);
                KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, deltamatrix);

                let outpivotWorldCurrent = component.transformlocalPointToWorldSpace(outpivot);
                outpivotWorldCurrent = KinematicsUtility.closestPointOnPlane(plane, outpivotWorldCurrent);

                let intersect;
                if (!touchedHash[outcomponent._id]) {
                    intersect = this._circleIntersectionFromPoints(inpivotWorld, outpivotWorldCurrent, outcenterWorld, outpivotWorld, xymatrix, xyinverse);
                }
                else {
                    intersect = outcomponent.transformlocalPointToWorldSpace(outpivot);
                    intersect = KinematicsUtility.closestPointOnPlane(plane, intersect);

                }

                let angle = this._calculateAngle(outpivotWorldCurrent, intersect, inpivotWorld);

                let totalmatrix = this._findAngleSignMatrix(angle, component._axis, inpivotComponent, deltamatrix, outpivot, intersect);
                //             ViewerUtility.createDebugCube(KinematicsManager.viewer, test, 10, new Communicator.Color(0, 0, 255));

                KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, totalmatrix);
                outcomponent._behavior._resolve(component, plane, xymatrix, xyinverse, touchedHash);
            }
        }
        else {
            let centerWorld = component.transformlocalPointToWorldSpace(component._center);
            centerWorld = KinematicsUtility.closestPointOnPlane(plane, centerWorld);

            let componentpivot, newpivotafter;
            if (incomponent._behavior._extraComponent1 == component) {
                if (incomponent._behavior._extraComponent2)
                {
                    componentpivot = incomponent._center;

                }
                else
                {
                    componentpivot = incomponent._behavior._extraPivot1;
                    let lineend = incomponent.transformlocalPointToWorldSpace(componentpivot);
                    lineend = KinematicsUtility.closestPointOnPlane(plane, lineend);
                    let linestart = incomponent.transformlocalPointToWorldSpace(incomponent._center);
                    linestart = KinematicsUtility.closestPointOnPlane(plane, linestart);

                    let circlecenter = component.transformlocalPointToWorldSpace(component._center);
                    circlecenter = KinematicsUtility.closestPointOnPlane(plane, circlecenter);

                    let circleend = component.transformlocalPointToWorldSpace(componentpivot);
                    circleend = KinematicsUtility.closestPointOnPlane(plane, circleend);

                    newpivotafter = this._circleLineIntersectionFromPoints(circlecenter, circleend, linestart, lineend, xymatrix, xyinverse);


                }
            }
            else {
                componentpivot = incomponent._behavior._extraPivot1;
            }

            let pivotbefore = incomponent._parent.transformlocalPointToWorldSpace(componentpivot);
            pivotbefore = KinematicsUtility.closestPointOnPlane(plane, pivotbefore);
            let pivotafter;
            if (newpivotafter)
            {
                pivotafter = newpivotafter;
            }
            else
            {
                pivotafter = incomponent.transformlocalPointToWorldSpace(componentpivot);
                pivotafter = KinematicsUtility.closestPointOnPlane(plane, pivotafter);
            }

            let angle = this._calculateAngle(pivotbefore, pivotafter, centerWorld);

            let centerComponent = component._parent.transformPointToComponentSpace(centerWorld);
            let pivotbeforeComponent = component._parent.transformPointToComponentSpace(pivotbefore);
            let matrix = this._findAngleSignMatrix(angle, component._axis, centerComponent, new Communicator.Matrix(), pivotbeforeComponent, pivotafter);
            KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, matrix);

            for (let c in this._associatedComponentHash) {
                if (this._associatedComponentHash[c] != incomponent) {
                    this._associatedComponentHash[c]._behavior._resolve(component, plane, xymatrix, xyinverse, touchedHash);
                }
            }


        }
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
       * Retrieves the Extra Component 1 
       * @return {KinematicsComponent} Component
       */
    getExtraComponent2() {
        return this._extraComponent2;
    }

    /**
      * Sets the extra component 1
      * @param  {KinematicsComponent} component - Component
      */
    setExtraComponent2(component) {
        this._extraComponent2 = component;
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

}
