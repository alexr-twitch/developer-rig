import * as React from 'react';
import './component.sass';
import classNames = require('classnames');

interface DivOptionProps {
  img: string;
  name: string;
  value: string;
  onChange: (event: React.FormEvent<HTMLInputElement>) => void;
  checked: boolean;
}
export class DivOption extends React.Component<DivOptionProps> {
  public render() {
    const boxClassName = classNames('div-option__box', {
      'div-option__box--selected': this.props.checked,
    });
    const textClassName = classNames('div-option__text', {
      'div-option__text--selected': this.props.checked,
    });
    return (
      <div className="div-option">
        <label className="div-option__label">
          <input type="radio" className="div-option__input" name="extensionViewType" value={this.props.value} onChange={this.props.onChange} defaultChecked={this.props.checked} />
          <span className={boxClassName}>
            <img
              className='div-option__image'
              alt={this.props.value}
              src={this.props.img} />
          </span>
          <span className={textClassName}>{this.props.name}</span>
        </label>
      </div>
    );
  }
}
