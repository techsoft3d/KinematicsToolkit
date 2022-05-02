var myLayout;
var mySelectionBasket;
var myMaterialTool;
var shiftPressed = false;

async function msready() {

    hwv.view.setAmbientOcclusionEnabled(true);
    hwv.view.setAmbientOcclusionRadius(0.025);
    $(document).on('keyup keydown', function(e){shiftPressed = e.shiftKey;} );

    KT.KinematicsManager.initialize(hwv);
    KT.KinematicsManager.setupHandleOperator();

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
    var component = KT.KinematicsManager.getComponentFromNodeId(nodeid);    

    if (component)
    {              
        await component.calculateMatrixFromHandleMatrix(mat2[0]);
        await component.getHierachy().updateComponents();   
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
                    name: 'Sentry',
                    fun: async function () {
                        loadIKData("sentry.json");
                        // myMaterialTool  = new MaterialTool(hwv);
                        // let res = await fetch('data/material2.json');
                        // let json = await res.json();
                        // myMaterialTool.fromJson(json);
                        // myMaterialTool.refresh();

                    },
                },
                {
                    name: 'Hoist',
                    fun: async function () {
                        loadIKData("hoist3.json");
                        // myMaterialTool  = new MaterialTool(hwv);
                        // let res = await fetch('data/material2.json');
                        // let json = await res.json();
                        // myMaterialTool.fromJson(json);
                        // myMaterialTool.refresh();

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
                let hierachy = KT.KinematicsManager.createHierachy();
                let root = hierachy.getRootComponent();
                let component1 = hierachy.createComponent(root,[34]);                 
                component1.setCenter(new Communicator.Point3(84.67,28.49,-20));
                component1.setAxis(new Communicator.Point3(1,0,0));

                let component2 = hierachy.createComponent(component1,[30,29]);                 
                component2.setCenter(new Communicator.Point3(18.07,28.59,-11));
                component2.setAxis(new Communicator.Point3(-1,0,0));
                component2.setFixedAxis(new Communicator.Point3(0,0,-1));
                component2.setFixedAxisTarget(new Communicator.Point3(0,0,-1));

                component1.set(45);
                hierachy.updateComponents();   

                currentHierachy = hierachy;
                drawIKDiv();
            }
        },   
        {
            name: 'Load Micronengine Def Sample',
            fun: async function () {

                let res = await fetch('data/microengine.json');
                data = await res.json();
                let templateId = KT.KinematicsManager.addTemplate(data);
                let hierachy = await KT.KinematicsManager.applyToModel(templateId);
                let component = hierachy.getComponentById(1);
                component.set(45);
                hierachy.updateComponents();
                currentHierachy = hierachy;
                drawIKDiv();
            }
        },   
                {
            name: 'Toggle Allow Body Nodes',
            fun: function () {
                mySelectionBasket.setDisallowBodyNodes(!mySelectionBasket._disallowBodyNodes);
            }
        },   

        {
            name: 'Restrict To Selection',
            fun: function () {
                mySelectionBasket.setRestrictToNode(hwv.selectionManager.getLast().getNodeId());
            }
        },   
        {
            name: 'Unset Restrict To Selection',
            fun: function () {
                mySelectionBasket.unsetRestrictToNode();
            }
        },   
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
    KT.KinematicsManager.addTemplate(data);
    currentTemplate = data._templateId;
    drawIKDiv();

}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

function microanim()
{
    for (let i=0; i<KT.KinematicsManager.getHierachies().length; i++)
    {
        let component = KT.KinematicsManager.getHierachyByIndex(i).getComponentById(1);
        let animationTemplate;
        var r = getRandomInt(3);
        if (r == 0)
            animationTemplate = KT.KinematicsManager.getAnimationTemplate('a0d326e1-eed4-402e-ae9d-a720670c1049');
        else if (r==1)
            animationTemplate = KT.KinematicsManager.getAnimationTemplate('76b33aec-b0b2-4863-8dda-f1cd87956a23');
        else
            animationTemplate = KT.KinematicsManager.getAnimationTemplate('f71ea555-5c90-47b4-aa94-c6129b731ee0');

        KT.KinematicsManager.startAnimation(component,animationTemplate);
    }
}
