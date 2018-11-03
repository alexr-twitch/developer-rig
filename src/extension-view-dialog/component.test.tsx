import { setupMountTest } from '../tests/enzyme-util/mount';
import { ExtensionViewDialog } from './component';
import { DefaultExtensionType, ExtensionAnchors } from '../constants/extension-types'
import { DefaultOverlaySize } from '../constants/overlay-sizes'
import { ViewerTypes, DefaultViewerType } from '../constants/viewer-types'
import { RadioOption } from './radio-option';
import { ExtensionViewType, ExtensionMode, ExtensionAnchor, ExtensionPlatform } from '../constants/extension-coordinator';
import { DivOption } from './div-option';

describe('<ExtensionViewDialog />', () => {
  const setupMount = setupMountTest(ExtensionViewDialog, () => ({
    channelId: 'twitch',
    extensionViews: {
      panel: {
        height: 300,
        canLinkExternalContent: false,
        viewerUrl: 'test.html',
      },
      mobile: {
        viewerUrl: 'test.html',
      },
      videoOverlay: {
        canLinkExternalContent: false,
        viewerUrl: 'test.html',
      },
    },
    closeHandler: jest.fn(),
    saveHandler: jest.fn(),
  }));

  it('when top nav close button is clicked closeHandler is called', () => {
    const { wrapper } = setupMount();
    wrapper.find('.top-bar-container__escape').simulate('click');
    expect(wrapper.instance().props.closeHandler).toHaveBeenCalled();
  });

  it('when bottom bar close button is clicked closeHandler is called', () => {
    const { wrapper } = setupMount();
    wrapper.find('.bottom-bar__cancel').simulate('click');
    expect(wrapper.instance().props.closeHandler).toHaveBeenCalled();
  });

  it('when save button is clicked saveHanler is called', () => {
    const { wrapper } = setupMount();
    wrapper.find('.bottom-bar__save').simulate('click');
    expect(wrapper.instance().props.saveHandler).toHaveBeenCalled();
  });

  it('only shows the default views of no other views supported', () => {
    const { wrapper } = setupMount({
      extensionViews: {}
    })

    expect(wrapper.find(DivOption).length).toEqual(2);
    expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionMode.Config]));
    expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionMode.Dashboard]));
  });

  it('renders correct identity options when logged in user type is selected', () => {
    const { wrapper } = setupMount();
    const instance = wrapper.instance() as ExtensionViewDialog;
    wrapper.find('RadioOption').forEach((elem) => {
      const diveInstance = elem.instance() as RadioOption;
      if (diveInstance.props.value === ViewerTypes.LoggedIn) {
        elem.simulate('click');
      }
    });

    instance.onChange({
      currentTarget: {
        name: 'viewerType',
        value: ViewerTypes.LoggedIn,
      }
    } as React.FormEvent<HTMLInputElement>)

    wrapper.update();
    expect(wrapper.find('RadioOption[name="identityOption"]')).toHaveLength(2);
  });

  it('renders opaque id input field correctly', () => {
    const { wrapper } = setupMount();
    expect(wrapper.find('.opaque_id-input')).toHaveLength(1);
  });

  describe('for an extension that supports video overlays and panels', () => {
    const { wrapper } = setupMount();

    it('renders correctly', () => {
      expect(wrapper.find(DivOption).length).toEqual(5);
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionMode.Config]));
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionMode.Dashboard]));
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionAnchor.Panel]));
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionAnchor.Overlay]));
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionPlatform.Mobile]));
    });

    it('has the correct default state', () => {
      expect(wrapper.state('extensionViewType')).toBe(DefaultExtensionType);
      expect(wrapper.state('frameSize')).toBe(DefaultOverlaySize);
      expect(wrapper.state('viewerType')).toBe(DefaultViewerType);
    });

    it('has the correct selected UI elements', () => {
      expect(wrapper.find('DivOption[value="video_overlay"][checked=true]')).toHaveLength(1);
      expect(wrapper.find('DivOption[checked=false]')).toHaveLength(4);

      expect(wrapper.find('RadioOption[value="640x480"][checked=true]')).toHaveLength(1);
      expect(wrapper.find('RadioOption[name="frameSize"][checked=false]')).toHaveLength(4);

      expect(wrapper.find('RadioOption[value="Broadcaster"][checked=true]')).toHaveLength(1);
      expect(wrapper.find('RadioOption[name="viewerType"][checked=false]')).toHaveLength(2);

      expect(wrapper.find('RadioOption[name="identityOption"]')).toHaveLength(0);
    });
  });

  describe('for an extension that only supports panels', () => {
    const { wrapper } = setupMount({
      extensionViews: {
        panel: {
          height: 300,
          viewerUrl: 'test.html',
          canLinkExternalContent: false,
        },
      }
    });
    it('renders correctly', () => {
      expect(wrapper.find(DivOption).length).toEqual(3);
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionAnchor.Panel]));
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionMode.Config]));
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionMode.Dashboard]));
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionPlatform.Mobile]));
    });

    it('has the correct default state', () => {
      expect(wrapper.state('extensionViewType')).toBe('panel');
      expect(wrapper.state('frameSize')).toBe(DefaultOverlaySize);
      expect(wrapper.state('viewerType')).toBe(DefaultViewerType);
    });

    it('has the correct selected UI elements', () => {
      expect(wrapper.find('DivOption[value="panel"][checked=true]')).toHaveLength(1);
      expect(wrapper.find('DivOption[checked=false]')).toHaveLength(2);

      expect(wrapper.find('RadioOption[value="Broadcaster"][checked=true]')).toHaveLength(1);
      expect(wrapper.find('RadioOption[name="viewerType"][checked=false]')).toHaveLength(2);

      expect(wrapper.find('RadioOption[name="identityOption"]')).toHaveLength(0);
    });
  });


  describe('for an extension that only supports components', () => {
    const { wrapper } = setupMount({
      extensionViews: {
        component: {
          canLinkExternalContent: true,
          viewerUrl: 'test.html',
          aspectHeight: 10000,
          aspectWidth: 10000,
          zoom: true,
          zoomPixels: 500,
        }
      }
    });
    it('renders correctly', () => {
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionAnchor.Component]));
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionMode.Config]));
      expect(wrapper.find(DivOption).someWhere((node) => node.prop('name') === ExtensionAnchors[ExtensionMode.Dashboard]));
    });

    it('has the correct default state', () => {
      expect(wrapper.state('extensionViewType')).toBe(ExtensionViewType.Component);
      expect(wrapper.state('frameSize')).toBe(DefaultOverlaySize);
      expect(wrapper.state('viewerType')).toBe(DefaultViewerType);
    });

    it('has the correct selected UI elements', () => {
      expect(wrapper.find('DivOption[value="component"][checked=true]')).toHaveLength(1);
      expect(wrapper.find('DivOption[checked=false]')).toHaveLength(2);

      expect(wrapper.find('RadioOption[value="Broadcaster"][checked=true]')).toHaveLength(1);
      expect(wrapper.find('RadioOption[name="viewerType"][checked=false]')).toHaveLength(2);

      expect(wrapper.find('RadioOption[name="identityOption"]')).toHaveLength(0);
    });
  });
});
