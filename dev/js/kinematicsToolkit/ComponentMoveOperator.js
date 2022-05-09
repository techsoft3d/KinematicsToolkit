import { KinematicsManager } from "./KinematicsManager.js";
import { componentType } from './KinematicsComponent.js';


export class ComponentMoveOperator {

    constructor(viewer) {
        this._viewer = viewer;
        this._mouseDown = false;
        this._component = null;
        this._disabled = false;
    }

    disable()
    {
        KinematicsManager.viewer.selectionManager.clear();
        this._disabled = true;
    }

    enable()
    {
        this._disabled = false;
    }

    onMouseDown(event) {

        if (this._component && !this._disabled) {
            this._mouseDown = true;
            this._startPosition = event.getPosition().copy();
            this._currentcpos = this._component.getCurrentValue();
            event.setHandled(true);
        }

    }

    onMouseMove(event) {
        if (this._disabled)
            return;
        let position = event.getPosition();

        if (this._mouseDown) {
            var p = event.getPosition();
            this._component.set( (this._currentcpos + (p.x - this._startPosition.x)/5));
            this._component.getHierachy().updateComponents();

        }
        else {

            let view = this._viewer.view;
            let config = new Communicator.PickConfig(Communicator.SelectionMask.Line);
            this._component = null;
            KinematicsManager.viewer.selectionManager.clear();
            view.pickFromPoint(position, config).then((selectionItem) => {

                let nodeId = selectionItem.getNodeId();
                if (nodeId) {
                    let component = null;
                    while (1) {
                        component = KinematicsManager.getComponentFromNodeId(nodeId);
                        if (component !== null)
                            break;
                        nodeId = this._viewer.model.getNodeParent(nodeId);
                        if (nodeId == this._viewer.model.getRootNode()) {
                            break;
                        }
                    }

                    if (component !== null) {
                        if (component.getBehavior().getMovementType() === componentType.revolute  && !component.getAnimationActive()) {
                            component.selectReferenceNodes();
                            this._component = component;
                        }

                    }
                }
            });
        }
    }


    onMouseUp(event) {

        if (this._mouseDown && !this._disabled) {
            this._mouseDown = false;
            this._component = null;
            event.setHandled(true);
        }
    }


}


