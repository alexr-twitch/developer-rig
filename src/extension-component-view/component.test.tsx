import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { ExtensionComponentView } from './component';
import { ViewerTypes } from '../constants/viewer-types';
import { createExtensionForTest } from '../tests/constants/extension';

const setupShallow = setupShallowTest(ExtensionComponentView, () => ({
  channelId: 'twitch',
  configuration: {},
  id: '1',
  extension: createExtensionForTest(),
  frameSize: { width: 800, height: 600 },
  position: { x: 10, y: 10 },
  role: ViewerTypes.Broadcaster,
  bindIframeToParent: jest.fn(),
  installationAbilities: {
    isChatEnabled: true,
  }
}));

describe('<ExtensionComponentView />', () => {
  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('renders correctly when zoom is true', () => {
    const { wrapper } = setupShallow({
      extension: createExtensionObject(),
    });
    expect(wrapper).toMatchSnapshot();
  });

  function createExtensionObject(): ExtensionCoordinator.ExtensionObject {
    return {
      ...createExtensionForTest(),
      views: {
        component: {
          canLinkExternalContent: false,
          aspectWidth: 3000,
          aspectHeight: 2000,
          zoom: true,
          zoomPixels: 1000,
          viewerUrl: 'test',
        },
        config: {
          canLinkExternalContent: false,
          viewerUrl: 'test',
        },
        liveConfig: {
          canLinkExternalContent: false,
          viewerUrl: 'test',
        },
        panel: {
          canLinkExternalContent: false,
          viewerUrl: 'test',
          height: 300,
        },
      },
    };
  }
});
