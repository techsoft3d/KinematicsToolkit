class ViewerUtility {

    static ComputeVectorToVectorRotationMatrix(p1, p2) {
        var outmatrix;
        const EPSILON = 0.0000001;
        p1.normalize();
        p2.normalize();
        let p3 = Communicator.Point3.cross(p1, p2);

        let dprod = Communicator.Point3.dot(p1, p2);
        let l = p3.length();

        // Construct a perpendicular vector for anti-parallel case
        if (l > -EPSILON && l < EPSILON) {
            if (dprod < 0) {
                if (p1.x < -EPSILON || p1.x > EPSILON) {
                    p3.x = p1.y;
                    p3.y = -p1.x;
                    p3.z = 0;
                } else if (p1.y < -EPSILON || p1.y > EPSILON) {
                    p3.x = -p1.y;
                    p3.y = p1.x;
                    p3.z = 0;
                } else if (p1.z < -EPSILON || p1.z > EPSILON) {
                    p3.x = -p1.z;
                    p3.z = p1.x;
                    p3.y = 0;
                } else {
                    return new Communicator.Matrix();
                }
            } else {
                return new Communicator.Matrix();
            }
        }
        
        var ang = Math.atan2(l, dprod);
        ang *= (180 / Math.PI);

        return Communicator.Matrix.createFromOffAxisRotation(p3, ang);
    }

    static async createCubeMesh(viewer, showFaces, offset, scale) {
        var length;
        if (scale != undefined)
            length = 0.5 * scale;
        else
            length = 0.5;


        var meshData = new Communicator.MeshData();
        meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);
       
        var vertices = [
            //front
            -length, length, length, length, length, length, -length, -length, length,
            length, length, length, length, -length, length, -length, -length, length,
            //back
            length, length, -length, -length, length, -length, -length, -length, -length,
            length, length, -length, -length, -length, -length, length, -length, -length,
            //top
            -length, length, -length, length, length, -length, length, length, length,
            -length, length, -length, length, length, length, -length, length, length,
            //bottom
            -length, -length, -length, length, -length, length, length, -length, -length,
            -length, -length, -length, -length, -length, length, length, -length, length,
            //left
            -length, length, -length, -length, length, length, -length, -length, -length,
            -length, length, length, -length, -length, length, -length, -length, -length,
            //right
            length, length, length, length, length, -length, length, -length, -length,
            length, length, length, length, -length, -length, length, -length, length
        ];
        if (offset != undefined) {

            for (var i = 0; i < vertices.length; i += 3) {
                vertices[i] += offset.x;
                vertices[i + 1] += offset.y;
                vertices[i + 2] += offset.z;
            }
        }
        var normals = [
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

       
        var polylines = [
            [
                -length, length, length,
                length, length, length,
                length, -length, length,
                -length, -length, length,
                -length, length, length
            ],
            [
                length, length, length,
                length, length, -length,
                length, -length, -length,
                length, -length, length,
                length, length, length
            ],
            [
                -length, length, -length,
                length, length, -length,
                length, -length, -length,
                -length, -length, -length,
                -length, length, -length
            ],
            [
                -length, length, length,
                -length, length, -length,
                -length, -length, -length,
                -length, -length, length,
                -length, length, length
            ]
        ];
        if (showFaces)
            meshData.addFaces(vertices, normals);
        else {
            for (let i = 0; i < polylines.length; i++)
                meshData.addPolyline(polylines[i]);
        }
        return await viewer.model.createMesh(meshData);
    }



    static async createLineMesh(viewer, start, end) {
        var meshData = new Communicator.MeshData();
        meshData.setFaceWinding(Communicator.FaceWinding.Clockwise);

        meshData.addPolyline([start.x, start.y, start.z, end.x, end.y, end.z]);

        return await viewer.model.createMesh(meshData);
    }


    static async createDebugCube(viewer,pos, scale, color, flush)
    {
        if (window.debugCubeNode === undefined)
        {
            window.debugCubeNode = await viewer.model.createNode(viewer.model.getRootNode());
        }

        if (flush)
        {
            await viewer.model.deleteNode(window.debugCubeNode);
            window.debugCubeNode = await viewer.model.createNode(viewer.model.getRootNode());
        }
        let cubeMesh = await ViewerUtility.createCubeMesh(viewer, true, pos, scale);
        let myMeshInstanceData = new Communicator.MeshInstanceData(cubeMesh);
        var ttt = hwv.model.createNode( window.debugCubeNode);
        let cubenode = await viewer.model.createMeshInstance(myMeshInstanceData, ttt);
        if (color)
            hwv.model.setNodesFaceColor([ttt], color);
        return ttt;
    }

    
    static async createDebugCube2(viewer,pos, scale, color)
    {

        let cubeMesh = await ViewerUtility.createCubeMesh(viewer, true, undefined, scale);
        let myMeshInstanceData = new Communicator.MeshInstanceData(cubeMesh);
        var transnode = hwv.model.createNode(hwv.model.getRootNode());
        var rotnode = hwv.model.createNode(transnode);
        let cubenode = await viewer.model.createMeshInstance(myMeshInstanceData, rotnode);
        if (color)
            hwv.model.setNodesFaceColor([cubenode], color);
            
        var mat = new Communicator.Matrix();
        mat.setTranslationComponent(pos.x,pos.y,pos.z);
        hwv.model.setNodeMatrix(transnode, mat);        
        return {nodeid: transnode, rotnode: rotnode};
    }



    static async createDebugLine(viewer,start, end, color)
    {
        let lineMesh = await ViewerUtility.createLineMesh(viewer, start,end);
        let myMeshInstanceData = new Communicator.MeshInstanceData(lineMesh);
        var ttt = hwv.model.createNode(hwv.model.getRootNode());
        let linenode = await viewer.model.createMeshInstance(myMeshInstanceData, ttt);
        if (color)
            hwv.model.setNodesLineColor([ttt], color);
    }

    static closestPointOnPlane(plane, point) {
        
        let distance = Communicator.Point3.dot(plane.normal, point) + plane.d;      
        return Communicator.Point3.subtract(point,new Communicator.Point3(distance * plane.normal.x, distance * plane.normal.y, distance * plane.normal.z));
    }
    
     
    static nearestPointOnLine(linePnt, lineDir, pnt)
    {
        lineDir.normalize();//this needs to be a unit vector
        var v = Communicator.Point3.subtract(pnt,linePnt);
        var d = Communicator.Point3.dot(v, lineDir);
        var pol =  Communicator.Point3.add(linePnt,Communicator.Point3.scale(lineDir,d))
        var delta = Communicator.Point3.subtract(pol,pnt);
        return pol;
    }

    static generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }


    static signedAngle(Va,Vb, Vn)
    {
        return Math.atan2(Communicator.Point3.dot(Communicator.Point3.cross(Va,Vb), Vn), Communicator.Point3.dot(Va, Vb)) * (180/Math.PI);
    }



}