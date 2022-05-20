var uicomponent = [];
var wheeltable;
var animationgrouptable;
var currentAnimationList;
var currentAnimationGroup = null;
var currentAnimationGroupId = 0;

var currentHierachy = null;
var currentTemplate = "";
var currentComponent = null;

let editMode = false;

function string_of_enum(e,value) 
{
  for (var k in e) if (e[k] == value) return k;
  return "Custom";
}

function switchTemplate() {
    currentTemplate = $("#templateselect").val();
    currentHierachy = null;
    drawIKDiv();
}

function generateTemplateSelect() {
    var html = '<select id="templateselect" onchange="switchTemplate()" class="form-select" style="font-size:11px;margin-top:10px;" value="">\n';

    for (var i in KT.KinematicsManager.getHierachyTemplates()) {

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

    let animationTemplates = KT.KinematicsManager.getAnimationTemplates();
    for (var i in animationTemplates) {
        html += '<option value="' + i + '">' + animationTemplates[i].name + '</option>\n';

    }
    html += '</select>';
    return html;
}



function generateAnimationGroupSelect() {
    var html = "";
    html += '<select onchange="switchAnimationGroup()" id = "animationgroupselect" style="margin-bottom:0.5rem!important;width:50%;display:inline" class="form-select form-select-sm mb-3" aria-label=".form-select-sm example">';
  
    let animationGroups = KT.KinematicsManager.getAnimationGroups();

    for (var i=0;i<animationGroups.length;i++) {
        if (i == currentAnimationGroupId)
                html += '<option selected value="' + i + '">' + animationGroups[i].getName() + '</option>\n';
            else
                html += '<option value="' + i + '">' + animationGroups[i].getName() + '</option>\n';

    }
    html += '</select>';
    return html;
}

function generateAnimationTemplateSelect(component) {
    var html = '<select id="animationtemplateselect" class="form-select" style="font-size:11px;margin-top:10px;width:30%;display:initial" value="">\n';

   
    let animationTemplates = KT.KinematicsManager.getAnimationTemplates();
    for (var i in animationTemplates) {
        for (let j=0;j<component.getAnimations().length;j++)
        {
            if (component.getAnimations()[j] == i)
            {
                html += '<option value="' + i + '">' + animationTemplates[i].name + '</option>\n';
            }
        }

    }
    html += '</select>';
    return html;
}   



function addComponentTypeToSelect(i,component)
{
    if (i == component.getType())
    return  '<option selected value="' + string_of_enum(KT.componentType,i) + '">' + string_of_enum(KT.componentType,i) + '</option>\n';
else
    return '<option value="' + string_of_enum(KT.componentType,i) + '">' + string_of_enum(KT.componentType,i) + '</option>\n';
}


function addComponentMappedTypeToSelect(i,component)
{
    if (i == component.getBehavior().getMappedType())
    return  '<option selected value="' + string_of_enum(KT.componentType,i) + '">' + string_of_enum(KT.componentType,i) + '</option>\n';
else
    return '<option value="' + string_of_enum(KT.componentType,i) + '">' + string_of_enum(KT.componentType,i) + '</option>\n';
}

function generateComponentTypeSelect(component) {
    var html = '<select id="componenttype" class="form-select" style="font-size:11px" value="">\n';

    for (let i = 0; i < 8; i++) {
        html+=addComponentTypeToSelect(i,component);
    }
    html+=addComponentTypeToSelect(10,component);
    html+=addComponentTypeToSelect(11,component);
    html+=addComponentTypeToSelect(12,component);
    html+=addComponentTypeToSelect(13,component);
        
    html += '</select>';
    return html;
}   


function generateMappedComponentTypeSelect(component) {
    var html = '<select id="mappedcomponenttype" class="form-select" style="font-size:11px" value="">\n';


    html+=addComponentMappedTypeToSelect(0,component);
    html+=addComponentMappedTypeToSelect(1,component);
    html+=addComponentMappedTypeToSelect(8,component);
    html+=addComponentMappedTypeToSelect(9,component);

    html += '</select>';
    return html;
}   

function generateExtraComponent1Select(component) {
    var html = '<select id="fixedcomponentselect" class="form-select" style="font-size:11px" value="">\n';
    html += '<option selected value="' + "EMPTY" + '">' + "EMPTY" + '</option>\n';
    for (var i in KT.KinematicsManager.getHierachyByIndex(0).getComponentHash()) {
        if (KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getParent() && KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i)!=component) {
            let componentname = KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getId() + ":" + string_of_enum(KT.componentType, KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getType());
            if (KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i) == component.getBehavior().getExtraComponent1())
                html += '<option selected value="' + componentname + '">' + componentname + '</option>\n';
            else
                html += '<option value="' + componentname + '">' + componentname + '</option>\n';

        }
    }
   
    html += '</select>';
    return html;
}   

function generateMappedComponentSelect(component) {
    var html = '<select id="mappedcomponentselect" class="form-select" style="font-size:11px" value="">\n';

    for (var i in KT.KinematicsManager.getHierachyByIndex(0).getComponentHash()) {
        if (KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getParent() && KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i)!=component) {
            let componentname = KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getId() + ":" + string_of_enum(KT.componentType, KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getType());
            if (KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i) == component.getBehavior().getMappedTargetComponent())
                html += '<option selected value="' + componentname + '">' + componentname + '</option>\n';
            else
                html += '<option value="' + componentname + '">' + componentname + '</option>\n';

        }
    }
   
    html += '</select>';
    return html;
}   


function generateMappedPivotSystemSelect(component) {
    var html = '<select id="mappedcomponentselect" class="form-select" style="font-size:11px" value="">\n';
    html += '<option selected value="' + "EMPTY" + '">' + "EMPTY" + '</option>\n';
    for (var i in KT.KinematicsManager.getHierachyByIndex(0).getComponentHash()) {
        if (KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getParent() && KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i)!=component) {
            let componentname = KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getId() + ":" + string_of_enum(KT.componentType, KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getType());
            if (KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i) == component.getBehavior().getMappedComponent())
                html += '<option selected value="' + componentname + '">' + componentname + '</option>\n';
            else
                html += '<option value="' + componentname + '">' + componentname + '</option>\n';

        }
    }
   
    html += '</select>';
    return html;
}   


function generateExtraComponent2Select(component) {
    var html = '<select id="variablecomponentselect" class="form-select" style="font-size:11px" value="">\n';
    html += '<option selected value="' + "EMPTY" + '">' + "EMPTY" + '</option>\n';
    for (var i in KT.KinematicsManager.getHierachyByIndex(0).getComponentHash()) {
        if (KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getParent() && KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i)!=component) {
            let componentname = KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getId() + ":" + string_of_enum(KT.componentType, KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i).getType());
            if (KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i) == component.getBehavior().getExtraComponent2())
                html += '<option selected value="' + componentname + '">' + componentname + '</option>\n';
            else
                html += '<option value="' + componentname + '">' + componentname + '</option>\n';

        }
    }
   
    html += '</select>';
    return html;
}   


var componentidcounter = 0;

function generateKinematicsTreeDataRecursive(component, parentid)
{

    $('#KinematicsTreeDiv').jstree().create_node(parentid, {
        "id": component.getId().toString(),
        "text": parentid=="#" ? component.getId() + ":root": component.getType() != KT.componentType.mapped ? 
            component.getId() + ":" + string_of_enum(KT.componentType,component.getType()) : component.getId() + ":" + string_of_enum(KT.componentType,component.getType()) + ":" + string_of_enum(KT.componentType,component.getBehavior().getMappedType()) + ":" + component.getBehavior().getMappedTargetComponent().getId(),
        });


    for (let i=0;i<component.getChildren().length;i++)        
    {
        generateKinematicsTreeDataRecursive(component.getChildByIndex(i), component.getId());
    }
}



function generateKinematicsTreeData() {

    if ($('#KinematicsTreeDiv').jstree() != undefined)
        $('#KinematicsTreeDiv').jstree().destroy();

    if (!currentHierachy)
        return;
    var component = currentHierachy.getRootComponent();

    $('#KinematicsTreeDiv').jstree({
        "core": {
            "animation": 0,
            "check_callback": true,
            "themes": { "stripes": true },
        }
    });

    $('#KinematicsTreeDiv').on("select_node.jstree", function (e, data) {
        let id = parseInt(data.node.id);
        showComponent(id);
        currentComponent = id;
        generateComponentPropertiesData(id);

    });
    generateKinematicsTreeDataRecursive(component, "#");
    $("#KinematicsTreeDiv").jstree("open_all");


}

function setMinLimit(id)
{
    component = currentHierachy.getComponentById(id);
    if (shiftPressed)
    {
        $("#componentmin")[0].value  = "";
        component.setMinLimit();
    }
    else
    {
        $("#componentmin")[0].value = component.getCurrentValue();
        component.setMinLimit(component.getCurrentValue());

    }

}

function setMaxLimit(id)
{
    component = currentHierachy.getComponentById(id);
    if (shiftPressed)
    {
        $("#componentmax")[0].value  = "";
        component.setMaxLimit();
    }
    else
    {
        $("#componentmax")[0].value = component.getCurrentValue();
        component.setMaxLimit(component.getCurrentValue());
    }
    
}

function generateComponentPropertiesData(id)
{
    component = currentHierachy.getComponentById(id);
    $("#KinematicsComponentPropertiesDiv").empty();
    
    let html = "";
    html+='<div class="container">';    
    html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Type:</label></div>';
    html += '<div class="col">' + generateComponentTypeSelect(component) + '</div></div>';
   
    html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Reference:</label></div><div class="col">';
    if (component.getIsReference())
        html += '<input type="checkbox"  id="isreference" checked>';
    else
        html += '<input type="checkbox" id="isreference">';
    html += '</div></div>';

    html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Enforce limits:</label></div><div class="col">';
    if (component.getEnforceLimits())
        html += '<input type="checkbox"  id="enforcelimits" checked>';
    else
        html += '<input type="checkbox" id="enforcelimits">';
    html += '</div></div>';


    html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Limits (Min/Max):</label></div>';
    html += '<div class="col"><input id="componentmin" type="number" value="' + component.getMinLimit() + '" class="form-control" style="font-size:11px;width:60px;display:inline">';
    html += '<button onclick="setMinLimit(' + id + ')" type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;width:35px">Get</button><br>';
    html +='<input id="componentmax" type="number" value="' + component.getMaxLimit() + '" class="form-control" style="font-size:11px;width:60px;display:inline">';
    html += '<button onclick="setMaxLimit(' + id + ')" type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;width:35px">Get</button>';    
    html+='</div></div>';
    
    if (component.getType() == KT.componentType.revolute) {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Fixed Axis</label></div><div class="col">';
        if (component.getBehavior().getFixedAxis())
            html += '<input type="checkbox" onclick="showFixedAxis(' + id + ')" id="hasfixedaxis" checked>';
        else
            html += '<input type="checkbox" onclick="showFixedAxis(' + id + ')" id="hasfixedaxis">';
            html += '</div></div>';            
    }
  

    if (component.getType() == KT.componentType.prismaticTriangle)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Fixed Component:</label></div>';
        html += '<div class="col">' + generateExtraComponent1Select(component) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Variable Component:</label></div>';
        html += '<div class="col">' + generateExtraComponent2Select(component) + '</div></div>';

    }    
    if (component.getType() == KT.componentType.mate)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Component 1:</label></div>';
        html += '<div class="col">' + generateExtraComponent1Select(component) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Component 2</label></div>';
        html += '<div class="col">' + generateExtraComponent2Select(component) + '</div></div>';

        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Params:</label></div>';
        html += '<div class="col">';
        html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="updateMatePivot(0,' + id + ')">Component 1 Pivot</button>';
        html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="updateMatePivot(1,' + id + ')">Component 2 Pivot</button>';
        html += '</div></div>';
    }    
    if (component.getType() == KT.componentType.pivotSystem)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Component 1:</label></div>';
        html += '<div class="col">' + generateExtraComponent1Select(component) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Component 2:</label></div>';
        html += '<div class="col">' + generateExtraComponent2Select(component) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Mapped Componet:</label></div>';
        html += '<div class="col">' + generateMappedPivotSystemSelect(component) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Factor:</label></div>';
        html += '<div class="col"><input id="helicalfactor" style="font-size:11px;background:none;font-weight:bold;position:relative;width:50px;"value="' +  component.getBehavior().getHelicalFactor() + '"></div></div>';

        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Params:</label></div>';
        html += '<div class="col">';
        html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;' + (component.getBehavior().getExtraPivot1() ? "background:red":"") + '" onclick="updateConnectorPivot(' + id + ')">Pivot 2</button>';
        html += '</div></div>';

        
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Prismatic:</label></div><div class="col">';
        if (component.getBehavior().getIsPrismatic())
            html += '<input type="checkbox"  id="isPrismatic" checked>';
        else
            html += '<input type="checkbox" id="isPrismatic">';
        html += '</div></div>';

        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Revolute Slide:</label></div><div class="col">';
        if (component.getBehavior().getIsRevoluteSlide())
            html += '<input type="checkbox"  id="isRevoluteSlide" checked>';
        else
            html += '<input type="checkbox" id="isRevoluteSlide">';
        html += '</div>';
    }    
    if (component.getType() == KT.componentType.revoluteSlide)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Component 1:</label></div>';
        html += '<div class="col">' + generateExtraComponent1Select(component) + '</div></div>';

        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Params:</label></div>';
        html += '<div class="col">';
        html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="updateMatePivot(0,' + id + ')">Component 1 Pivot</button>';
        html += '</div></div>';


    }    

    else if (component.getType() == KT.componentType.prismaticAggregate)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Component 1:</label></div>';
        html += '<div class="col">' + generateExtraComponent1Select(component) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Component 2:</label></div>';
        html += '<div class="col">' + generateExtraComponent2Select(component) + '</div></div>';

    }    

    else if (component.getType() == KT.componentType.pistonController)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Prismatic Target:</label></div>';
        html += '<div class="col">' + generateExtraComponent1Select(component) + '</div></div>';
    }      
    else if (component.getType() == KT.componentType.helical)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Factor:</label></div>';
        html += '<div class="col"><input id="helicalfactor" style="font-size:11px;background:none;font-weight:bold;position:relative;width:50px;"value="' +  component.getBehavior().getHelicalFactor() + '"></div></div>';
    }
    else if (component.getType() == KT.componentType.mapped)
    {
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Mapped Type:</label></div>';

    

        html += '<div class="col">' + generateMappedComponentTypeSelect(component) + '</div></div>';

        if (component.getBehavior().getMappedType() == KT.componentType.prismaticPlane)
        {
            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Params:</label></div>';
            html += '<div class="col">';
            html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="updatePrismaticPlane(0,' + id + ')">Plane</button>';
            html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;" onclick="updatePrismaticPlane(1,' + id + ')">Tip</button>';

            html += '</div></div>';
                
        }

        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Mapped Component:</label></div>';
        html += '<div class="col">' + generateMappedComponentSelect(component) + '</div></div>';
        html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Factor:</label></div>';
        html += '<div class="col"><input id="helicalfactor" style="font-size:11px;background:none;font-weight:bold;position:relative;width:50px;"value="' +  component.getBehavior().getHelicalFactor() + '"></div></div>';
        if (component.getBehavior().getMappedType() == KT.componentType.belt)
        {     

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Width:</label></div>';
            html += '<div class="col"><input onchange="updateBeltWidth(' + id + ')" id="beltwidth" type="number" value="' + component.getBehavior().getBelt().getWidth() + '" class="form-control" style="font-size:11px"></div></div>';

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Segments:</label></div>';
            html += '<div class="col"><input onchange="updateBeltSegmentCount(' + id + ')" id="beltsegments" type="number" value="' + component.getBehavior().getBelt().getSegmentNum() + '" class="form-control" style="font-size:11px"></div></div>';

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Thickness:</label></div>';
            html += '<div class="col"><input onchange="updateBeltThickness(' + id + ')" id="beltthickness" type="number" value="' + component.getBehavior().getBelt().getThickness() + '" class="form-control" style="font-size:11px"></div></div>';

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Gap:</label></div>';
            html += '<div class="col"><input onchange="updateBeltGap(' + id + ')" id="beltgap" type="number" value="' + component.getBehavior().getBelt().getGap() + '" class="form-control" style="font-size:11px"></div></div>';

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Tracks:</label></div>';
            html += '<div class="col"><input onchange="updateBeltTracks(' + id + ')" id="belttracks" type="number" value="' + component.getBehavior().getBelt().getTracks() + '" class="form-control" style="font-size:11px"></div></div>';


            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Invert Track Orientation</label></div><div class="col">';
            if (component.getBehavior().getBelt().getTrackOrientation())
                html += '<input type="checkbox" onclick="updateBeltOrientation(' + id + ')" id="belttrackorientation" checked>';
            else
                html += '<input type="checkbox" onclick="updateBeltOrientation(' + id + ')" id="belttrackorientation">';
            html += '</div></div>';            

            let dis;
            if (component.getBehavior().getBelt().getAlignVector())
                dis = '';
            else
                dis = 'disabled';
                
                html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Standin Nodes:</label></div><div class="col">';
            
                html += '<button onclick="setStandinNodes(' + id + ')" type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px;margin-bottom:3px;width:35px">Set</button>';    
                html += '</div></div>';            


            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Align Vector:</label></div>';
            if (component.getBehavior().getBelt().getAlignVector()) {
                let alignVector = component.getBehavior().getBelt().getAlignVector();
                html += '<div class="col"><input ' + dis + ' onchange="updateAlignVector(' + id + ')" id="alignvector" type="text" value="' + alignVector.x + ' ' + alignVector.y + ' ' + alignVector.z + '" class="form-control" style="display:inline;width:50%;font-size:11px">';
            }
            else
                html += '<div class="col"><input ' + dis + ' onchange="updateAlignVector(' + id + ')" id="alignvector" type="text" value="" class="form-control" style="display:inline;width:50%;font-size:11px">';

            if (component.getBehavior().getBelt().getAlignVector())
                html += '<input style="margin-bottom:5px;margin-left:5px" type="checkbox" onclick="updateAlignVector(' + id + ')" id="alignvectorcheckbox" checked>';
            else

                html += '<input  style="margin-bottom:5px; margin-left:5px" type="checkbox" onclick="updateAlignVector(' + id + ')" id="alignvectorcheckbox">';
            html += '</div></div>';

            html += '<div class="row"><div class="col"><label class="form-label" style="font-size:11px">Colors:</label></div>';
            let hexcolor1 = rgbToHex(component.getBehavior().getBelt().getColor1());
            let hexcolor2 = rgbToHex(component.getBehavior().getBelt().getColor2());
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

    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="updateComponent(' + id + ')">Update</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="updateReferences(' + id + ')">Upd. Refs</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="removeFromReferences(' + id + ')">Remove Refs</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="showComponent(' + id + ',true)">Adjust</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="adjustToPlane()">Plane Adj.</button>';
    html += '<h2 style="margin-top:20px;"><span>Component Animation</span></h2>';
    html += generateAnimationTemplateSelect(component);
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="animateComponent(' + id + ')">Play</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="stopAnimation(' + id + ')">Stop</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="changeAnimationSpeed(' + id + ')">Change Speed</button><br>';
    html += '<button type="button" style="font-size:11px" onclick="assignanimationDialog()" class="btn btn-primary btn-sm ms-1 mt-1" data-bs-toggle="modal" data-bs-target="#AssignAnimation">Assign</button>';
    html += '<button type="button" class="btn btn-primary btn-sm ms-1 mt-1" style = "font-size:11px" onclick="removeAnimationFromComponent()">Remove</button>';
    html += '<button type="button" style="font-size:11px" onclick="updateanimationdialog()" class="btn btn-primary btn-sm ms-1 mt-1" data-bs-toggle="modal" data-bs-target="#DefineAnimation">Update</button>';
    html += '<button type="button" style="font-size:11px" onclick="newanimationdialog()" class="btn btn-primary btn-sm ms-1 mt-1" data-bs-toggle="modal" data-bs-target="#DefineAnimation">New</button>';
    $("#KinematicsComponentPropertiesDiv").append(html);

    if (component.getType() == KT.componentType.mapped && component.getBehavior().getMappedType() == KT.componentType.belt) {

        let componentlist = [];
        for (let i in KT.KinematicsManager.getHierachyByIndex(0).getComponentHash()) {
            let thiscomponent = KT.KinematicsManager.getHierachyByIndex(0).getComponentById(i);
            if (thiscomponent.getParent() && thiscomponent!=component) {
                let componentname =thiscomponent.getId() + ":" + string_of_enum(KT.componentType, thiscomponent.getType());
                componentlist.push(componentname);
    
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
                {title:"Component", field:"component",  width: 100,editor:"select", editorParams:{values:componentlist}},
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
            refreshWheelTable(component);
            // let prop = {radius:5, component: "red", id:0};
            // wheeltable.addData([prop], false);
            // prop = { component: "Component 1",radius:7,id:1};
            // wheeltable.addData([prop], false);

        });

        wheeltable.on("rowClick", function (e, row) {
            let data = row.getData();
            component.getBehavior().getBelt().getWheelByIndex(data.id).component.selectReferenceNodes();
        });

        wheeltable.on("cellEdited", function (e) {
            let data = e.getRow().getData();
            if (data.component != "") {
                component.getBehavior().getBelt().getWheelByIndex(data.id).component = currentHierachy.getComponentById( data.component.split(":")[0]);
            }
            component.getBehavior().getBelt().getWheelByIndex(data.id).radius = parseFloat(data.radius);
            component.getBehavior().getBelt().getWheelByIndex(data.id).inner = data.inner;
            component.getBehavior().getBelt().getWheelByIndex(data.id).other = data.other;
        });

    }

}


function updateBeltWidth(id)
{
    let component = currentHierachy.getComponentById(id);
    component.getBehavior().getBelt().setWidth(parseFloat($("#beltwidth").val()));
}


function updateBeltThickness(id)
{
    let component = currentHierachy.getComponentById(id);
    component.getBehavior().getBelt().setThickness(parseFloat($("#beltthickness").val()));
}


function updateBeltGap(id)
{
    let component = currentHierachy.getComponentById(id);
    component.getBehavior().getBelt().setGap(parseFloat($("#beltgap").val()));
}


function updateBeltTracks(id)
{
    let component = currentHierachy.getComponentById(id);
    component.getBehavior().getBelt().setTracks(parseFloat($("#belttracks").val()));
}


function updateBeltOrientation(id)
{
    let component = currentHierachy.getComponentById(id);
    component.getBehavior().getBelt().setTrackOrientation($("#belttrackorientation").is(":checked"));
}

function updateBeltColor(id, col)
{
    let component = currentHierachy.getComponentById(id);
    if (col == 0)
    {
        component.getBehavior().getBelt().setColor1(hexToRGB($("#beltcolor1").val()));
    }
    else
        component.getBehavior().getBelt().setColor2(hexToRGB($("#beltcolor2").val()));

}


function updateAlignVector(id, col)
{
    let component = currentHierachy.getComponentById(id);
    let ischecked = $("#alignvectorcheckbox").is(":checked");
    if (!ischecked)
    {
        component.getBehavior().getBelt().setAlignVector(null);
        $( "#alignvector" ).prop( "disabled", true );

    }
    else
    {
        $( "#alignvector" ).prop( "disabled", false );
        var av =   $( "#alignvector" ).val().split(" ");
        component.getBehavior().getBelt().setAlignVector(new Communicator.Point3(parseFloat(av[0]),parseFloat(av[1]),parseFloat(av[2])));
    }

}

function updateBeltSegmentCount(id)
{
    let component = currentHierachy.getComponentById(id);
    component.getBehavior().getBelt().setSegmentNum(parseFloat($("#beltsegments").val()));
}

function refreshWheelTable(component)
{
    wheeltable.clearData();
    for (let i=0;i<component.getBehavior().getBelt().getWheels().length;i++)
    {
        let wheel = component.getBehavior().getBelt().getWheelByIndex(i);
        let componentname;
        if (wheel.component)
        {
            componentname = wheel.component.getId() + ":" + string_of_enum(KT.componentType, wheel.component.getType());
        }
        else 
        {
            componentname = "";
        }
        let prop = {id:i, component:componentname, radius:wheel.radius, inner:wheel.inner, other:wheel.other};
        wheeltable.addData([prop], false);
    }
    
}

function addBeltWheel(id)
{
    let component = currentHierachy.getComponentById(id);
    component.getBehavior().getBelt().addWheel();
    refreshWheelTable(component);
}



function insertBeltWheelBefore(id)
{
    let component = currentHierachy.getComponentById(id);
    let data = wheeltable.getSelectedData();
    if (data.length>0)
    {
        component.getBehavior().getBelt().insertWheel(data[0].id);
        refreshWheelTable(component);
    }
}


function insertBeltWheelAfter(id)
{
    let component = currentHierachy.getComponentById(id);
    let data = wheeltable.getSelectedData();
    if (data.length>0)
    {
        component.getBehavior().getBelt().insertWheel(data[0].id+1);
        refreshWheelTable(component);
    }
}

function deleteBeltWheel(id)
{
    let component = currentHierachy.getComponentById(id);
    let data = wheeltable.getSelectedData();
    if (data.length>0)
    component.getBehavior().getBelt().deleteWheel(data[0].id);
    refreshWheelTable(component);
}

function rebuildBelt(id)
{
    let component = currentHierachy.getComponentById(id); 
    component.getBehavior().getBelt().initialize();       
}


let tempnode = null;
function showFixedAxis(id,show)
{
    let component = currentHierachy.getComponentById(id);
    var handleOperator = hwv.operatorManager.getOperator(Communicator.OperatorId.Handle);
    handleOperator.removeHandles();        
    tempnode = hwv.model.createNode(hwv.model.getRootNode());  
    component.showHandles($("#hasfixedaxis").is(":checked"), tempnode);

}

function updateEditMode()
{
    editMode = $("#iseditmode").is(":checked");
}


function newHierachy()
{
    currentHierachy = KT.KinematicsManager.createHierachy();
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
    html += '<button type="button" style="font-size:11px;" onclick="exportToFile()" class="btn btn-dark btn-sm ms-1">Export</button>';
    html += '<button type="button" style="font-size:11px;position:absolute;right:0px" onclick="setIkUIValues()" class="btn btn-light btn-sm ms-1" data-bs-toggle="modal" data-bs-target="#editIkSettingsModel">IK Settings</button>';
    html += '<br>';
    html += '<h2 style="margin-top:20px;"><span>Animation Group</span></h2>';
    html +=  generateAnimationGroupSelect();
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="startAnimationGroup();">Play</button>';    
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="stopAllAnimations();">Stop</button>';    
    html += '<br><button type="button" style="font-size:11px" onclick="newAnimationGroupDialog()" class="btn btn-secondary btn-sm ms-1" data-bs-toggle="modal" data-bs-target="#newupdateanimationgroup">New</button>';
    // html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="addComponentFromUI(true);">Edit</button>';
    // html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="addComponentFromUI(true);">Delete</button>';
    html += '<h2 style="margin-top:20px;"><span>Component Hierachy</span></h2>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="addComponentFromUI(false);">Add</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="addComponentFromUI(true);">Add to Root</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="insertComponentFromUI();">Insert</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="moveupComponentFromUI();">Move Up</button>';
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="deleteComponentFromUI();">Delete</button>';    
    html += '<button type="button" style="font-size:11px" class="btn btn-secondary btn-sm ms-1"  onclick="hwv.model.resetNodesTransform();currentHierachy.resetComponents()">Reset</button>';    
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
    var x = JSON.stringify(KT.KinematicsManager.getTemplate(currentTemplate));
    document.getElementById("templatejson").value = x;
}

function updateKinematicsManager() {
     currentHierachy.setIkSamplingDistance(parseFloat($("#samplingdistance")[0].value));
     currentHierachy.setIkSamplingDistanceTranslation(parseFloat($("#_ikSamplingDistanceTranslation")[0].value));
     currentHierachy.setIkLearningRate(parseFloat($("#learningrate")[0].value));
     currentHierachy.setIkThreshold(parseFloat($("#ikthreshold")[0].value));
     currentHierachy.setIkSpeed(parseFloat($("#ikspeed")[0].value));
}

async function showComponent(j,adjustToCenter) {
    
    let component = currentHierachy.getComponentById( j);
    var handleOperator = hwv.operatorManager.getOperator(Communicator.OperatorId.Handle);
    handleOperator.removeHandles();

    let center;
    if (adjustToCenter){
        let bounds = await hwv.model.getNodesBounding([hwv.selectionManager.getLast().getNodeId()]);
        center = bounds.center();        
    }

    if (editMode) {
        tempnode = hwv.model.createNode(hwv.model.getRootNode());
        component.showHandles(false, tempnode, center);

    }
    else
        component.showHandles(false, undefined, center);
    


}

function updateReferences(j){
    let component = currentHierachy.getComponentById(j);
    var nodeids = [];
    var selections = KT.KinematicsManager.viewer.selectionManager.getResults();
    for (let i=0;i<selections.length;i++)
        nodeids.push(selections[i].getNodeId());

    component.updateReferenceNodes(nodeids);

}
function removeFromReferences(j){
    let component = currentHierachy.getComponentById(j);
    var nodeids = [];
    var selections = KT.KinematicsManager.viewer.selectionManager.getResults();
    for (let i=0;i<selections.length;i++)
        nodeids.push(selections[i].getNodeId());

    component.removeReferenceNodes(nodeids);

}

function updateComponent(j){
    let component = currentHierachy.getComponentById(j);
    component.setParametersFromHandle();
    let text = $("#componenttype")[0].value;
    component.setType(KT.componentType[text]);

    if ((component.getType() == KT.componentType.prismaticTriangle || component.getType() == KT.componentType.prismaticAggregate || component.getType() == KT.componentType.mate) && $("#fixedcomponentselect")[0] != undefined)
    {
        let id = parseInt($("#fixedcomponentselect")[0].value.split(":")[0]);
        let fixedcomponent = currentHierachy.getComponentById(id);
        component.getBehavior().setExtraComponent1(fixedcomponent);
        id = parseInt($("#variablecomponentselect")[0].value.split(":")[0]);
        let variablecomponent = currentHierachy.getComponentById(id);
        component.getBehavior().setExtraComponent2(variablecomponent);
    }

    
    if (component.getType() == KT.componentType.pivotSystem && $("#fixedcomponentselect")[0] != undefined && $("#variablecomponentselect")[0] != undefined)
    {
        let id = parseInt($("#fixedcomponentselect")[0].value.split(":")[0]);
        let fixedcomponent = currentHierachy.getComponentById(id);        
        component.getBehavior().setExtraComponent1(fixedcomponent);

        id = parseInt($("#variablecomponentselect")[0].value.split(":")[0]);
        let variablecomponent = currentHierachy.getComponentById(id);        
        component.getBehavior().setExtraComponent2(variablecomponent);

        id = parseInt($("#mappedcomponentselect")[0].value.split(":")[0]);               
        component.getBehavior().setMappedComponent(currentHierachy.getComponentById(id));

        component.getBehavior().setHelicalFactor(parseFloat($("#helicalfactor")[0].value));
                        
        if ($("#isRevoluteSlide").is(":checked"))
            component.getBehavior().setIsRevoluteSlide(true);
        else
            component.getBehavior().setIsRevoluteSlide(false);

        if ($("#isPrismatic").is(":checked"))
            component.getBehavior().setIsPrismatic(true);
        else
            component.getBehavior().setIsPrismatic(false);            
    }


    if (component.getType() == KT.componentType.revoluteSlide && $("#fixedcomponentselect")[0] != undefined)
    {
        let id = parseInt($("#fixedcomponentselect")[0].value.split(":")[0]);
        let fixedcomponent = currentHierachy.getComponentById(id);
        component.getBehavior().setExtraComponent1(fixedcomponent);
    }

    if (component.getType() == KT.componentType.pistonController && $("#fixedcomponentselect")[0] != undefined)
    {
        let id = parseInt($("#fixedcomponentselect")[0].value.split(":")[0]);
        let fixedcomponent = currentHierachy.getComponentById(id);
        component.getBehavior().setExtraComponent1(fixedcomponent); 
        component.getBehavior().adjustExtraComponentToPistonController();
    }
    else if (component.getType() == KT.componentType.helical && $("#helicalfactor")[0] != undefined)
    {
        component.getBehavior().setHelicalFactor(parseFloat($("#helicalfactor")[0].value));
    }
    else if (component.getType() == KT.componentType.mapped && $("#helicalfactor")[0] != undefined && $("#mappedcomponenttype")[0] != undefined)
    {
        component.getBehavior().setHelicalFactor(parseFloat($("#helicalfactor")[0].value));

        component.getBehavior().setMappedType(KT.componentType[$("#mappedcomponenttype")[0].value]);

        if (component.getBehavior().getMappedType() == KT.componentType.belt && !component.getBehavior().getBelt())
            component.getBehavior().createBelt();


        let id = parseInt($("#mappedcomponentselect")[0].value.split(":")[0]);               
        component.getBehavior().setMappedTargetComponent(currentHierachy.getComponentById(id));
    }
    else if (component.getType() == KT.componentType.revolute)
    {
        if (!$("#hasfixedaxis").is(":checked"))
        {
            component.getBehavior().setFixedAxis(null);
        }
        else
        {
            let matrix = KinematicsManager.viewer.model.getNodeMatrix(tempnode);
            component.getBehavior().setFixedAxisFromMatrix(matrix);

        }
              
    }
    let minvalue = $("#componentmin")[0].value;
    let maxvalue = $("#componentmax")[0].value;
    if (minvalue != undefined)
    {    
        component.setMinLimit(parseFloat(minvalue));
    }

    if (maxvalue != undefined)
    {    
        component.setMaxLimit(parseFloat(maxvalue));
    }


    if ($("#isreference").is(":checked"))
        component.setIsReference(true);
    else
        component.setIsReference(false);

    if ($("#enforcelimits").is(":checked"))
        component.setEnforceLimits(true);
    else
        component.setEnforceLimits(false);


    var nodeids = [];
    var selections = KT.KinematicsManager.viewer.selectionManager.getResults();
    for (let i=0;i<selections.length;i++)
        nodeids.push(selections[i].getNodeId());

    component.updateReferenceNodes(nodeids);

    let jstreenode =  $('#KinematicsTreeDiv').jstree().get_node(component.getId());
    $('#KinematicsTreeDiv').jstree().set_text(jstreenode, !component.getParent() ? component.getId() + ":root": component.getId() + ":" + string_of_enum(KT.componentType,component.getType()));
    generateComponentPropertiesData(j);
    currentHierachy.resetPivotSystems();
}


function addComponentFromUI(fromRoot)
{
    let selectednode = $('#KinematicsTreeDiv').jstree().get_selected();
    let selid;
    if (selectednode.length==0 || fromRoot)
        selid = 0;
    else
         selid = parseInt(selectednode[0]);

    let newcomponent = currentHierachy.createComponentFromSelection(currentHierachy.getComponentById(selid),true, shiftPressed); 
 
    drawIKDiv();
    let jstreenode =  $('#KinematicsTreeDiv').jstree().get_node(newcomponent.getId());
    $('#KinematicsTreeDiv').jstree().select_node(jstreenode);

}


function insertComponentFromUI()
{
    let selectednode = $('#KinematicsTreeDiv').jstree().get_selected();
    let selid;
    if (selectednode.length==0)
        selid = 0;
    else
         selid = parseInt(selectednode[0]);
    let newcomponent = currentHierachy.createComponentFromSelection(currentHierachy.getComponentById(selid),true); 
    for (var i=0;i<newcomponent.getParent().getChildren().length-1;i++)
    {
        newcomponent.getParent().getChildren()[i].setParent(newcomponent);
        newcomponent.getChildren().push(newcomponent.getParent().getChildByIndex(i));        
    }
    newcomponent.getParent()._children = [];
    newcomponent.getParent().getChildren().push(newcomponent);
    currentHierachy.rebuildComponentTree();

    drawIKDiv();
    let jstreenode =  $('#KinematicsTreeDiv').jstree().get_node(newcomponent.getId());
    $('#KinematicsTreeDiv').jstree().select_node(jstreenode);

}


function deleteComponentFromUI()
{
    let selid = parseInt($('#KinematicsTreeDiv').jstree().get_selected());
    currentHierachy.getComponentById(selid).delete();
    drawIKDiv();

}

function moveupComponentFromUI() {
    if (shiftPressed) {
        makeFirstComponentFromUI();
    }
    else {
        let selid = parseInt($('#KinematicsTreeDiv').jstree().get_selected());
        let component = currentHierachy.getComponentById(currentComponent);
        component.moveup();
        drawIKDiv();
    }

}

function makeFirstComponentFromUI() {
    let selid = parseInt($('#KinematicsTreeDiv').jstree().get_selected());
    let component = currentHierachy.getComponentById(currentComponent);
    let children = component._parent._children;
    for (let i = 0; i < children.length; i++) {
        if (children[i] == component) {
            children.splice(i, 1);
            break;
        }
    }
    children.splice(0, 0, component);
    drawIKDiv();

}
function adjustToPlane() {
    let r = KT.KinematicsManager.viewer.selectionManager.getResults();
    if (r.length == 0) return;

    let plane = new Communicator.Plane();
    for (let i = 0; i < r.length; i++) {
        let nodeid = r[i].getNodeId();
        let component = KT.KinematicsManager.getComponentFromNodeId(nodeid);

        if (i==0)
            plane.setFromPointAndNormal(component.getCenter(), component.getAxis());
        
        let newcenter = ViewerUtility.closestPointOnPlane(plane, component.getCenter());
        let delta = Communicator.Point3.subtract(component.getCenter(), newcenter);
        component.setCenter(newcenter);        
        if (component.getExtraPivot1()) {
            component.setExtraPivot1(ViewerUtility.closestPointOnPlane(plane, component.getExtraPivot1()));

        }
        if (component.getExtraPivot2()) {
            component.setExtraPivot2(ViewerUtility.closestPointOnPlane(plane, component.getExtraPivot2()));

        }
    }
}

function setFromModel() {
    if (hwv.selectionManager.getLast())
        currentHierachy = KT.KinematicsManager.getHierachyFromNodeId(hwv.selectionManager.getLast().getNodeId());

    else
        currentHierachy = KT.KinematicsManager.getHierachyFromNodeId();
    currentTemplate = currentHierachy._templateId;
    drawIKDiv();

}

function applyToModel() {
    let _templateId = currentTemplate;
    if (!hwv.selectionManager.getLast())
        currentHierachy = KT.KinematicsManager.applyToModel(_templateId);
    else {

        if (shiftPressed) {
            let nodeid = hwv.selectionManager.getLast().getNodeId();
            let children = hwv.model.getNodeChildren(nodeid);
            for (let i = 0; i < children.length; i++) {             
                currentHierachy = KT.KinematicsManager.applyToModel(_templateId, children[i]);
            }

        }
        else {
            var selections = KT.KinematicsManager.viewer.selectionManager.getResults();
            for (let i = 0; i < selections.length; i++) {
                let nodeid = selections[i].getNodeId();
                currentHierachy = KT.KinematicsManager.applyToModel(_templateId, nodeid);
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

    let component = currentHierachy.getComponentById( j);

    let pos = KT.KinematicsManager.getHandleOperator().getPosition();
    let axis = KT.KinematicsManager.getHandleOperator().getAxis();

    if (type === 0) {
        if (pos) {
            component.setPrismaticPlanePlane(new Communicator.Plane());
            component.getPrismaticPlanePlane().setFromPointAndNormal(pos,axis);

        }
    }
    if (type === 1) {
        if (pos) {
            component.setPrismaticPlaneTip(pos.copy());
        }
    }
}



function updateMatePivot(type, j) {

    let component = currentHierachy.getComponentById( j);

    var handleOperator = hwv.operatorManager.getOperator(Communicator.OperatorId.Handle);
    let pos = handleOperator.getPosition();
    if (pos) {
        if (type === 0) {
            component.getBehavior().setExtraPivot1(pos.copy());
        }
        else
        {
            component.getBehavior().setExtraPivot2(pos.copy());
        }
    }
}

function updateConnectorPivot(j) {

    let component = currentHierachy.getComponentById(j);
    let pos = KT.KinematicsManager.getHandleOperator().getPosition();

    if (pos) {
        component.getBehavior().setExtraPivot1(pos.copy());
    }
}

function animateComponent(j){
    let animationtemplate = KT.KinematicsManager.getAnimationTemplate($("#animationtemplateselect").val());
    let component = currentHierachy.getComponentById(j);

    KT.KinematicsManager.startAnimation(component,animationtemplate);
}

function changeAnimationSpeed(j){
    let component = currentHierachy.getComponentById(j);   

    KT.KinematicsManager.changeAnimationSpeed(component,-500 + Math.floor(Math.random() * 1000));
}

function stopAnimation(j){
    let component = currentHierachy.getComponentById(j);   

    KT.KinematicsManager.stopAnimation(component);
}


function addNewAnimationTemplate() {
    if ($("#newupdateanimationbutton").html() == "Update") {
        let animationtemplate = KT.KinematicsManager.getAnimationTemplate($("#animationtemplateselect").val());
        let anime = {};
        anime.value = $("#animationtarget")[0].value;
        anime.duration = $("#animationduration")[0].value;
        anime.easing = $("#animationeasing")[0].value;
        anime.loop = $("#animationloop")[0].value;
        anime.direction = $("#animationdirection")[0].value;
        anime.easeintime = $("#animationeaseintime")[0].value;
        anime.infinite = $("#animationinfinite")[0].checked;
        KT.KinematicsManager.updateAnimationTemplate($("#animationtemplateselect").val(), $("#animationname")[0].value, anime);
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
        let animationid = KT.KinematicsManager.addAnimationTemplate($("#animationname")[0].value, animedef);
        let component = currentHierachy.getComponentById( currentComponent);
        component.addAnimation(animationid);
        generateComponentPropertiesData(currentComponent);
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
            let animationname = KT.KinematicsManager.getAnimationTemplate(animationReference.animation).name;
            prop = {id:i, animation: "Component: " + animationReference.component + ":" +  animationname};            
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

    for (let i in hierachy.getComponentHash())
    {
        let component = hierachy.getComponentById(i);
        for (let j=0;j<component.getAnimations().length;j++)
        {
            animations.push({text: animations.length + ":Component " + component.getId() + ":" + KT.KinematicsManager.getAnimationTemplate(component.getAnimationByIndex(j)).name, animation: component.getAnimationByIndex(j), component:component.getId()});
            
        }
    }

    return animations;
    
}

function newAnimationGroup()
{
   currentAnimationGroup.setName($("#animationgroupname").val());

   let id = KT.KinematicsManager.addAnimationGroup(currentAnimationGroup);
   currentAnimationGroupId = id;
   drawIKDiv();
}



function switchAnimationGroup()
{
    currentAnimationGroupId = $("#animationgroupselect").val();

}

function stopAllAnimations()
{
    KT.KinematicsManager.stopAnimation();
}

function startAnimationGroup()
{
    KT.KinematicsManager.startAnimationGroup(currentAnimationGroupId);
}

function newAnimationGroupDialog() {
    currentAnimationGroup = new KT.KinematicsAnimationGroup(currentHierachy);
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
        currentAnimationGroup.getAnimations()[data.id].component = currentAnimationList[i].component;

    });
}

function updateanimationdialog() {
    $("#newupdateanimationbutton").html("Update");

    let animationtemplate = KT.KinematicsManager.getAnimationTemplate($("#animationtemplateselect").val());
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
    let component = currentHierachy.getComponentById(currentComponent);
    component.addAnimation($("#assignanimtationselect").val());
    generateComponentPropertiesData(currentComponent);
}   

function removeAnimationFromComponent()
{
    let component = currentHierachy.getComponentById(currentComponent);
    component.removeAnimation($("#animationtemplateselect").val());
    generateComponentPropertiesData(currentComponent);

}



function deleteAnimationDefinition()
{
    KT.KinematicsManager.deleteAnimationTemplate($("#animationtemplateselect").val());
    generateComponentPropertiesData(currentComponent);
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
   
function exportToFile(filename) {

    function _makeTextFile(text) {
        let data = new Blob([text], {type: 'text/plain'});           
        let textFile = window.URL.createObjectURL(data);
    
        return textFile;
      }
    let text =  JSON.stringify(KT.KinematicsManager.getTemplate(currentTemplate));

    let link = document.createElement('a');
    link.setAttribute('download', "hierachy.json");
    link.href = _makeTextFile(text);
    document.body.appendChild(link);

    window.requestAnimationFrame(function () {
        let event = new MouseEvent('click');
        link.dispatchEvent(event);
        document.body.removeChild(link);
    });
}              



function setStandinNodes(j) {

    let component = currentHierachy.getComponentById(j);
    let nodeids = [];
    let selections = KT.KinematicsManager.viewer.selectionManager.getResults();
    for (let i = 0; i < selections.length; i++)
        nodeids.push(selections[i].getNodeId());
    component.getBehavior().getBelt().setStandinNodes(nodeids);
}