import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { INITIAL_CONFIG, platformServer } from '@angular/platform-server';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = (context?: BootstrapContext) =>
	bootstrapApplication(
		AppComponent,
		config,
		context ?? {
			platformRef: platformServer([
				{
					provide: INITIAL_CONFIG,
					useValue: {
						document: '<app-root></app-root>',
						url: 'http://localhost/',
					},
				},
			]),
		},
	);

export default bootstrap;
