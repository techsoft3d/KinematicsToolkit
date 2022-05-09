# Kinematics Toolkit (BETA)

## Kinematics Engine for HOOPS Communicator
The purpose of this set of classes is to make it easy to add kinematics-based animations to CAD Models, in particular in the context of Digital Twin workflows.
In a typical CAD model the product structure is often flat or unrelated to the kinematics/joint relationships of the assembly which is why the Kinematics Manager allows the user to define its own component hierachy independent of the CAD hierachy. Based on this relationship graph it is then straightforward to animate a specific component by setting a single value. 

In addition to this basic functionality the Kinematics Manager also offers the ability to define indirect components that are driven by other components based on their mathematical relationships. For example a mapped Component will move or rotate depending on the movement or rotation of another component. Other components allow for the creation of hinges, pistons and other more complex mechanical systems. It is also possible to define your own component behaviors. In addition, the Kinematics Toolkit provides a simple Inverse Kinematics solver based on the gradient decent method.

Once a Kinematics Hierachy is defined it can be easily exported to a JSON object and its template can then be applied to individual instances of a CAD model that exist in the scene, each driven by their own kinematics state (e.g. a number of IoT enabled devices in a building).


The Kinematics Manager also comes with its own animation system (powerd by anime.js) which makes it easy to define simple animations (like pressing a button or starting up a fan) and combining those into more complex animation groups.

In addition to the core Kinematics Toolkit classes this repo contains an experimental Editor Environment for interactively creating Kinematics Hierachies, setting up animations and exporting those to JSON.

**Limitations:**
* **This library is not an officially supported part of HOOPS Communicator and provided as-is.**
* This engine is not meant as a mathematically precise solver for arbitrary complex mechanical systems. Its main purpose is to provide the ability to efficently animate a CAD model for which its movement properties are known. 
* There is no physics engine and no object-to-object collission taken into account by the Kinematics Solver.
* The Inverse kinematics capabilites and various other functionality is currently in an experimental state.  
  
**Future Direction:**
* Improved Documentation and more samples
* We will be looking into adding additional component types
* We are looking into using the Mating information provided for some formats by HOOPS Exchange to help define the Kinematics Hierachy for a CAD Model.
* We will be investigating if an Open Source Physics engine can be added to the Kinematics Toolkit to allow for more physics driven kinematics
* We are looking into adding support for the new Keyframe-based Animation System provided in HOOPS Communicator 
* We are looking into improving various parts of the UI



### Install
* add dist/kinematicsManager.min.js to your project
```
    <script src="./js/kinematicsManager.min.js"></script>
```


### Using the Editor
**The Editor is currently in an experimetal state. Work on docs is in pogress.**  

Example URL (when running via Visual Studio Code Live Server plugin)

http://127.0.0.1:5500/dev/viewer.html?scs=models/microengine.scs



### Code Samples:

Assumes microengine model is already loaded


**Creating a new Kinematics Hierachy:**

```
/* Initialize KinematicsManager with HOOPS Communicator WebViewer Object */
KT.KinematicsManager.initialize(hwv);   

/* Create a new Kinematics Hierachy */
let hierachy = KT.KinematicsManager.createHierachy();

/* Add a new component to the root component (default component type is revoluteComponent) */
let root = hierachy.getRootComponent();
let component1 = hierachy.createComponent(root,[34]);                 

/* Define Center & Axis for revolute component */
component1.setCenter(new Communicator.Point3(84.67,28.49,-20));
component1.setAxis(new Communicator.Point3(1,0,0));

/* Add a new revolute child component under the first component */
let component2 = hierachy.createComponent(component1,[30,29]);                 
component2.setCenter(new Communicator.Point3(18.07,28.59,-11));
component2.setAxis(new Communicator.Point3(-1,0,0));

/* Specify a fixed axis for second component*/
component2.getBehavior().setFixedAxis(new Communicator.Point3(0,0,-1));

/* Specify a target axis for the above specified fixed axis*/
component2.getBehavior().setFixedAxisTarget(new Communicator.Point3(0,0,-1));

/* Rotate first component to 45 degrees from default position*/
component1.set(45);

/* Update Component Hierachy. Needs to be called when any component value has changed*/
hierachy.updateComponents();   
```



**Generate a Template from an existing Kinematics Hierachy:**

```

/* Create new or update existing template from component hierachy*/
hierachy.generateTemplate();

/* Retrieve stringified JSON template*/
var jsontext = JSON.stringify(KT.KinematicsManager.getTemplate(hierachy.getTemplateId()));

/* Serialize JSON string*/
...

```                


**Loading an existing Kinematics Hierachy Template and applying it to a model:**

```
/* Initialize KinematicsManager with HOOPS Communicator WebViewer Object */
KT.KinematicsManager.initialize(hwv);   

/* Fetch Kinematics Hierachy Definition from server*/
let res = await fetch('data/microengine.json');
data = await res.json();

/* Create Kinematics Template */
let templateId = KT.KinematicsManager.addTemplate(data);

/* Apply template to model (microengine) */
let hierachy = await KT.KinematicsManager.applyToModel(templateId);

/* get Component with id 1 */
let component = hierachy.getComponentById(1);

/* Rotate first component to 45 degrees from its default position*/
component.set(45);  

/* Update Component Hierachy. Needs to be called when any component value has changed*/
hierachy.updateComponents();
```                



**Creating a custom behavior and adding it to a component:**

```
/* Define custom behavior class based on template below. Type should be >=128*/
class MyKinematicsComponentBehavior {
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


/* Initialize KinematicsManager with HOOPS Communicator WebViewer Object */
KT.KinematicsManager.initialize(hwv);   

/* Create a new Kinematics Hierachy */
let hierachy = KT.KinematicsManager.createHierachy();

/* Add a new component to the root component (default component type is revoluteComponent) */
let root = hierachy.getRootComponent();
let component1 = hierachy.createComponent(root,[34]);                    

/* Define Center & Axis for revolute component */
component1.setCenter(new Communicator.Point3(84.67,28.49,-20));
component1.setAxis(new Communicator.Point3(1,0,0));

/* Create an object for your new behavior and attach it to the component*/
let behavior = new MyKinematicsComponentBehaviorHelical(component1);
component1.setBehavior(behavior);    
hierachy.updateComponents();   
    
``` 


**Loading an existing Kinematics Hierachy Template with a custom component and applying it to a model:**

```

/* Define callback function that creates custom component behavior from previous example */
function customTypeCallback(component, type)
{
    if (type == 128)
    {
        return new MyKinematicsComponentBehaviorHelical(component);
    }
}

/* Initialize KinematicsManager with HOOPS Communicator WebViewer Object */
KT.KinematicsManager.initialize(hwv);   


/* Set callback for custom behavior instantiation*/
KT.KinematicsManager.setCustomTypeCallback(customTypeCallback);
  
/* Fetch Kinematics Hierachy Definition from server*/
let res = await fetch('data/microenginecustom.json');
data = await res.json();

/* Create Kinematics Template */
let templateId = KT.KinematicsManager.addTemplate(data);

/* Apply template to model (microengine) */
let hierachy = await KT.KinematicsManager.applyToModel(templateId);


```                
