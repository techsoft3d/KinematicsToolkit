import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsBelt } from './KinematicsBelt.js';
import { KinematicsManager } from './KinematicsManager.js';



/** This class represents the behavior for a mapped component.  
 * A mapped components movement is based on component referenced by mapped target.
*/
export class KinematicsComponentBehaviorMapped {

    constructor(component) {
        this._component = component;
        this._type = componentType.mapped;
        this._mappedType = null;
        this._mappedTargetComponent = null;
        this._helicalFactor = 1.0;
        this._prismaticPlanePlane = null;
        this._prismaticPlaneTip = null;


    }

    getType() {
        return this._type;
    }

    async fromJson(def,version) {
        this._mappedType = def.mappedType;
        this._helicalFactor = def.helicalFactor;
        this._mappedTargetComponent = def.mappedTargetComponent;
        if (this._mappedType == componentType.belt)
        {
            this.belt = new KinematicsBelt();
            this.belt.fromJson(def.belt, this._component);
           
        }

        if (this._mappedType == componentType.prismaticPlane)
        {
            let normal = Communicator.Point3.fromJson(def._prismaticPlanePlane.normal);
            this._prismaticPlanePlane = new Communicator.Plane();
            this._prismaticPlanePlane.d = def._prismaticPlanePlane.d;
            this._prismaticPlanePlane.normal = normal;
            this._prismaticPlaneTip = Communicator.Point3.fromJson(def._prismaticPlaneTip);
        }

        
    }

    async jsonFixup() {
        this._mappedTargetComponent = this._component.getHierachy().getComponentHash()[this._mappedTargetComponent];
        if (this._mappedType == componentType.belt)
        {            
            await this.belt.initialize();
            this._component._referenceNodes.push({nodeid:this.belt.getBaseNode(), matrix: new Communicator.Matrix()});


        }

    }

    toJson(def) {
        def.mappedType = this._mappedType;

        if (this._mappedType == componentType.belt) {
            def.parentMatrix = new Communicator.Matrix().toJson();
        }

        def.helicalFactor = this._helicalFactor;
        def.mappedTargetComponent = this._mappedTargetComponent._id;
        if (this._mappedType == componentType.belt)
        {
            def.belt = this.belt.toJson();
        }

        if (this._mappedType == componentType.prismaticPlane)
        {
            def._prismaticPlanePlane = {d: this._prismaticPlanePlane.d, normal: this._prismaticPlanePlane.normal.toJson()};
            def._prismaticPlaneTip = this._prismaticPlaneTip.toJson();
        }

    }

    getCurrentValue() {
    }

    set(value) {
    }

    getMovementType()
    {
        return componentType.fixed;
    }

    async execute() {
        let component = this._component;

        if (this._mappedType == componentType.prismaticPlane) {
            let matrix = KinematicsManager.viewer.model.getNodeNetMatrix(this._mappedTargetComponent._nodeid);
            let pp = matrix.transform(this._prismaticPlaneTip);
            let dist = this._prismaticPlanePlane.distanceToPoint(pp);
            if (dist < 0)
                await component._translate(dist * this._helicalFactor);
            else
                await component._translate(0);
        }
        else if (this._mappedTargetComponent._type == componentType.prismatic || (this._mappedTargetComponent._type == componentType.mapped && this._mappedTargetComponent._mappedType == componentType.prismatic)) {
            let savdelta = this._mappedTargetComponent._currentPosition;
            let savmatrix = KinematicsManager.viewer.model.getNodeMatrix(this._mappedTargetComponent._nodeid);
            let p1 = this._mappedTargetComponent._parent.transformlocalPointToWorldSpace(this._mappedTargetComponent._center);
            let p2 = this._mappedTargetComponent.transformlocalPointToWorldSpace(this._mappedTargetComponent._center);
            let length = Communicator.Point3.subtract(p2, p1).length();
            this._mappedTargetComponent._translate(length);
            let p3 = this._mappedTargetComponent.transformlocalPointToWorldSpace(this._mappedTargetComponent._center);
            this._mappedTargetComponent._translate(-length);
            let p4 = this._mappedTargetComponent.transformlocalPointToWorldSpace(this._mappedTargetComponent._center);
            if (Communicator.Point3.subtract(p3, p2).length() < Communicator.Point3.subtract(p4, p2).length())
                length = -length;
            KinematicsManager.viewer.model.setNodeMatrix(this._mappedTargetComponent._nodeid, savmatrix);

            if (this._mappedType == componentType.revolute) {
                await component._rotate(length * this._helicalFactor, true);
                component._currentAngle = length * this._helicalFactor;
            }
            else if (this._mappedType == componentType.prismatic)
                await component._translate(length * this._helicalFactor, true);
            else if (this._mappedType == componentType.belt)
                await this.belt.move(length * this._helicalFactor);

            this._mappedTargetComponent._currentPosition = savdelta;
        }
        else if (this._mappedTargetComponent._behavior.getMovementType() == componentType.revolute || this._mappedTargetComponent._type == componentType.mapped) {

            if (this._mappedType == componentType.revolute) {
                await component._rotate(this._mappedTargetComponent._currentAngle * this._helicalFactor, true);
                component._currentAngle = this._mappedTargetComponent._currentAngle * this._helicalFactor;
            }
            else if (this._mappedType == componentType.prismatic)
                await component._translate(this._mappedTargetComponent._currentAngle * this._helicalFactor, true);
            else if (this._mappedType == componentType.belt)
                await this.belt.move(this._mappedTargetComponent._currentAngle * this._helicalFactor);
        }


    }
    /**
        * Sets the mapped type of a component (applicable to componentType.mapped)
        * @param  {componentType} mappedType - Mapped Type
        */
    setMappedType(mappedType) {
        this._mappedType = mappedType;
    }

    /**
    * Retrieves the mapped type of a component (applicable to componentType.mapped)
    * @return {componentType} Mapped Type
    */
    getMappedType() {
        return this._mappedType;
    }

    createBelt() {
    
        this.belt = new KinematicsBelt();
    }

    /**
        * Sets the mapped target component (applicable to componentType.mapped)
        * @param  {KinematicsComponent} component - Component
        */
    setMappedTargetComponent(component) {
        this._mappedTargetComponent = component;
    }

    /**
       * Retrieves the mapped target component (applicable to componentType.mapped)
       * @return {KinematicsComponent} Component
       */
    getMappedTargetComponent() {
        return this._mappedTargetComponent;
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
     * Sets the plane for the prismatic plane component  (applicable to componentType.mapped with mapped type set to componentType.prismaticPlane)
     * @param  {Plane} plane - Plane
     */     
  setPrismaticPlanePlane(plane)
  {
      this._prismaticPlanePlane = plane;
  }

/**
   * Retrieves the plane for the prismatic plane component (applicable to componentType.mapped with mapped type set to componentType.prismaticPlane)
   * @return {Plane} Plane
   */          
  getPrismaticPlanePlane()
  {
      return this._prismaticPlanePlane;
  }

/**
   * Sets the tip for the prismatic plane component  (applicable to componentType.mapped with mapped type set to componentType.prismaticPlane)
   * @param  {Point3} tip - Tip
   */         
  setPrismaticPlaneTip(tip)
  {
      this._prismaticPlaneTip = tip;
  }

/**
   * Retrieves the tip for the prismatic plane component (applicable to componentType.mapped with mapped type set to componentType.prismaticPlane)
   * @return {Point3} Tip
   */             
  getPrismaticPlaneTip()
  {
      return this._prismaticPlaneTip;
  }
  
 /**
     * Retrieves the belt object for this component (applicable to componentType.mapped with mapped type set to componentType.belt)
     * @return {KinematicsBelt} Belt Object
     */      
  getBelt()
  {
      return this.belt;
  }
}
