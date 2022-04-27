class SelectionBasket {

    constructor(viewer) {
        this._viewer = viewer;

        this._items = [];

        this._baskets = [];
        this._baskets.push(this._items);
        this._activeBasket = 0;

        this._table = null;
        this._uidiv = null;

        this._restrictNode = undefined;

        this._idcounter = 0;
        this._suppressSelectionUpdate = false;
        this._disallowBodyNodes = true;
        let _this = this;
        this._viewer.setCallbacks({
            selectionArray: function (selarray, removed) {
                _this._updateSelection();
            },
        });

        this._viewer.selectionManager.setSelectionFilter(function (nodeid) {
                return _this._filterSelection(nodeid);
            }
        );

    }
  
    initializeUI(div, includeMenu) {
        let _this = this;
        this._uidiv = div;
        this._hasMenu = includeMenu;
        if (includeMenu) {
            $("#" + this._uidiv).append('<button id="selectionBasketAdd" type="button" class = "btn btn-secondary btn-sm ms-1" style="font-size:11px;left:0px;top:2px">Add</button>');
            $("#" + this._uidiv).append('<button id="selectionBasketRemove" type="button" class = "btn btn-secondary btn-sm ms-1" style="font-size:11px;left:0px;top:2px">Remove</button>');
            $("#" + this._uidiv).append('<button id="selectionBasketSelectAll" type="button" class = "btn btn-secondary btn-sm ms-1" style="font-size:11px;left:0px;top:2px">Select All</button>');
            $("#" + this._uidiv).append('<button id="selectionBasketAddBasket" type="button" class = "btn btn-secondary btn-sm ms-1" style="font-size:11px;right:135px;position:absolute">+</button>');
            $("#" + this._uidiv).append('<button id="selectionBasketDeleteBasket" type="button" class = "btn btn-secondary btn-sm ms-1" style="font-size:11px;right:112px;position:absolute">-</button>');
            $("#" + this._uidiv).append('<select id="selectionBasketSelector" class="form-select" style="font-size:11px;right:0px;width:110px;position:absolute;top:0px" value=""></select>');
            $("#selectionBasketAdd").click(function () { _this.addNodesFromSelection(); });
            $("#selectionBasketSelectAll").click(function () { _this.selectAll(); });
            $("#selectionBasketRemove").click(function () { _this.removeSelectedNodes(); });
            $("#selectionBasketAddBasket").click(function () { _this.addBasket(); });
            $("#selectionBasketDeleteBasket").click(function () { _this.deleteCurrentBasket(); });

            $("#selectionBasketSelector").change(function () {

                _this.switchBasket(parseInt($("#selectionBasketSelector").val()));
    
            });

        }
        $("#" + this._uidiv).append('<div id="' + this._uidiv + 'Tabulator" style="overflow: hidden; zoom:0.7;width:100%; height:100%;"></div>');

        this._refreshUI();
    }

    setRestrictToNode(nodeid) {
        this._restrictNode = nodeid;
    }

    unsetRestrictToNode() {
        this._restrictNode = undefined;
    }

    setDisallowBodyNodes(disallow){
        this._disallowBodyNodes = disallow;
    }

    toJson() {
        let jsonbaskets = [];

        for (let i=0;i<this._baskets.length;i++)
        {
            let items = this._baskets[i];
            let jsonitems = [];
            for (let j in items)
            {
                let jsonnodeids = [];
                for (let k=0;k<items[j].length;k++)
                {
                    jsonnodeids.push(items[j][k]);
                }
                jsonitems.push(jsonnodeids);
            }
            jsonbaskets.push(jsonitems);
        }        
        return jsonbaskets;
    }

    fromJson(jsonbaskets) {
        this._baskets = [];

        for (let i=0;i<jsonbaskets.length;i++)
        {
            let jsonitems = jsonbaskets[i];
            let items = [];
            for (let j=0;j<jsonitems.length;j++)
            {
                items[this._idcounter++] = jsonitems[j];
            }
            this._baskets.push(items);
        }        
        this.switchBasket(0);
    }

    addBasket() {
        this._items = [];
        this._baskets.push(this._items);
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
        this._items = this._baskets[basketid];
        this._activeBasket = basketid;
        await this._refreshUI();
        this._updateSelection();

    }

    selectAll() {
        this._viewer.selectionManager.clear();
        let selitems = [];
        for (let i in this._items) {
            let item = this._items[i];
            for (let j = 0; j < item.length; j++)
                selitems.push(Communicator.Selection.SelectionItem.create(item[j]));
        }
        this._viewer.selectionManager.add(selitems);
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

        let deleted = false;
        let deleteNodeids = [];
        for (let i = 0; i < nodeids.length; i++) {
            let deleted = false;
            for (let j in this._items) {
                for (let k = 0; k < this._items[j].length; k++)
                    if (this._items[j][k] == nodeids[i]) {
                        deleteNodeids.push(nodeids[i]);
                        deleted = true;
                        break;
                    }
                if (deleted) break;
            }
        }

        await this.removeNodes(deleteNodeids);

        this._items[this._idcounter] = nodeids;
        let itemid = this._idcounter;
        this._idcounter++;

        if (this._uidiv) {
            await this._addTableRow(nodeids, itemid);
        }
    }

    async removeSelectedNodes() {

        let r = this._viewer.selectionManager.getResults();
        if (r.length == 0) return;
        let nodeids = [];
        for (let i = 0; i < r.length; i++)
        {
            let nodeid = r[i].getNodeId();
            nodeids.push(nodeid);
        }
        this.removeNodes(nodeids);
    }

    async removeNodes(nodeids) {

        for (let i = 0; i < nodeids.length; i++) {
            let deleted = false;
            for (let j in this._items) {
                for (let k = 0; k < this._items[j].length; k++) {
                    if (this._items[j][k] == nodeids[i]) {
                        if (this._items[j].length == 1) {
                            delete this._items[j];
                            break;
                        }
                        else {
                            this._items[j].splice(k, 1);
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

    async _refreshUI() {
        if (!this._uidiv) return;

        let _this = this;

        if (!this._table) {
            this._table = new Tabulator("#" + this._uidiv + "Tabulator", {
                data: [],
                dataTree: true,
                dataTreeStartExpanded: false,
                selectable: true,
                layout: "fitColumns",
                columns: [
                    {
                        title: "Name", field: "name"
                    },
                    {
                        title: "Nodeids", field: "nodeids"
                    },
                    {
                        title: "ID", field: "id", width: 20, visible: false
                    },

                ],
            });

            this._table.on("rowClick", function (e, row) {
                _this._handleTableSelection(row.getData());
            });

            this._table.on("dataTreeRowExpanded", function (e, row) {
                _this._updateSelection();
            });

            this._table.on("dataTreeRowCollapsed", function (e, row) {
                _this._updateSelection();
            });

        }
        else
            await this._table.clearData();

        for (let i in this._items) {
            await this._addTableRow(this._items[i], i);
        }

        if (this._hasMenu)
            this._updateBasketSelector();
    }

    async _addTableRow(nodeids, itemid) {
        if (nodeids.length == 1) {
            let prop = this._generateOneTableItem(nodeids[0]);
            prop.id = itemid;
            this._table.addRow(prop);
        }
        else {
            let prop = { name: "", nodeids: "", id: itemid };
            let props = [];
            for (let i = 0; i < nodeids.length; i++) {
                let newprop = this._generateOneTableItem(nodeids[i]);
                props.push(newprop);
                if (prop.name.length<200)
                    prop.name += newprop.name;
                prop.nodeids += newprop.nodeids;
                if (i < nodeids.length - 1) {
                    if (prop.name.length<200)
                        prop.name += ",";
                    prop.nodeids += ",";
                }
            }
            prop._children = props;
            await this._table.addRow(prop);
        }
    }

    _generateOneTableItem(nodeid) {
        let name = this._viewer.model.getNodeName(nodeid);
        let prop = {};
        prop.nodeids = "" + nodeid;
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
        $("#selectionBasketSelector").empty();
        let html = "";

        for (let i = 0; i < this._baskets.length; i++) {
            let choice = ("Basket " + i);
            if (i == this._activeBasket)
                html += '<option selected value="' + i + '">' + choice + '</option>\n';
            else
                html += '<option value="' + i + '">' + choice + '</option>\n';
        }
        $("#selectionBasketSelector").append(html);
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

            }
        }
    }
    

    _filterSelection(nodeid) {

        if (this._restrictNode != undefined) {
            while (1) {
                if (nodeid == this._viewer.model.getRootNode())
                    return null;
                let parent = this._viewer.model.getNodeParent(nodeid);
                if (parent != this._restrictNode)
                    nodeid = parent;
                else {
                    break;
                }

            }
        }

        if (this._disallowBodyNodes && this._viewer.model.getNodeType(nodeid) === Communicator.NodeType.BodyInstance) {
            return this._viewer.model.getNodeParent(nodeid);
        }
        return nodeid;
    }

}
