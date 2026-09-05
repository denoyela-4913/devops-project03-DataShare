import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiCallout } from './ui-callout';

@Component({
  selector: 'app-ui-callout-host',
  imports: [UiCallout],
  template: '<app-ui-callout [type]="type()">{{ text }}</app-ui-callout>',
})
class UiCalloutHost {
  readonly type = signal<'info' | 'alert' | 'error'>('info');
  text = 'Message';
}

describe('UiCallout', () => {
  function createCallout() {
    TestBed.configureTestingModule({ imports: [UiCalloutHost] });
    const fixture = TestBed.createComponent(UiCalloutHost);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  it('applique la classe de variante par défaut (info) et projette le texte', () => {
    const { host } = createCallout();
    expect(host.querySelector('.ui-callout--info')).not.toBeNull();
    expect(host.querySelector('.ui-callout__label')?.textContent).toContain('Message');
  });

  it("change l'icône selon le type", () => {
    const { fixture, host } = createCallout();
    fixture.componentInstance.type.set('error');
    fixture.detectChanges();
    expect(host.querySelector('.ui-callout--error')).not.toBeNull();
    expect(host.querySelector('.ui-callout__icon')?.getAttribute('src')).toContain(
      'icon-alert-octagon',
    );
  });
});
