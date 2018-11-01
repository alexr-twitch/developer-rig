import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { ProjectView } from './component';
import { createExtensionManifestForTest } from '../tests/constants/extension';
import { RigExtensionView } from '../core/models/rig';

let globalAny = global as any;

function mockApiFunctions() {
  const original = require.requireActual('../util/api');
  return {
    ...original,
    fetchExtensionManifest: jest.fn().mockImplementation(() => Promise.resolve({})),
    fetchHostingStatus: jest.fn().mockImplementation(() => Promise.resolve({})),
    startBackend: jest.fn().mockImplementation(() => Promise.resolve({})),
    hostFrontend: jest.fn().mockImplementation(() => Promise.resolve({})),
    startFrontend: jest.fn().mockImplementation(() => Promise.resolve({})),
    stopHosting: jest.fn().mockImplementation(() => Promise.resolve({})),
  };
}
jest.mock('../util/api', () => mockApiFunctions());
const api = require.requireMock('../util/api');

describe('<ProjectView />', () => {
  const rigProject = {
    extensionViews: [] as RigExtensionView[],
    projectFolderPath: 'test',
    manifest: createExtensionManifestForTest(),
    secret: 'test',
    frontendFolderName: 'test',
    frontendCommand: 'test',
    backendCommand: 'test',
  };
  const setupShallow = setupShallowTest(ProjectView, () => ({
    rigProject: { ...rigProject },
    userId: '999999999',
    onChange: jest.fn(),
    refreshViews: jest.fn(),
  }));

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  describe('onChange', () => {
    it('invokes', () => {
      const { wrapper } = setupShallow();
      const instance = wrapper.instance() as ProjectView;
      const name = 'projectFolderPath';
      wrapper.find('input[name="' + name + '"]').simulate('change', { currentTarget: { name, value: name } });
      wrapper.update();
      expect(instance.props.onChange).toHaveBeenCalled();
    });
  });

  it('invokes onChangeVersion', () => {
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as ProjectView;
    const name = 'version';
    wrapper.find('input[name="' + name + '"]').simulate('change', { currentTarget: { name, value: name } });
    wrapper.update();
    expect(instance.state.updateResult).toEqual('');
    expect(instance.state.version).toEqual('version');
  });

  it('invokes fetchExtensionManifest through refreshManifest', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.project-view__button--first').simulate('click');
    expect(api.fetchExtensionManifest).toHaveBeenCalled();
  });

  it('invokes fetchExtensionManifest through updateByVersion', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.project-view__button').first().simulate('click');
    expect(api.fetchExtensionManifest).toHaveBeenCalled();
  });

  describe('front-end', () => {
    it('starts Developer Rig hosting', () => {
      const { wrapper } = setupShallow();
      const instance = wrapper.instance() as ProjectView;
      instance.props.rigProject.frontendCommand = '';
      wrapper.update();
      wrapper.find('.project-view__button').at(1).simulate('click');
      expect(api.hostFrontend).toHaveBeenCalledTimes(1);
    });

    it('starts custom hosting', () => {
      const { wrapper } = setupShallow();
      wrapper.find('.project-view__button').at(1).simulate('click');
      expect(api.startFrontend).toHaveBeenCalledTimes(1);
    });

    it('fails to start', () => {
      const { wrapper } = setupShallow();
      const instance = wrapper.instance() as ProjectView;
      instance.props.rigProject.manifest.views = {};
      instance.props.rigProject.frontendCommand = '';
      wrapper.update();
      wrapper.find('.project-view__button').at(1).simulate('click');
      expect(instance.state.frontendResult).toEqual('Cannot determine front-end port from extension');
    });

    it('stops', () => {
      const { wrapper } = setupShallow();
      const instance = wrapper.instance() as ProjectView;
      instance.state.frontendResult = 'running';
      wrapper.find('.project-view__button').at(1).simulate('click');
      expect(api.stopHosting).toHaveBeenCalledTimes(1);
    });
  });

  describe('back-end', () => {
    it('starts', () => {
      const { wrapper } = setupShallow();
      wrapper.find('.project-view__button').at(2).simulate('click');
      expect(api.startBackend).toHaveBeenCalledTimes(1);
    });

    it('stops', () => {
      const { wrapper } = setupShallow();
      const instance = wrapper.instance() as ProjectView;
      instance.state.backendResult = 'running';
      wrapper.find('.project-view__button').at(2).simulate('click');
      expect(api.stopHosting).toHaveBeenCalledTimes(1);
    });
  });

  describe('view documentation', () => {
    it('opens window', () => {
      globalAny.open = jest.fn();
      const { wrapper } = setupShallow();
      wrapper.find('.project-view__button').last().simulate('click');
      expect(globalAny.open).toHaveBeenCalledWith('https://dev.twitch.tv/docs/extensions/', 'developer-rig-help');
    });
  });

  describe('view tutorial', () => {
    it('opens window', () => {
      globalAny.open = jest.fn();
      const { wrapper } = setupShallow();
      wrapper.find('.project-view__button').at(4).simulate('click');
      expect(globalAny.open).toHaveBeenCalledWith('https://www.twitch.tv/videos/239080621', 'developer-rig-help');
    });
  });
});
