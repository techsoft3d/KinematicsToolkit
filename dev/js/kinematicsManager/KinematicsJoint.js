import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsBelt } from './KinematicsBelt.js';
import { KinematicsUtility } from './KinematicsUtility.js';


export const jointType = {
    revolute: 0,
    prismatic: 1,
    fixed:2,
    prismaticAggregate: 3,
    prismaticTriangle: 4,
    helical: 5,
    mapped: 6,
    pistonController: 7,
    conveyor: 8,
    prismaticPlane: 9,
    belt:10,
    mate:11,
    revoluteSlide:12,
};

 
/** This class represents an individual Kinematics Joint*/
export class KinematicsJoint {
 /**
     * Creates a Kinematic Joint Object
     * @param  {KinematicsJoint} parent - Parent Joint
     * @param  {KinematicsHierachy} hierachy - Hierachy this joint belongs to 
     */
    constructor(parent, hierachy) {
        this._hierachy = hierachy;
        this._id = hierachy._highestId++;

        this._type = jointType.revolute;
        this._mappedType = null;

        this._children = [];
        this._parent = parent;

        this._minangle = 0;
        this._maxangle = 0;

        this._nodeid = -1;

        this._center = new Communicator.Point3(0, 0, 0);
        this._axis = new Communicator.Point3(1, 0, 0);

        this._currentAngle = 0;

        this._currentPosition = 0;

        this._fixedAxis = null;
        this._fixedAxisTarget = null;

        this._referenceNodes = [];
        this._parentMatrix = new Communicator.Matrix();

        this._extraJoint1 = null;
        this._extraJoint2 = null;

        this._mappedTargetJoint = null;

        this._helicalFactor = 1.0;
        this._reference = true;
        this._touched = false;

        this._animations = [];
    }

 
    initialize(nodeids, isReference) {
        this._reference = isReference;
        if (!this._parent)
            this._nodeid = KinematicsManager.viewer.model.createNode(KinematicsManager.viewer.model.getRootNode(), "rootJoint");
        else
            this._nodeid = KinematicsManager.viewer.model.createNode(this._parent._nodeid, "joint");

        this._parentMatrix = KinematicsManager.viewer.model.getNodeNetMatrix(KinematicsManager.viewer.model.getNodeParent(nodeids[0]));

        for (let i = 0; i < nodeids.length; i++) {
            this._referenceNodes.push({ nodeid: nodeids[i], matrix: KinematicsManager.viewer.model.getNodeNetMatrix(nodeids[i]).copy() });
        }
    }

     /**
    * Retrieve Joint Id
    * @return {number} Joint ID
     */      
    getId()
    {
        return this._id;
    }


   /**
     * Sets type of joint
     * @param  {jointType} type - Joint Type
     */
    setType(type)
    {
        this._type = type;
    }

   /**
     * Retrieves type of joint
     * @return {jointType} Joint Type
     */
    getType()
    {
        return this._type;
    }

     /**
     * Sets joint parent
     * @param  {KinematicsJoint} parent - Parent Joint
     */
    setParent(parent)
    {
        this._parent = parent;
    }

 /**
     * Retrieves parent of joint
     * @return {KinematicsJoint} Joint Parent
     */
    getParent()
    {
        return this._currentPosition;
    }

     /**
     * Retrieves all children of joint
     * @return {array} Array of children joints
     */
    getChildren()
    {
        return this._children;
    }

     /**
     * Retrieves a child joint by its index
     * @param  {number} i - Index of child joint
     * @return {KinematicsJoint} Child Joint
     */
    getChildByIndex(i)
    {
        return this._children[i];
    }

    /**
     * Sets the mapped type of a joint (applicable to jointType.mapped)
     * @param  {jointType} mappedType - Mapped Type
     */
    setMappedType(mappedType)
    {
        this._mappedType = mappedType;
    }

     /**
     * Retrieves the mapped type of a joint (applicable to jointType.mapped)
     * @return {jointType} Mapped Type
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
     * Retrieves the hierachy associated with a joint
     * @return {KinematicsHierachy} Hierachy
     */    
    getHierachy()
    {
        return this._hierachy;
    }

    /**
     * Sets the joint center
     * @param  {Point3} center - Joint Center
     */    
    setCenter(center)
    {
        this._center = center;
    }


     /**
     * Retrieves the joint center
     * @return {Point3} Joint Center
     */        
    getCenter()
    {
        return this._center;
    }

   /**
     * Sets the joint axis
     * @param  {Point3} axis - Joint Axis
     */    
    setAxis(axis)
    {
        this._axis = axis;
    }

 /**
     * Retrieves the joint axis
     * @return {Point3} Joint Axis
     */           
    getAxis()
    {
        return this._axis;
    }


 /**
     * Retrieves the value of the current joint (angle or relative position)
     * @return {number} Current Value
     */             
    getCurrentValue()
    {
        if (this._type == jointType.revolute)
            return this._currentAngle;
        else if (this._type == jointType.prismatic)
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
     * Retrieves the Extra Joint 1 (not applicable to all joint types)
     * @return {KinematicsJoint} Joint
     */       
    getExtraJoint1()
    {
        return this._extraJoint1;
    }


   /**
     * Sets the extra joint 1
     * @param  {KinematicsJoint} joint - Joint
     */     
    setExtraJoint1(joint)
    {
        this._extraJoint1 = joint;
    }

 /**
     * Retrieves the Extra Joint 2 (not applicable to all joint types)
     * @return {KinematicsJoint} Joint
     */       
    getExtraJoint2()
    {
        return this._extraJoint2;
    }

   /**
     * Sets the extra joint 2
     * @param  {KinematicsJoint} joint - Joint
     */     
    setExtraJoint2(joint)
    {
        this._extraJoint2 = joint;
    }

 /**
     * Sets the extra pivot 1 (applicable to jointType.revoluteSlide and jointType.mate)
     * @param  {Point3} pivot - Pivot Point
     */         
    setExtraPivot1(pivot)
    {
        this._extraPivot1 = pivot;
    }


 /**
     * Retrieves the Extra Pivot 1 (applicable to jointType.revoluteSlide and jointType.mate)
     * @return {Point3} Pivot
     */     
    getExtraPivot1()
    {
        return this._extraPivot1;
    }


 /**
     * Sets the extra pivot 2 (applicable to jointType.mate)
     * @param  {Point3} pivot - Pivot Point
     */     
    setExtraPivot2(pivot)
    {
        this._extraPivot2 = pivot;
    }


 /**
     * Retrieves the Extra Pivot 2 (applicable to jointType.mate)
     * @return {Point3} Pivot
     */         
    getExtraPivot2()
    {
        return this._extraPivot2;
    }


 /**
     * Sets the mapped target joint (applicable to jointType.mapped)
     * @param  {KinematicsJoint} joint - Joint
     */         
    setMappedTargetJoint(joint)
    {
        this._mappedTargetJoint = joint;
    }


 /**
     * Retrieves the mapped target joint (applicable to jointType.mapped)
     * @return {KinematicsJoint} Joint
     */       
    getMappedTargetJoint()
    {
        return this._mappedTargetJoint;
    }


 /**
     * Sets the helical factor (applicable to jointType.mapped and jointType.helical)
     * @param  {number} helicalFactor - Helical Factor
     */       
    setHelicalFactor(helicalFactor)
    {
        this._helicalFactor = helicalFactor;
    }


 /**
     * Retrieves the helical factor (applicable to jointType.mapped and jointType.helical)
     * @return {number}  Helical Factor
     */    
    getHelicalFactor()
    {
        return this._helicalFactor;
    }



 /**
     * Sets if joint is a reference joint  
     * Reference Joints are joints that are NOT children of their parent joint in the HC node hierachy
     * @param  {bool} isReference - Is Joint a Reference Joint
     */ 
    setIsReference(isReference) {
        this._reference = isReference;
    }


 /**
     * Retrieves if joint is a reference joint  
     * Reference Joints are joints that are NOT children of their parent joint in the HC node hierachy
     * @return {bool} Is Joint a Reference Joint
     */ 
    getIsReference() {
        return this._reference;
    }


 /**
     * Retrieves all animations associated with a joint   
     * @return {array} Array of Animation Template Ids
     */     
    getAnimations() {
        return this._animations;
    }


 /**
     * Retrieves an animation associated with a joint by its index
     * @param  {number} i - Index of animation
     * @return {uuid} Animation Template Id
     */         
    getAnimationByIndex(i) {
        return this._animations[i];
    }


    getMinAngle()
    {
        return this._minangle;
    }

    getMaxAngle()
    {
        return this._maxAngle;
    }

 /**
     * Sets the fixed axis for this joint (applicable to jointType.revolute)  
     * This defines the axis that is fixed in the joint
     * @param  {Point3} axis - Fixed Axis
     */ 
    setFixedAxis(axis)
    {
        this._fixedAxis = axis;
    }

 /**
     * Sets the fixed axis target for this joint (applicable to jointType.revolute)  
     * This defines the axis that the fixed axis will be rotated to.
     * @param  {Point3} axis - Fixed Axis Target
     */ 
    setFixedAxisTarget(axis)
    {
        this._fixedAxisTarget = axis;
    }

 /**
     * Retrieves the fixed axis for this joint (applicable to jointType.revolute)  
     * @return {Poin3} Fixed Axis
     */      
    getFixedAxis()
    {
        return this._fixedAxis;
    }

    
 /**
     * Retrieves the belt object for this joint (applicable to jointType.mapped with mapped type set to jointType.belt)
     * @return {KinematicsBelt} Belt Object
     */      
    getBelt()
    {
        return this.belt;
    }


 /**
     * Sets the plane for the prismatic plane joint  (applicable to jointType.mapped with mapped type set to jointType.prismaticPlane)
     * @param  {Plane} plane - Plane
     */     
    setPrismaticPlanePlane(plane)
    {
        this._prismaticPlanePlane = plane;
    }

  
 /**
     * Retrieves the plane for the prismatic plane joint (applicable to jointType.mapped with mapped type set to jointType.prismaticPlane)
     * @return {Plane} Plane
     */          
    getPrismaticPlanePlane()
    {
        return this._prismaticPlanePlane;
    }


 /**
     * Sets the tip for the prismatic plane joint  (applicable to jointType.mapped with mapped type set to jointType.prismaticPlane)
     * @param  {Point3} tip - Tip
     */         
    setPrismaticPlaneTip(tip)
    {
        this._prismaticPlaneTip = tip;
    }

 
 /**
     * Retrieves the tip for the prismatic plane joint (applicable to jointType.mapped with mapped type set to jointType.prismaticPlane)
     * @return {Point3} Tip
     */             
    getPrismaticPlaneTip()
    {
        return this._prismaticPlaneTip;
    }

    
 /**
     * Sets the value (rotation or translation) for the joint (applicable to jointType.prismatic or jointType.revolute)
     * @param  {number} value - Value
     */ 
    set(value) {

        if (this._type == jointType.revolute)
            this._rotate(value);
        else if (this._type == jointType.prismatic)
            this._translate(value);
    }

    toJson() {

        let children = [];
        for (let i = 0; i < this._children.length; i++) {
            children.push(this._children[i].toJson());
        }
        let refnodes = [];
        if (this._type == jointType.mapped && (this._mappedType == jointType.belt)) {
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

        let def = { nodeid: this._nodeid, id: this._id, mappedType: this._mappedType,reference: this._reference, type: this._type,center: this._center.toJson(), axis: this._axis.toJson(), minangle: this._minangle, maxangle: this._maxangle, children: children, referenceNodes:refnodes,
            parentMatrix: this._parentMatrix.toJson() };

        if (this._mappedType == jointType.belt) {
            def.parentMatrix = new Communicator.Matrix().toJson();
        }

        if (this._type == jointType.prismaticTriangle || this._type == jointType.prismaticAggregate || this._type == jointType.mate)            
        {
            def.extraJoint1 = this._extraJoint1._id;
            def.extraJoint2 = this._extraJoint2._id;

            if (this._type == jointType.mate)            
            {
                def.extraPivot1 = this._extraPivot1.toJson();
                def.extraPivot2 = this._extraPivot2.toJson();
            }
        }
        else if (this._type == jointType.revoluteSlide)            
        {
            def.extraJoint1 = this._extraJoint1._id;
            def.extraPivot1 = this._extraPivot1.toJson();

        }
        else if (this._type == jointType.pistonController)            
        {
            def._extraJoint1 = this._extraJoint1._id;
        }
        else if (this._type == jointType.helical)            
        {
            def.helicalFactor = this._helicalFactor;
        }
        else if (this._type == jointType.mapped)            
        {
            def.helicalFactor = this._helicalFactor;
            def.mappedTargetJoint = this._mappedTargetJoint._id;
            if (this._mappedType == jointType.belt)
            {
                def.belt = this.belt.toJson();
            }

            if (this._mappedType == jointType.prismaticPlane)
            {
                def._prismaticPlanePlane = {d: this._prismaticPlanePlane.d, normal: this._prismaticPlanePlane.normal.toJson()};
                def._prismaticPlaneTip = this._prismaticPlaneTip.toJson();
            }
        }
        else if (this._type == jointType.revolute)            
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
        this._minangle = def.minangle;
        this._maxangle = def._maxangle;
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
        this._hierachy.getJointHash()[this._id] = this;
    
        if (!this._parent)
            this._nodeid = KinematicsManager.viewer.model.createNode(KinematicsManager.viewer.model.getRootNode(), "rootJoint");
        else
            this._nodeid = KinematicsManager.viewer.model.createNode(this._parent._nodeid, "joint");
        for (let i=0;i<def.referenceNodes.length;i++)
        {
            this._referenceNodes.push({nodeid:def.referenceNodes[i].nodeid, matrix: Communicator.Matrix.fromJson(def.referenceNodes[i].matrix)});
            this._hierachy._jointNodeidHash[def.referenceNodes[i].nodeid] = this;
        }
        
        if (this._type == jointType.prismaticTriangle || this._type == jointType.prismaticAggregate || this._type == jointType.mate)            
        {
            this._extraJoint1 = def.extraJoint1;
            this._extraJoint2 = def.extraJoint2;
            if (this._type == jointType.mate)
            {
                this._extraPivot1 = Communicator.Point3.fromJson(def.extraPivot1);
                this._extraPivot2 = Communicator.Point3.fromJson(def.extraPivot2);
            }
        }
        else if (this._type == jointType.revoluteSlide)
        {
            this._extraJoint1 = def.extraJoint1;
            this._extraPivot1 = Communicator.Point3.fromJson(def.extraPivot1);
        }         
        else if (this._type == jointType.pistonController)            
        {
            this._extraJoint1 = def.extraJoint1;
        }
        else if (this._type == jointType.helical)            
        {
            this._helicalFactor = def.helicalFactor;
        }
        else if (this._type == jointType.mapped)            
        {
            this._helicalFactor = def.helicalFactor;
            this._mappedTargetJoint = def.mappedTargetJoint;
            if (this._mappedType == jointType.belt)
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

            if (this._mappedType == jointType.prismaticPlane)
            {
                let normal = Communicator.Point3.fromJson(def._prismaticPlanePlane.normal);
                this._prismaticPlanePlane = new Communicator.Plane();
                this._prismaticPlanePlane.d = def._prismaticPlanePlane.d;
                this._prismaticPlanePlane.normal = normal;
                this._prismaticPlaneTip = Communicator.Point3.fromJson(def._prismaticPlaneTip);
            }
            
        }
        else if (this._type == jointType.revolute)            
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
            let joint = new KinematicsJoint(this, this._hierachy);

            joint.fromJson(def.children[i], version);
            this._children.push(joint);
        }

        if (def.animations) {
            for (let i = 0; i < def.animations.length; i++) {
                this._animations.push(def.animations[i]);
            }
        }
    }


    
 /**
     * Add an animation template id to the joint.
     * @param  {uuid} animationid - Animation ID
     */ 
    addAnimation(animationid)
    {
        this._animations.push(animationid);
    }

  
 /**
     * Remove an animation from the joint based on its template id.
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
     * Update all HOOPS Communicator nodes associated with this joint
     * @param  {array} nodeids - Array of nodeids to associate with this joint
     */     
    updateReferenceNodes(nodeids)
    {
        for (let i = 0; i < this._referenceNodes.length; i++) {            
            delete this._hierachy._jointNodeidHash[this._referenceNodes[i].nodeid];
        }        
        this._referenceNodes = [];
        for (let i = 0; i < nodeids.length; i++) {
            this._referenceNodes.push({ nodeid: nodeids[i], matrix: KinematicsManager.viewer.model.getNodeNetMatrix(nodeids[i]).copy()});
            this._hierachy._jointNodeidHash[this._referenceNodes[i].nodeid] = this;
        }

    }


  
 /**
     * Remove all nodes specified in the supplied array from the joint
     * @param  {array} nodeids - Array of nodeids to remove from the joint
     */         
    removeReferenceNodes(nodeids) {
        for (let i = 0; i < this._referenceNodes.length; i++) {
            for (let j = 0; j < nodeids.length; j++) {
                if (this._referenceNodes[i].nodeid == nodeids[j]) {
                    delete this._hierachy._jointNodeidHash[this._referenceNodes[i].nodeid];
                    this._referenceNodes.splice(i, 1);
                    i--;
                    break;
                }
            }
        }
    }

    transformPointToJointSpace(pos)
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
            this._currentAngle += angle;
        else
            this._currentAngle = angle;


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

    }

    _translate(delta) {
        
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

    }

   

    adjustExtraJointToPistonController()
    {

        let naxis = joint._axis;
        let plane = Communicator.Plane.createFromPointAndNormal(joint._center, naxis);
        let pol = KinematicsUtility.closestPointOnPlane(plane, joint._extraJoint1._center);
        
        joint._extraJoint1._axis = joint._extraJoint1._axis.copy();
        joint._extraJoint1._center = pol;
    }

   

    async calculateReferenceMatrixFromHandleMatrix(matrix) {
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


        if (this._type == jointType.revolute)
        {
            let origmatrix = KinematicsManager.viewer.model.getNodeMatrix(this._nodeid);

            
            let localaxis = this._axis;

            let axis2t = Communicator.Point3.cross(new Communicator.Point3(1, 0, 0), localaxis);
            if (axis2t.length() < 0.00001)
                axis2t = Communicator.Point3.cross(new Communicator.Point3(0, 1, 0), localaxis);

            let axis2 = Communicator.Point3.add(axis2t, this._center);

            let p1 = origmatrix.transform(joint._center);
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

    
    setFixedAxisFromHandle(nodeid) {
        let handleOperator = KinematicsManager.viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        if (handleOperator.getPosition()) {
            if (!KinematicsManager.handlePlacementOperator.lastAxis2) 
                return;           


            let pivotaxis = Communicator.Point3.add(handleOperator.getPosition(),KinematicsManager.handlePlacementOperator.lastAxis2);
            let netmatrix = KinematicsManager.viewer.model.getNodeMatrix(nodeid);
            let pivot = netmatrix.transform(handleOperator.getPosition());
            pivotaxis = netmatrix.transform(pivotaxis);

            this._fixedAxis = Communicator.Point3.subtract(pivotaxis, this.center).normalize();
            this._fixedAxisTarget = new Communicator.Point3(0,-1,0);
            

        }
    }

    selectReferenceNodes() {
        KinematicsManager.viewer.selectionManager.clear();
        let selitems = [];
        for (let i = 0; i < this._referenceNodes.length; i++) {
            selitems.push(Communicator.Selection.SelectionItem.create(this._referenceNodes[i].nodeid));
        }
        KinematicsManager.viewer.selectionManager.add(selitems);
    }

    showHandles(handlesop, showFixed, nodeid, center) {
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

        if (this._type != jointType.prismatic && this._type != jointType.prismaticTriangle)
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
        if (this._type == jointType.revolute)
        {
            await this._rotate(this._currentAngle + this._hierachy._ikSamplingDistance, true);
   //         await this.updateJoints();
            let targetDistanceAfter = this._hierachy.distanceFromIKTarget();

            gradient = (targetDistanceAfter - targetDistanceBefore) / this._hierachy._ikSamplingDistance;
        }
        else
        {
            await this._translate(this._currentPosition + this._hierachy._ikSamplingDistanceTranslation);
       //     await this.updateJoints();
            let targetDistanceAfter = this._hierachy.distanceFromIKTarget();
            gradient = (targetDistanceAfter - targetDistanceBefore) / this._hierachy._ikSamplingDistanceTranslation;
        }
        
        if (this._type == jointType.revolute)
            await this._rotate(angle);
        else
            await this._translate(delta);

        this._touched = true;
        return gradient;
    }

    async update(gradient)
    {
        if (this._type == jointType.revolute)
            await this._rotate(this._currentAngle - this._hierachy._ikLearningRate * gradient);
        else
            await this._translate(this._currentPosition - (this._hierachy._ikLearningRate) * gradient);
    }

    reset()
    {
        if (this._type == jointType.revolute)
            this._rotate(0);
        else
            this._translate(0);
    }

    delete()
    {
        if (this._parent)
        {
            delete this._hierachy.getJointHash()[this._id];
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

   
    async _updateJointsFromReferenceRecursive(joint) {
        if (!joint)
            return;

        if (joint._type == jointType.revoluteSlide) {

            let pivot1trans = joint._extraJoint1.transformlocalPointToWorldSpace(joint._extraPivot1);
            let centertrans = joint._parent.transformlocalPointToWorldSpace(joint._center);
            let pivotorigtrans = joint._parent.transformlocalPointToWorldSpace(joint._extraPivot1);

            let v1 = Communicator.Point3.subtract(pivotorigtrans, centertrans).normalize();
            let v2 = Communicator.Point3.subtract(pivot1trans, centertrans).normalize();
            let angle = Communicator.Util.computeAngleBetweenVector(v1,v2);
            await joint._rotate(angle);

            let r = joint.transformlocalPointToWorldSpace(joint._extraPivot1);
            let pray = new Communicator.Point3(centertrans.x + v2.x * 10000, centertrans.y + v2.y * 10000, centertrans.z + v2.z * 10000);

            let outpoint = new Communicator.Point3(0,0,0);
            let ldist = Communicator.Util.computePointToLineDistance(r,centertrans,pray,outpoint);


             if (ldist > 0.0001)
                await joint._rotate(-angle);

        }
        if (joint._type == jointType.mate) {

            let originallength = Communicator.Point3.subtract(joint._extraPivot1, joint._extraPivot2).length();
            let pivot1trans = joint._extraJoint1.transformlocalPointToWorldSpace(joint._extraPivot1);
            let pivot2trans = joint._extraJoint2.transformlocalPointToWorldSpace(joint._extraPivot2);

            let newlength = Communicator.Point3.subtract(pivot1trans, pivot2trans).length();

      


            if (Math.abs(originallength - newlength) > 0.001) {
                let reactjoint;
                let triggerjoint;
                if (!joint._extraJoint2._touched)
                {
                    triggerjoint = { j: joint._extraJoint1, pivot: joint._extraPivot1};
                    reactjoint = { j: joint._extraJoint2, pivot: joint._extraPivot2};
                }
                else
                {
                    reactjoint = { j: joint._extraJoint1, pivot: joint._extraPivot1};
                    triggerjoint = { j: joint._extraJoint2, pivot: joint._extraPivot2};

                }
                joint._extraJoint1._touched = false;
                joint._extraJoint2._touched = false;
    
                let pivot1trans = triggerjoint.j.transformlocalPointToWorldSpace(triggerjoint.pivot);
                let pivot2trans = reactjoint.j.transformlocalPointToWorldSpace(reactjoint.pivot);
                let center2trans = reactjoint.j.transformlocalPointToWorldSpace(reactjoint.j._center);
    

                //Calculate Plane Matrix and transform to XY Plane
                let transformedCenter = triggerjoint.j.transformlocalPointToWorldSpace(joint._center);
                let transformedAxis = triggerjoint.j.transformlocalPointToWorldSpace(Communicator.Point3.add(joint._center,joint._axis));
                let planenormal = Communicator.Point3.subtract(transformedAxis, transformedCenter).normalize();
                let planenormal2 = joint._axis;

                let xymatrix = KinematicsUtility.ComputeVectorToVectorRotationMatrix(planenormal, new Communicator.Point3(0, 0, 1));
                let xyinverse = Communicator.Matrix.inverse(xymatrix);


                let center1_2d = xymatrix.transform(pivot1trans);
                let radius1 = originallength;

                let center2_2d = xymatrix.transform(center2trans);
                let radius2 = Communicator.Point3.subtract(reactjoint.j._center, reactjoint.pivot).length();

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

                //_rotate mate joint
              
                let pivot1trans_2 = triggerjoint.j.transformlocalPointToWorldSpace(reactjoint.pivot);
                
                let v1 = Communicator.Point3.subtract(pivot1trans_2, pivot1trans).normalize();
                let v2 = Communicator.Point3.subtract(res1, pivot1trans).normalize();
                
                let angle = Communicator.Util.computeAngleBetweenVector(v1,v2);
                let mat = KinematicsUtility.computeOffaxisRotationMatrix(triggerjoint.pivot,planenormal2, angle);

                let invmatrix = Communicator.Matrix.inverse(KinematicsManager.viewer.model.getNodeNetMatrix( KinematicsManager.viewer.model.getNodeParent(joint._nodeid)));

                let resmatrix = Communicator.Matrix.multiply(mat, KinematicsManager.viewer.model.getNodeNetMatrix(triggerjoint.j._nodeid));
                let resmatrix2 = Communicator.Matrix.multiply(resmatrix,invmatrix);
                await KinematicsManager.viewer.model.setNodeMatrix(joint._nodeid, resmatrix2);
                
                let r = joint.transformlocalPointToWorldSpace(reactjoint.pivot);
                if (Communicator.Point3.subtract(r,res1).length() > 0.0001)
                {
                    mat = KinematicsUtility.computeOffaxisRotationMatrix(triggerjoint.pivot,planenormal2, -angle);
                    resmatrix = Communicator.Matrix.multiply(mat, KinematicsManager.viewer.model.getNodeNetMatrix(triggerjoint.j._nodeid));
                    let resmatrix2 = Communicator.Matrix.multiply(resmatrix,invmatrix);
                    await KinematicsManager.viewer.model.setNodeMatrix(joint._nodeid, resmatrix2);
    
                }
                
                //_rotate react joint

                pivot1trans_2 = reactjoint.j._parent.transformlocalPointToWorldSpace(reactjoint.pivot);
                
                v1 = Communicator.Point3.subtract(pivot1trans_2, center2trans).normalize();
                v2 = Communicator.Point3.subtract(res1, center2trans).normalize();
                
                angle = Communicator.Util.computeAngleBetweenVector(v1,v2);
                await reactjoint.j._rotate(angle);
                let tm = this._hierachy.getReferenceNodeNetMatrix(reactjoint.j);
                r = tm.transform(reactjoint.pivot);

                await reactjoint.j._rotate(-angle);
                tm = this._hierachy.getReferenceNodeNetMatrix(reactjoint.j);
                let r2 = tm.transform(reactjoint.pivot);

                dist1 = Communicator.Point3.subtract(r,res1).length();
                dist2 = Communicator.Point3.subtract(r2,res1).length();
                if (dist1 < dist2)
                {
                    await reactjoint.j._rotate(angle);
                }

                await this.getHierachy().updateJoints();

            }

        }            
        else if (joint._type == jointType.pistonController)
        {
            let p1 = joint._parent.transformlocalPointToWorldSpace(joint._center);
            let p1a = joint._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(joint._center,joint._axis));

            let p2 =  joint._extraJoint1._parent.transformlocalPointToWorldSpace(joint._extraJoint1._center);            
            let p3 =  joint._extraJoint1._parent.transformlocalPointToWorldSpace(Communicator.Point3.add(joint._extraJoint1._center,joint._extraJoint1._axis));            

            let naxis = Communicator.Point3.subtract(p3,p2).normalize();
            let pol = KinematicsUtility.nearestPointOnLine(p2, naxis, p1);
            let delta = Communicator.Point3.subtract(pol,p1);
            let a =  delta.length();

            let c = Communicator.Point3.subtract(joint._extraJoint1._center,joint._center).length();          

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


            let ttt =  joint._extraJoint1._parent.transformlocalPointToWorldSpace(joint._extraJoint1._center);    
            let ttt1 = Communicator.Point3.subtract(pol2,ttt).length();
            let ttt2 = Communicator.Point3.subtract(pol3,ttt).length();

            if (ttt2 < ttt1)
                pol2 = pol3;
                
            let p22 =  joint._parent.transformlocalPointToWorldSpace(joint._extraJoint1._center);    

            let v1 = Communicator.Point3.subtract(p22,p1).normalize();
            let v2 = Communicator.Point3.subtract(pol2,p1).normalize();

            let fangle = Communicator.Util.computeAngleBetweenVector(v1,v2);
            await joint._rotate(-fangle);

            p22 =  joint.transformlocalPointToWorldSpace(joint._extraJoint1._center);    
            let diff = Communicator.Point3.subtract(p22,pol2).length();
            await joint._rotate(fangle);
            p22 =  joint.transformlocalPointToWorldSpace(joint._extraJoint1._center);    
            let diff2 = Communicator.Point3.subtract(p22,pol2).length();
            if (diff2>diff)
                await joint._rotate(-fangle);

            let deltafj = Communicator.Point3.subtract(joint._extraJoint1._center,joint.transformlocalPointToWorldSpace(joint._extraJoint1._center)).length();
             await joint._extraJoint1._translate(-deltafj);
             let dx = Communicator.Point3.subtract(joint._extraJoint1.transformlocalPointToWorldSpace(joint._extraJoint1._center),joint.transformlocalPointToWorldSpace(joint._extraJoint1._center)).length();
             await joint._extraJoint1._translate(deltafj);
             let dx2 = Communicator.Point3.subtract(joint._extraJoint1.transformlocalPointToWorldSpace(joint._extraJoint1._center),joint.transformlocalPointToWorldSpace(joint._extraJoint1._center)).length();
            if (dx2>dx)
                await joint._extraJoint1._translate(-deltafj);



        }
        else if (joint._type == jointType.prismaticAggregate)
        {
            let matrix1 = KinematicsManager.viewer.model.getNodeMatrix(joint._extraJoint1._nodeid);
            let matrix2 = KinematicsManager.viewer.model.getNodeMatrix(joint._extraJoint2._nodeid);
            let resmatrix = Communicator.Matrix.multiply(matrix1, matrix2);
            await KinematicsManager.viewer.model.setNodeMatrix(joint._nodeid, resmatrix);

        }
        else if (joint._type == jointType.prismaticTriangle)
        {
            let p1 = joint._extraJoint1.transformlocalPointToWorldSpace(joint._center);
            let p2 =  joint._extraJoint2.transformlocalPointToWorldSpace(joint._extraJoint2._center);            
            let p3 = joint._extraJoint2._parent.transformlocalPointToWorldSpace(joint._center);     


            let delta = Communicator.Point3.subtract(p2,p1);
            let delta2 = Communicator.Point3.subtract(p2,p3);
            let ld1 = delta.length();
            let ld2 = delta2.length();

            delta.normalize();
            delta2.normalize();

            let angle = Communicator.Util.computeAngleBetweenVector(delta, delta2);

            let p22 =  joint._extraJoint2.transformlocalPointToWorldSpace(joint._center);     

            await joint._extraJoint2._rotate(-angle, true);
            let p1x = joint._extraJoint2.transformlocalPointToWorldSpace(joint._center);
           
            let delta3 = Communicator.Point3.subtract(p1x,p1);
            let ld3 = delta3.length();

            await joint._extraJoint2._rotate(angle, true);
            p1x = joint._extraJoint2.transformlocalPointToWorldSpace(joint._center);
            let delta4 = Communicator.Point3.subtract(p1x,p1);
            let ld4 = delta4.length();

            if (ld4>ld3)
                await joint._extraJoint2._rotate(-angle, true);

            await this._updateReferenceNodeMatrices(joint._extraJoint2);

             await joint._translate(ld1 - ld2);
        }
        else if (joint._type == jointType.helical)
        {
            let p1 = joint._parent.transformlocalPointToWorldSpace(joint._center);
            let p2 = joint.transformlocalPointToWorldSpace(joint._center);
            let length = Communicator.Point3.subtract(p2,p1).length();
            joint._translate(length);
            let p3 = joint.transformlocalPointToWorldSpace(joint._center);
            joint._translate(-length);
            let p4 = joint.transformlocalPointToWorldSpace(joint._center);
            if (Communicator.Point3.subtract(p3,p2).length() < Communicator.Point3.subtract(p4,p2).length())
            {
                joint._translate(length);
                length = -length;
            }

            joint._rotate(length * joint._helicalFactor, true, true);
        }
        else if (joint._type == jointType.mapped) {
            if (joint._mappedType == jointType.prismaticPlane) {
                let matrix = KinematicsManager.viewer.model.getNodeNetMatrix(joint._mappedTargetJoint._nodeid);
                let pp = matrix.transform(joint._prismaticPlaneTip);
                let dist = joint._prismaticPlanePlane.distanceToPoint(pp);
                if (dist < 0)
                    await joint._translate(dist * joint._helicalFactor);
                else
                    await joint._translate(0);
            }
            else if (joint._mappedTargetJoint._type == jointType.prismatic || (joint._mappedTargetJoint._type == jointType.mapped && joint._mappedTargetJoint._mappedType == jointType.prismatic)) {
                let savdelta = joint._mappedTargetJoint._currentPosition;
                let savmatrix = KinematicsManager.viewer.model.getNodeMatrix(joint._mappedTargetJoint._nodeid);
                let p1 = joint._mappedTargetJoint._parent.transformlocalPointToWorldSpace(joint._mappedTargetJoint._center);
                let p2 = joint._mappedTargetJoint.transformlocalPointToWorldSpace(joint._mappedTargetJoint._center);
                let length = Communicator.Point3.subtract(p2, p1).length();
                joint._mappedTargetJoint._translate(length);
                let p3 = joint._mappedTargetJoint.transformlocalPointToWorldSpace(joint._mappedTargetJoint._center);
                joint._mappedTargetJoint._translate(-length);
                let p4 = joint._mappedTargetJoint.transformlocalPointToWorldSpace(joint._mappedTargetJoint._center);
                if (Communicator.Point3.subtract(p3, p2).length() < Communicator.Point3.subtract(p4, p2).length())
                    length = -length;
                KinematicsManager.viewer.model.setNodeMatrix(joint._mappedTargetJoint._nodeid, savmatrix);

                if (joint._mappedType == jointType.revolute) 
                {
                    await joint._rotate(length * joint._helicalFactor, true);
                    joint._currentAngle = length * joint._helicalFactor;
                }
                else if (joint._mappedType == jointType.prismatic)
                    await joint._translate(length * joint._helicalFactor, true);
                else if (joint._mappedType == jointType.belt)
                    await joint.belt.move(length * joint._helicalFactor);                    

                joint._mappedTargetJoint._currentPosition = savdelta;
            }
            else if (joint._mappedTargetJoint._type == jointType.revolute || joint._mappedTargetJoint._type == jointType.mapped) {
             
                if (joint._mappedType == jointType.revolute) 
                {
                    await joint._rotate(joint._mappedTargetJoint._currentAngle * joint._helicalFactor, true);
                    joint._currentAngle = joint._mappedTargetJoint._currentAngle * joint._helicalFactor;
                }
                else if (joint._mappedType == jointType.prismatic)
                    await joint._translate(joint._mappedTargetJoint._currentAngle * joint._helicalFactor, true);
                else if (joint._mappedType == jointType.belt)
                    await joint.belt.move(joint._mappedTargetJoint._currentAngle * joint._helicalFactor);

                
            }
        }
        else if (joint._type == jointType.revolute && joint._fixedAxis)
        {          
            let centerworld = joint.transformlocalPointToWorldSpace(joint._center);
            let fixedworld = joint.transformlocalPointToWorldSpace(Communicator.Point3.add(joint._center,joint._fixedAxis));

            let axis1 = Communicator.Point3.subtract(fixedworld,centerworld).normalize();

       
            let axis2 = joint._fixedAxisTarget;

            let rotaxis = joint.transformlocalPointToWorldSpace(Communicator.Point3.add(joint._center,joint._axis));
            let rotaxis2 = Communicator.Point3.subtract(rotaxis,centerworld).normalize();

            let plane = Communicator.Plane.createFromPointAndNormal(centerworld, rotaxis2);
            let dist = plane.distanceToPoint(new Communicator.Point3.add(centerworld, axis2));
            let res = KinematicsUtility.closestPointOnPlane(plane, new Communicator.Point3.add(centerworld, axis2));
            axis2 = new Communicator.Point3.subtract(res,centerworld).normalize();
            let angle = Communicator.Util.computeAngleBetweenVector(axis1, axis2);
            await joint._rotate(angle,true, true);


            centerworld = joint.transformlocalPointToWorldSpace(joint._center);
            fixedworld = joint.transformlocalPointToWorldSpace(Communicator.Point3.add(joint._center,joint._fixedAxis));
            let axis1x = Communicator.Point3.subtract(fixedworld,centerworld).normalize();

            let delta = Communicator.Point3.subtract(axis1x,axis2).length();
            if (delta>0.001)
                await joint._rotate(-angle*2,true,true);
            
        }
                    
        await this._updateReferenceNodeMatrices(joint);
        if (joint._children.length > 0)
        {
            for (let j=0;j<joint._children.length;j++)
                await this._updateJointsFromReferenceRecursive(joint._children[j]);
        }

    }


    async _updateReferenceNodeMatrices(joint) {
        if (joint._reference) {

            if (joint._parent && joint._parent._reference == false) {
                for (let i = 0; i < joint._referenceNodes.length; i++) {
                    let resmatrix = Communicator.Matrix.multiply(joint._referenceNodes[i].matrix, KinematicsManager.viewer.model.getNodeMatrix(joint._nodeid));
                    let resmatrix3 = Communicator.Matrix.multiply(resmatrix, KinematicsManager.viewer.model.getNodeMatrix(joint._parent._nodeid));
                    let r2 = Communicator.Matrix.inverse(joint._parent._parentMatrix);
                    let resmatrix2 = Communicator.Matrix.multiply(resmatrix3, r2);
                    KinematicsManager.viewer.model.setNodeMatrix(joint._referenceNodes[i].nodeid, resmatrix2);
                }

            }
            else {
                for (let i = 0; i < joint._referenceNodes.length; i++) {
                    let resmatrix = Communicator.Matrix.multiply(joint._referenceNodes[i].matrix, this._hierachy.getReferenceNodeNetMatrix(joint));
                    let r2 = Communicator.Matrix.inverse(joint._parentMatrix);
                    let resmatrix2 = Communicator.Matrix.multiply(resmatrix, r2);
                    KinematicsManager.viewer.model.setNodeMatrix(joint._referenceNodes[i].nodeid, resmatrix2);
                }
            }
        }
        else {
            for (let i = 0; i < joint._referenceNodes.length; i++) {
                let resmatrix = Communicator.Matrix.multiply(joint._referenceNodes[i].matrix, KinematicsManager.viewer.model.getNodeMatrix(joint._nodeid));
                let r2 = Communicator.Matrix.inverse(joint._parentMatrix);
                let resmatrix2 = Communicator.Matrix.multiply(resmatrix, r2);
                KinematicsManager.viewer.model.setNodeMatrix(joint._referenceNodes[i].nodeid, resmatrix2);
            }
        }
    }


}