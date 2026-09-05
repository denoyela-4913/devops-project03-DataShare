import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UiHeader } from './ui-header';

@Component({
  selector: 'app-ui-header-host',
  imports: [UiHeader],
  template: `
    <app-ui-header>
      <span uiHeaderLogo>DataShare</span>
      <a uiHeaderAction href="/login">Se connecter</a>
    </app-ui-header>
  `,
})
class UiHeaderHost {}

describe('UiHeader', () => {
  it('projette le logo et l’action dans les emplacements dédiés', () => {
    TestBed.configureTestingModule({ imports: [UiHeaderHost] });
    const fixture = TestBed.createComponent(UiHeaderHost);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[uiHeaderLogo]')?.textContent).toContain('DataShare');
    expect(host.querySelector('[uiHeaderAction]')?.textContent).toContain('Se connecter');
  });
});
