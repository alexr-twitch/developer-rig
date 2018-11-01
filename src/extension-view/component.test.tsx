import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { ExtensionView } from './component';
import { ViewerTypes } from '../constants/viewer-types';
import { createExtensionForTest, createViewsForTest } from '../tests/constants/extension';
import { ExtensionAnchor, ExtensionMode, ExtensionPlatform, ExtensionViewType } from '../constants/extension-coordinator';

const DeleteButtonSelector = '.view__close_button.visible';
const views = createViewsForTest(1, ExtensionViewType.Component, ViewerTypes.LoggedOut, { x: 10, y: 10 });

describe('<ExtensionView />', () => {
  const setupShallow = setupShallowTest(ExtensionView, () => ({
    view: views[0],
    configuration: {},
    extension: createExtensionForTest(),
    role: ViewerTypes.Broadcaster,
    deleteViewHandler: jest.fn(),
    openEditViewHandler: jest.fn(),
    iframe: '',
    mockApiEnabled: false,
  }));

  it('when moused over displays the delete button', () => {
    const { wrapper } = setupShallow();
    wrapper.simulate('mouseEnter');
    expect(wrapper.state().mousedOver).toBe(true);
    expect(wrapper.find(DeleteButtonSelector)).toHaveLength(1);
  });

  it('when moused over and mouse leaves, no delete button displayed', () => {
    const { wrapper } = setupShallow();
    wrapper.simulate('mouseEnter');
    expect(wrapper.state().mousedOver).toBe(true);
    expect(wrapper.find(DeleteButtonSelector)).toHaveLength(1);
    wrapper.simulate('mouseLeave');
    expect(wrapper.state().mousedOver).toBe(false);
    expect(wrapper.find(DeleteButtonSelector)).toHaveLength(0);
  });

  it('when moused over and delete button is clicked, the deleteViewHandler is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.simulate('mouseEnter');
    expect(wrapper.state().mousedOver).toBe(true);
    expect(wrapper.find(DeleteButtonSelector)).toHaveLength(1);
    wrapper.find(DeleteButtonSelector).simulate('click');
    expect(wrapper.instance().props.deleteViewHandler).toHaveBeenCalled();
  });

  describe('config mode views', () => {
    it('renders correctly when in config mode', () => {
      const { wrapper } = setupShallow({
        view: createViewsForTest(1, ExtensionMode.Config, ViewerTypes.LoggedOut, { x: 10, y: 10 })[0],
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('live config mode views', () => {
    it('renders correctly when in config mode', () => {
      const { wrapper } = setupShallow({
        view: createViewsForTest(1, ExtensionMode.Dashboard, ViewerTypes.LoggedOut, { x: 10, y: 10 })[0],
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('sets correct live config height when panel height provided', () => {
      const extensionWithPanelHeight: ExtensionCoordinator.ExtensionObject = {
        ...createExtensionForTest(),
        views: {
          config: {
            canLinkExternalContent: false,
            viewerUrl: "test",
          },
          liveConfig: {
            canLinkExternalContent: false,
            viewerUrl: "test",
          },
          panel: {
            canLinkExternalContent: false,
            viewerUrl: 'test',
            height: 500,
          }
        },
      };

      const { wrapper } = setupShallow({
        view: createViewsForTest(1, ExtensionMode.Dashboard, ViewerTypes.LoggedOut, { x: 10, y: 10 })[0],
        extension: extensionWithPanelHeight
      });

      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('mobile mode views', () => {
    it('renders correctly when in mobile mode', () => {
      const { wrapper } = setupShallow({
        view: createViewsForTest(1, ExtensionPlatform.Mobile, ViewerTypes.LoggedOut, { x: 10, y: 10 })[0],
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('component mode views', () => {
    it('renders component view when in component mode', () => {
      const { wrapper } = setupShallow({
        view: createViewsForTest(1, ExtensionAnchor.Component, ViewerTypes.LoggedOut, { x: 10, y: 10 })[0],
      });
      expect(wrapper).toMatchSnapshot();
      expect(wrapper.find('ExtensionComponentView').length).toBe(1);
    });

    it('brings up the edit dialog when edit is clicked', () => {
      const { wrapper } = setupShallow({
        view: createViewsForTest(1, ExtensionAnchor.Component, ViewerTypes.LoggedOut, { x: 10, y: 10 })[0],
      });

      wrapper.simulate('mouseEnter');
      expect(wrapper.state().mousedOver).toBe(true);
      wrapper.find('.view__edit_button').simulate('click');
      expect(wrapper.instance().props.openEditViewHandler).toHaveBeenCalled();
    });
  });

  describe('panel mode views', () => {
    it('renders correctly when in panel mode as a Broadcaster', () => {
      const { wrapper } = setupShallow();
      expect(wrapper).toMatchSnapshot();
    });

    it('sets correct panel height when panel height provided', () => {
      const extensionWithPanelHeight: ExtensionCoordinator.ExtensionObject = {
        ...createExtensionForTest(),
        views: {
          config: {
            canLinkExternalContent: false,
            viewerUrl: "test",
          },
          liveConfig: {
            canLinkExternalContent: false,
            viewerUrl: "test",
          },
          panel: {
            canLinkExternalContent: false,
            viewerUrl: 'test',
            height: 400,
          }
        },
      };

      const { wrapper } = setupShallow({
        view: createViewsForTest(1, ExtensionViewType.Panel, ViewerTypes.LoggedOut, { x: 10, y: 10 })[0],
        extension: extensionWithPanelHeight,
      });

      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in panel mode as a Logged In and Unlinked Viewer', () => {
      const { wrapper } = setupShallow({
        role: ViewerTypes.LoggedIn,
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in panel mode as a Logged In and Linked Viewer', () => {
      const view = createViewsForTest(1, ExtensionViewType.Component, ViewerTypes.LoggedIn, { x: 10, y: 10 })[0];
      view.linked = true;
      const { wrapper } = setupShallow({
        view,
        role: ViewerTypes.LoggedIn,
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in panel mode as a Logged Out viewer', () => {
      const { wrapper } = setupShallow({
        role: ViewerTypes.LoggedOut,
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('overlay mode views', () => {
    it('renders correctly in overlay mode as a Broadcaster', () => {
      const view = createViewsForTest(1, ExtensionAnchor.Overlay, ViewerTypes.LoggedOut, { x: 10, y: 10 })[0];
      view.frameSize = {
        height: 1,
        width: 1
      };
      const { wrapper } = setupShallow({
        view,
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in overlay mode as a Logged In and Unlinked Viewer', () => {
      const view = createViewsForTest(1, ExtensionAnchor.Overlay, ViewerTypes.LoggedIn, { x: 10, y: 10 })[0];
      view.frameSize = {
        height: 1,
        width: 1
      };
      const { wrapper } = setupShallow({
        view,
        role: ViewerTypes.LoggedIn,
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in overlay mode as a Logged In and Linked Viewer', () => {
      const view = createViewsForTest(1, ExtensionViewType.Component, ViewerTypes.LoggedIn, { x: 10, y: 10 })[0];
      view.linked = true;
      view.frameSize = {
        height: 1,
        width: 1
      };
      const { wrapper } = setupShallow({
        view,
        role: ViewerTypes.LoggedIn,
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in overlay mode as a Logged Out', () => {
      const view = createViewsForTest(1, ExtensionViewType.Component, ViewerTypes.LoggedOut, { x: 10, y: 10 })[0];
      view.frameSize = {
        height: 1,
        width: 1
      };
      const { wrapper } = setupShallow({
        view,
        role: ViewerTypes.LoggedOut,
      });
      expect(wrapper).toMatchSnapshot();
    });
  });
});
