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

/* Add a new joint to the root joint (default joint type is revoluteJoint) */
let root = hierachy.getRootJoint();
let joint1 = hierachy.createJoint(root,[34]);                 

/* Define Center & Axis for revolute joint */
joint1.setCenter(new Communicator.Point3(84.67,28.49,-20));
joint1.setAxis(new Communicator.Point3(1,0,0));

/* Add a new revolute child joint under the first joint */
let joint2 = hierachy.createJoint(joint1,[30,29]);                 
joint2.setCenter(new Communicator.Point3(18.07,28.59,-11));
joint2.setAxis(new Communicator.Point3(-1,0,0));

/* Specify a fixed axis for second joint*/
joint2.setFixedAxis(new Communicator.Point3(0,0,-1));

/* Specify a target axis for the above specified fixed axis*/
joint2.setFixedAxisTarget(new Communicator.Point3(0,0,-1));

/* Rotate first joint to 45 degrees from default position*/
joint1.set(45);

/* Update Joint Hierachy. Needs to be called when any joint value has changed*/
hierachy.updateJoints();   
```



**Generate a Template from an existing Kinematics Hierachy:**

```

/* Create new or update existing template from joint hierachy*/
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

/* get Joint with id 1 */
let joint = hierachy.getJointById(1);

/* Rotate first joint to 45 degrees from its default position*/
joint.set(45);  

/* Update Joint Hierachy. Needs to be called when any joint value has changed*/
hierachy.updateJoints();
```                