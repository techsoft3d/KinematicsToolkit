import { KinematicsAnimation } from './KinematicsAnimation.js';
import { KinematicsHierachy } from './KinematicsHierachy.js';
import { KinematicsUtility } from './KinematicsUtility.js';
import { HandlePlacementOperator } from './HandlePlacementOperator.js';
import { ComponentMoveOperator } from './ComponentMoveOperator.js';

/** This static class provides the main entry point to all Kinematics Related Functionality. */
export class KinematicsManager {


    /**
    * Initializes the KinematicsManager  
    * Should only be called once.
    * @param  {object} viewer - WebViewer Object
    */
    static initialize(viewer) {
        KinematicsManager.viewer = viewer;

        KinematicsManager._hierachies = [];
        KinematicsManager._customTypeCallback = null;
        KinematicsManager._hierachyTemplates = [];
        KinematicsManager._animationTemplates = [];
        KinematicsManager._animations = [];
        KinematicsManager._animationGroups = [];
        KinematicsManager.handlePlacementOperator = null;
        KinematicsManager.componentMoveOperator = null;
        KinematicsManager._version = "0.9.2";
        KinematicsManager._rootNode = viewer.model.createNode(viewer.model.getRootNode(), "KT_ROOT");
    }

    
    /**
    * Retrieves Toolkit Version
    * @return {hash} Hierachy Template Array
    */
    static getVersion() {
        return KinematicsManager._version;
    }

      /**
    * Retrieves Root Node of Kinematics Toolkit
    * @return {nodeid} Root node
    */
       static getRootNode() {
        return KinematicsManager._rootNode;
    }

       
    /**
    * Retrieves Handle Placement Operator
    * @return {object} Handle Operator
    */
    static getHandleOperator()
    {
        return KinematicsManager.handlePlacementOperator;
    }

    /**
     * Initializes Handle Placement Operator
     */
    static setupHandleOperator() {
        KinematicsManager.handlePlacementOperator = new HandlePlacementOperator(KinematicsManager.viewer);
        let myOperatorHandle = KinematicsManager.viewer.operatorManager.registerCustomOperator(KinematicsManager.handlePlacementOperator);
        KinematicsManager.viewer.operatorManager.push(myOperatorHandle);

        KinematicsManager.handleNode = KinematicsManager.viewer.model.createNode(KinematicsManager.getRootNode(), "handlenode");
    }

    static setupComponentMoveOperator() {
        if (!KinematicsManager.componentMoveOperator) {
            KinematicsManager.componentMoveOperator = new ComponentMoveOperator(KinematicsManager.viewer);
            let myOperatorComponentMove = KinematicsManager.viewer.operatorManager.registerCustomOperator(KinematicsManager.componentMoveOperator);
            KinematicsManager.viewer.operatorManager.push(myOperatorComponentMove);
        }
        else
            KinematicsManager.componentMoveOperator.enable();

    }

    static disableComponentMoveOperator() {
        KinematicsManager.componentMoveOperator.disable();

    }

    /**
    * Retrieves Hierachy Template Hash
    * @return {hash} Hierachy Template Array
    */
    static getHierachyTemplates() {
        return KinematicsManager._hierachyTemplates;
    }

    /**
      * Retrieves Hierachy Array
      * @return {array} Hierachy Array
      */
    static getHierachies() {
        return KinematicsManager._hierachies;
    }

    /**
       * Retrieves Animation Template Hash
       * @return {hash} Animation Template Hash
       */
    static getAnimationTemplates() {
        return KinematicsManager._animationTemplates;
    }

    /**
     * Retrieves an animationtemplate by its id
     * @param  {string} animationtemplateid - id of animation template
     * @return {object} Animation Template
     */
    static getAnimationTemplate(animationtemplateid) {
        return KinematicsManager._animationTemplates[animationtemplateid];
    }

    /**
        * Retrieves Animation Group Array
        * @return {array} Animation Group Array
        */
    static getAnimationGroups() {
        return KinematicsManager._animationGroups;
    }

    /**
         * Retrieves a Hierachy by its index
        * @param  {number} i - Hierachy Index
        * @return {KinematicsHierachy} Hierachy
         */
    static getHierachyByIndex(i) {
        return KinematicsManager._hierachies[i];
    }

    /**
    * Retrieves a component assicated to a nodeid
    * @param  {number} nodeid - nodeid
    * @return {KinematicsComponent} Component
    */
    static getComponentFromNodeId(nodeid) {
        for (let i = 0; i < KinematicsManager._hierachies.length; i++) {

            let res = KinematicsManager._hierachies[i]._componentNodeidHash[nodeid];
            if (res != undefined)
                return res;
        }
        return null;
    }


    /**
    * Retrieves a hierachy assicated to a nodeid
    * @param  {number} nodeid - nodeid
    * @return {KinematicsHierachy} Hierachy
    */
    static getHierachyFromNodeId(nodeid) {        
        for (let i = 0; i < KinematicsManager._hierachies.length; i++) {
            if (KinematicsManager._hierachies[i]._nodeid == nodeid)
                return KinematicsManager._hierachies[i];
        }
        return undefined;
    }

    /**
    * Applies a hierachy template to a node and creates a new hierachy
    * @param  {uuid} templateid - Template Id
    * @param  {number} nodeid - nodeid
    * @return {KinematicsHierachy} Hierachy
    */    
    static applyToModel(templateId, nodeid) {
        let hierachy = new KinematicsHierachy();
        hierachy.fromJson(KinematicsManager._hierachyTemplates[templateId]);
        hierachy.applyToModel(nodeid);
        hierachy.setNodeId(nodeid);
        KinematicsManager._hierachies.push(hierachy);
        return hierachy;
    }

   /**
    * Creates a new Hierachy
    * @return {KinematicsHierachy} Hierachy
    */    
    static createHierachy() {

        let hierachy = new KinematicsHierachy();
        this._hierachies.push(hierachy);
        return hierachy;

    }

  /**
    * Adds a new hierachy template from a JSON definition
    * @param  {object} def - JSON definition
    * @return {uuid} Template ID
    */        
    static addTemplate(def) {
        KinematicsManager._hierachyTemplates[def._templateId] = def;
        return def._templateId;
    }

 /**
    * Updates an existing hierachy template from a JSON definition
    * @param  {object} def - JSON definition
    */        
    static updateTemplate(def) {
        KinematicsManager._hierachyTemplates[def._templateId] = def;
    }

    
 /**
    * Retrieves a hierachy template from its id
    * @param  {uuid} templateId - Template ID
    * @return {object} Hierachy Template
    */    
    static getTemplate(templateId) {
        return KinematicsManager._hierachyTemplates[templateId];
    }

   
 /**
    * Update Animation Template 
    * @param  {uuid} animationtemplateid - Template ID
    * @param  {string} name - Template Name
    * @param  {object} anime - Animation Definition
    */    
    static updateAnimationTemplate(animationtemplateid, name, anime) {
        let def = KinematicsManager._animationTemplates[animationtemplateid];
        def.name = name;
        def.anime = anime;
        KinematicsManager._animationTemplates[animationtemplateid] = JSON.parse(JSON.stringify(def));
    }


 
 /**
    * Create new Animation Template  
    * 
    * @param  {string} name - Template Name
    * @param  {object} anime - Animation Definition  
    *  The provided object follows the animation definition for anime.js. See anime.js documentation for more info on supported parameters (https://animejs.com/documentation/).  
    *  In addition to the anime.js parameters you also need to provide the target value itself as the value parameter.   
    *   
    *  You also need to specifiy if the animation is infinite (e.g an infinitely spinning fan). In that case only easeintime and value are supported parameters.  
    *  See below for an example:  
    *  ```
    *     let animedef = {  
    *       value: "300",  // Target for the animation  
    *        duration: "1000",   
    *        easing: "easeInQuad",  
    *        loop: "1",  
    *        direction: "normal",  
    *        easeintime: "200",  //ease In Time for animation in milliseconds. Only applies to infinite animations  
    *        infinite: false, //if animation is infinite only easeintime and value applies.  
    *    };  
    *    let animationid = KT.KinematicsManager.addAnimationTemplate("TestAnimation", animedef);  
    * ```
    * @return {uuid} ID of Animation Template
    */    
    static addAnimationTemplate(name, anime) {
        let def = { name: name, anime: anime };
        def = JSON.parse(JSON.stringify(def));
        let animationId = KinematicsUtility.generateGUID();
        KinematicsManager._animationTemplates[animationId] = def;
        return animationId;

    }

    
 
 /**
    * Create new Animation Template from JSON definition
    * @param  {uuid} templateId - ID of animation template
    * @param  {object} def - Animation Definition
    */    
    static addAnimationTemplateFromJson(templateId, def) {
        let def2 = JSON.parse(JSON.stringify(def));
        KinematicsManager._animationTemplates[templateId] = def2;
    }

    
 /**
    * Create new Animation from given animation template
    * @param  {KinematicsComponent} component - Component to animate
    * @param  {object} animationTemplate - Animation Template
    */    
    static startAnimation(component, animationTemplate) {
        component.setAnimationActive(true);
        let animation = new KinematicsAnimation("test", component, JSON.parse(JSON.stringify(animationTemplate.anime)));

        KinematicsManager._animations.push(animation);
        if (KinematicsManager._animations.length == 1)
            window.requestAnimationFrame(KinematicsManager._doAnimation);
    }


      
 /**
    * Stop animation at given component
    * @param  {KinematicsComponent} component - Component to animate
    */    
    static stopAnimation(component) {
        for (let i = 0; i < KinematicsManager._animations.length; i++) {
            if (component == undefined || KinematicsManager._animations[i].getComponent() == component)
                KinematicsManager._animations[i].setDone(true);
        }

    }

     
 /**
    * Change animation speed at given component
    * @param  {KinematicsComponent} component - Component
    * @param  {number} newspeed - new speed
    */      
    static changeAnimationSpeed(component, newspeed) {
        for (let i = 0; i < KinematicsManager._animations.length; i++) {
            if (KinematicsManager._animations[i].component == component)
                KinematicsManager._animations[i].changeAnimationSpeed(newspeed);
        }
    }

       
 /**
    * Delete animation template with given template id 
    * @param  {uuid} templateId - Template ID
    */ 
    static deleteAnimationTemplate(templateId) {
        delete KinematicsManager._animationTemplates[templateId];
        for (let i = 0; i < KinematicsManager._hierachies.length; i++) {
            KinematicsManager._hierachies[i].removeAnimationFromComponents(templateId);
        }

    }

      
 /**
    * Add new animation group from animation group definition
    * @param  {object} animationGroup - Animation Group Definition
    * @return {number} ID of Animation Group 
    */     
    static addAnimationGroup(animationGroup) {
        KinematicsManager._animationGroups.push(animationGroup);
        return KinematicsManager._animationGroups.length - 1;
    }


    
 /**
    * Start animation group with given id
    * @param  {object} id - Animation Group ID
    */        

    static startAnimationGroup(id) {
        KinematicsManager._animationGroups[id].play();
    }

        
    /**
         * Sets the callback for creating a custom type object
         * @param  {function} customTypeCallback - Callback function when creating a custom type
         */ 
    static setCustomBehaviorCreationCallback(customTypeCallback)
    {
        KinematicsManager._customTypeCallback = customTypeCallback;
    }
         
     static getCustomTypeCallback()
     {
         return KinematicsManager._customTypeCallback;
     }
    
    static _doAnimation(timestamp) {

        if (KinematicsManager._animations.length > 0) {
            for (let i = 0; i < KinematicsManager._hierachies.length; i++) {
                KinematicsManager._hierachies[i].setDirty(false);
            }

            for (let i = 0; i < KinematicsManager._animations.length; i++) {
                KinematicsManager._animations[i].getComponent().getHierachy().setDirty(true);
                KinematicsManager._animations[i].update(timestamp);
                if (KinematicsManager._animations[i].getDone()) {
                    KinematicsManager._animations[i].getComponent().setAnimationActive(false);
                    KinematicsManager._animations.splice(i, 1);
                    i--;
                }
            }

            for (let i = 0; i < KinematicsManager._hierachies.length; i++) {
                if (KinematicsManager._hierachies[i].getDirty())
                    KinematicsManager._hierachies[i].updateComponents();
            }

            window.requestAnimationFrame(KinematicsManager._doAnimation);
        }
    }

}


