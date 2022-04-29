import { KinematicsManager } from './KinematicsManager.js';
import { KinematicsUtility } from './KinematicsUtility.js';


/** This class contains functionality related to a Belt joint for animating belts of various types*/
export class KinematicsBelt {


    constructor() {
        this._wheels = [];
        this._poslookup = [];

        this._baseNode = null;
        this._nodeids = [];

        this._segmentnum = 500;

        this._width = 10;
        this._thickness = 10;
        this._gap = 0.1;
        this._tracks = 0;
        this._alignvector = null;
        this._trackorientation = false;
        this._color1 = new Communicator.Color(64,64,64);
        this._color2 = new Communicator.Color(20,20,20);
          
    }

    getBaseNode()
    {
        return this._baseNode;
    }

    getWidth()
    {
        return this._width;
    }

    setWidth(width)
    {
        this._width = width;
    }


    setSegmentNum(segmentnum)
    {
        this._segmentnum = segmentnum;
    }
    getSegmentNum()
    {
        return this._segmentnum;
    }

    setThickness(thickness)
    {
        this._thickness = thickness;
    }

    getThickness()
    {
        return this._thickness;
    }

    setGap(gap)
    {
        this._gap = gap;
    }
    
    getGap()
    {
        return this._gap;
    }

    
    setTracks(tracks)
    {
        this._tracks = tracks;
    }

    getTracks()
    {
        return this._tracks;
    }


    setTrackOrientation(trackorientation)
    {
        this._trackorientation = trackorientation;
    }

    getTrackOrientation()
    {
        return this._trackorientation;
    }

    setAlignVector(alignvector)
    {
        this._alignvector = alignvector;
    }

    getAlignVector()
    {
        return this._alignvector;
    }

    setColor1(color1)
    {
        this._color1 = color1;
    }

    getColor1() {
        return this._color1;
    }

    setColor2(color2)
    {
        this._color2 = color2;
    }


    getColor2() {
        return this._color2;
    }

    getWheelByIndex()
    {
        return this._wheels[i];
    }

    getWheels()
    {
        return this._wheels;
    }

    initializeWheels() {

        this.calcuateAlignMatrix();
        for (let i = 0; i < this._wheels.length; i++) {
            let wheel = this._wheels[i];
            let center = this.alignmatrix.transform(wheel.joint.getCenter());
            wheel.pos = new Communicator.Point3(center.x, center.y, 0);
        }


    }

    addWheel() {
        this._wheels.push({ pos: null, radius: 0, joint: null, inner:false,other:false });
    }



    insertWheel(i)
    {
       
        this_wheels.splice(i,0,{ pos: null, radius: 0, joint: null, inner:false,other:false });    
    }
    
    deleteWheel(i)
    {       
        this_wheels.splice(i,1);
    }
    
    toJson()
    {
        let def = { alignvector: this._alignvector ? this._alignvector.toJson() : null, wheels: [], segmentnum: this._segmentnum, width:this._width, thickness:this._thickness, gap: this._gap, tracks: this._tracks, trackorientation: this._trackorientation, 
            color1: this._color1.toJson(), color2: this._color2.toJson() };

        for (let i=0;i<this._wheels.length;i++)
        {
            def.wheels.push({radius: this._wheels[i].radius, joint: this._wheels[i].joint.getId(), inner: this._wheels[i].inner,other: this._wheels[i].other});
        }

        return def;        
    }

    fromJson(def, joint) {

        this._segmentnum = def.segmentnum;
        if (def.width)
            this._width = def.width;
        if (def.thickness)
            this._thickness = def.thickness;
        if (def.color1)
            this._color1 = Communicator.Color.fromJson(def.color1);

        if (def.alignvector)
            this._alignvector = Communicator.Point3.fromJson(def.alignvector);

        if (def.color2)
            this._color2 = Communicator.Color.fromJson(def.color2);
        this._gap = def.gap;
        this._tracks = def.tracks;
        if (def.trackorientation)
            this._trackorientation = def.trackorientation;

        for (let i = 0; i < def.wheels.length; i++) {
            this._wheels.push({ pos: null, radius: def.wheels[i].radius, joint: joint.getHierachy().getJointHash()[def.wheels[i].joint], inner: def.wheels[i].inner, other: def.wheels[i].other });
        }

        return def;

    }


    calcuateAlignMatrix() {
        let plane;
        if (this._wheels.length > 2 && !this._alignvector)
        {
            plane = Communicator.Plane.createFromPoints(this._wheels[0].joint.getCenter(),this._wheels[1].joint.getCenter(),this._wheels[2].joint.getCenter());
            this.alignmatrix = KinematicsUtility.ComputeVectorToVectorRotationMatrix(plane.normal,new Communicator.Point3(0, 0, 1));
        }
        else
        {
            if (!this._alignvector)
                this.alignmatrix = KinematicsUtility.ComputeVectorToVectorRotationMatrix(new Communicator.Point3(1,0,0),new Communicator.Point3(0, 0, 1));
            else
                this.alignmatrix = KinematicsUtility.ComputeVectorToVectorRotationMatrix(this._alignvector,new Communicator.Point3(0, 0, 1));
        }
        let res = this.alignmatrix.transform(this._wheels[0].joint.getCenter());
        let transmatrix = new Communicator.Matrix();
        transmatrix.setTranslationComponent(0, 0, -res.z);
        this.alignmatrix = Communicator.Matrix.multiply(this.alignmatrix, transmatrix);
    }

    addBoxMesh(vmin, vmax, invertices, innormals){

        let vertices = [
            //front
            vmin.x, vmax.y, vmax.z, vmax.x, vmax.y, vmax.z, vmin.x, vmin.y, vmax.z,
            vmax.x, vmax.y, vmax.z, vmax.x, vmin.y, vmax.z, vmin.x, vmin.y, vmax.z,
            //back
            vmax.x, vmax.y, vmin.z, vmin.x, vmax.y, vmin.z, vmin.x, vmin.y, vmin.z,
            vmax.x, vmax.y, vmin.z, vmin.x, vmin.y, vmin.z, vmax.x, vmin.y, vmin.z,
            //top
            vmin.x, vmax.y, vmin.z, vmax.x, vmax.y, vmin.z, vmax.x, vmax.y, vmax.z,
            vmin.x, vmax.y, vmin.z, vmax.x, vmax.y, vmax.z, vmin.x, vmax.y, vmax.z,
            //bottom
            vmin.x, vmin.y, vmin.z, vmax.x, vmin.y, vmax.z, vmax.x, vmin.y, vmin.z,
            vmin.x, vmin.y, vmin.z, vmin.x, vmin.y, vmax.z, vmax.x, vmin.y, vmax.z,
            //left
            vmin.x, vmax.y, vmin.z, vmin.x, vmax.y, vmax.z, vmin.x, vmin.y, vmin.z,
            vmin.x, vmax.y, vmax.z, vmin.x, vmin.y, vmax.z, vmin.x, vmin.y, vmin.z,
            //right
            vmax.x, vmax.y, vmax.z, vmax.x, vmax.y, vmin.z, vmax.x, vmin.y, vmin.z,
            vmax.x, vmax.y, vmax.z, vmax.x, vmin.y, vmin.z, vmax.x, vmin.y, vmax.z
        ];

        let normals = [
            //front
            0, 0, 1, 0, 0, 1, 0, 0, 1,
            0, 0, 1, 0, 0, 1, 0, 0, 1,
            //back
            0, 0, -1, 0, 0, -1, 0, 0, -1,
            0, 0, -1, 0, 0, -1, 0, 0, -1,
            //top
            0, 1, 0, 0, 1, 0, 0, 1, 0,
            0, 1, 0, 0, 1, 0, 0, 1, 0,
            //bottom
            0, -1, 0, 0, -1, 0, 0, -1, 0,
            0, -1, 0, 0, -1, 0, 0, -1, 0,
            //left
            -1, 0, 0, -1, 0, 0, -1, 0, 0,
            -1, 0, 0, -1, 0, 0, -1, 0, 0,
            //right
            1, 0, 0, 1, 0, 0, 1, 0, 0,
            1, 0, 0, 1, 0, 0, 1, 0, 0
        ];

        for (let i=0;i<vertices.length;i++)
        {
            invertices.push(vertices[i]);
        }
        for (let i=0;i<normals.length;i++)
        {
            innormals.push(normals[i]);
        }
    }

    async createMesh(viewer, length, tracks) {
        let meshData = new Communicator.MeshData();
        meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);

        let vertices = [];
        let normals = [];
        if (tracks == 0)
        {
            this.addBoxMesh(new Communicator.Point3(-length.x, -length.y, -length.z),new Communicator.Point3(length.x, length.y, length.z), vertices, normals); 
        }
        else
        {
            if (!this._trackorientation)
                this.addBoxMesh(new Communicator.Point3(-length.x, -length.y, -length.z),new Communicator.Point3(length.x,0, length.z), vertices, normals); 
            else
                this.addBoxMesh(new Communicator.Point3(-length.x, 0, -length.z),new Communicator.Point3(length.x,length.y, length.z), vertices, normals); 
            
            let delta = (length.x * 2)/(tracks*3);
            let cpos = -length.x + delta/2;
            for (let i=0;i<tracks;i++)
            {
                if (!this._trackorientation)
                    this.addBoxMesh(new Communicator.Point3(cpos, 0, -length.z),new Communicator.Point3(cpos+delta*2,length.y, length.z), vertices, normals); 
                else
                     this.addBoxMesh(new Communicator.Point3(cpos, -length.y, -length.z),new Communicator.Point3(cpos+delta*2,0, length.z), vertices, normals); 
                cpos += delta*2 + delta;
            }

        }
        

        meshData.addFaces(vertices, normals);

        return await viewer.model.createMesh(meshData);
    }

    findCircleTangents(w1,w2)
    {
        let a = w1.pos.x;
        let b = w1.pos.y;
        let c = w2.pos.x;
        let d = w2.pos.y;

        let r0 = w1.radius;
        let r1 = w2.radius + 0.000001;

        let xp = (c * r0 - a * r1) / (r0 - r1);
        let yp = (d * r0 - b * r1) / (r0 - r1);

        let xt1 = ((Math.pow(r0,2) * (xp -a) + r0 * (yp-b) * Math.sqrt(Math.pow(xp-a,2) + Math.pow(yp-b,2) - Math.pow(r0,2))) / (Math.pow(xp-a,2) + Math.pow(yp-b,2))) + a;
        let xt2 = ((Math.pow(r0,2) * (xp -a) - r0 * (yp-b) * Math.sqrt(Math.pow(xp-a,2) + Math.pow(yp-b,2) - Math.pow(r0,2))) / (Math.pow(xp-a,2) + Math.pow(yp-b,2))) + a;

        let yt1 = ((Math.pow(r0,2) * (yp -b) - r0 * (xp-a) * Math.sqrt(Math.pow(xp-a,2) + Math.pow(yp-b,2) - Math.pow(r0,2))) / (Math.pow(xp-a,2) + Math.pow(yp-b,2))) + b;
        let yt2 = ((Math.pow(r0,2) * (yp -b) + r0 * (xp-a) * Math.sqrt(Math.pow(xp-a,2) + Math.pow(yp-b,2) - Math.pow(r0,2))) / (Math.pow(xp-a,2) + Math.pow(yp-b,2))) + b;

        let xt3 = ((Math.pow(r1,2) * (xp -c) + r1 * (yp-d) * Math.sqrt(Math.pow(xp-c,2) + Math.pow(yp-d,2) - Math.pow(r1,2))) / (Math.pow(xp-c,2) + Math.pow(yp-d,2))) + c;
        let xt4 = ((Math.pow(r1,2) * (xp -c) - r1 * (yp-d) * Math.sqrt(Math.pow(xp-c,2) + Math.pow(yp-d,2) - Math.pow(r1,2))) / (Math.pow(xp-c,2) + Math.pow(yp-d,2))) + c;

        let yt3 = ((Math.pow(r1,2) * (yp -d) - r1 * (xp-c) * Math.sqrt(Math.pow(xp-c,2) + Math.pow(yp-d,2) - Math.pow(r1,2))) / (Math.pow(xp-c,2) + Math.pow(yp-d,2))) + d;
        let yt4 = ((Math.pow(r1,2) * (yp -d) + r1 * (xp-c) * Math.sqrt(Math.pow(xp-c,2) + Math.pow(yp-d,2) - Math.pow(r1,2))) / (Math.pow(xp-c,2) + Math.pow(yp-d,2))) + d;

        return {xt1: new Communicator.Point3(xt1,yt1,0), xt2:new Communicator.Point3(xt2,yt2,0), xt3:new Communicator.Point3(xt3,yt3,0), xt4:new Communicator.Point3(xt4,yt4,0)};


    }

    findCircleInnerTangents(w1,w2)
    {
        let a = w1.pos.x;
        let b = w1.pos.y;
        let c = w2.pos.x;
        let d = w2.pos.y;

        let r0 = w1.radius;
        let r1 = w2.radius + 0.000001;

        let xp = (c * r0 + a * r1) / (r0 + r1);
        let yp = (d * r0 + b * r1) / (r0 + r1);

        let xt1 = ((Math.pow(r0,2) * (xp -a) + r0 * (yp-b) * Math.sqrt(Math.pow(xp-a,2) + Math.pow(yp-b,2) - Math.pow(r0,2))) / (Math.pow(xp-a,2) + Math.pow(yp-b,2))) + a;
        let xt2 = ((Math.pow(r0,2) * (xp -a) - r0 * (yp-b) * Math.sqrt(Math.pow(xp-a,2) + Math.pow(yp-b,2) - Math.pow(r0,2))) / (Math.pow(xp-a,2) + Math.pow(yp-b,2))) + a;

        let yt1 = ((Math.pow(r0,2) * (yp -b) - r0 * (xp-a) * Math.sqrt(Math.pow(xp-a,2) + Math.pow(yp-b,2) - Math.pow(r0,2))) / (Math.pow(xp-a,2) + Math.pow(yp-b,2))) + b;
        let yt2 = ((Math.pow(r0,2) * (yp -b) + r0 * (xp-a) * Math.sqrt(Math.pow(xp-a,2) + Math.pow(yp-b,2) - Math.pow(r0,2))) / (Math.pow(xp-a,2) + Math.pow(yp-b,2))) + b;

        let xt3 = ((Math.pow(r1,2) * (xp -c) + r1 * (yp-d) * Math.sqrt(Math.pow(xp-c,2) + Math.pow(yp-d,2) - Math.pow(r1,2))) / (Math.pow(xp-c,2) + Math.pow(yp-d,2))) + c;
        let xt4 = ((Math.pow(r1,2) * (xp -c) - r1 * (yp-d) * Math.sqrt(Math.pow(xp-c,2) + Math.pow(yp-d,2) - Math.pow(r1,2))) / (Math.pow(xp-c,2) + Math.pow(yp-d,2))) + c;

        let yt3 = ((Math.pow(r1,2) * (yp -d) - r1 * (xp-c) * Math.sqrt(Math.pow(xp-c,2) + Math.pow(yp-d,2) - Math.pow(r1,2))) / (Math.pow(xp-c,2) + Math.pow(yp-d,2))) + d;
        let yt4 = ((Math.pow(r1,2) * (yp -d) + r1 * (xp-c) * Math.sqrt(Math.pow(xp-c,2) + Math.pow(yp-d,2) - Math.pow(r1,2))) / (Math.pow(xp-c,2) + Math.pow(yp-d,2))) + d;

        return {xt1: new Communicator.Point3(xt1,yt1,0), xt2:new Communicator.Point3(xt2,yt2,0), xt3:new Communicator.Point3(xt3,yt3,0), xt4:new Communicator.Point3(xt4,yt4,0)};


    }

    async initialize() {
        this.initializeWheels();      
        for (let i = 0; i < this._wheels.length; i++) {

            //ViewerUtility.createDebugCube(KinematicsManager.viewer, this._wheels[i].pos, 5.5, Communicator.Color.blue());          
            let inext =  (i==this._wheels.length - 1) ? 0 : i + 1;

            let ct1,ct2;
            if (this._wheels[i].inner) {
                ct1 = this.findCircleInnerTangents(this._wheels[i], this._wheels[inext]);
                if (!this._wheels[i].other)
                {
                    this._wheels[i].exitpos = ct1.xt1.copy();                
                    this._wheels[inext].enterpos = ct1.xt3.copy();                
                }
                else
                {
                    this._wheels[i].exitpos = ct1.xt2.copy();                
                    this._wheels[inext].enterpos = ct1.xt4.copy();                

                }
            }
            else
            {
                ct1 = this.findCircleTangents(this._wheels[i], this._wheels[inext]);
                if (!this._wheels[i].other)
                {
                    this._wheels[i].exitpos = ct1.xt1.copy();                
                    this._wheels[inext].enterpos = ct1.xt3.copy();                
                }
                else
                {
                    this._wheels[i].exitpos = ct1.xt2.copy();                
                    this._wheels[inext].enterpos = ct1.xt4.copy();                

                }    

            }
        }
        for (let i=0;i<this._wheels.length;i++) {                    
             this._wheels[i].rotation = this.calculateWheelRotation(i);
        }
        this.calculateTotalLength();


        let xx = 0;
        this._poslookup = [];
        for (let i=0;i<10000;i++)
        {
            xx+=0.0001;
            let matrix = new Communicator.Matrix();
            let lu = this.computePositionOnBelt(xx);
            matrix.setTranslationComponent(lu.pos.x,lu.pos.y,lu.pos.z);
            let rotmatrix = new Communicator.Matrix();
            Communicator.Util.computeOffaxisRotation(new Communicator.Point3(0,0,1), lu.angle, rotmatrix);
            let resmatrix = Communicator.Matrix.multiply(rotmatrix,matrix);
            this._poslookup.push(resmatrix);            
//            this._poslookup.push(this.computePositionOnBelt(xx));

        }

        let xlength = this._totalLength / this._segmentnum;
        let cubeMesh = await this.createMesh(KinematicsManager.viewer, new Communicator.Point3(xlength/2-xlength*this._gap + 0.0001,this._thickness,this._width),this._tracks);

        let myMeshInstanceData = new Communicator.MeshInstanceData(cubeMesh);

        if (this._baseNode)
            await KinematicsManager.viewer.model.deleteNode(this._baseNode);
        this._baseNode = KinematicsManager.viewer.model.createNode(KinematicsManager.viewer.model.getRootNode());
        
        this.adjustnode = KinematicsManager.viewer.model.createNode(  this._baseNode);
        
        this._nodeids = [];
        for (let i=0;i<this._segmentnum;i++)
        {
            this._nodeids[i] = await KinematicsManager.viewer.model.createMeshInstance(myMeshInstanceData,this.adjustnode);
            if (i % 2)
            {
                KinematicsManager.viewer.model.setNodesFaceColor([this._nodeids[i]], this._color1);
            }
            else
            {
                KinematicsManager.viewer.model.setNodesFaceColor([this._nodeids[i]], this._color2);

            }

        }
        KinematicsManager.viewer.model.setMetallicRoughness([this._baseNode], 0.2,0.6);
        KinematicsManager.viewer.model.setNodeMatrix(this.adjustnode, Communicator.Matrix.inverse(this.alignmatrix));
        this.move(0);

    }

    calculateTotalLength()
    {
        this._totalLength = 0;
        for (let i=0;i<this._wheels.length;i++) 
        {
            let iprev =  (i==0) ? this._wheels.length-1 : i-1;
            let inext =  (i==this._wheels.length - 1) ? 0 : i + 1;

            let wheel = this._wheels[i];
            this._totalLength+= this.calculateCircumference(wheel.radius,wheel.rotation.steps);
            this._totalLength+= Communicator.Point3.subtract(wheel.exitpos,this._wheels[inext].enterpos).length();
        }
    }

    computePositionOnBelt(relativedistance) {
    
        let relpos = this._totalLength * relativedistance;

        let currentpos = 0;
        let currentrot = 0;

        let firstleg = Communicator.Point3.subtract(this._wheels[0].enterpos,this._wheels[this._wheels.length-1].exitpos).normalize();
        let angle = KinematicsUtility.signedAngle(firstleg, new Communicator.Point3(-1,0,0), new Communicator.Point3(0,0,-1));
//        let angle = Communicator.Util.computeAngleBetweenVector(firstleg, new Communicator.Point3(-1,0,0));
        currentrot = angle;
        for (let i=0;i<this._wheels.length;i++) 
        {
            let inext =  (i==this._wheels.length - 1) ? 0 : i + 1;

            let wheel = this._wheels[i];
            let clength = this.calculateCircumference(wheel.radius,wheel.rotation.steps);
            let slength = Communicator.Point3.subtract(wheel.exitpos,this._wheels[inext].enterpos).length();
            if (currentpos + clength < relpos)
            {
                currentpos += clength;
                currentrot += Math.sign(wheel.rotation.angle) * wheel.rotation.steps;
            }
            else
            {
                let angle = (relpos - currentpos) / clength * wheel.rotation.steps;
                currentrot += Math.sign(wheel.rotation.angle) *  angle;
                let slicepos = this.wheelRotation(this._wheels[i], this._wheels[i].enterpos,Math.sign(wheel.rotation.angle) *  angle);
                return {pos: slicepos, angle: currentrot};

            }
            if (currentpos + slength < relpos)
            {
                currentpos += slength;
            }           
            else
            {
                let dist = (relpos - currentpos);
                let vec = Communicator.Point3.subtract(this._wheels[inext].enterpos,wheel.exitpos).normalize();
                let slicepos = Communicator.Point3.add(this._wheels[i].exitpos,Communicator.Point3.scale(vec,dist));
                return {pos: slicepos, angle: currentrot};
            }
        }
    }

    calculateWheelRotation(i) {

        let iprev =  (i==0) ? this._wheels.length-1 : i-1;
        let inext =  (i==this._wheels.length - 1) ? 0 : i + 1;

        let wheel = this._wheels[i];

        let v1 = Communicator.Point3.subtract(wheel.enterpos, wheel.pos).normalize();
        let v2 = Communicator.Point3.subtract(wheel.exitpos, wheel.pos).normalize();
        let angle = KinematicsUtility.signedAngle(v1, v2, new Communicator.Point3(0, 0, 1));

        let distance1 = Communicator.Point3.subtract(wheel.enterpos, this._wheels[iprev].exitpos).length();
        let testslice = this.wheelRotation(wheel, wheel.enterpos, Math.sign(angle) * 2);
        let distance2 = Communicator.Point3.subtract(testslice, this._wheels[iprev].exitpos).length();
        let steps = Math.abs(angle);
        if (distance2 < distance1) {
            steps = 360 - Math.abs(angle);
            angle = -angle;
        }
        return ({steps:steps,angle:angle});
    }

    wheelRotation(wheel, point, angle)
    {
        let rotation1mat = new Communicator.Matrix();
        Communicator.Util.computeOffaxisRotation(new Communicator.Point3(0,0,1), angle, rotation1mat);

        let transmatrix = new Communicator.Matrix();    
        transmatrix.setTranslationComponent(-wheel.pos.x,-wheel.pos.y,0);  

        let invtransmatrix = new Communicator.Matrix();
        invtransmatrix.setTranslationComponent(wheel.pos.x,wheel.pos.y,0);  
        let result = Communicator.Matrix.multiply(transmatrix, rotation1mat);

        let result2 = Communicator.Matrix.multiply(result, invtransmatrix);
        let respoint = result2.transform(point);
        return respoint;
    }

    
    async move(distance) {

        let divider = this._totalLength / this._segmentnum;

        for (let i=0;i<this._segmentnum;i++)
        {
            this.moveInternal(distance + i * divider, this._nodeids[i]);        
        }

    }


    async moveInternal(distance, nodeid) {

        let reldistance = distance % this._totalLength;

        if (reldistance < 0)
           reldistance = this._totalLength + reldistance;

        let index = Math.floor(reldistance / this._totalLength *  this._poslookup.length);
        KinematicsManager.viewer.model.setNodeMatrix(nodeid, this._poslookup[index]);        
    }

    animate() {
        let _this = this;
        setInterval(function () {
            _this.move(mover);
            mover += 0.2;
        }, 10);
    }


    calculateCircumference(r, angle) {
        return angle/360 * 2 * Math.PI * r;
    }


    calculateCircumferenceAngle(r, c) {
        return c / (2 * Math.PI * r) * 360;
    }
}
