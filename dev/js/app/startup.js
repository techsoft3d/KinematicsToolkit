var myLayout;
var mySelectionBasket;
var myMaterialTool;
var shiftPressed = false;

async function msready() {

    hwv.view.setAmbientOcclusionEnabled(true);
    hwv.view.setAmbientOcclusionRadius(0.025);
    $(document).on('keyup keydown', function(e){shiftPressed = e.shiftKey;} );

    KM.KinematicsManager.initialize(hwv);
    KM.KinematicsManager.setupHandleOperator();

    drawIKDiv();

    hwv.setCallbacks({

          handleEvent: handleEvent,

      });


      mySelectionBasket  = new SelectionBasket(hwv);
      mySelectionBasket.initializeUI("selectionbasketcontainer", true);
      
      myLayout.on('stateChanged', function () {
        if (hwv != null) {
            hwv.resizeCanvas();
        }
    });


}

async function handleEvent(type, nodeids, mat1, mat2) {

    if (editMode)
    {
        return;
    }
    

    var nodeid = nodeids[0];
    var joint = KM.KinematicsManager.getJointFromNodeId(nodeid);    

    if (joint)
    {              
        await joint.calculateReferenceMatrixFromHandleMatrix(mat2[0]);
        await joint.getHierachy().updateJoints();   
    }    

}


function startup()
{
    createUILayout();
} 

function createUILayout() {

    var config = {
        settings: {
            showPopoutIcon: false,
            showMaximiseIcon: true,
            showCloseIcon: false
        },
        content: [
            {
                type: 'row',
                content: [
                    {
                        type: 'row',
                        content: [{
                            type: 'component',
                            componentName: 'Viewer',
                            isClosable: false,
                            width: 80,
                            componentState: { label: 'A' }
                        }],
                    },
                    {
                        type: 'column',
                        width: 20,
                        height: 35,
                        content: [
                            {
                                type: 'component',
                                componentName: 'Kinematics',
                                isClosable: false,
                                height: 90,
                                componentState: { label: 'C' }
                            },
                            // {
                            //     type: 'component',
                            //     componentName: 'Selection Basket',
                            //     isClosable: true,
                            //     height: 10,
                            //     componentState: { label: 'C' }
                            // }                          
                        ]
                    },
                ],
            }]
    };



    myLayout = new GoldenLayout(config);
    myLayout.registerComponent('Viewer', function (container, componentState) {
        $(container.getElement()).append($("#content"));
    });

    myLayout.registerComponent('Kinematics', function (container, componentState) {
        $(container.getElement()).append($("#KinematicsDiv"));
    });

    // myLayout.registerComponent('Selection Basket', function (container, componentState) {
    //     $(container.getElement()).append($("#selectionbasketcontainer"));
    // });

  
    myLayout.init();


    var viewermenu = [
        {
            name: 'Load Kinematics Data',
            subMenu: [
                {
                    name: 'Microengine',
                    fun: async function () {
                        loadIKData("microengine.json");
                        // myMaterialTool  = new MaterialTool(hwv);
                        // let res = await fetch('data/material2.json');
                        // let json = await res.json();
                        // myMaterialTool.fromJson(json);
                        // myMaterialTool.refresh();

                    },
                },
              
                {
                    name: 'MR-1718',
                    fun: async function () {
                        loadIKData("mr1718-arm.json");
                    },
                },
                // {
                //     name: '3d Printer',
                //     fun: async function () {
                //         loadIKData("3dprinter.json");
                //     },
                // },     
                // {
                //     name: '3d Printer 2',
                //     fun: async function () {
                //         loadIKData("3dprinter2.json");
                //     },
                // },
                // {
                //     name: 'Hoist 1',
                //     fun: async function () {
                //         loadIKData("hoist1.json");
                //     },
                // },
                // {
                //     name: 'Hoist 2',
                //     fun: async function () {
                //         loadIKData("hoist2.json");
                //     },
                // },
                {
                    name: 'Hoist',
                    fun: async function () {
                        loadIKData("hoist3.json");
                    },
                },             
                {
                    name: 'Makerbot',
                    fun: async function () {
                        loadIKData("makerbot.json");
                    },
                },
                // {
                //     name: 'Clock',
                //     fun: async function () {
                //         loadIKData("clock.json");
                //     },
                // },                     
                // {
                //     name: 'Fan',
                //     fun: async function () {
                //         loadIKData("fan.json");
                //     },
                // },
                {
                    name: 'Engine',
                    fun: async function () {
                        loadIKData("engine.json");
                        myMaterialTool  = new MaterialTool(hwv);
                        let res = await fetch('data/material1.json');
                        let json = await res.json();
                        myMaterialTool.fromJson(json);
                        myMaterialTool.refresh();

                    },
                },                                                                                
                // {
                //     name: 'Timing Belt',
                //     fun: async function () {
                //         loadIKData("timingbelt.json");
                //     },
                // },              
                {
                    name: 'Epoxy',
                    fun: async function () {
                        loadIKData("epoxy.json");
                    },
                },
                // {
                //     name: 'V8 Engine',
                //     fun: async function () {
                //         loadIKData("v8engine.json");
                //         myMaterialTool  = new MaterialTool(hwv);
                //         let res = await fetch('data/v8enginemat.json');
                //         let json = await res.json();
                //         myMaterialTool.fromJson(json);
                //         myMaterialTool.refresh();

                //     },
                // },
                {
                    name: 'Buba Robot',
                    fun: async function () {
                        loadIKData("bubarobot.json");
                        myMaterialTool  = new MaterialTool(hwv);
                        let res = await fetch('data/bubbamat.json');
                        let json = await res.json();
                        myMaterialTool.fromJson(json);
                        myMaterialTool.refresh();

                    },
                },
            ]
        },      
        {
            name: 'IK',
            subMenu: [  
        {
            name: 'Start IK',
            fun: function () {
                currentHierachy.startIKFromHandle();

            }
        },    
        {
            name: 'Stop IK',
            fun: function () {
                currentHierachy.stopIK();

            }
        },    
        {
            name: 'Insert Target Handle',
            fun: function () {
                currentHierachy.setIKHandleToTip(true);
                currentHierachy.startIKFromHandle();

            }
        },
        {
            name: 'Set Tip To Handle',
            fun: function () {
                currentHierachy.setTipToHandlePosition();

            }
        },
        {
            name: 'Set Target Anchor To Handle',
            fun: function () {
                currentHierachy.setTargetAnchorToHandlePosition();

            }
        }
    ]},
    {
        name: 'Load Multiple Microengines',
         fun: async function () {
            myMaterialTool  = new MaterialTool(hwv);
            let res = await fetch('data/material2.json');
            let json = await res.json();
            myMaterialTool.fromJson(json);
            let topnode = hwv.model.createNode(hwv.model.getRootNode(),"microengines");

            for (let i=0;i<5;i++)
            {
            for (let j=0;j<5;j++)
            {
                var n = hwv.model.createNode(topnode);
                await hwv.model.loadSubtreeFromScsFile(n, "models/microengine.scs");
                let children = hwv.model.getNodeChildren(n);
                let offset = hwv.model.getNodeIdOffset(children[0]);

                var m = new Communicator.Matrix();
                m.setTranslationComponent(j*200,i*200,0);
                await hwv.model.setNodeMatrix(n,m);
                myMaterialTool.setOffset(offset);
                await myMaterialTool.refresh();

            }
        }                    
        },
    },
     {
            name: 'Animate Microengines',
            fun: function () {
                microanim();
            }
        },   
        {
            name: 'Simple Microengine Example',
            fun: function () {
                let hierachy = KM.KinematicsManager.createHierachy();
                let root = hierachy.getRootJoint();
                let joint1 = hierachy.createJoint(root,[34]);                 
                joint1.setCenter(new Communicator.Point3(84.67,28.49,-20));
                joint1.setAxis(new Communicator.Point3(1,0,0));

                let joint2 = hierachy.createJoint(joint1,[30,29]);                 
                joint2.setCenter(new Communicator.Point3(18.07,28.59,-11));
                joint2.setAxis(new Communicator.Point3(-1,0,0));
                joint2.setFixedAxis(new Communicator.Point3(0,0,-1));
                joint2.setFixedAxisTarget(new Communicator.Point3(0,0,-1));

                joint1.set(45);
                hierachy.updateJoints();   

                currentHierachy = hierachy;
                drawIKDiv();
            }
        },   
        {
            name: 'Load Micronengine Def Sample',
            fun: async function () {

                let res = await fetch('data/microengine.json');
                data = await res.json();
                let templateId = KM.KinematicsManager.addTemplate(data);
                let hierachy = await KM.KinematicsManager.applyToModel(templateId);
                let joint = hierachy.getJointFromId(1);
                joint.set(45);
                hierachy.updateJoints();
                currentHierachy = hierachy;
                drawIKDiv();
            }
        },   
        // {
        //     name: 'Restrict To Selection',
        //     fun: function () {
        //         mySelectionBasket.setRestrictToNode(hwv.selectionManager.getLast().getNodeId());
        //     }
        // },   
        // {
        //     name: 'Unset Restrict To Selection',
        //     fun: function () {
        //         mySelectionBasket.unsetRestrictToNode();
        //     }
        // },   
        // {
        //     name: 'Toggle Allow Body Nodes',
        //     fun: function () {
        //         mySelectionBasket.setDisallowBodyNodes(!mySelectionBasket._disallowBodyNodes);
        //     }
        // },   
        // {
        //     name: 'Display Stats',
        //     fun: function () {
        //         hwv.view.setStatisticsDisplayVisibility(true)
        //     }
        // },   




    ];

    $('#viewermenu1button').contextMenu(viewermenu, undefined, {
        'displayAround': 'trigger',
        'containment': '#viewerContainer'
    });


}

async function loadIKData(name){

    let res = await fetch('data/' + name);
    data = await res.json();
    KM.KinematicsManager.addTemplate(data);
    currentTemplate = data._templateId;
    drawIKDiv();

}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

function microanim()
{
    for (let i=0; i<KM.KinematicsManager.getHierachies().length; i++)
    {
        let joint = KM.KinematicsManager.getHierachyByIndex(i).getJointFromId(1);
        let animationTemplate;
        var r = getRandomInt(3);
        if (r == 0)
            animationTemplate = KM.KinematicsManager.getAnimationTemplate('a0d326e1-eed4-402e-ae9d-a720670c1049');
        else if (r==1)
            animationTemplate = KM.KinematicsManager.getAnimationTemplate('76b33aec-b0b2-4863-8dda-f1cd87956a23');
        else
            animationTemplate = KM.KinematicsManager.getAnimationTemplate('f71ea555-5c90-47b4-aa94-c6129b731ee0');

        KM.KinematicsManager.startAnimation(joint,animationTemplate.anime);
    }
}
