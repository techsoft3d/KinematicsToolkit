# Kinematics Manager

## Simple Kinematics Engine for HOOPS Communicator


### Install
* add dist/kinematicsManager.min.js to your project
```
    <script src="./js/kinematicsManager.min.js"></script>
```

### Code Samples:

Assumes microengine model is already loaded


**Creating a new Kinematics Hierachy:**

```
/* Initialize KinematicsManager with HOOPS Communicator WebViewer Object */
KM.KinematicsManager.initialize(hwv);   

/* Create a new Kinematics Hierachy */
let hierachy = KM.KinematicsManager.createHierachy();

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
component2.setFixedAxis(new Communicator.Point3(0,0,-1));

/* Specify a target axis for the above specified fixed axis*/
component2.setFixedAxisTarget(new Communicator.Point3(0,0,-1));

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
var jsontext = JSON.stringify(KM.KinematicsManager.getTemplate(hierachy.getTemplateId()));

/* Serialize JSON string*/
...

```                


**Loading an existing Kinematics Hierachy Template and applying it to a model:**

```
/* Initialize KinematicsManager with HOOPS Communicator WebViewer Object */
KM.KinematicsManager.initialize(hwv);   

/* Fetch Kinematics Hierachy Definition from server*/
let res = await fetch('data/microengine.json');
data = await res.json();

/* Create Kinematics Template */
let templateId = KM.KinematicsManager.addTemplate(data);

/* Apply template to model (microengine) */
let hierachy = await KM.KinematicsManager.applyToModel(templateId);

/* get Component with id 1 */
let component = hierachy.getComponentById(1);

/* Rotate first component to 45 degrees from its default position*/
component.set(45);  

/* Update Component Hierachy. Needs to be called when any component value has changed*/
hierachy.updateComponents();
```                