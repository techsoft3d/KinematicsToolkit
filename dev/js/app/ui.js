var uijoint = [];
var wheeltable;
var animationgrouptable;
var currentAnimationList;
var currentAnimationGroup = null;
var currentAnimationGroupId = 0;

var currentHierachy = null;
var currentTemplate = "";
var currentJoint = null;

let editMode = false;

function string_of_enum(e,value) 
{
  for (var k in e) if (e[k] == value) return k;
  return null;
}



function switchTemplate() {
    currentTemplate = $("#templateselect").val();
    currentHierachy = null;
    drawIKDiv();
}

function generateTemplateSelect() {
    var html = '<select id="templateselect" onchange="switchTemplate()" class="form-select" style="font-size:11px;margin-top:10px;" value="">\n';

    for (var i in KM.KinematicsManager.getHierachyTemplates()) {

        if (i == currentTemplate)
            html += '<option selected value="' + i + '">' + i + '</option>\n';
        else
            html += '<option value="' + i + '">' + i + '</option>\n';

    }


    html += '</select>';
    return html;
}


function generateAssignAnimationSelect() {
    var html = "";
    html += '<select id = "assignanimtationselect" class="form-select form-select-sm mb-3" aria-label=".form-select-sm example">';

    let animationTemplates = KM.KinematicsManager.getAnimationTemplates();
    for (var i in animationTemplates) {
        html += '<option value="' + i + '">' + animationTemplates[i].getName() + '</option>\n';

    }
    html += '</select>';
    return html;
}



function generateAnimationGroupSelect() {
    var html = "";
    html += '<select onchange="switchAnimationGroup()" id = "animationgroupselect" style="margin-bottom:0.5rem!important;width:50%;display:inline" class="form-select form-select-sm mb-3" aria-label=".form-select-sm example">';
  
    let animationGroups = KM.KinematicsManager.getAnimationGroups();

    for (var i=0;i<animationGroups.length;i++) {
        if (i == currentAnimationGroupId)
                html += '<option selected value="' + i + '">' + animationGroups[i].getName() + '</option>\n';
            else
                html += '<option value="' + i + '">' + animationGroups[i].getName() + '</option>\n';

    }
    html += '</select>';
    return html;
}

function generateAnimationTemplateSelect(joint) {
    var html = '<select id="animationtemplateselect" class="form-select" style="font-size:11px;margin-top:10px;width:30%;display:initial" value="">\n';

   
    let animationTemplates = KM.KinematicsManager.getAnimationTemplates();
    for (var i in animationTemplates) {
        for (let j=0;j<joint.getAnimations().length;j++)
        {
            if (joint.getAnimations()[j] == i)
            {
                html += '<option value="' + i + '">' + animationTemplates[i].name + '</option>\n';
            }
        }

    }
    html += '</select>';
    return html;
}   


function generateJointTypeSelect(joint) {
    var html = '<select id="jointtype" class="form-select" style="font-size:11px" value="">\n';

    for (let i = 0; i < 8; i++) {
        if (i == joint.getType())
            html += '<option selected value="' + string_of_enum(KM.jointType,i) + '">' + string_of_enum(KM.jointType,i) + '</option>\n';
        else
            html += '<option value="' + string_of_enum(KM.jointType,i) + '">' + string_of_enum(KM.jointType,i) + '</option>\n';
    }

    let i = 11;
    if (i == joint.getType())
        html += '<option selected value="' + string_of_enum(KM.jointType, i) + '">' + string_of_enum(KM.jointType, i) + '</option>\n';
    else
        html += '<option value="' + string_of_enum(KM.jointType, i) + '">' + string_of_enum(KM.jointType, i) + '</option>\n';

    i = 12;
    if (i == joint.getType())
        html += '<option selected value="' + string_of_enum(KM.jointType, i) + '">' + string_of_enum(KM.jointType, i) + '</option>\n';
    else
        html += '<option value="' + string_of_enum(KM.jointType, i) + '">' + string_of_enum(KM.jointType, i) + '</option>\n';
    
        
    html += '</select>';
    return html;
}   


function generateMapJointTypeSelect(joint) {
    var html = '<select id="mappedjointtype" class="form-select" style="font-size:11px" value="">\n';

    if (joint.getMappedType() == 0)
        html += '<option selected value="' + string_of_enum(KM.jointType,0) + '">' + string_of_enum(KM.jointType,0) + '</option>\n';
    else
        html += '<option value="' + string_of_enum(KM.jointType,0) + '">' + string_of_enum(KM.jointType,0) + '</option>\n';

    if (joint.getMappedType() == 1)
        html += '<option selected value="' + string_of_enum(KM.jointType,1) + '">' + string_of_enum(KM.jointType,1) + '</option>\n';
    else
        html += '<option value="' + string_of_enum(KM.jointType,1) + '">' + string_of_enum(KM.jointType,1) + '</option>\n';

    if (joint.getMappedType() == 8)
        html += '<option selected value="' + string_of_enum(KM.jointType,8) + '">' + string_of_enum(KM.jointType,8) + '</option>\n';
    else
        html += '<option value="' + string_of_enum(KM.jointType,8) + '">' + string_of_enum(KM.jointType,8) + '</option>\n';

    if (joint.getMappedType() == 9)
        html += '<option selected value="' + string_of_enum(KM.jointType, 9) + '">' + string_of_enum(KM.jointType, 9) + '</option>\n';
    else
        html += '<option value="' + string_of_enum(KM.jointType, 9) + '">' + string_of_enum(KM.jointType, 9) + '</option>\n';


    if (joint.getMappedType() == 10)
        html += '<option selected value="' + string_of_enum(KM.jointType, 10) + '">' + string_of_enum(KM.jointType, 10) + '</option>\n';
    else
        html += '<option value="' + string_of_enum(KM.jointType, 10) + '">' + string_of_enum(KM.jointType, 10) + '</option>\n';


    html += '</select>';
    return html;
}   

function generateExtraJoint1Select(joint) {
    var html = '<select id="fixedjointselect" class="form-select" style="font-size:11px" value="">\n';

    for (var i in KM.KinematicsManager.getHierachyByIndex(0).getJointHash()) {
        if (KM.KinematicsManager.getHierachyByIndex(0).getJointById(i).getParent() && KM.KinematicsManager.getHierachyByIndex(0).getJointById(i)!=joint) {
            let jointname = KM.KinematicsManager.getHierachyByIndex(0).getJointById(i).getId() + ":" + string_of_enum(KM.jointType, KM.KinematicsManager.getHierachyByIndex(0).getJointById(i).getType());
            if (KM.KinematicsManager.getHierachyByIndex(0).getJointById(i) == joint.extraJoint1)
                html += '<option selected value="' + jointname + '">' + jointname + '</option>\n';
            else
                html += '<option value="' + jointname + '">' + jointname + '</option>\n';

        }
    }
   
    html += '</select>';
    return html;
}   

function generateMappedJointSelect(joint) {
    var html = '<select id="mappedjointselect" class="form-select" style="font-size:11px" value="">\n';

    for (var i in KM.KinematicsManager.getHierachyByIndex(0).getJointHash()) {
        if (KM.KinematicsManager.getHierachyByIndex(0).getJointById(i).getParent() && KM.KinematicsManager.getHierachyByIndex(0).getJointById(i)!=joint) {
            let jointname = KM.KinematicsManager.getHierachyByIndex(0).getJointById(i).getId() + ":" + string_of_enum(KM.jointType, KM.KinematicsManager.getHierachyByIndex(0).getJointById(i).getType());
            if (KM.KinematicsManager.getHierachyByIndex(0).getJointById(i) == joint.getMappedTargetJoint())
                html += '<option selected value="' + jointname + '">' + jointname + '</option>\n';
            else
                html += '<option value="' + jointname + '">' + jointname + '</option>\n';

        }
    }
   
    html += '</select>';
    return html;
}   


function generateExtraJoint2Select(joint) {
    var html = '<select id="variablejointselect" class="form-select" style="font-size:11px" value="">\n';

    for (var i in KM.KinematicsManager.getHierachyByIndex(0).getJointHash()) {
        if (KM.KinematicsManager.getHierachyByIndex(0).getJointById(i).getParent() && KM.KinematicsManager.getHierachyByIndex(0).getJointById(i)!=joint) {
            let jointname = KM.KinematicsManager.getHierachyByIndex(0).getJointById(i).getId() + ":" + string_of_enum(KM.jointType, KM.KinematicsManager.getHierachyByIndex(0).getJointById(i).getType());
            if (KM.KinematicsManager.getHierachyByIndex(0).getJointById(i) == joint.getExtraJoint2())
                html += '<option selected value="' + jointname + '">' + jointname + '</option>\n';
            else
                html += '<option value="' + jointname + '">' + jointname + '</option>\n';

        }
    }
   
    html += '</select>';
    return html;
}   


var jointidcounter = 0;

function generateKinematicsTreeDataRecursive(joint, parentid)
{

    $('#KinematicsTreeDiv').jstree().create_node(parentid, {
        "id": joint.getId().toString(),
        "text": parentid=="#" ? joint.getId() + ":root": joint.getType() != KM.jointType.mapped ? 
            joint.getId() + ":" + string_of_enum(KM.jointType,joint.getType()) : joint.getId() + ":" + string_of_enum(KM.jointType,joint.getType()) + ":" + string_of_enum(KM.jointType,joint.getMappedType()) + ":" + joint.getMappedTargetJoint().getId(),
        });


    for (let i=0;i<joint.getChildren().length;i++)        
    {
        generateKinematicsTreeDataRecursive(joint.getChildByIndex(i), joint.getId());
    }
}



function generateKinematicsTreeData() {

    if ($('#KinematicsTreeDiv').jstree() != undefined)
        $('#KinematicsTreeDiv').jstree().destroy();

    if (!currentHierachy)
        return;
    var joint = currentHierachy.getRootJoint();

    $('#KinematicsTreeDiv').jstree({
        "core": {
            "animation": 0,
            "check_callback": true,
            "themes": { "stripes": true },
        }
    });

    $('#KinematicsTreeDiv').on("select_node.jstree", function (e, data) {
        let id = parseInt(data.node.id);
        showJoint(id);
        currentJoint = id;
        generateJointPropertiesData(id);

    });
    generateKinematicsTreeDataRecursive(joint, "#");
    $("#KinematicsTreeDiv").jstree("open_all");


}

function generateJointPropertiesData(id)
{
    joint = currentHierachy.getJointById(id);
    $("#KinematicsJointPropertiesDiv").empty();
    
    let html = "";
    html+='<div class="container">';    
    html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Type:</label></div>';
    html += '<div class="col">' + generateJointTypeSelect(joint) + '</div></div>';
   
    html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Reference</label></div><div class="col">';
    if (joint.getIsReference())
        html += '<input type="checkbox"  id="isreference" checked>';
    else
        html += '<input type="checkbox" id="isreference">';
    html += '</div></div>';

    html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Limits:</label></div>';
    html += '<div class="col"><input id="jointmin" type="number" value="' + joint.getMinAngle() + '" class="form-control" style="font-size:11px"><input id="jointmax" type="number" value="' + joint.getMaxAngle() + '" class="form-control" style="font-size:11px"></div></div>';
    
    if (joint.getType() == KM.jointType.revolute) {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Fixed Axis</label></div><div class="col">';
        if (joint.getFixedAxis())
            html += '<input type="checkbox" onclick="showFixedAxis(' + id + ')" id="hasfixedaxis" checked>';
        else
            html += '<input type="checkbox" onclick="showFixedAxis(' + id + ')" id="hasfixedaxis">';
            html += '</div></div>';            
    }
  

    if (joint.getType() == KM.jointType.prismaticTriangle)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Fixed Joint:</label></div>';
        html += '<div class="col">' + generateExtraJoint1Select(joint) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Variable Joint:</label></div>';
        html += '<div class="col">' + generateExtraJoint2Select(joint) + '</div></div>';

    }    
    if (joint.getType() == KM.jointType.mate)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Joint 1:</label></div>';
        html += '<div class="col">' + generateExtraJoint1Select(joint) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Joint 2</label></div>';
        html += '<div class="col">' + generateExtraJoint2Select(joint) + '</div></div>';

        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Params:</label></div>';
        html += '<div class="col">';
        html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="updateMatePivot(0,' + id + ')">Joint 1 Pivot</button>';
        html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="updateMatePivot(1,' + id + ')">Joint 2 Pivot</button>';
        html += '</div></div>';
    }    
    if (joint.getType() == KM.jointType.revoluteSlide)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Joint 1:</label></div>';
        html += '<div class="col">' + generateExtraJoint1Select(joint) + '</div></div>';

        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Params:</label></div>';
        html += '<div class="col">';
        html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="updateMatePivot(0,' + id + ')">Joint 1 Pivot</button>';
        html += '</div></div>';


    }    

    else if (joint.getType() == KM.jointType.prismaticAggregate)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Joint 1:</label></div>';
        html += '<div class="col">' + generateExtraJoint1Select(joint) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Joint 2:</label></div>';
        html += '<div class="col">' + generateExtraJoint2Select(joint) + '</div></div>';

    }    

    else if (joint.getType() == KM.jointType.pistonController)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Prismatic Target:</label></div>';
        html += '<div class="col">' + generateExtraJoint1Select(joint) + '</div></div>';
    }      
    else if (joint.getType() == KM.jointType.helical)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Factor:</label></div>';
        html += '<div class="col"><input id="helicalfactor" style="font-size:11px;background:none;font-weight:bold;position:relative;width:50px;"value="' +  joint.getHelicalFactor() + '"></div></div>';
    }
    else if (joint.getType() == KM.jointType.mapped)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Mapped Type:</label></div>';

    

        html += '<div class="col">' + generateMapJointTypeSelect(joint) + '</div></div>';

        if (joint.getMappedType() == KM.jointType.prismaticPlane)
        {
            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Params:</label></div>';
            html += '<div class="col">';
            html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="updatePrismaticPlane(0,' + id + ')">Plane</button>';
            html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="updatePrismaticPlane(1,' + id + ')">Tip</button>';

            html += '</div></div>';
                
        }

        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Mapped Joint:</label></div>';
        html += '<div class="col">' + generateMappedJointSelect(joint) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Factor:</label></div>';
        html += '<div class="col"><input id="helicalfactor" style="font-size:11px;background:none;font-weight:bold;position:relative;width:50px;"value="' +  joint.getHelicalFactor() + '"></div></div>';
        if (joint.getMappedType() == KM.jointType.belt)
        {     

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Width:</label></div>';
            html += '<div class="col"><input onchange="updateBeltWidth(' + id + ')" id="beltwidth" type="number" value="' + joint.getBelt().getWidth() + '" class="form-control" style="font-size:11px"></div></div>';

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Segments:</label></div>';
            html += '<div class="col"><input onchange="updateBeltSegmentCount(' + id + ')" id="beltsegments" type="number" value="' + joint.getBelt().getSegmentNum() + '" class="form-control" style="font-size:11px"></div></div>';

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Thickness:</label></div>';
            html += '<div class="col"><input onchange="updateBeltThickness(' + id + ')" id="beltthickness" type="number" value="' + joint.getBelt().getThickness() + '" class="form-control" style="font-size:11px"></div></div>';

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Gap:</label></div>';
            html += '<div class="col"><input onchange="updateBeltGap(' + id + ')" id="beltgap" type="number" value="' + joint.getBelt().getGap() + '" class="form-control" style="font-size:11px"></div></div>';

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Tracks:</label></div>';
            html += '<div class="col"><input onchange="updateBeltTracks(' + id + ')" id="belttracks" type="number" value="' + joint.getBelt().getTracks() + '" class="form-control" style="font-size:11px"></div></div>';


            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Invert Track Orientation</label></div><div class="col">';
            if (joint.getBelt().getTrackOrientation())
                html += '<input type="checkbox" onclick="updateBeltOrientation(' + id + ')" id="belttrackorientation" checked>';
            else
                html += '<input type="checkbox" onclick="updateBeltOrientation(' + id + ')" id="belttrackorientation">';
            html += '</div></div>';            

            let dis;
            if (joint.getBelt().getAlignVector())
                dis = '';
            else
                dis = 'disabled';



            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Align Vector:</label></div>';
            if (joint.getBelt().getAlignVector()) {
                let alignVector = joint.getBelt().getAlignVector();
                html += '<div class="col"><input ' + dis + ' onchange="updateAlignVector(' + id + ')" id="alignvector" type="text" value="' + alignVector.x + ' ' + alignVector.y + ' ' + alignVector.z + '" class="form-control" style="display:inline;width:50%;font-size:11px">';
            }
            else
                html += '<div class="col"><input ' + dis + ' onchange="updateAlignVector(' + id + ')" id="alignvector" type="text" value="" class="form-control" style="display:inline;width:50%;font-size:11px">';

            if (joint.getBelt().getAlignVector())
                html += '<input style="margin-bottom:5px;margin-left:5px" type="checkbox" onclick="updateAlignVector(' + id + ')" id="alignvectorcheckbox" checked>';
            else

                html += '<input  style="margin-bottom:5px; margin-left:5px" type="checkbox" onclick="updateAlignVector(' + id + ')" id="alignvectorcheckbox">';
            html += '</div></div>';

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Colors:</label></div>';
            let hexcolor1 = rgbToHex(joint.getBelt().GetColor1());
            let hexcolor2 = rgbToHex(joint.getBelt().getColor2());
            html += '<div class="col"><input style="height:20px;width:20px;padding:0;border:none" onchange="updateBeltColor(' + id + ',0)" type="color" onclick="" id="beltcolor1" name="favcolor" value="' + hexcolor1 + '"></input>';
            html += '<input style="height:20px;width:20px;padding:0;border:none;margin-left:5px" onchange="updateBeltColor(' + id + ',1)" type="color" onclick="" id="beltcolor2" name="favcolor" value="' + hexcolor2 + '"></input></div></div>';


            html += '<div id = "wheeltable" style="font-size:10px"></div>';
            html += '<button type="button" class="btn btn-secondary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="addBeltWheel(' + id + ')">Add</button>';
            html += '<button type="button" class="btn btn-secondary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="insertBeltWheelBefore(' + id + ')">Ins. Before</button>';
            html += '<button type="button" class="btn btn-secondary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="insertBeltWheelAfter(' + id + ')">Ins. After</button>';
            html += '<button type="button" class="btn btn-secondary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="deleteBeltWheel(' + id + ')">Delete</button>';
            html += '<button type="button" class="btn btn-secondary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="rebuildBelt(' + id + ')">Rebuild</button>';
        }
    }
    html += '</div>';

    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="updateJoint(' + id + ')">Update</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="updateReferences(' + id + ')">Upd. Refs</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="removeFromReferences(' + id + ')">Remove Refs</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="showJoint(' + id + ',true)">Adjust</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="adjustToPlane()">Plane Adj.</button>';
    html += '<h2 style="margin-top:20px;"><span>Joint Animation</span></h2>';
    html += generateAnimationTemplateSelect(joint);
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="animateJoint(' + id + ')">Play</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="stopAnimation(' + id + ')">Stop</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="changeAnimationSpeed(' + id + ')">Change Speed</button><br>';
    html += '<button type="button" style="font-size:11px" onclick="assignanimationDialog()" class="btn btn-primary btn-sm ms-1 mt-1" data-bs-toggle="modal" data-bs-target="#AssignAnimation">Assign</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="removeAnimationFromJoint()">Remove</button>';
    html += '<button type="button" style="font-size:11px" onclick="updateanimationdialog()" class="btn btn-primary btn-sm ms-1 mt-1" data-bs-toggle="modal" data-bs-target="#DefineAnimation">Update</button>';
    html += '<button type="button" style="font-size:11px" onclick="newanimationdialog()" class="btn btn-primary btn-sm ms-1 mt-1" data-bs-toggle="modal" data-bs-target="#DefineAnimation">New</button>';
    $("#KinematicsJointPropertiesDiv").append(html);




    if (joint.getMappedType() == KM.jointType.belt) {

        let jointlist = [];
        for (let i in KM.KinematicsManager.getHierachyByIndex(0).getJointHash()) {
            let thisjoint = KM.KinematicsManager.getHierachyByIndex(0).getJointById(i);
            if (thisjoint.getParent() && thisjoint!=joint) {
                let jointname =thisjoint.getId() + ":" + string_of_enum(KM.jointType, thisjoint.getType());
                jointlist.push(jointname);
    
            }
        }

        wheeltable = new Tabulator("#wheeltable", {
            layout: "fitColumns",           
            selectable:1,
            height:"150px",
            columns: [
                {
                    title: "ID", field: "id", width: 60,
                },
                {title:"Joint", field:"joint",  width: 100,editor:"select", editorParams:{values:jointlist}},
                { title: "Radius", field: "radius", formatter: "plaintext",editor: "input", width: 60},
                {title:"In", field:"inner", hozAlign:"center", editor:true, formatter:"tickCross",editorParams:{
                    tristate:false}, formatterParams:{
                    allowEmpty:false,
                }},
                {title:"Inv", field:"other", hozAlign:"center", editor:true, formatter:"tickCross",editorParams:{
                    tristate:false},formatterParams:{
                    allowEmpty:false,
                }},
            ],
        });
        wheeltable.on("tableBuilt", function (e, row) {
            refreshWheelTable(joint);
            // let prop = {radius:5, joint: "red", id:0};
            // wheeltable.addData([prop], false);
            // prop = { joint: "Joint 1",radius:7,id:1};
            // wheeltable.addData([prop], false);

        });

        wheeltable.on("rowClick", function (e, row) {
            let data = row.getData();
            joint.getBelt().getWheelByIndex(data.id).joint.selectReferenceNodes();
        });

        wheeltable.on("cellEdited", function (e) {
            let data = e.getRow().getData();
            if (data.joint != "") {
                joint.getBelt().getWheelByIndex(data.id).joint = currentHierachy.getJointById( data.joint.split(":")[0]);
            }
            joint.getBelt().getWheelByIndex(data.id).radius = parseFloat(data.radius);
            joint.getBelt().getWheelByIndex(data.id).inner = data.inner;
            joint.getBelt().getWheelByIndex(data.id).other = data.other;
        });

    }

}


function updateBeltWidth(id)
{
    let joint = currentHierachy.getJointById(id);
    joint.getBelt().setWidth(parseFloat($("#beltwidth").val()));
}


function updateBeltThickness(id)
{
    let joint = currentHierachy.getJointById(id);
    joint.getBelt().setThickness(parseFloat($("#beltthickness").val()));
}


function updateBeltGap(id)
{
    let joint = currentHierachy.getJointById(id);
    joint.getBelt().setGap(parseFloat($("#beltgap").val()));
}


function updateBeltTracks(id)
{
    let joint = currentHierachy.getJointById(id);
    joint.getBelt().setTracks(parseFloat($("#belttracks").val()));
}


function updateBeltOrientation(id)
{
    let joint = currentHierachy.getJointById(id);
    joint.getBelt().setTrackOrientation($("#belttrackorientation").is(":checked"));
}

function updateBeltColor(id, col)
{
    let joint = currentHierachy.getJointById(id);
    if (col == 0)
    {
        joint.getBelt().setColor1(hexToRGB($("#beltcolor1").val()));
    }
    else
        joint.getBelt().setColor2(hexToRGB($("#beltcolor2").val()));

}


function updateAlignVector(id, col)
{
    let joint = currentHierachy.getJointById(id);
    let ischecked = $("#alignvectorcheckbox").is(":checked");
    if (!ischecked)
    {
        joint.getBelt().setAlignVector(null);
        $( "#alignvector" ).prop( "disabled", true );

    }
    else
    {
        $( "#alignvector" ).prop( "disabled", false );
        var av =   $( "#alignvector" ).val().split(" ");
        joint.getBelt().setAlignVector(new Communicator.Point3(parseFloat(av[0]),parseFloat(av[1]),parseFloat(av[2])));
    }

}

function updateBeltSegmentCount(id)
{
    let joint = currentHierachy.getJointById(id);
    joint.getBelt().setSegmentNum(parseFloat($("#beltsegments").val()));
}

function refreshWheelTable(joint)
{
    wheeltable.clearData();
    for (let i=0;i<joint.getBelt().getWheels().length;i++)
    {
        let wheel = joint.getBelt().getWheelByIndex(i);
        let jointname;
        if (wheel.joint)
        {
            jointname = wheel.joint.getId() + ":" + string_of_enum(KM.jointType, wheel.joint.getType());
        }
        else 
        {
            jointname = "";
        }
        let prop = {id:i, joint:jointname, radius:wheel.radius, inner:wheel.inner, other:wheel.other};
        wheeltable.addData([prop], false);
    }
    
}

function addBeltWheel(id)
{
    let joint = currentHierachy.getJointById(id);
    joint.getBelt().addWheel();
    refreshWheelTable(joint);
}



function insertBeltWheelBefore(id)
{
    let joint = currentHierachy.getJointById(id);
    let data = wheeltable.getSelectedData();
    if (data.length>0)
    {
        joint.getBelt().insertWheel(data[0].id);
        refreshWheelTable(joint);
    }
}


function insertBeltWheelAfter(id)
{
    let joint = currentHierachy.getJointById(id);
    let data = wheeltable.getSelectedData();
    if (data.length>0)
    {
        joint.getBelt().insertWheel(data[0].id+1);
        refreshWheelTable(joint);
    }
}

function deleteBeltWheel(id)
{
    let joint = currentHierachy.getJointById(id);
    let data = wheeltable.getSelectedData();
    if (data.length>0)
        joint.getBelt().deleteWheel(data[0].id);
    refreshWheelTable(joint);
}

function rebuildBelt(id)
{
    let joint = currentHierachy.getJointById(id); 
    joint.getBelt().initialize();       
}


let tempnode = null;
function showFixedAxis(id,show)
{
    let joint = currentHierachy.getJointById(id);
    var handleOperator = hwv.operatorManager.getOperator(Communicator.OperatorId.Handle);
    handleOperator.removeHandles();        
    tempnode = hwv.model.createNode(hwv.model.getRootNode());  
    joint.showHandles(KM.KinematicsManager.handlePlacementOperator, $("#hasfixedaxis").is(":checked"), tempnode);

}

function updateEditMode()
{
    editMode = $("#iseditmode").is(":checked");
}


function newHierachy()
{
    currentHierachy = KM.KinematicsManager.createHierachy();
    drawIKDiv();

}

function drawIKDiv() {

    $("#KinematicsParameters").empty();
    var html = "";
    html+='<h2><span>Hierachy Templates</span></h2>';
    html += generateTemplateSelect();
    html += '<button type="button" style="font-size:11px" class="btn btn-dark btn-sm ms-1"  onclick="applyToModel();">Apply</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-dark btn-sm ms-1"  onclick="setFromModel();">Get</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-dark btn-sm ms-1"  onclick="newHierachy();">New</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-dark btn-sm ms-1"  onclick="updateTemplate();">Update</button>';
    html += '<button type="button" style="font-size:11px;" onclick="setShowTemplateValues()" class="btn btn-dark btn-sm ms-1" data-bs-toggle="modal" data-bs-target="#showtemplate">Show</button>';
    html += '<button type="button" style="font-size:11px;position:absolute;right:0px" onclick="setIkUIValues()" class="btn btn-light btn-sm ms-1" data-bs-toggle="modal" data-bs-target="#editIkSettingsModel">IK Settings</button>';
    html += '<br>';
    html += '<h2 style="margin-top:20px;"><span>Animation Group</span></h2>';
    html +=  generateAnimationGroupSelect();
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="startAnimationGroup();">Play</button>';    
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="stopAllAnimations();">Stop</button>';    
    html += '<br><button type="button" style="font-size:11px" onclick="newAnimationGroupDialog()" class="btn btn-secondary btn-sm ms-1" data-bs-toggle="modal" data-bs-target="#newupdateanimationgroup">New</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="addJointFromUI(true);">Edit</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="addJointFromUI(true);">Delete</button>';
    html += '<h2 style="margin-top:20px;"><span>Joint Hierachy</span></h2>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="addJointFromUI(false);">Add</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="addJointFromUI(true);">Add to Root</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="insertJointFromUI();">Insert</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="moveupJointFromUI();">Move Up</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="deleteJointFromUI();">Delete</button>';    
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="hwv.model.resetNodesTransform()";">Reset</button>';    
    html +='<label class="form-label" style="font-size:11px">Edit:</label>';
    if (editMode)
        html += '<input style="font-size:11px" type="checkbox"  onclick="updateEditMode()" id="iseditmode" checked>';
    else
        html += '<input style="font-size:11px" type="checkbox"  onclick="updateEditMode()" id="iseditmode">';

    $("#KinematicsParameters").append(html);


    generateKinematicsTreeData();
}
function setIkUIValues()
{
    $("#samplingdistance").val(currentHierachy.getIkSamplingDistance());
    $("#_ikSamplingDistanceTranslation").val(currentHierachy.getIkSamplingDistanceTranslation());
    $("#learningrate").val(currentHierachy.getIkLearningRate());
    $("#ikthreshold").val(currentHierachy.getIkThreshold());
    $("#ikspeed").val(currentHierachy.getIkSpeed());
}

function setShowTemplateValues()
{
    var x = JSON.stringify(KM.KinematicsManager.getTemplate(currentTemplate));
    document.getElementById("templatejson").value = x;
}

function updateKinematicsManager() {
     currentHierachy.setIkSamplingDistance(parseFloat($("#samplingdistance")[0].value));
     currentHierachy.setIkSamplingDistanceTranslation(parseFloat($("#_ikSamplingDistanceTranslation")[0].value));
     currentHierachy.setIkLearningRate(parseFloat($("#learningrate")[0].value));
     currentHierachy.setIkThreshold(parseFloat($("#ikthreshold")[0].value));
     currentHierachy.setIkSpeed(parseFloat($("#ikspeed")[0].value));
}




async function showJoint(j,adjustToCenter) {
    
    let joint = currentHierachy.getJointById( j);
    var handleOperator = hwv.operatorManager.getOperator(Communicator.OperatorId.Handle);
    handleOperator.removeHandles();

    let center;
    if (adjustToCenter){
        let bounds = await hwv.model.getNodesBounding([hwv.selectionManager.getLast().getNodeId()]);
        center = bounds.center();        
    }

    if (joint.getType() != KM.jointType.fixed) {
        if (editMode) {
            tempnode = hwv.model.createNode(hwv.model.getRootNode());
            joint.showHandles(KM.KinematicsManager.handlePlacementOperator, false, tempnode, center);

        }
        else
            joint.showHandles(KM.KinematicsManager.handlePlacementOperator, false, undefined, center);
    }


}

function updateReferences(j){
    let joint = currentHierachy.getJointById(j);
    var nodeids = [];
    var selections = KM.KinematicsManager.viewer.selectionManager.getResults();
    for (let i=0;i<selections.length;i++)
        nodeids.push(selections[i].getNodeId());

    joint.updateReferenceNodes(nodeids);

}
function removeFromReferences(j){
    let joint = currentHierachy.getJointById(j);
    var nodeids = [];
    var selections = KM.KinematicsManager.viewer.selectionManager.getResults();
    for (let i=0;i<selections.length;i++)
        nodeids.push(selections[i].getNodeId());

    joint.removeReferenceNodes(nodeids);

}

function updateJoint(j){
    let joint = currentHierachy.getJointById(j);
    joint.setParametersFromHandle();
    let text = $("#jointtype")[0].value;
    joint.setType(KM.jointType[text]);
    joint.setType(KM.jointType[text]);

    if ((joint.getType() == KM.jointType.prismaticTriangle || joint.getType() == KM.jointType.prismaticAggregate || joint.getType() == KM.jointType.mate) && $("#fixedjointselect")[0] != undefined)
    {
        let id = parseInt($("#fixedjointselect")[0].value.split(":")[0]);
        let fixedjoint = currentHierachy.getJointById(id);
        joint.setExtraJoint1(fixedjoint);
        id = parseInt($("#variablejointselect")[0].value.split(":")[0]);
        let variablejoint = currentHierachy.getJointById(id);
        joint.setExtraJoint2(variablejoint);
    }
    if (joint.getType() == KM.jointType.revoluteSlide && $("#fixedjointselect")[0] != undefined)
    {
        let id = parseInt($("#fixedjointselect")[0].value.split(":")[0]);
        let fixedjoint = currentHierachy.getJointById(id);
        joint.setExtraJoint1(fixedjoint);
    }

    if (joint.getType() == KM.jointType.pistonController && $("#fixedjointselect")[0] != undefined)
    {
        let id = parseInt($("#fixedjointselect")[0].value.split(":")[0]);
        let fixedjoint = currentHierachy.getJointById(id);
        joint.setExtraJoint1(fixedjoint); 
        joint.adjustExtraJointToPistonController();
    }
    else if (joint.getType() == KM.jointType.helical && $("#helicalfactor")[0] != undefined)
    {
        joint.setHelicalFactor(parseFloat($("#helicalfactor")[0].value));
    }
    else if (joint.getType() == KM.jointType.mapped && $("#helicalfactor")[0] != undefined)
    {
        joint.setHelicalFactor(parseFloat($("#helicalfactor")[0].value));

        joint.getMappedType() =  KM.jointType[$("#mappedjointtype")[0].value];

        if (joint.getMappedType() == KM.jointType.belt && !joint.getBelt())
            joint.belt = new Belt();               


        let id = parseInt($("#mappedjointselect")[0].value.split(":")[0]);               
        joint.setMappedTargetJoint(currentHierachy.getJointById(id));
    }
    else if (joint.getType() == KM.jointType.revolute)
    {
        if (!$("#hasfixedaxis").is(":checked"))
        {
            joint.setFixedAxis(null);
        }
        else
        {
            joint.setFixedAxisFromHandle(tempnode);

        }
              
    }

    if ($("#isreference").is(":checked"))
        joint.setIsReference(true);
    else
        joint.setIsReference(false);

    var nodeids = [];
    var selections = KM.KinematicsManager.viewer.selectionManager.getResults();
    for (let i=0;i<selections.length;i++)
        nodeids.push(selections[i].getNodeId());

    joint.updateReferenceNodes(nodeids);

    let jstreenode =  $('#KinematicsTreeDiv').jstree().get_node(joint.getId());
    $('#KinematicsTreeDiv').jstree().set_text(jstreenode, !joint.getParent() ? joint.getId() + ":root": joint.getId() + ":" + string_of_enum(KM.jointType,joint.getType()));
    generateJointPropertiesData(j);
}


function addJointFromUI(fromRoot)
{
    let selectednode = $('#KinematicsTreeDiv').jstree().get_selected();
    let selid;
    if (selectednode.length==0 || fromRoot)
        selid = 0;
    else
         selid = parseInt(selectednode[0]);

    let newjoint = currentHierachy.createJointFromSelection(currentHierachy.getJointById(selid),true, shiftPressed); 
 
    drawIKDiv();
    let jstreenode =  $('#KinematicsTreeDiv').jstree().get_node(newjoint.getId());
    $('#KinematicsTreeDiv').jstree().select_node(jstreenode);

}


function insertJointFromUI()
{
    let selectednode = $('#KinematicsTreeDiv').jstree().get_selected();
    let selid;
    if (selectednode.length==0)
        selid = 0;
    else
         selid = parseInt(selectednode[0]);
    let newjoint = currentHierachy.createJointFromSelection(currentHierachy.getJointById(selid),true); 
    for (var i=0;i<newjoint.getParent().getChildren().length-1;i++)
    {
        newjoint.getParent().getChildren()[i].setParent(newjoint);
        newjoint.getChildren().push(newjoint.getParent().getChildByIndex(i));        
    }
    newjoint.getParent()._children = [];
    newjoint.getParent().getChildren().push(newjoint);
    currentHierachy.rebuildJointTree();

    drawIKDiv();
    let jstreenode =  $('#KinematicsTreeDiv').jstree().get_node(newjoint.getId());
    $('#KinematicsTreeDiv').jstree().select_node(jstreenode);

}


function deleteJointFromUI()
{
    let selid = parseInt($('#KinematicsTreeDiv').jstree().get_selected());
    currentHierachy.getJointById(selid).delete();
    drawIKDiv();

}

function moveupJointFromUI()
{
    let selid = parseInt($('#KinematicsTreeDiv').jstree().get_selected());
    let joint = currentHierachy.getJointById( currentJoint);
    joint.moveup();
    drawIKDiv();

}

function adjustToPlane() {
    let r = KM.KinematicsManager.viewer.selectionManager.getResults();
    if (r.length == 0) return;

    let plane = new Communicator.Plane();
    for (let i = 0; i < r.length; i++) {
        let nodeid = r[i].getNodeId();
        let joint = KM.KinematicsManager.getJointFromNodeId(nodeid);

        if (i==0)
            plane.setFromPointAndNormal(joint.getCenter(), joint.getAxis());
        
        let newcenter = ViewerUtility.closestPointOnPlane(plane, joint.getCenter());
        let delta = Communicator.Point3.subtract(joint.getCenter(), newcenter);
        joint.setCenter(newcenter);        
        if (joint.getExtraPivot1()) {
            joint.setExtraPivot1(ViewerUtility.closestPointOnPlane(plane, joint.getExtraPivot1()));

        }
        if (joint.getExtraPivot2()) {
            joint.setExtraPivot2(ViewerUtility.closestPointOnPlane(plane, joint.getExtraPivot2()));

        }
    }
}

function setFromModel() {
    if (hwv.selectionManager.getLast())
        currentHierachy = KM.KinematicsManager.getHierachyFromNodeId(hwv.selectionManager.getLast().getNodeId());

    else
        currentHierachy = KM.KinematicsManager.getHierachyFromNodeId();
    currentTemplate = currentHierachy._templateId;
    drawIKDiv();

}

function applyToModel() {
    let _templateId = currentTemplate;
    if (!hwv.selectionManager.getLast())
        currentHierachy = KM.KinematicsManager.applyToModel(_templateId);
    else {

        if (shiftPressed) {
            let nodeid = hwv.selectionManager.getLast().getNodeId();
            let children = hwv.model.getNodeChildren(nodeid);
            for (let i = 0; i < children.length; i++) {             
                currentHierachy = KM.KinematicsManager.applyToModel(_templateId, children[i]);
            }

        }
        else {
            var selections = KM.KinematicsManager.viewer.selectionManager.getResults();
            for (let i = 0; i < selections.length; i++) {
                let nodeid = selections[i].getNodeId();
                currentHierachy = KM.KinematicsManager.applyToModel(_templateId, nodeid);
            }
        }
    }
    drawIKDiv();
}

function updateTemplate()
{
    currentHierachy.generateTemplate();
    currentTemplate = currentHierachy.getTemplateId();
    drawIKDiv();

}

function updatePrismaticPlane(type, j) {

    let joint = currentHierachy.getJointById( j);

    var handleOperator = hwv.operatorManager.getOperator(Communicator.OperatorId.Handle);
    let pos = handleOperator.getPosition();
    let axis = KM.KinematicsManager.handlePlacementOperator.lastAxis;
    if (type === 0) {
        if (pos) {
            joint.setPrismaticPlanePlane(new Communicator.Plane());
            joint.getPrismaticPlanePlane().setFromPointAndNormal(pos,axis);

        }
    }
    if (type === 1) {
        if (pos) {
            joint.setPrismaticPlaneTip(pos.copy());
        }
    }
}



function updateMatePivot(type, j) {

    let joint = currentHierachy.getJointById( j);

    var handleOperator = hwv.operatorManager.getOperator(Communicator.OperatorId.Handle);
    let pos = handleOperator.getPosition();
    let axis = KM.KinematicsManager.handlePlacementOperator.lastAxis;
    if (pos) {
        if (type === 0) {
            joint.setExtraPivot1(pos.copy());
        }
        else
        {
            joint.setExtraPivot2(pos.copy());
        }
    }
}








function animateJoint(j){
    let animationtemplate = KM.KinematicsManager.getAnimationTemplate($("#animationtemplateselect").val());
    let joint = currentHierachy.getJointById(j);

    KM.KinematicsManager.startAnimation(joint,animationtemplate);
}

function changeAnimationSpeed(j){
    let joint = currentHierachy.getJointById(j);   

    KM.KinematicsManager.changeAnimationSpeed(joint,-500 + Math.floor(Math.random() * 1000));
}

function stopAnimation(j){
    let joint = currentHierachy.getJointById(j);   

    KM.KinematicsManager.stopAnimation(joint);
}


function addNewAnimationTemplate() {
    if ($("#newupdateanimationbutton").html() == "Update") {
        let animationtemplate = KM.KinematicsManager.getAnimationTemplate($("#animationtemplateselect").val());
        let anime = {};
        anime.value = $("#animationtarget")[0].value;
        anime.duration = $("#animationduration")[0].value;
        anime.easing = $("#animationeasing")[0].value;
        anime.loop = $("#animationloop")[0].value;
        anime.direction = $("#animationdirection")[0].value;
        anime.easeintime = $("#animationeaseintime")[0].value;
        anime.infinite = $("#animationinfinite")[0].checked;
        KM.KinematicsManager.updateAnimationTemplate($("#animationtemplateselect").val(), $("#animationname")[0].value, anime);
    }
    else {

        let animedef = {
            value: $("#animationtarget")[0].value,
            duration: $("#animationduration")[0].value,
            easing: $("#animationeasing")[0].value,
            loop: $("#animationloop")[0].value,
            direction: $("#animationdirection")[0].value,
            easeintime: $("#animationeaseintime")[0].value,
            infinite: $("#animationinfinite")[0].checked,
        };
        let animationid = KM.KinematicsManager.addAnimationTemplate($("#animationname")[0].value, animedef);
        let joint = currentHierachy.getJointById( currentJoint);
        joint.addAnimation(animationid);
        generateJointPropertiesData(currentJoint);
    }

}

function newanimationdialog() {
    $("#newupdateanimationbutton").html("New");
}

function refreshAnimationGroupTable()
{
    animationgrouptable.clearData();
    for (let i=0;i<currentAnimationGroup.getAnimations().length;i++)
    {
        let animationReference = currentAnimationGroup.getAnimationByIndex(i);
        let prop;
        if (!animationReference.animation)
             prop = {id:i,animation: animationReference.animation == null ? "" : animationReference.animation.name};
        else
        {
            let animationname = KM.KinematicsManager.getAnimationTemplate(animationReference.animation).name;
            prop = {id:i, animation: "Joint: " + animationReference.joint + ":" +  animationname};            
        }

        animationgrouptable.addData([prop], false);

    }
    animationgrouptable.redraw();
    
}

function addAnimationToGroup()
{
    currentAnimationGroup.addAnimation(null);
    refreshAnimationGroupTable();
}

function gatherAllAnimations()
{
    let animations = [];
    let hierachy = currentHierachy;

    for (let i in hierachy.getJointHash())
    {
        let joint = hierachy.getJointById(i);
        for (let j=0;j<joint.getAnimations().length;j++)
        {
            animations.push({text: animations.length + ":Joint " + joint.getId() + ":" + KM.KinematicsManager.getAnimationTemplate(joint.getAnimationByIndex(j)).name, animation: joint.getAnimationByIndex(j), joint:joint.getId()});
            
        }
    }

    return animations;
    
}

function newAnimationGroup()
{
   currentAnimationGroup.setName($("#animationgroupname").val());

   let id = KM.KinematicsManager.addAnimationGroup(currentAnimationGroup);
   currentAnimationGroupId = id;
   drawIKDiv();
}



function switchAnimationGroup()
{
    currentAnimationGroupId = $("#animationgroupselect").val();

}

function stopAllAnimations()
{
    KM.KinematicsManager.stopAnimation();
}

function startAnimationGroup()
{
    KM.KinematicsManager.startAnimationGroup(currentAnimationGroupId);
}

function newAnimationGroupDialog() {
    currentAnimationGroup = new KM.KinematicsAnimationGroup(currentHierachy);
    currentAnimationList = gatherAllAnimations();
    let animationlist = [];
    for (let i=0;i<currentAnimationList.length;i++)
    {
        animationlist.push(currentAnimationList[i].text);
    }
    animationgrouptable = new Tabulator("#animationgroupanimationstab", {
        layout: "fitColumns",           
        selectable:1,
        columns: [
            {
                title: "ID", field: "id", width: 60,
            },
            {title:"Animation", field:"animation",editor:"select", editorParams:{values:animationlist}},
 
        ],
    });
    
    animationgrouptable.on("tableBuilt", function (e, row) {     
        refreshAnimationGroupTable();         
    });

    animationgrouptable.on("cellEdited", function (cell) {
        let data = cell.getRow().getData();
        let i = data.animation.split(":")[0];
        currentAnimationGroup.getAnimations()[data.id].animation = currentAnimationList[i].animation;
        currentAnimationGroup.getAnimations()[data.id].joint = currentAnimationList[i].joint;

    });
}

function updateanimationdialog() {
    $("#newupdateanimationbutton").html("Update");

    let animationtemplate = KM.KinematicsManager.getAnimationTemplate($("#animationtemplateselect").val());
    $("#animationname").val(animationtemplate.name);
    $("#animationtarget").val(animationtemplate.anime.value);
    $("#animationduration").val(animationtemplate.anime.duration);
    $("#animationeasing").val(animationtemplate.anime.easing);
    $("#animationloop").val(animationtemplate.anime.loop);
    $("#animationdirection").val(animationtemplate.anime.direction);
    $("#animationeaseintime").val(animationtemplate.anime.easeintime);
    $("#animationinfinite").prop('checked',animationtemplate.anime.infinite);


}

function assignanimationDialog()
{
    $("#assignanimationselect").html(generateAssignAnimationSelect);
}


function assignAnimation()
{
    let joint = currentHierachy.getJointById(currentJoint);
    joint.addAnimation($("#assignanimtationselect").val());
    generateJointPropertiesData(currentJoint);
}   

function removeAnimationFromJoint()
{
    let joint = currentHierachy.getJointById(currentJoint);
    joint.removeAnimation($("#animationtemplateselect").val());
    generateJointPropertiesData(currentJoint);

}



function deleteAnimationDefinition()
{
    KM.KinematicsManager.deleteAnimationTemplate($("#animationtemplateselect").val());
    generateJointPropertiesData(currentJoint);
}   


function hexToRGB(hex) {

    let red = parseInt(hex[1] + hex[2], 16);
    let green = parseInt(hex[3] + hex[4], 16);
    let blue = parseInt(hex[5] + hex[6], 16);
    return new Communicator.Color(red, green, blue);
}

function rgbToHex(color) {
    function _componentToHex(c) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
      }

        return "#" + _componentToHex(color.r) +  _componentToHex(color.g) +  _componentToHex(color.b);          
}