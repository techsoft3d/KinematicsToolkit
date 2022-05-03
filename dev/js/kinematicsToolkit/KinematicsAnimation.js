import { KinematicsManager } from './KinematicsManager.js';
import { componentType } from './KinematicsComponent.js';
import anime from './anime.es.js';

export const animationType = {
    single:0,    
    infinite: 1,
    
};

/** This class provides functionality related to controlling a group fo animations*/
export class KinematicsAnimationGroup {
    constructor(hierachy) {

        this._hierachy = hierachy;
        this._animations = [];
        this.name = "";
    }        

    getAnimations()
    {
        return this._animations;
    }

    getAnimationByIndex(i)
    {
        return this._animations[i];
    }

    addAnimation(animation, component) {
        this._animations.push({animation: animation, component: component});
    }

    setName(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }

    toJson()
    {
        let def = {animations : this._animations, name : this.name};
        return def;
    }

    fromJson(def)
    {
        this._animations = def.animations;
        this.name = def.name;
    }

    play()
    {
        for (let i=0;i<this._animations.length;i++)
        {
            let anim = this._animations[i];

            let animationtemplate = KinematicsManager.getAnimationTemplate(anim.animation);
            let component = this._hierachy.getComponentHash()[anim.component];              
            KinematicsManager.startAnimation(component,animationtemplate);

        }
    }

}

/** This class provides functionality related to animating a component*/
export class KinematicsAnimation {

    static fromJson(json, component) {
        return new KinematicsAnimation(json.name,component, json.animedef);
    }

    constructor(name,component,animedef) {

        this.name = name;     
        this._component = component;

        this._done = false;
        let _this = this;

        this.value = this._component.getCurrentValue();
     
        if (animedef.infinite == undefined || !animedef.infinite) {

            this.type = animationType.single;
            if (animedef.startcolor != undefined)
            {
                this.color = animedef.startcolor;
                animedef.startcolor = undefined;
                animedef.color = animedef.endcolor;
                animedef.endcolor = undefined;
            }
            animedef.targets = this;
            animedef.autoplay = false;
            animedef.complete = function () {
                _this.anime.remove();
                _this._done = true;                
            };

            this.anime = anime(animedef);

        }
        else {
            this.type = animationType.infinite;
            this.startTime = Date.now();
            this.lasttime = this.startTime;
            this.easeInTime = parseInt(animedef.easeintime) / 1000;
            this.target = parseInt(animedef.value);
            this.previoustarget = 0;
        }      
    }

    getName() {
        return this.name;
    }

    getComponent()
    {
        return this._component;
    }

    getDone()
    {
        return this._done;
    }

    setDone(isdone)
    {
        this._done = isdone;
    }

    update(timestamp) {
        if (this.color != undefined) {
            this.anime.tick(timestamp);
            let referenceNodes = this._component.getReferenceNodes();
            for (let i = 0; i < referenceNodes.length; i++) {
                let x = this.color.substring(5, this.color.length - 1);
                let xx = x.split(",");
                KinematicsManager.viewer.model.setNodesFaceColor([referenceNodes[i].nodeid], new Communicator.Color(parseInt(xx[0]), parseInt(xx[1]), parseInt(xx[2])));
            }
        }
        else {

            if (this.type == animationType.infinite) {
                let time = Date.now();
                let elapsed = (time - this.lasttime)  / 1000;
                let elapsedTotal = (time - this.startTime) / 1000;

                let acceleration = this.target;
                if (elapsedTotal < this.easeInTime) {
                    acceleration = this.easeInQuad(elapsedTotal, this.previoustarget, this.target - this.previoustarget, this.easeInTime);
                }
                let newvalue = this.value + elapsed * acceleration;
                this._component.set(newvalue);

                this.lasttime = time;
                this.value = newvalue;

            }
            else {
                this.anime.tick(timestamp);             
                this._component.set(parseFloat(this.value));
            }
            this._component._touched = true;
        }
    }

    changeAnimationSpeed(newtarget)
    {
        this.previoustarget = this.target;
        this.target = newtarget;
        this.startTime = Date.now();
        this.lasttime = Date.now();

    }

    easeInQuad(t, b, c, d) {
		return c*(t/=d)*t + b;
	}
}
