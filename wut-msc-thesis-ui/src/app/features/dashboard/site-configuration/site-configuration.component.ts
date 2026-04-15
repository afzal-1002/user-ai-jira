import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-configuration',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-configuration.component.html',
  styleUrl: './site-configuration.component.css'
})
export class SiteConfigurationComponent {}
