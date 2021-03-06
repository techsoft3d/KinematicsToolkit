import { KinematicsComponent } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsUtility } from './KinematicsUtility.js';



/**
 * Type of Pivot System Component.
 * @readonly
 * @enum {number}
 */

 const pivotSystemType = {
    /** End Component that rotates along a center axis  */
   endRevolute:0,
    /** End Component that rotates and translates along a center axis*/
   endPrismatic:1,
    /** End Component that is connected to a center component*/
   endConnected:2,
    /** Connector component that is connected to two other components*/
   connector:3,
   /** Center component that rotates around a fixed axis. Connected to other components*/
   centerRot:4,
   /** Center component that translates along a fixed axis. Connected to other components*/
   centerPrismatic:5,
};


export {pivotSystemType};

/** This class represents the behavior for a pivot system component.  
 * A pivot system component is part of a system of components defined by common pivot points.
*/
export class KinematicsComponentBehaviorPivotSystem {

    constructor(component) {
        this._component = component;
        this._type = componentType.pivotSystem;
        this._pivotType = pivotSystemType.centerRot;
        this._extraComponent1 = null;
        this._extraComponent2 = null;
        this._mappedComponent = null;
        this._helicalFactor = 1;
        this._extraPivot1 = null;     
        this._associatedComponentHash = null;
        this._processed = false;
        this._wasExecuted = false;
    }


    static clearExecutedSystems(hierachy) {
        if (hierachy._systems) {
            for (let i = 0; i < hierachy._systems.length; i++) {
                hierachy._systems[i]._behavior._wasExecuted = false;
            }
        }
    }

    static async executeUnexecutedSystems(hierachy) {
        if (hierachy._systems) {
            for (let i = 0; i < hierachy._systems.length; i++) {
                if (!hierachy._systems[i]._behavior._wasExecuted) {
                    hierachy._systems[i]._touched = true;
                    await hierachy._systems[i]._behavior.execute(hierachy);
                }
            }
        }
    }

    static rebuildAllHashes(hierachy)
    {
        for (let i in hierachy.getComponentHash())
        {
            let component = hierachy.getComponentById(i);
            if (component.getType() == componentType.pivotSystem)
            {
                component._behavior._associatedComponentHash = null;
            }
        }

        for (let i in hierachy.getComponentHash())
        {
            let component = hierachy.getComponentById(i);
            if (component.getType() == componentType.pivotSystem)
            {
                if (component._behavior._extraComponent1)
                {
                    component._behavior._extraComponent1._behavior._addToHash(component);
                }
                if (component._behavior._extraComponent2)
                {
                    component._behavior._extraComponent2._behavior._addToHash(component);
                }
                if (component._behavior._mappedComponent)
                {
                    component._behavior._mappedComponent._behavior._addToHash(component);
                }
            }
        }
    }

    static _gatherSystems(component, foundComponents, startcomponent) {
        if (foundComponents[component._id])
        {
           return;
        }
        if (!startcomponent.result && !component._behavior._extraComponent1)
        {
            startcomponent.result = component;
        }
        foundComponents[component._id] = true;
        if (component._behavior._extraComponent1) {
            KinematicsComponentBehaviorPivotSystem._gatherSystems(component._behavior._extraComponent1, foundComponents,startcomponent);
        }
        if (component._behavior._extraComponent2) {
            KinematicsComponentBehaviorPivotSystem._gatherSystems(component._behavior._extraComponent2, foundComponents,startcomponent);
        }

        if (component._behavior._mappedComponent) {
            KinematicsComponentBehaviorPivotSystem._gatherSystems(component._behavior._mappedComponent, foundComponents,startcomponent);            
        }

        if (component._behavior._associatedComponentHash) {
            for (let c in component._behavior._associatedComponentHash) {
                KinematicsComponentBehaviorPivotSystem._gatherSystems(component._behavior._associatedComponentHash[c], foundComponents,startcomponent);            
            }
        }        
        
    }

    static findAllSystems(hierachy)
    {
        let foundComponents = [];
        hierachy._systems = [];
        for (let i in hierachy.getComponentHash())
        {
            let component = hierachy.getComponentById(i);
            if (component.getType() == componentType.pivotSystem && foundComponents[component._id] == undefined)
            {
                let startcomponent = {result:null};
                KinematicsComponentBehaviorPivotSystem._gatherSystems(component, foundComponents,startcomponent);
                hierachy._systems.push(startcomponent.result);
            }
        }
    }


    getType() {
        return this._type;
    }

    /**
      * Retrieves pivot type of this pivot system component
      * @return {pivotSystemType} Pivot System Type
      */

    getPivotType() {
        return this._pivotType;
    }

    /**
        * Sets the pivot type of this pivot system component.
        * @param  {pivotSystemType} pivotType - Pivot System Type
        */
    setPivotType(pivotType) {
        this._pivotType = pivotType;
    }


    _addToHash(component) {
        if (!this._associatedComponentHash) {
            this._associatedComponentHash = [];
        }
        this._associatedComponentHash[component.getId()] = component;

    }

    async fromJson(def, version) {
        if (def.pivotType != undefined)  {
            this._pivotType = def.pivotType;        
        }

        if (def.extraComponent1) {
            this._extraComponent1 = def.extraComponent1;
        }
        if (def.extraComponent2) {
            this._extraComponent2 = def.extraComponent2;
        }

        if (def.mappedComponent) {
            this._mappedComponent = def.mappedComponent;
        }

        if (def.extraPivot1) {
            this._extraPivot1 = Communicator.Point3.fromJson(def.extraPivot1);
        }

        if (def.helicalFactor)
            this._helicalFactor = def.helicalFactor;
      
    }

    jsonFixup() {
        if (this._extraComponent1) {
            this._extraComponent1 = this._component.getHierachy().getComponentHash()[this._extraComponent1];
            if (this._extraComponent1)
                this._extraComponent1._behavior._addToHash(this._component);
        }
        if (this._extraComponent2) {
            this._extraComponent2 = this._component.getHierachy().getComponentHash()[this._extraComponent2];
            if (this._extraComponent2)
                this._extraComponent2._behavior._addToHash(this._component);
        }

        if (this._mappedComponent) {
            this._mappedComponent = this._component.getHierachy().getComponentHash()[this._mappedComponent];
            if (this._mappedComponent) {
                this._mappedComponent._behavior._addToHash(this._component);
            }
        }
    }

    toJson(def) {
        def.pivotType = this._pivotType;
        if (this._extraComponent1)
            def.extraComponent1 = this._extraComponent1._id;
        if (this._extraComponent2)
            def.extraComponent2 = this._extraComponent2._id;
        if (this._mappedComponent)
            def.mappedComponent = this._mappedComponent._id;

        def.helicalFactor = this._helicalFactor;

        if (this._extraPivot1)
            def.extraPivot1 = this._extraPivot1.toJson();      
    }

    applyToModel(matrix)
    {
        if (this._extraPivot1)
        {
            this._extraPivot1 = matrix.transform(this._extraPivot1);
        }
    }

    getCurrentValue() {
        if (this._pivotType != pivotSystemType.endPrismatic && this._pivotType != pivotSystemType.centerPrismatic) {
            return this._component._currentAngle;
        }
        else {
            return this._component._currentPosition;
        }

    }

    set(value) {
        if (this._pivotType != pivotSystemType.endPrismatic && this._pivotType != pivotSystemType.centerPrismatic) {
            this._component._rotate(value);
        }
        else {
            this._component._translate(value);
        }
    }

    getMovementType() {
        if (this._extraComponent1 && this._extraComponent2) {
            return componentType.fixed;
        }
        if (this._pivotType != pivotSystemType.endPrismatic && this._pivotType != pivotSystemType.centerPrismatic) {
            return componentType.revolute;
        }
        else {
            return componentType.prismatic;
        }

    }


    async execute() {
        let component = this._component;
        if (component._touched) {
            this._wasExecuted = true;
            let touchedHash = [];
            touchedHash[component._id] = true;

            let plane, xymatrix, xyinverse;
            if (this._pivotType == pivotSystemType.endPrismatic) {
                plane = this._extraComponent1.getWorldPlane();
                xymatrix = this._extraComponent1.getXYMatrix();
            }            
            else if (this._pivotType == pivotSystemType.centerPrismatic) {
                for (let c in this._associatedComponentHash) {
                    plane = this._associatedComponentHash[c].getWorldPlane();
                    xymatrix = this._associatedComponentHash[c].getXYMatrix();
                    break;
                }
            }
            else {
                plane = component.getWorldPlane();
                xymatrix = component.getXYMatrix();
            }

            xyinverse = Communicator.Matrix.inverse(xymatrix);

            if (this._associatedComponentHash) {
                let fixedComponent = null;
                for (let c in this._associatedComponentHash) {
                    if (this._associatedComponentHash[c]._behavior._pivotType == pivotSystemType.endConnected) {
                        fixedComponent = this._associatedComponentHash[c];
                    }
                }

                if (fixedComponent) {                  
                    this._resolveMultiComponent(fixedComponent, plane, xymatrix, xyinverse, touchedHash, true);
                }
                else {


                    for (let c in this._associatedComponentHash) {
                        if (this._associatedComponentHash[c]._behavior._mappedComponent == this._component) {
                            this._associatedComponentHash[c]._behavior._resolveMapped(this._component, plane, xymatrix, xyinverse, touchedHash);
                        }
                        else {
                            this._associatedComponentHash[c]._behavior._resolve(component, plane, xymatrix, xyinverse, touchedHash);
                        }
                    }
                }
            }
            else {
                if (this._extraComponent1) {
                    if (this._pivotType == pivotSystemType.endPrismatic) {
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
                        let totalmatrix = this._findAngleSignMatrix(angle, this._extraComponent1._axis, component._center, new Communicator.Matrix(), this._extraPivot1, intersect, component, plane);

                        let localmatrix = KinematicsManager.viewer.model.getNodeMatrix(component._nodeid);
                        let final3 = Communicator.Matrix.multiply(localmatrix, totalmatrix);
                        KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, final3);

                    }

                    this._extraComponent1._behavior._resolve(this._component, plane, xymatrix, xyinverse, touchedHash);
                }
            }
            if (this._mappedComponent) {
                this._mappedComponent._behavior._resolveMapped(this._component, plane, xymatrix, xyinverse, touchedHash);

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

        let i1 = new Communicator.Point3(intersections.x1, intersections.y1, p1t.z);
        let i2 = new Communicator.Point3(intersections.x2, intersections.y2, p1t.z);

        let pp1 = xyinverse.transform(i1);
        let pp2 = xyinverse.transform(i2);

        let l1 = Communicator.Point3.subtract(pp1, p4).length();
        let l2 = Communicator.Point3.subtract(pp2, p4).length();

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

        let pp1,pp2,l1,l2;
        if (intersection.p1)
        {
            intersection.p1.z = p1t.z;
            pp1 = xyinverse.transform(intersection.p1);
            l1 = Communicator.Point3.subtract(pp1, p2).length();
        }

        if (intersection.p2)
        {
         intersection.p2.z = p3t.z;
          pp2 = xyinverse.transform(intersection.p2);
          l2 = Communicator.Point3.subtract(pp2, p2).length();

        }

        if (!l1 && !l2)
        {
            if (this._component._enforceLimits)
            {
                this._component._hierachy._cantResolve = true;
            }
            return p2;            
        }
        if (!l1)
            return pp2;
            
        if (!l2)
            return pp1;
        

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

    _findAngleSignMatrix(angle, normal, pivot, deltamatrix, outpivot, targetpoint, component, plane) {

        let rotmatrix = this._component._calculateAngleRotMatrix(angle, undefined, normal, pivot);
        let totalmatrix = Communicator.Matrix.multiply(deltamatrix, rotmatrix);
        let test = this._component.transformlocalPointToWorldSpaceWithMatrix(outpivot, totalmatrix);
        test = KinematicsUtility.closestPointOnPlane(plane, test);
        let dist1 = Communicator.Point3.subtract(test, targetpoint).length();

        let rotmatrix2 = this._component._calculateAngleRotMatrix(-angle, undefined, normal, pivot);
        let totalmatrix2 = Communicator.Matrix.multiply(deltamatrix, rotmatrix2);
        let test2 = this._component.transformlocalPointToWorldSpaceWithMatrix(outpivot, totalmatrix2);
        test2 = KinematicsUtility.closestPointOnPlane(plane, test2);

        let dist2 = Communicator.Point3.subtract(test2, targetpoint).length();

        if (dist1 < dist2) {


            component._currentAngle = angle;
            return totalmatrix;
        }
        else {

            component._currentAngle = -angle;
            return totalmatrix2;
        }
    }

    async _resolveMapped(incomponent, plane, xymatrix, xyinverse, touchedHash) {
        let component = this._component;
        if (touchedHash[component._id]) {
            return;
        }
        touchedHash[component._id] = true;
        this._wasExecuted = true;

        let helicalFactor = 0;
        if (incomponent._behavior._mappedComponent != undefined && incomponent._behavior._mappedComponent == component) {
            helicalFactor = 1 / incomponent._behavior._helicalFactor;
        }
        else {
            helicalFactor = component._behavior._helicalFactor;
        }

        component._rotate(incomponent._currentAngle * helicalFactor);

        for (let c in this._associatedComponentHash) {
            if (this._associatedComponentHash[c]._behavior._mappedComponent == component) {
                this._associatedComponentHash[c]._behavior._resolveMapped(component, plane, xymatrix, xyinverse, touchedHash);
            }
            else {
                this._associatedComponentHash[c]._behavior._resolve(component, plane, xymatrix, xyinverse, touchedHash);
            }
        }
        if (this._mappedComponent) {
            this._mappedComponent._behavior._resolveMapped(component, plane, xymatrix, xyinverse, touchedHash);

        }
    }



    async _resolveEndComponent(incomponent, plane, xymatrix, xyinverse, touchedHash) {
        let component = this._component;
        let centerWorld = component._parent.transformlocalPointToWorldSpace(component._center);
        centerWorld = KinematicsUtility.closestPointOnPlane(plane, centerWorld);

        let startPivotWorld = component._parent.transformlocalPointToWorldSpace(this._extraPivot1);
        startPivotWorld = KinematicsUtility.closestPointOnPlane(plane, startPivotWorld);

        let currentPivotWorld = incomponent.transformlocalPointToWorldSpace(this._extraPivot1);
        currentPivotWorld = KinematicsUtility.closestPointOnPlane(plane, currentPivotWorld);

        let angle = this._calculateAngle(startPivotWorld, currentPivotWorld, centerWorld);


        if (this._pivotType != pivotSystemType.endPrismatic) {

            let totalmatrix = this._findAngleSignMatrix(angle, component._axis, component._center, new Communicator.Matrix(), this._extraPivot1, currentPivotWorld, component, plane);
            KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, totalmatrix);
        }
        else {
            let totalmatrix = this._findAngleSignMatrix(angle, incomponent._axis, component._center, new Communicator.Matrix(), this._extraPivot1, currentPivotWorld, component, plane);
            KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, totalmatrix);

             startPivotWorld = component.transformlocalPointToWorldSpace(this._extraPivot1);
            startPivotWorld = KinematicsUtility.closestPointOnPlane(plane, startPivotWorld);

            let delta = Communicator.Point3.subtract(currentPivotWorld, startPivotWorld).length();
           

            if (currentPivotWorld.equalsWithTolerance(startPivotWorld, 0.0001)) {
                return;
            }
            let moveaxis = Communicator.Point3.subtract(currentPivotWorld, startPivotWorld).normalize();
            let ea1 = component._parent.transformPointToComponentSpace(centerWorld);
            let ea2 = component._parent.transformPointToComponentSpace(Communicator.Point3.add(centerWorld, moveaxis));
            moveaxis = Communicator.Point3.subtract(ea2, ea1).normalize();

            let d1 = Communicator.Point3.subtract(moveaxis, component._axis).length();
            let d2 = Communicator.Point3.subtract(new Communicator.Point3(-moveaxis.x, -moveaxis.y, -moveaxis.z), component._axis).length();

            let delta2 = delta;
            if (d1 < d2) {
                if ( component._minLimit != undefined && delta2 < component._minLimit ) {
                    delta2 =  component._minLimit;
                    if (this._component._enforceLimits && component._maxLimit) {
                        this._component._hierachy._cantResolve = true;
                    }
                }
                if ( component._maxLimit != undefined && delta2 > component._maxLimit ) {
                    delta2 =  component._maxLimit;
                    if (this._component._enforceLimits && component._maxLimit) {
                        this._component._hierachy._cantResolve = true;
                    }
                }

                component._currentPosition = delta2;
                delta = delta2;

            }
            else {
                delta2  = -delta2;
                if ( component._minLimit != undefined && delta2 < component._minLimit ) {
                    delta2 =  component._minLimit;
                    if (this._component._enforceLimits && component._maxLimit) {
                        this._component._hierachy._cantResolve = true;
                    }
                }
                if ( component._maxLimit != undefined && delta2 > component._maxLimit ) {
                    delta2 =  component._maxLimit;
                    if (this._component._enforceLimits && component._maxLimit) {
                        this._component._hierachy._cantResolve = true;
                    }
                }

                component._currentPosition = delta2;
                delta = -delta2;
            }

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


    async _resolveConnectorComponent(incomponent, plane, xymatrix, xyinverse, touchedHash) {
        let component = this._component;
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
        let outpivotWorld = outcomponent._parent.transformlocalPointToWorldSpace(outpivot);

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

        let intersect;
        let outpivotWorldCurrent = component.transformlocalPointToWorldSpace(outpivot);
        outpivotWorldCurrent = KinematicsUtility.closestPointOnPlane(plane, outpivotWorldCurrent);

        if (outcomponent._behavior._pivotType == pivotSystemType.centerPrismatic) {
            let outpivotWorldAxis = component._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(outpivot,outcomponent._axis));
            outpivotWorldAxis = KinematicsUtility.closestPointOnPlane(plane, outpivotWorldAxis);
            
            intersect = this._circleLineIntersectionFromPoints(inpivotWorld, outpivotWorldCurrent, outpivotWorld, outpivotWorldAxis, xymatrix, xyinverse);
            intersect = KinematicsUtility.closestPointOnPlane(plane, intersect);
         //   ViewerUtility.createDebugCube(KinematicsManager.viewer, res, 10, new Communicator.Color(0, 0, 255));
            

        }
        else {

            if (!touchedHash[outcomponent._id]) {
                intersect = this._circleIntersectionFromPoints(inpivotWorld, outpivotWorldCurrent, outcenterWorld, outpivotWorld, xymatrix, xyinverse);
            }
            else {
                intersect = outcomponent.transformlocalPointToWorldSpace(outpivot);
                intersect = KinematicsUtility.closestPointOnPlane(plane, intersect);

            }
        }
        let angle = this._calculateAngle(outpivotWorldCurrent, intersect, inpivotWorld);

        let totalmatrix = this._findAngleSignMatrix(angle, component._axis, inpivotComponent, deltamatrix, outpivot, intersect, component, plane);
        //             ViewerUtility.createDebugCube(KinematicsManager.viewer, test, 10, new Communicator.Color(0, 0, 255));

        KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, totalmatrix);
        outcomponent._behavior._resolve(component, plane, xymatrix, xyinverse, touchedHash);        

    }

    async _resolveMultiComponent(incomponent, plane, xymatrix, xyinverse, touchedHash, extraIn) {
        let component = this._component;
        let centerWorld = component._parent.transformlocalPointToWorldSpace(component._center);
        centerWorld = KinematicsUtility.closestPointOnPlane(plane, centerWorld);

        let componentpivot, newpivotafter;
        if (incomponent._behavior._extraComponent1 == component) {
            if (incomponent._behavior._extraComponent2) {
                componentpivot = incomponent._center;

            }
            else {
                componentpivot = incomponent._behavior._extraPivot1;
                if (incomponent._behavior._pivotType != pivotSystemType.endPrismatic) {
                    let lineend = incomponent.transformlocalPointToWorldSpace(componentpivot);
                    lineend = KinematicsUtility.closestPointOnPlane(plane, lineend);
                    let linestart = incomponent.transformlocalPointToWorldSpace(incomponent._center);
                    linestart = KinematicsUtility.closestPointOnPlane(plane, linestart);

                    let circlecenter = component.transformlocalPointToWorldSpace(component._center);
                    circlecenter = KinematicsUtility.closestPointOnPlane(plane, circlecenter);

                    let circleend = component.transformlocalPointToWorldSpace(componentpivot);
                    circleend = KinematicsUtility.closestPointOnPlane(plane, circleend);

                    if (extraIn) {
                        newpivotafter = this._circleIntersectionFromPoints(circlecenter, circleend, linestart, lineend, xymatrix, xyinverse);

                    }
                    else {
                        newpivotafter = this._circleLineIntersectionFromPoints(circlecenter, circleend, linestart, lineend, xymatrix, xyinverse);
                    }
                }
                else {
                    newpivotafter = incomponent.transformlocalPointToWorldSpace(componentpivot);
                    newpivotafter = KinematicsUtility.closestPointOnPlane(plane, newpivotafter);
                }

            }
        }
        else {
            componentpivot = incomponent._behavior._extraPivot1;
        }

        let pivotbefore = component._parent.transformlocalPointToWorldSpace(componentpivot);
        pivotbefore = KinematicsUtility.closestPointOnPlane(plane, pivotbefore);
        let pivotafter;
        if (newpivotafter) {
            pivotafter = newpivotafter;
        }
        else {
            pivotafter = incomponent.transformlocalPointToWorldSpace(componentpivot);
            pivotafter = KinematicsUtility.closestPointOnPlane(plane, pivotafter);
        }

        if (component._behavior._pivotType == pivotSystemType.centerPrismatic) {
            let delta = Communicator.Point3.subtract(pivotafter, pivotbefore).length();
            let limitdelta = delta;
            component._translate(delta);

            let test = component.transformlocalPointToWorldSpace(pivotbefore);
            component._translate(-delta);
            limitdelta = -delta;
            let test2 = component.transformlocalPointToWorldSpace(pivotbefore);
            let d1 = Communicator.Point3.subtract(test, pivotafter).length();
            let d2 = Communicator.Point3.subtract(test2, pivotafter).length();
            if (d1 < d2)
            {
                component._translate(delta);
                 limitdelta = delta;
            }
            if (this._component._enforceLimits && component._maxLimit && (limitdelta < component._minLimit  || limitdelta > component._maxLimit)) {
                this._component._hierachy._cantResolve = true;
            }


        }
        else {
            let angle = this._calculateAngle(pivotbefore, pivotafter, centerWorld);

            let centerComponent = component._parent.transformPointToComponentSpace(centerWorld);
            let pivotbeforeComponent = component._parent.transformPointToComponentSpace(pivotbefore);
            let matrix = this._findAngleSignMatrix(angle, component._axis, centerComponent, new Communicator.Matrix(), pivotbeforeComponent, pivotafter, component, plane);
            KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, matrix);
        }

        if (extraIn)
        {
            incomponent = null;
        }
        for (let c in this._associatedComponentHash) {
            if (this._associatedComponentHash[c] != incomponent) {
                if (this._associatedComponentHash[c]._behavior._mappedComponent == component) {
                    this._associatedComponentHash[c]._behavior._resolveMapped(component, plane, xymatrix, xyinverse, touchedHash);
                }
                else {
                    this._associatedComponentHash[c]._behavior._resolve(component, plane, xymatrix, xyinverse, touchedHash);
                }
            }
        }

        if (this._mappedComponent) {
            this._mappedComponent._behavior._resolveMapped(component, plane, xymatrix, xyinverse, touchedHash);
        }
    }

    async _resolve(incomponent, plane, xymatrix, xyinverse, touchedHash) {
        if (touchedHash[this._component._id]) {
            return;
        }
        touchedHash[this._component._id] = true;
        this._wasExecuted = true;

        if (this._pivotType == pivotSystemType.connector)
        {
            this._resolveConnectorComponent(incomponent, plane, xymatrix, xyinverse, touchedHash);
        }
        else if (this._pivotType == pivotSystemType.endRevolute || this._pivotType == pivotSystemType.endPrismatic || this._pivotType == pivotSystemType.endConnected) {
            this._resolveEndComponent(incomponent, plane, xymatrix, xyinverse, touchedHash);
        }
        else
        {
            this._resolveMultiComponent(incomponent, plane, xymatrix, xyinverse, touchedHash);

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
        * Retrieves the Mapped Component
        * @return {KinematicsComponent} Component
        */
    getMappedComponent() {
        return this._mappedComponent;
    }

    /**
      * Sets the Mapped Component
      * @param  {KinematicsComponent} component - Component
      */
    setMappedComponent(component) {
        this._mappedComponent = component;
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
        * Retrieves the helical factor
        * @return {number}  Helical Factor
        */
    getHelicalFactor() {
        return this._helicalFactor;
    }


    /**
        * Sets the helical factor
        * @param  {number} helicalFactor - Helical Factor
        */
    setHelicalFactor(helicalFactor) {
        this._helicalFactor = helicalFactor;
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
