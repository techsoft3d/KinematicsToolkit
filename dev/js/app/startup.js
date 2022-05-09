var myLayout;
var mySelectionBasket;
var myMaterialTool;
var shiftPressed = false;


class MyKinematicsComponentBehaviorHelical {
    constructor(component) {
        this._component = component;
        this._type = 128;                
        this._helicalFactor = 1.0;

    }

    getType() {
        return this._type;
    }

    async fromJson(def, version) {
        this._helicalFactor = def.helicalFactor;
    }

    jsonFixup() {

    }

    toJson(def) {
        def.helicalFactor = this._helicalFactor;
    }
   
    getCurrentValue() {
        return this._component._currentPosition;
    }

    set(value) {
        this._component._translate(value);
    }                
     getHelicalFactor() {
        return this._helicalFactor;
    }


    setHelicalFactor(helicalFactor) {
        this._helicalFactor = helicalFactor;
    }

    getMovementType()
    {
        return KT.componentType.prismatic;
    }


    async execute() {
        let component = this._component;
        let p1 = component.getParent().transformlocalPointToWorldSpace(component.getCenter());
        let p2 = component.transformlocalPointToWorldSpace(component.getCenter());
        let length = Communicator.Point3.subtract(p2, p1).length();
        component._translate(length);
        let p3 = component.transformlocalPointToWorldSpace(component.getCenter());
        component._translate(-length);
        let p4 = component.transformlocalPointToWorldSpace(component.getCenter());
        if (Communicator.Point3.subtract(p3, p2).length() < Communicator.Point3.subtract(p4, p2).length()) {
            component._translate(length);
            length = -length;
        }
        component._rotate(length * this._helicalFactor, true, true);
    }

}

function customTypeCallback(component, type)
{
    if (type == 128)
    {
        return new MyKinematicsComponentBehaviorHelical(component);
    }
}

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
    myLayout.on('stateChanged', function () {
        if (hwv != null) {
            hwv.resizeCanvas();            
        }
    });
  
    myLayout.init();


    var viewermenu = [
        {
            name: 'Load Kinematics Data',
            subMenu: [
                {
                    name: 'Microengine',
                    fun: async function () {
                        loadIKData("data/microengine.json");
                      
                    },
                },
                {
                    name: 'Sentry',
                    fun: async function () {
                        loadIKData("dataTemp/sentry2.json");
                     

                    },
                },
                {
                    name: 'Hoist',
                    fun: async function () {
                        loadIKData("dataTemp/hoist3.json");
                      
                    },
                },              
                {
                    name: 'robot',
                    fun: async function () {
                        loadIKData("dataTemp/bubarobot.json");

                    },
                },                  
                {
                    name: 'Gripper',
                    fun: async function () {
                        loadIKData("dataTemp/gripper.json");

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
        name: 'Animate Sentry',
        fun: function () {
            sentryanim();
        }
    },   
    {
        name: 'Stop Sentry Animation',
        fun: function () {
            clearInterval(sentryinterval);
        }
    },   
    {
        name: 'Component Move',
        fun: function () {
            KT.KinematicsManager.setupComponentMoveOperator();

        }
    },   
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
                component2.getBehavior().setFixedAxis(new Communicator.Point3(0,0,-1));
                component2.getBehavior().setFixedAxisTarget(new Communicator.Point3(0,0,-1));

                component1.set(45);
                hierachy.updateComponents();   

                currentHierachy = hierachy;
                drawIKDiv();
            }
        },   
    
        {
            name: 'Custom Behavior Example',
            fun: function () {
          

                let hierachy = KT.KinematicsManager.createHierachy();
                let root = hierachy.getRootComponent();
                let component1 = hierachy.createComponent(root,[34]);                 
                component1.setCenter(new Communicator.Point3(84.67,28.49,-20));
                component1.setAxis(new Communicator.Point3(1,0,0));

                let behavior = new MyKinematicsComponentBehaviorHelical(component1);
                component1.setBehavior(behavior);
             
                hierachy.updateComponents();   

                currentHierachy = hierachy;
                drawIKDiv();
            }
        },           
        
        {
            name: 'Custom Behavior Load',
            fun: async function () {
          
                KT.KinematicsManager.setCustomBehaviorCreationCallback(customTypeCallback);
                let res = await fetch('dataTemp/microenginecustom.json');
                data = await res.json();
                let templateId = KT.KinematicsManager.addTemplate(data);
                let hierachy = await KT.KinematicsManager.applyToModel(templateId);
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

    let res = await fetch(name);
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

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}


var sentryinterval;
var firstSentryLoad = false;

async function sentryanim() {
    if (!firstSentryLoad) {
        firstSentryLoad = true;
        myMaterialTool = new MaterialTool(hwv);
        let res = await fetch('data/sentrymaterial.json');
        let json = await res.json();
        myMaterialTool.fromJson(json);
        myMaterialTool.refresh();



        await loadIKData("sentry2.json");
        currentHierachy = KT.KinematicsManager.applyToModel("572ca79b-0573-4a10-b4f6-0f6f8c3b6ec0");
        drawIKDiv();
    }

    let animcomponents = [1, 2, 16, 17, 28, 29, 41, 42, 53, 54, 65, 66,77,78,155,157,159];
//    let animcomponents = [29];
    let lastAnimHash = [];
    for (let i = 0; i < animcomponents.length; i++) {
        lastAnimHash[i] = 0;
    }

    sentryinterval = setInterval(function () {
        var hierachy = KT.KinematicsManager.getHierachyByIndex(0);

        for (let i = 0; i < animcomponents.length; i++) {
            let comp = hierachy.getComponentById(animcomponents[i]);
            if (!comp.getAnimationActive() &&  getRandomInt(10) == 0) {
                let animindex;
                do {
                    animindex = getRandomInt(3);
                }while (animindex == lastAnimHash[i]);
                lastAnimHash[i] = animindex;
                let animationtemplate = KT.KinematicsManager.getAnimationTemplate(comp.getAnimationByIndex(animindex));
                if (animcomponents[i] != 77 && animcomponents[i] != 78)
                    animationtemplate.anime.duration = 500;
                KT.KinematicsManager.startAnimation(comp, animationtemplate);
            }
        }
    }, 50);


}




