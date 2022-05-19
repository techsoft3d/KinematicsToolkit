import { KinematicsAnimationGroup } from './KinematicsAnimation.js';
import { KinematicsComponent } from './KinematicsComponent.js';
import { componentType } from './KinematicsComponent.js';
import { KinematicsComponentBehaviorPivotSystem } from './KinematicsComponentBehaviorPivotSystem.js';
import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsUtility } from './KinematicsUtility.js';

/** This class represents a Hierachy of Kinematics Components*/
export class KinematicsHierachy {

     /**
     * Create a Kinematics Hierachy Object.    
     */
    constructor() {

        this._templateId = null;
        this._highestId = 0;
        this._nodeid = undefined;

        this._componentNodeidHash = [];
        this._componentHash = [];

        this._ikTip = new Communicator.Point3(0, 0, 0);   
        this._ikThreshold = 1;
        this._ikSpeed = 100;
        this._ikSamplingDistance = 0.1;
        this._ikSamplingDistanceTranslation = 1;
        this._ikLearningRate = 0.1;
        this._interval = null;

        this._targetPoint = new Communicator.Point3(0, 0, 0);
       
        
        this._rootComponent = this.createComponent(null,[],true);
        this._rootComponent.setType(componentType.fixed);
        
        this._tipComponent = null;

        this._targetAnchorPosition = null;
        this._targetAnchorNode = null;       
        
        this._enforceLimits = false;
        this._touchedRewind = null;

        this._systems = [];

        this._dirty = false;
    }
     
 /**
    * Retrieve Component Hash
    * @return {hash} Component Hash
     */      
  getComponentHash()
  {
      return this._componentHash;
  }

/**
  * Retrieve Root Component
  * @return {KinematicsComponent} Component 
   */  
  getRootComponent()
  {
      return this._rootComponent;
  }

   /**
     * Retrieves component associated with this hierachy from its id
     * @param  {number} id - Component ID
     * @return {KinematicsComponent} Component
     */
    getComponentById(id)
    {
        let res = this._componentHash[id];
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
            KinematicsManager.addTemplate(template);           
        }
        else
        {
            let template = this.toJson(this);
            KinematicsManager.updateTemplate(template);
        }        
    }
    
    async _updateComponentsWithBehaviorRecursive(component) {
        if (!component)
            return;

        await component._execute();

        await component._updateReferenceNodeMatrices();

        if (component._children.length > 0)
        {
            for (let j=0;j<component._children.length;j++)
                await this._updateComponentsWithBehaviorRecursive(component._children[j]);
        }
    }

    async _updateComponentsRecursive(component) {
        if (!component)
            return;
       
        await component._updateReferenceNodeMatrices();

        if (component._children.length > 0)
        {
            for (let j=0;j<component._children.length;j++)
                await this._updateComponentsRecursive(component._children[j]);
        }

    }

   /**
     * Update all components 
     */   
    async updateComponents()
    {
        if (this._enforceLimits)
        {
            this._saveHierachyState();
        }
        KinematicsComponentBehaviorPivotSystem.clearExecutedSystems(this);

        await this._updateComponentsWithBehaviorRecursive(this._rootComponent);
        await KinematicsComponentBehaviorPivotSystem.executeUnexecutedSystems(this);
        await this._updateComponentsWithBehaviorRecursive(this._rootComponent);
        if (this._enforceLimits && this._cantResolve)
        {
            this._restoreHierachyState();           
            await this._updateComponentsRecursive(this._rootComponent);
        }
    }

    _saveHierachyStateRecursive(component)
    {
        this._stateMap.push({nodeid:component._nodeid,matrix:KinematicsManager.viewer.model.getNodeMatrix(component._nodeid).copy()});
        let children = component._children;
        for (let i=0;i<children.length;i++)
        {
            this._saveHierachyStateRecursive(children[i]);
        }
    }

    _saveHierachyState()
    {
        this._stateMap = [];
        this._cantResolve = false;
        this._saveHierachyStateRecursive(this._rootComponent);
        
    }

    

    _restoreHierachyState()
    {
       for (let i=0;i<this._stateMap.length;i++)
       {
        KinematicsManager.viewer.model.setNodeMatrix(this._stateMap[i].nodeid, this._stateMap[i].matrix);

       }
       if (this._touchedRewind)
       {
            KinematicsManager.viewer.model.setNodeMatrix(this._touchedRewind.nodeid, this._touchedRewind.matrix);
            this._touchedRewind = null;
       }

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
        let mat = this.getReferenceNodeNetMatrix(this._tipComponent);
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
     
        this._ikTip = this._tipComponent.transformPointToComponentSpace(pos);
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
        let matrix = this.getReferenceNodeNetMatrix(this._tipComponent);      
        let temp = matrix.transform(this._ikTip);
        let res = Communicator.Point3.subtract(this._targetPoint, temp);
        return res.length();
    }
    
    /**
    * Remove Animations from All Components
    * @param  {uuid} animationTemplateId - Animation Template ID
     */  
    removeAnimationFromComponents(animationTemplateId)
    {
        this._rootComponent.removeAnimationRecursive(animationTemplateId);
    }

  /**
    * Generate JSON object for this Hierarchy
    * @return {object} JSON object
     */      
    toJson() {
        let def = { version: KinematicsManager.getVersion(),_ikTip: this._ikTip.toJson(),_templateId: this._templateId,_ikSamplingDistance: this._ikSamplingDistance, _ikSamplingDistanceTranslation: this._ikSamplingDistanceTranslation, _ikLearningRate: this._ikLearningRate, _ikThreshold: this._ikThreshold, _ikSpeed: this._ikSpeed, 
            _targetAnchorNode:this._targetAnchorNode };
        if (this._targetAnchorPosition)            
            def._targetAnchorPosition = this._targetAnchorPosition.toJson();
        def.components = this._rootComponent.toJson();

        let animhash = [];
        let anims = [];
        this._rootComponent.animToJson(animhash);
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
            if (group._hierachy == this)
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

        let component = new KinematicsComponent(null,this);
        component.fromJson(def.components, def.version);
        this._rootComponent = component;

        while (true)
        {        
            if (component.getChildren().length==0) 
            {
                this._tipComponent = component;
                break;
            }                
            component = component.getChildren()[0];
        }

        for (let i in this._componentHash) {
            let component = this._componentHash[i];
            if (component.getBehavior()) {
                component.getBehavior().jsonFixup();
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
        this.resetPivotSystems();
        return def;
    }
           
    /**
      * Reset All Components in Hierachy
       */
    resetComponents() {

        for (let i in this._componentHash) {
            this._componentHash[i].reset();
        }

    }

   /**
     * Create a new component
     * @param  {KinematicsComponent} parentcomponent - Parent Component
     * @param  {number} nodeids - Array of Nodeids associated with new component
     * @param  {bool} isReferenceIn - Optional, if true, this component is a reference component (Default:True)
     * @param  {bool} infront - Optional, if true, the new component will be inserted as a parent of the provided parentcomponent (Default:false)
     * @return {KinematicsComponent} Component
     */
    createComponent(parentcomponent, nodeids, isReferenceIn, infront) {

        let isReference = true;
        if (isReferenceIn != undefined && isReferenceIn == false)
            isReference = false;

        let component = new KinematicsComponent(parentcomponent, this);
        this._componentHash[component.getId()] = component;
        component.initialize(nodeids, isReference);
        if (parentcomponent == null)
            this._rootComponent = component;
        else {
            if (!infront)
                parentcomponent.getChildren().push(component);
            else
                parentcomponent.getChildren().unshift(component);
        }

        this._tipComponent = this._findTipComponent();
        for (let i = 0; i < nodeids.length; i++)
            this._componentNodeidHash[nodeids[i]] = component;

        return component;
    }
     
   /**
     * Create a new component from the current selection and handle parameters
     * @param  {KinematicsComponent} parentcomponent - Parent Component
     * @param  {bool} isReferenceIn - Optional, if true, this component is a reference component (Default:True)
     * @param  {bool} infront - Optional, if true, the new component will be inserted as a parent of the provided parentcomponent (Default:false)
     * @return {KinematicsComponent} Component
     */
    createComponentFromSelection(parentcomponent,isReference, infront)
    {          
        let nodeids = [];
        let selections = KinematicsManager.viewer.selectionManager.getResults();
        for (let i=0;i<selections.length;i++)
            nodeids.push(selections[i].getNodeId());
         
        let newcomponent = this.createComponent(parentcomponent,nodeids, isReference, infront);
      
        newcomponent.setParametersFromHandle();
        return newcomponent;      
    }
       
   /**
     * Rebuild internal node hierachy
     */
    async rebuildComponentTree()
    {
        KinematicsManager.viewer.model.deleteNode(this._rootComponent.getNodeId());
        this._rebuildComponentTreeRecursive(this._rootComponent);        
    }

     /**
     * Rebuild pivotsystem
     */
      async resetPivotSystems()
      {
          KinematicsComponentBehaviorPivotSystem.rebuildAllHashes(this);
          KinematicsComponentBehaviorPivotSystem.findAllSystems(this);
      }
     
   /**
     * Apply current hierachy to node
     * @param  {number} nodeid - Nodeid
     */
    applyToModel(nodeid)
    {
        this._componentNodeidHash = [];
        let childnode = KinematicsManager.viewer.model.getNodeChildren(nodeid)[0];
        let startmatrix;
        if (nodeid == KinematicsManager.viewer.model.getRootNode() || nodeid == undefined)
            startmatrix = new Communicator.Matrix();
        else
            startmatrix = KinematicsManager.viewer.model.getNodeMatrix(nodeid);

        this._applyToModelRecursive(this._rootComponent, KinematicsManager.viewer.model.getNodeIdOffset(childnode), startmatrix);
    }

    getReferenceNodeNetMatrix(incomponent) 
    { 
        return KinematicsManager.viewer.model.getNodeNetMatrix(incomponent.getNodeId());
    }


    /**
         * Sets if limits/constraints of model should be enforced
         * @param  {bool} enforceLimits - If true, limits/constraints of model should be enforced
         */
    setEnforceLimits(enforceLimits) {
        this._enforceLimits = enforceLimits;
        this._touchedRewind = null;
        
    }

    /**
     * Retrieves if limits/constraints of model should be enforced
     * @return {bool} If true, limits/constraints of model should be enforced
      */
    getEnforceLimits() {
        return this._enforceLimits;
    }

    _applyToModelRecursive(component, offset, startmatrix)
    {
     
        this._componentNodeidHash[component.getNodeId()] = component;

        let temp = startmatrix.transform(Communicator.Point3.add(component.getCenter(),component.getAxis()));
        component.setCenter(startmatrix.transform(component.getCenter()));
        component.setAxis(Communicator.Point3.subtract(temp,component.getCenter()).normalize());
        
        component._parentMatrix = Communicator.Matrix.multiply(component.getParentMatrix(), startmatrix);
        if (component.fixedAxis)
            component.fixedAxis = startmatrix.transform(component.fixedAxis);
         
        let referenceNodes = component.getReferenceNodes();
        for (let i=0;i<referenceNodes.length;i++)
        {

            referenceNodes[i].nodeid = offset + referenceNodes[i].nodeid;            
            referenceNodes[i].matrix = Communicator.Matrix.multiply(referenceNodes[i].matrix,startmatrix);

            this._componentNodeidHash[referenceNodes[i].nodeid] = component;

        }
      
        if (component.getChildren().length > 0)
        {
            for (let j=0;j<component.getChildren().length;j++)
                this._applyToModelRecursive(component.getChildren()[j], offset, startmatrix);
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
    
    _findTipComponent()
    {
        let component = this._rootComponent;
        while (true) {
              
            if (component.getChildren().length == 0)
                break;
            component = component.getChildren()[0];                
        }
        return component;
    
    }

    _rebuildComponentTreeRecursive(component)
    {
        if (!component.getParent())
            component.setNodeId(KinematicsManager.viewer.model.createNode(KinematicsManager.viewer.model.getRootNode(), "_rootComponent"));
         else
            component.setNodeId(KinematicsManager.viewer.model.createNode(component.getParent().getNodeId(), "component"));
        if (component.getChildren().length > 0)
        {
            for (let j=0;j<component.getChildren().length;j++)
                this._rebuildComponentTreeRecursive(component.getChildren()[j]);
        }
        
    }

    async _inverseKinematics() {

        let component = this._rootComponent;
        while (true)
        {
            if (component.getType() != componentType.fixed && component.fixedAxis == null && component.getType() != componentType.pistonController && component.getType() != componentType.prismaticAggregate)
            {
                let gradient = await component.calculateGradient();
                await component.update(gradient);       
            }
            if (component.getType() == componentType.prismaticAggregate)
            {
                let gradient = await component.getBehavior().getExtraComponent1().calculateGradient();
                await component.getBehavior().getExtraComponent1().update(gradient);       
                gradient = await component.getBehavior().getExtraComponent2().calculateGradient();
                await component.getBehavior().getExtraComponent2().update(gradient);                       
            }
            if (component.getChildren().length==0 || (component.getType() == componentType.fixed && component != this._rootComponent))
                break;                
            component = component.getChildren()[0];
        } 
        await this._rootComponent.updateComponentsFromReference();

    }
}

