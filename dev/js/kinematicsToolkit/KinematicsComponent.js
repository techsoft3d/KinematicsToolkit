import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsBelt } from './KinematicsBelt.js';
import { KinematicsUtility } from './KinematicsUtility.js';
import { KinematicsComponentBehaviorRevolute } from './KinematicsComponentBehaviorRevolute.js';
import { KinematicsComponentBehaviorPrismatic } from './KinematicsComponentBehaviorPrismatic.js';
import { KinematicsComponentBehaviorPistonController } from './KinematicsComponentBehaviorPistonController.js';
import { KinematicsComponentBehaviorFixed } from './KinematicsComponentBehaviorFixed.js';
import { KinematicsComponentBehaviorTarget } from './KinematicsComponentBehaviorTarget.js';
import { KinematicsComponentBehaviorPrismaticTriangle } from './KinematicsComponentBehaviorPrismaticTriangle.js';
import { KinematicsComponentBehaviorMapped } from './KinematicsComponentBehaviorMapped.js';
import { KinematicsComponentBehaviorHelical } from './KinematicsComponentBehaviorHelical.js';
import { KinematicsComponentBehaviorPrismaticAggregate } from './KinematicsComponentBehaviorPrismaticAggregate.js';
import { KinematicsComponentBehaviorRevoluteSlide } from './KinematicsComponentBehaviorRevoluteSlide.js';
import { KinematicsComponentBehaviorSplineMovement } from './KinematicsComponentBehaviorSplineMovement.js';
import { KinematicsComponentBehaviorMate } from './KinematicsComponentBehaviorMate.js';
import { KinematicsComponentBehaviorPivotSystem } from './KinematicsComponentBehaviorPivotSystem.js';

/**
 * Type of Component.
 * @readonly
 * @enum {number}
 */
const componentType = {
     /** Rotation around an axis.  
      * Use setCenter() and setAxis() to define the rotation axis.
     */
    revolute: 0,
     /** Translation along an axis.  
      * Use setCenter() and setAxis() to define the translation axis.
      */
     prismatic: 1,
     /** Fixed. No Movement */
    fixed:2,
     /** Aggregates the position of two components.  
      * Use setExtraComponent1() and setExtraComponent2() to define the components.
      */
     prismaticAggregate: 3,
 /** Calculates hinge movement based on static and variable component.  
      * Use setExtraComponent1() and setExtracComponent2() to define related component.
      */    
     prismaticTriangle: 4,
  /** Performs a rotation when the component is translated.  
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
      * Use setPrismaticPlanePlane() and setPrismaticPlaneTip() to define plane.
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
/** Component that is positioned based on other components.  
      */            
    target:12,

/** Calculates component based on common pivot.
      */            
   pivotSystem:13,
   /** Calculates component based on common pivot.
      */            
    splineMovement:14

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

        this._behavior = new KinematicsComponentBehaviorRevolute(this);

        this._children = [];
        this._parent = parent;

        this._minLimit = undefined;
        this._maxLimit = undefined;

        this._nodeid = -1;

        this._center = new Communicator.Point3(0, 0, 0);
        this._axis = new Communicator.Point3(1, 0, 0);

        this._currentAngle = 0;

        this._currentPosition = 0;

        this._referenceNodes = [];
        this._parentMatrix = new Communicator.Matrix();

        this._extraComponent1 = null;
        this._extraComponent2 = null;

        this._reference = true;
        this._touched = false;

        this._animations = [];

        this._activeAnimation = false;
        this._enforceLimits = true;
    }

    initialize(nodeids, isReference) {
        this._reference = isReference;
        if (!this._parent)
            this._nodeid = KinematicsManager.viewer.model.createNode(this._hierachy.getRootNode(), "rootComponent");
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
    setType(type) {
        if (this._type != type) {
            this._type = type;

            if (this._type == componentType.revolute) {
                this._behavior = new KinematicsComponentBehaviorRevolute(this);
            }
            else if (this._type == componentType.prismatic) {
                this._behavior = new KinematicsComponentBehaviorPrismatic(this);
            }
            else if (this._type == componentType.pistonController) {
                this._behavior = new KinematicsComponentBehaviorPistonController(this);
            }
            else if (this._type == componentType.fixed) {
                this._behavior = new KinematicsComponentBehaviorFixed(this);
            }
            else if (this._type == componentType.target) {
                this._behavior = new KinematicsComponentBehaviorTarget(this);
            }
            else if (this._type == componentType.prismaticTriangle) {
                this._behavior = new KinematicsComponentBehaviorPrismaticTriangle(this);
            }
            else if (this._type == componentType.mapped) {
                this._behavior = new KinematicsComponentBehaviorMapped(this);
            }
            else if (this._type == componentType.helical) {
                this._behavior = new KinematicsComponentBehaviorHelical(this);
            }
            else if (this._type == componentType.revoluteSlide) {
                this._behavior = new KinematicsComponentBehaviorRevoluteSlide(this);
            }
            else if (this._type == componentType.prismaticAggregate) {
                this._behavior = new KinematicsComponentBehaviorPrismaticAggregate(this);
            }
            else if (this._type == componentType.mate) {
                this._behavior = new KinematicsComponentBehaviorMate(this);
            }
            else if (this._type == componentType.pivotSystem) {
                this._behavior = new KinematicsComponentBehaviorPivotSystem(this);
            }
            else if (this._type == componentType.splineMovement) {
                this._behavior = new KinematicsComponentBehaviorSplineMovement(this);
            }
            else {
                this._behavior = (KinematicsManager.getCustomTypeCallback())(this, type);
            }
        }

    }

    /**
      * Retrieves type of component
      * @return {componentType} Component Type
      */
    getType() {
        if (this._behavior)
            return this._behavior.getType();
        else
            return this._type;
    }

  /**
     * Sets the behavior object for the component
     * @param  {object} behavior - KinematicsBehavior
     */    
    setBehavior(behavior) {
        this._behavior = behavior;
    }

 /**
      * Retrieves the behavior object for the component
      * @return {object} KinematicsBehavior
      */
    getBehavior()
    {
        return this._behavior;
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
    getCurrentValue() {
        if (this._behavior)
            return this._behavior.getCurrentValue();
        else {
          
        }
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
    * Sets if limits should be enforced during behavior evalulation for this component
    * @param  {bool} enforceLimits - Enforce Limits
    */
    setEnforceLimits(enforceLimits) {
        this._enforceLimits = enforceLimits;
    }

    /**
    * Retrieves if limits should be enforced during behavior evalulation for this component
    * @return {bool} Enforce Limits
    */
    getEnforceLimits() {
        return this._enforceLimits;
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
        * Sets the value (rotation or translation) for the component (applicable to componentType.prismatic or componentType.revolute)
        * @param  {number} value - Value
        */
    set(value) {
        this._hierachy._touchedRewind = {nodeid: this._nodeid, matrix: KinematicsManager.viewer.model.getNodeMatrix(this._nodeid).copy()};
        this._behavior.set(value);
        this._touched = true;       
        
    }

    toJson() {

        let children = [];
        for (let i = 0; i < this._children.length; i++) {
            children.push(this._children[i].toJson());
        }
        let refnodes = [];
        if (this.getType() == componentType.mapped && (this._behavior._mappedType == componentType.belt)) {
          
        }
        else {
            for (let i = 0; i < this._referenceNodes.length; i++) {
                refnodes.push({ nodeid: this._referenceNodes[i].nodeid, matrix: this._referenceNodes[i].matrix.toJson() });
            }
        }

        let def = {id: this._id,reference: this._reference, type: this.getType(),center: this._center.toJson(), axis: this._axis.toJson(), minLimit: this._minLimit, maxLimit: this._maxLimit, children: children, referenceNodes:refnodes,
            parentMatrix: this._parentMatrix.toJson(),enforceLimits:this._enforceLimits };

        if (this._behavior)
        {
            this._behavior.toJson(def);
        }

        def.animations = [];
        for (let i=0;i<this._animations.length;i++)
        {
            def.animations.push(this._animations[i]);
        }
        return def;
    }

    async fromJson(def, version) {
        this._minLimit = def.minLimit;
        this._maxLimit = def.maxLimit;
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

        if (def.enforceLimits != undefined)
        {
            this._enforceLimits = def.enforceLimits;
        }

        this.setType(def.type);

        if (this._behavior)
        {
            this._behavior.fromJson(def,version);
        }
 
        this._parentMatrix = Communicator.Matrix.fromJson(def.parentMatrix);
        this._hierachy.getComponentHash()[this._id] = this;
    
        if (!this._parent)
            this._nodeid = KinematicsManager.viewer.model.createNode(this._hierachy.getRootNode(), "rootComponent");
        else
            this._nodeid = KinematicsManager.viewer.model.createNode(this._parent._nodeid, "component");
        for (let i=0;i<def.referenceNodes.length;i++)
        {
            this._referenceNodes.push({nodeid:def.referenceNodes[i].nodeid, matrix: Communicator.Matrix.fromJson(def.referenceNodes[i].matrix)});
            this._hierachy._componentNodeidHash[def.referenceNodes[i].nodeid] = this;
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

    transformlocalPointToWorldSpaceWithMatrix(pos, matrix)    
    {
        let mat = this._hierachy.getReferenceNodeNetMatrix(this._parent);
        mat = Communicator.Matrix.multiply(matrix, mat);
        return mat.transform(pos);
    }

    _calculateAngleRotMatrix(angle,add,axis, center)    
    {
              
        let offaxismatrix = new Communicator.Matrix();
        let transmatrix = new Communicator.Matrix();
        let resaxis;
        let rescenter;
        if (axis)
            resaxis = axis;
        else
            resaxis = this._axis;

        if (center)
            rescenter = center;
        else
            rescenter = this._center;

        transmatrix = new Communicator.Matrix();
        transmatrix.setTranslationComponent(-rescenter.x, -rescenter.y, -rescenter.z);

        let invtransmatrix = new Communicator.Matrix();
        invtransmatrix.setTranslationComponent(rescenter.x, rescenter.y, rescenter.z);

        Communicator.Util.computeOffaxisRotation(resaxis, angle, offaxismatrix);

        let result = Communicator.Matrix.multiply(transmatrix, offaxismatrix);
        let result2 = Communicator.Matrix.multiply(result, invtransmatrix);

        if (add != undefined) {
            let localmatrix = KinematicsManager.viewer.model.getNodeMatrix(this._nodeid);
            let final3 = Communicator.Matrix.multiply(localmatrix, result2);
            return final3;
        }
        else
        {
             return result2;
        }

    }

     _rotate(angle, ignoreLimits, add) {       

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
            
        let resmatrix = this._calculateAngleRotMatrix(angle,add);

           
        KinematicsManager.viewer.model.setNodeMatrix(this._nodeid, resmatrix);

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


        if (this._behavior.getMovementType() == componentType.revolute) 
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
        if (KinematicsManager.handlePlacementOperator.getPosition()) {
            let pos = KinematicsManager.handlePlacementOperator.getPosition();
            let axis = KinematicsManager.handlePlacementOperator.getAxis();
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

        if (this._behavior.getMovementType() != componentType.prismatic)
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

            KinematicsManager.getHandleOperator().setSecondAxis(fixedAxis.copy());

        }
        KinematicsManager.getHandleOperator().setAxis(axis.copy());
    }

    async calculateGradient() {
        
        let angle = this._currentAngle;
        let delta = this._currentPosition;

        let targetDistanceBefore = this._hierachy.distanceFromIKTarget();

        let gradient;
        if (this._behavior.getMovementType() == componentType.revolute)
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
        
        if (this._behavior.getMovementType() == componentType.revolute)
            await this._rotate(angle);
        else
            await this._translate(delta);

        return gradient;
    }

    async update(gradient)
    {
        if (this._behavior.getMovementType() == componentType.revolute)
            await this._rotate(this._currentAngle - this._hierachy._ikLearningRate * gradient);
        else
            await this._translate(this._currentPosition - (this._hierachy._ikLearningRate) * gradient);
    }

    reset()
    {
        this._behavior.set(0);
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

    async _execute() {
        let component = this;
        if (this._behavior)
        {
            await this._behavior.execute(component);
            return;
        }       
       
    }

    async _updateReferenceNodeMatrices() {
        if (this._reference) {

            if (this._parent && this._parent._reference == false) {
                for (let i = 0; i < this._referenceNodes.length; i++) {
                    let resmatrix = Communicator.Matrix.multiply(this._referenceNodes[i].matrix, KinematicsManager.viewer.model.getNodeMatrix(this._nodeid));
                    let resmatrix3 = Communicator.Matrix.multiply(resmatrix, KinematicsManager.viewer.model.getNodeMatrix(this._parent._nodeid));
                    let r2 = Communicator.Matrix.inverse(this._parent._parentMatrix);
                    let resmatrix2 = Communicator.Matrix.multiply(resmatrix3, r2);
                    KinematicsManager.viewer.model.setNodeMatrix(this._referenceNodes[i].nodeid, resmatrix2);
                }
            }
            else {
                for (let i = 0; i < this._referenceNodes.length; i++) {
                    let resmatrix = Communicator.Matrix.multiply(this._referenceNodes[i].matrix, this._hierachy.getReferenceNodeNetMatrix(this));
                    let r2 = Communicator.Matrix.inverse(this._parentMatrix);
                    let resmatrix2 = Communicator.Matrix.multiply(resmatrix, r2);
                    KinematicsManager.viewer.model.setNodeMatrix(this._referenceNodes[i].nodeid, resmatrix2);
                }
            }
        }
        else {
            for (let i = 0; i < this._referenceNodes.length; i++) {
                let resmatrix = Communicator.Matrix.multiply(this._referenceNodes[i].matrix, KinematicsManager.viewer.model.getNodeMatrix(this._nodeid));
                let r2 = Communicator.Matrix.inverse(this._parentMatrix);
                let resmatrix2 = Communicator.Matrix.multiply(resmatrix, r2);
                KinematicsManager.viewer.model.setNodeMatrix(this._referenceNodes[i].nodeid, resmatrix2);
            }
        }
    }

    getWorldPlane()
    {
        let center = this._parent.transformlocalPointToWorldSpace(this._center);
        let axis = this._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(this._center, this._axis));
        axis = Communicator.Point3.subtract(axis, center).normalize();

        return Communicator.Plane.createFromPointAndNormal(center, axis);                    
    }

    
    getXYMatrix()
    {
        let center = this._parent.transformlocalPointToWorldSpace(this._center);
        let axis = this._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(this._center, this._axis));
        axis = Communicator.Point3.subtract(axis, center).normalize();

        return KinematicsUtility.ComputeVectorToVectorRotationMatrix(axis, new Communicator.Point3(0, 0, 1));       
    }
}