import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { ExtensionMobileView } from './component';
import { createExtensionForTest } from '../tests/constants/extension';
import { MobileOrientation } from '../constants/mobile';
import { ExtensionMode } from '../constants/extension-coordinator';

const setupShallow = setupShallowTest(ExtensionMobileView, () => ({
  channelId: 'twitch',
  configuration: {},
  id: '0',
  extension: createExtensionForTest(),
  orientation: MobileOrientation.Portrait,
  frameSize: { width: 100, height: 100 },
  position: { x: 0, y: 0 },
  role: ExtensionMode.Viewer,
  bindIframeToParent: jest.fn(),
  installationAbilities: {
    isChatEnabled: true,
  }
}));

describe('<ExtensionMobileView />', () => {
  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('computes correct styles in portrait mode', () => {
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as ExtensionMobileView;
    const expectedFrameStyles = {
      'bottom': '0',
      'height': '65px',
      'position': 'absolute',
      'width': '100px'
    };
    const expectedViewStyles = {
      'background': '#322F37',
      'height': '100px',
      'width': '100px',
    };

    expect(instance.computeFrameStyles()).toEqual(expectedFrameStyles);
    expect(instance.computeViewStyles()).toEqual(expectedViewStyles);
  });

  it('computes correct styles in landscape mode', () => {
    const { wrapper } = setupShallow({
      orientation: MobileOrientation.Landscape
    });
    const instance = wrapper.instance() as ExtensionMobileView;

    const expectedFrameStyles = {
      'height': '100px',
      'position': 'absolute',
      'right': '0',
      'width': '28px'
    };

    const expectedViewStyles = {
      'background': '#322F37',
      'height': '100px',
      'width': '100px',
    };

    expect(instance.computeFrameStyles()).toEqual(expectedFrameStyles);
    expect(instance.computeViewStyles()).toEqual(expectedViewStyles);
  })
});
