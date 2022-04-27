class MaterialTool {

    constructor(viewer) {
        this._viewer = viewer;

        this._items = [];
        this._itemrowhash = [];

        this._baskets = [];
        this._baskets.push({items:this._items, viewSettings:null});
        this._activeBasket = 0;

        this._table = null;
        this._uidiv = null;
        this._offset = 0;


        this._idcounter = 0;
        this._suppressSelectionUpdate = false;
        this._disallowBodyNodes = true;        
    }
  
    async initializeUI(div, includeMenu) {
        let _this = this;
        this._uidiv = div;
        this._hasMenu = includeMenu;

        this._viewer.setCallbacks({
            selectionArray: function (selarray, removed) {
                _this._updateSelection();
            },
        });

        this._viewer.selectionManager.setSelectionFilter(function (nodeid) {
                return _this._filterSelection(nodeid);
            }
        );

        if (includeMenu) {
            $("#" + this._uidiv).append('<button id="materialToolAdd" type="button" style="left:0px;top:2px">+</button>');
            $("#" + this._uidiv).append('<button id="materialToolRemove" type="button" style="left:0px;top:2px">-</button>');
            $("#" + this._uidiv).append('<button id="materialToolRefresh" type="button" style="left:0px;top:2px;padding:2px">Refresh</button>');
            $("#" + this._uidiv).append('<button id="materialToolExport" type="button" style="left:0px;top:2px;padding:2px">Export</button>');
            $("#" + this._uidiv).append('<button id="materialToolStoreViewSettings" type="button" style="left:0px;top:2px;padding:2px">Add Settings</button>');
            $("#" + this._uidiv).append('<button id="materialToolAddBasket" type="button" style="right:105px;position:absolute">+</button>');
            $("#" + this._uidiv).append('<button id="materialToolDeleteBasket" type="button" style="right:82px;position:absolute">-</button>');
            $("#" + this._uidiv).append('<select id="materialToolSelector" style="right:0px;width:80px;position:absolute" value=""></select>');
            $("#materialToolAdd").click(function () { _this.addNodesFromSelection(); });
            $("#materialToolRefresh").click(function () { _this.refresh();});
            $("#materialToolRemove").click(function () { _this.removeSelectedNodes(); });
            $("#materialToolExport").click(function () { _this.exportToFile("materialdef.json"); });
            $("#materialToolStoreViewSettings").click(function (event) {  event.shiftKey ? _this.unsetViewSettings() : _this.storeViewSettings() });
            $("#materialToolAddBasket").click(function () { _this.addBasket(); });
            $("#materialToolDeleteBasket").click(function () { _this.deleteCurrentBasket(); });

            $("#materialToolSelector").change(function () {

                _this.switchBasket(parseInt($("#materialToolSelector").val()));
    
            });

        }
        $("#" + this._uidiv).append('<div id="' + this._uidiv + 'Tabulator" style="overflow: hidden; zoom:0.7;width:100%; height:100%;"></div>');

        await this._refreshUI();
    }
   
    setDisallowBodyNodes(disallow){
        this._disallowBodyNodes = disallow;
    }


    getDisallowBodyNodes(){
        return this._disallowBodyNodes;
    }

    toJson() {
        let jsonbaskets = [];

        for (let i=0;i<this._baskets.length;i++)
        {
            let items = this._baskets[i].items;
            let jsonitems = [];
            for (let j in items)
            {
                let jsonnodeids = [];
                for (let k=0;k<items[j].nodes.length;k++)
                {
                    let def = {name:items[j].nodes[k].name,nodeid:items[j].nodes[k].nodeid, material:items[j].nodes[k].material.toJson()};                    
                    jsonnodeids.push(def);                        
                }
                let def = {name:items[j].name,nodes:jsonnodeids, material:items[j].material.toJson()};
                jsonitems.push(def);
            }
            jsonbaskets.push({items:jsonitems, viewSettings:this._baskets[i].viewSettings});
        }        
        return jsonbaskets;
    }

    fromJson(jsonbaskets) {
        this._baskets = [];

        for (let i=0;i<jsonbaskets.length;i++)
        {
            let jsonitems;
            if (jsonbaskets[i].items == undefined)
            {
                jsonitems = jsonbaskets[i];
            }
            else
            {
                jsonitems = jsonbaskets[i].items;                
            }

            let items = [];
            for (let j=0;j<jsonitems.length;j++)
            {
                items[this._idcounter] = jsonitems[j];
                let topitem =  items[this._idcounter];
                this._idcounter++;
                let material = new CustomMaterial();
                material.fromJson(jsonitems[j].material);
                topitem.material = material;
                if (topitem.name == undefined)
                    topitem.name = null;

                for (let k=0;k<topitem.nodes.length;k++)
                {
                    let material = new CustomMaterial();
                    material.fromJson(topitem.nodes[k].material);
                    topitem.nodes[k].material = material;
                    if (topitem.nodes[k].name == undefined)
                        topitem.nodes[k].name = null;
                }

            }
            this._baskets.push({items:items, viewSettings:jsonbaskets[i].viewSettings});
        }         
        this._activeBasket = 0;
        this._items = this._baskets[0].items;
    }

    async refresh()
    {
        this._refreshUI();
        await this._refreshAllMaterials(false);
        this._refreshViewSettings();
    }

    async addBasket() {
        await this._refreshAllMaterials(true);
        this._items = [];
        this._baskets.push({items: this._items, viewSettings:null});
        this._activeBasket = this._baskets.length - 1;
        this._refreshUI();
        return this._activeBasket;
    }

    deleteCurrentBasket() {
        this._baskets.splice(this._activeBasket, 1);
        if (this._activeBasket > this._baskets.length - 1)
            this._activeBasket = this._baskets.length - 1;
        if (this._baskets.length == 0) {
            this.addBasket();
        }
        else {
            this.switchBasket(this._activeBasket);
        }
        return this._activeBasket;
    }

    async switchBasket(basketid) {
        await this._refreshAllMaterials(true);

        this._items = this._baskets[basketid].items;
        this._activeBasket = basketid;
        await this._refreshUI();
        this._updateSelection();
        await this._refreshAllMaterials(false);
        this._refreshViewSettings();

    }

    getBasketCount() {
        return this._baskets.length;
    }

    storeViewSettings() {
        this._baskets[this._activeBasket].viewSettings = {};

        this._baskets[this._activeBasket].viewSettings.ambientOcclusionEnabled = this._viewer.view.getAmbientOcclusionEnabled();
        this._baskets[this._activeBasket].viewSettings.ambientOcclusionRadius = this._viewer.view.getAmbientOcclusionRadius();

        this._baskets[this._activeBasket].viewSettings.bloomEnabled = this._viewer.view.getBloomEnabled();
        this._baskets[this._activeBasket].viewSettings.bloomThreshold = this._viewer.view.getBloomThreshold();

        this._baskets[this._activeBasket].viewSettings.silhouetteEnabled = this._viewer.view.getSilhouetteEnabled();

        this._baskets[this._activeBasket].viewSettings.simpleReflectionEnabled = this._viewer.view.getSimpleReflectionEnabled();

        this._baskets[this._activeBasket].viewSettings.simpleShadowEnabled = this._viewer.view.getSimpleShadowEnabled();

        let backgroundcolors = this._viewer.view.getBackgroundColor();
        this._baskets[this._activeBasket].viewSettings.backgroundColor = {top: backgroundcolors.top.toJson(), bottom: backgroundcolors.bottom.toJson()};

    }

    setOffset(offset)
    {
        this._offset = offset;
    }

    _refreshViewSettings()
    {
        if (this._baskets[this._activeBasket].viewSettings)
        {
            if (this._baskets[this._activeBasket].viewSettings.ambientOcclusionEnabled != undefined) this._viewer.view.setAmbientOcclusionEnabled(this._baskets[this._activeBasket].viewSettings.ambientOcclusionEnabled);
            if (this._baskets[this._activeBasket].viewSettings.ambientOcclusionRadius != undefined) this._viewer.view.setAmbientOcclusionRadius(this._baskets[this._activeBasket].viewSettings.ambientOcclusionRadius);

            if (this._baskets[this._activeBasket].viewSettings.bloomEnabled != undefined) this._viewer.view.setBloomEnabled(this._baskets[this._activeBasket].viewSettings.bloomEnabled);
            if (this._baskets[this._activeBasket].viewSettings.bloomThreshold != undefined) this._viewer.view.setBloomThreshold(this._baskets[this._activeBasket].viewSettings.bloomThreshold);

            if (this._baskets[this._activeBasket].viewSettings.silhouetteEnabled != undefined) this._viewer.view.setSilhouetteEnabled(this._baskets[this._activeBasket].viewSettings.silhouetteEnabled);

            if (this._baskets[this._activeBasket].viewSettings.simpleReflectionEnabled != undefined) this._viewer.view.setSimpleReflectionEnabled(this._baskets[this._activeBasket].viewSettings.simpleReflectionEnabled);

            if (this._baskets[this._activeBasket].viewSettings.simpleShadowEnabled != undefined) this._viewer.view.setSimpleShadowEnabled(this._baskets[this._activeBasket].viewSettings.simpleShadowEnabled);

            if (this._baskets[this._activeBasket].viewSettings.backgroundColor != undefined) 
            {
                this._viewer.view.setBackgroundColor(Communicator.Color.fromJson(this._baskets[this._activeBasket].viewSettings.backgroundColor.top), Communicator.Color.fromJson(this._baskets[this._activeBasket].viewSettings.backgroundColor.bottom));
            }
        }

    }

    unsetViewSettings() {
        this._baskets[this._activeBasket].viewSettings = null;
    }

    async addNodesFromSelection() {
        let r = this._viewer.selectionManager.getResults();
        if (r.length == 0) return;
        let nodeids = [];

        for (let i = 0; i < r.length; i++) {
            let nodeid = r[i].getNodeId();
            nodeids.push(nodeid);
        }

        await this.addNodes(nodeids);
        this._updateSelection();
    }

    async addNodes(nodeids) {
        await this._refreshAllMaterials(true);
        let deleted = false;
        let deleteNodeids = [];
        for (let i = 0; i < nodeids.length; i++) {
            let deleted = false;
            for (let j in this._items) {
                for (let k = 0; k < this._items[j].nodes.length; k++){
                    if (this._items[j].nodes[k].nodeid == nodeids[i]) {
                        deleteNodeids.push(nodeids[i]);
                        deleted = true;
                        break;
                    }
                }
                if (deleted) break;
            }
        }

        await this.removeNodes(deleteNodeids);

        this._items[this._idcounter] = {nodes:[], material: new CustomMaterial()};
        for (let i = 0; i < nodeids.length; i++) 
            this._items[this._idcounter].nodes.push({name:null,nodeid:nodeids[i],parent:  this._items[this._idcounter], material: new CustomMaterial()});

        let itemid = this._idcounter;
        this._idcounter++;

        if (this._uidiv) {
            await this._addTableRow(this._items[this._idcounter-1], itemid);
        }
        await this._refreshAllMaterials(false);
    }

    async removeSelectedNodes() {
        await this._refreshAllMaterials(true);

        let r = this._viewer.selectionManager.getResults();
        if (r.length == 0) return;
        let nodeids = [];
        for (let i = 0; i < r.length; i++)
        {
            let nodeid = r[i].getNodeId();
            nodeids.push(nodeid);
        }
        this.removeNodes(nodeids);
        await this._refreshAllMaterials(false);
    }

    async removeNodes(nodeids) {

        for (let i = 0; i < nodeids.length; i++) {
            let deleted = false;
            for (let j in this._items) {
                for (let k = 0; k < this._items[j].nodes.length; k++) {
                    if (this._items[j].nodes[k].nodeid == nodeids[i]) {
                        if (this._items[j].nodes.length == 1) {
                            delete this._items[j];
                            break;
                        }
                        else {
                            this._items[j].nodes.splice(k, 1);
                            deleted = true;
                            break;
                        }
                    }
                }
                if (deleted)
                    break;
            }
        }

        if (!this._uidiv)
            return;

        if (nodeids.length > 50)            
        {
            this._refreshUI();
            return;            
        }

        let rows = this._table.getRows();
        for (let i = 0; i < nodeids.length; i++) {
            for (let j = 0; j < rows.length; j++) {
                let data = rows[j].getData();
                if (data._children == undefined) {
                    if (data.nodeids == nodeids[i])
                        await rows[j].delete();
                }
                else {
                    let children = rows[j].getTreeChildren();

                    let deleted = 0;
                    for (let k = 0; k < children.length; k++) {
                        let data = children[k].getData();
                        if (data.nodeids == nodeids[i]) {
                            await children[k].delete();
                            deleted = true;
                        }
                    }
                    if (deleted) {
                        children = rows[j].getTreeChildren();
                        if (children.length == 1) {
                            let data = children[0].getData();
                            await children[0].delete();
                            await rows[j].update({ nodeids: data.nodeids, name: data.name });
                        }
                        else {
                            let nodeidstext = "";
                            let nametext = "";
                            for (let k = 0; k < children.length; k++) {                               
                                let data = children[k].getData();
                                nodeidstext += data.nodeids;
                                if (nametext.length<200)
                                    nametext += data.name;
                                if (k < children.length - 1) {
                                    nodeidstext += ",";
                                    if (nametext.length<200)
                                        nametext += ",";
                                }
                            }
                            let data = rows[j].getData();
                            await rows[j].update({ name: nametext, nodeids: nodeidstext, _children: data._children });
                        }
                        break;
                    }
                }
            }
        }
    }

   
    
    exportToFile(filename) {

        function _makeTextFile(text) {
            let data = new Blob([text], {type: 'text/plain'});           
            let textFile = window.URL.createObjectURL(data);
        
            return textFile;
          }

        let text = JSON.stringify(this.toJson());

        let link = document.createElement('a');
        link.setAttribute('download', filename);
        link.href = _makeTextFile(text);
        document.body.appendChild(link);

        window.requestAnimationFrame(function () {
            let event = new MouseEvent('click');
            link.dispatchEvent(event);
            document.body.removeChild(link);
        });
    }              

    async _initTabulator() {
        let _this = this;
        return new Promise((resolve, reject) => {

            this._table = new Tabulator("#" + this._uidiv + "Tabulator", {
                data: [],
                dataTree: true,
                dataTreeStartExpanded: false,
                movableRows: true,
                selectable: true,
                layout: "fitColumns",
                columns: [
                    {
                        rowHandle:true,title: "Name", field: "name", editor: "input"
                    },
                    {
                        rowHandle:true,title: "Nodeids", field: "nodeids"
                    },
                    {
                        title: "Material", width: 250, field: "material", formatter: function (cell, formatterParams, onRendered) {
                            onRendered(function () {
                                _this._renderMaterialCell(cell);
                            });
                        },
                    },
                    {
                        title: "ID", field: "id", visible: false
                    },

                ],
            });


            this._table.on("rowMoved", async function (row) {
                await _this._refreshAllMaterials(true);

                let data = row.getData();
                let pos = row.getPosition();
                let item = _this._itemrowhash[data.id];
                let pcount = 0;
                delete _this._items[data.id];
                pcount = 0;
                let lastitem = item;
                let lasti;
                for (let i in _this._items) {
                    if (pcount >= pos) {
                        if (pcount == pos)
                            _this._itemrowhash[i] = item;
                        let tempitem = _this._items[i];
                        _this._items[i] = lastitem;
                        lastitem = tempitem;
                        lasti = parseInt(i);
                    }
                    pcount++;
                }
                _this._items[(lasti + 1)] = lastitem;
                _this._itemrowhash[(lasti + 1)] = lastitem;
                _this.switchBasket(_this._activeBasket);
            });



            this._table.on("cellEdited", function (e) {
                let data = e.getRow().getData();
                let item = _this._itemrowhash[data.id];
                item.name = (' ' + data.name).slice(1);
            });


            this._table.on("tableBuilt", function (e, row) {
                resolve();
            });


            this._table.on("rowClick", function (e, row) {
                _this._handleTableSelection(row.getData());
            });

            this._table.on("dataTreeRowExpanded", function (e, row) {
                _this._updateSelection();
                _this._table.redraw();
            });

            this._table.on("dataTreeRowCollapsed", function (e, row) {
                _this._updateSelection();
            });
        });

    }

    _getNodeIdsFromItem(item) {
        let nodeids = [];
        if (item.nodes != undefined) {
            for (let i = 0; i < item.nodes.length; i++)
                nodeids.push(item.nodes[i].nodeid);
        }
        else
            nodeids.push(item.nodeid);

        return nodeids;
    }
 
    async _updateColor(event) {
        let id = event.currentTarget.id.split("-")[1];

        let col = this._hexToRGB($("#" + event.currentTarget.id).val());        
        let item = this._itemrowhash[id];

        item.material.setColor(new Communicator.Color(col.r, col.g, col.b));
        await this._refreshAllMaterials(false);
        this._updateCellStyle(id);
    }

    async _updateTransparency(event) {
        let id = event.currentTarget.id.split("-")[1];
        let opacity = $("#" + event.currentTarget.id).val();
        
        let item = this._itemrowhash[id];

        item.material.setOpacity(parseFloat(opacity));
        await this._refreshAllMaterials(false);
        this._updateCellStyle(id);
    }

    async _updateMetallic(event) {
        let id = event.currentTarget.id.split("-")[1];
        let metallic = $("#" + event.currentTarget.id).val();
        
        let item = this._itemrowhash[id];

        item.material.setMetallic(parseFloat(metallic));
        await this._refreshAllMaterials(false);
        this._updateCellStyle(id);
    }

    async _updateRoughness(event) {
        let id = event.currentTarget.id.split("-")[1];
        let roughness = $("#" + event.currentTarget.id).val();
        
        let item = this._itemrowhash[id];

        item.material.setRoughness(parseFloat(roughness));
        await this._refreshAllMaterials(false);
        this._updateCellStyle(id);
    }

    async _unsetMaterial(event) {
        event.stopPropagation();
        let id = event.currentTarget.id.split("-")[1];
        
        let item = this._itemrowhash[id];

        this._viewer.model.reset();
        await this._refreshAllMaterials(true);
        item.material = new CustomMaterial();
        await this._refreshAllMaterials(false);
        this._updateCellStyle(id);
    }

    _updateCellStyle(id)
    {
        let mat = this._itemrowhash[id].material;
        if (mat.color)
        {
            $("#colorpick-" + id).css("opacity","1");
            $("#colorpick-" + id).val(this._rgbToHex(mat.color));
        }
        else
            $("#colorpick-" + id).css("opacity","0.2");

        if (mat.opacity != -1) {
            $("#transparencypick-" + id).css("opacity", "1");
            $("#transparencypick-" + id).val(mat.opacity);
        }
        else
            $("#transparencypick-" + id).css("opacity", "0.2");

        if (mat.metallic != -1) {
            $("#metallicpick-" + id).css("opacity", "1");
            $("#metallicpick-" + id).val(mat.metallic);
        }
        else
            $("#metallicpick-" + id).css("opacity", "0.2");
      
        if (mat.roughness != -1) {
            $("#roughnesspick-" + id).css("opacity", "1");
            $("#roughnesspick-" + id).val(mat.roughness);
        }
        else
            $("#roughnesspick-" + id).css("opacity", "0.2");                        
    }

    _renderMaterialCell(cell) {
        let _this = this;
        let pickid = "colorpick-" + cell.getData().id;
        let content = "";
        content += '<div style="height:20px">';
        content += '<input style="opacity:0.2;height:25px;width:25px;padding:0;border:none" id="' + pickid + '" type="color" onclick="event.stopPropagation()" id="favcolor" name="favcolor" value="#ff0000">';
        content += '<span style="position:relative;top:-3px">O</span><input onclick="event.stopPropagation()" id="transparencypick-' + cell.getData().id + '" style="opacity:0.2;width:50px" type="range" min="0" max="1" step="0.1"></input>';
        content += '<span style="position:relative;top:-3px">M</span><input onclick="event.stopPropagation()" id="metallicpick-' + cell.getData().id + '" style="opacity:0.2;width:50px" type="range" min="0" max="1" step="0.1"></input>';
        content += '<span style="position:relative;top:-3px">R</span><input onclick="event.stopPropagation()" id="roughnesspick-' + cell.getData().id + '" style="opacity:0.2;width:50px" type="range" min="0" max="1" step="0.1"></input>';
        content += '<button id="unsetpick-' + cell.getData().id + '" type="button" style="width:20px;left:0px;top:-5px;position:relative;padding-left:0px;padding-right:0px">x</button>';
        content += '</div>';
        $(cell.getElement()).append(content);
        $("#" + pickid).on("input", async function (event) { _this._updateColor(event); });
        $("#transparencypick-" + cell.getData().id).on("input", async function (event) { _this._updateTransparency(event); });
        $("#metallicpick-" + cell.getData().id).on("input", async function (event) { _this._updateMetallic(event); });
        $("#roughnesspick-" + cell.getData().id).on("input", async function (event) { _this._updateRoughness(event); });
        $("#unsetpick-" + cell.getData().id).on("click", async function (event) { _this._unsetMaterial(event); });
        this._updateCellStyle(cell.getData().id);        
    }

    async _refreshAllMaterials(unset) {
        for (let i in this._items) {
            {
                if (!unset)
                    await this._items[i].material.apply(this._viewer, this._getNodeIdsFromItem(this._items[i]), this._offset);
                else
                    await this._items[i].material.unset(this._viewer, this._getNodeIdsFromItem(this._items[i]), this._offset);    
                for (let k = 0; k < this._items[i].nodes.length; k++) {
                    if (!unset)
                        await this._items[i].nodes[k].material.apply(this._viewer,this._getNodeIdsFromItem(this._items[i].nodes[k]), this._offset);
                    else
                        await this._items[i].nodes[k].material.unset(this._viewer,this._getNodeIdsFromItem(this._items[i].nodes[k]), this._offset);

                }
            }
        }
    }

    async _refreshUI() {
        if (!this._uidiv) return;

        let _this = this;

        if (!this._table) {
            await this._initTabulator();
        }
        else
            await this._table.clearData();

        for (let i in this._items) {
            await this._addTableRow(this._items[i], i);
        }

        if (this._hasMenu)
            this._updateBasketSelector();
    }

    async _addTableRow(topitem, itemid) {
        let nodes = topitem.nodes;
        this._itemrowhash[itemid] = topitem;
        if (nodes.length == 1) {
            let prop = this._generateOneTableItem(nodes[0]);
            prop.id = itemid;
            if (topitem.name)
                prop.name = topitem.name;
            this._table.addRow(prop);
        }
        else {
            let prop = { name: "", nodeids: "", id: itemid };
            let props = [];
            for (let i = 0; i < nodes.length; i++) {
                let newprop = this._generateOneTableItem(nodes[i]);
                props.push(newprop);
                this._itemrowhash[newprop.id] = nodes[i];
                if (prop.name.length<200)
                    prop.name += newprop.name;
                prop.nodeids += newprop.nodeids;
                if (i < nodes.length - 1) {
                    if (prop.name.length<200)
                        prop.name += ",";
                    prop.nodeids += ",";
                }               
            }
            if (topitem.name)
                prop.name = topitem.name;
            prop._children = props;
            await this._table.addRow(prop);
        }
    }

    _generateOneTableItem(item) {
        let name = this._viewer.model.getNodeName(item.nodeid);
        let prop = {};
        prop.nodeids = "" + item.nodeid;
        if (item.name)
            prop.name = item.name;
        else
            prop.name = name;
        prop.id = this._idcounter++;
        return prop;
    }

    _handleTableSelection(data) {

        this._suppressSelectionUpdate = true;
        let seldata = this._table.getSelectedData();

        this._viewer.selectionManager.clear();
        let selitems = [];
        for (let i = 0; i < seldata.length; i++) {
            let row = this._table.getRow(seldata[i].id);
            if (row && row._row.modules.dataTree.open)
            {
                let children = row.getTreeChildren();
                for (let j=0;j<children.length;j++)
                    children[j].select();
                row.deselect();
            }
            let nodeids = seldata[i].nodeids.split(",");
            for (let j = 0; j < nodeids.length; j++)
                selitems.push(Communicator.Selection.SelectionItem.create(parseInt(nodeids[j])));
        }
        this._viewer.selectionManager.add(selitems);
        this._suppressSelectionUpdate = false;
    }

    _updateBasketSelector() {
        let _this = this;
        $("#materialToolSelector").empty();
        let html = "";

        for (let i = 0; i < this._baskets.length; i++) {
            let choice = ("Basket " + i);
            if (i == this._activeBasket)
                html += '<option selected value="' + i + '">' + choice + '</option>\n';
            else
                html += '<option value="' + i + '">' + choice + '</option>\n';
        }
        $("#materialToolSelector").append(html);
    }

    _updateSelection() {
        if (this._suppressSelectionUpdate)
            return;

        let rows = this._table.getRows();

        for (let j = 0; j < rows.length; j++) {

            let row = rows[j];
            let data = row.getData();
            if (!data._children) {
                let selitem = Communicator.Selection.SelectionItem.create(parseInt(data.nodeids));
                if (!this._viewer.selectionManager.isSelected(selitem))
                    this._table.deselectRow(data.id);
                else
                    this._table.selectRow(data.id);

            }
            else {
                let children = row.getTreeChildren();

                let allselected = true;
                let oneSelected = false;
                for (let k = 0; k < children.length; k++) {
                    let childrow = children[k];
                    let data = childrow.getData();
                    let selitem = Communicator.Selection.SelectionItem.create(parseInt(data.nodeids));
                    if (!this._viewer.selectionManager.isSelected(selitem))
                    {
                        childrow.deselect();
                        allselected = false;
                    }
                    else
                    {
                        oneSelected = true;
                        if (row._row.modules.dataTree.open)
                            childrow.select();
                        else
                            childrow.deselect();  
                    }
                }
                if (allselected && !row._row.modules.dataTree.open)
                    this._table.selectRow(data.id);
                else
                    this._table.deselectRow(data.id);
                if (!row._row.modules.dataTree.open && oneSelected && !allselected)          
                {
                    $(row.getElement()).css("background","lightblue");
                }
                else          
                    $(row.getElement()).css("background","");

            }
        }
    }

    _filterSelection(nodeid) {

        if (this._disallowBodyNodes && this._viewer.model.getNodeType(nodeid) === Communicator.NodeType.BodyInstance) {
            return this._viewer.model.getNodeParent(nodeid);
        }
        return nodeid;
    }

    _hexToRGB(hex) {

        let red = parseInt(hex[1] + hex[2], 16);
        let green = parseInt(hex[3] + hex[4], 16);
        let blue = parseInt(hex[5] + hex[6], 16);
        return {r:red,g:green,b:blue};
    }
   
    _rgbToHex(color) {
        function _componentToHex(c) {
            let hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
          }

            return "#" + _componentToHex(color.r) +  _componentToHex(color.g) +  _componentToHex(color.b);          
    }
}

class CustomMaterial {

    constructor() {
        this.color = null;
        this.opacity = -1;
        this.metallic = -1;
        this.roughness = -1;
    }

    setColor(color) {
        this.color = color;
    }
    setOpacity(opacity) {
            this.opacity = opacity;
    }
    setMetallic(metallic) {
        this.metallic = metallic;
        if (this.roughness == -1)
            this.roughness = 0;

    }
    setRoughness(roughness) {
        this.roughness = roughness;
        if (this.metallic == -1)
            this.metallic = 0;
    }

    toJson()
    {
        let def = {opacity: this.opacity, metallic: this.metallic, roughness: this.roughness};
        if (this.color)
        {
            def.color = this.color.toJson();
        }
        return def;
    }
    
    fromJson(def)
    {
        this.opacity = def.opacity;
        this.metallic = def.metallic;
        this.roughness = def.roughness;

        if (def.color)
        {
            this.color = Communicator.Color.fromJson(def.color);
        }        
    }

    async apply(viewer, nodeids,offset)
    {
        let newnodeids = [];
        for (let i=0;i<nodeids.length;i++)
        {
            newnodeids.push(nodeids[i]+offset);
        }
        if (this.color)
        {
            await viewer.model.setNodesFaceColor(newnodeids,this.color);
        }
        if (this.opacity!=-1)
        {
            if(this.opacity == 0)
            {
                await viewer.model.setNodesVisibility(newnodeids,false);
            }
            else
            {
                if (viewer.model.getBranchVisibility(newnodeids[0]) == false)
                    await viewer.model.setNodesVisibility(newnodeids,true);
                await viewer.model.setNodesOpacity(newnodeids,this.opacity);
            }           
        }

        if (this.metallic!=-1)
        {
            await viewer.model.setMetallicRoughness(newnodeids,this.metallic, this.roughness);
        }
    }

    async unset(viewer, nodeids,offset)
    {
        let newnodeids = [];
        for (let i=0;i<nodeids.length;i++)
        {
            newnodeids.push(nodeids[i]+offset);
        }

        if (this.color)
        {
            await viewer.model.unsetNodesFaceColor(newnodeids,this.color);
        }
        if (this.opacity!=-1)
        {
            await viewer.model.setNodesOpacity(newnodeids,1.0);
            await viewer.model.setNodesVisibility(newnodeids,true);
        }
        if (this.metallic!=-1)
        {
            await viewer.model.unsetMetallicRoughness(newnodeids);
        }
    }
}