import * as React from 'react';
import './component.sass';
import { RigNav } from '../rig-nav';
import { ExtensionViewContainer } from '../extension-view-container';
import { ExtensionViewDialogState } from '../extension-view-dialog';
import { EditViewProps } from '../edit-view-dialog';
import { ProductManagementViewContainer } from '../product-management-container';
import { fetchUserExtensionManifest } from '../util/extension';
import { fetchUser, stopHosting, fetchGlobalConfigurationSegment, fetchChannelConfigurationSegments, saveConfigurationSegment } from '../util/api';
import { NavItem } from '../constants/nav-items'
import { OverlaySizes } from '../constants/overlay-sizes';
import { IdentityOptions } from '../constants/identity-options';
import { MobileSizes } from '../constants/mobile';
import { ChannelSegments, Configurations, RigExtensionView, RigProject } from '../core/models/rig';
import { ExtensionManifest } from '../core/models/manifest';
import { UserSession } from '../core/models/user-session';
import { SignInDialog } from '../sign-in-dialog';
import { ExtensionMode, ExtensionViewType } from '../constants/extension-coordinator';
import { ProjectView } from '../project-view';
import { CreateProjectDialog } from '../create-project-dialog';
import { ConfigurationServiceView } from '../configuration-service-view';
import { fetchIdForUser } from '../util/id';
import { LocalStorageKeys } from '../constants/rig';
import { BrowserRouter, Route, Redirect } from 'react-router-dom';

export interface ReduxStateProps {
  session: UserSession;
}

export interface ReduxDispatchProps {
  saveManifest: (manifest: ExtensionManifest) => void;
  userLogin: (userSession: UserSession) => void;
}

interface State {
  projects: RigProject[],
  configurations?: Configurations;
  currentProject?: RigProject,
  showingCreateProjectDialog: boolean;
  selectedView?: NavItem;
  extensionsViewContainerKey: number;
  userId?: string;
  error?: string;
}

type Props = ReduxDispatchProps & ReduxStateProps;

export class RigComponent extends React.Component<Props, State> {
  public state: State = {
    projects: [],
    showingCreateProjectDialog: false,
    extensionsViewContainerKey: 0,
  }

  get currentProjectIndex() { return this.state.projects.indexOf(this.state.currentProject); }

  constructor(props: Props) {
    super(props);
    this.setLogin().then(this.loadProjects);
  }

  public getFrameSizeFromDialog(extensionViewDialogState: ExtensionViewDialogState) {
    const key = extensionViewDialogState.extensionViewType === ExtensionViewType.Mobile ? 'mobileFrameSize' : 'frameSize';
    if (extensionViewDialogState[key] === 'Custom') {
      return {
        width: extensionViewDialogState.width,
        height: extensionViewDialogState.height
      };
    }
    const sizes = extensionViewDialogState.extensionViewType === ExtensionViewType.Mobile ? MobileSizes : OverlaySizes;
    return sizes[extensionViewDialogState[key]];
  }

  public createExtensionView = async (extensionViewDialogState: ExtensionViewDialogState) => {
    let { channelId } = extensionViewDialogState;
    channelId = await fetchIdForUser(this.props.session.authToken, channelId);
    const extensionViews = this.state.currentProject.extensionViews || [];
    const mode = extensionViewDialogState.extensionViewType === ExtensionMode.Config ? ExtensionMode.Config :
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard ? ExtensionMode.Dashboard : ExtensionMode.Viewer;
    const linked = extensionViewDialogState.identityOption === IdentityOptions.Linked ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Config ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard;
    const linkedUserId = linked && extensionViewDialogState.linkedUserId ?
      await fetchIdForUser(this.props.session.authToken, extensionViewDialogState.linkedUserId) : '';
    const nextExtensionViewId = 1 + extensionViews.reduce((reduced: number, view: RigExtensionView) => {
      return Math.max(reduced, parseInt(view.id, 10));
    }, 0);
    extensionViews.push({
      id: nextExtensionViewId.toString(),
      channelId,
      type: extensionViewDialogState.extensionViewType,
      features: {
        isChatEnabled: extensionViewDialogState.isChatEnabled,
      },
      linked,
      linkedUserId,
      opaqueId: extensionViewDialogState.opaqueId,
      mode,
      isPopout: extensionViewDialogState.isPopout,
      role: extensionViewDialogState.viewerType,
      x: extensionViewDialogState.x,
      y: extensionViewDialogState.y,
      orientation: extensionViewDialogState.orientation,
      frameSize: this.getFrameSizeFromDialog(extensionViewDialogState),
    });
    this.updateExtensionViews(extensionViews);
    const { manifest, secret } = this.state.currentProject;
    await this.updateConfiguration(manifest, extensionViews, this.state.userId, secret);
  }

  public deleteExtensionView = (id: string) => {
    this.updateExtensionViews(this.state.currentProject.extensionViews.filter(element => element.id !== id));
  }

  public editView = (viewForEdit: RigExtensionView, newViewState: EditViewProps) => {
    viewForEdit.x = newViewState.x;
    viewForEdit.y = newViewState.y;
    viewForEdit.orientation = newViewState.orientation;
    this.updateExtensionViews(this.state.currentProject.extensionViews);
  }

  public createProject = async (project: RigProject) => {
    this.state.currentProject && await stopHosting();
    this.setState((previousState) => {
      const previousProjects = previousState.currentProject ? previousState.projects : [];
      localStorage.setItem(LocalStorageKeys.CurrentProjectIndex, previousProjects.length.toString());
      const projects = [...previousProjects, project];
      localStorage.setItem(LocalStorageKeys.Projects, JSON.stringify(projects));
      return { currentProject: project, projects, selectedView: NavItem.ProjectOverview, showingCreateProjectDialog: false };
    });
  }

  public updateProject = (project: RigProject) => {
    this.setState((previousState) => {
      const currentProject = Object.assign(previousState.currentProject, project);
      const projects = previousState.projects;
      localStorage.setItem(LocalStorageKeys.Projects, JSON.stringify(projects));
      return { currentProject, projects };
    });
  }

  public showCreateProjectDialog = () => {
    this.setState({ showingCreateProjectDialog: true });
  }

  public selectProject = async (projectIndex: number) => {
    const selectedProject = this.state.projects[projectIndex];
    if (selectedProject !== this.state.currentProject) {
      await stopHosting();
      this.setState({ configurations: null, currentProject: selectedProject, selectedView: NavItem.ProjectOverview });
      await this.updateConfiguration(selectedProject.manifest, selectedProject.extensionViews, this.state.userId, selectedProject.secret);
      this.refreshViews();
      localStorage.setItem(LocalStorageKeys.CurrentProjectIndex, this.currentProjectIndex.toString());
    }
  }

  public closeProjectDialog = () => {
    this.setState({ showingCreateProjectDialog: false });
  }

  public deleteProject = async () => {
    const message = `Are you sure you want to delete project "${this.state.currentProject.manifest.name}"?\n\n` +
      'This will not delete any files or affect your extension online.';
    if (confirm(message)) {
      await stopHosting();
      this.setState((previousState) => {
        const projects = previousState.projects.filter((project) => project !== previousState.currentProject);
        const currentProject = projects.length ? projects[0] : null;
        localStorage.setItem(LocalStorageKeys.CurrentProjectIndex, '0');
        localStorage.setItem(LocalStorageKeys.Projects, JSON.stringify(projects));
        return {
          currentProject, projects,
          extensionsViewContainerKey: previousState.extensionsViewContainerKey + 1,
          selectedView: NavItem.ProjectOverview,
        };
      });
    }
  }

  public render() {
    const { configurations, currentProject } = this.state;
    return (
      <div className="rig-container">
        {this.state.error ? (
          <label>Something went wrong: {this.state.error}</label>
        ) : !this.props.session ? (
          <SignInDialog />
        ) : !currentProject ? (
          <CreateProjectDialog userId={this.state.userId} saveHandler={this.createProject} />
        ) : (
          <BrowserRouter><div>
            {this.needsRedirect() && <Redirect to={this.state.selectedView} push />}
            <Route path="/" render={({ location }) => <RigNav {...location}
              currentProjectIndex={this.currentProjectIndex}
              projects={this.state.projects}
              createNewProject={this.showCreateProjectDialog}
              selectProject={this.selectProject}
              manifest={currentProject.manifest}
              deleteProject={this.deleteProject}
            />} />
            <Route exact path={NavItem.ProductManagement} render={() => (
              this.props.session && this.props.session.login && currentProject.manifest && currentProject.manifest.bitsEnabled ?
                <ProductManagementViewContainer clientId={currentProject.manifest.id} /> :
                <Redirect to={NavItem.ProjectOverview} />
            )} />
            <Route exact path={NavItem.ProjectOverview} render={() => <ProjectView
              key={`ProjectView${this.currentProjectIndex}`}
              rigProject={currentProject}
              userId={this.state.userId}
              onChange={this.updateProject}
              refreshViews={this.refreshViews}
            />} />
            {configurations && <Route exact path={NavItem.ConfigurationService} render={() => <ConfigurationServiceView
              authToken={this.props.session.authToken}
              configurations={configurations}
              rigProject={currentProject}
              userId={this.state.userId}
              saveHandler={this.saveConfiguration}
            />} />}
            {configurations && <Route path="/" render={({ location }) => <ExtensionViewContainer
              key={`ExtensionViewContainer${this.state.extensionsViewContainerKey}`}
              configurations={configurations}
              isDisplayed={location.pathname === NavItem.ExtensionViews}
              deleteExtensionViewHandler={this.deleteExtensionView}
              extensionViews={currentProject.extensionViews}
              manifest={currentProject.manifest}
              secret={currentProject.secret}
              editViewHandler={this.editView}
              createExtensionViewHandler={this.createExtensionView}
            />} />}
            {this.state.showingCreateProjectDialog && <CreateProjectDialog
              userId={this.state.userId}
              closeHandler={this.closeProjectDialog}
              saveHandler={this.createProject}
            />}
          </div></BrowserRouter>
        )}
      </div>
    );
  }

  private needsRedirect = (): boolean => {
    if (this.state.selectedView) {
      setTimeout(() => this.setState({ selectedView: null }));
      return true;
    }
    return false;
  }

  private saveConfiguration = (segment: string, channelId: string, content: string, version: string) => {
    const { manifest: { id: clientId }, secret } = this.state.currentProject;
    saveConfigurationSegment(clientId, this.state.userId, secret, segment, channelId, content, version);
  }

  private refreshViews = () => {
    this.setState((previousState) => ({ extensionsViewContainerKey: previousState.extensionsViewContainerKey + 1 }));
  }

  public updateExtensionViews(extensionViews: RigExtensionView[]) {
    this.updateProject({ extensionViews } as RigProject);
  }

  private loadProjects = async () => {
    const projectsValue = localStorage.getItem(LocalStorageKeys.Projects);
    const { userId } = this.state;
    if (projectsValue) {
      const projects = JSON.parse(projectsValue) as RigProject[];
      const currentProject = projects[Number(localStorage.getItem(LocalStorageKeys.CurrentProjectIndex) || 0)];
      this.setState({ currentProject, projects });
      const { manifest, extensionViews, secret } = currentProject;
      await this.updateConfiguration(manifest, extensionViews, this.state.userId, secret);
    } else if (process.env.EXT_CLIENT_ID && process.env.EXT_SECRET && process.env.EXT_VERSION) {
      const serializedExtensionViews = localStorage.getItem(LocalStorageKeys.ExtensionViews);
      const currentProject: RigProject = {
        extensionViews: serializedExtensionViews ? JSON.parse(serializedExtensionViews) : [],
        projectFolderPath: '',
        manifest: { id: process.env.EXT_CLIENT_ID, version: process.env.EXT_VERSION } as ExtensionManifest,
        secret: process.env.EXT_SECRET,
        frontendFolderName: '',
        frontendCommand: '',
        backendCommand: '',
      };
      const projects = [currentProject];
      this.setState({ currentProject, projects });
      localStorage.setItem(LocalStorageKeys.Projects, JSON.stringify(projects));
      localStorage.setItem(LocalStorageKeys.CurrentProjectIndex, '0');
      const { secret, manifest: { id: clientId, version } } = currentProject;
      try {
        const manifest = await fetchUserExtensionManifest(userId, secret, clientId, version);
        this.setState((previousState) => {
          Object.assign(previousState.currentProject, { manifest });
          localStorage.setItem(LocalStorageKeys.Projects, JSON.stringify([previousState.currentProject]));
          return previousState;
        });
      } catch (ex) {
        console.error(ex.message);
      }
    }
  }

  private async updateConfiguration(manifest: ExtensionManifest, extensionViews: RigExtensionView[], userId: string, secret: string) {
    if (manifest.configurationLocation === 'hosted') {
      const { id: clientId } = manifest;
      try {
        const channelIds = extensionViews ?
          Array.from(new Set<string>(extensionViews.map((view) => view.channelId))) : [];
        const channelSegmentMaps = await Promise.all(channelIds.map((channelId) => (
          fetchChannelConfigurationSegments(clientId, userId, channelId, secret).then((segmentMap) => ({ channelId, segmentMap }))
        )));
        const configurations = {
          globalSegment: await fetchGlobalConfigurationSegment(clientId, userId, secret),
          channelSegments: channelSegmentMaps.reduce((segments, channelSegmentMap) => {
            segments[channelSegmentMap.channelId] = channelSegmentMap.segmentMap;
            return segments;
          }, {} as ChannelSegments),
        };
        this.setState({ configurations });
      } catch (ex) {
        console.error(`Cannot load configuration for client ID "${clientId}": ${ex.message}`);
      }
    } else {
      this.setState({ configurations: { globalSegment: null, channelSegments: {} } });
    }
  }

  private async setLogin() {
    const windowHash = window.location.hash;
    if (windowHash.includes('access_token')) {
      const accessTokenKey = 'access_token=';
      const accessTokenIndex = windowHash.indexOf(accessTokenKey);
      const ampersandIndex = windowHash.indexOf('&');
      const accessToken = windowHash.substring(accessTokenIndex + accessTokenKey.length, ampersandIndex);

      try {
        const response = await fetchUser(accessToken);
        const userSession = {
          authToken: accessToken,
          displayName: response.display_name,
          id: response.id,
          login: response.login,
          profileImageUrl: response.profile_image_url || 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png',
        };

        this.props.userLogin(userSession);
        localStorage.setItem(LocalStorageKeys.RigLogin, JSON.stringify(userSession));
        window.location.replace('/');
      } catch (ex) {
        this.setState({ error: ex.message });
      }
    } else {
      const rigLogin = localStorage.getItem(LocalStorageKeys.RigLogin);
      if (rigLogin) {
        try {
          const userSession = JSON.parse(rigLogin) as UserSession;
          if (userSession && userSession.authToken && userSession.id && userSession.login && userSession.profileImageUrl) {
            this.props.userLogin(userSession);
            this.state.userId = userSession.id;
          } else {
            localStorage.removeItem(LocalStorageKeys.RigLogin);
          }
        } catch (ex) {
          localStorage.removeItem(LocalStorageKeys.RigLogin);
        }
      }
    }
  }
}
