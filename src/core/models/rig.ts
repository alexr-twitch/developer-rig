import { ExtensionManifest } from './manifest';
import { SegmentMap } from '../../util/api';

export interface RigProject {
  extensionViews: RigExtensionView[],
  projectFolderPath: string;
  manifest: ExtensionManifest;
  secret: string;
  frontendFolderName: string;
  frontendCommand: string;
  backendCommand: string;
}

export interface RigExtensionView {
  x: number;
  y: number;
  orientation: string;
  id: string;
  channelId: string;
  features: {
    isChatEnabled: boolean;
  };
  type: string;
  mode: string;
  role: string;
  linked: boolean;
  linkedUserId: string;
  opaqueId: string;
  isPopout: boolean;
  frameSize: FrameSize;
}

export interface FrameSize {
  height: number;
  width: number;
}

export interface ChannelSegments {
  [channelId: string]: SegmentMap;
}

export interface Configurations {
  globalSegment: ExtensionCoordinator.Segment;
  channelSegments: ChannelSegments;
}
