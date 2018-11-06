import * as React from 'react';
import './component.sass';

interface DivOptionProps {
  img: string;
  name: string;
  value: string;
  onChange: (event: React.FormEvent<HTMLInputElement>) => void;
  checked: boolean;
}
export class DivOption extends React.Component<DivOptionProps> {
  public render() {
    return (
      <div className="extension-container__block">
        <label className="extension-type-label">
          <input type="radio" name="extensionViewType" value={this.props.value} onChange={this.props.onChange} defaultChecked={this.props.checked}/>
          <div className="extension-type-box">
            <img
              className='extension-type-box__img'
              alt={this.props.value}
              src={this.props.img} />
          </div>
          <div className={this.props.checked ? 'extension-type-text dialog-selected': 'extension-type-text'}>{this.props.name}</div>
        </label>
      </div>
    );
  }
}
