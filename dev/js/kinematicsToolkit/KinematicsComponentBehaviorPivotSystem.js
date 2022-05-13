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
        if (component._touched)
        {
            let plane = component.getWorldPlane();
            let xymatrix = component.getXYMatrix();
            let xyinverse = Communicator.Matrix.inverse(xymatrix);


            for (let c in this._associatedComponentHash) {
                this._associatedComponentHash[c]._behavior._resolve(this._component,plane, xymatrix, xyinverse);
            }                    
            component._touched = false;
        }
    }


    _circleIntersectionFromPoints(p1, p2, p3, p4, xymatrix,xyinverse) {

        
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

        if (l1 < l2)
        {
            return pp1;
        }
        else
        {
            return pp2;
        }
    }
    

    _calculateAngle(p1,p2,p3)
    {
        let v1 = Communicator.Point3.subtract(p1, p3).normalize();
        let v2 = Communicator.Point3.subtract(p2, p3).normalize();
        return Communicator.Util.computeAngleBetweenVector(v1, v2);
    }

    _findAngleSignMatrix(angle, normal, pivot,deltamatrix,outpivot, targetpoint)
    {
        let rotmatrix = this._component._calculateAngleRotMatrix(angle,undefined,normal,pivot);
        let totalmatrix = Communicator.Matrix.multiply(deltamatrix, rotmatrix);
        let test = this._component.transformlocalPointToWorldSpaceWithMatrix(outpivot, totalmatrix); 
        let dist1 = Communicator.Point3.subtract(test, targetpoint).length();

        let rotmatrix2 = this._component._calculateAngleRotMatrix(-angle,undefined,normal,pivot);
        let totalmatrix2 = Communicator.Matrix.multiply(deltamatrix, rotmatrix2);
        let test2 = this._component.transformlocalPointToWorldSpaceWithMatrix(outpivot, totalmatrix2); 
        let dist2 = Communicator.Point3.subtract(test2, targetpoint).length();

        if (dist1 < dist2)
        {
            return totalmatrix;
        }
        else
        {
            return totalmatrix2;
        }
    }

    async _resolve(incomponent, plane, xymatrix, xyinverse) {
        let component = this._component;
        if (!this._associatedComponentHash)
        {
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
            outpivotWorld =  KinematicsUtility.closestPointOnPlane(plane, outpivotWorld);
            outcenterWorld =  KinematicsUtility.closestPointOnPlane(plane, outcenterWorld);

            let inpivotComponent = component._parent.transformPointToComponentSpace(inpivotWorld);
            let currentpivotComponent = component._parent.transformPointToComponentSpace(currentpivotWorld);
            let delta = Communicator.Point3.subtract(inpivotComponent,currentpivotComponent);         

            let deltamatrix = new Communicator.Matrix();
            deltamatrix.setTranslationComponent(delta.x, delta.y, delta.z);
            KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, deltamatrix);

            let outpivotWorldCurrent = component.transformlocalPointToWorldSpace(outpivot);
            outpivotWorldCurrent =  KinematicsUtility.closestPointOnPlane(plane, outpivotWorldCurrent);
            
             let intersect = this._circleIntersectionFromPoints(inpivotWorld, outpivotWorldCurrent, outcenterWorld, outpivotWorld,xymatrix, xyinverse);

       //     ViewerUtility.createDebugCube(KinematicsManager.viewer, intersect, 10, new Communicator.Color(255, 0, 0));

            let angle = this._calculateAngle(outpivotWorldCurrent, intersect, inpivotWorld);

            //let inpivotComponent =  this._parent.transformPointToComponentSpace(inpivotWorld);

            let totalmatrix = this._findAngleSignMatrix(angle, component._axis,inpivotComponent, deltamatrix,outpivot, intersect);           



//             ViewerUtility.createDebugCube(KinematicsManager.viewer, test, 10, new Communicator.Color(0, 0, 255));

            KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, totalmatrix);
            outcomponent._behavior._resolve(component,plane,xymatrix,xyinverse);
        }        
        else
        {            
            let centerWorld = component.transformlocalPointToWorldSpace(component._center);
            centerWorld = KinematicsUtility.closestPointOnPlane(plane, centerWorld);

            let componentpivot;
            if (incomponent._behavior._extraComponent1 == component)
            {
                componentpivot = incomponent._center;            
            }
            else
            {
                componentpivot = incomponent._behavior._extraPivot1;            
            }

            let pivotbefore = incomponent._parent.transformlocalPointToWorldSpace(componentpivot);
            pivotbefore = KinematicsUtility.closestPointOnPlane(plane, pivotbefore);
            let pivotafter = incomponent.transformlocalPointToWorldSpace(componentpivot);
            pivotafter = KinematicsUtility.closestPointOnPlane(plane, pivotafter);
            
            let angle = this._calculateAngle(pivotbefore, pivotafter, centerWorld);

            let centerComponent = component._parent.transformPointToComponentSpace(centerWorld);
            let matrix = this._findAngleSignMatrix(angle, component._axis, centerComponent,new Communicator.Matrix(), pivotbefore, pivotafter);
            KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, matrix);

            for (let c in this._associatedComponentHash)
            {
                if (this._associatedComponentHash[c] != incomponent)
                {
                    await this._associatedComponentHash[c]._behavior._resolve(component,plane, xymatrix, xyinverse);
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
