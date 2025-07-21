import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app/app-routing.module';
import { provideAnimations } from '@angular/platform-browser/animations'; // Falls Animationen genutzt werden
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthInterceptor } from './app/core/interceptors/auth.interceptor';
// src/main.ts
// @ts-expect-error: Typen nicht auflösbar bei swiper v9
import { register } from 'swiper/element/bundle';
register();

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAnimations(), // Optional, falls du Material nutzt
    importProvidersFrom(ReactiveFormsModule, FormsModule), // Für FormBuilder
  ],
})
.catch(err => console.error(err));