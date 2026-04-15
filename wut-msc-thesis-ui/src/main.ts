import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config'; // should export providers and routing
import { AppComponent } from './app/app.component'; // root component

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
