import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorToast } from './shared/components/error-toast/error-toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ErrorToast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
