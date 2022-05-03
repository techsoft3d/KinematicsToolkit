import { KinematicsManager } from "./KinematicsManager.js";
import { componentType } from './KinematicsComponent.js';


export class ComponentMoveOperator {

    constructor(viewer) {
        this._viewer = viewer;
        this._mouseDown = false;
        this._component = null;

        this._activeHighlight = null;
        this._currentSelItem = null;
        this.lastAxis = null;
        this.lastAxis2 = null;

    }



    onMouseDown(event) {

        if (this._component) {
            this._mouseDown = true;
            this._startPosition = event.getPosition().copy();
            event.setHandled(true);
        }

    }

    onMouseMove(event) {
        let position = event.getPosition();

        if (this._mouseDown) {
            var p = event.getPosition();
            this._component.set(p.x - this._startPosition.x);
            this._component.getHierachy().updateComponents();

        }
        else {

            let view = this._viewer.view;
            let config = new Communicator.PickConfig(Communicator.SelectionMask.Line);
            this._component = null;
            view.pickFromPoint(position, config).then((selectionItem) => {
                this._currentSelItem = selectionItem;

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
                        if (component.getType() === componentType.revolute || component.getType() === componentType.prismatic) {
                            this._component = component;
                        }

                    }
                }
            });
        }
    }


    onMouseUp(event) {

        if (this._mouseDown) {
            this._mouseDown = false;
            this._component = null;
            event.setHandled(true);
        }
    }


}


