import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('does not include a Portfolios navigation item', () => {
    const component = new AppComponent();

    const allItemLabels = component.navGroups.flatMap((g) => g.items.map((i) => i.label));
    expect(allItemLabels).not.toContain('Portfolios');
  });
});
