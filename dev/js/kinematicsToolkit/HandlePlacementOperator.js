export class HandlePlacementOperator  {

    constructor(viewer) {
        this._viewer = viewer;

        this._activeHighlight = null;
        this._currentSelItem = null;
        this._axis = null;
        this._axis2 = null;
        this._disabled = false;

        
    }

    getPosition()
    {
        let handleOperator = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        return handleOperator.getPosition();
    }

    getAxis() {
        return this._axis;
    }

    getSecondAxis() {
        return this._axis2;
    }

    setAxis(axis) {
        this._axis = axis;
    }

    setSecondAxis(axis) {
        this._axis2 = axis;
    }

    insertHandles(event)
    {


        let selectionItem = this._currentSelItem;
        let nodeId = selectionItem.getNodeId();
        let faceEntity = selectionItem.getFaceEntity();
        let lineEntity = selectionItem.getLineEntity();

        if (lineEntity !== null || faceEntity != null) {
        let r = this._viewer.selectionManager.getResults();
            let snodeIds;
            if (r.length > 0) {
                snodeIds = [];
                for (let i = 0; i < r.length; i++)
                    snodeIds.push(r[i].getNodeId());
            }
            else
                snodeIds = [nodeId];

            if (lineEntity != null) {
                let points = lineEntity.getPoints();
                if (points.length === 2) {
                    let axis = Communicator.Point3.subtract(points[1], points[0]);

                    this._axis = axis.copy();

                    let length_1 = axis.length();
                    let position = points[0].copy().add(axis.normalize().scale(length_1 / 2));

                    this._addAxisTranslationHandle(position, axis, snodeIds);
                    this._addAxisTranslationHandle(position, axis.copy().scale(-1), snodeIds);
                    this._addAxisRotationHandle(position, axis, snodeIds);
                }
                else {
                    this._getArcCenter(selectionItem).then((pt) => {

                        let mat = this._viewer.model.getNodeNetMatrix(this._viewer.model.getNodeParent(nodeId));
                        let p1 = mat.transform(new Communicator.Point3(0, 0, 0));
                        let p2 = mat.transform(pt.normal);                        
                        let cross = Communicator.Point3.cross(new Communicator.Point3(1, 0, 0), pt.normal);
                        if (cross.length() < 0.00001) 
                             cross = Communicator.Point3.cross(new Communicator.Point3(0, 1, 0), pt.normal);

                        let p3 = mat.transform(cross);



                        let axis = Communicator.Point3.subtract(p2, p1);
                        let axis2 = Communicator.Point3.subtract(p3, p1);
                        this._axis = axis.copy();
                        this._axis2 = axis2.copy();
                        let position = pt.center;
                        this._addAxisTranslationHandle(position, axis, snodeIds);
                        this._addAxisTranslationHandle(position, axis.copy().scale(-1), snodeIds);
                        this._addAxisRotationHandle(position, axis, snodeIds);
                        this._addAxisTranslationHandle(position, axis2, snodeIds);
                    });

                }
            }
            else {
                let axis = faceEntity.getNormal();
                let position = faceEntity.getPosition().copy();
                if (!event.controlDown())
                {
                    position = faceEntity.getBounding().center().copy();
                }
                else
                {
                    position = this._currentSelItem.getPosition().copy();
                }

                if (event.altDown())
                    this._addMainHandle(snodeIds, position);
                else {
                    let axis2 = Communicator.Point3.cross(new Communicator.Point3(1, 0, 0),axis);
                    if (axis2.length() < 0.00001) 
                    axis2 = Communicator.Point3.cross(new Communicator.Point3(0, 1, 0),axis);

                    this._axis = axis.copy();
                    this._axis2 = axis2.copy();
                    this._addAxisTranslationHandle(position, axis, snodeIds);
                    this._addAxisTranslationHandle(position, axis.copy().scale(-1), snodeIds);
                    this._addAxisRotationHandle(position, axis, snodeIds);
                    this._addAxisTranslationHandle(position, axis2, snodeIds);

                }
            }
        }
    }

    
    disable()
    {
        this._disabled = true;
    }

    enable()
    {
        this._disabled = false;
    }



    onMouseDown(event) {

        if (this._disabled)
            return;

        if (!event.shiftDown())
            return;

        const handleOperator = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        handleOperator.removeHandles();

        this._axis = null;
        this._axis2 = null;
      
        this.insertHandles(event);
        
        event.setHandled(true);
    }

    onMouseMove(event) {
        if (this._disabled)
            return;


        if (event.shiftDown()) {
            let position = event.getPosition();

            let view = this._viewer.view;
            let config = new Communicator.PickConfig(Communicator.SelectionMask.Line);

            view.pickFromPoint(position, config).then((selectionItem) => {
                this._currentSelItem = selectionItem;

                let nodeId = selectionItem.getNodeId();

                if (nodeId !== null) {
                    if (this._viewer.model.getNodeType(nodeId) !== Communicator.NodeType.BodyInstance) {
                        return;
                    }

                    if (this._activeHighlight !== null) {
                        if (!selectionItem.equals(this._activeHighlight)) {
                            this._setNodeLineHighlighted(this._activeHighlight, false);
                            this._setNodeLineHighlighted(selectionItem, true);
                        }
                    } else {
                        this._setNodeLineHighlighted(selectionItem, true);
                    }
                } else {

                    if (this._activeHighlight !== null) {
                        this._setNodeLineHighlighted(this._activeHighlight, false);
                    }
                }
            });

        }
        else {
            if (this._activeHighlight !== null) {
                this._setNodeLineHighlighted(this._activeHighlight, false);
            }
        }
    }

    onMouseUp(event) {

        if (this._disabled)
        return;


        if (event.shiftDown())
            event.setHandled(true);
    }

    _setNodeLineHighlighted(selectionItem, highlighted) {
        if (selectionItem !== null) {
            let nodeId = selectionItem.getNodeId();
            let lineEntity = selectionItem.getLineEntity();

            if (nodeId !== null) {
                if (lineEntity !== null) {
                    let lineId = lineEntity.getLineId();
                    this._viewer.model._setNodeLineHighlighted(nodeId, lineId, highlighted);
                    if (highlighted) {
                        this._activeHighlight = selectionItem;
                    } else {
                        this._activeHighlight = null;
                    }
                }
            }
        }
    }

    _getArcCenter(selectionItem) {
        let nodeId = selectionItem.getNodeId();
        let lineEntity = selectionItem.getLineEntity();

        if (nodeId !== null && lineEntity !== null) {
            let model = this._viewer.model;

            return model.getEdgeProperty(nodeId, lineEntity.getLineId()).then((subentityProperty) => {
                if (subentityProperty instanceof Communicator.SubentityProperties.CircleElement) {
                    const center = subentityProperty.origin;
                    const matrix = model.getNodeNetMatrix(nodeId);
                    matrix.transform(center, center);
                    return { center: center, normal: subentityProperty.normal };
                } else if (subentityProperty instanceof Communicator.SubentityProperties.LineElement) {
                    const points = lineEntity.getPoints();
                    if (points.length === 2) {
                        return Communicator.Point3.add(points[1], points[0]).scale(0.5);
                    }
                }
                return null;
            });
        }
        return Promise.resolve(null);
    }


    _addMainHandle(nodeIds, pos) {
        let d = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        d.addHandles(nodeIds, pos);
        d.showHandles();
    }

    _addAxisRotationHandle(position, axis, nodeIds, color) {
        if (!color) {
            color = Communicator.Color.red();
        }
        let d = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        d.addAxisRotationHandle(position, axis, color);
        d.setNodeIds(nodeIds);
        d.showHandles();
    }
    _addAxisTranslationHandle(position, axis, nodeIds, color) {
        if (!color) {
            color = Communicator.Color.red();
        }
        let d = this._viewer.operatorManager.getOperator(Communicator.OperatorId.Handle);
        d.addAxisTranslationHandle(position.copy(), axis, color);
        d.setNodeIds(nodeIds);
        d.showHandles();
    }
}
