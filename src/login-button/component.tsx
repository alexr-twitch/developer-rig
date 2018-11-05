import * as React from 'react';
import './component.sass';

export class LoginButton extends React.Component<{}>{
  public render() {
    const rigAuthUrl = 'https://id.twitch.tv/oauth2/authorize?client_id=7db8cgf6p0b43n3yzwfu6i04hp8f4b&redirect_uri=http://localhost:3000&response_type=token&scope=user:edit+extensions:edit:catalog';
    return (
        <a href={rigAuthUrl}>
          <button className='login-button'>Sign In</button>
        </a>
    );
  }
}
