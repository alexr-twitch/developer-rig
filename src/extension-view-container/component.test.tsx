import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { ChannelSegments } from '../core/models/rig';
import { createViewsForTest, createExtensionManifestForTest } from '../tests/constants/extension';
import { ExtensionViewContainer } from './component';
import { ExtensionAnchors } from '../constants/extension-types';
import { ViewerTypes } from '../constants/viewer-types';
import { ExtensionAnchor } from '../constants/extension-coordinator';

const segment = {
  content: 'content',
  version: 'version',
};

const setupShallow = setupShallowTest(ExtensionViewContainer, () => ({
  configurations: {
    globalSegment: segment,
    channelSegments: {
      twitch: {
        broadcaster: segment,
        developer: segment,
      },
    } as ChannelSegments,
  },
  extensionViews: createViewsForTest(0, '', ''),
  isDisplayed: true,
  manifest: createExtensionManifestForTest(),
  secret: '',
  createExtensionViewHandler: jest.fn().mockImplementation(() => Promise.resolve()),
  deleteExtensionViewHandler: jest.fn(),
  editViewHandler: jest.fn(),
}));

describe('<ExtensionViewContainer />', () => {
  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('opens, creates, and closes ExtensionViewDialog', async () => {
    const { wrapper } = setupShallow();
    wrapper.find('ExtensionViewButton').simulate('click');
    expect(wrapper.instance().state.showingExtensionsViewDialog).toBe(true);
    wrapper.update();
    expect(wrapper.find('ExtensionViewDialog')).toBeDefined();
    await wrapper.find('ExtensionViewDialog').get(0).props.saveHandler();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          expect(wrapper.instance().state.showingExtensionsViewDialog).toBe(false);
          expect(wrapper.instance().props.createExtensionViewHandler).toHaveBeenCalled();
          resolve();
        } catch (ex) {
          reject(ex.message);
        }
      });
    });
  });

  it('enables mock triggers', async () => {
    const { wrapper } = setupShallow();
    expect(wrapper.find('g')).toBeDefined();
    wrapper.find('g').get(0).props.onClick();
    expect(wrapper.instance().state.mockTriggersEnabled).toBe(true);
  });

  it('opens, saves, and closes EditViewDialog', () => {
    const extensionViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    const { wrapper } = setupShallow({ extensionViews });
    wrapper.find('ExtensionView').get(0).props.openEditViewHandler('1');
    expect(wrapper.instance().state.viewForEdit).toBe(extensionViews[0]);
    wrapper.update();
    expect(wrapper.find('EditViewDialog')).toBeDefined();
    wrapper.find('EditViewDialog').get(0).props.saveViewHandler();
    expect(wrapper.instance().state.viewForEdit).toBeNull();
  });
});
