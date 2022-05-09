import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsUtility } from './KinematicsUtility.js';

/** This class represents the behavior for a mate component (experimental)*/
export class KinematicsComponentBehaviorMate {


    constructor(component) {
        this._component = component;
        this._type = componentType.mate;

        this._extraComponent1 = null;
        this._extraPivot1 = null;
        this._extraComponent2 = null;
        this._extraPivot2 = null;
    }

    getType() {
        return this._type;
    }

    async fromJson(def, version) {
        this._extraComponent1 = def.extraComponent1;
        this._extraComponent2 = def.extraComponent2;

        this._extraPivot1 = Communicator.Point3.fromJson(def.extraPivot1);
        this._extraPivot2 = Communicator.Point3.fromJson(def.extraPivot2);
    }

    jsonFixup() {
        this._extraComponent1 = this._component.getHierachy().getComponentHash()[this._extraComponent1];
        this._extraComponent2 = this._component.getHierachy().getComponentHash()[this._extraComponent2];
    }

    toJson(def) {
        def.extraComponent1 = this._extraComponent1._id;
        def.extraComponent2 = this._extraComponent2._id;

        def.extraPivot1 = this._extraPivot1.toJson();
        def.extraPivot2 = this._extraPivot2.toJson();
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

    /**
       * Sets the extra pivot 2 
       * @param  {Point3} pivot - Pivot Point
       */
    setExtraPivot2(pivot) {
        this._extraPivot2 = pivot;
    }

    /**
       * Retrieves the Extra Pivot 2 
       * @return {Point3} Pivot
       */
    getExtraPivot2() {
        return this._extraPivot2;
    }

    async execute() {
        let component = this._component;

        let originallength = Communicator.Point3.subtract(this._extraPivot1, this._extraPivot2).length();
        let pivot1trans = this._extraComponent1.transformlocalPointToWorldSpace(this._extraPivot1);
        let pivot2trans = this._extraComponent2.transformlocalPointToWorldSpace(this._extraPivot2);

        let newlength = Communicator.Point3.subtract(pivot1trans, pivot2trans).length();

        if (Math.abs(originallength - newlength) > 0.001) {
            let reactcomponent;
            let triggercomponent;
            if (!this._extraComponent2._touched) {
                triggercomponent = { j: this._extraComponent1, pivot: this._extraPivot1 };
                reactcomponent = { j: this._extraComponent2, pivot: this._extraPivot2 };
            }
            else {
                reactcomponent = { j: this._extraComponent1, pivot: this._extraPivot1 };
                triggercomponent = { j: this._extraComponent2, pivot: this._extraPivot2 };

            }
            this._extraComponent1._touched = false;
            this._extraComponent2._touched = false;

            let pivot1trans = triggercomponent.j.transformlocalPointToWorldSpace(triggercomponent.pivot);
            let pivot2trans = reactcomponent.j.transformlocalPointToWorldSpace(reactcomponent.pivot);
            let center2trans = reactcomponent.j.transformlocalPointToWorldSpace(reactcomponent.j._center);


            //Calculate Plane Matrix and transform to XY Plane
            let transformedCenter = triggercomponent.j.transformlocalPointToWorldSpace(component._center);
            let transformedAxis = triggercomponent.j.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center, component._axis));
            let planenormal = Communicator.Point3.subtract(transformedAxis, transformedCenter).normalize();
            let planenormal2 = component._axis;

            let xymatrix = KinematicsUtility.ComputeVectorToVectorRotationMatrix(planenormal, new Communicator.Point3(0, 0, 1));
            let xyinverse = Communicator.Matrix.inverse(xymatrix);


            let center1_2d = xymatrix.transform(pivot1trans);
            let radius1 = originallength;

            let center2_2d = xymatrix.transform(center2trans);
            let radius2 = Communicator.Point3.subtract(reactcomponent.j._center, reactcomponent.pivot).length();

            //calculate circle/circle intersections
            let res = KinematicsUtility.circleIntersection(center1_2d.x, center1_2d.y, radius1, center2_2d.x, center2_2d.y, radius2);
            res.p1.z = center1_2d.z;
            res.p2.z = center1_2d.z;



            let res1 = xyinverse.transform(res.p1);
            let res2 = xyinverse.transform(res.p2);
            let dist1 = Communicator.Point3.subtract(res1, pivot2trans).length();
            let dist2 = Communicator.Point3.subtract(res2, pivot2trans).length();


            if (dist1 > dist2) {
                res1 = res2;
            }

            //_rotate mate component

            let pivot1trans_2 = triggercomponent.j.transformlocalPointToWorldSpace(reactcomponent.pivot);

            let v1 = Communicator.Point3.subtract(pivot1trans_2, pivot1trans).normalize();
            let v2 = Communicator.Point3.subtract(res1, pivot1trans).normalize();

            let angle = Communicator.Util.computeAngleBetweenVector(v1, v2);
            let mat = KinematicsUtility.computeOffaxisRotationMatrix(triggercomponent.pivot, planenormal2, angle);

            let invmatrix = Communicator.Matrix.inverse(KinematicsManager.viewer.model.getNodeNetMatrix(KinematicsManager.viewer.model.getNodeParent(component._nodeid)));

            let resmatrix = Communicator.Matrix.multiply(mat, KinematicsManager.viewer.model.getNodeNetMatrix(triggercomponent.j._nodeid));
            let resmatrix2 = Communicator.Matrix.multiply(resmatrix, invmatrix);
            await KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, resmatrix2);

            let r = component.transformlocalPointToWorldSpace(reactcomponent.pivot);
            if (Communicator.Point3.subtract(r, res1).length() > 0.0001) {
                mat = KinematicsUtility.computeOffaxisRotationMatrix(triggercomponent.pivot, planenormal2, -angle);
                resmatrix = Communicator.Matrix.multiply(mat, KinematicsManager.viewer.model.getNodeNetMatrix(triggercomponent.j._nodeid));
                let resmatrix2 = Communicator.Matrix.multiply(resmatrix, invmatrix);
                await KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, resmatrix2);

            }

            //_rotate react component

            pivot1trans_2 = reactcomponent.j._parent.transformlocalPointToWorldSpace(reactcomponent.pivot);

            v1 = Communicator.Point3.subtract(pivot1trans_2, center2trans).normalize();
            v2 = Communicator.Point3.subtract(res1, center2trans).normalize();

            angle = Communicator.Util.computeAngleBetweenVector(v1, v2);
            await reactcomponent.j._rotate(angle);
            let tm = this._hierachy.getReferenceNodeNetMatrix(reactcomponent.j);
            r = tm.transform(reactcomponent.pivot);

            await reactcomponent.j._rotate(-angle);
            tm = this._hierachy.getReferenceNodeNetMatrix(reactcomponent.j);
            let r2 = tm.transform(reactcomponent.pivot);

            dist1 = Communicator.Point3.subtract(r, res1).length();
            dist2 = Communicator.Point3.subtract(r2, res1).length();
            if (dist1 < dist2) {
                await reactcomponent.j._rotate(angle);
            }

            await this.getHierachy().updateComponents();

        }

    }

}
