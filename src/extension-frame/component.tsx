import * as React from 'react';
import './component.sass';
import { ExtensionPlatform, ExtensionViewType } from '../constants/extension-coordinator';

const IFRAME_CLASS = 'extension-frame';
const EXTENSION_FRAME_INIT_ACTION = 'extension-frame-init';

export interface Props {
  channelId: string;
  className: string;
  configuration: ExtensionCoordinator.Configuration;
  frameId: string;
  extension: ExtensionCoordinator.ExtensionObject;
  installationAbilities: ExtensionCoordinator.ExtensionInstallationAbilities;
  type: string;
  mode: string;
  isPopout: boolean;
  bindIframeToParent: (iframe: HTMLIFrameElement) => void;
}

export class ExtensionFrame extends React.Component<Props> {
  public iframe: HTMLIFrameElement;

  public render() {
    return (
      <iframe
        ref={this.bindIframeRef}
        src={process.env.PUBLIC_URL + '/extension-frame.html'}
        frameBorder={0}
        className={`rig-frame ${IFRAME_CLASS}`}
        title={this.props.frameId}
      />
    );
  }

  private bindIframeRef = (iframe: HTMLIFrameElement) => {
    this.iframe = iframe;
    this.props.bindIframeToParent(iframe);
    if (this.iframe) {
      this.iframe.onload = this.extensionFrameInit;
    }
  }

  public extensionFrameInit = () => {
    const extension = JSON.parse(JSON.stringify(this.props.extension));
    const extensionFrameOptions: ExtensionCoordinator.ExtensionFrameOptions = {
      anchor: this.props.type as ExtensionCoordinator.ExtensionAnchor,
      channelId: parseInt(this.props.channelId, 10),
      configuration: this.props.configuration,
      extension,
      iframeClassName: IFRAME_CLASS,
      installationAbilities: this.props.installationAbilities,
      loginId: null,
      mode: this.props.mode as ExtensionCoordinator.ExtensionMode,
      platform: (this.props.type === ExtensionViewType.Mobile) ? ExtensionPlatform.Mobile : ExtensionPlatform.Web,
      trackingProperties: {},
      isPopout: this.props.isPopout,
    };

    const data = {
      action: EXTENSION_FRAME_INIT_ACTION,
      parameters: extensionFrameOptions,
      channelId: this.props.channelId,
      frameId: this.props.frameId,
    };

    this.iframe.contentWindow.postMessage(data, '*');
  }
}
