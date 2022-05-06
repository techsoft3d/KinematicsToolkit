import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsBelt } from './KinematicsBelt.js';
import { KinematicsUtility } from './KinematicsUtility.js';


/**
 * Type of Component.
 * @readonly
 * @enum {number}
 */
const componentType = {
     /** Rotation around an axis.  
      * Use setCenter() and setAxis() to define the rotation axis
     */
    revolute: 0,
     /** Translation along an axis.  
      * Use setCenter() and setAxis() to define the translation axis
      */
     prismatic: 1,
     /** Fixed. No Movement */
    fixed:2,
     /** Aggregates the position of two components.  
      * Use setExtraComponent1() and setExtraComponent2() to define the components
      */
     prismaticAggregate: 3,
 /** Calculates hinge movement based on static and variable component.  
      * Use setExtraComponent1() and setExtracComponent2() to define related component.
      */    
     prismaticTriangle: 4,
  /** Performs a rotation when the component is translated  
      * Use setHelicalFactor() to set rotation factor.
      */     
     helical: 5,
       /** Moves Component based on component referenced by mapped target.  
      * Use setMappedTargetComponent() to specify mapped component and specify mapped type with setMappedType().
      */    
    mapped: 6,
   /** Calculates piston movement.  
      * Use setExtraComponent1()  to define related component (must be parent of this component).
      */    
    pistonController: 7,
 /**  Restricts movement by plane. Only valid as mapped type.  
      * Use setPrismaticPlanePlane() and setPrismaticPlaneTip() to define plane
      */        
  prismaticPlane: 8,
  /**  Creates a belt/conveyor. Only valid as mapped type.  
      * Use getBelt() to set belt parameters.
      */        
    belt:9,
 /** Experimental. WIP
      */          
    mate:10,
/** Experimental. WIP
      */          
    revoluteSlide:11,
/** Component that is positioned based on other components  
      */            
    target:12,
    pivotConnector:13
};

export {componentType};
 
/** This class represents a Kinematics Component*/
export class KinematicsComponent {
 /**
     * Creates a Kinematic Component Object
     * @param  {KinematicsComponent} parent - Parent Component
     * @param  {KinematicsHierachy} hierachy - Hierachy this component belongs to 
     */
    constructor(parent, hierachy) {
        this._hierachy = hierachy;
        this._id = hierachy._highestId++;

        this._type = componentType.revolute;
        this._mappedType = null;

        this._children = [];
        this._parent = parent;

        this._minLimit = undefined;
        this._maxLimit = undefined;

        this._nodeid = -1;

        this._center = new Communicator.Point3(0, 0, 0);
        this._axis = new Communicator.Point3(1, 0, 0);

        this._currentAngle = 0;

        this._currentPosition = 0;

        this._fixedAxis = null;
        this._fixedAxisTarget = null;

        this._referenceNodes = [];
        this._parentMatrix = new Communicator.Matrix();

        this._extraComponent1 = null;
        this._extraComponent2 = null;

        this._mappedTargetComponent = null;

        this._targetPivot = null;

        this._helicalFactor = 1.0;
        this._reference = true;
        this._touched = false;

        this._animations = [];

        this._activeAnimation = false;
    }

 
    initialize(nodeids, isReference) {
        this._reference = isReference;
        if (!this._parent)
            this._nodeid = KinematicsManager.viewer.model.createNode(KinematicsManager.viewer.model.getRootNode(), "rootComponent");
        else
            this._nodeid = KinematicsManager.viewer.model.createNode(this._parent._nodeid, "component");

        this._parentMatrix = KinematicsManager.viewer.model.getNodeNetMatrix(KinematicsManager.viewer.model.getNodeParent(nodeids[0]));

        for (let i = 0; i < nodeids.length; i++) {
            this._referenceNodes.push({ nodeid: nodeids[i], matrix: KinematicsManager.viewer.model.getNodeNetMatrix(nodeids[i]).copy() });
        }
    }

     /**
    * Retrieve Component Id
    * @return {number} Component ID
     */      
    getId()
    {
        return this._id;
    }


   /**
     * Sets type of component
     * @param  {componentType} type - Component Type
     */
    setType(type)
    {
        this._type = type;
    }

   /**
     * Retrieves type of component
     * @return {componentType} Component Type
     */
    getType()
    {
        return this._type;
    }

     /**
     * Sets component parent
     * @param  {KinematicsComponent} parent - Parent Component
     */
    setParent(parent)
    {
        this._parent = parent;
    }

 /**
     * Retrieves parent of component
     * @return {KinematicsComponent} Component Parent
     */
    getParent()
    {
        return this._parent;
    }

     /**
     * Retrieves all children of component
     * @return {array} Array of children components
     */
    getChildren()
    {
        return this._children;
    }

     /**
     * Retrieves a child component by its index
     * @param  {number} i - Index of child component
     * @return {KinematicsComponent} Child Component
     */
    getChildByIndex(i)
    {
        return this._children[i];
    }

    /**
     * Sets the mapped type of a component (applicable to componentType.mapped)
     * @param  {componentType} mappedType - Mapped Type
     */
    setMappedType(mappedType)
    {
        this._mappedType = mappedType;
    }

     /**
     * Retrieves the mapped type of a component (applicable to componentType.mapped)
     * @return {componentType} Mapped Type
     */
    getMappedType()
    {
        return this._mappedType;
    }

    setNodeId(nodeid)
    {
        this._nodeid = nodeid;
    }

    getNodeId()
    {
        return this._nodeid;
    }


     /**
     * Retrieves the hierachy associated with a component
     * @return {KinematicsHierachy} Hierachy
     */    
    getHierachy()
    {
        return this._hierachy;
    }

    /**
     * Sets the component center
     * @param  {Point3} center - Component Center
     */    
    setCenter(center)
    {
        this._center = center;
    }


     /**
     * Retrieves the component center
     * @return {Point3} Component Center
     */        
    getCenter()
    {
        return this._center;
    }

   /**
     * Sets the component axis
     * @param  {Point3} axis - Component Axis
     */    
    setAxis(axis)
    {
        this._axis = axis;
    }

 /**
     * Retrieves the component axis
     * @return {Point3} Component Axis
     */           
    getAxis()
    {
        return this._axis;
    }


 /**
     * Retrieves the value of the current component (angle or relative position)
     * @return {number} Current Value
     */             
    getCurrentValue()
    {
        if (this._type == componentType.revolute || this._type == componentType.pivotConnector)
            return this._currentAngle;
        else if (this._type == componentType.prismatic || this._type == componentType.helical)
            return this._currentPosition;
    }


    getReferenceNodes()
    {
        return this._referenceNodes;
    }


    getParentMatrix()
    {
        return this._parentMatrix;
    }

    
 /**
     * Retrieves the Extra Component 1 (not applicable to all component types)
     * @return {KinematicsComponent} Component
     */       
    getExtraComponent1()
    {
        return this._extraComponent1;
    }


   /**
     * Sets the extra component 1
     * @param  {KinematicsComponent} component - Component
     */     
    setExtraComponent1(component)
    {
        this._extraComponent1 = component;
    }

 /**
     * Retrieves the Extra Component 2 (not applicable to all component types)
     * @return {KinematicsComponent} Component
     */       
    getExtraComponent2()
    {
        return this._extraComponent2;
    }

   /**
     * Sets the extra component 2
     * @param  {KinematicsComponent} component - Component
     */     
    setExtraComponent2(component)
    {
        this._extraComponent2 = component;
    }

 /**
     * Sets the extra pivot 1 (applicable to componentType.revoluteSlide and componentType.mate)
     * @param  {Point3} pivot - Pivot Point
     */         
    setExtraPivot1(pivot)
    {
        this._extraPivot1 = pivot;
    }


 /**
     * Retrieves the Extra Pivot 1 (applicable to componentType.revoluteSlide and componentType.mate)
     * @return {Point3} Pivot
     */     
    getExtraPivot1()
    {
        return this._extraPivot1;
    }


 /**
     * Sets the extra pivot 2 (applicable to componentType.mate)
     * @param  {Point3} pivot - Pivot Point
     */     
    setExtraPivot2(pivot)
    {
        this._extraPivot2 = pivot;
    }


 /**
     * Retrieves the Extra Pivot 2 (applicable to componentType.mate)
     * @return {Point3} Pivot
     */         
    getExtraPivot2()
    {
        return this._extraPivot2;
    }


 /**
     * Sets the mapped target component (applicable to componentType.mapped)
     * @param  {KinematicsComponent} component - Component
     */         
    setMappedTargetComponent(component)
    {
        this._mappedTargetComponent = component;
    }


 /**
     * Retrieves the mapped target component (applicable to componentType.mapped)
     * @return {KinematicsComponent} Component
     */       
    getMappedTargetComponent()
    {
        return this._mappedTargetComponent;
    }


 /**
     * Sets the helical factor (applicable to componentType.mapped and componentType.helical)
     * @param  {number} helicalFactor - Helical Factor
     */       
    setHelicalFactor(helicalFactor)
    {
        this._helicalFactor = helicalFactor;
    }


 /**
     * Retrieves the helical factor (applicable to componentType.mapped and componentType.helical)
     * @return {number}  Helical Factor
     */    
    getHelicalFactor()
    {
        return this._helicalFactor;
    }



 /**
     * Sets if component is a reference component  
     * Reference Components are components that are NOT children of their parent component in the HC node hierachy
     * @param  {bool} isReference - Is Component a Reference Component
     */ 
    setIsReference(isReference) {
        this._reference = isReference;
    }


 /**
     * Retrieves if component is a reference component  
     * Reference Components are components that are NOT children of their parent component in the HC node hierachy
     * @return {bool} Is Component a Reference Component
     */ 
    getIsReference() {
        return this._reference;
    }


 /**
     * Retrieves all animations associated with a component   
     * @return {array} Array of Animation Template Ids
     */     
    getAnimations() {
        return this._animations;
    }


 /**
     * Retrieves if an animation is currently active on a component
     * @return {bool} Is Animation Active
     */         
    getAnimationActive() {
        return this._activeAnimation;

    }

    setAnimationActive(active) {
        this._activeAnimation = active;
        
    }


 /**
     * Retrieves an animation associated with a component by its index
     * @param  {number} i - Index of animation
     * @return {uuid} Animation Template Id
     */         
    getAnimationByIndex(i) {
        return this._animations[i];
    }


 /**
     * Sets the minimum limit value for a component
     * @param  {number} minlimit - minimum limit
     */ 
    setMinLimit(minlimit)
    {
        this._minLimit = minlimit;
    }


 /**
     * Retrieves the minimum limit value for a component
     * @return {number} minimum limit
     */    
    getMinLimit()
    {
        return this._minLimit;
    }


 /**
     * Sets the maximum limit value for a component
     * @param  {number} minlimit - minimum limit
     */     
    setMaxLimit(maxlimit)
    {
        this._maxLimit = maxlimit;
    }

 /**
     * Retrieves the maximum limit value for a component
     * @return {number} maximum limit
     */  
    getMaxLimit()
    {
        return this._maxLimit;
    }

 /**
     * Sets the fixed axis for this component (applicable to componentType.revolute)  
     * This defines the axis that is fixed in the component
     * @param  {Point3} axis - Fixed Axis
     */ 
    setFixedAxis(axis)
    {
        this._fixedAxis = axis;
    }

 /**
     * Sets the fixed axis target for this component (applicable to componentType.revolute)  
     * This defines the axis that the fixed axis will be rotated to.
     * @param  {Point3} axis - Fixed Axis Target
     */ 
    setFixedAxisTarget(axis)
    {
        this._fixedAxisTarget = axis;
    }

 /**
     * Retrieves the fixed axis for this component (applicable to componentType.revolute)  
     * @return {Poin3} Fixed Axis
     */      
    getFixedAxis()
    {
        return this._fixedAxis;
    }

    
 /**
     * Retrieves the belt object for this component (applicable to componentType.mapped with mapped type set to componentType.belt)
     * @return {KinematicsBelt} Belt Object
     */      
    getBelt()
    {
        return this.belt;
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
     * Sets the value (rotation or translation) for the component (applicable to componentType.prismatic or componentType.revolute)
     * @param  {number} value - Value
     */ 
    set(value) {

        if (this._type == componentType.revolute || this._type == componentType.pivotConnector) {
            this._rotate(value);
        }        
        else if (this._type == componentType.prismatic || this._type == componentType.helical)
        {
            this._translate(value);
        }
    }

    toJson() {

        let children = [];
        for (let i = 0; i < this._children.length; i++) {
            children.push(this._children[i].toJson());
        }
        let refnodes = [];
        if (this._type == componentType.mapped && (this._mappedType == componentType.belt)) {
            for (let i = 0; i < this._referenceNodes.length; i++) {
                if (this._referenceNodes[i].nodeid != this.belt.getBaseNode())
                    refnodes.push({ nodeid: this._referenceNodes[i].nodeid, matrix: this._referenceNodes[i].matrix.toJson() });

            }
        }
        else {
            for (let i = 0; i < this._referenceNodes.length; i++) {
                refnodes.push({ nodeid: this._referenceNodes[i].nodeid, matrix: this._referenceNodes[i].matrix.toJson() });
            }
        }

        let def = { nodeid: this._nodeid, id: this._id, mappedType: this._mappedType,reference: this._reference, type: this._type,center: this._center.toJson(), axis: this._axis.toJson(), minangle: this._minLimit, maxangle: this._maxLimit, children: children, referenceNodes:refnodes,
            parentMatrix: this._parentMatrix.toJson() };

        if (this._mappedType == componentType.belt) {
            def.parentMatrix = new Communicator.Matrix().toJson();
        }

        if (this._type == componentType.prismaticTriangle || this._type == componentType.prismaticAggregate || this._type == componentType.mate)            
        {
            def.extraComponent1 = this._extraComponent1._id;
            def.extraComponent2 = this._extraComponent2._id;

            if (this._type == componentType.mate)            
            {
                def.extraPivot1 = this._extraPivot1.toJson();
                def.extraPivot2 = this._extraPivot2.toJson();
            }
        }
        else if (this._type == componentType.revoluteSlide)            
        {
            def.extraComponent1 = this._extraComponent1._id;
            def.extraPivot1 = this._extraPivot1.toJson();

        }
        else if (this._type == componentType.pivotConnector)            
        {
            if (this._extraComponent1)
                def.extraComponent1 = this._extraComponent1._id;
            if (this._extraPivot1)
                def.extraPivot1 = this._extraPivot1.toJson();

        }
        else if (this._type == componentType.pistonController)            
        {
            def.extraComponent1 = this._extraComponent1._id;
        }
        else if (this._type == componentType.helical)            
        {
            def.helicalFactor = this._helicalFactor;
        }
        else if (this._type == componentType.mapped)            
        {
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
        else if (this._type == componentType.revolute)            
        {
            if (this._fixedAxis)
            {
                def.fixedAxis = this._fixedAxis.toJson();
                def.fixedAxisTarget = this._fixedAxisTarget.toJson();
            }
        }

        def.animations = [];
        for (let i=0;i<this._animations.length;i++)
        {
            def.animations.push(this._animations[i]);
        }
        return def;
    }

    async fromJson(def, version) {
        this._minLimit = def.minangle;
        this._maxLimit = def.maxangle;
        this._reference = def.reference;
        this._center = Communicator.Point3.fromJson(def.center);

        if (def.id != undefined)
        {
            this._id = def.id;

            if (this._id >= this._hierachy._highestId)
                this._hierachy._highestId = this._id+1;
        }

        if (version == undefined)
        {
            let axis = Communicator.Point3.fromJson(def.axis);
            this._axis = Communicator.Point3.subtract(axis,this._center).normalize();
            if (isNaN(this._axis.x))
            {
                this._axis = new Communicator.Point3(1,0,0);
            }
        }
        else
        {
            this._axis = Communicator.Point3.fromJson(def.axis);
        }

        this._type = def.type;
        this._mappedType = def.mappedType;
        this._parentMatrix = Communicator.Matrix.fromJson(def.parentMatrix);
        this._hierachy.getComponentHash()[this._id] = this;
    
        if (!this._parent)
            this._nodeid = KinematicsManager.viewer.model.createNode(KinematicsManager.viewer.model.getRootNode(), "rootComponent");
        else
            this._nodeid = KinematicsManager.viewer.model.createNode(this._parent._nodeid, "component");
        for (let i=0;i<def.referenceNodes.length;i++)
        {
            this._referenceNodes.push({nodeid:def.referenceNodes[i].nodeid, matrix: Communicator.Matrix.fromJson(def.referenceNodes[i].matrix)});
            this._hierachy._componentNodeidHash[def.referenceNodes[i].nodeid] = this;
        }
        
        if (this._type == componentType.prismaticTriangle || this._type == componentType.prismaticAggregate || this._type == componentType.mate)            
        {
            this._extraComponent1 = def.extraComponent1;
            this._extraComponent2 = def.extraComponent2;
            if (this._type == componentType.mate)
            {
                this._extraPivot1 = Communicator.Point3.fromJson(def.extraPivot1);
                this._extraPivot2 = Communicator.Point3.fromJson(def.extraPivot2);
            }
        }
        else if (this._type == componentType.pivotConnector)
        {
            if (def.extraComponent1)
            {
                this._extraComponent1 = def.extraComponent1;
            }
            if (def.extraPivot1)
            {
                this._extraPivot1 = Communicator.Point3.fromJson(def.extraPivot1);
            }
        }         
        else if (this._type == componentType.revoluteSlide)
        {
            this._extraComponent1 = def.extraComponent1;
            this._extraPivot1 = Communicator.Point3.fromJson(def.extraPivot1);
        }         
        else if (this._type == componentType.pistonController)            
        {
            this._extraComponent1 = def.extraComponent1;
        }
        else if (this._type == componentType.helical)            
        {
            this._helicalFactor = def.helicalFactor;
        }
        else if (this._type == componentType.mapped)            
        {
            this._helicalFactor = def.helicalFactor;
            this._mappedTargetComponent = def.mappedTargetComponent;
            if (this._mappedType == componentType.belt)
            {
                this.belt = new KinematicsBelt();
                this.belt.fromJson(def.belt, this);
                for (let i=0;i<this._referenceNodes.length;i++)
                {
                    KinematicsManager.viewer.model.setNodesVisibility([this._referenceNodes[i].nodeid], false);
                }
                await this.belt.initialize();
                this._referenceNodes.push({nodeid:this.belt.getBaseNode(), matrix: new Communicator.Matrix()});

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
        else if (this._type == componentType.revolute)            
        {
            if (def.fixedAxis)
            {

                if (version == undefined) {
                    let axis = Communicator.Point3.fromJson(def.fixedAxis);
                    this._fixedAxis = Communicator.Point3.subtract(axis, this._center).normalize();
                }
                else
                    this._fixedAxis = Communicator.Point3.fromJson(def.fixedAxis);
                this._fixedAxisTarget = Communicator.Point3.fromJson(def.fixedAxisTarget);
            }
        }


        for (let i = 0; i < def.children.length; i++) {
            let component = new KinematicsComponent(this, this._hierachy);

            component.fromJson(def.children[i], version);
            this._children.push(component);
        }

        if (def.animations) {
            for (let i = 0; i < def.animations.length; i++) {
                this._animations.push(def.animations[i]);
            }
        }
    }


    
 /**
     * Add an animation template id to the component.
     * @param  {uuid} animationid - Animation ID
     */ 
    addAnimation(animationid)
    {
        this._animations.push(animationid);
    }

  
 /**
     * Remove an animation from the component based on its template id.
     * @param  {uuid} animationid - Animation ID
     */     
    removeAnimation(animationid)
    {
        for (let i=0;i<this._animations.length;i++)
        {
            if (this._animations[i] == animationid)
            {
                this._animations.splice(i,1);
                return;
            }
        }       
    }

    removeAnimationRecursive(_templateId) {

        for (let i = 0; i < this._children.length; i++) {
            this._children[i].removeAnimationRecursive(_templateId);
        }      
      this.removeAnimation(_templateId);
    }
    

    animToJson(animhash) {

        for (let i = 0; i < this._children.length; i++) {
            this._children[i].animToJson(animhash);
        }      
        for (let i=0;i<this._animations.length;i++)
        {
            animhash[this._animations[i]] = true;
        }
    }

  
 /**
     * Update all HOOPS Communicator nodes associated with this component
     * @param  {array} nodeids - Array of nodeids to associate with this component
     */     
    updateReferenceNodes(nodeids)
    {
        for (let i = 0; i < this._referenceNodes.length; i++) {            
            delete this._hierachy._componentNodeidHash[this._referenceNodes[i].nodeid];
        }        
        this._referenceNodes = [];
        for (let i = 0; i < nodeids.length; i++) {
            this._referenceNodes.push({ nodeid: nodeids[i], matrix: KinematicsManager.viewer.model.getNodeNetMatrix(nodeids[i]).copy()});
            this._hierachy._componentNodeidHash[this._referenceNodes[i].nodeid] = this;
        }

    }


  
 /**
     * Remove all nodes specified in the supplied array from the component
     * @param  {array} nodeids - Array of nodeids to remove from the component
     */         
    removeReferenceNodes(nodeids) {
        for (let i = 0; i < this._referenceNodes.length; i++) {
            for (let j = 0; j < nodeids.length; j++) {
                if (this._referenceNodes[i].nodeid == nodeids[j]) {
                    delete this._hierachy._componentNodeidHash[this._referenceNodes[i].nodeid];
                    this._referenceNodes.splice(i, 1);
                    i--;
                    break;
                }
            }
        }
    }



 /**
     * Aligns the component related to the piston controller to its plane
     */     
    adjustExtraComponentToPistonController()
    {

        let naxis = component._axis;
        let plane = Communicator.Plane.createFromPointAndNormal(component._center, naxis);
        let pol = KinematicsUtility.closestPointOnPlane(plane, component._extraComponent1._center);
        
        component._extraComponent1._axis = component._extraComponent1._axis.copy();
        component._extraComponent1._center = pol;
    }


    transformPointToComponentSpace(pos)
    {
       
        let netmatrix = this._hierachy.getReferenceNodeNetMatrix(this);
        let netmatrixinverse = Communicator.Matrix.inverse(netmatrix);
        return netmatrixinverse.transform(pos);    
    }

    transformlocalPointToWorldSpace(pos)    
    {

        let mat = this._hierachy.getReferenceNodeNetMatrix(this);
        return mat.transform(pos);


    }


     _rotate(angle, ignoreLimits, add) {
        // if (ignoreLimits == undefined) {
        //     if (angle > this._maxangle)
        //         angle = this._maxangle;
        //     if (angle < this._minangle)
        //         angle = this._minangle;
        // }

        if (add)
        {       
            if (this._minLimit != undefined)
            {
                if (this._currentAngle + angle < this._minLimit)
                {
                    angle = this._minLimit - this._currentAngle;
                }
            }
    
               
            if (this._maxLimit != undefined)
            {
                if (this._currentAngle + angle > this._maxLimit)
                {
                    angle = this._maxLimit - this._currentAngle;
    
                }            
            }            

            this._currentAngle += angle;
        }
        else {
            this._currentAngle = angle;

            if (this._minLimit != undefined) {
                if (this._currentAngle < this._minLimit) {
                    this._currentAngle = this._minLimit;
                    angle = this._currentAngle;
                }
            }


            if (this._maxLimit != undefined) {
                if (this._currentAngle > this._maxLimit) {
                    this._currentAngle = this._maxLimit;
                    angle = this._currentAngle;

                }
            }
        }
            
        let offaxismatrix = new Communicator.Matrix();
        let transmatrix = new Communicator.Matrix();
        let resaxis = this._axis;

        transmatrix = new Communicator.Matrix();
        transmatrix.setTranslationComponent(-this._center.x, -this._center.y, -this._center.z);

        let invtransmatrix = new Communicator.Matrix();
        invtransmatrix.setTranslationComponent(this._center.x, this._center.y, this._center.z);

        Communicator.Util.computeOffaxisRotation(resaxis, angle, offaxismatrix);

        let result = Communicator.Matrix.multiply(transmatrix, offaxismatrix);
        let result2 = Communicator.Matrix.multiply(result, invtransmatrix);

        if (add != undefined) {
            let localmatrix = KinematicsManager.viewer.model.getNodeMatrix(this._nodeid);
            let final3 = Communicator.Matrix.multiply(localmatrix, result2);
             KinematicsManager.viewer.model.setNodeMatrix(this._nodeid, final3);
        }
        else
             KinematicsManager.viewer.model.setNodeMatrix(this._nodeid, result2);
        this._touched = true;

    }

    _translate(delta) {

        if (this._minLimit != undefined)
        {
            if (delta < this._minLimit)
            {
                delta = this._minLimit;
            }
        }

           
        if (this._maxLimit != undefined)
        {
            if (delta > this._maxLimit)
            {
                delta = this._maxLimit;
            }
        }

        
        this._currentPosition = delta;

        let offaxismatrix = new Communicator.Matrix();
        let transmatrix = new Communicator.Matrix();
        let resaxis = this._axis;
        transmatrix = new Communicator.Matrix();
        transmatrix.setTranslationComponent(-this._center.x, -this._center.y, -this._center.z);

        let invtransmatrix = new Communicator.Matrix();
        invtransmatrix.setTranslationComponent(this._center.x, this._center.y, this._center.z);

        let deltamatrix = new Communicator.Matrix();
        deltamatrix.setTranslationComponent(resaxis.x * delta, resaxis.y * delta,resaxis.z * delta);

        let result = Communicator.Matrix.multiply(transmatrix, deltamatrix);
        let result2 = Communicator.Matrix.multiply(result, invtransmatrix);

        KinematicsManager.viewer.model.setNodeMatrix(this._nodeid, result2);
        this._touched = true;

    }

   

   
 /**
     * Derives component matrix from active handle matrix
     * @param  {object} matrix - Handle Matrix
     */ 

    async calculateMatrixFromHandleMatrix(matrix) {
        let resmatrix;
        if (this._reference) {
            let matrixx = Communicator.Matrix.multiply(matrix, this._parentMatrix);
            let inverse = Communicator.Matrix.inverse(this._referenceNodes[0].matrix);
            let resmatrix2 = Communicator.Matrix.multiply(inverse, matrixx);

            let localmatrix;

            if (this._parent._parent)
                localmatrix = this._hierachy.getReferenceNodeNetMatrix(this._parent);
            else
                localmatrix = new Communicator.Matrix();
            inverse = Communicator.Matrix.inverse(localmatrix);

            resmatrix = Communicator.Matrix.multiply(resmatrix2, inverse);

  //          await KinematicsManager.viewer.model.setNodeMatrix(this._nodeid, resmatrix2);
        }
        else {
            let matrixx = Communicator.Matrix.multiply(matrix, this._parentMatrix);
            let inverse = Communicator.Matrix.inverse(this._referenceNodes[0].matrix);
            resmatrix = Communicator.Matrix.multiply(inverse, matrixx);
//            await KinematicsManager.viewer.model.setNodeMatrix(this._nodeid, resmatrix);
        }


        if (this._type == componentType.revolute || this._type == componentType.pivotConnector) 
        {
            let origmatrix = KinematicsManager.viewer.model.getNodeMatrix(this._nodeid);

            
            let localaxis = this._axis;

            let axis2t = Communicator.Point3.cross(new Communicator.Point3(1, 0, 0), localaxis);
            if (axis2t.length() < 0.00001)
                axis2t = Communicator.Point3.cross(new Communicator.Point3(0, 1, 0), localaxis);

            let axis2 = Communicator.Point3.add(axis2t, this._center);

            let p1 = origmatrix.transform(component._center);
            let p1a = origmatrix.transform(axis2);

            let p2 = resmatrix.transform(this._center);
            let p2a = resmatrix.transform(axis2);

            let firstaxis = Communicator.Point3.subtract(p1a, p1).normalize();
            let secondaxis = Communicator.Point3.subtract(p2a, p1).normalize();

            let angle = KinematicsUtility.signedAngle(firstaxis, secondaxis, localaxis);
            await this._rotate(angle,true,true);

        }
        else
        {
            let origmatrix = KinematicsManager.viewer.model.getNodeNetMatrix(this._parent._nodeid);
            await KinematicsManager.viewer.model.setNodeMatrix(this._nodeid, resmatrix);    
            let origmatrix2 = KinematicsManager.viewer.model.getNodeNetMatrix(this._nodeid);

            let res1 = origmatrix.transform(this._center);
            let res2 = origmatrix2.transform(this._center);
            let delta = Communicator.Point3.subtract(res2,res1).length();
            await this._translate(delta);
            
            let origmatrix3 = KinematicsManager.viewer.model.getNodeNetMatrix(this._nodeid);
            res1 = origmatrix3.transform(this._center);

            let t2matrix = Communicator.Matrix.multiply(origmatrix, resmatrix);
            res2 = t2matrix.transform(this._center);

            let delta2 = Communicator.Point3.subtract(res2,res1).length();
            if (delta2>0.0001)
            {
                await this._translate(-delta);
            }

        }
        this._touched = true;

    }


   
 /**
     * Calculates Center and Axis of component from active handle 
     */     
    setParametersFromHandle() {
        let handleOperator = KinematicsManager.viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        if (handleOperator.getPosition()) {
            let pos = handleOperator.getPosition();
            let axis = KinematicsManager.handlePlacementOperator.lastAxis;
            if (!axis) return;
            let netmatrix = this._hierachy.getReferenceNodeNetMatrix(this);
            let netmatrixinverse = Communicator.Matrix.inverse(netmatrix);
            let pivot = netmatrixinverse.transform(pos);

            let pivotaxis = new Communicator.Point3(pos.x + axis.x, pos.y + axis.y, pos.z + axis.z);
            let pivotaxisres = netmatrixinverse.transform(pivotaxis);

            this.setCenter(pivot);
            this.setAxis(Communicator.Point3.subtract(pivotaxisres, pivot).normalize());
        }
    }

    

   
 /**
     * Calculates Fixed Axis and Fixed Axis Target from matrix
     */        
    setFixedAxisFromMatrix(matrix) {
        let handleOperator = KinematicsManager.viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        if (handleOperator.getPosition()) {
            if (!KinematicsManager.handlePlacementOperator.lastAxis2) 
                return;           


            let pivotaxis = Communicator.Point3.add(handleOperator.getPosition(),KinematicsManager.handlePlacementOperator.lastAxis2);
            let pivot = matrix.transform(handleOperator.getPosition());
            pivotaxis = matrix.transform(pivotaxis);

            this._fixedAxis = Communicator.Point3.subtract(pivotaxis, this.center).normalize();
            this._fixedAxisTarget = new Communicator.Point3(0,-1,0);
            

        }
    }

  
 /**
     * Select all nodes associated to this component
     */       
    selectReferenceNodes() {
        KinematicsManager.viewer.selectionManager.clear();
        let selitems = [];
        for (let i = 0; i < this._referenceNodes.length; i++) {
            selitems.push(Communicator.Selection.SelectionItem.create(this._referenceNodes[i].nodeid));
        }
        KinematicsManager.viewer.selectionManager.add(selitems);
    }


 /**
     * Show Handles based on component parameters
     * @param  {bool} showFixed - Show Fixed Axis
     * @param  {number} nodeid - Add additional node to selection
     * @param  {Point3} center - Center of Handles (optional)
     */      
    showHandles(showFixed, nodeid, center) {
        let handlesop = KinematicsManager.handlePlacementOperator;
        let netmatrix = this._hierachy.getReferenceNodeNetMatrix(this);
        
        let pos = netmatrix.transform(this._center);
        let axis2 = netmatrix.transform(Communicator.Point3.add(this._center,this._axis));
        let axis = Communicator.Point3.subtract(axis2, pos);

        if (center)
            pos = center;

        let nodeids = [];
        KinematicsManager.viewer.selectionManager.clear();
        let selitems = [];
        for (let i=0;i<this._referenceNodes.length;i++) {
                selitems.push(Communicator.Selection.SelectionItem.create(this._referenceNodes[i].nodeid));
                nodeids.push(this._referenceNodes[i].nodeid);
        }
        KinematicsManager.viewer.selectionManager.add(selitems);

        
        if (nodeid != undefined)
        {
            nodeids = [];
            nodeids.push(nodeid);
        }
        handlesop._addAxisTranslationHandle(pos, axis, nodeids);
        handlesop._addAxisTranslationHandle(pos, axis.copy().scale(-1), nodeids);

        if (this._type != componentType.prismatic && this._type != componentType.prismaticTriangle)
            handlesop._addAxisRotationHandle(pos, axis, nodeids);

        
        if (showFixed || this._fixedAxis) {
            let fixedAxis;
            if (this._fixedAxis)
            {
                fixedAxis = this._fixedAxisTarget.copy();

            }
            else
            {

                fixedAxis = Communicator.Point3.cross(new Communicator.Point3(1, 0, 0), axis);
                if (fixedAxis.length() < 0.00001)
                    fixedAxis = Communicator.Point3.cross(new Communicator.Point3(0, 1, 0), axis);
            }
            handlesop._addAxisTranslationHandle(pos, fixedAxis, nodeids);                

            KinematicsManager.handlePlacementOperator.lastAxis2 = fixedAxis.copy();

        }
        KinematicsManager.handlePlacementOperator.lastAxis = axis.copy();
    }



    

    async calculateGradient() {
        
        let angle = this._currentAngle;
        let delta = this._currentPosition;

        let targetDistanceBefore = this._hierachy.distanceFromIKTarget();

        let gradient;
        if (this._type == componentType.revolute)
        {
            await this._rotate(this._currentAngle + this._hierachy._ikSamplingDistance, true);
   //         await this.updateComponents();
            let targetDistanceAfter = this._hierachy.distanceFromIKTarget();

            gradient = (targetDistanceAfter - targetDistanceBefore) / this._hierachy._ikSamplingDistance;
        }
        else
        {
            await this._translate(this._currentPosition + this._hierachy._ikSamplingDistanceTranslation);
       //     await this.updateComponents();
            let targetDistanceAfter = this._hierachy.distanceFromIKTarget();
            gradient = (targetDistanceAfter - targetDistanceBefore) / this._hierachy._ikSamplingDistanceTranslation;
        }
        
        if (this._type == componentType.revolute)
            await this._rotate(angle);
        else
            await this._translate(delta);

        this._touched = true;
        return gradient;
    }

    async update(gradient)
    {
        if (this._type == componentType.revolute)
            await this._rotate(this._currentAngle - this._hierachy._ikLearningRate * gradient);
        else
            await this._translate(this._currentPosition - (this._hierachy._ikLearningRate) * gradient);
    }

    reset()
    {
        if (this._type == componentType.revolute)
            this._rotate(0);
        else
            this._translate(0);
    }


    
 /**
     * Delete Component and remove from hierachy
     */      
    delete()
    {
        if (this._parent)
        {
            delete this._hierachy.getComponentHash()[this._id];
            for (let i=0;i<this._children.length;i++)
            {
                this._children[i]._parent = this._parent;
                this._parent._children.push(this._children[i]);
            }
            for (let i=0;i<this._parent._children.length;i++)
            {
                if (this._parent._children[i] == this)
                {
                    this._parent._children.splice(i,1);
                    break;
                }
            }
        }
    }
    
 /**
     * Make component child of parent component
     */   
    moveup()
    {
        if (this._parent)
        {
            for (let i=0;i<this._parent._children.length;i++)
            {
                if (this._parent._children[i] == this)
                {
                    this._parent._children.splice(i,1);
                    break;
                }
            }
            this._parent._parent._children.push(this);
        }
    }

    async _updateComponentsFromReferenceRecursive(component) {
        if (!component)
            return;

        if (component._type == componentType.pivotConnector) {
            if (component._extraComponent1) {
                if (true) {
                    let circlepivot = component._extraComponent1._parent.transformlocalPointToWorldSpace(component._extraComponent1._extraPivot1);
                    let circlecenter = component._extraComponent1._parent.transformlocalPointToWorldSpace(component._extraComponent1._center);
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
                    

                    let circleRadius = Communicator.Point3.subtract(cp,cc).length();

                    let intersections = KinematicsUtility.circleLineIntersection(circleRadius,cc.x,cc.y,tc.x,tc.y,np.x,np.y);
                    let respoint = new Communicator.Point3(intersections.x2, intersections.y2, tc.z);
                    respoint = xyinverse.transform(respoint);
                    ViewerUtility.createDebugCube(KinematicsManager.viewer,respoint);
                    component._extraComponent1._targetPivot = respoint;

                }
                else {

                    let pivot1aft = component._extraComponent1.transformlocalPointToWorldSpace(component._extraComponent1._extraPivot1);
                    let pivot1before = component._extraComponent1._parent.transformlocalPointToWorldSpace(component._extraComponent1._extraPivot1);
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
                }

            }
            else {
                if (component._extraPivot1) {
                    if (component._targetPivot) {
                        let pivot1trans = component._parent.transformlocalPointToWorldSpace(component._extraPivot1);
                        let centertrans = component.transformlocalPointToWorldSpace(component._center);
                        let pivotorigtrans = component._parent.transformlocalPointToWorldSpace(component._targetPivot);
                        let transformedAxis = component.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center, component._axis));

                


                        let rotaxis2 = Communicator.Point3.subtract(transformedAxis, centertrans).normalize();
                        let plane = Communicator.Plane.createFromPointAndNormal(pivotorigtrans, rotaxis2);
    
                        centertrans = KinematicsUtility.closestPointOnPlane(plane, centertrans);
    
                        
                        ViewerUtility.createDebugCube(KinematicsManager.viewer,pivotorigtrans,10);
                        ViewerUtility.createDebugCube(KinematicsManager.viewer,pivot1trans,10);
                        ViewerUtility.createDebugCube(KinematicsManager.viewer,centertrans,10);


                        let v1 = Communicator.Point3.subtract(pivotorigtrans, centertrans).normalize();
                        let v2 = Communicator.Point3.subtract(pivot1trans, centertrans).normalize();
                        let angle = Communicator.Util.computeAngleBetweenVector(v1, v2);
                        await component._rotate(angle);
                        let p22 = component.transformlocalPointToWorldSpace(component._extraPivot1);
                        let diff = Communicator.Point3.subtract(p22, component._targetPivot).length();
                        await component._rotate(-angle);
                        p22 = component.transformlocalPointToWorldSpace(component._extraPivot1);
                        let diff2 = Communicator.Point3.subtract(p22, component._targetPivot).length();
                        if (diff2 > diff) {
                            await component._rotate(angle);
                        }
                        component._targetPivot = null;
                    }
                }
            }

        }
        else if (component._type == componentType.revoluteSlide) {

            let pivot1trans = component._extraComponent1.transformlocalPointToWorldSpace(component._extraPivot1);
            let centertrans = component._parent.transformlocalPointToWorldSpace(component._center);
            let pivotorigtrans = component._parent.transformlocalPointToWorldSpace(component._extraPivot1);

            let v1 = Communicator.Point3.subtract(pivotorigtrans, centertrans).normalize();
            let v2 = Communicator.Point3.subtract(pivot1trans, centertrans).normalize();
            let angle = Communicator.Util.computeAngleBetweenVector(v1, v2);
            await component._rotate(angle);

            let r = component.transformlocalPointToWorldSpace(component._extraPivot1);
            let pray = new Communicator.Point3(centertrans.x + v2.x * 10000, centertrans.y + v2.y * 10000, centertrans.z + v2.z * 10000);

            let outpoint = new Communicator.Point3(0,0,0);
            let ldist = Communicator.Util.computePointToLineDistance(r,centertrans,pray,outpoint);


             if (ldist > 0.0001)
                await component._rotate(-angle);

        }
        if (component._type == componentType.mate) {

            let originallength = Communicator.Point3.subtract(component._extraPivot1, component._extraPivot2).length();
            let pivot1trans = component._extraComponent1.transformlocalPointToWorldSpace(component._extraPivot1);
            let pivot2trans = component._extraComponent2.transformlocalPointToWorldSpace(component._extraPivot2);

            let newlength = Communicator.Point3.subtract(pivot1trans, pivot2trans).length();

      


            if (Math.abs(originallength - newlength) > 0.001) {
                let reactcomponent;
                let triggercomponent;
                if (!component._extraComponent2._touched)
                {
                    triggercomponent = { j: component._extraComponent1, pivot: component._extraPivot1};
                    reactcomponent = { j: component._extraComponent2, pivot: component._extraPivot2};
                }
                else
                {
                    reactcomponent = { j: component._extraComponent1, pivot: component._extraPivot1};
                    triggercomponent = { j: component._extraComponent2, pivot: component._extraPivot2};

                }
                component._extraComponent1._touched = false;
                component._extraComponent2._touched = false;
    
                let pivot1trans = triggercomponent.j.transformlocalPointToWorldSpace(triggercomponent.pivot);
                let pivot2trans = reactcomponent.j.transformlocalPointToWorldSpace(reactcomponent.pivot);
                let center2trans = reactcomponent.j.transformlocalPointToWorldSpace(reactcomponent.j._center);
    

                //Calculate Plane Matrix and transform to XY Plane
                let transformedCenter = triggercomponent.j.transformlocalPointToWorldSpace(component._center);
                let transformedAxis = triggercomponent.j.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center,component._axis));
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



                let res1  = xyinverse.transform(res.p1);
                let res2  = xyinverse.transform(res.p2);
                let dist1 = Communicator.Point3.subtract(res1, pivot2trans).length();
                let dist2 = Communicator.Point3.subtract(res2, pivot2trans).length();

            
                if (dist1 > dist2) {
                    res1 = res2;
                }

                //_rotate mate component
              
                let pivot1trans_2 = triggercomponent.j.transformlocalPointToWorldSpace(reactcomponent.pivot);
                
                let v1 = Communicator.Point3.subtract(pivot1trans_2, pivot1trans).normalize();
                let v2 = Communicator.Point3.subtract(res1, pivot1trans).normalize();
                
                let angle = Communicator.Util.computeAngleBetweenVector(v1,v2);
                let mat = KinematicsUtility.computeOffaxisRotationMatrix(triggercomponent.pivot,planenormal2, angle);

                let invmatrix = Communicator.Matrix.inverse(KinematicsManager.viewer.model.getNodeNetMatrix( KinematicsManager.viewer.model.getNodeParent(component._nodeid)));

                let resmatrix = Communicator.Matrix.multiply(mat, KinematicsManager.viewer.model.getNodeNetMatrix(triggercomponent.j._nodeid));
                let resmatrix2 = Communicator.Matrix.multiply(resmatrix,invmatrix);
                await KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, resmatrix2);
                
                let r = component.transformlocalPointToWorldSpace(reactcomponent.pivot);
                if (Communicator.Point3.subtract(r,res1).length() > 0.0001)
                {
                    mat = KinematicsUtility.computeOffaxisRotationMatrix(triggercomponent.pivot,planenormal2, -angle);
                    resmatrix = Communicator.Matrix.multiply(mat, KinematicsManager.viewer.model.getNodeNetMatrix(triggercomponent.j._nodeid));
                    let resmatrix2 = Communicator.Matrix.multiply(resmatrix,invmatrix);
                    await KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, resmatrix2);
    
                }
                
                //_rotate react component

                pivot1trans_2 = reactcomponent.j._parent.transformlocalPointToWorldSpace(reactcomponent.pivot);
                
                v1 = Communicator.Point3.subtract(pivot1trans_2, center2trans).normalize();
                v2 = Communicator.Point3.subtract(res1, center2trans).normalize();
                
                angle = Communicator.Util.computeAngleBetweenVector(v1,v2);
                await reactcomponent.j._rotate(angle);
                let tm = this._hierachy.getReferenceNodeNetMatrix(reactcomponent.j);
                r = tm.transform(reactcomponent.pivot);

                await reactcomponent.j._rotate(-angle);
                tm = this._hierachy.getReferenceNodeNetMatrix(reactcomponent.j);
                let r2 = tm.transform(reactcomponent.pivot);

                dist1 = Communicator.Point3.subtract(r,res1).length();
                dist2 = Communicator.Point3.subtract(r2,res1).length();
                if (dist1 < dist2)
                {
                    await reactcomponent.j._rotate(angle);
                }

                await this.getHierachy().updateComponents();

            }

        }            
        else if (component._type == componentType.pistonController)
        {
            let p1 = component._parent.transformlocalPointToWorldSpace(component._center);
            let p1a = component._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center,component._axis));

            let p2 =  component._extraComponent1._parent.transformlocalPointToWorldSpace(component._extraComponent1._center);            
            let p3 =  component._extraComponent1._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(component._extraComponent1._center,component._extraComponent1._axis));            

            let naxis = Communicator.Point3.subtract(p3,p2).normalize();
            let pol = KinematicsUtility.nearestPointOnLine(p2, naxis, p1);
            let delta = Communicator.Point3.subtract(pol,p1);
            let a =  delta.length();

            let c = Communicator.Point3.subtract(component._extraComponent1._center,component._center).length();          

            let b = Math.sqrt(c*c - a*a);            
            let angle = Math.asin(b/c) * (180/Math.PI);

            let offaxismatrix = new Communicator.Matrix();
            let transmatrix = new Communicator.Matrix();
            let resaxis = Communicator.Point3.subtract(p1a, p1).normalize();
    
            transmatrix = new Communicator.Matrix();
            transmatrix.setTranslationComponent(-p1.x, -p1.y, -p1.z);
    
            let invtransmatrix = new Communicator.Matrix();
            invtransmatrix.setTranslationComponent(p1.x, p1.y, p1.z);
    
            Communicator.Util.computeOffaxisRotation(resaxis, -angle, offaxismatrix);
    
            let result = Communicator.Matrix.multiply(transmatrix, offaxismatrix);
            let result2 = Communicator.Matrix.multiply(result, invtransmatrix);            

            let temp1 = Communicator.Point3.subtract(pol,p1).normalize();
            temp1.scale(b);
            let pointonline = Communicator.Point3.add(p1,temp1);
            let pol2 = result2.transform(pointonline);

            offaxismatrix = new Communicator.Matrix();
            Communicator.Util.computeOffaxisRotation(resaxis, angle, offaxismatrix);


            result = Communicator.Matrix.multiply(transmatrix, offaxismatrix);
            result2 = Communicator.Matrix.multiply(result, invtransmatrix);

            temp1 = Communicator.Point3.subtract(pol,p1).normalize();
            temp1.scale(b);
            pointonline = Communicator.Point3.add(p1,temp1);
            let pol3 = result2.transform(pointonline);


            let ttt =  component._extraComponent1._parent.transformlocalPointToWorldSpace(component._extraComponent1._center);    
            let ttt1 = Communicator.Point3.subtract(pol2,ttt).length();
            let ttt2 = Communicator.Point3.subtract(pol3,ttt).length();

            if (ttt2 < ttt1)
                pol2 = pol3;
                
            let p22 =  component._parent.transformlocalPointToWorldSpace(component._extraComponent1._center);    

            let v1 = Communicator.Point3.subtract(p22,p1).normalize();
            let v2 = Communicator.Point3.subtract(pol2,p1).normalize();

            let fangle = Communicator.Util.computeAngleBetweenVector(v1,v2);
            await component._rotate(-fangle);

            p22 =  component.transformlocalPointToWorldSpace(component._extraComponent1._center);    
            let diff = Communicator.Point3.subtract(p22,pol2).length();
            await component._rotate(fangle);
            p22 =  component.transformlocalPointToWorldSpace(component._extraComponent1._center);    
            let diff2 = Communicator.Point3.subtract(p22,pol2).length();
            if (diff2>diff)
                await component._rotate(-fangle);

            let deltafj = Communicator.Point3.subtract(component._extraComponent1._center,component.transformlocalPointToWorldSpace(component._extraComponent1._center)).length();
             await component._extraComponent1._translate(-deltafj);
             let dx = Communicator.Point3.subtract(component._extraComponent1.transformlocalPointToWorldSpace(component._extraComponent1._center),component.transformlocalPointToWorldSpace(component._extraComponent1._center)).length();
             await component._extraComponent1._translate(deltafj);
             let dx2 = Communicator.Point3.subtract(component._extraComponent1.transformlocalPointToWorldSpace(component._extraComponent1._center),component.transformlocalPointToWorldSpace(component._extraComponent1._center)).length();
            if (dx2>dx)
                await component._extraComponent1._translate(-deltafj);



        }
        else if (component._type == componentType.prismaticAggregate)
        {
            let matrix1 = KinematicsManager.viewer.model.getNodeMatrix(component._extraComponent1._nodeid);
            let matrix2 = KinematicsManager.viewer.model.getNodeMatrix(component._extraComponent2._nodeid);
            let resmatrix = Communicator.Matrix.multiply(matrix1, matrix2);
            await KinematicsManager.viewer.model.setNodeMatrix(component._nodeid, resmatrix);

        }
        else if (component._type == componentType.prismaticTriangle)
        {
            let p1 = component._extraComponent1.transformlocalPointToWorldSpace(component._center);
            let p2 =  component._extraComponent2.transformlocalPointToWorldSpace(component._extraComponent2._center);            
            let p3 = component._extraComponent2._parent.transformlocalPointToWorldSpace(component._center);     


            let delta = Communicator.Point3.subtract(p2,p1);
            let delta2 = Communicator.Point3.subtract(p2,p3);
            let ld1 = delta.length();
            let ld2 = delta2.length();

            delta.normalize();
            delta2.normalize();

            let angle = Communicator.Util.computeAngleBetweenVector(delta, delta2);

            await component._extraComponent2._rotate(-angle, true);
            let p1x = component._extraComponent2.transformlocalPointToWorldSpace(component._center);
           
            let delta3 = Communicator.Point3.subtract(p1x,p1);
            let ld3 = delta3.length();

            await component._extraComponent2._rotate(angle, true);
            p1x = component._extraComponent2.transformlocalPointToWorldSpace(component._center);
            let delta4 = Communicator.Point3.subtract(p1x,p1);
            let ld4 = delta4.length();

            if (ld4>ld3)
                await component._extraComponent2._rotate(-angle, true);

            await this._updateReferenceNodeMatrices(component._extraComponent2);

             await component._translate(ld1 - ld2);
        }
        else if (component._type == componentType.helical)
        {
            let p1 = component._parent.transformlocalPointToWorldSpace(component._center);
            let p2 = component.transformlocalPointToWorldSpace(component._center);
            let length = Communicator.Point3.subtract(p2,p1).length();
            component._translate(length);
            let p3 = component.transformlocalPointToWorldSpace(component._center);
            component._translate(-length);
            let p4 = component.transformlocalPointToWorldSpace(component._center);
            if (Communicator.Point3.subtract(p3,p2).length() < Communicator.Point3.subtract(p4,p2).length())
            {
                component._translate(length);
                length = -length;
            }

            component._rotate(length * component._helicalFactor, true, true);
        }
        else if (component._type == componentType.mapped) {
            if (component._mappedType == componentType.prismaticPlane) {
                let matrix = KinematicsManager.viewer.model.getNodeNetMatrix(component._mappedTargetComponent._nodeid);
                let pp = matrix.transform(component._prismaticPlaneTip);
                let dist = component._prismaticPlanePlane.distanceToPoint(pp);
                if (dist < 0)
                    await component._translate(dist * component._helicalFactor);
                else
                    await component._translate(0);
            }
            else if (component._mappedTargetComponent._type == componentType.prismatic || (component._mappedTargetComponent._type == componentType.mapped && component._mappedTargetComponent._mappedType == componentType.prismatic)) {
                let savdelta = component._mappedTargetComponent._currentPosition;
                let savmatrix = KinematicsManager.viewer.model.getNodeMatrix(component._mappedTargetComponent._nodeid);
                let p1 = component._mappedTargetComponent._parent.transformlocalPointToWorldSpace(component._mappedTargetComponent._center);
                let p2 = component._mappedTargetComponent.transformlocalPointToWorldSpace(component._mappedTargetComponent._center);
                let length = Communicator.Point3.subtract(p2, p1).length();
                component._mappedTargetComponent._translate(length);
                let p3 = component._mappedTargetComponent.transformlocalPointToWorldSpace(component._mappedTargetComponent._center);
                component._mappedTargetComponent._translate(-length);
                let p4 = component._mappedTargetComponent.transformlocalPointToWorldSpace(component._mappedTargetComponent._center);
                if (Communicator.Point3.subtract(p3, p2).length() < Communicator.Point3.subtract(p4, p2).length())
                    length = -length;
                KinematicsManager.viewer.model.setNodeMatrix(component._mappedTargetComponent._nodeid, savmatrix);

                if (component._mappedType == componentType.revolute) 
                {
                    await component._rotate(length * component._helicalFactor, true);
                    component._currentAngle = length * component._helicalFactor;
                }
                else if (component._mappedType == componentType.prismatic)
                    await component._translate(length * component._helicalFactor, true);
                else if (component._mappedType == componentType.belt)
                    await component.belt.move(length * component._helicalFactor);                    

                component._mappedTargetComponent._currentPosition = savdelta;
            }
            else if (component._mappedTargetComponent._type == componentType.revolute || component._mappedTargetComponent._type == componentType.mapped) {
             
                if (component._mappedType == componentType.revolute) 
                {
                    await component._rotate(component._mappedTargetComponent._currentAngle * component._helicalFactor, true);
                    component._currentAngle = component._mappedTargetComponent._currentAngle * component._helicalFactor;
                }
                else if (component._mappedType == componentType.prismatic)
                    await component._translate(component._mappedTargetComponent._currentAngle * component._helicalFactor, true);
                else if (component._mappedType == componentType.belt)
                    await component.belt.move(component._mappedTargetComponent._currentAngle * component._helicalFactor);

                
            }
        }
        else if (component._type == componentType.revolute && component._fixedAxis)
        {          
            let centerworld = component.transformlocalPointToWorldSpace(component._center);
            let fixedworld = component.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center,component._fixedAxis));

            let axis1 = Communicator.Point3.subtract(fixedworld,centerworld).normalize();

       
            let axis2 = component._fixedAxisTarget;

            let rotaxis = component.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center,component._axis));
            let rotaxis2 = Communicator.Point3.subtract(rotaxis,centerworld).normalize();

            let plane = Communicator.Plane.createFromPointAndNormal(centerworld, rotaxis2);
            let dist = plane.distanceToPoint(new Communicator.Point3.add(centerworld, axis2));
            let res = KinematicsUtility.closestPointOnPlane(plane, new Communicator.Point3.add(centerworld, axis2));
            axis2 = new Communicator.Point3.subtract(res,centerworld).normalize();
            let angle = Communicator.Util.computeAngleBetweenVector(axis1, axis2);
            await component._rotate(angle,true, true);


            centerworld = component.transformlocalPointToWorldSpace(component._center);
            fixedworld = component.transformlocalPointToWorldSpace(Communicator.Point3.add(component._center,component._fixedAxis));
            let axis1x = Communicator.Point3.subtract(fixedworld,centerworld).normalize();

            let delta = Communicator.Point3.subtract(axis1x,axis2).length();
            if (delta>0.001)
                await component._rotate(-angle*2,true,true);
            
        }
                    
        await this._updateReferenceNodeMatrices(component);
        if (component._children.length > 0)
        {
            for (let j=0;j<component._children.length;j++)
                await this._updateComponentsFromReferenceRecursive(component._children[j]);
        }

    }


    async _updateReferenceNodeMatrices(component) {
        if (component._reference) {

            if (component._parent && component._parent._reference == false) {
                for (let i = 0; i < component._referenceNodes.length; i++) {
                    let resmatrix = Communicator.Matrix.multiply(component._referenceNodes[i].matrix, KinematicsManager.viewer.model.getNodeMatrix(component._nodeid));
                    let resmatrix3 = Communicator.Matrix.multiply(resmatrix, KinematicsManager.viewer.model.getNodeMatrix(component._parent._nodeid));
                    let r2 = Communicator.Matrix.inverse(component._parent._parentMatrix);
                    let resmatrix2 = Communicator.Matrix.multiply(resmatrix3, r2);
                    KinematicsManager.viewer.model.setNodeMatrix(component._referenceNodes[i].nodeid, resmatrix2);
                }

            }
            else {
                for (let i = 0; i < component._referenceNodes.length; i++) {
                    let resmatrix = Communicator.Matrix.multiply(component._referenceNodes[i].matrix, this._hierachy.getReferenceNodeNetMatrix(component));
                    let r2 = Communicator.Matrix.inverse(component._parentMatrix);
                    let resmatrix2 = Communicator.Matrix.multiply(resmatrix, r2);
                    KinematicsManager.viewer.model.setNodeMatrix(component._referenceNodes[i].nodeid, resmatrix2);
                }
            }
        }
        else {
            for (let i = 0; i < component._referenceNodes.length; i++) {
                let resmatrix = Communicator.Matrix.multiply(component._referenceNodes[i].matrix, KinematicsManager.viewer.model.getNodeMatrix(component._nodeid));
                let r2 = Communicator.Matrix.inverse(component._parentMatrix);
                let resmatrix2 = Communicator.Matrix.multiply(resmatrix, r2);
                KinematicsManager.viewer.model.setNodeMatrix(component._referenceNodes[i].nodeid, resmatrix2);
            }
        }
    }


}