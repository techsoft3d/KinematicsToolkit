import { KinematicsAnimationGroup } from './KinematicsAnimation.js';
import { KinematicsJoint } from './KinematicsJoint.js';
import { jointType } from './KinematicsJoint.js';
import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsUtility } from './KinematicsUtility.js';

/** This class represents a Hierachy of Kinematics Joints*/
export class KinematicsHierachy {

     /**
     * Create a Kinematics Hierachy Object.    
     */
    constructor() {

        this._templateId = null;
        this._highestId = 0;
        this._nodeid = undefined;

        this._jointNodeidHash = [];
        this._jointHash = [];

        this._ikTip = new Communicator.Point3(0, 0, 0);   
        this._ikThreshold = 1;
        this._ikSpeed = 100;
        this._ikSamplingDistance = 0.1;
        this._ikSamplingDistanceTranslation = 1;
        this._ikLearningRate = 0.1;
        this._interval = null;

        this._targetPoint = new Communicator.Point3(0, 0, 0);
       
        
        this._rootJoint = this.createJoint(null,[],true);
        this._rootJoint.setType(jointType.fixed);
        
        this._tipJoint = null;

        this._targetAnchorPosition = null;
        this._targetAnchorNode = null;       
        
        this._dirty = false;
    }
     
 /**
    * Retrieve Joint Hash
    * @return {hash} Joint Hash
     */      
  getJointHash()
  {
      return this._jointHash;
  }

 
/**
  * Retrieve Root Joint
  * @return {KinematicsJoint} Joint 
   */  
  getRootJoint()
  {
      return this._rootJoint;
  }


   /**
     * Retrieves joint associated with this hierachy from its id
     * @param  {number} id - Joint ID
     * @return {KinematicsJoint} Joint
     */
    getJointById(id)
    {
        let res = this._jointHash[id];
        if (res != undefined)
            return  res;
        else
            return null;
    }

   /**
     * Retrieves ID of template associated with this hierachy     
     * @return {uuid} Template ID
     */
    getTemplateId()
    {
        return this._templateId;
    }

    
   /**
     * Generate or Update Template for this Hierachy
     */
    generateTemplate()
    {
        if (!this._templateId)
        {
            this._templateId = KinematicsUtility.generateGUID();
            let template = this.toJson();
            KM.KinematicsManager.addTemplate(template);           
        }
        else
        {
            let template = KM.KinematicsManager.toJson(this);
            KM.KinematicsManager.updateTemplate(template);
        }        
    }
    


   /**
     * Update all joints 
     */   
    async updateJoints()
    {
        await this._rootJoint._updateJointsFromReferenceRecursive(this._rootJoint);
    }



   /**
     * Set Tip Position for Inverse Kinematics
     * @param  {Point3} tip - IK Tip Location
     */    
    setIkTip(tip)
    {
        this._ikTip = tip;
    }

  /**
     *Retrieve Tip Location for Inverse Kinematics
    * @return {Point3} IK Tip Location
     */        
    getIkTip()
    {
        return this._ikTip;
    }

    
   /**
     * Set Threshold for Inverse Kinematics
     * @param  {number} ikThreshold - IK Threshold
     */    
    setIkThreshold(ikThreshold)
    {
        this._ikThreshold = ikThreshold;
    }

    /**
    * Retrieve Threshold for Inverse Kinematics
    * @return {number} IK Threshold
     */    
    getIkThreshold()
    {
        return this._ikThreshold;
    }

    
   /**
     * Set Speed for Inverse Kinematics
     * @param  {number} ikSpeed - IK Speed
     */        
    setIkSpeed(ikSpeed)
    {
        this._ikSpeed = ikSpeed;
    }
    
    /**
    * Retrieve Speed for Inverse Kinematics
    * @return {number} IK Speed
     */    
    getIkSpeed()
    {
        return this._ikSpeed;
    }


     /**
     * Set Minimum Sampling Distance for Inverse Kinematics
     * @param  {number} ikSamplingDistance - IK Sampling Distance
     */            
    setIkSamplingDistance(ikSamplingDistance)
    {
        this._ikSamplingDistance = ikSamplingDistance;
    }
    
    /**
    * Retrieve Sampling Distance for Inverse Kinematics
    * @return {number} IK Sampling Distance
     */        
    getIkSamplingDistance()
    {
        return this._ikSamplingDistance;
    }

     
    setIkSamplingDistanceTranslation(ikSamplingDistanceTranslation)
    {
        this._ikSamplingDistanceTranslation = ikSamplingDistanceTranslation;
    }

    getIkSamplingDistanceTranslation()
    {
        return this._ikSamplingDistanceTranslation;
    }

       
 /**
     * Set Learning Rate for Inverse Kinematics
     * @param  {number} ikLearningRate - IK Learning Rate
     */    
    setIkLearningRate(ikLearningRate)
    {
        this._ikLearningRate = ikLearningRate;
    }

  /**
    * Retrieve Learning Rate for Inverse Kinematics
    * @return {number} IK Learning Rate
     */        
    getIkLearningRate()
    {
        return this._ikLearningRate;
    }
   
    
  /**
    * Retrieves if Inverse Kinematics is currently activer
    * @return {bool} IK Active
     */       
    isIKActive()
    {
        if (this._interval)
            return true;
        else
            return false;
    }

    
  /**
    * Stop any Inverse Kinematics calculation
     */       

    stopIK()
    {
        if (this._interval) {
            clear_interval(this._interval);
            this._interval = null;
        }
    }

       
  /**
    * Activate Inverse Kinematics and set Kinematics Tip to currently active handle position
     */      
    startIKFromHandle() {

        if (!this._interval) {
            let _this = this;
            let handleOperator = KinematicsManager.viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
            this._interval = set_interval(async function () {
                let targetpoint = handleOperator.getPosition();
                if (targetpoint || _this._targetAnchorPosition) {
                    if (_this._targetAnchorPosition) {
                        let m = KinematicsManager.viewer.model.getNodeNetMatrix(_this._targetAnchorNode);
                        _this._targetPoint = m.transform(_this._targetAnchorPosition);
                    }
                    else {
                        let m = KinematicsManager.viewer.model.getNodeMatrix(KinematicsManager.handleNode);
                        _this._targetPoint = m.transform(new Communicator.Point3(0, 0, 0));
                    }
                    for (let i = 0; i < _this._ikSpeed; i++) {
                        let dis = _this.distanceFromIKTarget();
                        if (dis > _this._ikThreshold) {
                            await _this._inverseKinematics();
                        }                       
                    }
                }

            }, 1);
        }
    }

    
         
  /**
    * Insert Handle from Inverse Kinematics Target Point
     */  
    insertIKHandle() {
        let handleOperator = KinematicsManager.viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        handleOperator.removeHandles();            
        handleOperator.addHandles([KinematicsManager.handleNode], this._targetPoint);
        KinematicsManager.viewer.model.setNodesVisibility([KinematicsManager.handleNode], true);
        handleOperator.showHandles();
    }

       
  /**
    * Set Handle to Inverse Kinematics Tip
    * @param  {bool} insertHandle - Insert Handle
     */  
    setIKHandleToTip(insertHandle)
    {
        let mat = this.getReferenceNodeNetMatrix(this._tipJoint);
        let _ikTip = mat.transform(this._ikTip);

        mat = new Communicator.Matrix();
        mat.setTranslationComponent(_ikTip.x, _ikTip.y, _ikTip.z);
        this._targetPoint = _ikTip.copy();
        KinematicsManager.viewer.model.setNodeMatrix(KinematicsManager.handleNode, mat);
        if (insertHandle)
            this.insertIKHandle();
    }


      
  /**
    * Set Inverse Kinematics Tip to Handle Position
     */      
    setTipToHandlePosition()
    {
       
        let handleOperator = KinematicsManager.viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        let pos = handleOperator.getPosition();
     
        this._ikTip = this._tipJoint.transformPointToJointSpace(pos);
    }



    setTargetAnchorToHandlePosition()
    {
       
        let handleOperator = KinematicsManager.viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        let pos = handleOperator.getPosition();
        let selections = KinematicsManager.viewer.selectionManager.getResults();
        let nodeid = selections[0].getNodeId();

        let resmatrix = Communicator.Matrix.inverse(KinematicsManager.viewer.model.getNodeNetMatrix(nodeid));
        this._targetAnchorPosition = resmatrix.transform(pos);    
        this._targetAnchorNode = nodeid;
    }

    
    distanceFromIKTarget() {
        let matrix = this.getReferenceNodeNetMatrix(this._tipJoint);      
        let temp = matrix.transform(this._ikTip);
        let res = Communicator.Point3.subtract(this._targetPoint, temp);
        return res.length();
    }
    
    /**
    * Remove Animations from All Joints
    * @param  {uuid} animationTemplateId - Animation Template ID
     */  
    removeAnimationFromJoints(animationTemplateId)
    {
        this._rootJoint.removeAnimationRecursive(animationTemplateId);
    }


  /**
    * Generate JSON object for this Hierarchy
    * @return {object} JSON object
     */      
    toJson() {
        let def = { version: 1.0,_ikTip: this._ikTip.toJson(),_templateId: this._templateId,_ikSamplingDistance: this._ikSamplingDistance, _ikSamplingDistanceTranslation: this._ikSamplingDistanceTranslation, _ikLearningRate: this._ikLearningRate, _ikThreshold: this._ikThreshold, _ikSpeed: this._ikSpeed, 
            _targetAnchorNode:this._targetAnchorNode };
        if (this._targetAnchorPosition)            
            def._targetAnchorPosition = this._targetAnchorPosition.toJson();
        def.joints = this._rootJoint.toJson();

        let animhash = [];
        let anims = [];
        this._rootJoint.animToJson(animhash);
        for (let i in animhash)
        {
            let atemplate = KinematicsManager.getAnimationTemplate(i);
            if (atemplate != undefined)
            {
                atemplate._templateId = i;
                anims.push(atemplate);            
            }
        }
        def.animations = anims;


        def.animationGroups = [];
        for (let i=0;i<KinematicsManager._animationGroups.length;i++)
        {
            let group = KinematicsManager._animationGroups[i];
            if (group.hierachy == this)
            {
                def.animationGroups.push(group.toJson());
            }
        }

        return def;
    }

         
  /**
    * Populate Hierachy from provided JSON object 
    * @param  {object} def - JSON Object
     */  
    fromJson(def) {
        this._highestId = 0;
        this._ikTip = Communicator.Point3.fromJson(def._ikTip);
        this._ikThreshold = def._ikThreshold;
        this._ikSpeed = def._ikSpeed;
        this._ikSamplingDistance = def._ikSamplingDistance;
        this._ikSamplingDistanceTranslation = def._ikSamplingDistanceTranslation;
        this._ikLearningRate = def._ikLearningRate;      
        this._targetAnchorNode = def._targetAnchorNode;
        this._templateId = def._templateId;
        if (def._targetAnchorPosition)
            this._targetAnchorPosition = Communicator.Point3.fromJson(def._targetAnchorPosition);

        let joint = new KinematicsJoint(null,this);
        joint.fromJson(def.joints, def.version);
        this._rootJoint = joint;

        while (true)
        {        
            if (joint.getChildren().length==0) 
            {
                this._tipJoint = joint;
                break;
            }                
            joint = joint.getChildren()[0];
        }      
        
        for (let i in this._jointHash)
        {
            let joint = this._jointHash[i];
            if (joint.getType() == jointType.prismaticTriangle || joint.getType() == jointType.prismaticAggregate || joint.getType() == jointType.mate)
            {
                joint.setExtraJoint1(this._jointHash[joint.getExtraJoint1()]);
                joint.setExtraJoint2(this._jointHash[joint.getExtraJoint2()]);
            }
            if (joint.getType() == jointType.revoluteSlide)
            {
                joint.setExtraJoint1(this._jointHash[joint.getExtraJoint1()]);
            }
            else if (joint.getType() == jointType.pistonController)
            {
                joint.setExtraJoint1(this._jointHash[joint.getExtraJoint1()]);
            }
            else if (joint.getType() == jointType.mapped)
            {
                joint._mappedTargetJoint = this._jointHash[joint.getMappedTargetJoint()];
            }
        }

        if (def.animations != undefined) {
            for (let i = 0; i < def.animations.length; i++) {
                KinematicsManager.addAnimationTemplateFromJson(def.animations[i]._templateId, def.animations[i]);

            }
        }

        if (def.animationGroups != undefined) {
            for (let i = 0; i < def.animationGroups.length; i++) {
                let group = new KinematicsAnimationGroup(this);
                group.fromJson(def.animationGroups[i]);
                KinematicsManager.addAnimationGroup(group);
            }
        }

        return def;
    }

           
  /**
    * Reset All Joints in Hierachy
     */  
    resetJoints() {

        let joint = this._rootJoint;
        while (true) {
     
            joint.reset();
            if (joint.getChildren().length == 0)
                break;
            joint = joint.getChildren()[0];                
        }
        if (this._interval) {
            clear_interval(this._interval);
            this._interval = null;
        }
    }

    createJoint(parentjoint, nodeids, isReferenceIn, infront) {

        let isReference = true;
        if (isReferenceIn != undefined && isReferenceIn == false)
            isReference = false;

        let joint = new KinematicsJoint(parentjoint, this);
        this._jointHash[joint.getId()] = joint;
        joint.initialize(nodeids, isReference);
        if (parentjoint == null)
            this._rootJoint = joint;
        else {
            if (!infront)
                parentjoint.getChildren().push(joint);
            else
                parentjoint.getChildren().unshift(joint);
        }

        this._tipJoint = this._findTipJoint();
        for (let i = 0; i < nodeids.length; i++)
            this._jointNodeidHash[nodeids[i]] = joint;

        return joint;
    }

    createJointFromSelection(parentjoint,isReference, infront)
    {          
        let nodeids = [];
        let selections = KinematicsManager.viewer.selectionManager.getResults();
        for (let i=0;i<selections.length;i++)
            nodeids.push(selections[i].getNodeId());
         
        let newjoint = this.createJoint(parentjoint,nodeids, isReference, infront);
      
        newjoint.setParametersFromHandle();
        return newjoint;      
    }

    async rebuildJointTree()
    {
        KinematicsManager.viewer.model.deleteNode(this._rootJoint.getNodeId());
        this._rebuildJointTreeRecursive(this._rootJoint);        
    }



    applyToModel(nodeid)
    {
        this._jointNodeidHash = [];
        let childnode = KinematicsManager.viewer.model.getNodeChildren(nodeid)[0];
        let startmatrix;
        if (nodeid == KinematicsManager.viewer.model.getRootNode() || nodeid == undefined)
            startmatrix = new Communicator.Matrix();
        else
            startmatrix = KinematicsManager.viewer.model.getNodeMatrix(nodeid);

        this._applyToModelRecursive(this._rootJoint, KinematicsManager.viewer.model.getNodeIdOffset(childnode), startmatrix);
    }

    

    getReferenceNodeNetMatrix(injoint) 
    { 
        return KinematicsManager.viewer.model.getNodeNetMatrix(injoint.getNodeId());
    }


    _applyToModelRecursive(joint, offset, startmatrix)
    {
     
        this._jointNodeidHash[joint.getNodeId()] = joint;

        let temp = startmatrix.transform(Communicator.Point3.add(joint.getCenter(),joint.getAxis()));
        joint.setCenter(startmatrix.transform(joint.getCenter()));
        joint.setAxis(Communicator.Point3.subtract(temp,joint.getCenter()).normalize());
        
        joint._parentMatrix = Communicator.Matrix.multiply(joint.getParentMatrix(), startmatrix);
        if (joint.fixedAxis)
            joint.fixedAxis = startmatrix.transform(joint.fixedAxis);
         
        let referenceNodes = joint.getReferenceNodes();
        for (let i=0;i<referenceNodes.length;i++)
        {

            referenceNodes[i].nodeid = offset + referenceNodes[i].nodeid;            
            referenceNodes[i].matrix = Communicator.Matrix.multiply(referenceNodes[i].matrix,startmatrix);

            this._jointNodeidHash[referenceNodes[i].nodeid] = joint;

        }
      
        if (joint.getChildren().length > 0)
        {
            for (let j=0;j<joint.getChildren().length;j++)
                this._applyToModelRecursive(joint.getChildren()[j], offset, startmatrix);
        }
        
    }

    setDirty(isDirty)
    {
        this._dirty = true;
    }

    getDirty()
    {
        return this._dirty;
    }

    
    
    setNodeId(nodeid)
    {
        this._nodeid = nodeid;        
    }
    
    _findTipJoint()
    {
        let joint = this._rootJoint;
        while (true) {
              
            if (joint.getChildren().length == 0)
                break;
            joint = joint.getChildren()[0];                
        }
        return joint;
    
    }

    _rebuildJointTreeRecursive(joint)
    {
        if (!joint.getParent())
            joint.setNodeId(KinematicsManager.viewer.model.createNode(KinematicsManager.viewer.model.getRootNode(), "_rootJoint"));
         else
            joint.setNodeId(KinematicsManager.viewer.model.createNode(joint.getParent().getNodeId(), "joint"));
        if (joint.getChildren().length > 0)
        {
            for (let j=0;j<joint.getChildren().length;j++)
                this._rebuildJointTreeRecursive(joint.getChildren()[j]);
        }
        
    }

    async _inverseKinematics() {

        let joint = this._rootJoint;
        while (true)
        {
            if (joint.getType() != jointType.fixed && joint.fixedAxis == null && joint.getType() != jointType.pistonController && joint.getType() != jointType.prismaticAggregate)
            {
                let gradient = await joint.calculateGradient();
                await joint.update(gradient);       
            }
            if (joint.getType() == jointType.prismaticAggregate)
            {
                let gradient = await joint.getExtraJoint1().calculateGradient();
                await joint.getExtraJoint1().update(gradient);       
                gradient = await joint.getExtraJoint2().calculateGradient();
                await joint.getExtraJoint2().update(gradient);                       
            }
            if (joint.getChildren().length==0 || (joint.getType() == jointType.fixed && joint != this._rootJoint))
                break;                
            joint = joint.getChildren()[0];
        } 
        await this._rootJoint.updateJointsFromReference();

    }
}

