import * as React from 'react';
import './component.sass';
import * as classNames from 'classnames';
import { ExtensionFrame } from '../extension-frame';
import { IdentityOptions } from '../constants/identity-options';
import { ViewerTypes } from '../constants/viewer-types';
import * as closeButton from '../img/close_icon.png';
import { ExtensionComponentView } from '../extension-component-view';
import { ExtensionMobileView } from '../extension-mobile-view/component';
import { RigExtensionView } from '../core/models/rig';
import { RunListTrigger } from '../runlist-trigger';
import * as runlist from '../../runlist/runlist.json';
import { RunList } from '../core/models/run-list';
import { ExtensionAnchor, ExtensionMode, ExtensionViewType, ExtensionPlatform } from '../constants/extension-coordinator';

export const ConfigViewWrapperDimensions = Object.freeze({
  overflow: "auto",
  height: "70vh",
});

export const ConfigViewDimensions = Object.freeze({
  width: "100%",
  height: "700px",
});

export const PanelViewDimensions = Object.freeze({
  width: "320",
  height: "300",
});

interface Props {
  view: RigExtensionView,
  configuration: ExtensionCoordinator.Configuration;
  extension: ExtensionCoordinator.ExtensionObject;
  role?: string;
  deleteViewHandler?: (id: string) => void;
  openEditViewHandler?: (id: string) => void;
  mockApiEnabled: boolean;
}

interface State {
  mousedOver: boolean;
  iframe: HTMLIFrameElement;
}

interface ExtensionProps {
  viewStyles: React.CSSProperties;
  viewWrapperStyles: React.CSSProperties;
}

const TypeViews: { [key: string]: string; } = {
  [ExtensionAnchor.Component]: ExtensionViewType.Component,
  [ExtensionAnchor.Overlay]: ExtensionViewType.Overlay,
  [ExtensionAnchor.Panel]: ExtensionViewType.Panel,
  [ExtensionMode.Config]: ExtensionViewType.Config,
  [ExtensionMode.Dashboard]: ExtensionViewType.LiveConfig,
  [ExtensionPlatform.Mobile]: ExtensionViewType.Mobile,
};

export class ExtensionView extends React.Component<Props, State> {
  public state: State = {
    mousedOver: false,
    iframe: undefined,
  };

  private bindIframeToParent = (iframe: HTMLIFrameElement) => {
    if (iframe) {
      const coordinatorScriptElement = document.getElementById('coordinatorScriptElement') as HTMLScriptElement;
      const attribute = iframe.contentDocument.createAttribute('coordinatorUrl');
      attribute.value = coordinatorScriptElement.src;
      iframe.attributes.setNamedItem(attribute);
    }
    this.state.iframe = iframe;
  }

  private mouseEnter() {
    this.setState({
      mousedOver: true,
    });
  }

  private mouseLeave() {
    this.setState({
      mousedOver: false
    });
  }

  public renderView(extensionProps: ExtensionProps) {
    const { view } = this.props;
    const commonProps = {
      bindIframeToParent: this.bindIframeToParent,
      channelId: view.channelId,
      className: 'view',
      configuration: this.props.configuration,
      extension: this.props.extension,
      installationAbilities: view.features,
    };
    const position = { x: view.x, y: view.y };
    let renderedView = null;
    switch (view.type) {
      case ExtensionAnchor.Component:
        renderedView = (
          <ExtensionComponentView
            {...commonProps}
            frameSize={view.frameSize}
            id={`component-${view.id}`}
            position={position}
            role={this.props.role}
          />
        );
        break;
      case ExtensionViewType.Mobile:
        renderedView = (
          <ExtensionMobileView
            {...commonProps}
            frameSize={view.frameSize}
            id={`mobile-${view.id}`}
            orientation={view.orientation}
            position={position}
            role={this.props.role}
          />
        );
        break;
      case ExtensionAnchor.Overlay:
        renderedView = (
          <div className="view nono_zone" style={extensionProps.viewStyles}>
            <ExtensionFrame
              {...commonProps}
              frameId={`frameid-${view.id}`}
              isPopout={false}
              mode={view.mode}
              type={view.type}
            />
          </div>
        );
        break;
      default:
        // standard view for panels, live config, and broadcaster config
        renderedView = (
          <div className="view" style={extensionProps.viewStyles}>
            <ExtensionFrame
              {...commonProps}
              frameId={`frameid-${view.id}`}
              isPopout={view.isPopout}
              mode={view.mode}
              type={view.type}
            />
          </div>
        );
        break;
    }
    return renderedView;
  }

  private renderLinkedOrUnlinked() {
    return this.props.view.linked ? IdentityOptions.Linked : IdentityOptions.Unlinked;
  }

  private isEditable() {
    return this.props.view.type === ExtensionAnchor.Component || this.props.view.type === ExtensionPlatform.Mobile;
  }

  public render() {
    let extensionProps = {
      viewStyles: {},
      viewWrapperStyles: {},
    };

    let panelHeight = PanelViewDimensions.height;
    if (this.props.extension.views.panel && this.props.extension.views.panel.height) {
      panelHeight = this.props.extension.views.panel.height + '';
    }
    const { view } = this.props;
    switch (view.type) {
      case ExtensionAnchor.Panel:
        extensionProps.viewStyles = {
          height: panelHeight + 'px',
          width: PanelViewDimensions.width + 'px',
        }
        break;
      case ExtensionAnchor.Overlay:
        extensionProps.viewStyles = {
          width: view.frameSize.width + 'px',
          height: view.frameSize.height + 'px'
        };
        break;
      case ExtensionMode.Config:
        extensionProps.viewStyles = ConfigViewDimensions;
        extensionProps.viewWrapperStyles = ConfigViewWrapperDimensions;
        break;
      case ExtensionMode.Dashboard:
        extensionProps.viewStyles = {
          height: panelHeight + 'px',
          width: PanelViewDimensions.width + 'px',
        }
        break;
      default:
        extensionProps.viewStyles = {
          height: PanelViewDimensions.height + 'px',
          width: PanelViewDimensions.width + 'px',
        }
        break;
    }
    const buttonClassName = classNames({
      view__close_button: true,
      visible: this.state.mousedOver,
    });
    return (
      <div
        className={'view__wrapper'}
        onMouseEnter={() => { this.mouseEnter() }}
        onMouseLeave={() => { this.mouseLeave() }}
        style={extensionProps.viewWrapperStyles}>
        <div
          className={'view__header'}>
          <div className={'view__header-container'}>
            <div className={'view__descriptor'}>
              {this.props.role}
              {(this.props.role === ViewerTypes.LoggedIn) ?
                ' ' + this.renderLinkedOrUnlinked() : null}
              {view.isPopout ? ' Popout' : null}
              {` (${(this.props.extension.views as any)[TypeViews[view.type]].viewerUrl.replace(/.*\//, '')})`}
            </div>

            {this.props.mockApiEnabled && <RunListTrigger runList={runlist as RunList} iframe={this.state.iframe} />}

            {this.isEditable() &&
              <div className='view__edit_button'
                onClick={() => this.props.openEditViewHandler(view.id)}>
                Edit
              </div>}
          </div>
          <div className={buttonClassName}
            onClick={() => this.props.deleteViewHandler(view.id)}>
            <img
              alt='Close'
              src={closeButton}
            />
          </div>
        </div>
        {this.renderView(extensionProps)}
      </div>
    );
  }
}
