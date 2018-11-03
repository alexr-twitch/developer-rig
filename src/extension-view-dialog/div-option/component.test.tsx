import { setupShallowTest } from '../../tests/enzyme-util/shallow';
import { DivOption } from './component';

describe('<DivOption />', () => {
  const setupShallow = setupShallowTest(DivOption, () => ({
    img: 'test.png',
    name: 'test',
    value: 'test',
    onChange: jest.fn(),
    checked: false,
  }));

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('correctly renders selected styles when checked', () => {
    const { wrapper } = setupShallow({
      checked: true,
    });
    expect(wrapper.find('.div-option__text--selected').length).toBe(1);
  })
});
