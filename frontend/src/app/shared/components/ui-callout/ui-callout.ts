import { Component, computed, input } from '@angular/core';

export type UiCalloutType = 'info' | 'alert' | 'error';

const ICONS: Record<UiCalloutType, string> = {
  info: 'assets/icons/icon-info.svg',
  alert: 'assets/icons/icon-alert-triangle.svg',
  error: 'assets/icons/icon-alert-octagon.svg',
};

/** Bandeau inline Info / Alert / Error. Frame Figma : Callout Component 56:1078. */
@Component({
  selector: 'app-ui-callout',
  templateUrl: './ui-callout.html',
  styleUrl: './ui-callout.scss',
})
export class UiCallout {
  readonly type = input<UiCalloutType>('info');
  readonly iconSrc = computed(() => ICONS[this.type()]);
}
