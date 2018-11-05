import * as React from 'react';
import * as classNames from 'classnames';
import { UserSession } from '../core/models/user-session';
import { fetchNewRelease } from '../util/api';
import * as reddot from '../img/reddot.svg';
import * as whitetriangle from '../img/whitetriangle.svg';
import './component.sass';
import { LocalStorageKeys } from '../constants/rig';

export interface PublicProps {
  session: UserSession;
}

export interface ReduxDispatchProps {
  logout: () => void;
}

interface State {
  open: boolean;
  showingNewRelease: boolean;
  releaseUrl?: string;
}

type Props = PublicProps & ReduxDispatchProps;
export class UserDropdownComponent extends React.Component<Props, State> {
  public state: State = {
    open: false,
    showingNewRelease: false,
  }

  private signOut = () => {
    localStorage.removeItem(LocalStorageKeys.RigLogin);
    this.props.logout();
  }

  private toggleDropdown = () => {
    this.setState({
      open: !this.state.open,
    })
  }

  public async componentDidMount() {
    if (process.env.GIT_RELEASE) {
      try {
        const result = await fetchNewRelease();
        if (result && result.tagName !== process.env.GIT_RELEASE) {
          this.setState({
            showingNewRelease: true,
            releaseUrl: result.zipUrl,
          });
        }
      } catch (ex) {
        console.log('Cannot fetch Developer Rig latest release from GitHub:', ex.message);
        this.setState({
          showingNewRelease: false,
          releaseUrl: '',
        });
      }
    }
  }

  public render() {
    if (!this.props.session) {
      return null;
    }
    const { login, profileImageUrl } = this.props.session;
    const usernameClasses = classNames({
      'user-dropdown__username': true,
      'open': this.state.open,
    });
    const dropdownClass = classNames({
      'user-dropdown__menu': true,
      'transition': true,
      'open': this.state.open,
    });
    const triangleClass = classNames({
      'user-dropdown__triangle': true,
      'open': this.state.open,
    });

    return (
      <div onClick={this.toggleDropdown} className='user-dropdown' tabIndex={0}>
        <div className='user-dropdown__name-container'>
          {this.state.showingNewRelease && (
            <img alt='!' title='Rig Update Available' src={reddot} width='8' height='8' />
          )}
          <img alt={login} className='user-dropdown__image' src={profileImageUrl} />
          <div className={usernameClasses}>{login}</div>
          <img src={whitetriangle} className={triangleClass} />
        </div>
        <div className={dropdownClass}>
          <ul>
            <li>
              <a target='_blank' href="https://dev.twitch.tv/dashboard/extensions">Extensions Dashboard</a>
            </li>
            <li>
              <a target='_blank' href="https://dev.twitch.tv/docs/extensions/">Documentation</a>
            </li>
            <li>
              <a href='mailto:developers@twitch.tv'>Give Feedback</a>
            </li>
            <li>
              <a target='_blank' href={this.state.releaseUrl}>
                {this.state.showingNewRelease ? 'Rig Update Available' : 'Rig Up To Date'}
                {this.state.showingNewRelease && (
                  <img alt='!' src={reddot} width='8' height='8' />
                )}
              </a>
            </li>
            <li><div className='user-dropdown__divider'></div></li>
            <li onClick={() => { this.signOut() }}>Sign Out</li>
          </ul>
        </div>
      </div>
    );
  }
}
