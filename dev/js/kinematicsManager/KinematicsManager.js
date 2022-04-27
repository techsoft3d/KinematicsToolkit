import { KinematicsAnimation } from './KinematicsAnimation.js';
import { KinematicsHierachy } from './KinematicsHierachy.js';
import { KinematicsUtility } from './KinematicsUtility.js';


export class KinematicsManager {

    static initialize(viewer) {
        KinematicsManager.viewer = viewer;
           
        KinematicsManager._hierachies = [];
        KinematicsManager._hierachyTemplates = [];
        KinematicsManager._animationTemplates = [];
        KinematicsManager._animations = [];
        KinematicsManager._animationGroups = [];



        KinematicsManager.handlePlacementOperator = new HandlePlacementOperator(viewer);
        let myOperatorHandle = viewer.operatorManager.registerCustomOperator(KinematicsManager.handlePlacementOperator);
        viewer.operatorManager.push(myOperatorHandle);

        KinematicsManager.handleNode = viewer.model.createNode(viewer.model.getRootNode(), "handlenode");

    }

    static getHierachyTemplates() {
        return KinematicsManager._hierachyTemplates;        
    }

    static getHierachies() {
        return KinematicsManager._hierachies;        
    }

    static getAnimationTemplates() {
        return KinematicsManager._animationTemplates;        
    }

    static getAnimationTemplate(animationtemplateid) {
        return KinematicsManager._animationTemplates[animationtemplateid];        
    }

    static getAnimationGroups() {
        return KinematicsManager._animationGroups;        
    }


    static getHierachyByIndex(i) {
        return KinematicsManager._hierachies[i];        
    }

    static getJointFromNodeId(nodeid) {
        for (let i = 0; i < KinematicsManager._hierachies.length; i++) {

            let res = KinematicsManager._hierachies[i]._jointNodeidHash[nodeid];
            if (res != undefined)
                return res;
        }
        return null;
    }


    static findHierachyByNodeid(nodeid) {
        if (nodeid != undefined && nodeid != KinematicsManager.viewer.model.getRootNode())
        {
            while (1)
            {
                if (KinematicsManager.viewer.model.getNodeParent(nodeid) == KinematicsManager.viewer.model.getRootNode())
                    break;
                else
                    nodeid = KinematicsManager.viewer.model.getNodeParent(nodeid);

            }
        }
        for (let i=0;i<KinematicsManager._hierachies.length;i++) {
            if (KinematicsManager._hierachies[i].nodeid == nodeid)
                return i;
        }
        return undefined;
    }

    static applyToModel(_templateId, nodeid) {
        let hierachy = new KinematicsHierachy();
        hierachy.fromJson(KinematicsManager._hierachyTemplates[_templateId]);
        hierachy.applyToModel(nodeid);
        hierachy.setNodeId(nodeid);
        KinematicsManager._hierachies.push(hierachy);
        return hierachy;
    }


    static createHierachy(def) {

        let hierachy = new KinematicsHierachy();
        this._hierachies.push(hierachy);
        return hierachy;

    }

    static getJointFromId(hierachy, id)
    {
        let res = hierachy.getJointHash()[id];
        if (res != undefined)
            return  res;
        else
            return null;
    }

    static addTemplate(def)
    {
        KinematicsManager._hierachyTemplates[def._templateId] = def;        
    }

    static updateTemplate(def)
    {
        KinematicsManager._hierachyTemplates[def._templateId] = def;        
    }

    static getTemplate(_templateId)
    {
        return KinematicsManager._hierachyTemplates[_templateId];
    }


    static updateAnimationTemplate(animationtemplateid, name, anime) {
        let def = KinematicsManager._animationTemplates[animationtemplateid];
        def.name = name;        
        def.anime = anime;        
        KinematicsManager._animationTemplates[animationtemplateid] = JSON.parse(JSON.stringify(def));
    }
  

    
    static addAnimationTemplate(name,anime,easeintime,_ikSpeed)
    {
        let def = {name:name,anime:anime};
        def = JSON.parse(JSON.stringify(def));
        let animationId = KinematicsUtility.generateGUID();
        KinematicsManager._animationTemplates[animationId] = def;
        return animationId;

    }

    static addAnimationTemplateFromJson(_templateId,def)
    {
        let def2 = JSON.parse(JSON.stringify(def));       
        KinematicsManager._animationTemplates[_templateId] = def2;

    }

    static startAnimation(joint,anime)
    {
        let animation = new KinematicsAnimation("test",joint,JSON.parse(JSON.stringify(anime)));

        KinematicsManager._animations.push(animation);
        if (KinematicsManager._animations.length == 1)
            window.requestAnimationFrame(KinematicsManager.doAnimation);
    }

    
    static stopAnimation(joint)
    {
        for (let i=0;i<KinematicsManager._animations.length;i++)
        {
            if (joint == undefined || KinematicsManager._animations[i].getJoint() == joint)
                KinematicsManager._animations[i].setDone(true);
        }

    }
    static changeSpeed(joint,newspeed)
    {
        for (let i=0;i<KinematicsManager._animations.length;i++)
        {
            if (KinematicsManager._animations[i].joint == joint)
                KinematicsManager._animations[i].changeSpeed(newspeed);
        }
    }

    static doAnimation(timestamp) {

        if (KinematicsManager._animations.length > 0) {
            for (let i=0;i<KinematicsManager._hierachies.length;i++)
            {
                KinematicsManager._hierachies[i].setDirty(false);
            }
            
            for (let i = 0; i < KinematicsManager._animations.length; i++) {
                KinematicsManager._animations[i].getJoint().getHierachy().setDirty(true);
                KinematicsManager._animations[i].update(timestamp);
                if (KinematicsManager._animations[i].getDone()) {
                    KinematicsManager._animations.splice(i, 1);
                    i--;
                }
            }

            for (let i=0;i<KinematicsManager._hierachies.length;i++)
            {
                if (KinematicsManager._hierachies[i].getDirty())                                                 
                    KinematicsManager._hierachies[i]._rootJoint.updateJointsFromReference();
            }

            window.requestAnimationFrame(KinematicsManager.doAnimation);
        }
    }

    static deleteAnimationTemplate(_templateId)
    {
        delete KinematicsManager._animationTemplates[_templateId];
        for (let i = 0; i < KinematicsManager._hierachies.length; i++) {
            KinematicsManager._hierachies[i].removeAnimationFromJoints(_templateId);
        }

    }

    static addAnimationGroup(animagroup)
    {
        KinematicsManager._animationGroups.push(animagroup);
        return KinematicsManager._animationGroups.length-1;
    }

    static playAnimationGroup(groupid)
    {
        KinematicsManager._animationGroups[groupid].play();    
    }
}


